# Persistent DSA practice progress

Phase 4 adds optional account-backed progress to the existing public DSA workspace. `/dsa` and public question metadata remain accessible without an account. Signed-in members get the same private state in `/dsa/questions`, `/dsa/practice`, question detail pages, and `/dsa/roadmap`.

## Public and authenticated UI

Progress augments the existing question library and level roadmaps rather than creating a separate catalog. Public question metadata, filters, roadmap content, and external source links remain available when signed out. Persistence affordances lead to sign-in with the intended DSA destination preserved instead of blocking public browsing.

Signed-in collection rows show a text status with quick solved/review and bookmark actions. The canonical question detail route owns confidence, private notes, first-attempted and last-practiced context, and the explicit save with announced success or failure. This keeps repeated actions fast while leaving private detail subordinate to question identity, difficulty, topics, company relevance, and source.

## Canonical identity

`lib/dsa/catalog.ts` is the application catalog. It unifies the question browser and three level roadmaps around durable slug IDs such as `two-sum` and `longest-substring-without-repeating-characters`. Browser display IDs, titles, external numeric IDs, and array position are never persistence keys. `dsa_question_catalog` mirrors the complete ID set in PostgreSQL, and `dsa_question_progress.question_id` has a foreign key to it. The mutation RPC also checks the catalog before writing, so fabricated identifiers are rejected.

When questions are renamed or reordered, preserve the existing canonical ID. When adding a question, add it to the source catalog and the forward database catalog migration in the same change. Never reuse an old ID for a different problem.

Question retirement is deliberate rather than a routine metadata deletion. The database foreign key restricts deletion of a catalog ID while private progress references it; keep retired IDs reserved and never reassign them. Before removing an ID from the application catalog, ship an explicit migration and product decision for how its historical private progress will remain reachable, migrate, or be removed.

## Private data and timestamps

One `dsa_question_progress` row belongs to one auth user and one canonical question. It stores:

- `not_started`, `attempted`, `solved`, or `review`
- optional `low`, `medium`, or `high` self-reported confidence
- bookmark state and private notes (maximum 5,000 characters)
- first attempted, last practiced, and solved timestamps
- created and updated audit timestamps

`save_dsa_question_progress(...)` resolves ownership from `auth.uid()`. Authenticated clients receive no generic insert or update privilege. Row-level security limits reads and deletes to the owner. Notes are never rendered into public pages, public analytics, or shared cache scopes.

`first_attempted_at` is write-once. `solved_at` records the first transition to solved or review and remains stable when a question returns to review. `last_practiced_at` changes for status, confidence, or note changes; bookmark-only changes and page views do not move it.

## Deterministic derivation

My Practice loads all owned question progress in one ordered query and joins it to the in-memory canonical catalog. It does not query once per row. Continue chooses the first available group in this order:

1. explicit review
2. attempted
3. incomplete question in the preferred roadmap
4. recent low-confidence work

Solved and review both count as roadmap completion. Attempted and not started remain incomplete. Needs Review consists of attempted questions, low-confidence solved questions, and explicit review questions. Topic totals are derived from question progress; a cross-tagged question can contribute to more than one topic. Recent practice is bounded to six meaningful updates.

The preferred SDE I, SDE II, or SDE III+ roadmap is stored in the existing `user_preparation_preferences.dsa_level` field. Switching it changes Continue and completion derivation without deleting progress.

## Application context

Application and dashboard cues appear for Coding/DSA, technical, machine-coding, debugging, and domain-style rounds. They pass an owned `application` identifier and optional company slug into DSA. The server validates the application against the current actor before displaying its company/role context. Progress remains global to the account, not duplicated per application. Question filters, detail links, and back links retain validated context, and the user can clear it explicitly.

## Verification

Run:

```sh
npm run test:dsa-progress
npm run test:dsa-level-roadmaps
npm run test:dsa-roadmap-planning
npm run typecheck
npx supabase migration up --local
npx supabase test db
```

`scripts/qualify-persistence-local.mjs` also exercises the authoritative RPC, timestamp behavior, fake-ID rejection, cross-user isolation, anonymous denial, and cleanup against a disposable local Supabase environment.
