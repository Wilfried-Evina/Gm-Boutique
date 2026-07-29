import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@gm-boutique/shared';
import rateLimit from 'express-rate-limit';

const router = Router();

// Limiteur strict pour le login (5 essais max toutes les 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes'
});

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/register', authenticate, authorize([UserRole.ADMIN]), authController.register);
router.get('/me', authenticate, authController.me);

export const authRoutes = router;
