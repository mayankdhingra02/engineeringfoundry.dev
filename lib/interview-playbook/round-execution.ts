/**
 * Canonical round-execution taxonomy and a conservative resolver from a
 * free-text round label to independent stage/modality/signal attributes.
 *
 * This exists to prevent later Playbook surfaces from collapsing a calendar
 * label into one assumed interview type. "Technical Screen," "Onsite," and
 * "Final" describe *where a round sits in a process* or *how it is
 * delivered* — never what will actually be evaluated. Only explicit signal
 * language in the label may identify that, and when it can't, the resolver
 * says so and asks for clarification rather than guessing.
 *
 * Pure and dependency-free: no React, Next.js, Supabase, auth, environment
 * variables, current time, randomness, or network access. Intended for reuse
 * by both a future public reference surface and the private Playbook.
 */

// ---------------------------------------------------------------------------
// Stage / modality / signal vocabulary
// ---------------------------------------------------------------------------

export type InterviewRoundStage =
  | "recruiter-screen"
  | "assessment"
  | "technical-screen"
  | "hiring-manager"
  | "loop"
  | "final"
  | "unknown";

export type InterviewRoundModality =
  | "asynchronous-assessment"
  | "take-home"
  | "live-remote"
  | "onsite"
  | "presentation"
  | "unknown";

/**
 * Stable competency signals. "final," "onsite," "technical-screen," and
 * "bar-raiser" are deliberately absent — those identify process position or
 * delivery shape, not what gets evaluated (Rule 3 / Rule 4).
 */
export type InterviewRoundSignal =
  | "algorithmic-coding"
  | "practical-coding"
  | "debugging"
  | "code-review"
  | "low-level-design"
  | "system-design"
  | "ml-system-design"
  | "behavioral"
  | "project-deep-dive"
  | "hiring-manager"
  | "cross-functional"
  | "technical-presentation";

// ---------------------------------------------------------------------------
// Guide catalog
// ---------------------------------------------------------------------------

export type RoundExecutionGuideTreatment =
  | "complete"
  | "focused-variant"
  | "composition-shell"
  | "later";

export type RoundExecutionGuideSlug =
  | "recruiter-screen"
  | "online-assessment"
  | "take-home"
  | "technical-screen"
  | "algorithmic-coding"
  | "practical-coding"
  | "debugging"
  | "code-review"
  | "low-level-design"
  | "system-design"
  | "ml-system-design"
  | "behavioral"
  | "project-deep-dive"
  | "hiring-manager"
  | "cross-functional"
  | "technical-presentation";

export type RoundExecutionGuideSummary = Readonly<{
  slug: RoundExecutionGuideSlug;
  title: string;
  shortTitle: string;
  treatment: RoundExecutionGuideTreatment;
  v1: boolean;
  description: string;
  quickReference: Readonly<{
    firstMove: string;
    beforeDone: string;
    biggestTrap: string;
  }>;
  ownerBoundary: string;
  relatedHrefs: readonly string[];
}>;

/** Order is product-significant: process position first, then every signal in taxonomy order. */
export const ROUND_EXECUTION_GUIDES: readonly RoundExecutionGuideSummary[] = [
  {
    slug: "recruiter-screen",
    title: "Recruiter or introductory screen",
    shortTitle: "Recruiter screen",
    treatment: "complete",
    v1: true,
    description:
      "Align on the role, explain relevant experience concisely, and confirm the actual interview process and logistics.",
    quickReference: {
      firstMove:
        "Let the recruiter establish the agenda, then connect your background to the role without reciting your entire résumé.",
      beforeDone:
        "Confirm the known round sequence, format, tools, schedule, next step, and appropriate contact path.",
      biggestTrap:
        "A rambling biography or treating unofficial candidate reports as company policy.",
    },
    ownerBoundary:
      "The Playbook owns live recruiter-screen execution. Company Guides own verified process facts, Applications own the candidate's schedule, and Salary Negotiation owns compensation strategy.",
    relatedHrefs: ["/applications", "/companies", "/behavioral"],
  },
  {
    slug: "online-assessment",
    title: "Online assessment",
    shortTitle: "Online assessment",
    treatment: "complete",
    v1: true,
    description:
      "Read the rules and tool policy, manage the assessment deliberately, validate submissions, and preserve integrity.",
    quickReference: {
      firstMove:
        "Read the complete instructions, timer behavior, supported language, submission rules, and permitted-resource policy before solving.",
      beforeDone:
        "Run the available tests, inspect compile or runtime behavior, and confirm that the intended submission was recorded.",
      biggestTrap:
        "Spending the entire assessment on one blocked task or relying only on sample cases.",
    },
    ownerBoundary:
      "The Playbook owns assessment execution, time control, validation, and integrity. DSA and language guides own algorithms, patterns, syntax, and practice questions.",
    relatedHrefs: ["/dsa", "/dsa/practice", "/mock-interviews"],
  },
  {
    slug: "take-home",
    title: "Take-home exercise",
    shortTitle: "Take-home",
    treatment: "complete",
    v1: true,
    description:
      "Control scope, produce a reproducible work product, document material decisions, and submit exactly as instructed.",
    quickReference: {
      firstMove: "Read every requirement and establish the minimum complete scope before implementation.",
      beforeDone:
        "Perform a clean run or build, execute meaningful tests, review the submission contents, and document material assumptions.",
      biggestTrap: "Overbuilding a speculative production platform before the required behavior works.",
    },
    ownerBoundary:
      "The Playbook owns work-product execution, scope control, validation, and submission discipline. Technical curricula own the language, framework, and design concepts used in the solution.",
    relatedHrefs: ["/companies", "/mock-interviews"],
  },
  {
    slug: "technical-screen",
    title: "Technical phone or video screen",
    shortTitle: "Technical screen",
    treatment: "composition-shell",
    v1: true,
    description:
      "Confirm the agenda and compose the relevant execution guides instead of assuming that every technical screen evaluates the same signals.",
    quickReference: {
      firstMove:
        "Let the interviewer state the agenda and confirm the focus once when it materially differs from the invitation.",
      beforeDone:
        "Summarize the work completed for each signal that actually appeared and identify any unfinished portion precisely.",
      biggestTrap:
        "Forcing one predetermined coding, design, or behavioral script onto an interviewer-led mixed session.",
    },
    ownerBoundary:
      "The shell owns stage and modality context only. The underlying coding, design, behavioral, project, or practical guides own signal-specific execution.",
    relatedHrefs: ["/applications", "/companies", "/mock-interviews"],
  },
  {
    slug: "algorithmic-coding",
    title: "Algorithmic coding interview",
    shortTitle: "Algorithmic coding",
    treatment: "complete",
    v1: true,
    description:
      "Clarify material ambiguity, select and explain an approach, implement working code, test it, and close honestly.",
    quickReference: {
      firstMove: "Restate the task and clarify only the constraints or behaviors that can change the solution.",
      beforeDone:
        "Run representative tests, cover material edge cases, state complexity, and identify any unresolved defect.",
      biggestTrap: "Coding before understanding the problem or narrating keystrokes instead of decisions.",
    },
    ownerBoundary:
      "The Playbook owns live execution, communication, testing, recovery, and closing. DSA owns algorithms, patterns, questions, roadmaps, and complexity instruction.",
    relatedHrefs: ["/dsa", "/dsa/practice", "/mock-interviews"],
  },
  {
    slug: "practical-coding",
    title: "Practical coding interview",
    shortTitle: "Practical coding",
    treatment: "complete",
    v1: true,
    description:
      "Understand expected behavior and code boundaries, make a proportionate change, test it, and communicate maintainability and production risk.",
    quickReference: {
      firstMove:
        "Establish the expected behavior, available code boundary, test command, and constraints before changing the code.",
      beforeDone: "Run relevant tests and summarize the change, remaining risk, and any deliberately deferred work.",
      biggestTrap:
        "Rewriting the codebase instead of making the smallest maintainable change that satisfies the requirement.",
    },
    ownerBoundary:
      "The Playbook owns unfamiliar-codebase execution and change communication. Specialist language and engineering material owns framework and implementation teaching; Mock Interviews owns simulation.",
    relatedHrefs: ["/mock-interviews"],
  },
  {
    slug: "debugging",
    title: "Debugging interview",
    shortTitle: "Debugging",
    treatment: "complete",
    v1: true,
    description:
      "Reproduce the failure, form and test hypotheses, isolate the cause, verify the fix, and communicate uncertainty honestly.",
    quickReference: {
      firstMove:
        "Reproduce the failure and identify the earliest observable boundary where actual behavior diverges from expected behavior.",
      beforeDone: "Confirm the root cause, verify the fix against the original failure, and run a regression check.",
      biggestTrap:
        "Making random edits without a falsifiable hypothesis or claiming a fix before reproducing the original failure.",
    },
    ownerBoundary:
      "The Playbook owns diagnostic execution and recovery behavior. Mock Interviews owns the simulated debugging environment and feedback workflow.",
    relatedHrefs: ["/mock-interviews"],
  },
  {
    slug: "code-review",
    title: "Code-review interview",
    shortTitle: "Code review",
    treatment: "focused-variant",
    v1: true,
    description:
      "Understand intent, prioritize correctness and risk, explain findings proportionately, and avoid reducing review to style preferences.",
    quickReference: {
      firstMove:
        "Understand the intended behavior and surrounding constraints before judging an isolated implementation choice.",
      beforeDone:
        "Provide a prioritized summary separating correctness, security, reliability, maintainability, testing, and optional style feedback.",
      biggestTrap: "Producing a long list of cosmetic comments while missing behavior, risk, or test gaps.",
    },
    ownerBoundary:
      "The Playbook owns review execution and prioritization. Practical engineering and Low-Level Design curricula own implementation and design principles.",
    relatedHrefs: ["/mock-interviews"],
  },
  {
    slug: "low-level-design",
    title: "Low-Level or object-oriented design interview",
    shortTitle: "Low-Level Design",
    treatment: "complete",
    v1: true,
    description:
      "Clarify use cases, establish responsibilities and relationships, evolve a minimal design, and validate it through representative flows.",
    quickReference: {
      firstMove:
        "Establish the core use cases, important constraints, and expected artifact before introducing classes or patterns.",
      beforeDone:
        "Walk a representative use case through the objects, responsibilities, state changes, and important failure behavior.",
      biggestTrap:
        "Collecting design patterns or classes without a clear use case, responsibility boundary, or executable flow.",
    },
    ownerBoundary:
      "The Playbook owns in-round scoping, responsibility discussion, diagram-to-code transition, and validation. The Low-Level Design section owns OO principles, patterns, and design exercises.",
    relatedHrefs: ["/low-level-design", "/low-level-design/practice", "/mock-interviews"],
  },
  {
    slug: "system-design",
    title: "System Design interview",
    shortTitle: "System Design",
    treatment: "complete",
    v1: true,
    description:
      "Clarify requirements, establish a minimal end-to-end design, trace important flows, deepen selected areas, and explain trade-offs.",
    quickReference: {
      firstMove:
        "Clarify the product objective, primary users, important requirements, scale assumptions, and what the interviewer wants emphasized.",
      beforeDone:
        "Replay the primary flow, identify major bottlenecks and failure behavior, and summarize the most important trade-offs.",
      biggestTrap: "Listing technologies without connecting them through a coherent request or data flow.",
    },
    ownerBoundary:
      "The Playbook owns live requirements, scope, flow, redirection, depth, and trade-off communication. System Design owns architecture concepts and design-problem curriculum.",
    relatedHrefs: ["/system-design/start-here/introduction", "/system-design/practice", "/mock-interviews"],
  },
  {
    slug: "ml-system-design",
    title: "Machine Learning System Design interview",
    shortTitle: "ML System Design",
    treatment: "complete",
    v1: true,
    description:
      "Connect the product objective to metrics, data, labels, modeling, serving, monitoring, and feedback while controlling scope.",
    quickReference: {
      firstMove:
        "Establish the product decision, target outcome, prediction or ranking task, success metrics, and major guardrails.",
      beforeDone:
        "Trace the complete data-to-model-to-serving-to-monitoring-to-feedback lifecycle and identify material trade-offs.",
      biggestTrap: "Starting with a model choice before defining the product objective, labels, metrics, and system constraints.",
    },
    ownerBoundary:
      "The Playbook owns interview ordering, scope, lifecycle communication, recovery, and validation. ML Design owns models, data, metrics, experimentation, and production ML curriculum.",
    relatedHrefs: ["/ml-design", "/mock-interviews"],
  },
  {
    slug: "behavioral",
    title: "Behavioral or values interview",
    shortTitle: "Behavioral execution",
    treatment: "complete",
    v1: true,
    description:
      "Identify the evidence requested, choose a truthful relevant example, make personal ownership clear, and adapt to follow-up questions.",
    quickReference: {
      firstMove: "Identify the competency or evidence the question is seeking before choosing the example.",
      beforeDone:
        "Make personal ownership, decisions, trade-offs, outcome, and learning clear without manufacturing certainty or impact.",
      biggestTrap:
        "Delivering a memorized monologue that cannot survive follow-up questions or distinguish personal work from team work.",
    },
    ownerBoundary:
      "The Playbook owns in-round story selection, follow-up handling, ownership, consistency, and confidentiality. Behavioral owns story creation, competency coverage, frameworks, and practice.",
    relatedHrefs: ["/behavioral", "/behavioral/workspace", "/mock-interviews"],
  },
  {
    slug: "project-deep-dive",
    title: "Project or résumé deep dive",
    shortTitle: "Project deep dive",
    treatment: "complete",
    v1: true,
    description:
      "Establish project context and personal role, explain decisions and trade-offs, handle technical depth, and remain consistent under follow-up.",
    quickReference: {
      firstMove:
        "Establish the project, objective, constraints, your role, and the decision or outcome the interviewer wants to explore.",
      beforeDone:
        "Make the important decision, personal contribution, trade-off, result, failure or limitation, and learning explicit.",
      biggestTrap: "Using 'we' throughout without showing personal ownership, or inventing precision for details you do not remember.",
    },
    ownerBoundary:
      "The Playbook owns live deep-dive structure, follow-up handling, ownership, uncertainty, and mixed-audience communication. Behavioral and design sections own preparation of the underlying stories and technical knowledge.",
    relatedHrefs: ["/behavioral", "/system-design/practice", "/mock-interviews"],
  },
  {
    slug: "hiring-manager",
    title: "Hiring-manager interview",
    shortTitle: "Hiring manager",
    treatment: "complete",
    v1: true,
    description:
      "Let the actual signal focus emerge, communicate level-appropriate ownership and judgment, and ask questions tied to the role and team.",
    quickReference: {
      firstMove:
        "Let the manager establish the focus, then answer at the level of scope and detail requested rather than assuming a generic culture conversation.",
      beforeDone: "Clarify role expectations, team problems, success measures, and the remaining process where time permits.",
      biggestTrap:
        "Treating the conversation as generic company enthusiasm while failing to show relevant ownership, judgment, or technical depth.",
    },
    ownerBoundary:
      "The Playbook owns cross-signal execution and level calibration. Behavioral owns story preparation, Company Guides own verified employer context, and Applications own the actual process record.",
    relatedHrefs: ["/behavioral", "/companies", "/mock-interviews"],
  },
  {
    slug: "cross-functional",
    title: "Cross-functional interview",
    shortTitle: "Cross-functional",
    treatment: "focused-variant",
    v1: true,
    description:
      "Understand the stakeholder perspective, explain technical decisions at the appropriate level, and make collaboration and trade-offs concrete.",
    quickReference: {
      firstMove:
        "Clarify the interviewer's function, the shared decision or problem, and the level of technical detail useful to that audience.",
      beforeDone:
        "Summarize the shared objective, constraints, trade-off, decision path, and how disagreement or handoff was resolved.",
      biggestTrap: "Treating the round as vague behavioral small talk or overwhelming a mixed audience with unstructured technical detail.",
    },
    ownerBoundary:
      "The Playbook owns mixed-audience execution, stakeholder clarification, and collaboration evidence. Behavioral and project-deep-dive preparation own the underlying examples.",
    relatedHrefs: ["/behavioral", "/mock-interviews"],
  },
  {
    slug: "technical-presentation",
    title: "Technical presentation",
    shortTitle: "Technical presentation",
    treatment: "complete",
    v1: true,
    description:
      "Confirm the audience, desired outcome, format, and constraints before structuring a role-specific technical presentation.",
    quickReference: {
      firstMove: "Confirm the audience, expected outcome, duration, question format, and permitted materials.",
      beforeDone: "Reach the main conclusion, make assumptions and uncertainty visible, and leave enough time for questions.",
      biggestTrap: "Spending most of the session on setup without reaching the decision, evidence, or conclusion.",
    },
    ownerBoundary:
      "The Playbook owns presentation execution, audience calibration, question handling, and recovery. Project preparation and specialist technical sections own the underlying subject matter.",
    relatedHrefs: ["/behavioral", "/mock-interviews"],
  },
];

export const ROUND_EXECUTION_GUIDE_BY_SLUG: ReadonlyMap<RoundExecutionGuideSlug, RoundExecutionGuideSummary> = new Map(
  ROUND_EXECUTION_GUIDES.map((guide) => [guide.slug, guide]),
);

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export type RoundExecutionResolutionConfidence = "explicit" | "inferred" | "unknown";

/** A dynamic presentation state, not a guide slug — never added to the catalog. */
export type RoundExecutionCompositionShell = "technical-screen" | "mixed-signal" | null;

export type RoundExecutionResolution = Readonly<{
  rawRoundType: string;
  normalizedRoundType: string;
  stage: InterviewRoundStage;
  modality: InterviewRoundModality;
  signals: readonly InterviewRoundSignal[];
  guideSlugs: readonly RoundExecutionGuideSlug[];
  shell: RoundExecutionCompositionShell;
  confidence: RoundExecutionResolutionConfidence;
  needsSignalClarification: boolean;
  clarificationPrompt: string | null;
}>;

const CLARIFY_TECHNICAL_SCREEN =
  "Ask the recruiter which signals the screen will cover, such as coding, design, behavioral evidence, or project depth.";
const CLARIFY_MIXED_SIGNAL =
  "Ask the recruiter which signals this loop or final-stage conversation will cover; the stage label alone is not an evaluation type.";
const CLARIFY_GENERIC =
  "Ask the recruiter for the round's focus, format, expected artifact, tools, and duration before choosing a preparation guide.";

function normalizeRoundType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveStage(text: string): InterviewRoundStage {
  if (/recruiter|talent acquisition|introductory screen|intro screen/.test(text)) return "recruiter-screen";
  if (/online assessment|assessment|\boa\b|hackerrank|codility|codesignal|take-home|take home/.test(text)) return "assessment";
  if (/hiring manager|manager screen/.test(text)) return "hiring-manager";
  if (/\bfinal\b/.test(text)) return "final";
  if (/onsite|virtual onsite|loop|bar raiser/.test(text)) return "loop";
  if (/phone screen|technical screen|video screen|domain \/ technical|domain technical/.test(text)) return "technical-screen";
  return "unknown";
}

function resolveModality(text: string): InterviewRoundModality {
  if (/online assessment|\boa\b|hackerrank|codility|codesignal/.test(text)) return "asynchronous-assessment";
  if (/take-home|take home/.test(text)) return "take-home";
  if (/presentation|tech talk|technical talk/.test(text)) return "presentation";
  if (/virtual onsite|phone|video|remote|virtual/.test(text)) return "live-remote";
  if (/onsite|on-site|in person|in-person/.test(text)) return "onsite";
  return "unknown";
}

function detectSignals(text: string): readonly InterviewRoundSignal[] {
  const machineCodingPhrase = /machine coding|practical coding|pair programming|pair-programming|code exercise|implementation exercise/.test(
    text,
  );
  const codeReviewPhrase = /code review|review code|pull request review/.test(text) || /\bpr\b/.test(text);
  const debuggingPhrase = /debug|diagnose|diagnostic coding/.test(text);
  const explicitAlgorithmicToken = /\bdsa\b/.test(text) || /algorithm/.test(text) || /leetcode/.test(text);
  const genericCodingToken = /\bcoding\b|\bcode\b/.test(text);
  const algorithmicCoding = explicitAlgorithmicToken || (genericCodingToken && !machineCodingPhrase && !codeReviewPhrase && !debuggingPhrase);
  const practicalCoding = machineCodingPhrase;
  const debugging = debuggingPhrase;
  const codeReview = codeReviewPhrase;
  const lowLevelDesign = /low-level design|low level design|\blld\b|object-oriented design|object oriented design|\bood\b|class design/.test(
    text,
  );
  const mlSystemDesign = /ml system design|machine learning system design|\bml design\b|machine learning design/.test(text);
  // "ml system design" / "machine learning system design" both contain the
  // literal substring "system design"; strip them before checking for the
  // generic signal so it is never added alongside ML System Design.
  const textForGenericSystemDesign = text.replace(/ml system design|machine learning system design/g, "");
  const systemDesign = /system design|architecture|high-level design|high level design/.test(textForGenericSystemDesign) || /\bhld\b/.test(text);
  const behavioral = /behavioral|behavioural|values|culture|leadership principles/.test(text);
  const projectDeepDive = /project deep dive|project discussion|résumé deep dive|resume deep dive|résumé discussion|resume discussion/.test(text);
  const hiringManagerSignal = /hiring manager|manager screen/.test(text);
  const crossFunctional = /cross-functional|cross functional|stakeholder interview|product manager interview|\bpm interview\b/.test(text);
  const technicalPresentation = /technical presentation|presentation|tech talk|technical talk/.test(text);

  const signals: InterviewRoundSignal[] = [];
  if (algorithmicCoding) signals.push("algorithmic-coding");
  if (practicalCoding) signals.push("practical-coding");
  if (debugging) signals.push("debugging");
  if (codeReview) signals.push("code-review");
  if (lowLevelDesign) signals.push("low-level-design");
  if (systemDesign) signals.push("system-design");
  if (mlSystemDesign) signals.push("ml-system-design");
  if (behavioral) signals.push("behavioral");
  if (projectDeepDive) signals.push("project-deep-dive");
  if (hiringManagerSignal) signals.push("hiring-manager");
  if (crossFunctional) signals.push("cross-functional");
  if (technicalPresentation) signals.push("technical-presentation");
  return signals;
}

/** Every InterviewRoundSignal literal is also a valid RoundExecutionGuideSlug literal. */
function signalToGuideSlug(signal: InterviewRoundSignal): RoundExecutionGuideSlug {
  return signal;
}

function resolveGuideSlugs(
  stage: InterviewRoundStage,
  modality: InterviewRoundModality,
  signals: readonly InterviewRoundSignal[],
): readonly RoundExecutionGuideSlug[] {
  const qualifying = new Set<RoundExecutionGuideSlug>();
  if (stage === "recruiter-screen") qualifying.add("recruiter-screen");
  if (modality === "asynchronous-assessment") qualifying.add("online-assessment");
  if (modality === "take-home") qualifying.add("take-home");
  for (const signal of signals) qualifying.add(signalToGuideSlug(signal));
  // Catalog order is canonical, not match/detection order.
  return ROUND_EXECUTION_GUIDES.filter((guide) => qualifying.has(guide.slug)).map((guide) => guide.slug);
}

function resolveShell(stage: InterviewRoundStage): RoundExecutionCompositionShell {
  if (stage === "technical-screen") return "technical-screen";
  if (stage === "loop" || stage === "final") return "mixed-signal";
  return null;
}

function resolveConfidence(
  stage: InterviewRoundStage,
  modality: InterviewRoundModality,
  guideSlugs: readonly RoundExecutionGuideSlug[],
): RoundExecutionResolutionConfidence {
  if (guideSlugs.length > 0) return "explicit";
  if (stage !== "unknown" || modality !== "unknown") return "inferred";
  return "unknown";
}

function resolveClarification(
  normalized: string,
  shell: RoundExecutionCompositionShell,
  guideSlugs: readonly RoundExecutionGuideSlug[],
  confidence: RoundExecutionResolutionConfidence,
): Readonly<{ needsSignalClarification: boolean; clarificationPrompt: string | null }> {
  const noSignalGuide = guideSlugs.length === 0;
  const isBarRaiser = normalized.includes("bar raiser");
  const isDomainTechnical = normalized === "domain / technical" || normalized === "domain technical";

  const needsSignalClarification =
    (shell === "technical-screen" && noSignalGuide) ||
    (shell === "mixed-signal" && noSignalGuide) ||
    confidence === "unknown" ||
    isBarRaiser ||
    normalized === "other" ||
    (isDomainTechnical && noSignalGuide);

  if (!needsSignalClarification) return { needsSignalClarification: false, clarificationPrompt: null };

  if (shell === "technical-screen" && noSignalGuide) {
    return { needsSignalClarification: true, clarificationPrompt: CLARIFY_TECHNICAL_SCREEN };
  }
  if ((shell === "mixed-signal" && noSignalGuide) || isBarRaiser) {
    return { needsSignalClarification: true, clarificationPrompt: CLARIFY_MIXED_SIGNAL };
  }
  return { needsSignalClarification: true, clarificationPrompt: CLARIFY_GENERIC };
}

/**
 * Resolves a free-text round label into independent stage, modality, and
 * signal attributes plus the execution guides that directly apply.
 *
 * Conservative by design: it recognizes explicit words in the label and
 * never invents a loop structure, a company rubric, or a competency claim
 * from a vague stage name. It never throws.
 */
export function resolveRoundExecution(roundType: string): RoundExecutionResolution {
  const rawRoundType = roundType.trim();
  const normalizedRoundType = normalizeRoundType(roundType);

  const stage = resolveStage(normalizedRoundType);
  const modality = resolveModality(normalizedRoundType);
  const signals = detectSignals(normalizedRoundType);
  const guideSlugs = resolveGuideSlugs(stage, modality, signals);
  const shell = resolveShell(stage);
  const confidence = resolveConfidence(stage, modality, guideSlugs);
  const { needsSignalClarification, clarificationPrompt } = resolveClarification(normalizedRoundType, shell, guideSlugs, confidence);

  return {
    rawRoundType,
    normalizedRoundType,
    stage,
    modality,
    signals,
    guideSlugs,
    shell,
    confidence,
    needsSignalClarification,
    clarificationPrompt,
  };
}
