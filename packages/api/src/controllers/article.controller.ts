import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Article } from '../models/Article';
import { Client } from '../models/Client';
import { PaginatedResponse, ArticleStatus, ActionOnExpiry } from '@gm-boutique/shared';
import crypto from 'crypto';

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
  }
};
