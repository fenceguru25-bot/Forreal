import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import promotionsRoutes from './routes/promotions';
import responsibleGamingRoutes from './routes/responsibleGaming';
import walletRoutes from './routes/wallet';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!process.env.ADMIN_EMAIL) {
  throw new Error('ADMIN_EMAIL must be configured before starting the backend');
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'forreal-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/responsible-gaming', responsibleGamingRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error(error);
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`ForReal backend listening on port ${port}`);
});
