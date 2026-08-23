import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes document nécessitent d'être authentifié
router.use(authenticate);

router.post('/generate/client-profile/:clientId', documentController.generateClientProfile);
router.post('/generate/sales-report', documentController.generateSalesReport);
router.post('/generate/sales-report-csv', documentController.generateSalesReportCSV);
router.get('/client/:clientId', documentController.listByClient);
router.get('/:id/download', documentController.downloadDocument);
router.post('/:id/send-email', documentController.sendDocumentByEmail);
router.post('/client/:clientId/send-profile-email', documentController.sendClientProfileByEmail);

export default router;
