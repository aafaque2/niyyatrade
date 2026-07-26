# NiyyaTrade Frontend

Next.js 16 application for the NiyyaTrade paper trading platform.

## Setup

```bash
npm install
cp .env.example .env.local   # Configure env vars
npm run dev
```

Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Lint source files |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., `http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for SEO |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Register |
| `/portfolio` | Portfolio dashboard |
| `/markets` | Browse & search equities |
| `/assets/[ticker]` | Asset detail (chart, compliance, trade) |
| `/watchlist` | Saved watchlist |
| `/frameworks` | Compliance frameworks |
| `/history` | Order & compliance history |
| `/settings` | User settings |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

## Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K` — Open command palette (search)
