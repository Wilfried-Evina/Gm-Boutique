import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes client nécessitent d'être authentifié
router.use(authenticate);

router.post('/', clientController.create);
router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.put('/:id', clientController.update);
router.get('/:id/articles', clientController.getClientArticles);
router.get('/:id/retrocessions', clientController.getClientRetrocessions);

export const clientRoutes = router;
