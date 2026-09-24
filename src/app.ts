import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import routes from './routes';
import { logger } from './utils/logger';
import path from "path";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));
  app.use("/uploads",express.static(path.join(process.cwd(), "uploads")));
  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}