import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import healthRoutes from './modules/health/health.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import { setupSwagger } from './docs/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for easy Swagger UI and WebView loading
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Cross-Origin Resource Sharing (CORS)
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? '*' : config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Rate Limiting (Protects from brute force & DDoS)
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP address, please try again later.',
      },
    },
    skip: () => config.isTest, // Disable in test environment
  });
  app.use('/api/', limiter);

  // 4. Request Body Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Request Logging via Morgan (skip in test mode to avoid test log clutter)
  if (!config.isTest) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  // 6. Swagger / OpenAPI Documentation
  setupSwagger(app);

  // 7. Base Information Route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Production Full-Stack Shared API',
      status: 'active',
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/api/health',
      profileEndpoint: '/api/v1/profile/me',
      author: 'Vargav Mishra',
    });
  });

  // 8. Application Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/v1/profile', profileRoutes);

  // 9. Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
