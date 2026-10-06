import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index.ts';
import { errorHandler } from './middleware/error.ts';
import { securitySanitizer } from './validators/schemas.ts';
import { env } from './config/env.ts';

export function createExpressApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers configured for iframe/preview compatibility
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );

  // CORS configuration supporting configured CLIENT_URL(s) and local development
  const configuredOrigins = env.CLIENT_URL
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, 'http://localhost:3000', 'http://localhost:5173'])
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || configuredOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // Safe production request logging (never logs headers, tokens, passwords, or request bodies)
  app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (process.env.NODE_ENV !== 'test') {
        const duration = Date.now() - start;
        if (res.statusCode >= 400 || process.env.LOG_REQUESTS === 'true') {
          console.log(`[API] ${req.method} ${req.originalUrl.split('?')[0]} -> ${res.statusCode} (${duration}ms)`);
        }
      }
    });
    next();
  });

  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again in a few minutes.',
    },
  });

  // Stricter rate limiter for authentication routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
    },
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Sanitize payloads against NoSQL injection & XSS
  app.use(securitySanitizer);

  // Mount REST API routes
  app.use('/api', apiRouter);

  // Catch-all for unknown /api routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Requested API endpoint does not exist.',
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
