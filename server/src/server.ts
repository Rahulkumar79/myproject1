import { createExpressApp } from './app.ts';
import { connectDB, disconnectDB } from './config/db.ts';
import { ensureSeeded } from './seed/seed.ts';
import { env } from './config/env.ts';

async function startStandaloneServer() {
  const dbStatus = await connectDB();
  await ensureSeeded();
  const app = createExpressApp();

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Lumina Scholar API Server running on port ${env.PORT} [env: ${env.NODE_ENV}, db: ${dbStatus.mode}]`);
  });

  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 [${signal}] Closing standalone API server...`);
    const forceTimer = setTimeout(() => process.exit(1), 10000);
    forceTimer.unref();

    if (typeof (server as any).closeIdleConnections === 'function') {
      (server as any).closeIdleConnections();
    }
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startStandaloneServer().catch((err) => {
  console.error('Failed to start standalone API server:', err instanceof Error ? err.message : 'Startup error');
  process.exit(1);
});
