# Persistent System Design practice workspace

Engineering Foundry keeps the System Design curriculum public and repository-backed. Authentication progressively adds private preparation state; it never gates concept articles, diagrams, or public problem walkthroughs.

## Canonical identity and progress

Published concepts and design problems are mirrored into the read-only `system_design_item_catalog` by stable `(id, item_type)` keys. The item type is part of the key because a concept and a design problem may intentionally share a slug. Regular members cannot mutate the catalog. Server actions also validate IDs against the repository manifests before calling the database.

`system_design_item_progress` stores one owner-scoped row per canonical item. Status is `not_started`, `reviewed`, `review`, or `comfortable`; confidence is the independent, nullable self-report `low`, `medium`, or `high`. Neither value is a score. Bookmarks, private notes, first-reviewed time, last-practiced time, and audit timestamps live on the same row. Viewing public content does not update practice timestamps; an explicit progress save does.

## Independent design attempts

`system_design_attempts` represents a rehearsal, not a permanent answer. A member may create many attempts for the same canonical design problem; starting another attempt creates a mostly blank document and never merges or overwrites earlier work. Attempts use `draft`, `practiced`, or `review`, nullable self-reported confidence, an optional owned application, and an incrementing revision for optimistic concurrency. Deletion is explicit and confirmed.

The structured worksheet is a validated `jsonb` document because its sections are owned by one attempt, are fetched and saved together, and do not need independent cross-attempt queries. Its allowlisted schema covers functional and non-functional requirements, capacity assumptions and transparent calculations, API rows, data-model rows, high-level design, deep dives, bottlenecks, failure modes, trade-offs, follow-ups, and final review notes. Both TypeScript and PostgreSQL validate shape, row counts, string sizes, allowed keys, and total document size. The attempt stays relational, so a future diagram attachment can reference the same attempt ID without changing or embedding the ownership model.

An attempt edit submits one complete runtime-validated worksheet and the exact loaded integer revision. The strict action parser rejects missing, duplicate, file-valued, unknown, malformed, oversized, or noncanonical fields before account or persistence work. A database error, stale zero-row result, or malformed success result never advances the revision or claims a save. The client intercepts hydrated submissions so React does not reset the uncontrolled worksheet on a returned error, blocks duplicate snapshots synchronously, and keeps fields editable while persistence is pending. If the visible worksheet changes during that request, a confirmed earlier save is labeled as an earlier snapshot and the current edits remain unsaved; a conflict preserves the draft and offers a safe same-attempt view in a new tab. These wiring and state transitions are executable or source-regressed in `npm run test:system-design-workspace`; rendered draft retention, conflict recovery, focus, and assistive-technology behavior remain browser/manual validation.

## Continue and category progress

Continue is deterministic. It chooses, in order:

1. the most recently updated draft attempt;
2. the most recently updated attempt marked Needs review;
3. the most recently practiced canonical item marked Needs review;
4. the most recently practiced low-confidence canonical item;
5. the most recently updated low-confidence attempt;
6. the most recently updated remaining attempt;
7. the first unreviewed canonical item in curriculum order.

Ties preserve canonical/query order, and article views never create recency. Concept-category summaries count `reviewed` and `comfortable` as reviewed while displaying comfortable separately; the labels remain self-reported preparation states.

## Ownership, application context, and privacy

All reads resolve the cookie-backed actor on the server and scope by that actor. All writes use owner-resolving RPCs; clients never submit `user_id`. RLS prevents cross-user reads, and table grants prevent bypassing the validated attempt write RPCs. The composite `(application_id, user_id)` foreign key prevents an attempt from referencing another member's application. Application context is optional and is preserved through dashboard/application links, practice filters, the public problem library, problem detail, and attempt creation. Deleting an application sets only the attempt's application reference to null; deleting an attempt removes only that private rehearsal.

Private notes and full attempt documents are fetched only for authenticated request-time pages. List and dashboard queries select bounded summaries and never load full documents. Private bodies do not enter public HTML, static generation, metadata, analytics, or shared caches. Signed-out users can still browse the public curriculum, but private attempt routes require membership and do not reveal whether another user's record exists.

## Query and mutation boundaries

The practice home batches progress, bounded attempt summaries, and owned application options. Public lesson and problem pages fetch only the single relevant progress record or a bounded problem history. The full validated attempt document is fetched only in its owner-scoped editor. Indexes cover owner/item, owner/status, owner/bookmark, owner/update time, owner/problem history, and application lookup.

Full item-progress edits carry either the exact loaded `updated_at` revision or an explicit absent sentinel. The owner-derived database function serializes the same owner, item type, and item ID used by quick status changes, inserts only when the row is still absent, and updates only when the stored revision still matches. A zero-row result is a conflict, not success. Only a validated one-row result advances the editor revision, refreshes affected pages, and emits account-persistence analytics. Manual client submission preserves the current draft and blocks duplicate snapshots while a save is pending; its pending, success, and conflict wiring is source-regressed, while rendered draft retention and focus behavior remain browser/manual validation.

Shared preparation activity uses the status-only `set_system_design_item_quick_progress` boundary. It never submits confidence, bookmarks, or private notes, uses the same lock identity as full saves, and validates the returned canonical item ID before reporting success. Browser import remains insert-only. Consequently, full/full, full/quick, and absent/import races either commit one coherent full snapshot or report a conflict without silently overwriting the winner.

Deploy `202609030006_save_system_design_item_progress_if_revision.sql` before the revision-aware application. Migration-first makes already-loaded clients that call the legacy whole-row RPC fail with SQLSTATE `0A000` and `Revision-checked System Design progress saving is required`; application-first protects only new clients and leaves the old-client overwrite window open until the migration lands. A post-migration application rollback is safe but degraded because the legacy full-save path remains unavailable; retain the migration and roll forward.
