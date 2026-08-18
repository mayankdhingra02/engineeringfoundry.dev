# Application and interview tracker

The tracker is a private, authenticated workspace. Its query and mutation modules resolve the canonical server actor through `getAuthenticatedActor()`; they never accept a client-selected user ID. PostgreSQL grants, relationship constraints, and RLS are the final ownership boundary.

## Data model

- `applications` belongs to one auth user through `user_id`.
- `interview_rounds` belongs to one application and repeats `user_id` so owner-scoped scheduling queries remain efficient.
- The round RLS policies and composite `(application_id, user_id)` foreign key require both the round owner and parent application owner to match `auth.uid()`.
- `interview_rounds.application_id` uses `on delete cascade`, so deleting an application permanently removes its rounds in the same database operation.
- `round_number` stores explicit user-controlled order. Schedule changes never reorder the process implicitly; adjacent moves execute through one owner-scoped database transaction.
- `create_interview_round(...)` derives `user_id` from `auth.uid()`, locks the owned parent application, and allocates the next round number atomically so concurrent additions cannot collide.

Application and round status values are intentionally user-correctable. Any transition between supported enum values is legitimate because the tracker records reality rather than enforcing a recruiting workflow engine. Interview rounds remain accessible regardless of the parent application status.

Migration `202608130003_create_application_tracker.sql` creates both tables, validation constraints, update triggers, indexes, grants, and owner-only policies. Forward migration `202608140002_harden_private_workspace_integrity.sql` adds composite ownership, narrow column grants, unique round ordering, and the atomic move RPC without rewriting the deployed baseline. Migration `202608140004_align_application_tracker_phase2.sql` expands the practical pipeline statuses, adds the partial upcoming-interview index, and adds the owner-derived atomic round-creation RPC.

Application status remains user-correctable and includes Wishlist, Applied, Recruiter Screen, Interviewing, Offer, Accepted, Rejected, Withdrawn, and Ghosted. Legacy Interested and On Hold values remain supported so earlier records are not rewritten. Round status and result remain independent.

## Timezones

The form accepts a local date/time plus an IANA timezone such as `Asia/Kolkata`. Server validation converts the pair into a UTC `timestamptz` value. The selected timezone is retained on the round and used when displaying the schedule and day-level countdown. Unscheduled rounds store no timestamp and remain valid.

The dashboard does not embed a user's complete interview history. It fetches compact application summaries, an exact count of future actionable rounds, and only the next four scheduled records through the upcoming index.

## Verification

Run:

```bash
npm run test:application-tracker
npx supabase migration up --local
npx supabase test db
```

The pgTAP tracker suite covers owner CRUD, cross-user denial, round ordering, validation constraints, and cascade deletion.
