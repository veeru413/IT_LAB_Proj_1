import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Builds the Express application.
 *
 * Exported as a factory (rather than a started server) so the integration
 * tests can mount it with supertest without binding a TCP port.
 */
export const createApp = (): Express => {
  const app = express();

  // Trust the first proxy hop so rate limiting sees real client IPs.
  app.set('trust proxy', 1);

  // Sensible security headers (CSP, X-Frame-Options, nosniff, ...).
  app.use(helmet());

  // Only the configured client origin(s) may call the API from a browser.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin / curl / server-to-server requests have no Origin header.
        if (!origin || env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // A 100kb JSON cap keeps oversized payloads from reaching the handlers.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  app.use('/api', routes);

  // Unmatched route -> 404, then the central error handler formats everything.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
