import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Client } from '../models/Client';
import { PaginatedResponse } from '@gm-boutique/shared';

// Schemas
const createClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  cguAccepted: z.boolean().default(false),
  signatureData: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

export const clientController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createClientSchema.parse(req.body);

      // Check unique phone
      const existingClient = await Client.findOne({ phone: data.phone });
      if (existingClient) {
         return res.status(400).json({ message: 'A client with this phone number already exists.' });
      }

      const client = new Client({
        ...data,
        cguAcceptedAt: data.cguAccepted ? new Date() : undefined,
      });

      await client.save();
      res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const query: any = {};
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { phone: searchRegex },
          { referenceNumber: searchRegex }
        ];
      }

      const skip = (page - 1) * limit;

      const clients = await Client.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Client.countDocuments(query);

      res.json({
        data: clients,
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
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateClientSchema.parse(req.body);
      
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check phone uniqueness if updated
      if (data.phone && data.phone !== client.phone) {
          const existingClient = await Client.findOne({ phone: data.phone });
          if (existingClient) {
             return res.status(400).json({ message: 'A client with this phone number already exists.' });
          }
      }

      // Update fields
      if (data.firstName) client.firstName = data.firstName;
      if (data.lastName) client.lastName = data.lastName;
      if (data.phone) client.phone = data.phone;
      if (data.email !== undefined) client.email = data.email;
      if (data.address !== undefined) client.address = data.address;
      
      // Handle CGU acceptance if changing from false to true
      if (data.cguAccepted !== undefined && data.cguAccepted !== client.cguAccepted) {
         client.cguAccepted = data.cguAccepted;
         if (data.cguAccepted) {
            client.cguAcceptedAt = new Date();
         } else {
            client.cguAcceptedAt = undefined;
         }
      }

      if (data.signatureData) client.signatureData = data.signatureData;

      await client.save();
      res.json(client);
    } catch (error) {
      next(error);
    }
  }
};
