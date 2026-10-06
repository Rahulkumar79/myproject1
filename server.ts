import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { createExpressApp } from './server/src/app.ts';
import { connectDB, disconnectDB } from './server/src/config/db.ts';
import { ensureSeeded } from './server/src/seed/seed.ts';
import { env } from './server/src/config/env.ts';

async function bootstrap() {
  const dbStatus = await connectDB();
  await ensureSeeded();

  const app = createExpressApp();
  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

  let vite: ViteDevServer | null = null;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '1d',
      })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = env.PORT || 3000;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(
      `🚀 Lumina Scholar Full-Stack Server running at http://0.0.0.0:${port} [env: ${env.NODE_ENV}, db: ${dbStatus.mode}]`
    );
  });

  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 [${signal}] Received shutdown signal. Closing HTTP server and database connections...`);

    const forceTimer = setTimeout(() => {
      console.error('⚠️ Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
    forceTimer.unref();

    try {
      if (typeof (server as any).closeIdleConnections === 'function') {
        (server as any).closeIdleConnections();
      }
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      if (vite) {
        await vite.close();
      }
      await disconnectDB();
      console.log('✅ Graceful shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : 'Startup error');
  process.exit(1);
});
