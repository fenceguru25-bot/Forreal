import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import { randomBytes } from 'crypto';

import prisma from '../config/database';
import { signToken } from '../config/jwt';
import { geoblock } from '../middleware/geoblock';

const router = Router();

const sanitizeUser = (user: Record<string, any>) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  state: user.state,
  accountTier: user.accountTier,
  kycStatus: user.kycStatus,
  emailVerified: user.emailVerified,
  isSelfExcluded: user.isSelfExcluded,
  selfExcludedUntil: user.selfExcludedUntil,
  depositLimit: user.depositLimit,
  createdAt: user.createdAt,
});

router.post(
  '/register',
  geoblock,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
    body('dateOfBirth').isISO8601().withMessage('dateOfBirth must be a valid ISO date'),
    body('state')
      .isLength({ min: 2, max: 2 })
      .withMessage('State must be a 2-letter US code')
      .customSanitizer((value) => String(value).toUpperCase()),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, firstName, lastName, dateOfBirth, state } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(409).json({ error: 'An account with that email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const verifyToken = randomBytes(24).toString('hex');

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          state,
          verifyToken,
          wallet: {
            create: {
              gcBalance: 100,
              scBalance: 1,
            },
          },
          transactions: {
            create: [
              {
                type: 'BONUS',
                currency: 'GC',
                amount: 100,
                description: 'Welcome bonus awarded at registration',
              },
              {
                type: 'BONUS',
                currency: 'SC',
                amount: 1,
                description: 'Welcome sweepstakes bonus awarded at registration',
              },
            ],
          },
        },
        include: {
          wallet: true,
        },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        accountTier: user.accountTier,
      });

      return res.status(201).json({
        token,
        user: sanitizeUser(user),
        wallet: user.wallet,
        message: 'Registration successful. Welcome bonus credited.',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Unable to complete registration' });
    }
  },
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { wallet: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isCurrentlySelfExcluded =
        user.isSelfExcluded && (!user.selfExcludedUntil || user.selfExcludedUntil > new Date());

      if (isCurrentlySelfExcluded) {
        return res.status(403).json({ error: 'This account is currently self-excluded' });
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        accountTier: user.accountTier,
      });

      return res.json({
        token,
        user: sanitizeUser(user),
        wallet: user.wallet,
        message: 'Login successful',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Unable to log in' });
    }
  },
);

router.get(
  '/verify-email/:token',
  [param('token').isString().notEmpty().withMessage('Verification token is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await prisma.user.findFirst({
        where: { verifyToken: req.params.token },
      });

      if (!user) {
        return res.status(404).json({ error: 'Verification token not found' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verifyToken: null,
        },
      });

      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Unable to verify email' });
    }
  },
);

export default router;
