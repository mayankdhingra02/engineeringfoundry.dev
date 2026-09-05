---
artifact_id: RA-PLAY-DIAGNOSTIC-PLAN
title: Engineering Foundry Interview Playbook — Preparation Diagnostic, Readiness Model, and Adaptive Plan Generator
reviewed_at: 2026-09-05
status: approved
---

# Diagnostic and adaptive-plan contract

## Evidence model

The diagnostic is progressive, skippable, and evidence-seeking. It separates user confidence, preparation coverage, observed or self-reported evidence, freshness, conditions, and uncertainty. Completion is not mastery; self-report is not direct observation; a rejection is not proof of inability.

Dimension status is descriptive: supported evidence, mixed or repair evidence, self-reported only, unknown, or not relevant. The product does not collapse dimensions into one score or probability.

## Planner contract

The planner selects the smallest relevant action that can improve or clarify the highest-value gap, respects prerequisites and available time, narrows as the interview approaches, drops low-value missed work, and explains deferrals. Company modifiers never replace transferable preparation.

Every actionable result carries an action, rationale, target dimension, expected evidence, time category, exact deep link, alternative, source/context boundary, and return path. When facts are insufficient, the plan asks a bounded clarification question or exposes the unknown instead of guessing.

## Implementation evidence

`lib/interview-playbook/diagnostic.ts`, `planning.ts`, `planner-integration.ts`, the signed-in diagnostic form, and their focused qualification scripts encode the approved model. Existing owner-scoped revision checks and failure states remain the persistence boundary.

