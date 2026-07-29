import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { clientRoutes } from './routes/client.routes';
import { articleRoutes } from './routes/article.routes';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { startCronJobs } from './services/cron.service';

// Connect to Database
connectDB();

// Start Background Jobs
startCronJobs();

const app = express();

// Middlewares - Sécurité globale
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Limiter les requêtes répétées pour l'API entière (100 req par 15min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' })); // Limite augmentée pour accepter les images base64 (signatures)
app.use(express.urlencoded({ extended: true }));

// Prévenir les injections NoSQL
app.use(mongoSanitize());

// Prévenir la pollution des paramètres HTTP
app.use(hpp());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/articles', articleRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Error Handler Middleware
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
