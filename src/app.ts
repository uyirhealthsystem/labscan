import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import routes from './routes';
import { logger } from './utils/logger';
import path from "path";
import { userAuth } from "./middlewares/userauth";
import { razorpayWebhookController } from "./controllers/patient.controller";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(pinoHttp({ logger }));

  app.post(
    "/api/v1/labscan/webhooks/razorpay",
    express.raw({ type: "application/json" }),
    razorpayWebhookController,
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Liveness check for PM2 / load balancers / k8s probes.
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use("/uploads",express.static(path.join(process.cwd(), "uploads")));
  // Namespaced so the api-gateway can route every labscan path by one prefix.
  app.use('/api/v1/labscan', userAuth, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}