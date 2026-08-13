# Referral model

Engineering Foundry currently provides two public, browser-only preparation tools: a Referral Request Builder and a Referrer Toolkit. They help people communicate clearly; they do not operate a referral network.

## Current release

The request builder accepts role details, a short introduction, evidence of fit, relevant experience, and optional professional links. It generates original short and detailed packets for the visitor to review and copy. The referrer toolkit creates an availability card and provides an independent-review checklist, decision workflow, decline language, and a request-more-information template.

All draft and checklist state exists only in the React page session. The tools do not deliberately write draft values to browser storage, cookies, a database, or the URL. Refreshing or leaving the page clears the draft. The only supported query string is `mode=request` or `mode=referrer`; it selects a tool and contains no personal values.

Generating text does not send, publish, or submit anything. The visitor controls whether, where, and to whom copied text is shared. No account is required.

## Product boundaries

This phase does not provide:

- employee or candidate profiles;
- employment or identity verification;
- automatic matching or request routing;
- inboxes, request status, notifications, or saved history;
- a marketplace, booking, payment, or compensation flow;
- moderation of conversations that occur elsewhere; or
- any referral, interview, or employment guarantee.

A person considering a request remains responsible for an independent decision. Employer referral, confidentiality, and conflict-of-interest policies take precedence, and the employer does not endorse Engineering Foundry merely because its name appears in a user-entered draft or company guide. Referrers can request more context or decline without explanation. The current product does not support payments, tips, bounties, commissions, auctions, or any other compensation for referral access.

## Privacy and analytics

Referral-specific events record only tool mode, packet type, availability label, or CTA placement. Analytics must never receive company or role values, job links, job IDs, location, introductions, fit or experience text, professional URLs, resume links, review preferences, biographies, generated packets, or copied content.

`scripts/test-referral-privacy.mjs` enforces the source-level persistence and analytics boundary for the public Referral UI. `scripts/validate-referral-content.mjs` checks the static guidance and template library for structure, phase labels, uniqueness, placeholders, guarantees, compensation promotion, fake profiles, hard-coded contact data, and company-specific claims.

## Possible future phase

Authenticated profiles, voluntary routing, and private status could be considered later. They are not live or implied by the current UI. Any implementation would need opt-in controls, verified boundaries, moderation and abuse handling, consent-aware analytics, retention and deletion policies, and an explicit separation between platform activity and hiring outcomes.
