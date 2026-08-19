/**
 * Machine Learning System Design round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const mlSystemDesignDossier: RoundExecutionDossier = {
  slug: "ml-system-design",
  status: "published",
  lastReviewed: "2026-08-18",
  title:
    "ML System Design: connect the product decision to data, evaluation, serving, and feedback.",
  purpose:
    "Clarify the product objective and decision, frame the ML task, define useful success and guardrail metrics, reason about data and labels, establish a baseline, connect evaluation to serving and monitoring, and explain trade-offs without beginning with a model choice.",

  intendedEvaluation: [
    "Translate the product objective into a concrete decision, prediction, ranking, retrieval, generation, or other ML task.",
    "Define business, product, model, and guardrail metrics that reflect the requested outcome without treating one offline metric as sufficient evidence.",
    "Identify relevant data sources, label construction, sampling constraints, and important sources of bias, leakage, or missingness.",
    "Establish a simple baseline before discussing more complex modeling approaches.",
    "Connect training and offline evaluation to online serving, latency, reliability, and product integration.",
    "Reason about monitoring, drift, feedback loops, experimentation, safety, and iteration where the problem makes them relevant.",
    "Control scope, respond constructively to interviewer redirection, and communicate level-appropriate trade-offs across the full ML lifecycle.",
  ],

  companyVariation: [
    "Whether the interview emphasizes recommendation, ranking, search, fraud, moderation, forecasting, anomaly detection, personalization, generative systems, or another ML product surface.",
    "Whether the expected candidate background is software engineering, machine learning engineering, applied science, data science, or a hybrid.",
    "How deeply the interviewer expects modeling, statistics, experimentation, infrastructure, product reasoning, or serving details.",
    "Whether candidate-generated estimates for traffic, data volume, latency, freshness, or model-update frequency are expected.",
    "Whether the interviewer supplies data and label constraints or expects the candidate to discover them through clarification.",
    "Whether the round emphasizes an offline design, an online production lifecycle, or an existing system that must be improved.",
  ],

  beforeRound: [
    "Confirm the expected role emphasis, interview duration, drawing or coding tools, and any recruiter-provided ML System Design guidance.",
    "Practice taking one product objective through task framing, metrics, data, labels, baseline, evaluation, serving, monitoring, and feedback.",
    "Refresh only the ML concepts needed to explain trade-offs; do not replace product reasoning with a memorized model catalog.",
    "Use an ML Design practice problem or mock that includes ambiguous objectives, imperfect labels, serving constraints, and interviewer follow-ups.",
  ],

  flow: [
    {
      id: "clarify-product",
      title: "Clarify the product objective and decision",
      objective:
        "Establish the user or business outcome, the decision the system supports, and the scope the interview will evaluate.",
      actions: [
        "Restate who uses the system, what decision or experience changes, and what successful behavior looks like.",
        "Clarify the primary use case, important constraints, and which adjacent capabilities are out of scope.",
        "Ask whether the interviewer wants depth in product framing, modeling, data, infrastructure, experimentation, or the complete lifecycle.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "frame-ml-task",
      title: "Frame the ML task",
      objective:
        "Convert the product objective into an explicit prediction, ranking, retrieval, generation, estimation, or decision problem.",
      actions: [
        "State the model input, output, decision point, and unit of prediction or ranking.",
        "Explain why ML is useful relative to a simpler deterministic or heuristic baseline.",
        "Identify important constraints such as latency, freshness, interpretability, cost, or abuse resistance when they affect task framing.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "define-success",
      title: "Define success and guardrails",
      objective:
        "Choose measurements that connect model behavior to the product outcome without relying on one convenient metric.",
      actions: [
        "Define the primary business or product outcome before selecting model metrics.",
        "Choose offline metrics that help compare approaches and state what those metrics cannot prove.",
        "Identify important guardrails such as latency, reliability, safety, fairness, cost, or user-experience degradation where relevant.",
        "Explain how online evidence or experimentation would complement offline evaluation when the product permits it.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "data-labels-baseline",
      title: "Reason about data, labels, and the baseline",
      objective:
        "Establish what the system learns from, how supervision is created, and what simple approach provides a meaningful comparison.",
      actions: [
        "Identify the major data sources, events, entities, features, or content required by the task.",
        "Define how labels or targets are produced and discuss delay, noise, missingness, selection effects, and leakage where relevant.",
        "State the training and validation split logic at the level needed to protect the evaluation from contamination.",
        "Establish a heuristic, rules-based, historical, simple-model, or existing-system baseline before increasing complexity.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "model-evaluation-lifecycle",
      title: "Connect modeling to evaluation",
      objective:
        "Describe the modeling strategy only deeply enough to explain how it will be trained, compared, validated, and improved.",
      actions: [
        "Describe the model family or representation at the level needed for the system decision rather than listing many alternatives.",
        "Explain the training objective and how it aligns or conflicts with the selected evaluation metrics.",
        "Identify important slices, failure cases, or distribution segments that aggregate metrics could hide.",
        "State what offline evidence would justify moving to an online experiment or production validation.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "serve-monitor-feedback",
      title: "Design serving, monitoring, and feedback",
      objective:
        "Connect the trained system to real product decisions and show how performance remains observable after deployment.",
      actions: [
        "Trace the online request or batch decision from feature or input availability through inference to the product action.",
        "Discuss latency, throughput, freshness, availability, fallback behavior, and training-serving consistency only where they matter.",
        "Define monitoring for data quality, model quality, system health, drift, and guardrails at a proportionate level.",
        "Explain how feedback, delayed outcomes, experiments, or human review can produce future labels and model updates without assuming every observed action is unbiased ground truth.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "tradeoffs-validate-close",
      title: "Handle trade-offs, validate, and close",
      objective:
        "Confirm that the ML lifecycle supports the product objective and make unresolved risks and trade-offs explicit.",
      actions: [
        "Replay the path from product objective through task, data, training, evaluation, serving, monitoring, and feedback.",
        "Identify the largest product, data, model, serving, safety, or feedback-loop risk.",
        "Respond to interviewer follow-ups by changing the smallest affected part of the lifecycle and updating dependent assumptions.",
        "Summarize the important trade-offs, validation boundary, and the next investigation that would most reduce uncertainty.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute ML System Design round",
      assumption:
        "This is an adaptable range for a focused ML design discussion after introductions. Product ambiguity, role expectations, and interviewer direction may change the allocation.",
      phases: [
        {
          label: "Product objective, task, and success",
          range: "About 7–10 minutes",
          objective:
            "Establish the user outcome, ML decision, metrics, guardrails, and interview boundary.",
          adjustment:
            "Compress this when the prompt supplies a precise task and success definition; expand only when ambiguity changes the ML problem.",
        },
        {
          label: "Data, labels, and baseline",
          range: "About 9–13 minutes",
          objective:
            "Establish supervision, data quality, split concerns, and the initial comparison point.",
          adjustment:
            "Spend more time here when label quality or leakage is likely to dominate modeling quality.",
        },
        {
          label: "Modeling, serving, and critical depth",
          range: "About 15–20 minutes",
          objective:
            "Connect training and evaluation to the production decision and deepen the most important constraint.",
          adjustment:
            "Follow the interviewer toward modeling, data, experimentation, or serving rather than covering every ML topic superficially.",
        },
        {
          label: "Monitoring, feedback, and close",
          range: "Use the remaining 7–11 minutes",
          objective:
            "Trace post-deployment evidence, validate the lifecycle, and summarize risks and trade-offs.",
          adjustment:
            "Protect enough time to reconnect the final architecture to the original product objective.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute ML System Design round",
      assumption:
        "This range assumes a broader lifecycle discussion or deeper product, modeling, experimentation, infrastructure, or monitoring exploration. It is not a universal timing script.",
      phases: [
        {
          label: "Product objective, task, and success",
          range: "About 8–12 minutes",
          objective:
            "Define the decision, users, task, constraints, metrics, and guardrails.",
          adjustment:
            "Use one design-driving outcome rather than collecting every possible product objective.",
        },
        {
          label: "Data, labels, and baseline",
          range: "About 12–18 minutes",
          objective:
            "Reason about supervision, representativeness, leakage, data quality, and baseline behavior.",
          adjustment:
            "Go deeper on label generation when the product creates delayed, biased, sparse, or human-reviewed outcomes.",
        },
        {
          label: "Modeling, evaluation, and serving",
          range: "About 20–28 minutes",
          objective:
            "Connect the training objective, offline evidence, product integration, and important serving trade-offs.",
          adjustment:
            "Spend depth on the dimension the interviewer probes instead of naming many possible model architectures.",
        },
        {
          label: "Monitoring, feedback, and close",
          range: "Use the remaining 10–15 minutes",
          objective:
            "Examine degradation, feedback, experimentation, failure behavior, and the final validation boundary.",
          adjustment:
            "Keep enough time to reconcile any follow-up change across both the offline and online lifecycle.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Lead with the product decision",
      productive:
        "Explain what user or business decision the ML system improves before discussing model architecture.",
      avoid:
        "Starting with a favorite model family and retrofitting a product problem around it.",
    },
    {
      title: "Separate product, model, and guardrail metrics",
      productive:
        "State what each metric measures and which product question it helps answer.",
      avoid:
        "Presenting one offline metric as a complete definition of product success.",
    },
    {
      title: "Make label assumptions explicit",
      productive:
        "Explain where supervision comes from, when it arrives, and which biases or missing outcomes may affect it.",
      avoid:
        "Treating logged behavior as unbiased ground truth without discussing how it was generated.",
    },
    {
      title: "Trace the lifecycle rather than listing ML components",
      productive:
        "Connect data, training, evaluation, serving, monitoring, and feedback through one coherent decision flow.",
      avoid:
        "Naming feature stores, model servers, embeddings, experiments, and monitoring systems without explaining why each is needed.",
    },
  ],

  recovery: [
    {
      situation: "You started with a model before defining the product objective.",
      response:
        "Pause, state that model selection is premature, return to the user decision and success criteria, then re-evaluate whether the proposed model is justified.",
      avoid:
        "Continuing to optimize an architecture for an undefined product outcome.",
    },
    {
      situation: "The label definition becomes unreliable or unavailable.",
      response:
        "State which training and evaluation assumptions fail, propose a defensible proxy or alternative supervision path, and explain its limitations.",
      avoid:
        "Keeping the same metric and training plan while silently changing what the target represents.",
    },
    {
      situation: "Offline evaluation looks strong but the interviewer challenges product impact.",
      response:
        "Explain what offline evidence establishes, what remains unknown, and how an online or production validation would test the product hypothesis.",
      avoid:
        "Claiming that a strong offline metric guarantees user or business improvement.",
    },
    {
      situation: "The interviewer redirects toward infrastructure or serving.",
      response:
        "Connect the requested depth to the existing decision path and examine latency, freshness, throughput, reliability, consistency, or fallback behavior where relevant.",
      avoid:
        "Continuing a prepared modeling discussion after the interviewer has requested production-system depth.",
    },
    {
      situation: "Time is running short.",
      response:
        "Complete the product-to-serving lifecycle, name the largest unresolved data or model risk, and summarize the monitoring or experiment that would reduce uncertainty next.",
      avoid:
        "Adding more model alternatives while deployment, validation, or feedback remains unexplained.",
    },
  ],

  validation: [
    "Replay the product decision from user input or context through prediction, ranking, retrieval, generation, or another ML output.",
    "Confirm that the label or target corresponds to the desired outcome closely enough for the stated baseline and training plan.",
    "Check that the data split and evaluation approach avoid obvious temporal, entity, or target leakage.",
    "Connect offline evaluation to the serving path, latency or freshness requirements, and product guardrails.",
    "Identify the most important drift, feedback-loop, safety, bias, reliability, or data-quality risk relevant to the system.",
    "State which assumptions require online experimentation, human evaluation, production observation, or further data collection.",
  ],

  closing: [
    "Summarize the product objective, ML task, and primary success measure.",
    "Trace the final data-to-training-to-serving-to-monitoring-to-feedback lifecycle.",
    "State the two or three trade-offs or risks that most shaped the design.",
    "Identify the next experiment, data investigation, or production measurement that would reduce the largest remaining uncertainty.",
  ],

  questionsToAsk: [
    "How does the team balance offline model quality with product metrics and operational constraints when evaluating ML changes?",
    "Which parts of the ML System Design interview most distinguish strong mid-level and senior candidates?",
    "How does the team handle cases where labels, user feedback, or online outcomes are delayed or imperfect?",
  ],

  signals: {
    strong: [
      "Begins with the product objective and decision rather than a model architecture.",
      "Defines success using product, model, and guardrail evidence proportionately.",
      "Examines data and label quality, leakage, representativeness, and baseline behavior explicitly.",
      "Connects offline evaluation to online serving and product validation.",
      "Reasons about monitoring, drift, feedback, and failure behavior where relevant.",
      "Adapts the lifecycle coherently under interviewer redirection and communicates uncertainty honestly.",
    ],
    concern: [
      "Starts by selecting a complex model before defining the task or success criteria.",
      "Treats one offline metric as equivalent to product success.",
      "Assumes logged events are clean, representative, and unbiased labels.",
      "Discusses training while ignoring serving constraints or training-serving consistency.",
      "Adds ML infrastructure components without connecting them to a concrete lifecycle requirement.",
      "Ends without explaining monitoring, feedback, validation boundaries, or major unresolved risks.",
    ],
  },

  failureModes: [
    {
      failure: "Model-first design",
      correction:
        "Return to the product decision, task definition, success criteria, and baseline before increasing modeling complexity.",
    },
    {
      failure: "Metric tunnel vision",
      correction:
        "Separate product outcomes, offline model metrics, and guardrails, then explain what each can and cannot establish.",
    },
    {
      failure: "Label hand-wave",
      correction:
        "Describe how labels are generated, delayed, missing, noisy, or biased and how those properties affect training and evaluation.",
    },
    {
      failure: "Leakage blindness",
      correction:
        "Define the split and feature-availability boundary so future or target-derived information cannot silently contaminate evaluation.",
    },
    {
      failure: "Offline-only system",
      correction:
        "Trace how the trained model reaches the product, what constraints inference faces, and what production evidence will be monitored.",
    },
    {
      failure: "Infrastructure inventory",
      correction:
        "Introduce serving, feature, storage, orchestration, and monitoring components only when a lifecycle requirement justifies them.",
    },
    {
      failure: "No feedback-loop validation",
      correction:
        "Explain how predictions affect future observations and how the system avoids treating its own behavior as automatically unbiased supervision.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "Clear product framing, understandable task definition, basic metric and data reasoning, a simple baseline, and a coherent training-to-serving flow carry the most weight.",
      strongSignals: [
        "Defines the ML task from the product objective.",
        "Identifies plausible data and label sources.",
        "Uses a baseline before adding complexity.",
        "Connects evaluation to a basic serving and monitoring path.",
      ],
      avoid: [
        "Reciting model names without explaining the decision they support.",
        "Treating the dataset as complete and clean by default.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "Autonomous task framing, label quality, leakage prevention, metric judgment, serving constraints, experimentation, monitoring, and iteration become more visible.",
      strongSignals: [
        "Connects product metrics and offline evaluation without conflating them.",
        "Recognizes label, sampling, leakage, and distribution problems.",
        "Balances model quality with latency, freshness, reliability, and operational complexity.",
        "Designs monitoring and feedback that support safe iteration.",
      ],
      avoid: [
        "Optimizing offline performance without explaining production constraints.",
        "Discussing drift or experimentation generically without connecting it to the product lifecycle.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior execution adds product and portfolio framing, irreversible data decisions, feedback-loop judgment, rollout and experimentation strategy, organizational boundaries, safety, cost, and deliberate control of ML-system complexity.",
      strongSignals: [
        "Identifies which data, label, metric, and serving decisions are difficult to reverse.",
        "Balances product impact, model quality, reliability, latency, cost, safety, and operational ownership.",
        "Recognizes feedback loops, distribution shifts, launch risks, and cross-team dependencies where relevant.",
        "Keeps the lifecycle coherent while choosing deliberate depth instead of over-designing every ML subsystem.",
      ],
      avoid: [
        "Turning a bounded ML interview into a complete research or platform strategy presentation.",
        "Assuming seniority removes the need for explicit labels, metrics, flows, and validation.",
        "Discussing sophisticated modeling while leaving the product decision or production evidence ambiguous.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the diagramming, editor, screen-sharing, and any allowed calculation tools before the round.",
      "Keep the product objective, major lifecycle stages, and the currently discussed metric or flow visible while going deeper.",
      "State immediately when a tool or connection limitation prevents showing the intended artifact or calculation.",
    ],
    onsite: [
      "Confirm whether the interviewer expects a whiteboard lifecycle, architecture diagram, equations, pseudocode, or a combination.",
      "Keep the board legible by separating product, data/training, serving, and monitoring concerns instead of layering unrelated notes.",
      "Ask before erasing assumptions or metrics the interviewer may still be referencing.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for prompts, metrics, constraints, equations, or follow-ups to be enlarged, repeated, written, or divided into smaller parts when useful.",
      "A deliberate drawing, calculation, typing, or explanation pace is not evidence of weaker ML design ability.",
      "The Playbook does not infer capability from handwriting, arithmetic speed, speaking speed, eye contact, accent, or a particular diagramming style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical ML prompts or emphasis areas but must not be presented as current company policy.",
    "Use the verified Company Guide for supported role, level, product domain, format, modeling-depth, or infrastructure-depth modifiers.",
    "Do not infer a universal metric set, model family, experimentation requirement, system architecture, timing allocation, or scoring rubric.",
  ],

  interactions: [
    {
      id: "product-before-model",
      title: "Product framing before model selection",
      scenario:
        "The interviewer asks for a personalized content system and gives no modeling constraints.",
      weak:
        "The candidate immediately chooses a complex ranking model and begins discussing training infrastructure.",
      strong:
        "The candidate first clarifies which user action should improve, where the ranking decision occurs, what outcome matters, and what non-ML baseline exists.",
      annotation:
        "Model choice should follow the product decision, task, metrics, and constraints rather than replace them.",
      classification: "illustrative",
    },
    {
      id: "label-quality",
      title: "Treating observed behavior as a label",
      scenario:
        "A product logs clicks, but exposure and position strongly influence which items receive clicks.",
      weak:
        "The candidate uses every click directly as unbiased relevance ground truth.",
      strong:
        "The candidate identifies exposure and position effects, explains what the click signal does and does not represent, and proposes evaluation that acknowledges the resulting bias.",
      annotation:
        "A behavioral event becomes useful supervision only after reasoning about how the product generated that observation.",
      classification: "illustrative",
    },
    {
      id: "offline-online",
      title: "Offline quality versus product impact",
      scenario:
        "A new model improves the primary offline metric substantially.",
      weak:
        "The candidate says the model should be launched because the offline metric is higher.",
      strong:
        "The candidate explains that the offline result justifies further validation, then defines product and guardrail evidence needed before broad rollout.",
      annotation:
        "Offline evaluation can reduce uncertainty without proving user or business impact.",
      classification: "illustrative",
    },
    {
      id: "redirection",
      title: "Responding to serving-depth redirection",
      scenario:
        "The candidate is discussing training when the interviewer asks how predictions will meet a strict product latency requirement.",
      weak:
        "The candidate finishes the prepared training discussion before addressing serving.",
      strong:
        "The candidate reconnects the request path to feature availability, inference, latency budget, fallback behavior, and freshness, then adjusts the design accordingly.",
      annotation:
        "Interviewer redirection reveals where deeper evidence is required; the lifecycle should remain connected when focus changes.",
      classification: "illustrative",
    },
    {
      id: "short-on-time",
      title: "Closing a partial ML lifecycle",
      scenario:
        "The core task, data, and model path are defined, but little time remains for monitoring and iteration.",
      weak:
        "The candidate lists several additional model architectures and optimization ideas.",
      strong:
        "The candidate traces the current model into serving, names the most important drift or feedback risk, states the product guardrail, and identifies the next production measurement.",
      annotation:
        "A validated bounded lifecycle is stronger evidence than more disconnected modeling breadth.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general ML System Design interview execution, not a company scoring rubric.",
    "It does not reproduce proprietary prompts, complete company solutions, hidden evaluation standards, or confidential model architectures.",
    "It does not authorize external assistance during a live interview.",
    "ML algorithms, statistics, model families, metrics instruction, infrastructure concepts, and complete design exercises remain in the dedicated ML Design learning and practice section.",
  ],
};
