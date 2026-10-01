import { Request, Response } from 'express';
import { Client } from '../models/Client';
import { Article } from '../models/Article';
import { Sale } from '../models/Sale';
import { Counter } from '../models/Counter';
import crypto from 'crypto';

export const digitalizeClientRecords = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { depositDate, articles } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    if (!depositDate || !articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: 'Date de dépôt et liste des articles requises.' });
    }

    const dDate = new Date(depositDate);
    const createdArticles: { article: any; itemData: any }[] = [];
    const articleIds: any[] = [];

    // 1. Create articles
    for (const item of articles) {
      const article = new Article({
        clientId,
        barcode: await generateBarcode(),
        brand: (item.brand || '').trim() || 'Inconnu',
        type: (item.type || '').trim() || 'Article',
        color: (item.color || '').trim() || '—',   // color requis dans le schéma, valeur par défaut si vide
        size: item.size || '',
        description: item.description || '',
        clientPrice: Number(item.clientPrice) || 0,
        publicPrice: Number(item.publicPrice) || 0,
        status: item.status === 'En boutique' ? 'on_sale' : (item.status === 'Restitué' ? 'returned' : 'sold'),
        isHistorical: true,
      });

      // If status involves a later action, record those dates
      if (item.status === 'Vendu' || item.status === 'Payé') {
        article.finalSalePrice = Number(item.publicPrice) || 0;
        article.finalClientAmount = Number(item.clientPrice) || 0;

        if (item.status === 'Payé') {
          article.retrocessionPaidAt = item.actionDate ? new Date(item.actionDate) : new Date();
          article.retrocessionPaymentMethod = 'Virement bancaire';
        }
      }

      await article.save();

      // Override timestamps to match the original deposit date
      await Article.updateOne(
        { _id: article._id },
        { $set: { createdAt: dDate, updatedAt: dDate } },
        { timestamps: false, overwriteImmutable: true }
      );

      createdArticles.push({ article, itemData: item });
      articleIds.push(article._id);
    }

    // 2. We DO NOT create Deposit/Restitution Receipts (Bons de dépôt)
    // for historical digitalization.

    // 3. Create Sales for sold items
    const soldList = createdArticles.filter(a => a.article.status === 'sold');
    for (const { article, itemData } of soldList) {
      const saleDate = itemData.actionDate ? new Date(itemData.actionDate) : new Date();
      const saleRef = `VEN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const sale = new Sale({
        reference: saleRef,
        articles: [article._id],
        totalAmount: article.publicPrice,
        paymentMethod: 'cash',
      });
      await sale.save();
      await Sale.updateOne(
        { _id: sale._id },
        { $set: { createdAt: saleDate, updatedAt: saleDate } },
        { timestamps: false, overwriteImmutable: true }
      );
    }

    // 4. Create Retrocessions for paid items
    const paidList = createdArticles.filter(a => a.itemData.status === 'Payé');
    if (paidList.length > 0) {
      const latestSaleDate = paidList.reduce((latest, a) => {
        const saleDate = a.itemData.actionDate ? new Date(a.itemData.actionDate) : new Date();
        return saleDate > latest ? saleDate : latest;
      }, new Date(0));

      const paidArticleIds = paidList.map(a => a.article._id);

      await Article.updateMany(
        { _id: { $in: paidArticleIds } },
        {
          $set: {
            retrocessionPaid: true,
            retrocessionPaidAt: latestSaleDate,
            retrocessionPaymentMethod: 'Espèces',
            retrocessionReference: 'Digitalisation historique'
          }
        }
      );
    }

    // Mark client as digitalized
    await Client.updateOne({ _id: clientId }, { $set: { isDigitalized: true } });

    res.status(201).json({ message: 'Fiche digitalisée avec succès.' });
  } catch (error: any) {
    console.error('Erreur lors de la digitalisation:', error?.message || error);
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ message: `Erreur de validation: ${error.message}` });
    }
    res.status(500).json({ message: 'Erreur interne du serveur.', detail: error?.message });
  }
};

async function generateBarcode(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    'barcode',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return String(counter.seq).padStart(7, '0');
}
