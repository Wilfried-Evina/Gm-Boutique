import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Routes protégées
router.use(authenticate);

router.post('/checkout', saleController.checkout);
router.post('/historical-full', saleController.createHistoricalGodMode);
router.get('/', saleController.getAll);

export default router;
