import express from 'express';
import cors from 'cors';
import env from './config/env';
import requestLogger from './middleware/requestLogger';
import errorHandler from './middleware/errorHandler';
import healthRoute from './routes/health.route';
import uploadRoute from './routes/upload.route';

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/health', healthRoute);
app.use('/upload', uploadRoute);

// Global Error Handler
app.use(errorHandler);

export default app;
