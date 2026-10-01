/**
 * Script de nettoyage en cascade d'un client de test
 * =====================================================
 * Supprime proprement un client et TOUTES ses données associées :
 *   Articles → Sales (si l'article y est lié) → Receipts → Documents → Client
 *
 * ⚠️  NE TOUCHE PAS aux counters (barcode, client_YYYY, sale_YYYYMMDD).
 *     Le compteur de codes-barres continue sa séquence sans interruption.
 *
 * Usage (simulation – sans rien supprimer) :
 *   npx tsx src/scripts/reset_test_client.ts --ref GM-2026-0006
 *
 * Usage (suppression réelle) :
 *   npx tsx src/scripts/reset_test_client.ts --ref GM-2026-0006 --confirm
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

// ── Modèles ──────────────────────────────────────────────────────────────────
import { Client } from '../models/Client';
import { Article } from '../models/Article';
import { Sale } from '../models/Sale';
import { Receipt } from '../models/Receipt';
import { DocumentModel } from '../models/Document';
// SignatureSession n'a pas de lien clientId et s'autodétruit au bout de 15 min.
// On ne la touche pas intentionnellement.

// ── Arguments ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const refIndex = args.indexOf('--ref');
const clientRef = refIndex !== -1 ? args[refIndex + 1] : null;
const isDryRun = !args.includes('--confirm');

if (!clientRef) {
  console.error('❌  Usage : npx tsx src/scripts/reset_test_client.ts --ref GM-2026-0006 [--confirm]');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(msg);
}

function dryLog(msg: string) {
  if (isDryRun) console.log(`  [DRY-RUN] ${msg}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function resetTestClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI manquant dans .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  log('✅ Connecté à MongoDB Atlas');
  log('');

  if (isDryRun) {
    log('🔍 MODE SIMULATION (--dry-run) — Aucune donnée ne sera supprimée.');
    log('   Pour exécuter la suppression réelle, ajoutez --confirm\n');
  } else {
    log('🔴 MODE SUPPRESSION RÉELLE — Les données seront définitivement effacées.\n');
  }

  // 1. Trouver le client
  const client = await Client.findOne({ referenceNumber: clientRef });
  if (!client) {
    log(`❌  Client introuvable avec la référence : ${clientRef}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  log(`👤 Client trouvé : ${client.firstName} ${client.lastName} (${client.referenceNumber})`);
  log(`   ID MongoDB : ${client._id}`);
  log('');

  // 2. Récupérer les articles du client
  const articles = await Article.find({ clientId: client._id });
  log(`📦 Articles liés : ${articles.length}`);
  for (const a of articles) {
    log(`   • [${a.barcode}] ${a.brand} ${a.type} – statut: ${a.status}`);
  }
  log('');

  const articleIds = articles.map(a => a._id);

  // 3. Récupérer les ventes qui référencent ces articles
  const sales = articleIds.length > 0
    ? await Sale.find({ articles: { $in: articleIds } })
    : [];
  log(`🛒 Ventes liées (contenant au moins un de ces articles) : ${sales.length}`);
  for (const s of sales) {
    log(`   • [${s.reference}] – ${s.totalAmount} CHF – articles: [${s.articles.join(', ')}]`);
  }
  log('');

  // 4. Récupérer les reçus du client
  const receipts = await Receipt.find({ clientId: client._id });
  log(`🧾 Reçus liés : ${receipts.length}`);
  for (const r of receipts) {
    log(`   • [${r.referenceNumber}] – type: ${r.type}`);
  }
  log('');

  // 5. Récupérer les documents du client
  const documents = await DocumentModel.find({ clientId: client._id });
  log(`📄 Documents liés : ${documents.length}`);
  for (const d of documents) {
    log(`   • [${d.referenceNumber}] – type: ${d.type} – fichier: ${d.fileUrl}`);
  }
  log('');

  // ── Résumé avant suppression ────────────────────────────────────────────────
  log('─'.repeat(60));
  log('📊 RÉSUMÉ DE CE QUI SERA SUPPRIMÉ :');
  log(`   • 1 client       → ${client.firstName} ${client.lastName} (${clientRef})`);
  log(`   • ${articles.length} article(s)`);
  log(`   • ${sales.length} vente(s)`);
  log(`   • ${receipts.length} reçu(s)`);
  log(`   • ${documents.length} document(s)`);
  log('');
  log('⚠️  LES COUNTERS (barcode, client_2026...) NE SERONT PAS MODIFIÉS.');
  log('   Le prochain client créé recevra GM-2026-0007.');
  log('   Le prochain article recevra le barcode suivant dans la séquence.');
  log('─'.repeat(60));
  log('');

  if (isDryRun) {
    log('✅ Simulation terminée. Relancez avec --confirm pour effectuer la suppression.');
    await mongoose.disconnect();
    return;
  }

  // ── Suppression réelle (ordre : Sales → Articles → Receipts → Documents → Client) ──

  // Supprimer les ventes
  if (sales.length > 0) {
    const saleIds = sales.map(s => s._id);
    const deletedSales = await Sale.deleteMany({ _id: { $in: saleIds } });
    log(`🗑️  Ventes supprimées : ${deletedSales.deletedCount}`);
  }

  // Supprimer les articles
  if (articleIds.length > 0) {
    const deletedArticles = await Article.deleteMany({ clientId: client._id });
    log(`🗑️  Articles supprimés : ${deletedArticles.deletedCount}`);
  }

  // Supprimer les reçus
  if (receipts.length > 0) {
    const deletedReceipts = await Receipt.deleteMany({ clientId: client._id });
    log(`🗑️  Reçus supprimés : ${deletedReceipts.deletedCount}`);
  }

  // Supprimer les documents
  if (documents.length > 0) {
    const deletedDocs = await DocumentModel.deleteMany({ clientId: client._id });
    log(`🗑️  Documents supprimés : ${deletedDocs.deletedCount}`);
  }

  // Supprimer le client en dernier
  await Client.deleteOne({ _id: client._id });
  log(`🗑️  Client supprimé : ${client.firstName} ${client.lastName} (${clientRef})`);

  log('');
  log('🎉 Nettoyage terminé avec succès.');
  log('   ✅ Les counters de codes-barres et de numéros clients sont intacts.');
  log('   ✅ Les autres clients et articles ne sont pas affectés.');

  await mongoose.disconnect();
}

resetTestClient().catch((err) => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
