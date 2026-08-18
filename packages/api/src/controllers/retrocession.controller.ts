import { Request, Response, NextFunction } from 'express';
import { Article } from '../models/Article';
import { Client } from '../models/Client';
import { ArticleStatus } from '@gm-boutique/shared';
import type { IRetrocessionSummary } from '@gm-boutique/shared';
import { pdfService } from '../services/pdf.service';

/**
 * Calcule la rétrocession d'une déposante à partir de ses articles vendus.
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
      retrocessionPaymentMethod: a.retrocessionPaymentMethod,
      retrocessionReference: a.retrocessionReference,
      retrocessionReceiptId: a.retrocessionReceiptId ? a.retrocessionReceiptId.toString() : undefined,
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
  /** Statistiques globales pour les 4 indicateurs */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const soldArticles = await Article.find({ status: ArticleStatus.SOLD });
      let totalGlobalRetrocessions = 0;
      let totalGlobalPaid = 0;

      for (const a of soldArticles) {
        const clientAmount = a.finalClientAmount ?? a.clientPrice ?? 0;
        totalGlobalRetrocessions += clientAmount;
        if (a.retrocessionPaid) {
          totalGlobalPaid += clientAmount;
        }
      }

      const totalGlobalRemaining = Math.max(0, totalGlobalRetrocessions - totalGlobalPaid);

      // Déposantes avec solde restant
      const unpaidClientIds = await Article.find({
        status: ArticleStatus.SOLD,
        retrocessionPaid: false,
      }).distinct('clientId');

      res.json({
        totalGlobalRetrocessions,
        totalGlobalPaid,
        totalGlobalRemaining,
        clientsWithPendingCount: unpaidClientIds.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /** Vue globale : une ligne de synthèse par déposante ayant des ventes. */
  async listAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const clientIds = await Article.find({ status: ArticleStatus.SOLD }).distinct('clientId');
      const clients = await Client.find({ _id: { $in: clientIds } });
      const refMap = new Map(clients.map((c) => [c._id.toString(), c.referenceNumber]));

      const rows = [];
      for (const cid of clientIds) {
        const s = await computeRetrocession(cid.toString());
        if (!s) continue;
        rows.push({
          clientId: s.clientId,
          clientName: s.clientName,
          referenceNumber: refMap.get(s.clientId) ?? '',
          totalArticlesSold: s.totalArticlesSold,
          totalRetrocessions: s.totalRetrocessions,
          totalPaid: s.totalPaid,
          remainingToPay: s.remainingToPay,
          status: s.status,
        });
      }

      // Les plus gros montants restants d'abord.
      rows.sort((a, b) => b.remainingToPay - a.remainingToPay);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  },

  async getForClient(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await computeRetrocession(req.params.clientId);
      if (!summary) return res.status(404).json({ message: 'Déposante introuvable.' });
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },

  /** Règlement sécurisé avec mode de paiement et quittance PDF */
  async pay(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, articleIds, paymentMethod, reference, signatureBase64 } = req.body;
      if (!clientId || !paymentMethod) {
        return res.status(400).json({ message: 'clientId et paymentMethod sont requis.' });
      }

      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Déposante introuvable.' });
      }

      const query: any = {
        clientId,
        status: ArticleStatus.SOLD,
        retrocessionPaid: false,
      };
      if (articleIds && Array.isArray(articleIds) && articleIds.length > 0) {
        query._id = { $in: articleIds };
      }

      const articlesToPay = await Article.find(query);
      if (articlesToPay.length === 0) {
        return res.status(400).json({ message: 'Aucun article en attente de versement trouvé.' });
      }

      // Calcul montant
      const totalAmount = articlesToPay.reduce((acc, a) => acc + (a.finalClientAmount ?? a.clientPrice ?? 0), 0);

      // Générer le reçu PDF de rétrocession
      const receiptDoc = await pdfService.generateRetrocessionReceiptPDF(
        client,
        articlesToPay,
        paymentMethod,
        reference,
        totalAmount,
        signatureBase64
      );

      // Marquer les articles comme payés avec traçabilité
      await Article.updateMany(
        { _id: { $in: articlesToPay.map((a) => a._id) } },
        {
          $set: {
            retrocessionPaid: true,
            retrocessionPaidAt: new Date(),
            retrocessionPaymentMethod: paymentMethod,
            retrocessionReference: reference || '',
            retrocessionReceiptId: receiptDoc.documentId,
          },
        }
      );

      const summary = await computeRetrocession(clientId);
      res.json({
        summary,
        documentId: receiptDoc.documentId,
        fileUrl: receiptDoc.fileUrl,
        message: 'Règlement enregistré et quittance générée avec succès.',
      });
    } catch (error) {
      next(error);
    }
  },

  /** Marque un article vendu comme remboursé (méthode de secours). */
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

  /** Marque tous les articles vendus non payés d'une cliente comme remboursés (méthode de secours). */
  async markAllPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      await Article.updateMany(
        { clientId, status: ArticleStatus.SOLD, retrocessionPaid: false },
        { $set: { retrocessionPaid: true, retrocessionPaidAt: new Date() } }
      );

      const summary = await computeRetrocession(clientId);
      if (!summary) return res.status(404).json({ message: 'Déposante introuvable.' });
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },
};
