# Search, retrieval, autocomplete, and advertising synthesis

Reviewed: 2026-09-04  
Scope: search ranking, autocomplete, and ads retrieval/ranking dossiers.

## Accepted decision claims

- Retrieval, scoring, policy filtering, and response assembly have distinct quality and latency budgets.
- Search and suggestion labels contain presentation and selection bias; evaluation must include slice and freshness checks.
- Advertising systems must separate relevance and marketplace objectives from eligibility, pacing, safety, and user-experience guardrails.
- Cache, index, and model versions require explicit compatibility, rollout, and rollback decisions.

## Evidence and mapping

The synthesis uses `SRC-ML-RULES` for staged delivery, `SRC-ML-METRICS` for threshold-aware measurement, `SRC-ML-TFDV` and `SRC-ML-TECH-DEBT` for data and feedback risks, and `SRC-ML-EXPERIMENT-SRM`, `SRC-ML-EXPERIMENT-PRE`, `SRC-ML-K8S-ROLLOUT`, and `SRC-ML-GOOGLE-SLO` for experiment and operating controls.

## Exclusions

It does not claim a specific search engine, auction, embedding model, or datastore is a universal production choice.
