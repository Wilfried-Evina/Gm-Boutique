import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DocumentModel } from '../models/Document';
import { Client } from '../models/Client';
import { pdfService } from '../services/pdf.service';
import { logger } from '../utils/logger';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const documentController = {
  async generateClientProfile(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente introuvable." });
      }

      const pdfBuffer = await pdfService.generateClientProfilePDFBuffer(client as any);

      // Save the PDF to disk
      const fileName = `client_profile_${clientId}_${Date.now()}.pdf`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      // Create or update a Document record in MongoDB
      const referenceNumber = client.referenceNumber ? `CP-${client.referenceNumber}-${crypto.randomBytes(2).toString('hex').toUpperCase()}` : `CP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const doc = await DocumentModel.create({
        clientId,
        type: 'client_profile',
        fileUrl: `/uploads/documents/${fileName}`,
        referenceNumber,
      });

      res.status(201).json(doc);
    } catch (error) {
      logger.error('Error generating client profile PDF:', error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF." });
    }
  },
  async generateSalesReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate et endDate sont requis." });
      }

      const fileUrl = await pdfService.generateSalesReportPDF(new Date(startDate), new Date(endDate));

      // Return the generated document record
      const doc = await DocumentModel.findOne({ fileUrl });
      res.status(201).json(doc);
    } catch (error) {
      logger.error('Error generating sales report PDF:', error);
      res.status(500).json({ message: "Erreur lors de la génération du rapport.", details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    }
  },

  async generateSalesReportCSV(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate et endDate sont requis." });
      }

      const { Sale } = require('../models/Sale');
      
      const sales = await Sale.find({ 
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } 
      }).populate({
        path: 'articles',
        populate: { path: 'clientId' }
      });

      const csvLines = [];
      // Header
      csvLines.push("Date;Code-barres;Marque;Type;Numéro Déposante;Prix Vente (CHF);Gain Déposante (CHF);Gain GM (CHF)");

      let totalSalesVolume = 0;
      let totalClientGain = 0;
      let totalBoutiqueGain = 0;

      for (const sale of sales) {
        const saleDateStr = new Intl.DateTimeFormat('fr-CH', { dateStyle: 'short' }).format(new Date(sale.createdAt));
        for (const article of sale.articles as any[]) {
          const salePrice = article.finalSalePrice || article.publicPrice || 0;
          const clientGain = article.finalClientAmount || article.clientPrice || 0;
          const boutiqueGain = salePrice - clientGain;
          
          totalSalesVolume += salePrice;
          totalClientGain += clientGain;
          totalBoutiqueGain += boutiqueGain;
          
          const clientRef = article.clientId && article.clientId.referenceNumber ? article.clientId.referenceNumber : 'Inconnu';
          
          // Escape CSV strings
          const safeCode = `"${(article.barcode || '').replace(/"/g, '""')}"`;
          const safeBrand = `"${(article.brand || '').replace(/"/g, '""')}"`;
          const safeType = `"${(article.type || '').replace(/"/g, '""')}"`;
          const safeClient = `"${clientRef.replace(/"/g, '""')}"`;

          csvLines.push(`${saleDateStr};${safeCode};${safeBrand};${safeType};${safeClient};${salePrice.toFixed(2)};${clientGain.toFixed(2)};${boutiqueGain.toFixed(2)}`);
        }
      }

      csvLines.push("");
      csvLines.push(`TOTAL;;;;"";${totalSalesVolume.toFixed(2)};${totalClientGain.toFixed(2)};${totalBoutiqueGain.toFixed(2)}`);

      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.attachment(`Rapport_Ventes_${Date.now()}.csv`);
      res.send('\uFEFF' + csvLines.join('\n')); // BOM for Excel

    } catch (error) {
      logger.error('Error generating sales report CSV:', error);
      res.status(500).json({ message: "Erreur lors de la génération du rapport CSV." });
    }
  },

  async listByClient(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const documents = await DocumentModel.find({ clientId }).sort({ createdAt: -1 });
      res.json(documents);
    } catch (error) {
      logger.error('Error listing client documents:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des documents." });
    }
  },

  async downloadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findById(id);

      if (!doc) {
        return res.status(404).json({ message: "Document introuvable." });
      }

      // fileUrl is like /uploads/documents/filename.pdf
      const filePath = path.join(__dirname, '../../', doc.fileUrl);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Le fichier physique n'existe plus sur le serveur." });
      }

      res.download(filePath, `GM_Boutique_${doc.type}_${doc.referenceNumber}.pdf`);
    } catch (error) {
      logger.error('Error downloading document:', error);
      res.status(500).json({ message: "Erreur lors du téléchargement." });
    }
  },

  async sendDocumentByEmail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email: customEmail } = req.body;

      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({ message: "Document introuvable." });
      }

      let recipientEmail = customEmail;
      let clientName = 'Chère cliente';

      if (doc.clientId) {
        const client = await Client.findById(doc.clientId);
        if (client) {
          if (!recipientEmail) {
            recipientEmail = client.email;
          }
          clientName = `${client.firstName} ${client.lastName}`;
        }
      }

      if (!recipientEmail) {
        return res.status(400).json({ message: "Adresse email destinataire manquante." });
      }

      const filePath = path.join(__dirname, '../../', doc.fileUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Le fichier PDF n'existe pas sur le serveur." });
      }

      const { mailService } = await import('../services/mail.service');
      const filename = `GM_Boutique_${doc.type}_${doc.referenceNumber}.pdf`;

      await mailService.sendEmail({
        to: recipientEmail,
        subject: `GMBoutique - Votre document (${doc.referenceNumber})`,
        text: `Bonjour ${clientName},\n\nVeuillez trouver ci-joint votre document GMBoutique (${doc.referenceNumber}).\n\nBien cordialement,\nL'équipe GMBoutique`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f9f9f9; padding: 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
              <img src="cid:gmboutiquelogo" alt="GMBoutique Logo" style="width: 80px; height: 80px; border-radius: 50%; display: block; margin: auto; object-fit: cover; background-color: #f9f9f9;" />
              <h1 style="color: #111; font-size: 24px; margin-top: 15px; margin-bottom: 0;">GMBoutique</h1>
            </div>
            <div style="padding: 30px; color: #333; line-height: 1.6;">
              <h2 style="color: #111; font-size: 20px; margin-top: 0;">Bonjour ${clientName},</h2>
              <p style="font-size: 16px;">Veuillez trouver ci-joint votre document officiel <strong>${doc.referenceNumber}</strong>, généré suite à votre visite ou demande.</p>
              
              <div style="background-color: #f4f6f8; border-left: 4px solid #111; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-size: 15px; color: #555;">Document : <strong>Document GMBoutique</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 15px; color: #555;">Référence : <strong>${doc.referenceNumber}</strong></p>
              </div>

              <p style="font-size: 16px; margin-top: 20px;">Merci de votre confiance et à très bientôt chez GMBoutique !</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px;">
                <p style="margin: 0;">Bien cordialement,</p>
                <p style="margin: 0;"><strong>GMBoutique</strong></p>
              </div>
            </div>
            <div style="background-color: #111; padding: 20px; text-align: center; color: #fff; font-size: 12px;">
              <p style="margin: 0;">GMBoutique - Document confidentiel</p>
              <p style="margin: 5px 0 0 0; opacity: 0.7;">Veuillez conserver ce document pour vos archives.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../../../web/public/logo.png'),
            cid: 'gmboutiquelogo'
          },
          {
            filename: `document_${doc.referenceNumber}.pdf`,
            path: filePath
          }
        ]
      });

      doc.sentByEmail = true;
      doc.sentAt = new Date();
      await doc.save();

      res.json({ message: "Email envoyé avec succès.", doc });
    } catch (error) {
      logger.error('Error sending document by email:', error);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'email.", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async sendClientProfileByEmail(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { email: customEmail } = req.body;

      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente introuvable." });
      }

      const recipientEmail = customEmail || client.email;
      if (!recipientEmail) {
        return res.status(400).json({ message: "Adresse email destinataire manquante." });
      }

      const pdfBuffer = await pdfService.generateClientProfilePDFBuffer(client as any);
      const { mailService } = await import('../services/mail.service');
      const filename = `Fiche_Cliente_${client.referenceNumber || client.lastName}.pdf`;

      await mailService.sendEmail({
        to: recipientEmail,
        subject: `GMBoutique - Votre fiche déposante (${client.referenceNumber})`,
        text: `Bonjour ${client.firstName} ${client.lastName},\n\nVeuillez trouver ci-joint votre fiche récapitulative déposante GMBoutique.\n\nBien cordialement,\nL'équipe GMBoutique`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="cid:gmboutiquelogo" alt="GMBoutique Logo" style="width: 80px; height: 80px; border-radius: 50%; display: block; margin: auto; object-fit: cover; background-color: #f9f9f9;" />
              <h1 style="color: #111; font-size: 24px; margin-top: 15px; margin-bottom: 0;">GMBoutique</h1>
            </div>
            <p style="font-size: 16px;">Bonjour <strong>${client.firstName} ${client.lastName}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5;">Veuillez trouver en pièce jointe votre <strong>fiche déposante récapitulative</strong> (Réf: ${client.referenceNumber}).</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <p style="margin: 0; color: #555; font-size: 15px;">Votre fiche cliente PDF est attachée à cet email.</p>
            </div>

            <p style="font-size: 16px; margin-top: 20px;">Merci de votre confiance et à très bientôt chez GMBoutique !</p>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <div style="text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;"><strong>GMBoutique</strong></p>
              <p style="margin: 5px 0 0 0;">Dépôt-Vente & Prêt-à-porter de luxe</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../../assets/logo.png'),
            cid: 'gmboutiquelogo'
          },
          {
            filename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      res.json({ message: "Fiche cliente envoyée par email avec succès." });
    } catch (error) {
      logger.error('Error sending client profile by email:', error);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'email.", details: error instanceof Error ? error.message : String(error) });
    }
  }
};

