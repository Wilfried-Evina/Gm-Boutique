import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Client } from './packages/api/src/models/Client';

dotenv.config({ path: './packages/api/.env' });

async function updateClients() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const result = await Client.updateMany(
    { $or: [{ cguAccepted: false }, { cguAccepted: { $exists: false } }] },
    { $set: { cguAccepted: true, cguAcceptedAt: new Date() } }
  );
  console.log('Updated clients:', result.modifiedCount);
  process.exit(0);
}

updateClients().catch(console.error);
