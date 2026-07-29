import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@gm-boutique/shared';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/register', authenticate, authorize([UserRole.ADMIN]), authController.register);
router.get('/me', authenticate, authController.me);

export const authRoutes = router;
