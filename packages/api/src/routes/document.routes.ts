import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes document nécessitent d'être authentifié
router.use(authenticate);

router.post('/generate/client-profile/:clientId', documentController.generateClientProfile);
router.post('/generate/sales-report', documentController.generateSalesReport);
router.get('/:id/download', documentController.downloadDocument);

export default router;
