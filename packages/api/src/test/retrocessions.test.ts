import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Article } from '../models/Article';
import { Sale } from '../models/Sale';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

describe('Retrocessions API', () => {
  let token: string;
  let clientId: string;

  beforeEach(async () => {
    const admin = await User.create({
      email: 'admin_retro@test.com',
      passwordHash: 'hashed',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Test'
    });

    token = jwt.sign(
      { userId: admin._id, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const client = await Client.create({
      referenceNumber: 'TEST-RETRO',
      firstName: 'Marie',
      lastName: 'Curie',
      phone: '0000000',
      email: 'marie@test.com',
      cguAccepted: true
    });
    clientId = client._id.toString();
  });

  it('should list retrocessions correctly and mark them as paid', async () => {
    // 1. Create an article
    const article = await Article.create({
      clientId,
      type: 'Chaussures',
      brand: 'Louboutin',
      color: 'Noir',
      description: 'Escarpins',
      publicPrice: 500,
      clientPrice: 300,
      barcode: '1234567890124',
      status: 'sold'
    });

    // 2. Create a sale (to simulate it was sold)
    await Sale.create({
      reference: 'SALE-001',
      articles: [article._id],
      paymentMethod: 'card',
      totalAmount: 500
    });

    // 3. Get retrocession summary for the client
    let res = await request(app)
      .get(`/api/retrocessions/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalArticlesSold).toBe(1);
    expect(res.body.totalRetrocessions).toBe(300);
    expect(res.body.totalPaid).toBe(0);
    expect(res.body.remainingToPay).toBe(300);

    // 4. Mark as paid
    res = await request(app)
      .post(`/api/retrocessions/${article._id}/mark-paid`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.remainingToPay).toBe(0);
    expect(res.body.totalPaid).toBe(300);
    
    // Check article status in DB
    const updatedArticle = await Article.findById(article._id);
    expect(updatedArticle?.retrocessionPaid).toBe(true);
  });
});
