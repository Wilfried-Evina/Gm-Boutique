import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectDB = async (): Promise<boolean> => {
  try {
    let uri = env.MONGODB_URI;
    let isMemory = false;

    // Si l'URI contient les placeholders par défaut, on utilise une base en mémoire
    if (uri.includes('<username>:<password>')) {
      logger.info('⚠️ URI MongoDB par défaut détecté. Démarrage de MongoDB en mémoire pour le développement...');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      isMemory = true;
    }

    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    return isMemory;
  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
