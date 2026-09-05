# ML Design core concepts synthesis

Reviewed: 2026-09-04  
Scope: the 20 public lessons in `data/ml-design/concepts.ts`.

## Accepted curriculum decisions

- Organize learning around product decisions, measurement, data, modeling, serving, experimentation, reliability, and responsible operation—not a catalog of model names.
- Require every lesson to state an objective, mental model, alternatives, product and operational consequences, failure modes, exercise, interviewer probes, and source IDs.
- Keep task metrics conditional on error costs and decision boundaries. Accuracy, a single offline score, or a universal readiness score cannot stand in for task-specific evidence.
- Treat baselines, point-in-time correctness, training-serving skew, feedback loops, versioning, rollbacks, and risk controls as first-class design material.
- Label seniority and role overlays as Engineering Foundry guidance rather than employer claims.

## Evidence map

Production iteration and baselines use `SRC-ML-RULES`; classification measurement uses `SRC-ML-METRICS`; data validation and point-in-time correctness use `SRC-ML-TFDV` and `SRC-ML-FEAST-PIT`; lifecycle and reliability use `SRC-ML-TECH-DEBT`, `SRC-ML-TEST-SCORE`, `SRC-ML-MLFLOW-REGISTRY`, `SRC-ML-KSERVE`, `SRC-ML-K8S-ROLLOUT`, and `SRC-ML-GOOGLE-SLO`; experimentation uses `SRC-ML-EXPERIMENT-SRM` and `SRC-ML-EXPERIMENT-PRE`; responsible operation uses `SRC-ML-NIST-RMF`.

## Exclusions

This synthesis does not prescribe one model, feature store, serving platform, or retraining cadence. Product claims remain bounded by each cited source's usage note.
