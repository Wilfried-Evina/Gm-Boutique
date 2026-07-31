import { Request, Response, NextFunction } from 'express';
import { Sale } from '../models/Sale';
import { Article } from '../models/Article';
import { Counter } from '../models/Counter';
import { CreateSaleDTO, CreateHistoricalGodModeDTO } from '@gm-boutique/shared';
import { Client } from '../models/Client';
import crypto from 'crypto';

export const saleController = {
  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const { articles, paymentMethod } = req.body as CreateSaleDTO;

      if (!articles || articles.length === 0) {
        return res.status(400).json({ message: 'Panier vide' });
      }

      // Fetch all articles
      const articlesToSell = await Article.find({ _id: { $in: articles } });
      
      if (articlesToSell.length !== articles.length) {
        return res.status(400).json({ message: 'Un ou plusieurs articles sont introuvables' });
      }

      let totalAmount = 0;
      for (const article of articlesToSell) {
        if (article.status !== 'on_sale') {
          return res.status(400).json({ message: `L'article ${article.barcode} n'est pas en vente` });
        }

        let finalSale = article.publicPrice;
        let finalClient = article.clientPrice;

        if (article.priceReduction && new Date(article.priceReduction.deadlineDate) < new Date()) {
          if (article.priceReduction.actionOnExpiry === 'return_to_client') {
            return res.status(400).json({ message: `L'article ${article.barcode} est expiré et doit être restitué à la cliente.` });
          } else if (article.priceReduction.actionOnExpiry === 'reduce_price') {
            finalSale = article.priceReduction.reducedPublicPrice;
            finalClient = article.priceReduction.reducedClientPrice;
          }
        }

        article.finalSalePrice = finalSale;
        article.finalClientAmount = finalClient;
        article.status = 'sold' as any;
        
        totalAmount += finalSale;
      }

      // Generate reference (e.g. TKT-20231015-001)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const counter = await Counter.findByIdAndUpdate(
        `sale_${dateStr}`,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seq = counter.seq.toString().padStart(3, '0');
      const reference = `TKT-${dateStr}-${seq}`;

      // Create the sale
      const sale = new Sale({
        reference,
        articles,
        totalAmount,
        paymentMethod
      });

      await sale.save();

      // Update articles statuses and final prices
      await Promise.all(articlesToSell.map(article => article.save()));

      // Populate the newly created sale
      const populatedSale = await Sale.findById(sale._id).populate({
        path: 'articles',
        populate: {
          path: 'clientId'
        }
      });

      res.status(201).json(populatedSale);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const sales = await Sale.find().sort({ createdAt: -1 }).populate({
        path: 'articles',
        populate: {
          path: 'clientId'
        }
      });
      res.status(200).json(sales);
    } catch (error) {
      next(error);
    }
  },

  async createHistoricalGodMode(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreateHistoricalGodModeDTO;
      
      const saleDate = new Date(data.date);

      // 1. Find or Create Client
      let client = null;
      if (data.client.email) {
        client = await Client.findOne({ email: data.client.email });
      }
      if (!client && data.client.phone) {
        client = await Client.findOne({ phone: data.client.phone });
      }
      
      if (!client) {
        // Create Client
        const dateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const counter = await Counter.findByIdAndUpdate(
          `client_${dateStr}`,
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        const seq = counter.seq.toString().padStart(3, '0');
        const referenceNumber = `CLI-${dateStr}-${seq}`;

        client = new Client({
          ...data.client,
          referenceNumber,
          createdAt: saleDate, // Backdate client
          updatedAt: saleDate
        });
        await client.save();
      }

      // 2. Create Article
      const barcode = `GM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const article = new Article({
        clientId: client._id,
        brand: data.article.brand,
        type: data.article.type,
        color: data.article.color,
        publicPrice: data.article.publicPrice,
        clientPrice: data.article.clientPrice,
        barcode,
        status: 'sold', // Mark as sold immediately
        createdAt: saleDate, // Backdate article
        updatedAt: saleDate
      });
      await article.save();

      // 3. Create Sale
      const dateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, '');
      const counter = await Counter.findByIdAndUpdate(
        `sale_${dateStr}`,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seq = counter.seq.toString().padStart(3, '0');
      const reference = `TKT-${dateStr}-${seq}`;

      const sale = new Sale({
        reference,
        articles: [article._id],
        totalAmount: data.article.publicPrice,
        paymentMethod: data.paymentMethod,
        createdAt: saleDate, // Backdate sale
        updatedAt: saleDate
      });

      await sale.save();

      const populatedSale = await Sale.findById(sale._id).populate({
        path: 'articles',
        populate: {
          path: 'clientId'
        }
      });

      res.status(201).json(populatedSale);
    } catch (error) {
      next(error);
    }
  }
};
