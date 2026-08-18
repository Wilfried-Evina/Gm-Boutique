import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IClient } from '@gm-boutique/shared';
import { Article } from '../models/Article';
import { Sale } from '../models/Sale';
import { DocumentModel } from '../models/Document';
import { env } from '../config/env';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const pdfService = {
  async generateClientProfilePDFBuffer(client: IClient): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Header / Logo
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 100 });
        }
        
        doc
          .fillColor('#000000')
          .fontSize(20)
          .text('FICHE DÉPOSANTE', 50, 60, { align: 'right' });
          
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`Réf: ${client.referenceNumber}`, 50, 85, { align: 'right' })
          .text(`Généré le: ${new Intl.DateTimeFormat('fr-CH').format(new Date())}`, { align: 'right' });

        doc.moveDown(3);

        // Informations personnelles
        doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('INFORMATIONS PERSONNELLES');
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
        doc.moveDown(1.5);

        doc.fontSize(11).font('Helvetica');
        const leftColX = 50;
        const rightColX = 250;
        const currentY = doc.y;

        doc.font('Helvetica-Bold').text('Nom:', leftColX, currentY);
        doc.font('Helvetica').text(`${client.lastName} ${client.firstName}`, leftColX + 50, currentY);
        
        doc.font('Helvetica-Bold').text('Téléphone:', rightColX, currentY);
        doc.font('Helvetica').text(client.phone, rightColX + 70, currentY);

        doc.font('Helvetica-Bold').text('Email:', leftColX, currentY + 20);
        doc.font('Helvetica').text(client.email || 'Non renseigné', leftColX + 50, currentY + 20);
        
        doc.font('Helvetica-Bold').text('Adresse:', rightColX, currentY + 20);
        doc.font('Helvetica').text(client.address || 'Non renseignée', rightColX + 70, currentY + 20);

        doc.moveDown(3);

        // Synthèse Articles
        const articles = await Article.find({ clientId: client._id });
        const deposited = articles.filter(a => (a as any).status === 'deposited' || (a as any).status === 'on_sale' || (a as any).status === 'expired');
        const sold = articles.filter(a => a.status === 'sold');
        const returned = articles.filter(a => a.status === 'returned');

        doc.font('Helvetica-Bold').fontSize(14).text('SYNTHÈSE DU COMPTE', leftColX, doc.y);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
        doc.moveDown(1.5);

        doc.fontSize(11).font('Helvetica');
        doc.text(`Articles en dépôt : ${deposited.length}`);
        doc.text(`Articles vendus: ${sold.length}`);
        doc.text(`Articles restitués: ${returned.length}`);
        doc.text(`Total des articles: ${articles.length}`);

        const totalRetroPaid = sold.filter((a: any) => a.retrocessionPaid).reduce((acc, a) => acc + (a.finalClientAmount ?? a.clientPrice ?? 0), 0);
        const totalRetroPending = sold.filter((a: any) => !a.retrocessionPaid).reduce((acc, a) => acc + (a.finalClientAmount ?? a.clientPrice ?? 0), 0);

        doc.moveDown(0.5);
        doc.fillColor('#059669').text(`Rétrocessions versées : ${totalRetroPaid.toFixed(2)} CHF`);
        doc.fillColor('#B45309').text(`Reste à verser : ${totalRetroPending.toFixed(2)} CHF`);
        doc.fillColor('#000000');

        doc.moveDown(2);

        // Liste détaillée des articles
        if (articles.length > 0) {
          doc.font('Helvetica-Bold').fontSize(14).text('LISTE DES ARTICLES', leftColX, doc.y);
          doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
          doc.moveDown(1.5);
          
          let tableY = doc.y;
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Code', 50, tableY);
          doc.text('Marque', 120, tableY);
          doc.text('Type', 250, tableY);
          doc.text('Statut', 380, tableY);
          doc.text('Gain', 480, tableY);
          
          let currentListY = tableY + 20;
          doc.font('Helvetica');
          
          const statusMap: Record<string, string> = {
            'deposited': 'Déposé',
            'on_sale': 'En rayon',
            'sold': 'Vendu',
            'returned': 'Restitué',
            'expired': 'Expiré'
          };
          
          for (const article of articles as any[]) {
            if (currentListY > 650) {
              doc.addPage();
              currentListY = 50;
              // Redraw headers on new page
              doc.fontSize(10).font('Helvetica-Bold');
              doc.text('Code', 50, currentListY);
              doc.text('Marque', 120, currentListY);
              doc.text('Type', 250, currentListY);
              doc.text('Statut', 380, currentListY);
              doc.text('Gain', 480, currentListY);
              currentListY += 20;
              doc.font('Helvetica');
            }
            
            let displayStatus = statusMap[article.status] || article.status;
            if (article.status === 'sold') {
              if (article.retrocessionPaid) {
                displayStatus = 'Vendu';
              } else {
                displayStatus = 'Vendu (À verser)';
              }
            }

            doc.text(article.barcode || '-', 50, currentListY);
            doc.text(article.brand || '-', 120, currentListY);
            doc.text(article.type || '-', 250, currentListY);
            doc.text(displayStatus, 380, currentListY);
            doc.text(`${article.clientPrice.toFixed(2)} CHF`, 480, currentListY);
            
            currentListY += 20;
          }
          
          // Move the cursor down after the list so the rest continues properly on the current page
          doc.y = currentListY + 20;
        } else {
          doc.moveDown(2);
        }

        // CGU et Signature
        doc.font('Helvetica-Bold').fontSize(14).text('ENGAGEMENT ET SIGNATURE', leftColX, doc.y);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
        doc.moveDown(1.5);

        doc.fontSize(11).font('Helvetica');
        if (client.cguAccepted) {
          doc.text(`CGU acceptées le: ${new Intl.DateTimeFormat('fr-CH').format(new Date(client.cguAcceptedAt!))}`);
        } else {
          doc.fillColor('#FF0000').text('CGU NON ACCEPTÉES');
        }

        if (client.signatureData) {
          doc.moveDown(1);
          doc.fillColor('#000000').text('Signature électronique enregistrée:');
          
          try {
            // Strip data:image/png;base64, from the string
            const base64Data = client.signatureData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            doc.image(buffer, 50, doc.y + 10, { width: 150 });
          } catch (e) {
            doc.text('(Erreur lors du rendu de la signature)');
          }
        }

        // Footer retiré

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },

  async generateSalesReportPDF(startDate: Date, endDate: Date): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const fileName = `sales_report_${Date.now()}.pdf`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Header / Logo
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 100 });
        }
        
        doc
          .fillColor('#000000')
          .fontSize(20)
          .text('RAPPORT DE VENTES', 50, 60, { align: 'right' });
          
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`Période du: ${new Intl.DateTimeFormat('fr-CH').format(startDate)} au ${new Intl.DateTimeFormat('fr-CH').format(endDate)}`, 50, 85, { align: 'right' })
          .text(`Généré le: ${new Intl.DateTimeFormat('fr-CH').format(new Date())}`, { align: 'right' });

        doc.moveDown(3);

        // Fetch sales within date range
        const sales = await Sale.find({ 
          createdAt: { $gte: startDate, $lte: endDate } 
        }).populate({
          path: 'articles',
          populate: { path: 'clientId' }
        });

        // Fetch returned articles within date range
        const returnedArticles = await Article.find({
          status: 'returned',
          updatedAt: { $gte: startDate, $lte: endDate }
        }).populate('clientId');

        let totalSalesVolume = 0;
        let totalBoutiqueGain = 0;
        let totalClientGain = 0;

        // VENTES SECTION
        doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('ARTICLES VENDUS');
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
        doc.moveDown(1.5);

        let tableY = doc.y;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Date', 50, tableY);
        doc.text('Article', 120, tableY);
        doc.text('Déposante', 300, tableY);
        doc.text('Prix Vente', 380, tableY);
        doc.text('Gain Dép.', 440, tableY);
        doc.text('Gain GM', 500, tableY);

        let currentListY = tableY + 15;
        doc.font('Helvetica');

        for (const sale of sales) {
          const saleDateStr = new Intl.DateTimeFormat('fr-CH', { dateStyle: 'short' }).format(new Date(sale.createdAt));
          
          for (const article of sale.articles as any[]) {
            if (currentListY > 700) {
              doc.addPage();
              currentListY = 50;
              // Headers
              doc.font('Helvetica-Bold').fontSize(10);
              doc.text('Date', 50, currentListY);
              doc.text('Article', 120, currentListY);
              doc.text('Déposante', 300, currentListY);
              doc.text('Prix Vente', 380, currentListY);
              doc.text('Gain Dép.', 440, currentListY);
              doc.text('Gain GM', 500, currentListY);
              currentListY += 15;
              doc.font('Helvetica');
            }
            
            const salePrice = article.finalSalePrice || article.publicPrice;
            const clientGain = article.finalClientAmount || article.clientPrice;
            const boutiqueGain = salePrice - clientGain;
            
            totalSalesVolume += salePrice;
            totalClientGain += clientGain;
            totalBoutiqueGain += boutiqueGain;
            
            const clientName = article.clientId ? `${article.clientId.firstName} ${article.clientId.lastName}`.substring(0, 15) : 'Inconnu';
            const articleName = `${article.brand} ${article.type}`.substring(0, 20);

            doc.text(saleDateStr, 50, currentListY);
            doc.text(articleName, 120, currentListY);
            doc.text(clientName, 300, currentListY);
            doc.text(`${salePrice.toFixed(2)}`, 380, currentListY);
            doc.text(`${clientGain.toFixed(2)}`, 440, currentListY);
            doc.text(`${boutiqueGain.toFixed(2)}`, 500, currentListY);
            
            currentListY += 15;
          }
        }
        
        doc.y = currentListY + 20;
        doc.moveDown(1);
        
        // TOTALS Box
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000');
        doc.text(`Volume de Vente Total: ${totalSalesVolume.toFixed(2)} CHF`, 50, doc.y);
        doc.fillColor('#2563EB').text(`Total Gain Boutique (GM): ${totalBoutiqueGain.toFixed(2)} CHF`, 50, doc.y);
        doc.fillColor('#059669').text(`Total Versé aux Déposantes: ${totalClientGain.toFixed(2)} CHF`, 50, doc.y);
        
        doc.moveDown(3);

        // RESTITUTIONS SECTION
        if (returnedArticles.length > 0) {
          doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('ARTICLES RESTITUÉS');
          doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
          doc.moveDown(1.5);
          
          let retTableY = doc.y;
          doc.font('Helvetica-Bold').fontSize(10);
          doc.text('Date', 50, retTableY);
          doc.text('Article', 150, retTableY);
          doc.text('Montant', 300, retTableY);
          doc.text('Déposante', 380, retTableY);
          
          let retListY = retTableY + 15;
          doc.font('Helvetica');
          
          for (const article of returnedArticles as any[]) {
            if (retListY > 700) {
              doc.addPage();
              retListY = 50;
              doc.font('Helvetica-Bold').fontSize(10);
              doc.text('Date', 50, retListY);
              doc.text('Article', 150, retListY);
              doc.text('Montant', 300, retListY);
              doc.text('Déposante', 380, retListY);
              retListY += 15;
              doc.font('Helvetica');
            }
            
            const retDateStr = new Intl.DateTimeFormat('fr-CH', { dateStyle: 'short' }).format(new Date(article.updatedAt));
            const clientName = article.clientId ? `${article.clientId.firstName} ${article.clientId.lastName}` : 'Inconnu';
            const articleName = `${article.brand} ${article.type}`;
            
            doc.text(retDateStr, 50, retListY);
            doc.text(articleName, 130, retListY);
            doc.text(article.barcode, 260, retListY);
            doc.text(clientName, 380, retListY);
            
            retListY += 15;
          }
          doc.y = retListY + 20;
        }

        // Footer
        doc.fontSize(9).fillColor('#999999').text(
          'GM Boutique - Rapport Comptable Interne',
          50,
          750,
          { align: 'center' }
        );

        doc.end();

        writeStream.on('finish', async () => {
          const referenceNumber = `RPT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          const newDoc = await DocumentModel.create({
            type: 'sales_report',
            fileUrl: `/uploads/documents/${fileName}`,
            referenceNumber
          });
          resolve(newDoc.fileUrl);
        });

        writeStream.on('error', (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  },

  async generateRetrocessionReceiptPDF(
    client: { _id: string; firstName: string; lastName: string; referenceNumber?: string; phone?: string; address?: string },
    articles: { barcode: string; brand?: string; type?: string; description?: string; finalClientAmount?: number; clientPrice?: number; updatedAt?: string | Date; saleDate?: string | Date }[],
    paymentMethod: 'bank_transfer' | 'twint' | 'cash',
    reference?: string,
    totalAmount?: number,
    signatureBase64?: string
  ): Promise<{ fileUrl: string; documentId: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const fileName = `retrocession_${client._id}_${Date.now()}.pdf`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Header / Logo
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 100 });
        }

        doc
          .fillColor('#000000')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('QUITTANCE DE RÈGLEMENT', 50, 55, { align: 'right' });

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text('Rétrocession Déposante', 50, 78, { align: 'right' })
          .text(`Date : ${new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`, { align: 'right' });

        doc.moveDown(3);

        // Bloc Informations Déposante & Paiement
        const startY = 120;
        doc.roundedRect(50, startY, 495, 85, 6).fillAndStroke('#FAFAFA', '#E4E4E7');

        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
        doc.text('DÉPOSANTE', 65, startY + 12);
        doc.text('DÉTAILS DU RÈGLEMENT', 300, startY + 12);

        doc.fontSize(10).font('Helvetica').fillColor('#3F3F46');
        doc.text(`${client.firstName} ${client.lastName}`, 65, startY + 30);
        doc.text(`Réf : ${client.referenceNumber || 'N/A'}`, 65, startY + 45);
        doc.text(`Tél : ${client.phone || 'Non renseigné'}`, 65, startY + 60);

        const methodLabels: Record<string, string> = {
          bank_transfer: 'Virement bancaire',
          twint: 'TWINT',
          cash: 'Espèces',
        };
        const methodLabel = methodLabels[paymentMethod] || paymentMethod || 'Autre';

        doc.text(`Moyen : ${methodLabel}`, 300, startY + 30);
        if (reference) {
          doc.text(`Référence : ${reference}`, 300, startY + 45);
        }
        if (paymentMethod === 'bank_transfer' && client.address) {
          doc.text(`Adresse : ${client.address}`, 300, startY + 60);
        }

        // Tableau des articles réglés
        let tableY = startY + 105;
        doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
        doc.text('ARTICLES RÉGLÉS', 50, tableY);
        tableY += 20;

        // Entêtes du tableau (SANS AUCUN PRIX PUBLIC)
        doc.rect(50, tableY, 495, 22).fill('#F4F4F5');
        doc.fillColor('#18181B').fontSize(9).font('Helvetica-Bold');
        doc.text('Code-barres', 60, tableY + 6);
        doc.text('Article / Description', 170, tableY + 6);
        doc.text('Date vente', 360, tableY + 6);
        doc.text('Montant Versé', 440, tableY + 6, { width: 95, align: 'right' });

        let currentY = tableY + 28;
        doc.font('Helvetica').fontSize(9).fillColor('#27272A');

        let totalCalculated = 0;
        for (const a of articles) {
          if (currentY > 660) {
            doc.addPage();
            currentY = 50;
          }

          const clientAmount = a.finalClientAmount ?? a.clientPrice ?? 0;
          totalCalculated += clientAmount;

          const articleName = `${a.brand || ''} ${a.type || ''}`.trim() || 'Article';
          const saleDateStr = a.updatedAt || a.saleDate ? new Intl.DateTimeFormat('fr-CH').format(new Date(a.updatedAt || a.saleDate)) : '-';

          doc.text(a.barcode || '-', 60, currentY);
          doc.text(articleName, 170, currentY, { width: 180, lineBreak: false });
          doc.text(saleDateStr, 360, currentY);
          doc.font('Helvetica-Bold').text(`${clientAmount.toFixed(2)} CHF`, 440, currentY, { width: 95, align: 'right' });
          doc.font('Helvetica');

          currentY += 18;
          doc.moveTo(50, currentY - 4).lineTo(545, currentY - 4).stroke('#F4F4F5');
        }

        // Total
        const finalTotal = totalAmount !== undefined ? totalAmount : totalCalculated;
        currentY += 10;
        doc.rect(320, currentY, 225, 36).fillAndStroke('#ECFDF5', '#A7F3D0');
        doc.fillColor('#065F46').fontSize(11).font('Helvetica-Bold');
        doc.text('TOTAL VERSÉ :', 330, currentY + 12);
        doc.fontSize(13).text(`${finalTotal.toFixed(2)} CHF`, 420, currentY + 10, { width: 115, align: 'right' });

        // Mentions et signature de la déposante uniquement
        let footerBlockY = currentY + 70;
        if (footerBlockY > 720) {
          doc.addPage();
          footerBlockY = 50;
        }

        doc.fillColor('#71717A').fontSize(8).font('Helvetica');
        doc.text(
          'Ce document constitue une quittance officielle de versement de rétrocession émise par GM Boutique. Il atteste du bon règlement des gains dus pour les articles vendus indiqués ci-dessus.',
          50,
          footerBlockY,
          { width: 495, align: 'justify' }
        );

        if (paymentMethod === 'cash') {
          if (signatureBase64) {
            try {
              const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              doc.image(buffer, 360, footerBlockY + 15, { width: 140, height: 45, fit: [140, 45] });
            } catch (e) {
              doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold').text('✓ Signature électronique validée', 360, footerBlockY + 25);
            }
            doc.fillColor('#3F3F46').fontSize(8).font('Helvetica');
            doc.text('Signature électronique de la déposante (Espèces reçues)', 340, footerBlockY + 65, { width: 200, align: 'center' });
          } else {
            doc.moveTo(340, footerBlockY + 45).lineTo(540, footerBlockY + 45).stroke('#D4D4D8');
            doc.fillColor('#3F3F46').fontSize(8).font('Helvetica');
            doc.text('Signature de la déposante (Pour acquit des espèces)', 340, footerBlockY + 50, { width: 200, align: 'center' });
          }
        } else {
          doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold');
          doc.text(`✓ Règlement électronique effectué par ${methodLabel} — Pièce comptable certifiée sans contact`, 50, footerBlockY + 25);
        }

        doc.end();

        writeStream.on('finish', async () => {
          const referenceNumber = `QUITT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          const newDoc = await DocumentModel.create({
            clientId: client._id,
            type: 'retrocession',
            fileUrl: `/uploads/documents/${fileName}`,
            referenceNumber,
          });
          resolve({ fileUrl: newDoc.fileUrl, documentId: newDoc._id.toString() });
        });

        writeStream.on('error', (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  }
};
