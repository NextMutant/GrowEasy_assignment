import app from './app';
import env from './config/env';
import logger from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${env.PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
