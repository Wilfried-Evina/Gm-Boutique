import { Router } from 'express';
import { receiptController } from '../controllers/receipt.controller';

const router = Router();

router.post('/', receiptController.create);
router.get('/client/:clientId', receiptController.getByClient);

export default router;
