import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import cashappRoutes from './routes/cashapp';
import gameRoutes from './routes/games';
import leaderboardRoutes from './routes/leaderboard';
import userRoutes from './routes/user';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { registerGameSocketHandlers } from './socket/gameSocket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true
  }
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({
  verify: (req, _res, buffer) => {
    (req as Express.Request).rawBody = buffer.toString();
  }
}));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Spin Out server is healthy.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/cashapp', cashappRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

registerGameSocketHandlers(io);
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`Spin Out server listening on port ${port}`);
});
