# Interview preparation content model

Prompt 6 content remains public, static, and useful without authentication or Supabase. The registries live under `data/behavioral`, `data/interview-tips`, and `data/resources`.

## Behavioral content

A behavioral question has a stable ID and slug, original prompt, category, observable signals, reusable story types, scope, follow-ups, answer guidance, common mistakes, status, and original Engineering Foundry provenance. Active prompts cannot contain company associations.

The category taxonomy describes the behavior being practiced. Story types describe experiences that could supply evidence. They are separate so one truthful experience can support several prompts without implying a fixed answer.

STAR—Situation, Task, Action, Result—is documented as an established answer structure, not an Engineering Foundry invention. Reflection is an optional final layer. Guidance must never become a canned answer or encourage fabricated achievements.

## Interview playbook

Playbook tips use stable IDs, one approved category, concise guidance, a reason the behavior matters, pitfalls to avoid, and a publication status. Checklists contain stable item IDs and plain-language labels.

Checklist state exists only in React memory. It is not written to local storage, Supabase, analytics, or a user account and may reset on refresh.

## Resource directory

A resource records its title, original summary, category, type, access model, direct URL, provider, internal/external flag, publication status, verification state, verification date, and discovery tags.

Internal resources must reference registered Engineering Foundry paths. External resources must use HTTPS without affiliate or tracking parameters. `verified` requires an actual check date; `unverified` and `needs_review` must not carry a verification date. Verification describes a checked destination, not endorsement or partnership.

## Originality, privacy, and maintenance

- Behavioral prompts, follow-ups, tips, and resource summaries use original Engineering Foundry wording.
- Proprietary guides, paid material, employer question banks, and confidential interview details are not reproduced.
- No company-specific behavioral claim is published without provenance.
- Story text and answer drafts are not collected or tracked.
- Additive datasets have minimum validation thresholds but no maximums. New content must keep stable IDs, pass the interview-content validator, and preserve the controlled taxonomies.
