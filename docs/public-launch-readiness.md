# Public Launch Readiness

## Readiness classification

**PUBLIC LAUNCH READY WITH MANUAL ITEMS**

The credential-free, content-first public site is technically and product-integrity ready. The authenticated platform is **NOT QUALIFIED** and accounts must remain disabled until the deferred qualification work is complete.

## Baseline

- Approved starting commit: `bbc9061eead8709b15fd25c630f6d4a5fe07ca9d`
- Branch under review: `main`
- Scope: public-launch preparation only; no deployment, DNS, hosted Supabase, OAuth, or production environment changes were made.

## Public product inventory

The supported public launch includes:

- DSA topics and problems
- System Design problems
- ML Design problems
- Behavioral preparation
- Interview Playbook
- Resources
- Mock Interview Practice Lab
- Referral Toolkit
- Challenge Lab
- Community Hub
- Recognition Preview at the compatibility route `/leaderboard`
- Interview Experience Write-up Builder
- Company preparation pages

The browser-only practice and writing tools do not persist private drafts to local storage, IndexedDB, Supabase, or another backend.

## Public launch configuration

Accounts default to disabled. They become available only when both conditions are true:

1. `NEXT_PUBLIC_ACCOUNTS_ENABLED` is exactly `true`.
2. Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.

The supported public configuration has no Supabase variables, no PostHog variables, no contact email, and `NEXT_PUBLIC_ACCOUNTS_ENABLED=false`. In this mode:

- account CTAs are absent from desktop and mobile navigation;
- auth, onboarding, dashboard, and settings routes display an intentional unavailable state instead of active forms;
- profile routes fail safely without a database dependency;
- PostHog is a no-op and does not block interaction;
- Contact presents Discord and the public repository's GitHub Issues page; email appears only when `NEXT_PUBLIC_CONTACT_EMAIL` is explicitly configured.

## Automated evidence

The following checks passed locally:

- clean-baseline recovery gate against the approved commit
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- all pre-existing content, interview, mock, referral, challenge, recognition, and experience tests
- all pre-existing content, design, interview, mock, referral, community, and experience validators
- `npm run test:public-launch-integrity`
- `npm run validate:public-links`
- credential-free production build using the webpack builder
- `npm run test:public-routes`
- account-enabled compile/build compatibility with placeholder public configuration
- `npm audit --omit=dev` with zero vulnerabilities
- tracked-secret pattern scan with no findings; `.env.local` remains ignored

The local managed sandbox prevents Turbopack's build worker from binding a port. The production build therefore used Next.js's webpack builder locally and passed. The repository's GitHub Actions workflow retains the normal `npm run build` command so the final pushed commit is validated with the default builder in an unrestricted CI runner. The final GitHub Actions result is recorded in the Prompt 11 handoff because a commit cannot contain its own resulting check status.

## Manual QA

- Checked the homepage and major public routes at 320, 375, 430, and 768 CSS pixels; no horizontal page overflow was found.
- Checked mobile navigation at all target widths, including its scroll behavior at 320 pixels.
- Checked desktop dropdown keyboard behavior and mobile navigation grouping.
- Checked the global search dialog: initial focus, Tab and Shift+Tab wrapping, Escape close, and trigger-focus restoration.
- Checked representative public routes and interactive builders in light and dark themes.
- Exercised the Interview Experience Builder through round creation, guidance, safety acknowledgements, summary generation, and copy-ready state.
- Verified Contact has no fake form and renders only working configured channels.
- Verified the disabled sign-in experience has no active auth form or account CTA.
- Observed no application PostHog, Supabase, or uncaught console errors in public mode. Grammarly-generated hydration attributes were identified as browser-extension injection, not application markup.

## Integrity audit summary

- Primary CTAs resolve to real public pages or working browser-only tools; unavailable account actions are not advertised.
- Launch-facing demo and placeholder artifacts were removed or rewritten. Accurate explanations of future functionality remain where appropriate.
- `1,000+ community members` remains the only external social-proof figure and is described as community membership, not activity.
- Other visible totals are repository-derived content counts. No fabricated usage, solve, referral, submission, or ranking counts were introduced.
- Recognition is the visible product name; `/leaderboard` remains only as a compatibility route.
- Sitemap and search exclude auth/private utility flows and retain substantive public content.
- Canonicals, descriptions, Open Graph metadata, referenced OG images, and unknown dynamic-route 404 behavior were audited.
- Internal application links and curated external-link rules are enforced by a lightweight validator. The configured Discord invite redirects to the matching Discord invite, and the public GitHub repository has Issues enabled.
- Analytics events map to real preparation actions. Contact analytics contains only `channel` and `placement`; private free text is not sent.
- Production header policy now enforces CSP, HSTS (outside development), frame protection, referrer policy, MIME-sniffing protection, COOP, and Permissions-Policy. The exact hosted validation remains in `docs/production-launch-checklist.md`.
- Accessibility checks covered labels, semantic controls, status behavior, visible focus, keyboard navigation, and dialog focus management. This is not a WCAG certification.

## Genuine public-launch blockers

No code or product-integrity blocker remains for the credential-free public website.

The manual items below must be resolved or explicitly accepted by the owner before deployment. They are the reason for the `PUBLIC LAUNCH READY WITH MANUAL ITEMS` classification.

## Manual owner and legal actions

- Obtain qualified legal review of `/privacy` and `/terms`; both are honest product drafts, not representations of legal sufficiency.
- Keep `NEXT_PUBLIC_ACCOUNTS_ENABLED=false` for the public launch.
- Confirm production domain, environment values, HTTPS behavior, security headers, sitemap, robots, redirects, and caching during the separate deployment phase.
- Verify ongoing ownership and moderation/triage coverage for the configured Discord and GitHub Issues channels.
- Configure `NEXT_PUBLIC_CONTACT_EMAIL` only after a mailbox has been verified and assigned an owner.
- If PostHog is configured, review privacy/consent requirements and verify production delivery before relying on analytics.
- Run the production route/cache smoke checks after deployment.

## Deferred full-platform blockers

The full authenticated platform remains **NOT QUALIFIED**. Its later qualification requires:

- hosted Supabase project
- hosted migrations
- hosted email authentication
- OAuth configuration and verification
- hosted Row Level Security qualification
- production cache refresh verification
- PostHog production delivery, if still unconfigured
- persisted user features and their end-to-end qualification

These items do not block the credential-free public launch because account behavior is explicitly gated and disabled by default.
