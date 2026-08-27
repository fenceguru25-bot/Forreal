# 🎰 Spin Out – Sweepstakes Casino

A fully automated, full-stack sweepstakes casino application featuring slot games, table games, and CashApp payments.

## Features

- **6 Slot Games** – Lucky Sevens, Fruit Frenzy, Diamond Rush, Wild West, Cosmic Spin, Gold Rush
- **3 Table Games** – Blackjack, Roulette (American), Baccarat
- **Provably Fair RNG** – HMAC-SHA256 slot engine with auditable seeds
- **CashApp Payments** – Pay via `$FENCEGUEULLC` to purchase Gold Coins
- **Sweepstakes Model** – Gold Coins (social play) + Sweepstakes Coins (redeemable prizes)
- **Real-time Leaderboard** – Socket.io + Redis sorted sets
- **Daily Bonus** – Free Sweepstakes Coin every 24 hours
- **Admin Panel** – User management, stats, manual balance adjustment
- **Responsible Gaming** – Self-exclusion, state restrictions, NCPG resources

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL 15 |
| Cache/Sessions | Redis 7 |
| Auth | JWT + bcrypt, refresh tokens |
| Payments | CashApp Pay (cashtag: `$FENCEGUEULLC`) |
| Deploy | Docker + docker-compose |

## Quick Start (Docker)

```bash
# 1. Clone and navigate to spin-out
cd spin-out

# 2. Copy env file
cp .env.example .env
# Edit .env with your secrets

# 3. Launch everything
docker compose up --build

# App available at:
# Frontend: http://localhost:5173
# Backend:  http://localhost:4000
# Health:   http://localhost:4000/health
```

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

```bash
# Install dependencies
npm install

# Run migrations
psql -U spinout spinout < migrations/001_initial.sql
psql -U spinout spinout < migrations/002_game_sessions.sql

# Start dev servers (both client + server)
npm run dev
```

## Project Structure

```
spin-out/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI + game components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── store/          # Zustand state management
├── server/                 # Express backend
│   └── src/
│       ├── routes/         # API route handlers
│       ├── services/       # Game engines + business logic
│       ├── models/         # Database models
│       ├── middleware/      # Auth, rate limiting, validation
│       └── socket/         # Socket.io event handlers
├── shared/                 # Shared TypeScript types + constants
├── migrations/             # PostgreSQL schema migrations
└── docker-compose.yml      # Production deployment
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh JWT |
| GET | `/api/user/profile` | Get user profile + balance |
| POST | `/api/user/daily-bonus` | Claim daily SC bonus |
| POST | `/api/games/slots/spin` | Spin slot machine |
| POST | `/api/games/blackjack/start` | Start blackjack hand |
| POST | `/api/games/blackjack/action` | Hit/Stand/Double |
| POST | `/api/games/roulette/spin` | Spin roulette |
| POST | `/api/games/baccarat/deal` | Deal baccarat hand |
| GET | `/api/cashapp/packages` | List coin packages |
| POST | `/api/cashapp/create-payment` | Create CashApp payment |
| POST | `/api/cashapp/webhook` | CashApp payment webhook |
| GET | `/api/leaderboard/daily` | Daily top 20 |
| GET | `/api/leaderboard/weekly` | Weekly top 20 |

## CashApp Payment Flow

1. User selects a coin package in the Cashier
2. Backend returns payment URL: `https://cash.app/$FENCEGUEULLC/{amount}`
3. User sends payment via CashApp
4. CashApp webhook → backend verifies HMAC-SHA256 signature → credits user balance

## Sweepstakes Compliance

- **No Purchase Necessary** – Free daily Sweepstakes Coins + mail-in entry
- **State Restrictions** – WA, ID, MI, NV, KY, AR blocked at registration
- **18+ Only** – Age confirmation required at registration
- **Responsible Gaming** – Self-exclusion, NCPG hotline (1-800-522-4700)
- **Terms & Conditions** – Full sweepstakes rules at `/terms`

## Environment Variables

```env
DATABASE_URL=******localhost:5432/spinout
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars
CASHAPP_WEBHOOK_SECRET=your-cashapp-webhook-secret
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Legal Notice

> This application is a sweepstakes promotion. No purchase is necessary to enter or win.
> Sweepstakes Coins have no monetary value and cannot be purchased directly.
> Gold Coins are for entertainment only. See `/terms` for official rules.
> Consult qualified legal counsel before deploying to ensure compliance with applicable state laws.

---

Built with ❤️ | CashApp: **$FENCEGUEULLC**
