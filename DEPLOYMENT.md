# Deployment Guide

## Backend (Render)

### Prerequisites
- Render account
- PostgreSQL database (Render Managed Database or external)
- Redis instance (Render Redis or external)

### Steps

1. **Create a PostgreSQL database** on Render and note the connection URL.

2. **Create a Redis instance** on Render and note the connection URL.

3. **Create a new Web Service** on Render:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**:
     ```
     npm install && npx prisma generate
     ```
   - **Start Command**:
     ```
     npx prisma migrate deploy && node dist/main
     ```

4. **Configure environment variables** in Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=<your-postgres-url>?sslmode=require
   REDIS_URL=<your-redis-url>
   JWT_SECRET=<generate-a-strong-random-secret>
   FRONTEND_URL=<your-vercel-url>
   FMP_API_KEY=<optional-fmp-key>
   SENTRY_DSN=<optional-sentry-dsn>
   ```

5. **Deploy** — Render will build and start the service.

6. **Run initial migration** (first deploy only):
   - SSH into the Render shell or use the Render Dashboard terminal:
     ```
     npx prisma migrate deploy
     ```

### Notes
- `sslmode=require` is required for Render PostgreSQL connections from outside Render's network.
- Swagger docs are available at `https://<your-render-url>/docs`.
- Health check endpoints: `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`.

## Frontend (Vercel)

### Prerequisites
- Vercel account linked to GitHub

### Steps

1. **Import the repository** on Vercel:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `frontend`

2. **Configure environment variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://<your-render-url>/api/v1
   NEXT_PUBLIC_SITE_URL=https://<your-vercel-url>
   NEXT_PUBLIC_SENTRY_DSN=<optional-sentry-dsn>
   ```

3. **Deploy** — Vercel will build and deploy automatically.

4. **Set CORS** — Make sure `FRONTEND_URL` in the backend `.env` matches your Vercel deployment URL.

## Post-Deploy Checklist

- [ ] Verify backend health: `GET /api/v1/health`
- [ ] Verify Swagger docs: `GET /docs`
- [ ] Verify frontend loads and can register/login
- [ ] Verify market search returns results
- [ ] Verify compliance evaluation works
- [ ] Test paper trading (buy/sell order)
- [ ] Check Sentry is receiving errors (if configured)

## Custom Domain

### Vercel
1. Go to Settings → Domains in your Vercel project.
2. Add your custom domain and configure DNS.

### Render
1. Go to Settings → Custom Domains in your Render service.
2. Add the domain and update DNS CNAME record.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing (min 32 chars) |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `FMP_API_KEY` | No | Financial Modeling Prep API key (fallback provider) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `UPSTOX_ACCESS_TOKEN` | No | Upstox API token (Indian market provider) |
| `LOG_LEVEL` | No | Pino log level (default: info) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL for frontend |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for SEO sitemap |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for frontend error tracking |
