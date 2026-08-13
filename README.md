# Engineering Foundry

Production-quality foundation for a software-engineering interview preparation and professional community platform.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 with a project-local component system
- Supabase authentication, SSR session refresh, profiles, and Row Level Security
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

See `.env.example` for the required variables and [`docs/supabase.md`](docs/supabase.md) for migrations, callback URLs, providers, and the production security checklist.

## Architecture

- `app/` — routes, metadata, SEO endpoints, and route-level states
- `components/` — reusable shell, navigation, search, cards, and tracking primitives
- `features/` — richer feature UI for auth, DSA, referrals, and resources
- `data/fixtures/` — clearly marked demo data
- `config/` — site-wide navigation, brand, and external URLs
- `lib/` — analytics, Supabase, and shared utilities
- `supabase/migrations/` — deterministic database schema, trigger, grant, and RLS changes
- `types/` — reusable product domain types

Authentication remains inactive until a Supabase project is configured and the committed migrations are applied. The foundation intentionally excludes payments and future feature schemas for referrals, matching, progress, challenges, and messaging.
