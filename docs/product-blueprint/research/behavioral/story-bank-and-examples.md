---
artifact_id: RA-BEH-STORY-BANK-EXAMPLES
title: Engineering Foundry Behavioral Interview Story Bank, Answer Construction, and Annotated Examples
reviewed_at: 2026-09-05
status: approved
---

# Behavioral story bank and answer construction

## Canonical evidence model

The private Story record is the source of truth. Its stable context, role, period, situation, task, actions, result, reflection, themes, and question mappings drive concise and standard variants. Existing fact-integrity checks require variants to preserve the event, personal role, consequential action, real outcome, material adverse facts, measurement limits, team credit, and confidentiality boundary.

The learning path expands that operating model through a canonical-story worksheet: stakes and constraints; assigned and self-initiated responsibility; technical context; alternatives; decision criteria; personal versus team actions; obstacles and changed assumptions; immediate, downstream, unresolved, and adverse outcomes; evidence and causality limits; reflection; durable mechanisms; competency mappings; and reuse risk. These are preparation prompts around the private record, not fields collected by public pages.

## Construction decisions

- STAR, CAR, SAR, SOAR, and a natural evidence arc are optional clarity aids. None is the rubric.
- Concise and standard variants shorten context or change emphasis; they never add facts.
- Deep-dive and question-specific rehearsal begins from the same event and evidence boundary.
- A company modifier may change likely emphasis only when claim-level provenance exists.
- Worked examples are editorial teaching examples. They are not answer scripts or employer-approved responses.

## Coverage decisions

Coverage is reported as observable gaps and concentration: missing conflict or failure evidence, overuse of one story, shallow technical follow-up depth, stale evidence, or confidentiality risk. The product does not require one story count or calculate a behavioral-readiness percentage.

The preserved 48-question catalog is audited in place. Stable IDs, slugs, wording, categories, story compatibility, level/role relevance, follow-up families, privacy warnings, and review dates are added without replacing its prompts. True duplicates are rejected; distinct evidence targets such as conflict versus influence and ambiguity versus prioritization remain separate.

## Acceptance evidence

The audited catalog lives in `data/behavioral/catalog-audit.ts`; private story/answer behavior and fact-consistency contracts remain covered by `npm run test:behavioral-workspace` and `npm run test:behavioral-v1-polish`. The Required closure test also proves all 48 original IDs, slugs, and prompts are preserved.
