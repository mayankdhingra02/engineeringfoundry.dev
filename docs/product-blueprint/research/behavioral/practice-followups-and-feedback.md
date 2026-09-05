---
artifact_id: RA-BEH-PRACTICE-MOCK-FEEDBACK
title: Engineering Foundry Behavioral Practice, Follow-Ups, Mock Interviews, and Feedback UX
reviewed_at: 2026-09-05
status: approved
---

# Behavioral practice, follow-ups, and feedback

## Required practice loop

The public practice path is text-first and collects no answer text. The user selects a catalog question, target level, and context; rehearses privately; completes the eight-question self-review; marks evidence gaps; and receives one highest-value probe at a time. A deeper probe is available for each selected dimension.

Probe priority follows the selected question's evidence target and a stable rubric order. When evidence is already clear, the drill advances. The user can classify a gap as supported, needing strengthening, or unknown/unshareable. The last state preserves a safe boundary rather than coercing disclosure.

The summary reports only those classifications, checks consistency against the canonical-story boundary, and generates one to three useful actions. Every path includes an explicit Interview Playbook return. No response is labeled pass/fail and no likely hiring outcome is calculated.

## State and privacy contract

URL state contains only public question IDs and rubric labels: question, level, context, stage, selected gaps, position, depth, and outcome categories. Parsers reject unknown values and canonical serialization makes Back/Forward restore the visible question and drill step without storing private prose. Story, answer, transcript, feedback, application, and reflection content remains private and excluded from analytics.

## Mock and media boundary

The Required family does not need audio or video. Any later mock configuration must keep its timer optional, label durations as practice defaults rather than universal company claims, preserve an equivalent text path, and avoid accent, emotion, confidence, eye-contact, filler-word, deception, personality, or readiness scoring. The broader mock product remains tracked by `EF-MOCK`.

## Acceptance evidence

The deterministic engine is in `lib/behavioral/adaptive-practice.ts`, the rendered flow is in `features/behavioral/adaptive-practice.tsx`, and the exact behavior is covered by `npm run test:behavioral-required-closure` plus `npm run test:practice-url-state`. Desktop and 390px mobile browser review verified zero horizontal overflow and exact Back/Forward restoration.
