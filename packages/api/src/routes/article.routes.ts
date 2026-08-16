import { Router } from 'express';
import { articleController } from '../controllers/article.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', articleController.create);
router.get('/', articleController.getAll);
router.get('/suggestions', articleController.getSuggestions);
router.get('/expired', articleController.getExpired);
router.get('/scan/:barcode', articleController.getByBarcode);
router.get('/:id', articleController.getById);
router.get('/:id/barcode', articleController.getBarcodeImage);
router.put('/:id', articleController.update);
router.patch('/:id/status', articleController.updateStatus);
router.patch('/:id/validate-price', articleController.validatePrice);

export const articleRoutes = router;
