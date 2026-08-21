# Analytics and launch-evidence operations

This is the owner runbook for P0.9. It describes a reproducible production setup; it does not claim that a PostHog project, dashboard, analytics value, testimonial, or external impact record exists.

## Production PostHog setup

1. Create or select the production PostHog project. Keep staging and production projects separate.
2. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in the production build environment. These are browser-visible configuration values, not server secrets.
3. Deploy, then use PostHog Live Events from a disposable browser session to verify one public `$pageview` whose `$current_url` has only the production pathname.
4. Navigate to `/dashboard`, `/applications`, a Behavioral story, a System Design attempt, `/admin`, and an auth recovery URL. Verify that private routes produce no pageviews.
5. Add a harmless public query string and fragment, then verify neither appears in `$current_url` or any event property.
6. Complete a real sign-in and inspect the distinct ID/person properties. It may contain only the authenticated account ID and the fixed `onboarding_complete` property—never email, name, bio, links, or private profile values.
7. Sign out successfully. Confirm `sign_out_completed` precedes PostHog reset and later public browsing is anonymous.
8. Inspect event payloads for a DSA start, saved progress, continuation choice, and mock review. Confirm only the documented fixed properties are sent. Do not paste private test data into Live Events.

Analytics is intentionally disabled immediately by removing `NEXT_PUBLIC_POSTHOG_KEY` and redeploying. Do not enable autocapture, session recording, exception capture, surveys, product tours, referrer/campaign capture, or a browser-side analytics secret.

Engineering Foundry currently initializes optional analytics whenever the public PostHog key is present; it does not implement a consent banner or preference control. The deployment owner must obtain qualified legal/privacy advice for the actual jurisdictions and decide whether a functional consent control is required before enabling analytics. Do not add a decorative banner that does not change collection behavior.

## Metric definitions — `analytics-definition-v1`

| Metric | Definition | Never interpret as |
| --- | --- | --- |
| Visitors | Distinct PostHog persons/devices with at least one public `$pageview` in the selected window | Active or registered users |
| Registered users | Distinct identified users with a successful `sign_in_completed` or `account_created` in the selected window | Active users |
| Engaged users | Distinct persons with at least one first-useful-action event in the selected window | Interview-ready users |
| First useful action users | Distinct persons whose first event in `FIRST_USEFUL_ACTION_EVENTS` occurs in the selected window | Completions, outcomes, or mastery |
| Returning users | Distinct persons with qualifying activity in more than one selected time window | Seven-day retention unless the 7-day cohort formula is used |
| Completion/activity recorded | An emitted `preparation_activity_recorded` or `low_level_design_activity_recorded` with `status=completed` | Mastery, hiring success, or observed performance |
| Mock completion | A `mock_review_saved` event after a valid persisted self-review | A scored interview, referral, or hiring outcome |

Seven-day useful-action return is a PostHog cohort calculation: users with a first useful action on cohort day 0 who perform **any** first-useful action again on days 1–7 divided by users with a first useful action on day 0. Exclude the current incomplete cohort. Do not implement a client timer or a separate “return user” flag.

## Dashboard specifications

Create these dashboards manually in the production PostHog project after the event verification above. Do not create screenshots or mark them complete before they exist.

### 1. Acquisition / activation

- Visitors: unique persons, `$pageview`, public routes only, selected period.
- Signup starts: unique persons, `account_signup_started`.
- Confirmed email accounts: unique persons, `account_created`, `method=email`.
- First useful action: unique persons, event in the fixed first-useful-action set.
- First useful action rate: first-useful-action persons ÷ visitors in the same period. Clearly label it a rate of measured visitors, not all people reached.

### 2. Preparation

- Starts by `track`: `dsa_practice_started`, `system_design_practice_started`, `ml_design_practice_started`, `behavioral_practice_started`, `low_level_design_lesson_opened`, and `low_level_design_practice_started`.
- Recorded activity by `track` and `status`: `preparation_activity_recorded`, `low_level_design_activity_recorded`.
- Continuation presented/selected: `continuation_presented`, `continuation_selected`, grouped by coarse `track` and `continuation_source`.
- Saved plans: `study_plan_activated` and `study_plan_resumed`, grouped by `track` and their fixed persistence/continuation properties.
- Mock starts and self-review saves: `mock_session_started`, `mock_review_saved`, grouped only by `track` and `mode`.

### 3. Retention

- Seven-day useful-action return using the cohort formula above.
- Returning visitors: unique public `$pageview` persons with activity in two selected windows.
- Useful-action retention: first-useful-action cohort returned to any first-useful action on days 1–7.

### 4. Content discovery

- Global search selection: `search_used`, grouped by fixed `result_type`.
- Company-guide interest: `company_page_viewed`, grouped by `company_slug`.
- Resource opens: `resource_opened`, grouped by `category` and `resource_type`.
- Source verification opens: `verification_source_opened`, grouped by `content_type`.

Every dashboard must use exact event names above. Do not use admin events, free text, private route URLs, user-entered companies, compensation amounts, or any self-reported employment outcome. A chart that counts events must say “event count”; a people metric must use unique persons.

## Monthly evidence workflow

1. After a complete calendar month, export the exact aggregate values needed for `docs/impact-ledger/monthly-snapshot.template.json` from the configured production project.
2. Create `docs/impact-ledger/snapshots/YYYY-MM.json` from that template. Do not commit raw person-level event exports.
3. Include `analytics_definition_version`, a reproducible PostHog report URL or redacted export location, the measurement window, and only truthful nonnegative aggregate values.
4. Run `npm run validate:impact-ledger` before committing the snapshot.
5. If a definition changes, create a new version; never rewrite a historical snapshot to silently adopt new semantics.

## Evidence preservation

Use `docs/impact-ledger/README.md` for release records, monthly snapshots, testimonials, and independent-adoption evidence. No template is real evidence and templates are excluded from totals. Never turn feedback into a testimonial without explicit permission, and never infer product impact from correlation.
