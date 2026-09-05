# Mock Interview Practice Lab model

The Mock Interview Practice Lab provides a credential-free core practice workspace at `/mock-interviews`. Visitors can run and copy a session without an account; signed-in visitors may explicitly save a private review. The lab provides structure for realistic practice without claiming that Engineering Foundry matches, schedules, or verifies participants.

## Practice modes

- **Solo practice** provides the candidate prompt, suggested structure, session timer, revealable guidance, and a qualitative self-review rubric.
- **Practice with a peer** provides a candidate packet plus a deliberately closed interviewer packet containing follow-ups, observation dimensions, timing suggestions, and the same qualitative rubric. The user brings their own peer.

The implemented formats are guided practice, timed or untimed solo rehearsal, and a peer-led structured mock. AI-led mocks, coach- or expert-led sessions, company-shaped simulations, mini-loops, and full-loop simulations are labeled unavailable rather than implied by generic controls.

The community CTA can help a visitor ask other community members to practice, but it does not guarantee availability or a match. Experienced-interviewer matching, profiles, bookings, payments, and a marketplace remain explicitly later work.

## Session plans and references

`data/mock-interviews/session-plans.json` contains typed plans with stable IDs and slugs, a track, suggested minute range, session sections, candidate instructions, interviewer instructions, one content reference, a rubric reference, and status.

The stable tracks are `dsa`, `system-design`, `low-level-design`, `ml-design`, and `behavioral`. Content references point into the DSA, System Design, Low-Level Design, ML System Design, and Behavioral registries. Plans do not duplicate the full source content. Active DSA plans reference only original Engineering Foundry questions; third-party problem statements are not reproduced. The LLD registry contains 59 original bounded prompts and derives a consistent session structure from each prompt record.

`data/mock-interviews/index.ts` resolves those references for the UI and links each mock back to its complete preparation page. `scripts/validate-mock-content.mjs` verifies both plan integrity and the existence, active status, track, and original provenance of every reference.

Suggested minutes are an Engineering Foundry practice format, not official employer interview lengths.

## Rubric semantics

`data/mock-interviews/rubrics.json` defines one original Engineering Foundry rubric for each track. Every dimension can be marked **Strong**, **Developing**, or **Needs attention**. An unmarked dimension remains unmarked; no total score is calculated.

Rubrics are personal practice aids. They are not employer rubrics, hiring scores, pass probabilities, readiness percentages, percentiles, or performance predictions. They contain no company associations.

## Conditions, provenance, and evidence

Before starting, the candidate records whether the prompt is fresh or repeated, whether timing is suggested, extended, or disabled, and whether the planned hint policy is none, on-request, or guided. During the debrief, they record actual hint/redirection use and whether the session completed, was interrupted, or encountered a technical/platform failure. Interrupted and failed sessions require a short issue description.

Solo marks are labeled candidate self-review. Peer marks are labeled user-provided peer feedback, and Engineering Foundry does not claim to have matched or verified the evaluator. Both remain `self-report` provenance because the candidate submits the record; a peer label never silently becomes verified human observation.

Only a completed fresh-prompt review can contribute a qualitative signal to the Interview Playbook. Repeated, interrupted, and technical-failure sessions remain in practice history with an `unknown` signal, so they cannot increase or reduce capability evidence. Assistance remains visible in the evidence summary rather than being collapsed into a score. Free-text reflections remain private and do not determine evidence.

The debrief links back to the exact DSA, System Design, ML System Design, or Behavioral practice page when one exists. LLD prompts link to the exact published exercise when one exists; broader catalog prompts use the LLD practice library and are labeled as an area handoff rather than falsely claiming an exact exercise. Every track also links back to the Interview Playbook for the next planning decision.

## Session privacy and explicit saving

Timer state, session conditions, unsaved rubric marks, and unsaved free-text fields live only in React/browser memory. They are not written to `localStorage`, cookies, or the URL, and they clear on refresh. Back/Forward traversal clears the private session workspace and returns focus to the session builder when focus was inside the removed workspace. The clipboard is used only after the visitor explicitly chooses **Copy feedback** or **Copy session link**.

Nothing is saved automatically. When a signed-in visitor explicitly chooses **Save practice review**, a controlled server action validates the canonical session and stores the review in owner-scoped Supabase tables protected by row-level security. Signed-out or account-disabled visitors can still practice and copy their feedback, but cannot persist it.

Analytics may record stable non-sensitive identifiers for configuration, session start, randomization, guidance opening, feedback copy, and the community CTA. Analytics never receives qualitative marks, free text, clipboard contents, names, email addresses, or exact session duration.

Shareable URLs include only the track, prompt slug, and mode. They never contain timing, exposure, hint policy, actual assistance, outcome, participant identity, or feedback.

All session operation and review controls have text labels and keyboard-operable native inputs. No microphone, camera, audio, or video is required; extended and untimed paths preserve the complete prompt, packets, rubric, and handoff experience.

## Product boundary

Owner-scoped practice-review storage is the only persistence in this model. Matchmaking, schedules, verified interviewer profiles, bookings, payments, public feedback, and a marketplace are not included. Any future matching or broader feedback-history product must be designed as a separate, consent-aware boundary rather than silently extending private review storage.
