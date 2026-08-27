# Engineering Foundry

Engineering Foundry is a public-content-first software-engineering interview preparation product built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Supabase.

## Product surfaces

The public product includes DSA curricula, roadmaps, question and company guides; System Design and ML Design learning paths and practice material; Behavioral, Low-Level Design, salary-negotiation, interview-strategy, mock-interview, company, resource, community, and interview-experience guidance.

Authenticated capabilities include onboarding, applications and interview rounds, preparation plans and progress, Behavioral stories and answers, System Design practice attempts, reminders and calendar exports, feedback linkage, data export, account deletion, and restricted admin operations. Those capabilities depend on Supabase ownership/RLS controls and the explicit `NEXT_PUBLIC_ACCOUNTS_ENABLED` gate. The release candidate keeps that gate set to `false`: public learning remains available while account entry points fail closed.

## Local development

Use Node.js `22.13.0` and npm `10.9.2` as pinned by `.nvmrc` and `package.json`.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. Real credentials and hosted environment values must stay outside the repository.

## Canonical release verification

The same checked-in verification manifest drives local release qualification and CI.

```bash
npm run qualify:static       # clean install, lint, typecheck, static regressions
npm run qualify:database     # local stack, clean reset, lint, pgTAP, auth/RLS qualifiers
npm run qualify:production   # next build, links, built-route/header smoke
npm run release:verify       # clean install and all three lanes with cleanup
```

The production command is `next build`: a **Next.js production build using Turbopack**. Database qualification uses the exact local `supabase@2.115.0` dev dependency and refuses non-local Supabase URLs.

Local verification proves repository behavior only. It does not prove hosted Supabase configuration, DNS/TLS, deployment settings, OAuth/SMTP providers, backups, production secrets, analytics consent or PostHog configuration, live accessibility/performance, or production operations.

## Release and deployment status

This repository describes a v1 release candidate; it does not claim that the candidate is deployed or hosted-production-qualified. The internal npm package version remains `0.1.0` and is intentionally separate from the product's “v1 release candidate” terminology.

- [Production launch checklist](docs/production-launch-checklist.md)
- [Production operations runbook](docs/production-operations-runbook.md)
- [Generated release-candidate record](docs/releases/v1-release-candidate.md)

## Repository map

- `app/` — routes, metadata, SEO endpoints, APIs, and route-level states
- `components/` and `features/` — product UI and feature modules
- `config/` and `data/` — navigation, public content, catalogs, and fixtures
- `lib/` — account, analytics, security, Supabase, and shared utilities
- `scripts/` — the canonical release verifier and focused regression checks
- `supabase/migrations/` and `supabase/tests/` — forward-only schemas, grants, RLS/RPC controls, and pgTAP coverage
- `docs/` — product models, privacy/security boundaries, qualification, and release operations

See [.env.example](.env.example) for the public configuration contract and [docs/supabase.md](docs/supabase.md) for local database setup. Licensing remains an explicit owner decision; no open-source license is granted by this repository.
