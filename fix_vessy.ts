import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Client } from './packages/api/src/models/Client';

dotenv.config({ path: './packages/api/.env' });

async function fixClient() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const client = await Client.findOne({ firstName: { $regex: /vessy/i }, lastName: { $regex: /stankov/i } });
  if (client) {
    console.log('Found client:', client.firstName, client.lastName, '- isDigitalized:', client.isDigitalized);
    client.isDigitalized = true;
    await client.save();
    console.log('Updated client isDigitalized to true!');
  } else {
    console.log('Client Vessy Stankov not found.');
  }
  process.exit(0);
}

fixClient().catch(console.error);
