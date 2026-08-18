import { Router } from 'express';
import { retrocessionController } from '../controllers/retrocession.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Routes spécifiques d'abord (évite toute ambiguïté de matching)
router.get('/', retrocessionController.listAll);
router.get('/stats', retrocessionController.getStats);
router.post('/pay', retrocessionController.pay);
router.post('/client/:clientId/mark-all-paid', retrocessionController.markAllPaid);
router.get('/client/:clientId', retrocessionController.getForClient);
router.post('/:articleId/mark-paid', retrocessionController.markPaid);

export default router;
