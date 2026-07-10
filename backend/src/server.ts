import app from './app';
import env from './config/env';
import logger from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${env.PORT}`);
  const keyInfo = env.GEMINI_API_KEY ? `${env.GEMINI_API_KEY.substring(0, 6)}...${env.GEMINI_API_KEY.substring(env.GEMINI_API_KEY.length - 4)} (length: ${env.GEMINI_API_KEY.length})` : 'undefined';
  logger.info(`⚡️[server]: Loaded GEMINI_API_KEY: ${keyInfo}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
