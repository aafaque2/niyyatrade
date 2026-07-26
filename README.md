# NiyyaTrade — Trade with Intentions. Invest with Ethics.

Paper trading platform with compliance analysis. Supports multiple compliance frameworks (AAOIFI Halal, ESG/Ethical, Standard), multi-currency portfolios, and real-time market data via Yahoo Finance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, lightweight-charts |
| Backend | NestJS 11, Prisma 7, PostgreSQL, Redis, TypeScript |
| Data | Yahoo Finance 2 (v4), Financial Modeling Prep (fallback) |
| Monitoring | Sentry (backend + frontend), Pino structured logging |
| Auth | JWT (access + refresh tokens) |

## Quick Start

### Prerequisites
- Node.js >= 22
- Docker (for Redis)
- PostgreSQL database

### Backend Setup
```bash
cd backend
cp .env.example .env          # Configure DATABASE_URL, REDIS_URL, JWT_SECRET
docker run -d --name niyyatrade-redis -p 6379:6379 redis:alpine
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local    # Set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm run dev
```

Open http://localhost:3000

## Project Structure

```
trading-platform/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # JWT authentication
│   │   │   ├── compliance/    # Rule engine + 3 frameworks
│   │   │   ├── health/        # Health check endpoints
│   │   │   ├── market-data/   # Yahoo Finance + FMP providers
│   │   │   ├── portfolio/     # Watchlist, settings
│   │   │   └── trading/       # Paper trading, orders
│   │   └── shared/            # Middleware, adapters, utils
│   └── prisma/
│       └── schema.prisma      # Database schema
├── frontend/                   # Next.js app
│   └── src/
│       ├── app/               # App router pages
│       ├── components/        # UI components
│       │   ├── asset/         # AssetHeader, KeyStats, FrameworkSelector
│       │   ├── charts/        # AssetChart (lightweight-charts)
│       │   ├── compliance/    # ComplianceCard, RuleAccordion
│       │   ├── framework/     # FrameworkCard, FrameworkDetail
│       │   ├── layout/        # Sidebar, TopNav, CommandPalette
│       │   ├── market/        # ExchangeBadge, MarketStatusBadge
│       │   ├── portfolio/     # DashboardSummary, PortfolioTable
│       │   ├── trading/       # OrderTicket
│       │   └── ui/            # shadcn components
│       ├── lib/
│       │   ├── hooks/         # React Query hooks
│       │   ├── services/      # API client + types
│       │   └── utils.ts       # Formatters, currency utils
│       └── middleware.ts      # Security headers
└── DEPLOYMENT.md              # Deployment guide
```

## Compliance Frameworks

- **Standard** — No filters applied. Educational/experimental use.
- **Ethical/ESG** — Sector-based (no weapons, gambling, etc.) + insufficient data warnings.
- **Halal (AAOIFI)** — Debt ratios, interest income, sector screening per AAOIFI standards.

## API Documentation

Swagger/OpenAPI docs available at `/docs` when the backend is running.

## Key Features

- Real-time market data with exchange badges (NASDAQ, NYSE, NSE, BSE, LSE, etc.)
- Multi-currency portfolio with FX conversion
- Market status indicators (Open, Closed, Pre-Market, After Hours)
- Compliance evaluation per asset with data coverage reporting
- Paper trading with simulated portfolio
- Responsive design (mobile-friendly)
- Keyboard-driven command palette (Cmd+K)

## License

Private — All rights reserved.
