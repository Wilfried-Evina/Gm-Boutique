import mongoose from 'mongoose';
import { Receipt } from '../models/Receipt';

async function deleteReceipt() {
  try {
    const uri = 'mongodb+srv://gestion_db_user:3vxQ7woiDKsmJJ8Y@gmboutique.gqxa92r.mongodb.net/gmboutique?retryWrites=true&w=majority';
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
