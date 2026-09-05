# Engineering Foundry System Design final audit

Audit date: 2026-09-04

## Verdict

**COMPLETE** for Required-family content acceptance; all 188 repository lessons are release-valid.

The published material passes the release audit, including the 18-lesson Production Engineering, 14-lesson Common Architecture Patterns, and ten-lesson Required closure families. Every repository topic and all 15 Required practice designs are published. The reviewed 161-to-188 crosswalk has no blueprint-only outcomes. Thirty-three additional P1/P2 practice ideas remain an optional, honestly labeled backlog and do not expand Required acceptance.

## Scope and inventory

### Curriculum

| Metric | Complete manifest | Published |
|---|---:|---:|
| Sections | 10 | 10 with published material |
| Lessons | 188 | 188 |
| Subtopics | 1,465 | 1,465 |
| Must Know | 71 | 71 |
| Important | 88 | 88 |
| Advanced | 29 | 29 |
| Estimated lesson time | 75h 32m | 75h 32m |

Published priority time:

- Must Know: 31h 12m
- Important: 32h 46m
- Advanced: 11h 34m
- Representative Focus Now plan, SDE II + 1 week: 22 lessons, 11h 10m of lesson metadata; the generated 1-hour/day study plan selects a feasible prerequisite-aware subset.

### Practice

- Manifest: 60 problems
- Published walkthroughs: 27
- Upcoming walkthroughs: 33
- Published estimated time: 13h 29m
- Published difficulty: 4 Foundation, 7 Intermediate, 11 Advanced, 5 Specialized
- Published role coverage (overlapping): Backend 25, Full-stack 14, Infrastructure 13, Data 10, ML 3
- Full manifest role-priority matrix:

| Role | Must Know | Important | Advanced |
|---|---:|---:|---:|
| Backend | 10 | 17 | 33 |
| Full-stack | 10 | 16 | 34 |
| Infrastructure | 13 | 18 | 29 |
| Data | 11 | 18 | 31 |
| ML | 10 | 16 | 34 |

### Visual and learning support

- Mermaid diagrams: 164 total (110 concept diagrams, 54 practice diagrams)
- Custom-interactive placements: 10 across 9 reusable implementations
- Static comparison-designated lessons: 28 published
- Manifest-designated text-only lessons: 50 published
- Worked examples: 60 rendered blocks across 54 published lessons
- Practice connections: all 188 published lessons render validated practice links
- Combined published lesson and practice time: approximately 89h 01m

Generated inventories:

- `docs/system-design-content-inventory.json`
- `docs/system-design-visual-inventory.json`
- `docs/system-design-curriculum-manifest.md`

## Issues found and fixed

### Technical accuracy

- Corrected the Search Engine capacity estimate. A 100K QPS query tier that fans out to 20 shards creates approximately 2M shard requests/s before replica routing; it is not 5K fan-outs/s per shard.
- Rechecked sensitive current-product claims against authoritative documentation: S3 read-after-write behavior, DynamoDB consistency surfaces, SQS Standard/FIFO semantics, Redis Cluster hash slots, PostgreSQL asynchronous streaming replication, Kafka partition ordering, and Flink state versus end-to-end exactly-once constraints. The published wording was already appropriately scoped.
- Added automated arithmetic assertions for search fan-out, search recrawl, analytics ingest, Kafka ingest, and existing foundation calculations.

### Content duplication and information architecture

- Removed the shallow legacy practice renderer from the catch-all System Design route.
- Consolidated ten retired direct practice URLs into exact HTTP 308 redirects to `/system-design/problems/*`.
- Kept `/system-design` retired as a 308 redirect to `/system-design/start-here/introduction`.
- Removed duplicate legacy practice URLs from the sitemap.
- Kept all 60 problems in the left navigation, but collapsed the six practice groups by default; the active problem group opens automatically.
- Added a visible `Soon` label to unpublished lesson and practice links instead of letting them look equivalent to completed content.

### Writing quality

- Replaced the empty/coming-soon introduction with a concise reviewed lesson centered on requirements, the simplest viable design, bottlenecks, trade-offs, and failure reasoning.
- Kept the personalization controls above the curriculum and placed the introduction within the curriculum view so the focus planner remains the primary entry experience.
- Automated scans reject common generic filler and AI-attributed phrasing in the audited content.

### Broken links and routes

- The prior 2026-08-14 browser audit returned HTTP 200 for 239 then-canonical routes and exact HTTP 308 destinations for 11 retired routes; this content batch does not relabel that historical run as coverage for the new lessons.
- 70 literal internal System Design links resolve against canonical lesson/problem routes in the focused release audit.
- 148 unique authoritative external references are represented in the release-audit source set; network reachability remains a separate scheduled/manual check.
- Added repeatable route and external-link audit scripts.

### Curriculum metadata

- Centralized inventory generation now exports route, status, duration, level/role relevance, prerequisites, source coverage, related content, practice links, and visual metadata.
- Published the Introduction metadata only after adding its real renderer and reviewed content.
- Confirmed unique topic, subtopic, and practice identifiers and valid prerequisite/related-topic references.

### Personalization

- Made recommendation ordering cross-sectional instead of allowing manifest order to fill short plans with one section.
- SDE II + 1 week now produces the approved 22-topic core sequence from interview framing through caching, storage, messaging, reliability, Redis, Kafka, and CDN.
- Unpublished topics cannot enter Focus Now or Learn Next. They remain discoverable under Skip for Now and are labeled Coming soon.
- Focus Now filtering shows only its recommendations while explicitly offering `Show all 188 topics`.
- Reset returns to the default Engineering Foundry curriculum.

### Study plans

- Prevented unpublished prerequisites or lessons from being scheduled.
- Fixed prerequisite packing so artificial stage-day placement cannot strand a required lesson.
- Preserved deterministic recommendation/rank ordering and daily time budgets.
- Browser-tested the SDE II, seven-day, one-hour/day plan; it scheduled only published material and exposed progress/missed-day controls.

### Diagrams

- Generated an auditable 164-diagram inventory with lesson, route, purpose, description, type, node count, responsive behavior, and dark-mode status.
- Fixed node counting for sequence diagrams, state diagrams, and additional Mermaid node shapes.
- Render-tested Mermaid SVG output in dark mode with no fallback error and a descriptive accessible label.

### Accessibility

- Verified semantic headings, breadcrumb and pager navigation, named controls, tabs, `aria-pressed` personalization choices, `aria-live` summary updates, and the mobile course-navigation dialog.
- Verified drawer focus containment, Escape handling in source, and restoration to the trigger.
- Verified lesson completion toggles and restored the test state afterward.
- Added `noopener noreferrer` to external new-tab learning references.

### Mobile and dark mode

- Render-tested 1440×900 desktop, 768×1024 tablet, and 390×844 mobile.
- Document/body scroll width matched viewport width at tablet and mobile sizes; no page-level horizontal overflow.
- Course navigation opens as a named modal drawer on narrow viewports.
- Light and dark themes were visually checked; dark theme resolved to a dark background/light text pair and Mermaid uses the theme-aware renderer.

### Performance

- The prior production webpack compilation generated 403 static pages successfully; the ten new finite routes require the current candidate's canonical production qualification before deployment.
- Mermaid remains client-lazy-loaded rather than entering the initial server bundle.
- No application-origin console errors were observed; two Chrome-extension message-channel errors were unrelated to the app.
- A cold-load Core Web Vitals trace was not available because the required Chrome DevTools performance backend is not configured in this environment. This remains a release measurement gap, not a discovered code defect.
- The default Turbopack build hit its known environment restriction while trying to bind an internal worker port (`EPERM`). The supported webpack production build passed; the error was environmental rather than a CSS or TypeScript failure.

### SEO

- Published canonical lessons/problems remain in the sitemap.
- Coming-soon lesson routes are excluded from the sitemap and render `noindex, follow`.
- Retired practice routes use HTTP-level permanent redirects rather than duplicate rendered pages.
- Canonical metadata for the live practice paths remains under `/system-design/problems/*`.

## Representative recommendation changes

| Persona | Focus Now | Learn Next | Skip for Now | Focus time | Distinctive end of Focus Now |
|---|---:|---:|---:|---:|---|
| SDE I · 3 days | 10 | 12 | 166 | 5h 05m | Caching, SQL vs NoSQL, indexes, replication, sharding |
| SDE II · 1 week | 22 | 20 | 146 | 11h 10m | delivery semantics, rate limiting, real-time, idempotency, retries, Redis, Kafka, CDN |
| Senior · 2 weeks | 36 | 30 | 122 | 16h 28m | transactions, cache placement/asides/TTL/invalidation/stampedes |
| Staff · 1 month | 60 | 40 | 88 | 26h 12m | Saga, multi-region, partial failure, search/indexes, geospatial, notifications |

## Validation results

- ESLint: passed
- TypeScript `tsc --noEmit`: passed
- 20 focused System Design scripts are enrolled; the canonical static lane is the release gate for the exact candidate.
- Content/design/public-link validators: passed
- Release audit: passed
- External-link audit: prior 93/93 network run passed; the current 148-reference source set is registry- and source-validated, with reachability remaining scheduled/manual.
- Route audit: prior 239 canonical + 11 redirect browser run passed; current lesson routes are source-validated and require the candidate's canonical public-route smoke before deployment evidence.
- Default `next build`: blocked by environment-only Turbopack internal port binding
- Historical non-release diagnostic only: `next build --webpack` passed, 403 static pages generated. The canonical release build is now plain `next build` using Turbopack.
- Rendered desktop/tablet/mobile/light/dark checks: passed

## Remaining issues

### Required content gaps

None. All 161 unique blueprint topic rows and all 15 Required practice designs have published outcomes.

### Should Fix

1. **Keep the 33 optional practice ideas out of Required completion claims.** Publish them only when their dossiers pass the existing practice contract.
2. **Capture production-hosted Core Web Vitals** with the Chrome DevTools performance backend before launch.

### Nice to Have

1. Add a CI job for the route audit against a started production server; keep the external-link audit scheduled/manual to avoid network flakiness.
2. Review whether the six practice groups should remember their expanded state across devices; current session behavior is intentionally local.

## Files changed by this audit

- `app/globals.css`
- `app/sitemap.ts`
- `app/system-design/[...segments]/page.tsx`
- `components/system-design-article.tsx`
- `components/system-design-focus-planner.tsx`
- `components/system-design-sidebar.tsx`
- `content/system-design/foundations/introduction.tsx`
- `content/system-design/foundations/sources.ts`
- `content/system-design/problems/data.ts`
- `content/system-design/required-closure/*`
- `data/system-design/manifest.ts`
- `data/system-design/recommendations.ts`
- `data/system-design/study-plan.ts`
- `docs/system-design-content-inventory.json`
- `docs/system-design-curriculum-manifest.md`
- `docs/system-design-visual-inventory.json`
- `next.config.ts`
- `package.json`
- `scripts/audit-system-design-external-links.mjs`
- `scripts/audit-system-design-routes.mjs`
- `scripts/generate-system-design-manifest-report.mjs`
- `scripts/test-system-design-foundations.mjs`
- `scripts/test-system-design-recommendations.mjs`
- `scripts/test-system-design-release-audit.mjs`
- `scripts/test-system-design-study-plan.mjs`

No new expansion phase was started. The remaining content work is intentionally classified for editorial decision rather than automatically generating more lessons.
