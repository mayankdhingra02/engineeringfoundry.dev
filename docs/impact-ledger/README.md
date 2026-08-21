# Engineering Foundry impact ledger

This directory is a human-auditable preservation system for **real, dated evidence after launch**. It is not a product database, analytics warehouse, public testimonial page, or source of automatically generated claims.

## Directory convention

- `monthly-snapshot.template.json` is a template only. Real aggregate snapshots belong in `snapshots/YYYY-MM.json`.
- `release-record.template.json` is a template only. Real releases belong in `releases/YYYY-MM-DD-<version>.json`.
- `evidence-record.template.json` is a template only. Real externally verifiable evidence belongs in `records/YYYY-MM-DD-<slug>.json`.

Do not commit a record unless it has an actual source/evidence reference. Templates and records with `record_kind: "template"` are never counted as evidence.

## Evidence record requirements

Every real record requires:

- date, type, title, source/channel, and an evidence URL or repository-relative evidence location;
- a named verifier and verification date;
- factual notes that distinguish observed facts from self-reported claims;
- explicit testimonial permission and public-attribution status when the type is `testimonial`.

Potential independent evidence includes university/group adoption, engineering-team/community adoption, independent articles or podcasts, talks/workshops, judging invitations, citations/references, and technical contributions resulting from the platform. Do not claim these categories until independently evidenced.

## Claim boundary

Analytics measures product activity under `analytics-definition-v1`; it does not prove jobs obtained, hiring outcomes, quality, causation, or industry status. Testimonials require actual wording and consent. Any self-reported outcome must remain labeled self-reported.

Examples of acceptable evidence language when an actual source supports it: “1,240 unique visitors in September under analytics-definition-v1.” Examples that are not allowed without causal evidence: “Engineering Foundry helped 1,240 people get jobs.”

## Validation

Monthly snapshots require separate reproducible aggregate references for PostHog analytics, the authoritative Supabase/Auth registered-account count, and any product-data aggregate (for example, approved Interview Experiences). Do not commit person-level exports. `registered_users` is the end-of-window account total, never a `sign_in_completed` event count.

Run `npm run validate:impact-ledger` to validate committed real JSON records. It rejects templates as real records, impossible/negative metric values, unknown definition versions, missing metric-family source references, and testimonials without explicit consent metadata. It deliberately does not calculate totals or generate claims.
