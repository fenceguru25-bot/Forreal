# ForReal Casino - Phase 1 Scaffold

ForReal Casino is a sweepstakes casino monorepo scaffold built with a TypeScript Express backend and a Next.js App Router frontend. This Phase 1 setup includes player authentication, wallet and promotion flows, AMOE entry handling, responsible gaming controls, and an admin dashboard scaffold.

## Stack

- **Frontend:** Next.js App Router, React, Tailwind CSS
- **Backend:** Express, Prisma, PostgreSQL, JWT auth
- **Monorepo:** npm workspaces

## Project Structure

```text
backend/   Express API, Prisma schema, route handlers, middleware
frontend/  Next.js application with Tailwind styling
```

## Environment Setup

Copy `.env.example` to `.env` in the repository root and update values as needed:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - signing secret for API auth
- `JWT_EXPIRES_IN` - token lifetime
- `ADMIN_EMAIL` - email granted admin access
- `NEXT_PUBLIC_ADMIN_EMAIL` - frontend admin UI visibility override
- `NEXT_PUBLIC_API_URL` - frontend API base URL
- `FRONTEND_URL` - allowed frontend origin for backend CORS
- `PORT` - backend port

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev:backend
npm run dev:frontend
```

Or run both together:

```bash
npm run dev
```

## Backend Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify-email/:token`
- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `GET /api/games`
- `GET /api/games/:id`
- `GET /api/promotions`
- `POST /api/promotions/claim/:id`
- `POST /api/promotions/amoe`
- `GET /api/admin/players`
- `GET /api/admin/transactions`
- `POST /api/responsible-gaming/self-exclude`
- `POST /api/responsible-gaming/deposit-limit`
- `GET /api/responsible-gaming/status`

## Notes

- Welcome bonus logic awards **100 GC** and **1 SC** at registration.
- AMOE submissions award **0.5 SC** when matched to an existing account.
- Geoblocking is configured for `WA`, `ID`, `MI`, and `NV`.
- Prisma client generation was intentionally not run as part of this scaffold task.
