# Engineering Foundry

Production-quality foundation for a software-engineering interview preparation and professional community platform.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 with a project-local component system
- Supabase browser/server client adapters
- Centralized PostHog initialization and typed product events
- Lucide icons

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Configuration

All public configuration lives in `.env.local`. The site remains fully browsable without Supabase or PostHog keys; authentication and analytics activate only after they are configured.

See `.env.example` for the required variables.

## Architecture

- `app/` — routes, metadata, SEO endpoints, and route-level states
- `components/` — reusable shell, navigation, search, cards, and tracking primitives
- `features/` — richer feature UI for auth, DSA, referrals, and resources
- `data/fixtures/` — clearly marked demo data
- `config/` — site-wide navigation, brand, and external URLs
- `lib/` — analytics, Supabase, and shared utilities
- `types/` — reusable product domain types

The foundation intentionally excludes real educational content, payments, database schemas, and production authentication flows.
