/**
 * Script de test : crée un faux bon de dépôt et l'envoie par email
 * Usage: npx ts-node send_test_receipt.ts
 */
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI!;
const TARGET_EMAIL = 'edimaevina@gmail.com';

async function main() {
  console.log('🔌 Connexion à MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  // Import models après connexion
  const { Client } = await import('./src/models/Client');
  const { Article } = await import('./src/models/Article');
  const { Receipt } = await import('./src/models/Receipt');
  const { pdfService } = await import('./src/services/pdf.service');
  const { mailService } = await import('./src/services/mail.service');

  // 1. Créer une fausse cliente
  console.log('👤 Création d\'une cliente de test...');
  const fakeClient = await Client.create({
    referenceNumber: 'TEST-0099',
    firstName: 'Sophia',
    lastName: 'Dupont',
    phone: '+41 76 000 00 00',
    email: TARGET_EMAIL,
    address: 'Rue de Rive 12, 1204 Genève',
    cguAccepted: true,
    cguAcceptedAt: new Date(),
  });
  console.log(`✅ Cliente créée : ${fakeClient.firstName} ${fakeClient.lastName} (${fakeClient._id})`);

  // 2. Créer de faux articles
  console.log('👗 Création des articles de test...');
  const article1 = await Article.create({
    clientId: fakeClient._id,
    barcode: '9990001',
    brand: 'Chanel',
    type: 'Veste',
    color: 'Noir',
    size: '38',
    description: 'Veste en tweed noire, très bon état',
    clientPrice: 280.00,
    publicPrice: 350.00,
    status: 'on_sale',
  });

  const article2 = await Article.create({
    clientId: fakeClient._id,
    barcode: '9990002',
    brand: 'Louis Vuitton',
    type: 'Sac à main',
    color: 'Marron',
    size: 'Unique',
    description: 'Sac Speedy 30, état impeccable',
    clientPrice: 520.00,
    publicPrice: 650.00,
    status: 'on_sale',
  });

  const article3 = await Article.create({
    clientId: fakeClient._id,
    barcode: '9990003',
    brand: 'Hermès',
    type: 'Foulard',
    color: 'Multicolore',
    size: 'Unique',
    description: 'Foulard en soie, motif équestre',
    clientPrice: 160.00,
    publicPrice: 200.00,
    status: 'on_sale',
  });
  console.log(`✅ 3 articles créés`);

  // 3. Créer le bon de dépôt
  console.log('📋 Création du bon de dépôt...');
  const receipt = await Receipt.create({
    clientId: fakeClient._id,
    type: 'deposit',
    articleIds: [article1._id, article2._id, article3._id],
    signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    referenceNumber: 'DEP-TEST01',
  });
  console.log(`✅ Bon de dépôt créé : ${receipt.referenceNumber}`);

  // 4. Générer le PDF
  console.log('📄 Génération du PDF...');
  const articles = [article1, article2, article3];
  const pdfBuffer = await pdfService.generateReceiptPDFBuffer(receipt, fakeClient, articles);
  console.log(`✅ PDF généré (${Math.round(pdfBuffer.length / 1024)} Ko)`);

  // 5. Envoyer l'email
  console.log(`📧 Envoi de l'email à ${TARGET_EMAIL}...`);
  const logoPath = path.join(__dirname, 'assets/logo.png');

  await mailService.sendEmail({
    to: TARGET_EMAIL,
    subject: 'GMBoutique – Test : Votre bon de Dépôt (DEP-TEST01)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #111; padding: 30px; text-align: center;">
          <img src="cid:gmboutiquelogo" alt="GMBoutique" style="width: 80px; height: 80px; border-radius: 50%; display: block; margin: auto; object-fit: cover; background-color: #f9f9f9;" />
          <h1 style="color: #fff; font-size: 22px; margin-top: 12px; margin-bottom: 0;">GMBoutique</h1>
          <p style="color: #aaa; font-size: 12px; margin: 4px 0 0 0;">Avenue Pictet-de-Rochemont 3, 1207 Genève</p>
        </div>
        <div style="padding: 30px; color: #333; line-height: 1.6;">
          <h2 style="color: #111; font-size: 20px; margin-top: 0;">Bonjour Sophia Dupont,</h2>
          <p style="font-size: 16px;">Veuillez trouver ci-joint votre <strong>bon de Dépôt</strong> (réf. <strong>DEP-TEST01</strong>).</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #111; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 15px; color: #555;">Type de bon : <strong>Bon de Dépôt</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 15px; color: #555;">Référence : <strong>DEP-TEST01</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 15px; color: #555;">Nombre d'articles : <strong>3</strong></p>
          </div>

          <p style="font-size: 16px; margin-top: 20px;">Merci de votre confiance et à très bientôt chez GMBoutique !</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px;">
            <p style="margin: 0;">Bien cordialement,</p>
            <p style="margin: 0;"><strong>L'équipe GMBoutique</strong></p>
          </div>
        </div>
        <div style="background-color: #111; padding: 20px; text-align: center; color: #fff; font-size: 12px;">
          <p style="margin: 0;">GMBoutique – Avenue Pictet-de-Rochemont 3, 1207 Genève</p>
          <p style="margin: 5px 0 0 0; opacity: 0.6;">Document confidentiel – à conserver pour vos archives.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'gmboutiquelogo'
      },
      {
        filename: 'GM_Boutique_Bon_Depot_DEP-TEST01.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });

  console.log(`✅ Email envoyé avec succès à ${TARGET_EMAIL} !`);

  // 6. Nettoyage des données de test
  console.log('🧹 Nettoyage des données de test...');
  await Receipt.deleteOne({ _id: receipt._id });
  await Article.deleteMany({ clientId: fakeClient._id });
  await Client.deleteOne({ _id: fakeClient._id });
  console.log('✅ Données de test supprimées');

  await mongoose.disconnect();
  console.log('\n🎉 Tout est bon ! Vérifiez votre boîte email.');
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message || err);
  process.exit(1);
});
