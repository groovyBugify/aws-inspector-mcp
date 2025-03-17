import { Express } from 'express';
import { inspectorRoutes } from './inspector.routes';

export const setupRoutes = (app: Express) => {
  app.use('/api/inspector', inspectorRoutes);
};