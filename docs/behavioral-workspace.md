# Behavioral Interview Workspace

The private behavioral workspace lives under `/behavioral/workspace`, `/behavioral/questions`, and `/behavioral/stories`. The existing `/behavioral` route remains the public practice guide.

## Data architecture

Engineering Foundry's rich curated-question authoring source stays in `data/behavioral/questions.json`. A single global `behavioral_curated_questions` table mirrors the stable ID, prompt, category, order, and active state used by database relationships; it is readable but not mutable by normal users. Curated records are never copied into each member's account. Private user data is stored in:

- `behavioral_custom_questions`
- `behavioral_saved_questions`
- `behavioral_stories`
- `behavioral_story_themes`
- `behavioral_story_question_links`
- `behavioral_answers`

Question references use exactly one of `curated_question_id` or `custom_question_id`; curated references have foreign keys to the global catalog. A story can therefore link to many curated or custom questions, and each question can link to many stories. Answer-preparation records are separate from stories, so a member can retain one reusable STAR story while saving general, company-specific, and application-specific framing. Selecting a story in preparation creates the canonical story/question mapping in the same transaction, and that mapping cannot be removed while preparation still references it. A preparation record can store opening framing, details to emphasize, details to avoid, private notes, and an optional full rehearsal draft. Answer creation and revision-checked editing save the complete preparation snapshot and its desired primary state through one owner-derived aggregate RPC; assigning a primary clears the prior primary for the same question under the same lock and transaction.

Story readiness is deterministic, not an AI score. The interface derives `Draft`, `Needs detail`, or `Ready` only from concrete trimmed-content thresholds in Situation, Task, Action, and Result. A database trigger derives the compatible stored status on every insert or relevant update, and authenticated clients cannot assign that column directly. User-facing reads still derive readiness from the STAR fields themselves. Reflection remains encouraged but does not block a draft save.

Every private table uses row-level security and owner-scoped policies. Composite owner foreign keys also prove that referenced stories, custom questions, applications, and their child rows belong to the same account. Column-level grants prevent direct Data API clients from assigning ownership, generated audit fields, readiness, or primary-answer state. Story creation, revision-checked full edits, and duplication persist each parent row and its complete controlled theme set through owner-derived aggregate RPCs. A full edit serializes the story, compares the exact loaded revision, and either saves one coherent aggregate or returns no row without changing the parent or themes. The edit route reads the parent revision and complete controlled-theme defaults through one owner-scoped nested database statement, then strictly parses the correlated result. A successful null result is a missing story; a query error, malformed row, owner mismatch, or story mismatch is private-data unavailability. The form therefore cannot pair a newer parent revision with older theme defaults and later overwrite a concurrent theme edit through an otherwise valid revision check. Behavioral answer creation and revision-checked editing likewise derive the owner from `auth.uid()`, lock the owner/question key shared by primary changes, and save content plus primary state atomically; stale, missing, foreign, or question-mismatched edits return no row without mutation. When preparation selects an application, a database trigger verifies ownership and derives its company slug from that application, preventing contradictory or spoofed context.

Deleting a custom question cascades its mappings and preparation. Deleting a story cascades themes and question mappings, preserves question-specific preparation, clears its story reference, and clears primary state before the foreign key runs. Deleting an application preserves generic preparation while clearing only the optional application reference.

## Workspace behavior

- The overview presents at most four compact facts: stories, ready stories, covered questions, and upcoming behavioral-style interviews.
- Story search covers title, context, project, summary, and controlled themes. Readiness and theme filters stay lightweight.
- Question search covers prompt, category, and guidance. Coverage filters expose `All`, `Covered`, and `Needs story`; source distinguishes Engineering Foundry questions from private user questions.
- Company preparation is optional. Application detail and dashboard cues appear only for upcoming Behavioral, Hiring Manager, Bar Raiser, Onsite, or Virtual Onsite rounds.
- The long-form story editor shows an unsaved state after a change, warns before browser exit, and confirms an explicit cancel. The guard clears when saving begins so a successful submit can navigate normally.
- The public `/behavioral` guide remains separate from the no-store authenticated workspace.

## Deployment

Apply `supabase/migrations/202608140001_create_behavioral_workspace.sql`, then the forward integrity, preparation-state, `202608140005_complete_behavioral_phase3.sql`, and `202608140006_enforce_behavioral_relationships.sql` migrations after the application tracker migration. Apply `202609030005_save_behavioral_story_aggregate.sql` before deploying the story aggregate application: the migration revokes authenticated direct story `INSERT`/`UPDATE` and theme mutations, and makes the legacy split theme RPC fail with SQLSTATE `0A000` and `Atomic Behavioral story saving is required`. Apply `202609030007_save_behavioral_answer_aggregate.sql` before deploying the answer aggregate application: it revokes authenticated direct answer `INSERT`/`UPDATE`, preserves owner-scoped `SELECT`/`DELETE`, and makes the legacy primary-only RPC fail with SQLSTATE `0A000` and `Atomic Behavioral answer saving is required`. Migration-first makes already-loaded split-write clients fail before partial mutation; application-first leaves their torn-write and stale-overwrite windows open until the corresponding migration lands. Rolling application code back after either migration is safe but degraded because the old direct and legacy split paths remain unavailable; keep the migrations and roll forward to the aggregate clients. In local development:

```sh
npx supabase migration up --local
npx supabase test db
```

The member workspace also requires the existing account platform configuration and `NEXT_PUBLIC_ACCOUNTS_ENABLED=true`. Leave that flag disabled until the hosted authentication/database environment is qualified.
