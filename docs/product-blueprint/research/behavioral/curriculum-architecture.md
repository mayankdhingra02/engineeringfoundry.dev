---
artifact_id: RA-BEH-CURRICULUM-ARCHITECTURE
title: Engineering Foundry Behavioral Interview Curriculum and Learning Architecture
reviewed_at: 2026-09-05
status: approved
---

# Behavioral curriculum and learning architecture

## Decision

The Required Behavioral curriculum is a finite sixteen-lesson path from evidence boundaries to calibrated follow-up practice. It teaches truthful evidence construction, not polished scripts or a readiness score. The published sequence is grouped into four passes: Evidence, Construction, Judgment, and Calibration.

The structure uses `SRC-BEH-OPM-STRUCTURED` and `SRC-BEH-OPM-GUIDE` for job-related competency evidence, consistent prompts, follow-up probes, and descriptive rating anchors. `SRC-BEH-GOVUK-SUCCESS` supports role-relative evidence and the separation of behaviors, experience, and technical evidence. These sources define boundaries; they do not establish a universal employer process.

## Approved lesson contract

Each lesson publishes an objective, working takeaway, two or more concepts, observable checks, a weak/stronger evidence comparison, an exercise, an answer check, source references, privacy guidance, and a next action. The sixteen lessons cover:

1. what behavioral interviews evaluate;
2. evidence rather than opinions;
3. STAR, CAR, SAR, SOAR, and natural evidence arcs without rigid scripts;
4. canonical story construction;
5. descriptive story coverage;
6. personal ownership in team work;
7. audience-appropriate technical depth;
8. honest impact evidence;
9. decisions and trade-offs;
10. conflict and influence;
11. failure and learning;
12. ambiguity and priorities;
13. leadership without title;
14. career narrative;
15. follow-ups and consistency; and
16. level/context calibration and self-review.

## Product boundary

Anonymous users can complete every lesson, browse the preserved question catalog, run a text-only drill, and inspect the descriptive rubric. Private story and answer text belongs only in the owner-scoped workspace or another tool the user controls. Lesson completion is activity evidence, never proof of mastery, personality, honesty, culture fit, or likely hiring outcome.

## Acceptance evidence

`data/behavioral/lessons.ts` is the canonical lesson manifest. Finite routes, navigation, source disclosures, exercises, privacy language, and Playbook returns are enforced by `npm run test:behavioral-curriculum` and `npm run test:behavioral-required-closure`.
