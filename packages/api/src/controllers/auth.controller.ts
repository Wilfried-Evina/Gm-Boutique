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
};
