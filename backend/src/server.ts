import app from './app';
import env from './config/env';
import logger from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${env.PORT}`);
  logger.info(`⚡️[server]: Active AI Provider: ${env.AI_PROVIDER.toUpperCase()}`);
  if (env.AI_PROVIDER === 'gemini') {
    const keyInfo = env.GEMINI_API_KEY ? `${env.GEMINI_API_KEY.substring(0, 6)}...${env.GEMINI_API_KEY.substring(env.GEMINI_API_KEY.length - 4)} (length: ${env.GEMINI_API_KEY.length})` : 'undefined';
    logger.info(`⚡️[server]: Loaded GEMINI_API_KEY: ${keyInfo}`);
  } else if (env.AI_PROVIDER === 'groq') {
    const keyInfo = env.GROQ_API_KEY ? `${env.GROQ_API_KEY.substring(0, 6)}...${env.GROQ_API_KEY.substring(env.GROQ_API_KEY.length - 4)} (length: ${env.GROQ_API_KEY.length})` : 'undefined';
    logger.info(`⚡️[server]: Loaded GROQ_API_KEY: ${keyInfo}`);
  } else {
    logger.info(`⚡️[server]: Running offline in LOCAL heuristic mapping mode`);
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
