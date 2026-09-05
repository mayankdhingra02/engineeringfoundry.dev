# ML infrastructure and modern AI systems synthesis

Reviewed: 2026-09-04  
Scope: feature store, training/deployment platform, online inference, and production RAG dossiers.

## Accepted decision claims

- Feature systems must preserve point-in-time correctness, ownership, lineage, freshness, and online/offline compatibility.
- Model delivery needs immutable artifacts, validation gates, promotion metadata, serving compatibility, staged rollout, and rollback.
- Inference design separates request admission, routing, runtime execution, observability, capacity, and degradation behavior.
- RAG design separates ingestion, indexing, retrieval, generation, citation/provenance, evaluation, access control, and failure handling.
- Reliability is expressed with user-visible indicators and objectives; hardware, batching, caching, and model size are workload-dependent trade-offs.

## Evidence and mapping

`SRC-ML-FEAST-PIT`, `SRC-ML-TFDV`, `SRC-ML-MLFLOW-REGISTRY`, `SRC-ML-KSERVE`, `SRC-ML-K8S-ROLLOUT`, and `SRC-ML-GOOGLE-SLO` support platform and serving controls. `SRC-ML-RAG` supports the foundational retrieval-augmented architecture; `SRC-ML-NIST-RMF` and `SRC-ML-TEST-SCORE` support evaluation and risk controls.

## Exclusions

No vendor, vector database, serving runtime, model, or orchestration topology is treated as universally best.
