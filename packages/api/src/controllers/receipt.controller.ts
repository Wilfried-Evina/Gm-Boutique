import { Request, Response } from 'express';
import { z } from 'zod';
import { Receipt } from '../models/Receipt';
import { Article } from '../models/Article';
import crypto from 'crypto';

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
};
