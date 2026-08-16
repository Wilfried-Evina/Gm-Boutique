import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

router.get('/cgu', settingsController.getCgu);

export default router;
