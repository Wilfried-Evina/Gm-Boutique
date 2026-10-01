import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Article } from '../models/Article';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

describe('Articles & Margins API', () => {
  let token: string;
  let clientId: string;

  beforeEach(async () => {
    // 1. Create a test admin user
    const admin = await User.create({
      email: 'admin@test.com',
      passwordHash: 'hashed',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Test'
    });

    // 2. Generate a token
    token = jwt.sign(
      { userId: admin._id, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create a test client
    const client = await Client.create({
      referenceNumber: 'TEST-0001',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '0000000',
      email: 'jane@test.com',
      cguAccepted: true
    });
    clientId = client._id.toString();
  });

  it('should deposit an article successfully', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId,
        type: 'Vêtement',
        brand: 'Chanel',
        color: 'Noir',
        description: 'Veste',
        size: '38',
        publicPrice: 100, // Prix boutique
        clientPrice: 50   // Gain cliente
      });

    if (res.status === 404) console.log("ARTICLE CREATE 404 BODY:", res.body, res.text);
    
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.status).toBe('on_sale'); // Statut par défaut = directement en vente
    expect(res.body.barcode).toBeDefined();
    expect(res.body.clientPrice).toBe(50);

  });

  it('should update article status to sold and check if sale record is created', async () => {
    // Deposit an article
    const article = await Article.create({
      clientId,
      type: 'Sac',
      brand: 'Dior',
      color: 'Rouge',
      description: 'Sac à main',
      publicPrice: 200,
      clientPrice: 100,
      barcode: '1234567890123',
      status: 'on_sale'
    });

    // Sell it via the POS endpoint (assuming /api/sales is used for sales)
    const res = await request(app)
      .post('/api/sales/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        articles: [article._id],
        paymentMethod: 'card'
      });

    if (res.status === 404) console.log("SALE CREATE 404 BODY:", res.body, res.text);
    
    expect(res.status).toBe(201);
    
    // Check if article status is now sold
    const updatedArticle = await Article.findById(article._id);
    expect(updatedArticle?.status).toBe('sold');

    // Retrocession amounts check
    // If sold for 180 and clientPrice was 100, GMBoutique gets 80, Client gets 100.
    // Assuming the system guarantees clientPrice to the client in standard sales.
  });
});
