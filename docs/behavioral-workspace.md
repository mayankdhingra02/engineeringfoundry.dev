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

Question references use exactly one of `curated_question_id` or `custom_question_id`; curated references have foreign keys to the global catalog. A story can therefore link to many curated or custom questions, and each question can link to many stories. Answer-preparation records are separate from stories, so a member can retain one reusable STAR story while saving general, company-specific, and application-specific framing. Selecting a story in preparation creates the canonical story/question mapping in the same transaction, and that mapping cannot be removed while preparation still references it. A preparation record can store opening framing, details to emphasize, details to avoid, private notes, and an optional full rehearsal draft. It may be marked as the single primary story for that question; an owner-derived RPC replaces the previous primary atomically.

Story readiness is deterministic, not an AI score. The interface derives `Draft`, `Needs detail`, or `Ready` only from concrete trimmed-content thresholds in Situation, Task, Action, and Result. A database trigger derives the compatible stored status on every insert or relevant update, and authenticated clients cannot assign that column directly. User-facing reads still derive readiness from the STAR fields themselves. Reflection remains encouraged but does not block a draft save.

Every private table uses row-level security and owner-scoped policies. Composite owner foreign keys also prove that referenced stories, custom questions, applications, and their child rows belong to the same account. Column-level grants prevent direct Data API clients from assigning ownership, generated audit fields, readiness, or primary-answer state. Story-theme replacement executes atomically through an owner-resolved RPC, and primary selection derives the account from `auth.uid()` rather than a client-supplied user identifier. When preparation selects an application, a database trigger verifies ownership and derives its company slug from that application, preventing contradictory or spoofed context.

Deleting a custom question cascades its mappings and preparation. Deleting a story cascades themes and question mappings, preserves question-specific preparation, clears its story reference, and clears primary state before the foreign key runs. Deleting an application preserves generic preparation while clearing only the optional application reference.

## Workspace behavior

- The overview presents at most four compact facts: stories, ready stories, covered questions, and upcoming behavioral-style interviews.
- Story search covers title, context, project, summary, and controlled themes. Readiness and theme filters stay lightweight.
- Question search covers prompt, category, and guidance. Coverage filters expose `All`, `Covered`, and `Needs story`; source distinguishes Engineering Foundry questions from private user questions.
- Company preparation is optional. Application detail and dashboard cues appear only for upcoming Behavioral, Hiring Manager, Bar Raiser, Onsite, or Virtual Onsite rounds.
- The long-form story editor shows an unsaved state after a change, warns before browser exit, and confirms an explicit cancel. The guard clears when saving begins so a successful submit can navigate normally.
- The public `/behavioral` guide remains separate from the no-store authenticated workspace.

## Deployment

Apply `supabase/migrations/202608140001_create_behavioral_workspace.sql`, then the forward integrity, preparation-state, `202608140005_complete_behavioral_phase3.sql`, and `202608140006_enforce_behavioral_relationships.sql` migrations after the application tracker migration. In local development:

```sh
npx supabase migration up --local
npx supabase test db
```

The member workspace also requires the existing account platform configuration and `NEXT_PUBLIC_ACCOUNTS_ENABLED=true`. Leave that flag disabled until the hosted authentication/database environment is qualified.
