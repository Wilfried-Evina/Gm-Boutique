/**
 * Script de migration des barcodes
 * ---------------------------------
 * Réassigne un barcode numérique séquentiel (0000001, 0000002, ...)
 * à tous les articles dont le barcode est dans l'ancien format GM-XXXXXXXX ou GMXXXXXXXX.
 *
 * Usage : npx ts-node src/scripts/migrate_barcodes.ts
 */

import mongoose from 'mongoose';
import { Article } from '../models/Article';
import { Counter } from '../models/Counter';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

async function migrateBarcodes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI manquant dans .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connecté à MongoDB');

  // Trouve tous les articles avec l'ancien format (commence par GM avec ou sans tiret)
  const oldArticles = await Article.find({
    barcode: { $regex: /^GM-?[0-9A-Fa-f]+$/ }
  }).sort({ createdAt: 1 }); // les plus anciens en premier

  console.log(`\n📦 ${oldArticles.length} article(s) à migrer`);

  if (oldArticles.length === 0) {
    console.log('✅ Aucun article à migrer.');
    await mongoose.disconnect();
    return;
  }

  let migrated = 0;
  let errors = 0;

  for (const article of oldArticles) {
    const oldBarcode = article.barcode;

    try {
      // Récupère le prochain numéro séquentiel
      const counter = await Counter.findByIdAndUpdate(
        'barcode',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const newBarcode = String(counter.seq).padStart(7, '0');

      // Met à jour l'article
      article.barcode = newBarcode;
      await article.save();

      console.log(`  ✅ ${oldBarcode} → ${newBarcode}`);
      migrated++;
    } catch (err: any) {
      console.error(`  ❌ Erreur pour ${oldBarcode} : ${err.message}`);
      errors++;
    }
  }

  console.log(`\n🎉 Migration terminée : ${migrated} migrés, ${errors} erreur(s)`);
  await mongoose.disconnect();
}

migrateBarcodes().catch((err) => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
