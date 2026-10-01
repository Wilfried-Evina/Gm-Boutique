import { Router } from 'express';
import { receiptController } from '../controllers/receipt.controller';

const router = Router();

router.post('/', receiptController.create);
router.get('/client/:clientId', receiptController.getByClient);
router.get('/:id/pdf', receiptController.getPdf);
router.post('/:id/send-email', receiptController.sendByEmail);

export default router;

