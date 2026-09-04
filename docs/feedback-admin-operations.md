# Feedback and admin operations

P0.8 adds a deliberately small operational layer for launch: private feedback, Interview Experience moderation, company-guide freshness reminders, and configuration visibility. It is not a CMS or a user-management tool.

## Feedback privacy and lifecycle

`/feedback` accepts anonymous and signed-in reports through the `submit_feedback_submission` RPC. The database validates bounded category, message, contact, consent, and page-context fields. It stores only a sanitized pathname: query strings, fragments, and private resource identifiers are removed or collapsed to a route pattern.

The Server Action also treats its runtime payload as unknown and requires one complete set of singleton string fields plus an explicit checkbox-presence marker before resolving an actor, creating an anonymous subject cookie, or calling the RPC. Duplicate, file-valued, missing, unknown, control-bearing, oversized, and inconsistent contact fields fail without submission, and only a canonical returned reference is announced as received. The hydrated form manually snapshots and dispatches the request so React does not reset the draft after a returned validation error. Fields remain editable during the request; when they differ from the submitted snapshot, the earlier report keeps its reference while the current edits remain visible and are explicitly labeled unsent. Rendered draft retention and focus behavior remain browser/manual validation; the repository executes parser, result, display-state, and source-integration checks.

Feedback is private operational data. There is no public lookup from a reference ID, no user feedback list, and no analytics event containing feedback text, contact details, references, or operator activity. A signed-in submission is included only in that account’s export. If that account is deleted, the report remains private operational data but its account linkage is set to `NULL`; anonymous feedback has no account linkage.

Optional contact information is used only for direct follow-up when the sender explicitly consents. It never creates a marketing subscription.

## Abuse controls

The repository enforces message/category bounds, Server Action origin protections, RPC validation, write-only public submission, and a four-submissions-per-15-minutes limiter. Anonymous throttling keys a database row from a SHA-256 hash of an opaque, HttpOnly browser token; it stores neither the raw token nor an IP address.

This does not prevent a determined sender from rotating a browser token. Production deployment must also enable a hosting-provider WAF or equivalent edge rate limit on feedback submission traffic. The edge rule should rate-limit request volume without logging feedback bodies, query strings, cookies, or raw IP addresses in application data.

## Admin authorization and bootstrap

`admin_memberships` is the only admin authorization source. Membership is checked in Postgres using `auth.uid()` and repeated inside every admin mutation RPC. The browser never receives a service-role credential, and admin routes return a not-found response to authenticated non-members.

After an authenticated actor is resolved, only a successful `false` membership result is treated as not found. Membership-service failures and malformed responses surface the sanitized, retryable application error instead of impersonating an ordinary denial. The same private-result boundary protects the operations dashboard and feedback views: failed or malformed counts cannot render as zero, failed or malformed lists cannot render honest-empty copy, and a failed item lookup cannot become a 404. Exact successful zero, empty, and missing results retain those meanings.

The first operator membership is a deliberate deployment bootstrap action, performed by the owner in the trusted Supabase administration environment after the account exists. The application contains no self-assignment, email-allowlist, user directory, or role-management screen. Once bootstrapped, the founder can triage feedback and moderate experiences from `/admin` without editing operational rows by hand.

The feedback queue requests an exact filtered count and pages through at most 100 reports at a time using deterministic creation-time and ID ordering. Previous and next links retain the active status and category filters, the visible range is disclosed, and an out-of-range page returns to the last real page. No queue result is silently truncated.

Feedback triage is revision-bound. The detail read carries the exact `updated_at` revision into a strict status-and-private-note form, and `update_feedback_submission_if_revision` serializes changes per item. Two operator snapshots from one revision can produce only one coherent winner; a stale save returns no row and cannot replace the newer status or private note. An exact no-op returns the current revision without timestamp or audit churn. The form keeps the operator draft and focus in place on conflict, offers a non-destructive latest-record view in a new tab, and distinguishes an earlier submitted snapshot from edits made while saving. These rendered draft and focus behaviors remain browser/manual validation; repository checks cover the parser, result resolver, action ordering, and component wiring.

## Audit and source review

Admin status changes and experience moderation create `admin_audit_events` with only actor, action, target, prior status, new status, and timestamp. Audit events never copy feedback bodies, contributor reports, contact details, or private notes.

Company-guide freshness is a read-only 180-day review reminder derived from P0.4 verification metadata. A reminder means “review evidence”; it does not assert a guide is false, alter a public guide, scrape a source, or publish new claims.

Operational health reports configuration presence only. It never renders values for secrets and never describes an external provider as healthy solely because an environment variable exists.
