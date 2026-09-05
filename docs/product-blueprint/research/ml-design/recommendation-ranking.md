# Recommendation and ranking systems synthesis

Reviewed: 2026-09-04  
Scope: personalized recommendation and social-feed ranking dossiers.

## Accepted decision claims

- Candidate generation and ranking are separate decision stages with different recall, latency, and capacity constraints.
- Labels are affected by exposure and position; offline splits must preserve time and user boundaries where the task requires them.
- Evaluation needs ranking quality, coverage, diversity, freshness, latency, and product guardrails rather than one universal metric.
- Launches require shadow or limited exposure, experiment-integrity checks, rollback criteria, and monitoring for distribution and feedback changes.

## Evidence and mapping

`SRC-ML-YOUTUBE-REC` supports the historical two-stage example only. `SRC-ML-RULES`, `SRC-ML-TECH-DEBT`, `SRC-ML-EXPERIMENT-SRM`, `SRC-ML-EXPERIMENT-PRE`, and `SRC-ML-GOOGLE-SLO` support the production, experimentation, and reliability decisions. The public dossiers retain Engineering Foundry authorship and do not claim a current employer architecture.

## Exclusions

No architecture, retrieval technique, or ranking model is presented as universally best. Traffic, catalog, freshness, and harm constraints drive the trade-off.
