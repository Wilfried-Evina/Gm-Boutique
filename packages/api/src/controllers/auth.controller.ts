import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyToken, JwtPayload } from '../utils/jwt';
import { UserRole } from '@gm-boutique/shared';
import { logger } from '../utils/logger';

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      const user = new User({
        email: data.email,
        passwordHash: data.password, // Hook hashes it
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.GERANTE,
      });

      await user.save();

      res.status(201).json({ message: 'User registered successfully', userId: user._id });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);

      const user = await User.findOne({ email: data.email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(data.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const payload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.json({
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      const decoded = verifyToken(refreshToken);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const payload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user?.userId).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        // Pour des raisons de sécurité, on ne dit pas si l'utilisateur existe ou non
        return res.json({ message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.' });
      }

      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure

      await user.save();

      const { env } = await import('../config/env');
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const { mailService } = await import('../services/mail.service');
      const targetEmail = user.role === 'admin' ? env.SMTP_USER : user.email;
      await mailService.sendPasswordResetEmail(targetEmail, resetUrl);

      res.json({ message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit faire au moins 6 caractères' });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Le lien de réinitialisation est invalide ou a expiré' });
      }

      user.passwordHash = newPassword; // Will be hashed by pre-save hook
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      next(error);
    }
  },
};
