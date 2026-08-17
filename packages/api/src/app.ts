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
import saleRoutes from './routes/sale.routes';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { startCronJobs } from './services/cron.service';

import { User } from './models/User';

// Connect to Database and seed
connectDB().then(async () => {
  const exists = await User.findOne({ email: 'gerante@gm-boutique.ch' });
  if (!exists) {
    await User.create({
      email: 'gerante@gm-boutique.ch',
      passwordHash: 'Password123!',
      role: 'admin',
      firstName: 'Edima',
      lastName: 'Evina'
    });
    logger.info('✅ Compte administrateur temporaire créé (gerante@gm-boutique.ch / Password123!)');
  }
});

// Start Background Jobs
startCronJobs();

const app = express();

// Forcer HTTPS en production
if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Middlewares - Sécurité globale
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser localhost ET les IP du réseau local (192.168.x.x, 10.x.x.x)
    const allowed = !origin
      || origin.includes('localhost')
      || origin.includes('127.0.0.1')
      || /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
    callback(null, allowed ? origin : false);
  },
  credentials: true
}));

// Validation du Content-Type
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-type'] !== 'application/json') {
    return res.status(415).json({ message: 'Unsupported Media Type: Only application/json is allowed' });
  }
  next();
});

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

import signatureRoutes from './routes/signature.routes';
import retrocessionRoutes from './routes/retrocession.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import documentRoutes from './routes/document.routes';
import receiptRoutes from './routes/receipt.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/retrocessions', retrocessionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir les documents uploadés
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Retourne l'IP réseau locale pour que le QR code pointe vers la bonne adresse
app.get('/api/network-info', (req, res) => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
        break;
      }
    }
    if (ip !== 'localhost') break;
  }
  res.json({ ip });
});

// Error Handler Middleware
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
