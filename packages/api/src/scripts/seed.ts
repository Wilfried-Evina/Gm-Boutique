import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { connectDB } from '../config/db';
import { logger } from '../utils/logger';

// Charger les variables d'environnement depuis la racine du monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const seedDB = async () => {
  try {
    await connectDB();
    
    // 1. Création du compte Gérante (si inexistant)
    const adminEmail = 'gerante@gm-boutique.ch';
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (!adminExists) {
      await User.create({
        email: adminEmail,
        password: 'Password123!', // Mot de passe provisoire à changer
        role: 'admin',
        firstName: 'Edima',
        lastName: 'Evina'
      });
      logger.info('✅ Compte Gérante créé avec succès.');
    } else {
      logger.info('ℹ️ Le compte Gérante existe déjà.');
    }

    // 2. Création du compte Mari (si inexistant)
    const mariEmail = 'arthur@gm-boutique.ch';
    const mariExists = await User.findOne({ email: mariEmail });
    
    if (!mariExists) {
      await User.create({
        email: mariEmail,
        password: 'Password123!', // Mot de passe provisoire à changer
        role: 'admin',
        firstName: 'Arthur',
        lastName: 'Nguekeu'
      });
      logger.info('✅ Compte Arthur (Mari) créé avec succès.');
    } else {
      logger.info('ℹ️ Le compte Arthur existe déjà.');
    }

    await mongoose.connection.close();
    logger.info('🚀 Seeding terminé avec succès.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors du seeding', error);
    process.exit(1);
  }
};

seedDB();
