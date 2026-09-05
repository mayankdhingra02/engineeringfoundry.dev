---
artifact_id: RA-BEH-RUBRICS-SENIORITY
title: Engineering Foundry Behavioral Evaluation Rubrics and Seniority Calibration
reviewed_at: 2026-09-05
status: approved
---

# Behavioral descriptive rubric and seniority calibration

## Rubric decision

Evaluation is dimension-level and descriptive. Each dimension stands alone across Needs evidence, Acceptable, Strong, and Exceptional bands; no aggregate score or pass threshold is produced. The eleven dimensions are relevance, specificity, ownership, judgment, technical understanding, outcome and evidence, learning, communication, follow-up depth, level/scope, and integrity.

The anchors describe observable answer evidence. They must never infer honesty, personality, culture fit, accent quality, emotion, confidence, eye contact, executive presence, deception, or hire probability. `SRC-BEH-OPM-GUIDE` supports consistent probing and evidence-based anchors. `SRC-BEH-EEOC-SELECTION` supports the job-related, validated-selection boundary; Engineering Foundry does not present the rubric as an employer selection procedure.

## Level calibration

- Entry: credible ownership at available scope, collaboration, learning, technical fundamentals, and honest limits.
- Mid / SDE II: end-to-end delivery, independent judgment, incidents, trade-offs, cross-functional work, and durable team/service improvements.
- Senior: ambiguous consequential problems, architecture and risk, cross-team influence, prioritization, mentoring, standards, and leverage through systems or people.
- Staff+: organizational framing, strategy, multi-team mechanisms, long-horizon trade-offs, sponsorship, and durable technical direction without requiring a management title.

Scope is contextual. International experience does not change the evidence standard. Small-company evidence can demonstrate Senior or Staff+ judgment when ambiguity, consequences, leverage, and durability support it. Individual contributors are assessed through technical and organizational leverage rather than people-management assumptions. Target level changes expected scope, not answer verbosity.

## Feedback order

The user completes the eight-question self-review before feedback. Feedback then moves from candidate reflection to observable evidence, deterministic findings, heuristic questions, labeled model-assisted observations when present, and one to three next actions. The current public path stops at deterministic self-classification and questions; it neither receives answer text nor performs model inference.

## Acceptance evidence

The exact dimensions, anchors, levels, contexts, self-review order, and exclusions are canonical in `lib/behavioral/adaptive-practice.ts` and rendered at `/behavioral/review`. `npm run test:behavioral-required-closure` enforces the contract.
