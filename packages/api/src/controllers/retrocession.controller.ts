import { Request, Response, NextFunction } from 'express';
import { Article } from '../models/Article';
import { Client } from '../models/Client';
import { ArticleStatus } from '@gm-boutique/shared';
import type { IRetrocessionSummary } from '@gm-boutique/shared';

/**
 * Calcule la rétrocession d'une cliente à partir de ses articles vendus.
 * Aucun flux négatif : les montants dus sont toujours ≥ 0 ; les articles
 * restitués (non vendus) ne génèrent aucun montant.
 */
export async function computeRetrocession(clientId: string): Promise<IRetrocessionSummary | null> {
  const client = await Client.findById(clientId);
  if (!client) return null;

  const soldArticles = await Article.find({
    clientId,
    status: ArticleStatus.SOLD,
  }).sort({ updatedAt: -1 });

  let totalSales = 0;
  let totalRetrocessions = 0;
  let totalPaid = 0;

  const items = soldArticles.map((a) => {
    // Valeurs effectives, avec repli sur les prix initiaux si non validés.
    const salePrice = a.finalSalePrice ?? a.publicPrice;
    const clientAmount = a.finalClientAmount ?? a.clientPrice;

    totalSales += salePrice;
    totalRetrocessions += clientAmount;
    if (a.retrocessionPaid) totalPaid += clientAmount;

    return {
      articleId: a._id.toString(),
      barcode: a.barcode,
      brand: a.brand,
      type: a.type,
      saleDate: a.updatedAt,
      finalSalePrice: salePrice,
      finalClientAmount: clientAmount,
      retrocessionPaid: a.retrocessionPaid,
      retrocessionPaidAt: a.retrocessionPaidAt,
    };
  });

  const remainingToPay = Math.max(0, totalRetrocessions - totalPaid);
  const storeEarnings = totalSales - totalRetrocessions;

  return {
    clientId: client._id.toString(),
    clientName: `${client.firstName} ${client.lastName}`,
    totalSales,
    totalRetrocessions,
    totalPaid,
    remainingToPay,
    storeEarnings,
    totalArticlesSold: soldArticles.length,
    items,
    totalAmountDue: remainingToPay,
    status: soldArticles.length > 0 && remainingToPay === 0 ? 'paid' : 'pending',
  };
}

export const retrocessionController = {
  async getForClient(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await computeRetrocession(req.params.clientId);
      if (!summary) return res.status(404).json({ message: 'Cliente introuvable.' });
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },

  /** Marque un article vendu comme remboursé. */
  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await Article.findById(req.params.articleId);
      if (!article) return res.status(404).json({ message: 'Article introuvable.' });
      if (article.status !== ArticleStatus.SOLD) {
        return res.status(400).json({ message: 'Seuls les articles vendus peuvent être remboursés.' });
      }

      if (!article.retrocessionPaid) {
        article.retrocessionPaid = true;
        article.retrocessionPaidAt = new Date();
        await article.save();
      }

      const summary = await computeRetrocession(article.clientId.toString());
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },

  /** Marque tous les articles vendus non payés d'une cliente comme remboursés. */
  async markAllPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      await Article.updateMany(
        { clientId, status: ArticleStatus.SOLD, retrocessionPaid: false },
        { $set: { retrocessionPaid: true, retrocessionPaidAt: new Date() } }
      );

      const summary = await computeRetrocession(clientId);
      if (!summary) return res.status(404).json({ message: 'Cliente introuvable.' });
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },
};
