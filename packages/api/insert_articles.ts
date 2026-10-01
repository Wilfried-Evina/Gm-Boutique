import mongoose from 'mongoose';
import { Article } from './src/models/Article';
import { Client } from './src/models/Client';
import dotenv from 'dotenv';

dotenv.config();

const articlesToInsert = [
  { barcode: '0000074', brand: 'Dior', type: 'PORTE FEUILLE', color: 'noir', clientPrice: 50, publicPrice: 50 },
  { barcode: '0000073', brand: 'Cartier', type: 'porte carte-billets', color: 'noir', clientPrice: 50, publicPrice: 50 },
  { barcode: '0000072', brand: 'cartier', type: 'portefeuille', color: 'beige', clientPrice: 50, publicPrice: 50 },
  { barcode: '0000071', brand: 'Gucci', type: 'PORTE FEUILLE', color: 'Belge', clientPrice: 120, publicPrice: 120 },
  { barcode: '0000070', brand: 'Louis Vuitton', type: 'Sac dammier', color: 'Brun', clientPrice: 200, publicPrice: 200 },
  { barcode: '0000069', brand: 'Louis Vuitton', type: 'Sac B.B ALNA', color: 'Noir', clientPrice: 400, publicPrice: 400 },
  { barcode: '0000068', brand: 'Louis Vuitton', type: 'Sac B.B ALNA', color: 'belge', clientPrice: 400, publicPrice: 400 },
  { barcode: '0000066', brand: 'Chanel', type: 'Porte bijoux', color: 'Nuit', clientPrice: 120, publicPrice: 120 },
  { barcode: '0000065', brand: 'Louis Vuitton', type: 'mini speedy', color: 'monogramme', clientPrice: 250, publicPrice: 250 },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    const client = await Client.findOne({ referenceNumber: 'GM-2026-0018' });
    if (!client) {
      console.log('Client GM-2026-0018 not found!');
      process.exit(1);
    }
    
    console.log('Found client:', client.firstName, client.lastName);
    
    const depositDate = new Date('2026-04-16T12:00:00Z');

    for (const item of articlesToInsert) {
      const existing = await Article.findOne({ barcode: item.barcode });
      if (existing) {
        console.log(`Article ${item.barcode} already exists, updating...`);
        await Article.updateOne({ barcode: item.barcode }, {
          clientId: client._id,
          brand: item.brand,
          type: item.type,
          color: item.color,
          clientPrice: item.clientPrice,
          publicPrice: item.publicPrice,
          status: 'on_sale',
          createdAt: depositDate
        });
      } else {
        console.log(`Inserting article ${item.barcode}...`);
        await Article.create({
          clientId: client._id,
          barcode: item.barcode,
          brand: item.brand,
          type: item.type,
          color: item.color,
          clientPrice: item.clientPrice,
          publicPrice: item.publicPrice,
          status: 'on_sale',
          createdAt: depositDate
        });
      }
    }
    
    console.log('All done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
