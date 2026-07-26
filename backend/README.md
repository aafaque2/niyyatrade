# NiyyaTrade Backend

NestJS API for the NiyyaTrade paper trading platform.

## Setup

```bash
npm install
cp .env.example .env   # Configure env vars
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in development mode with watch |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint source files |

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Log in
- `GET /api/v1/auth/me` — Get current user (JWT required)

### Market Data
- `GET /api/v1/market-data/search?q=...` — Search assets
- `GET /api/v1/market-data/fx?from=X&to=Y` — Get FX rate
- `GET /api/v1/market-data/:ticker/quote` — Get quote
- `GET /api/v1/market-data/:ticker/fundamentals` — Get fundamentals
- `GET /api/v1/market-data/:ticker/candles` — Get chart data

### Portfolio (JWT required)
- `GET /api/v1/portfolio` — Get portfolio
- `POST /api/v1/portfolio/orders` — Execute paper order
- `POST /api/v1/portfolio/reset` — Reset portfolio

### Compliance
- `GET /api/v1/compliance` — List frameworks
- `GET /api/v1/compliance/evaluate?ticker=X&frameworkId=Y` — Evaluate asset

### Health
- `GET /api/v1/health` — Full health check
- `GET /api/v1/health/live` — Liveness probe
- `GET /api/v1/health/ready` — Readiness probe

### Docs
- `GET /docs` — Swagger/OpenAPI documentation

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run e2e tests (requires running server)
npm run test:e2e
```
