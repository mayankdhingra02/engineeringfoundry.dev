# Interview calendar and reminders

> **Email delivery is unimplemented, not unconfigured.** `getReminderEmailProvider()` returns `null` by design — Phase 7 deliberately shipped no adapter, and Phase 9 confirmed that decision rather than adding a provider. Setting `REMINDER_EMAIL_PROVIDER` changes nothing today. The email toggle is disabled with an explanation, the server action refuses to enable it, and the worker returns `503`. In-app reminders are unaffected. The schema keeps `channel` and `email_enabled` so a future adapter needs no migration. See `lib/config/capabilities.ts`.

Phase 7 adds a private date-oriented view at `/calendar`, manual external-calendar exports, a preferred display timezone, sparse reminder preferences, durable reminder state, and a provider-ready email worker boundary. It does not add a generic notification center, task manager, or OAuth calendar synchronization.

## Calendar and exports

Upcoming view selects future `Planned`, `Scheduled`, and `Rescheduled` rounds for the next 180 days. Month view reads one bounded window, excludes cancelled rounds, and distinguishes completed rounds. Both resolve the authenticated actor on the server, scope by `user_id`, render at request time, and never expose private notes.

Every event keeps its stored interview timezone visible. A nullable IANA preference adds a second “your time” label only when different; it never rewrites `scheduled_at` or the source timezone.

The authenticated `.ics` endpoint emits UTC start/end values, a stable round-derived UID, `calendar_revision` as `SEQUENCE`, safe escaping/folding, the original timezone, meeting/location, and the preparation route. The Google endpoint redirects to an event template. Neither includes notes or stores OAuth tokens. `interview_calendar_exports` records latest exported revision and count. These are manual snapshots, not synchronized connections; re-export after a reschedule.

## Reminder lifecycle

`interview_reminder_preferences` has one owner row. In-app delivery and three sparse windows (preparation at three days, interview at one day, interview at one hour) default on; email defaults off. The actor-derived preference RPC validates IANA timezone names and resynchronizes future active rounds.

`interview_reminders` is unique by `(owner, round, type, channel, schedule revision)`. Only future windows are inserted. Clients have owner-only select and no direct writes.

- `reminder_schedule_revision` advances when `scheduled_at` changes. Undelivered rows for the old instant are cancelled and one fresh set is generated.
- `calendar_revision` advances for event metadata or lifecycle changes so re-exports get a new sequence.
- Cancelled, completed, expired, disabled, and stale-revision reminders are unclaimable.
- Deleting a round or application cascades reminders and export audit state.

## Email delivery boundary

No application email provider, scheduled job, or proven deployment scheduler existed when Phase 7 was implemented. The repository does not fabricate delivery: email preference stays disabled and the worker returns `503` until a real adapter exists.

`POST /api/internal/reminders/process` requires a constant-time Bearer-secret check, server-only service-role client, and concrete provider. After selecting hosting and a provider:

1. implement the provider adapter with provider-side idempotency;
2. return it from `getReminderEmailProvider()`;
3. configure server-only `SUPABASE_SERVICE_ROLE_KEY` and a high-entropy `REMINDER_WORKER_SECRET`;
4. configure an external HTTPS scheduler;
5. enable email preferences only when the adapter is genuinely available;
6. qualify delivery, recipient verification, retry classes, scheduler overlap, secret rotation, and logs.

Claims are atomic and bounded with `FOR UPDATE SKIP LOCKED`, use a ten-minute lease, retry after five then thirty minutes, and stop after three attempts. The worker revalidates immediately before sending and supplies the reminder row ID as the provider idempotency key. A small external-side-effect race remains between final validation and provider acceptance, so provider idempotency is mandatory.

Messages contain only company, role, round, schedule/timezone, preparation/settings URLs, and optional meeting link. Never log or send notes, answers, reflections, recipient addresses, or message bodies. Safe logs contain identifiers, reminder type, outcome, and timing only.

## Qualification

```bash
npm run test:interview-calendar-reminders
npm run test:interview-reminder-worker
supabase db lint --local --schema public --level warning --fail-on error
supabase test db
npm run qualify:persistence-local
```

The suites cover event serialization, timezones, authorization/cache boundaries, no-fake-provider behavior, exact reminder times, expired windows, preference disable/re-enable, completion, schema/RLS/grants, duplicate prevention, rescheduling, cancellation, provider failure/retry state, operational log privacy, two-user isolation, export auditing, anonymous denial, and cascade cleanup. The completed local run passed 66 calendar/model checks, 11 injected worker-outcome checks, 383 pgTAP assertions, and 116 two-user Data API checks. Local success does not qualify a hosted scheduler, provider, secret store, or production delivery.
