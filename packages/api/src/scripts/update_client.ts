import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { Receipt } from '../models/Receipt';

config({ path: path.resolve(__dirname, '../../.env') });

async function deleteReceipt() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI manquant dans .env');
      process.exit(1);
    }
    await mongoose.connect(uri);

    const receipt = await Receipt.findOne({ referenceNumber: 'DEP-100D5E' });
    if (!receipt) {
      console.log('Receipt DEP-100D5E non trouvé');
    } else {
      await Receipt.deleteOne({ _id: receipt._id });
      console.log('Bon de dépôt DEP-100D5E supprimé avec succès.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deleteReceipt();
