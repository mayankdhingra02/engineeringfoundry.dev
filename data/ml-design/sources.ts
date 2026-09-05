export type MlSourceClass =
  | "original paper"
  | "official documentation"
  | "first-party engineering/science"
  | "standard / framework";

export interface MlDesignSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceClass: MlSourceClass;
  reviewedAt: string;
  use: string;
}

export const mlDesignSources: readonly MlDesignSource[] = [
  {
    id: "SRC-ML-RULES",
    title: "Rules of Machine Learning",
    publisher: "Google for Developers",
    url: "https://developers.google.com/machine-learning/guides/rules-of-ml",
    sourceClass: "first-party engineering/science",
    reviewedAt: "2026-09-04",
    use: "Baselines, instrumentation, launch sequencing, and production iteration guidance.",
  },
  {
    id: "SRC-ML-METRICS",
    title: "Classification: accuracy, recall, precision, and related metrics",
    publisher: "Google for Developers",
    url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",
    sourceClass: "official documentation",
    reviewedAt: "2026-09-04",
    use: "Task-sensitive classification metrics and the limitations of accuracy on imbalanced data.",
  },
  {
    id: "SRC-ML-TFDV",
    title: "TensorFlow Data Validation",
    publisher: "TensorFlow",
    url: "https://www.tensorflow.org/tfx/guide/tfdv",
    sourceClass: "official documentation",
    reviewedAt: "2026-09-04",
    use: "Schema validation, training-serving skew, and drift detection.",
  },
  {
    id: "SRC-ML-FEAST-PIT",
    title: "Point-in-time joins",
    publisher: "Feast",
    url: "https://docs.feast.dev/getting-started/concepts/point-in-time-joins",
    sourceClass: "official documentation",
    reviewedAt: "2026-09-04",
    use: "Historical feature retrieval and point-in-time correctness.",
  },
  {
    id: "SRC-ML-YOUTUBE-REC",
    title: "Deep Neural Networks for YouTube Recommendations",
    publisher: "Google Research",
    url: "https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/",
    sourceClass: "original paper",
    reviewedAt: "2026-09-04",
    use: "Historical two-stage candidate generation and ranking example; not a claim about a current production system.",
  },
  {
    id: "SRC-ML-TECH-DEBT",
    title: "Hidden Technical Debt in Machine Learning Systems",
    publisher: "Google Research",
    url: "https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/",
    sourceClass: "original paper",
    reviewedAt: "2026-09-04",
    use: "Feedback loops, data dependencies, configuration debt, and system-level ML risks.",
  },
  {
    id: "SRC-ML-TEST-SCORE",
    title: "The ML Test Score",
    publisher: "Google Research",
    url: "https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/",
    sourceClass: "original paper",
    reviewedAt: "2026-09-04",
    use: "Production-readiness tests and monitoring across data, models, infrastructure, and integration.",
  },
  {
    id: "SRC-ML-EXPERIMENT-SRM",
    title: "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments",
    publisher: "Microsoft Research",
    url: "https://www.microsoft.com/en-us/research/publication/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments-a-taxonomy-and-rules-of-thumb-for-practitioners/",
    sourceClass: "original paper",
    reviewedAt: "2026-09-04",
    use: "Experiment integrity, assignment checks, and sample-ratio mismatch diagnosis.",
  },
  {
    id: "SRC-ML-EXPERIMENT-PRE",
    title: "Patterns of Trustworthy Experimentation: Pre-Experiment Stage",
    publisher: "Microsoft Research",
    url: "https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-pre-experiment-stage/",
    sourceClass: "first-party engineering/science",
    reviewedAt: "2026-09-04",
    use: "Randomization units, guardrails, network effects, and pre-experiment validity checks.",
  },
  {
    id: "SRC-ML-MLFLOW-REGISTRY",
    title: "Model Registry Workflows",
    publisher: "MLflow",
    url: "https://mlflow.org/docs/latest/ml/model-registry/workflow",
    sourceClass: "official documentation",
    reviewedAt: "2026-09-04",
    use: "Versioned model artifacts, aliases, environment promotion, and lifecycle metadata.",
  },
  {
    id: "SRC-ML-KSERVE",
    title: "Welcome to KServe",
    publisher: "KServe",
    url: "https://kserve.github.io/website/docs/intro",
    sourceClass: "official documentation",
    reviewedAt: "2026-09-04",
    use: "Serving control/data-plane separation, autoscaling, routing, and model-runtime concerns.",
  },
  {
    id: "SRC-ML-K8S-ROLLOUT",
    title: "Deployments",
    publisher: "Kubernetes",
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
    sourceClass: "official documentation",
    reviewedAt: "2026-09-04",
    use: "Controlled rollout, progress detection, revision history, and rollback mechanics.",
  },
  {
    id: "SRC-ML-RAG",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    publisher: "arXiv",
    url: "https://arxiv.org/abs/2005.11401",
    sourceClass: "original paper",
    reviewedAt: "2026-09-04",
    use: "Foundational retrieval-augmented generation architecture and provenance motivation.",
  },
  {
    id: "SRC-ML-NIST-RMF",
    title: "Artificial Intelligence Risk Management Framework 1.0",
    publisher: "NIST",
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    sourceClass: "standard / framework",
    reviewedAt: "2026-09-04",
    use: "Lifecycle risk management, oversight, transparency, measurement, and governance framing.",
  },
  {
    id: "SRC-ML-GOOGLE-SLO",
    title: "Service Level Objectives",
    publisher: "Google Site Reliability Engineering",
    url: "https://sre.google/sre-book/service-level-objectives/",
    sourceClass: "first-party engineering/science",
    reviewedAt: "2026-09-04",
    use: "User-centered service indicators, objectives, and reliability decision boundaries.",
  },
  {
    id: "SRC-ML-FORECASTING",
    title: "Forecasting: Principles and Practice (3rd ed)",
    publisher: "OTexts",
    url: "https://otexts.com/fpp3/",
    sourceClass: "first-party engineering/science",
    reviewedAt: "2026-09-04",
    use: "Forecast horizons, time-series cross-validation, baselines, accuracy, and probabilistic forecasts.",
  },
];

const mlSourceById = new Map(mlDesignSources.map((source) => [source.id, source]));

export function getMlDesignSources(ids: readonly string[]) {
  return ids.map((id) => mlSourceById.get(id)).filter((source): source is MlDesignSource => Boolean(source));
}
