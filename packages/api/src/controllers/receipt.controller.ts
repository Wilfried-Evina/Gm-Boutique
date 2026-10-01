import { Request, Response } from 'express';
import { z } from 'zod';
import { Receipt } from '../models/Receipt';
import { Article } from '../models/Article';
import crypto from 'crypto';
import { Client } from '../models/Client';
import { pdfService } from '../services/pdf.service';
import path from 'path';

const createReceiptSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(['deposit', 'restitution']),
  articleIds: z.array(z.string()).min(1),
  signatureData: z.string().min(1), // Base64
});

export const receiptController = {
  async create(req: Request, res: Response) {
    try {
      const data = createReceiptSchema.parse(req.body);

      // Verify articles belong to client
      const articles = await Article.find({ _id: { $in: data.articleIds }, clientId: data.clientId });
      if (articles.length !== data.articleIds.length) {
        return res.status(400).json({ message: "Certains articles sont introuvables ou n'appartiennent pas à cette cliente." });
      }

      // Si c'est un bon de dépôt, vérifier qu'aucun article n'a déjà fait l'objet d'un bon de dépôt
      if (data.type === 'deposit') {
        const existingDeposit = await Receipt.findOne({
          clientId: data.clientId,
          type: 'deposit',
          articleIds: { $in: data.articleIds },
        });
        if (existingDeposit) {
          return res.status(400).json({ message: "Certains articles sélectionnés ont déjà fait l'objet d'un bon de dépôt." });
        }
      }

      // Si c'est une restitution, vérifier qu'aucun article n'est 'sold'
      if (data.type === 'restitution') {
        const soldArticles = articles.filter(a => a.status === 'sold');
        if (soldArticles.length > 0) {
          return res.status(400).json({ message: "Impossible de restituer des articles déjà vendus." });
        }
      }

      // Generate reference number
      const prefix = data.type === 'deposit' ? 'DEP' : 'RES';
      const refNumber = `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const receipt = await Receipt.create({
        clientId: data.clientId,
        type: data.type,
        articleIds: data.articleIds,
        signatureData: data.signatureData,
        referenceNumber: refNumber,
      });

      // If it's a restitution, update the status of the articles to 'returned'
      if (data.type === 'restitution') {
        await Article.updateMany(
          { _id: { $in: data.articleIds } },
          { $set: { status: 'returned' } }
        );
      }

      res.status(201).json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur lors de la création du bon', error });
    }
  },

  async getByClient(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const receipts = await Receipt.find({ clientId })
        .populate('articleIds')
        .sort({ createdAt: -1 });
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des bons', error });
    }
  },

  async getPdf(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);
      if (!receipt) {
        return res.status(404).json({ message: "Bon introuvable." });
      }

      const client = await Client.findById(receipt.clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente introuvable." });
      }

      const articles = await Article.find({ _id: { $in: receipt.articleIds } });

      const pdfBuffer = await pdfService.generateReceiptPDFBuffer(receipt, client, articles);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="bon_${receipt.referenceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la génération du PDF", error });
    }
  },

  async sendByEmail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email: customEmail } = req.body;

      const receipt = await Receipt.findById(id);
      if (!receipt) {
        return res.status(404).json({ message: "Bon introuvable." });
      }

      const client = await Client.findById(receipt.clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente introuvable." });
      }

      const recipientEmail = customEmail || client.email;
      if (!recipientEmail) {
        return res.status(400).json({ message: "Adresse email manquante. Veuillez saisir un email." });
      }

      const articles = await Article.find({ _id: { $in: receipt.articleIds } });
      const pdfBuffer = await pdfService.generateReceiptPDFBuffer(receipt, client, articles);

      const { mailService } = await import('../services/mail.service');

      const typeLabel = receipt.type === 'deposit' ? 'Dépôt' : 'Restitution';
      const filename = `GM_Boutique_Bon_${typeLabel}_${receipt.referenceNumber}.pdf`;
      const clientName = `${client.firstName} ${client.lastName}`;

      await mailService.sendEmail({
        to: recipientEmail,
        subject: `GMBoutique - Votre bon de ${typeLabel} (${receipt.referenceNumber})`,
        text: `Bonjour ${clientName},\n\nVeuillez trouver ci-joint votre bon de ${typeLabel} GMBoutique (${receipt.referenceNumber}).\n\nBien cordialement,\nL'équipe GMBoutique\nAvenue Pictet-de-Rochemont 3, 1207 Genève`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #111; padding: 30px; text-align: center;">
              <img src="cid:gmboutiquelogo" alt="GMBoutique" style="width: 80px; height: 80px; border-radius: 50%; display: block; margin: auto; object-fit: cover; background-color: #f9f9f9;" />
              <h1 style="color: #fff; font-size: 22px; margin-top: 12px; margin-bottom: 0;">GMBoutique</h1>
              <p style="color: #aaa; font-size: 12px; margin: 4px 0 0 0;">Avenue Pictet-de-Rochemont 3, 1207 Genève</p>
            </div>
            <div style="padding: 30px; color: #333; line-height: 1.6;">
              <h2 style="color: #111; font-size: 20px; margin-top: 0;">Bonjour ${clientName},</h2>
              <p style="font-size: 16px;">Veuillez trouver ci-joint votre <strong>bon de ${typeLabel}</strong> (réf. <strong>${receipt.referenceNumber}</strong>).</p>
              
              <div style="background-color: #f4f6f8; border-left: 4px solid #111; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-size: 15px; color: #555;">Type de bon : <strong>Bon de ${typeLabel}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 15px; color: #555;">Référence : <strong>${receipt.referenceNumber}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 15px; color: #555;">Nombre d'articles : <strong>${articles.length}</strong></p>
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

      res.json({ message: `Bon envoyé avec succès à ${recipientEmail}.` });
    } catch (error) {
      res.status(500).json({ 
        message: "Erreur lors de l'envoi du bon par email.", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  },
};
