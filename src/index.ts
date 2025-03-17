import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { setupRoutes } from './routes';
import { logger } from './utils/logger';

config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

setupRoutes(app);

app.listen(port, () => {
  logger.info(`AWS Inspector MCP server listening on port ${port}`);
});