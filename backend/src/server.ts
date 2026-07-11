import app from './app';
import env from './config/env';
import logger from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${env.PORT}`);
  logger.info(`⚡️[server]: AI Provider: Groq (Llama 3.3 70B)`);
  const keyInfo = `${env.GROQ_API_KEY.substring(0, 6)}...${env.GROQ_API_KEY.substring(env.GROQ_API_KEY.length - 4)} (length: ${env.GROQ_API_KEY.length})`;
  logger.info(`⚡️[server]: Loaded GROQ_API_KEY: ${keyInfo}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
