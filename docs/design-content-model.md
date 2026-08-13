# Design preparation content model

Engineering Foundry keeps System Design and ML System Design preparation in typed, repository-backed registries. Every detailed prompt and explanation is original Engineering Foundry content and renders publicly without authentication or Supabase credentials.

## System Design

Each problem has a stable ID and slug, summary, Engineering Foundry difficulty, roadmap stage, domains, reusable patterns, an original prompt, clarification and requirement guidance, hypothetical scale assumptions, architecture components, data and API notes, tradeoffs, failure modes, follow-ups, a checklist, status, and original-content provenance.

Domains describe the workload area, such as Storage or Real-time. Patterns describe reusable architecture choices, such as Caching, Pub/Sub, or Idempotency. A problem may use several of each without implying they are universally required.

## ML System Design

Each ML problem has a stable ID and slug, summary, Engineering Foundry difficulty, roadmap stage, domains, an original prompt, product goal, prediction target, metrics, data and labels, features, baseline, model discussion, training and evaluation, serving, monitoring, feedback loops, failures, tradeoffs, follow-ups, checklist, status, and original-content provenance.

Model families are design options rather than prescribed answers. Metrics are discussed conceptually; the content never invents achieved accuracy or business outcomes.

## Difficulty and roadmaps

`Foundation`, `Intermediate`, and `Advanced` are Engineering Foundry preparation levels. They are not claims about employer interviews. Roadmap stages organize learning progression and do not represent personal completion.

## Scale assumptions

Numbers in a practice problem are explicitly labeled example interview assumptions. They exist only to demonstrate capacity reasoning and must never be presented as production facts about a real product or company.

## Maintenance

Add new records with stable, URL-safe slugs, valid taxonomy values, complete critical sections, `active` or `needs_review` status, and original Engineering Foundry provenance. Do not add company associations. `npm run validate:design-content` enforces registry integrity and minimum—not maximum—dataset sizes before the production build.
