import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Article } from '../models/Article';
import { Client } from '../models/Client';
import { PaginatedResponse, ArticleStatus, ActionOnExpiry } from '@gm-boutique/shared';
import crypto from 'crypto';
import bwipjs from 'bwip-js';

// Validation Schemas
const priceReductionSchema = z.object({
  deadlineDate: z.string().transform(str => new Date(str)),
  reducedPublicPrice: z.number().min(0),
  reducedClientPrice: z.number().min(0),
  actionOnExpiry: z.nativeEnum(ActionOnExpiry),
});

const createArticleSchema = z.object({
  clientId: z.string(),
  brand: z.string().min(1),
  type: z.string().min(1),
  color: z.string().min(1),
  size: z.string().optional(),
  season: z.string().optional(),
  description: z.string().optional(),
  clientPrice: z.number().min(0),
  publicPrice: z.number().min(0),
  priceReduction: priceReductionSchema.optional(),
});

export const articleController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createArticleSchema.parse(req.body);

      // Verify client exists
      const client = await Client.findById(data.clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Generate a unique barcode (temporary simple generation, will be refined in Issue #17)
      const barcode = `GM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const article = new Article({
        ...data,
        barcode,
      });

      await article.save();
      res.status(201).json(article);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const clientId = req.query.clientId as string;

      const query: any = {};
      if (status) query.status = status;
      if (clientId) query.clientId = clientId;

      const skip = (page - 1) * limit;

      const articles = await Article.find(query)
        .populate('clientId', 'firstName lastName referenceNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Article.countDocuments(query);

      res.json({
        data: articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      } as PaginatedResponse<any>);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await Article.findById(req.params.id).populate('clientId');
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      res.json(article);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = z.object({ status: z.nativeEnum(ArticleStatus) }).parse(req.body);
      
      const article = await Article.findById(req.params.id);
      if (!article) return res.status(404).json({ message: 'Article not found' });

      article.status = status;
      await article.save();
      
      res.json(article);
    } catch (error) {
      next(error);
    }
  },

  async validatePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { finalSalePrice, finalClientAmount } = z.object({
        finalSalePrice: z.number().min(0),
        finalClientAmount: z.number().min(0)
      }).parse(req.body);

      const article = await Article.findById(req.params.id);
      if (!article) return res.status(404).json({ message: 'Article not found' });

      article.finalSalePrice = finalSalePrice;
      article.finalClientAmount = finalClientAmount;
      article.status = ArticleStatus.SOLD;
      
      await article.save();
      res.json(article);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createArticleSchema.partial().parse(req.body);
      const article = await Article.findById(req.params.id);
      
      if (!article) return res.status(404).json({ message: 'Article not found' });
      
      if (data.brand) article.brand = data.brand;
      if (data.type) article.type = data.type;
      if (data.color) article.color = data.color;
      if (data.size !== undefined) article.size = data.size;
      if (data.season !== undefined) article.season = data.season;
      if (data.description !== undefined) article.description = data.description;
      if (data.clientPrice !== undefined) article.clientPrice = data.clientPrice;
      if (data.publicPrice !== undefined) article.publicPrice = data.publicPrice;
      if (data.priceReduction !== undefined) article.priceReduction = data.priceReduction;

      await article.save();
      res.json(article);
    } catch (error) {
      next(error);
    }
  },

  async getByBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await Article.findOne({ barcode: req.params.barcode }).populate('clientId');
      if (!article) return res.status(404).json({ message: 'Article not found' });
      res.json(article);
    } catch (error) {
      next(error);
    }
  },

  async getExpired(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const expiredArticles = await Article.find({
        'priceReduction.deadlineDate': { $lt: now },
        status: { $in: [ArticleStatus.DEPOSITED, ArticleStatus.ON_SALE] }
      }).populate('clientId', 'firstName lastName phone');
      
      res.json(expiredArticles);
    } catch (error) {
      next(error);
    }
  },

  async getBarcodeImage(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await Article.findById(req.params.id);
      if (!article) return res.status(404).json({ message: 'Article not found' });

      bwipjs.toBuffer({
        bcid: 'code128',
        text: article.barcode,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      }, (err, png) => {
        if (err) {
          return next(err);
        } else {
          res.set('Content-Type', 'image/png');
          res.send(png);
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
