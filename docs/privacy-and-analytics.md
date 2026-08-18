# Privacy and analytics boundary

Engineering Foundry stores private preparation work: applications, interview schedules, STAR stories, answers, notes, progress, and design attempts. That material belongs to the user and must not leave the product through measurement.

This document is the enforceable contract. `lib/privacy/routes.ts` and `lib/privacy/analytics-properties.ts` implement it, and `npm run test:private-route-privacy` enforces it in CI.

## One canonical route classification

Private-route classification has exactly one definition: `lib/privacy/routes.ts`. Analytics suppression and `robots.ts` both derive from it.

Before Phase 9 the analytics and robots lists were maintained separately and had drifted: both predated Phases 6–8, so `/calendar`, `/interviews`, and the System Design attempt editor were absent from each. A signed-in user visiting `/interviews/<round id>/prepare` sent that path — including the private round UUID — to PostHog. Phase 9 collapsed the two lists into one module so a route cannot be private in one system and measurable in another.

### Classification rule

A route is private when either holds:

1. The surface requires an account and has no public equivalent.
2. Its URL path can contain a private identifier — an application, round, story, answer, or attempt UUID.

A route stays public when its path only ever contains canonical public IDs and it renders useful signed-out content, even when signed-in users see private state layered on top.

`/dsa/questions/two-sum` and `/system-design/problems/url-shortener` are the deliberate examples: the slug is public curriculum, the page is genuinely useful signed out, and it should remain indexable and measurable. Private context on those routes travels in the query string, which the analytics layer strips. `/system-design/problems/<slug>/practice/<attempt id>` is private despite its public parent, which is why classification supports patterns and not only prefixes.

Classification fails closed: a malformed or relative path is treated as private.

## What analytics may know

The analytics layer may know that an event occurred. It must never know what the user wrote.

Three independent rules apply to every captured property, enforced in `before_send` so they hold even if a call site forgets:

1. **Denied names** — private free-text and document fields from every schema: `notes`, `private_notes`, the STAR fields, `answer_text`, `document`, `went_well`, and the rest.
2. **UUID-shaped values** — every public catalog identifier in this product is a readable slug, so a UUID in an analytics payload is always a private row identifier. PostHog's own `$session_id` and `$device_id` are exempt because they are the vendor's identifiers, not ours.
3. **Prose-length values** — analytics properties are labels and counts. Anything over 256 characters is private content that arrived by accident.

So `question_marked_solved` is acceptable. `question_marked_solved` carrying the user's solution note is not, and is dropped before the request leaves the browser.

Pageviews on private paths are suppressed entirely rather than sanitized. On public paths, URL properties keep the pathname and lose the query string and hash. Referrer and campaign properties are removed everywhere.

## Indexing

`robots.ts` derives its disallow list from the same module, including the wildcard form `/system-design/problems/*/practice` for the attempt editor. Every guarded page additionally declares `robots: { index: false, follow: false }` metadata, and the privacy regression fails if a guarded page omits it.

Robots exclusion is defense in depth. It is never authorization — the auth guards and RLS are.

## Regression

`npm run test:private-route-privacy` discovers private routes by walking `app/` for pages that call `requireMemberProfile` or `requireAuthenticatedUser`, rather than reading a maintained list. Adding an authenticated surface without classifying it fails the suite. The same run asserts public learning routes stay measurable, so the guard cannot be satisfied by over-blocking the curriculum.
