# Authenticated workspace foundation

Engineering Foundry uses Supabase Auth, cookie-backed `@supabase/ssr` sessions, server-side data access, and PostgreSQL Row Level Security (RLS) for private preparation data. Public curriculum remains usable without an account. This document is the contract for Phase 5A and later workspace integrations.

## Qualification and feature gate

The hosted account platform is **not qualified**. Account routes and persistence are available only when both public Supabase configuration is present and `NEXT_PUBLIC_ACCOUNTS_ENABLED=true`. Keep that flag false until every committed migration and the full hosted auth/RLS matrix in [`qualification/auth-profile-qualification.md`](qualification/auth-profile-qualification.md) has been verified against the intended project.

Missing or disabled account configuration must degrade to the existing public product; it must never expose a partially working mutation.

## Identity and session authority

- `auth.users.id` is the one canonical user ID. `profiles.id` is its one-to-one application profile.
- Server reads and mutations resolve the current user from the cookie-backed Supabase session. A form, URL, query string, or client payload must never choose `user_id`.
- Protected pages use the shared auth guards. Every Server Action re-authenticates independently because page-level authorization does not protect an action endpoint.
- Domain repositories resolve the server actor themselves and return minimal data. RLS remains the final read/create/update/delete boundary.
- Sign-out clears the Supabase session and analytics identity. Expired or missing sessions are treated as unauthenticated and must not reveal whether a private record exists.
- Browser mutations use Next.js Server Actions and cookie sessions with same-site protections and Next.js origin checks; direct Supabase Data API access still requires an authenticated bearer token and is constrained by grants plus RLS. UI hiding and UUID opacity are never treated as CSRF or authorization controls.

## Public and private data

| Boundary | Canonical examples | Rule |
| --- | --- | --- |
| Public product data | DSA catalog and roadmaps, System Design curriculum, company research, curated Behavioral questions | Versioned in repository data/content. Do not duplicate it per user. |
| Private account data | applications, schedules, contacts, notes, custom questions, stories, answers, saved items, progress, preferences | Stored in owner-scoped tables. Reference stable public IDs where applicable. |
| Public profile projection | explicitly public, completed profile fields returned by the approved RPC | This is the only intentional account-data publication boundary. Base profile rows remain protected. |

Private records must not enter static generation, public route payloads, the sitemap, search indexes, shared/global caches, logs, or analytics. Private-route classification has one canonical definition in `lib/privacy/routes.ts`, shared by analytics suppression and `robots.txt`, and private content fields are stripped from every analytics payload. See [`privacy-and-analytics.md`](privacy-and-analytics.md). Robots exclusion is defense in depth, not authorization.

Capabilities are modelled independently in `lib/config/capabilities.ts`: the account platform, permanent deletion, the reminder worker, and email reminders each declare their own requirements. A partially configured environment degrades to a truthful UI — an unavailable control that explains itself — rather than a control that fails after the user commits to it.

## Private schemas

All tables are in the `public` Postgres schema and reference `auth.users(id)` directly or through an owner-checked parent relationship.

| Area | Tables | Purpose |
| --- | --- | --- |
| Account | `profiles` | One-to-one profile and explicit onboarding boolean/timestamp state. |
| Applications | `applications`, `interview_rounds` | Application lifecycle, date-only application fields, and explicitly ordered/scheduled rounds. |
| Round preparation | `interview_preparations`, `interview_preparation_custom_tasks` | Owner-scoped checklist state, private notes, bounded custom tasks, and completed-round reflections. |
| Behavioral | `behavioral_custom_questions`, `behavioral_saved_questions`, `behavioral_stories`, `behavioral_story_themes`, `behavioral_story_question_links`, `behavioral_answers` | User-created or saved prompts, reusable STAR evidence, many-to-many question links, and distinct answer versions. |
| Preparation | `user_preparation_preferences`, `dsa_progress`, `dsa_question_catalog`, `dsa_question_progress`, `system_design_progress`, `system_design_item_catalog`, `system_design_item_progress`, `system_design_attempts` | Account preferences, canonical catalogs, owner-scoped progress, and independent structured System Design attempts. |
| Interview calendar | `interview_reminder_preferences`, `interview_reminders`, `interview_calendar_exports` | Preferred display timezone, sparse schedule-aware reminders, and manual export audit. |
| Abuse protection | `account_action_rate_limits` | Owner-scoped budget for expensive account actions, written only by an actor-derived RPC. |

Core relationships remain queryable; private workspaces are not stored as one opaque JSON document. Flexible metadata is acceptable only where its shape is genuinely optional and runtime validated.

The committed migration sequence is profile creation/hardening (`202608130001`–`002`), Applications (`202608130003`), Behavioral and shared relationship/grant hardening (`202608140001`–`002`), preparation preferences and generalized progress (`202608140003`), Application alignment (`202608140004`), Behavioral completion and relationship hardening (`202608140005`–`006`), canonical DSA question progress (`202608140007`), the System Design workspace and validation hardening (`202608140008`–`010`), round preparation (`202608140011`), calendar/reminder lifecycle (`202608140012`–`013`), and account lifecycle (`202608150001`). Migration `202608140002` also makes round moves and story-theme replacement owner-resolved database operations so multi-row updates stay atomic.

Preparation state uses compact, deterministic keys rather than copied curriculum rows:

- `user_preparation_preferences` has one row per `user_id` and stores nullable DSA level/plan/company/language/interview-date choices, System Design level/window/role/minutes-per-day choices, and the version/timestamp of an explicitly confirmed local System Design import.
- `dsa_progress` remains the generalized preparation-state seam for `problem`, `roadmap-task`, `mixed-set`, and `timed-practice` records. The shipped canonical question workspace uses the read-only `dsa_question_catalog` and one owner-scoped `dsa_question_progress` row per `(user_id, question_id)`; its authoritative write RPC validates canonical IDs and derives meaningful practice timestamps.
- `system_design_item_progress` is unique by `(user_id, item_type, item_id)` and references the immutable canonical catalog. It stores self-reported status/confidence, bookmarks, private notes, and meaningful practice timestamps. `system_design_attempts` stores multiple independent rehearsals per canonical problem with validated structured documents and revision-based conflict protection. See [`system-design-practice-workspace.md`](system-design-practice-workspace.md).
- Progress services whitelist IDs against the canonical repository catalogs and exact enum/value sets. Their public server APIs resolve the authenticated actor themselves and do not accept a `userId` argument.

Round-preparation free text uses two independent revision domains. Private notes carry `private_notes_updated_at`; the four post-interview reflection fields form one coherent snapshot under `reflection_updated_at`. A save supplies either an explicit absent revision or the exact loaded timestamp. The owner-derived RPC locks the round shared with checklist changes, returns one row with the new revision on success, and returns zero rows without mutation for stale, missing, or foreign targets. Notes, reflection, and checklist updates therefore remain independent: a checklist change does not manufacture a text conflict, while two stale editors cannot silently overwrite the same text family. Reflection remains writable only after the owned round is completed. Browser forms strictly parse complete inputs before actor work, preserve edits made while a request is pending, and distinguish an earlier-snapshot success from the current unsaved draft. The legacy whole-snapshot RPC is retired as a stable `0A000` no-mutation fail-safe.

Custom preparation-task completion is also desired state, never a flip-current command. The browser submits the exact owned round, task, and target boolean; the owner-derived RPC locks that exact task, returns one correlated row for both a changed state and an idempotent repeat, and leaves `updated_at` unchanged for a no-op. Missing, foreign, and round-mismatched tasks return the same zero-row result. The legacy toggle RPC is retained only as a stable `0A000` no-mutation fail-safe so two stale tabs cannot accidentally invert the user's intent.

## Mutation and validation contract

Private mutations follow one sequence:

1. Resolve the authenticated actor on the server.
2. Parse a narrow allowlist of fields; never spread form or request objects into a database write.
3. Validate UUIDs, stable public entity IDs, required relationships, enums/lifecycle states, lengths, URLs, dates, time zones, and reasonable numeric bounds at runtime.
4. Inject the authenticated `user_id` on the server and scope updates/deletes by both record ID and owner ID.
5. Let foreign keys, check/unique constraints, and RLS enforce the final invariant.
6. Return only the result the UI needs and map internal database errors to safe, non-enumerating messages.

Child mutations must prove the parent belongs to the same user. UUID opacity is not authorization. Application-round ordering and Behavioral cross-links are independent of presentation state, so changing a parent lifecycle status cannot make child data inaccessible.

Application dates are stored as date-only values. Scheduled interview instants are stored canonically with the selected IANA time zone retained for presentation; a browser-local date must not be silently reinterpreted in another zone.

## Local and account progress authority

Legacy browser-local System Design continuation may remain available while signed out, but authenticated concept progress and design attempts use the owner-scoped database workspace. Signed-in DSA question progress likewise uses its owner-scoped account repository as the authoritative source.

When a signed-in progress UI is connected, account state is authoritative. A future one-time local import must be an explicit user decision:

- read and validate only supported local-storage versions and stable curriculum IDs;
- compare local and account records and present conflicts rather than guessing;
- let the user choose import, keep account state, or cancel;
- write through the authenticated server boundary and confirm success before clearing local data;
- record an import version/receipt so the prompt is not repeated accidentally.

The import receipt is recorded only through the owner-resolved, monotonic
`record_local_system_design_import` RPC. Authenticated Data API clients cannot
assign its version or server timestamp directly, and an older import attempt
cannot downgrade an existing receipt.

Never silently overwrite or merge either source. Phase 5A provides the schema and repository seam; the import experience belongs to Phase 5D.

## Caching and indexing

- Private workspace pages are request-time surfaces and must not opt into static generation or shared caching.
- Server-side user queries/actions stay behind server-only modules and must not be imported into client bundles.
- Revalidation is limited to the affected owner's private routes. Public catalog caches never contain user joins.
- Indexes prioritize owner lookup and established product queries such as application status/date, interview schedule, saved-question lookup, and unique owner-plus-public-entity progress.

## Integration status

- **Applications:** the existing UI and domain-specific query/action layer are real and match the owner-scoped schema. Hosted use remains gated pending qualification.
- **Behavioral:** the existing private workspace, normalized story/question/answer relationships, and server actions are real. Hosted use remains gated pending qualification.
- **DSA:** `dsa_question_progress` and preparation preferences are the signed-in authority for canonical question practice and deterministic Continue behavior. The public question library and roadmaps remain repository-backed and signed-out accessible.
- **System Design:** `system_design_item_progress` and `system_design_attempts` are the signed-in authority. Public curriculum remains repository-backed and signed-out accessible; no automatic local-state merge is performed.
- **Interview calendar:** `/calendar` is a request-time owner-scoped projection of existing rounds. Reminder rows are trigger/RPC managed, exports are manual and token-free, and email delivery stays disabled until a provider and scheduler pass hosted qualification. See [`interview-calendar-reminders.md`](interview-calendar-reminders.md).

Future work should extend the domain-specific repositories rather than introduce a generic CRUD framework or a second authentication system.

Phase 8 adds the minimal account lifecycle fields and actor-derived RPCs in `202608150001_create_account_lifecycle.sql`. The full onboarding, settings, export, recovery, and deletion contract is documented in [`account-lifecycle.md`](account-lifecycle.md). In particular, authenticated account deletion begins with the Auth identity and cascades through every private owner row, including durable reminders.

## Local qualification evidence

On 2026-08-14, the full migration chain applied successfully to a clean local
Supabase database. Database lint reported no public-schema errors, all 200
pgTAP assertions passed, and the publishable-key-only two-user Data API harness
passed 68/68 checks, including anonymous read and write denial. The browser lifecycle also passed signed-out
protection, email sign-in, onboarding, private Applications and Behavioral
access, create/read-after-refresh/delete persistence, sign-out, and renewed
route protection at desktop and mobile sizes in light and dark themes.

These results qualify the local implementation contract only. They do not
qualify hosted migrations, production email/OAuth, production edge caching, or
deployment configuration; the account feature gate must remain off until the
hosted checklist is completed.
