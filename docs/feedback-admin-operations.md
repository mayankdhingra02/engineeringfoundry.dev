# Feedback and admin operations

P0.8 adds a deliberately small operational layer for launch: private feedback, Interview Experience moderation, company-guide freshness reminders, and configuration visibility. It is not a CMS or a user-management tool.

## Feedback privacy and lifecycle

`/feedback` accepts anonymous and signed-in reports through the `submit_feedback_submission` RPC. The database validates bounded category, message, contact, consent, and page-context fields. It stores only a sanitized pathname: query strings, fragments, and private resource identifiers are removed or collapsed to a route pattern.

Feedback is private operational data. There is no public lookup from a reference ID, no user feedback list, and no analytics event containing feedback text, contact details, references, or operator activity. A signed-in submission is included only in that account’s export. If that account is deleted, the report remains private operational data but its account linkage is set to `NULL`; anonymous feedback has no account linkage.

Optional contact information is used only for direct follow-up when the sender explicitly consents. It never creates a marketing subscription.

## Abuse controls

The repository enforces message/category bounds, Server Action origin protections, RPC validation, write-only public submission, and a four-submissions-per-15-minutes limiter. Anonymous throttling keys a database row from a SHA-256 hash of an opaque, HttpOnly browser token; it stores neither the raw token nor an IP address.

This does not prevent a determined sender from rotating a browser token. Production deployment must also enable a hosting-provider WAF or equivalent edge rate limit on feedback submission traffic. The edge rule should rate-limit request volume without logging feedback bodies, query strings, cookies, or raw IP addresses in application data.

## Admin authorization and bootstrap

`admin_memberships` is the only admin authorization source. Membership is checked in Postgres using `auth.uid()` and repeated inside every admin mutation RPC. The browser never receives a service-role credential, and admin routes return a not-found response to authenticated non-members.

The first operator membership is a deliberate deployment bootstrap action, performed by the owner in the trusted Supabase administration environment after the account exists. The application contains no self-assignment, email-allowlist, user directory, or role-management screen. Once bootstrapped, the founder can triage feedback and moderate experiences from `/admin` without editing operational rows by hand.

## Audit and source review

Admin status changes and experience moderation create `admin_audit_events` with only actor, action, target, prior status, new status, and timestamp. Audit events never copy feedback bodies, contributor reports, contact details, or private notes.

Company-guide freshness is a read-only 180-day review reminder derived from P0.4 verification metadata. A reminder means “review evidence”; it does not assert a guide is false, alter a public guide, scrape a source, or publish new claims.

Operational health reports configuration presence only. It never renders values for secrets and never describes an external provider as healthy solely because an environment variable exists.
