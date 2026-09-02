# Mock Interview Practice Lab model

The Mock Interview Practice Lab provides a credential-free core practice workspace at `/mock-interviews`. Visitors can run and copy a session without an account; signed-in visitors may explicitly save a private review. The lab provides structure for realistic practice without claiming that Engineering Foundry matches, schedules, or verifies participants.

## Practice modes

- **Solo practice** provides the candidate prompt, suggested structure, session timer, revealable guidance, and a qualitative self-review rubric.
- **Practice with a peer** provides a candidate packet plus a deliberately closed interviewer packet containing follow-ups, observation dimensions, timing suggestions, and the same qualitative rubric. The user brings their own peer.

The community CTA can help a visitor ask other community members to practice, but it does not guarantee availability or a match. Experienced-interviewer matching, profiles, bookings, payments, and a marketplace remain explicitly later work.

## Session plans and references

`data/mock-interviews/session-plans.json` contains typed plans with stable IDs and slugs, a track, suggested minute range, session sections, candidate instructions, interviewer instructions, one content reference, a rubric reference, and status.

The stable tracks are `dsa`, `system-design`, `ml-design`, and `behavioral`. Content references point into the existing DSA, System Design, ML System Design, and Behavioral registries. Plans do not duplicate the full source content. Active DSA plans reference only original Engineering Foundry questions; third-party problem statements are not reproduced.

`data/mock-interviews/index.ts` resolves those references for the UI and links each mock back to its complete preparation page. `scripts/validate-mock-content.mjs` verifies both plan integrity and the existence, active status, track, and original provenance of every reference.

Suggested minutes are an Engineering Foundry practice format, not official employer interview lengths.

## Rubric semantics

`data/mock-interviews/rubrics.json` defines one original Engineering Foundry rubric for each track. Every dimension can be marked **Strong**, **Developing**, or **Needs attention**. An unmarked dimension remains unmarked; no total score is calculated.

Rubrics are personal practice aids. They are not employer rubrics, hiring scores, pass probabilities, readiness percentages, percentiles, or performance predictions. They contain no company associations.

## Session privacy and explicit saving

Timer state, unsaved rubric marks, and unsaved free-text fields live only in React/browser memory. They are not written to `localStorage`, cookies, or the URL, and they clear on refresh. The clipboard is used only after the visitor explicitly chooses **Copy feedback** or **Copy session link**.

Nothing is saved automatically. When a signed-in visitor explicitly chooses **Save practice review**, a controlled server action validates the canonical session and stores the review in owner-scoped Supabase tables protected by row-level security. Signed-out or account-disabled visitors can still practice and copy their feedback, but cannot persist it.

Analytics may record stable non-sensitive identifiers for configuration, session start, randomization, guidance opening, feedback copy, and the community CTA. Analytics never receives qualitative marks, free text, clipboard contents, names, email addresses, or exact session duration.

Shareable URLs include only the track, prompt slug, and mode. They never contain participant identity or feedback.

## Product boundary

Owner-scoped practice-review storage is the only persistence in this model. Matchmaking, schedules, verified interviewer profiles, bookings, payments, public feedback, and a marketplace are not included. Any future matching or broader feedback-history product must be designed as a separate, consent-aware boundary rather than silently extending private review storage.
