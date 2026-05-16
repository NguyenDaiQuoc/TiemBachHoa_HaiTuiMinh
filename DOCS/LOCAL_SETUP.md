# Local Infrastructure Setup Guide

This guide explains how to set up the containerized infrastructure for the Hai Tụi Mình ecommerce platform.

## 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js 22](https://nodejs.org/) (for local development without Docker).

## 2. Infrastructure Architecture

The platform uses a containerized multi-tier architecture:

- **App**: Express.js + Vite (Node.js 22)
- **Database**: PostgreSQL 16 (Primary data store)
- **Cache**: Redis 7 (Speed & Session storage)

## 3. Quick Start with Docker

To spin up the entire infrastructure:

```bash
# 1. Clone the environment template
cp .env.example .env

# 2. Start the containers
docker-compose up -d

# 3. Apply database migrations
docker-compose exec app npx prisma migrate dev

# 4. Seed the database
docker-compose exec app npx tsx prisma/seed.ts
```

## 4. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Redis connection string | `redis://cache:6379` |
| `JWT_SECRET` | Secret key for auth tokens | - |
| `NODE_ENV` | Environment mode | `development` |

## 5. Environment Configuration Architecture

The platform uses a Next.js-inspired environment architecture to ensure security:

- **Server-only**: Variables like `DATABASE_URL` and `JWT_SECRET` are only available in the Node.js runtime.
- **Client-accessible**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser via Vite/Next.js.
- **Validation**: Environment variables are validated at startup using Zod in `src/shared/config/env.ts`.

### Usage:
- **Server**: Import `env` from `@shared/config/env`.
- **Client**: Use `clientEnv.get('NEXT_PUBLIC_...')` from `@shared/config/env`.

## 5. Manual Setup (Non-Docker)

If you prefer to run services manually:

1. **PostgreSQL**: Ensure a Postgres server is running on port 5432.
2. **Redis**: Ensure a Redis server is running on port 6379.
3. **Database**: 
   - Update `schema.prisma` provider to `sqlite` (if testing without Postgres).
   - Run `npx prisma migrate dev`.
4. **Start App**: `npm run dev`.

## 6. Health Checks

- **API**: `http://localhost:3000/api/health`
- **Frontend**: `http://localhost:3000`
- **Redis Check**: `docker-compose exec cache redis-cli ping`
- **Postgres Check**: `docker-compose exec db pg_isready`
