import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { DocumentModel } from '../models/Document';
import { Client } from '../models/Client';
import { pdfService } from '../services/pdf.service';
import { logger } from '../utils/logger';

export const documentController = {
  async generateClientProfile(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente introuvable." });
      }

      const fileUrl = await pdfService.generateClientProfile(client as any);

      // Return the generated document record
      const doc = await DocumentModel.findOne({ fileUrl });
      res.status(201).json(doc);
    } catch (error) {
      logger.error('Error generating client profile PDF:', error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF." });
    }
  },
  async generateSalesReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate et endDate sont requis." });
      }

      const fileUrl = await pdfService.generateSalesReportPDF(new Date(startDate), new Date(endDate));

      // Return the generated document record
      const doc = await DocumentModel.findOne({ fileUrl });
      res.status(201).json(doc);
    } catch (error) {
      logger.error('Error generating sales report PDF:', error);
      res.status(500).json({ message: "Erreur lors de la génération du rapport.", details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    }
  },

  async listByClient(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const documents = await DocumentModel.find({ clientId }).sort({ createdAt: -1 });
      res.json(documents);
    } catch (error) {
      logger.error('Error listing client documents:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des documents." });
    }
  },

  async downloadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findById(id);

      if (!doc) {
        return res.status(404).json({ message: "Document introuvable." });
      }

      // fileUrl is like /uploads/documents/filename.pdf
      const filePath = path.join(__dirname, '../../', doc.fileUrl);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Le fichier physique n'existe plus sur le serveur." });
      }

      res.download(filePath, `GM_Boutique_${doc.type}_${doc.referenceNumber}.pdf`);
    } catch (error) {
      logger.error('Error downloading document:', error);
      res.status(500).json({ message: "Erreur lors du téléchargement." });
    }
  }
};
