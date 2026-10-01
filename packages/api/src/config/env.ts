import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to load .env from current working directory first (production/Infomaniak), fallback to monorepo root (dev)
const prodEnvPath = path.resolve(process.cwd(), '.env');
const devEnvPath = path.resolve(__dirname, '../../../../.env');

if (fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath });
} else {
  dotenv.config({ path: devEnvPath });
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/gmboutique?authSource=admin',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  SMTP_HOST: process.env.SMTP_HOST || 'mail.infomaniak.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  SMTP_USER: process.env.SMTP_USER || 'gmboutique@gestion-gmboutique.ch',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'GMBoutique <gmboutique@gestion-gmboutique.ch>',
  FRONTEND_URL: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://gestion-gmboutique.ch' : 'http://localhost:5173'),
};

