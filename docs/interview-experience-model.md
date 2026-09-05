# Interview experience model

## Current product boundary

Engineering Foundry publishes a reviewed directory of high-level contributor reports and provides an account-backed contribution flow. Public visitors can read only reports that have both an approved lifecycle status and publication consent. The public projection omits author identifiers, moderation metadata, round identifiers and positions, and private round process notes; an authenticated contributor's base rows remain private to that owner.

Signed-in contributors can create a private draft, preview its bounded public-facing fields, submit it for review, edit a draft or a report returned for changes, withdraw an eligible report, and delete an eligible private report. A contributor can choose anonymous public presentation or their Engineering Foundry username. Username attribution is resolved only while the contributor's profile remains public and complete; otherwise the report falls back to anonymous attribution. Neither choice promises perfect anonymity. Reports describe one contributor's experience; they are not verified company policy, a current-process guarantee, or an interview-question bank.

The supported lifecycle is:

`Draft → Submitted → Needs changes → Approved / Rejected`

An approved report may be withdrawn by its author. Moderators review the submitted public-facing content, including preparation lessons and round context, and can approve, reject, or request changes without rewriting it. A separate published-report view lets an authorized moderator archive the exact reviewed revision with a required private rationale after a correction, removal, freshness, privacy, or safety request. Contributors see a private review note only when changes are requested. Every public report and the directory itself link to the contact pathways for correction, removal, and abuse reporting.

## Persistence and revision truth

An Interview Experience save is one owner-derived aggregate operation: the parent report, its bounded round context, and the requested draft-or-submitted state commit together. Existing reports carry the exact loaded `updated_at` revision. A stale, missing, foreign, or lifecycle-ineligible target does not overwrite the current aggregate and is reported as a conflict. Withdraw, delete, and moderation decisions use the same revision boundary, so an older screen cannot silently replace a newer contributor or moderator decision.

The contribution UI distinguishes the submitted snapshot from edits made while its request is pending. A confirmed earlier snapshot must not clear or claim to include newer local edits. Query failures for private contributor history and the moderation queue are distinct from genuinely empty results. Both views use exact counts, stable ordering, and server-side pages, so older private reports and moderation work remain reachable without claiming that the first page is the complete result set.

## Data and analytics boundaries

Private drafts, contributor identity, review notes, and unapproved reports never enter the public directory. Public company-route context can scope or prefill a company name, but it is not evidence about that company's rounds, questions, policies, or current process. Analytics may record only allowlisted coarse lifecycle actions and fixed source context; it must not include report text, company or role text, dates, topics, revision values, report identifiers, review notes, or other private form content.
