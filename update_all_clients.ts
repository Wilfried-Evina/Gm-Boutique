import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Client } from './packages/api/src/models/Client';

dotenv.config({ path: './packages/api/.env' });

async function updateAllClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    const result = await Client.updateMany(
      { $or: [{ isDigitalized: false }, { isDigitalized: { $exists: false } }] },
      { $set: { isDigitalized: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} clients. isDigitalized is now true for everyone.`);
  } catch (error) {
    console.error('Error updating clients:', error);
  } finally {
    process.exit(0);
  }
}

updateAllClients();
