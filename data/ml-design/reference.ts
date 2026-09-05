export const mlDesignFramework = [
  { letter: "D", title: "Define the product decision", summary: "Name the user, action, prediction unit, constraints, baseline, and whether ML is justified." },
  { letter: "E", title: "Establish success criteria", summary: "Connect business and user outcomes to task metrics, slices, and guardrails." },
  { letter: "C", title: "Construct the learning signal", summary: "Trace exposure and events into labels, point-in-time examples, representations, and offline evidence." },
  { letter: "I", title: "Integrate learning into the system", summary: "Separate offline training from the online decision path and make timing, state, cost, and fallback explicit." },
  { letter: "D", title: "De-risk the launch", summary: "Use offline gates, shadow, canary, experiments where appropriate, staged rollout, and rollback." },
  { letter: "E", title: "Evolve the production system", summary: "Monitor data, system, predictions, and outcomes; diagnose before retraining or expanding complexity." },
] as const;

export const mlPrerequisiteChecks = [
  "I can explain supervised-learning intuition and a simple baseline.",
  "I can distinguish training from inference.",
  "I recognize overfitting and why train/validation/test data differ.",
  "I know common losses and broad model families without needing derivations.",
] as const;

export const mlLearningBranches = [
  {
    id: "ranking", title: "Ranking / recommendation", roles: "MLE · SWE-ML · Applied Scientist",
    conceptSlugs: ["product-problem-formulation-baselines", "data-collection-logging-quality", "labels-ground-truth-delay", "dataset-construction-splits-leakage", "features-feature-engineering", "embeddings-learned-representations", "offline-evaluation-by-task", "training-pipelines-reproducibility-lineage", "model-serving-performance-engineering", "online-experimentation-causal-validation", "monitoring-drift-performance-degradation", "feedback-loops-exploration-retraining"],
  },
  {
    id: "risk", title: "Risk / classification", roles: "MLE · SWE-ML",
    conceptSlugs: ["product-problem-formulation-baselines", "data-collection-logging-quality", "labels-ground-truth-delay", "dataset-construction-splits-leakage", "features-feature-engineering", "class-imbalance-sampling-negatives", "offline-evaluation-by-task", "calibration-decision-thresholds", "training-pipelines-reproducibility-lineage", "model-serving-performance-engineering", "model-registry-deployment-rollback", "monitoring-drift-performance-degradation", "responsible-ml-privacy-security-human-oversight"],
  },
  {
    id: "forecasting", title: "Forecasting / regression", roles: "Applied Scientist · MLE",
    conceptSlugs: ["product-problem-formulation-baselines", "data-collection-logging-quality", "labels-ground-truth-delay", "dataset-construction-splits-leakage", "features-feature-engineering", "offline-evaluation-by-task", "training-pipelines-reproducibility-lineage", "batch-streaming-online-inference", "monitoring-drift-performance-degradation", "feedback-loops-exploration-retraining"],
  },
  {
    id: "swe-ml", title: "SWE-ML systems depth", roles: "SWE-ML",
    conceptSlugs: ["training-pipelines-reproducibility-lineage", "feature-stores-training-serving-consistency", "batch-streaming-online-inference", "model-serving-performance-engineering", "model-registry-deployment-rollback", "monitoring-drift-performance-degradation", "reliability-graceful-degradation", "responsible-ml-privacy-security-human-oversight"],
  },
] as const;

export const mlRubric = [
  ["Problem framing", "Jumps to a model; decision unclear", "Defines user, task, and basic constraints", "Connects decision, ML task, and baseline", "Challenges whether ML is needed and anticipates stakeholders and evolution"],
  ["Data and labels", "Says only collect data", "Names plausible sources and labels", "Handles exposure, delay, noise, availability, and leakage", "Designs label operations, lineage, missing counterfactuals, and repair"],
  ["Metrics", "Uses a generic metric", "Chooses a task-appropriate offline metric", "Connects product, task, retrieval, slice, and guardrail measures", "Explains proxy conflict, causal limits, long-term effects, and capacity"],
  ["Architecture", "Draws boxes without flow", "Shows coherent train and serve paths", "Makes state, timing, version, and dependency boundaries clear", "Compares architectures and migration or evolution paths"],
  ["ML judgment", "Dumps model names", "Chooses a reasonable model family", "Justifies complexity from data, constraints, and baseline", "Finds non-model bottlenecks and defines evidence-driven escalation"],
  ["Production engineering", "Ignores serving and deployment", "Provides a basic service and pipeline", "Covers freshness, rollout, fallback, monitoring, and cost", "Handles multi-region or tenant concerns, incidents, migration, and ownership"],
  ["Experimentation", "Says only A/B test it", "Defines treatment and control", "Covers integrity, guardrails, ramp, and rollback", "Handles interference, long-term effects, safety, and decision limits"],
  ["Reliability and evolution", "Shows only the happy path", "Names one fallback and monitoring plan", "Uses multi-layer monitoring, diagnosis, and retraining policy", "Covers feedback, abuse, compatibility, and operational governance"],
  ["Risk and responsibility", "Adds a generic disclaimer", "Names a relevant risk", "Ties harm to controls, review, and appeal", "Anticipates conflicting risks, auditability, and policy evolution"],
  ["Communication", "Lists components without structure", "Presents an understandable sequence", "Keeps assumptions and trade-offs visible", "Adapts depth, handles challenge, and closes with decisions"],
] as const;

export const mlRubricBands = ["Needs development", "Acceptable", "Strong", "Exceptional"] as const;

export const mlRoleProfiles = [
  { title: "Entry / SDE I / entry ML", description: "A coherent simple end-to-end design: formulation, data, labels, one metric, leakage avoidance, one serving path, and one fallback." },
  { title: "SDE II / mid-level", description: "Point-in-time correctness, batch/stream decisions, deployment, monitoring, cost, delayed labels, alternatives, and failure handling." },
  { title: "Senior+", description: "Ambiguous framing, boundaries, migration, regional or tenant concerns where relevant, ownership, long-term effects, auditability, and cost-risk trades." },
  { title: "SWE-ML", description: "High production depth across training, feature, serving, deployment, monitoring, feedback, and reliability while retaining correct formulation." },
  { title: "MLE", description: "Balanced depth across the complete data, model, infrastructure, experimentation, and monitoring lifecycle." },
  { title: "Applied Scientist", description: "Stronger formulation, modeling judgment, metrics, experimentation, and uncertainty with enough production detail to remain realistic." },
] as const;

export const mlGlossary = [
  ["Baseline", "The simplest credible rule, heuristic, domain method, or model that a more complex design must beat."],
  ["Calibration", "Agreement between a predicted probability and observed outcome frequency for the relevant population and time."],
  ["Canary", "A release step that sends a bounded share of real production traffic to a new version and can affect users."],
  ["Counterfactual", "The outcome that would have occurred under a different action; usually not directly observed for the same event."],
  ["Data drift", "A change in input data or feature distribution; it is a signal to diagnose, not automatic proof that retraining is needed."],
  ["Embedding", "A learned vector representation optimized for a task; 2D diagrams are projections, not literal production geometry."],
  ["Exposure", "A record that an item, action, or treatment was actually shown or applied, including relevant position and policy context."],
  ["Feature freshness", "How old a feature value may be before it no longer satisfies the decision's quality or safety requirement."],
  ["Guardrail", "A measure or hard constraint that can block or reverse an optimization-driven launch."],
  ["Label maturation", "The policy and time window after which an observed outcome is trustworthy enough to use as a label."],
  ["Leakage", "Information unavailable at the historical decision time entering training or evaluation and inflating offline results."],
  ["NDCG@K", "A top-K ranking measure that gives more credit when relevant results appear earlier; relevance grades and K must be defined."],
  ["Point-in-time join", "A historical join that returns only feature values available at or before each example's event time."],
  ["Proxy objective", "A measurable target used in place of the desired product outcome; its mismatch and guardrails must remain explicit."],
  ["Recall@K", "The share of relevant candidates retrieved within the first K results; often used before final ranking evaluation."],
  ["Reranking", "A later, smaller-candidate ordering or policy stage that can use richer signals or constraints."],
  ["Sample-ratio mismatch", "A statistically unexpected difference between intended and observed experiment allocation that can indicate invalid data or assignment."],
  ["Shadow deployment", "Running a new version on copied production inputs without letting its output affect the user-visible decision."],
  ["Training-serving skew", "A semantic or distribution mismatch between feature computation during training and production inference."],
  ["Uncertainty / abstention", "Representing insufficient confidence or evidence and routing the decision to a safer fallback or review path."],
] as const;
