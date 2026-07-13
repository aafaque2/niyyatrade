# Phase 6 — Production Checklist

> Status: Pre-Launch · Last updated: 2026-07-13

## Secrets & Keys

| Item | Status | Action Required |
|------|--------|----------------|
| `JWT_SECRET` | ⚠️ Dev value (`super-secret-kEy`) | Rotate before production deploy |
| `FMP_API_KEY` | ⚠️ Dev key in plain `.env` | Move to Vercel/AWS Secrets Manager |
| Database URL | ❌ Local Postgres | Set production connection string |

## Infrastructure

| Item | Status | Action Required |
|------|--------|----------------|
| CORS restricted to `FRONTEND_URL` | ✅ Done in `main.ts` | Verify production domain |
| Rate limiting (ThrottlerModule) | ✅ 100 req/min | Adjust based on traffic |
| PgBouncer / connection pooling | ❌ Not configured | Add to Docker Compose or use Prisma Accelerate |
| Sentry error tracking | ❌ Not configured | Create Sentry project, add `@sentry/node` |
| Pino structured logging | ❌ Default NestJS logger | Replace with `nestjs-pino` |
| Health check endpoint | ✅ `/api/v1/health` | Wire to PagerDuty / uptime monitor |

## Testing

| Type | Status | Notes |
|------|--------|-------|
| Backend unit tests | ⚠️ Partial (compliance plugins only) | Add trading, auth, history tests |
| E2E (Playwright) | ✅ Tests written at `frontend/e2e/` | Run with `npm run e2e` |
| Load (K6) | ✅ Script at `backend/test/load/compliance-load.js` | Run with `k6 run` |

## E2E Test Suite

```bash
cd frontend
npx playwright install chromium
npm run e2e
```

## Load Test

```bash
k6 run backend/test/load/compliance-load.js
```
