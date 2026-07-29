import { Router } from 'express';
import { articleController } from '../controllers/article.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', articleController.create);
router.get('/', articleController.getAll);
router.get('/:id', articleController.getById);
router.patch('/:id/status', articleController.updateStatus);
router.patch('/:id/validate-price', articleController.validatePrice);

export const articleRoutes = router;
