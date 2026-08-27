import { Router } from 'express';
import { z } from 'zod';
import { RESTRICTED_STATES } from '../../../shared/src/constants';
import { authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { UserModel } from '../models/User';
import {
  comparePassword,
  deleteRefreshToken,
  generateJWT,
  generateRefreshToken,
  hashPassword,
  storeRefreshToken,
  verifyRefreshToken
} from '../services/authService';

const router = Router();
const baseSchema = { params: z.object({}), query: z.object({}) };

router.post('/register', authLimiter, validate(z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8),
    state: z.string().length(2).transform((value) => value.toUpperCase())
  }),
  ...baseSchema
})), async (req, res, next) => {
  try {
    const { username, email, password, state } = req.body;
    if ((RESTRICTED_STATES as readonly string[]).includes(state)) {
      res.status(403).json({ success: false, error: 'Residents of this state are not eligible.' });
      return;
    }
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account already exists for this email.' });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({ username, email, passwordHash, state });
    const token = generateJWT({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, validate(z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(8) }),
  ...baseSchema
})), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);
    if (!user || !user.passwordHash || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }
    if (user.selfExcluded) {
      res.status(403).json({ success: false, error: 'This account is self-excluded.' });
      return;
    }
    const token = generateJWT({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);
    res.json({ success: true, data: { user, token, refreshToken } });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(z.object({
  body: z.object({ userId: z.string().uuid(), refreshToken: z.string().min(20) }),
  ...baseSchema
})), async (req, res, next) => {
  try {
    const { userId, refreshToken } = req.body;
    const valid = await verifyRefreshToken(userId, refreshToken);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Refresh token is invalid.' });
      return;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }
    const token = generateJWT({ userId: user.id, email: user.email, role: user.role });
    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', validate(z.object({
  body: z.object({ userId: z.string().uuid(), refreshToken: z.string().min(20).optional() }),
  ...baseSchema
})), async (req, res, next) => {
  try {
    await deleteRefreshToken(req.body.userId);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
