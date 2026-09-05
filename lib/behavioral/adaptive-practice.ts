import { activeBehavioralQuestions } from "@/data/behavioral";
import type { BehavioralQuestion } from "@/types";

export type BehavioralEvidenceBand = "needs-evidence" | "acceptable" | "strong" | "exceptional";
export type BehavioralEvidenceDimensionId =
  | "relevance"
  | "specificity"
  | "ownership"
  | "judgment"
  | "technical-understanding"
  | "outcome-evidence"
  | "learning"
  | "communication"
  | "follow-up-depth"
  | "level-scope"
  | "integrity";
export type BehavioralPracticeLevel = "entry" | "mid" | "senior" | "staff-plus";
export type BehavioralPracticeContext = "general" | "international" | "small-company" | "individual-contributor";
export type BehavioralPracticeStage = "review" | "drill" | "summary";
export type BehavioralProbeOutcome = "resolved" | "strengthen" | "bounded";

export type BehavioralRubricDimension = Readonly<{
  id: BehavioralEvidenceDimensionId;
  label: string;
  description: string;
  priority: number;
  bands: Record<BehavioralEvidenceBand, string>;
  probes: readonly [string, string];
  lessonHref: string;
}>;

export const behavioralRubricDimensions: readonly BehavioralRubricDimension[] = [
  { id: "relevance", label: "Relevance", description: "The event answers the evidence target rather than a nearby question.", priority: 1, bands: { "needs-evidence": "Does not answer the target", acceptable: "Related event", strong: "Direct evidence", exceptional: "Direct evidence with a nuanced boundary" }, probes: ["Which moment in this event most directly answers the prompt?", "What nearby claim are you deliberately not asking this story to prove?"], lessonHref: "/behavioral/learn/evidence-not-opinions" },
  { id: "ownership", label: "Ownership", description: "Personal decisions are visible without erasing the team.", priority: 2, bands: { "needs-evidence": "Team-only ‘we’", acceptable: "Personal contribution is visible", strong: "Decisions and accountability are clear", exceptional: "Creates leverage while crediting others" }, probes: ["What did you personally decide or do, and what remained shared work?", "Who held final authority, and where did your influence change the outcome?"], lessonHref: "/behavioral/learn/personal-ownership-in-team-work" },
  { id: "judgment", label: "Judgment", description: "The choice is understandable from evidence available at the time.", priority: 3, bands: { "needs-evidence": "Decision is unexplained", acceptable: "Basic reason is present", strong: "Alternatives, constraints, and trade-offs are clear", exceptional: "Updates intelligently and anticipates second-order effects" }, probes: ["Which credible alternative did you reject, and what information mattered then?", "What new evidence would have changed your decision?"], lessonHref: "/behavioral/learn/decisions-alternatives-and-tradeoffs" },
  { id: "outcome-evidence", label: "Outcome and evidence", description: "The result is supported and its causal limits are explicit.", priority: 4, bands: { "needs-evidence": "Vague success", acceptable: "Honest outcome", strong: "Supported impact with a caveat", exceptional: "Multiple evidence types with causal limits" }, probes: ["How was the outcome observed or measured, and over what window?", "What else contributed, and what can you not attribute to your action?"], lessonHref: "/behavioral/learn/impact-without-invented-metrics" },
  { id: "specificity", label: "Specificity", description: "One event has enough timeline and action detail to inspect.", priority: 5, bands: { "needs-evidence": "Generic claims", acceptable: "One concrete event", strong: "Clear timeline and actions", exceptional: "Precise evidence without unnecessary detail" }, probes: ["When did the pivotal decision happen, and what changed immediately after it?", "Which detail makes this a specific event without exposing confidential information?"], lessonHref: "/behavioral/learn/build-a-canonical-story" },
  { id: "technical-understanding", label: "Technical understanding", description: "Technical detail explains the decision and failure mode.", priority: 6, bands: { "needs-evidence": "Jargon-heavy or absent", acceptable: "Understandable basics", strong: "Mechanism and failure are clear", exceptional: "Depth adapts and connects technical and product consequences" }, probes: ["Which mechanism or failure condition made this choice consequential?", "Explain the same trade-off one layer deeper without changing the decision or outcome."], lessonHref: "/behavioral/learn/technical-depth-for-the-audience" },
  { id: "learning", label: "Learning", description: "Reflection changed a later behavior, system, or decision.", priority: 7, bands: { "needs-evidence": "Generic lesson", acceptable: "Specific reflection", strong: "Behavior or system changed", exceptional: "Durable mechanism transferred elsewhere" }, probes: ["What did you change the next time because of this event?", "Which test, review, habit, or mechanism outlasted the immediate fix?"], lessonHref: "/behavioral/learn/failure-incidents-and-learning" },
  { id: "follow-up-depth", label: "Follow-up depth", description: "Canonical facts remain stable under deeper questions.", priority: 8, bands: { "needs-evidence": "Facts collapse under a probe", acceptable: "Answers a basic probe", strong: "Handles ownership, rationale, and result", exceptional: "Handles counterfactual, risk, scale, and disagreement" }, probes: ["Which fact would be easiest to contradict in a deeper project discussion?", "What counterfactual, risk, or disagreement can you explain without changing the event?"], lessonHref: "/behavioral/learn/follow-ups-deep-dives-and-consistency" },
  { id: "level-scope", label: "Level and scope", description: "Evidence is calibrated to available authority, consequence, and leverage.", priority: 9, bands: { "needs-evidence": "Below the target evidence", acceptable: "Plausible target scope", strong: "Strong target evidence", exceptional: "Broader durable leverage appropriate to context" }, probes: ["What was the largest consequence, ambiguity, or coordination boundary you actually owned?", "Did your work change only this event, or create a reusable mechanism for others?"], lessonHref: "/behavioral/learn/seniority-company-modifiers-and-self-review" },
  { id: "integrity", label: "Integrity", description: "Claims stay truthful, attributable, and safe to disclose.", priority: 10, bands: { "needs-evidence": "Embellished or confidential", acceptable: "Safe and truthful", strong: "Limits and team credit are explicit", exceptional: "Sensitive ambiguity is resolved responsibly" }, probes: ["Which name, metric, or system detail should be generalized before you share this story?", "What limit, uncertainty, or team contribution should be stated explicitly?"], lessonHref: "/behavioral/learn/build-a-canonical-story" },
  { id: "communication", label: "Communication", description: "The answer is coherent, bounded, and ready for dialogue.", priority: 11, bands: { "needs-evidence": "Hard to follow", acceptable: "Coherent", strong: "Concise, natural, and probe-ready", exceptional: "Adapts in dialogue without losing facts" }, probes: ["Which setup sentence can you remove while preserving the stakes?", "Where should you stop so the interviewer can choose the next depth?"], lessonHref: "/behavioral/learn/frameworks-without-rigid-scripts" },
] as const;

export const behavioralSelfReviewQuestions = [
  "Did I answer the question?",
  "Can the listener tell what I personally owned?",
  "Did I explain why I made consequential choices?",
  "Did I state the actual outcome without overclaiming?",
  "Could I answer two deeper probes without changing facts?",
  "Did I identify real learning when relevant?",
  "Did I protect confidential information?",
  "What would I change on the next attempt?",
] as const;

export const behavioralPracticeLevels = [
  { id: "entry", label: "Entry", guidance: "Show credible ownership at available scope, collaboration, technical fundamentals, learning, and honest authority limits." },
  { id: "mid", label: "Mid / SDE II", guidance: "Show end-to-end delivery, independent judgment, trade-offs, incidents, and durable service or team improvements." },
  { id: "senior", label: "Senior", guidance: "Show consequential ambiguity, architecture or risk judgment, cross-team influence, prioritization, mentoring, and durable leverage." },
  { id: "staff-plus", label: "Staff+", guidance: "Show organizational framing, multi-team mechanisms, long-term trade-offs, sponsorship, and durable technical direction without requiring a management title." },
] as const;

export const behavioralPracticeContexts = [
  { id: "general", label: "General", guidance: "Use the role’s actual responsibility and evidence boundary." },
  { id: "international", label: "International", guidance: "Translate local titles, scale, and organizational shorthand; language style is not a proxy for competence." },
  { id: "small-company", label: "Small company", guidance: "Calibrate scope by ambiguity, consequences, and leverage—not company headcount or brand size." },
  { id: "individual-contributor", label: "Individual contributor", guidance: "Show influence, standards, and technical direction without implying that people management is required." },
] as const;

const dimensionIds = new Set(behavioralRubricDimensions.map((dimension) => dimension.id));
const levelIds = new Set(behavioralPracticeLevels.map((level) => level.id));
const contextIds = new Set(behavioralPracticeContexts.map((context) => context.id));
const questionSlugs = new Set(activeBehavioralQuestions.map((question) => question.slug));

export type BehavioralAdaptivePracticeState = Readonly<{
  questionSlug: string;
  level: BehavioralPracticeLevel;
  context: BehavioralPracticeContext;
  stage: BehavioralPracticeStage;
  gaps: BehavioralEvidenceDimensionId[];
  step: number;
  depth: 0 | 1;
  resolved: BehavioralEvidenceDimensionId[];
  strengthen: BehavioralEvidenceDimensionId[];
  bounded: BehavioralEvidenceDimensionId[];
}>;

export const defaultBehavioralAdaptivePracticeState: BehavioralAdaptivePracticeState = {
  questionSlug: activeBehavioralQuestions[0].slug,
  level: "mid",
  context: "general",
  stage: "review",
  gaps: [],
  step: 0,
  depth: 0,
  resolved: [],
  strengthen: [],
  bounded: [],
};

function enumList<T extends string>(value: string | null, allowed: Set<T>): T[] {
  if (!value) return [];
  return [...new Set(value.split(",").filter((item): item is T => allowed.has(item as T)))];
}

export function parseBehavioralAdaptivePracticeState(source: string | URLSearchParams): BehavioralAdaptivePracticeState {
  const params = typeof source === "string" ? new URLSearchParams(source) : new URLSearchParams(source.toString());
  const question = params.get("question");
  const level = params.get("level");
  const context = params.get("context");
  const stage = params.get("stage");
  const gaps = enumList(params.get("gaps"), dimensionIds);
  const resolved = enumList(params.get("resolved"), dimensionIds).filter((id) => gaps.includes(id));
  const strengthen = enumList(params.get("strengthen"), dimensionIds).filter((id) => gaps.includes(id) && !resolved.includes(id));
  const bounded = enumList(params.get("bounded"), dimensionIds).filter((id) => gaps.includes(id) && !resolved.includes(id) && !strengthen.includes(id));
  const rawStep = Number(params.get("step"));
  const step = Number.isSafeInteger(rawStep) ? Math.max(0, Math.min(gaps.length, rawStep)) : 0;
  return {
    questionSlug: question && questionSlugs.has(question) ? question : defaultBehavioralAdaptivePracticeState.questionSlug,
    level: level && levelIds.has(level as BehavioralPracticeLevel) ? level as BehavioralPracticeLevel : "mid",
    context: context && contextIds.has(context as BehavioralPracticeContext) ? context as BehavioralPracticeContext : "general",
    stage: stage === "drill" || stage === "summary" ? stage : "review",
    gaps,
    step,
    depth: params.get("depth") === "1" ? 1 : 0,
    resolved,
    strengthen,
    bounded,
  };
}

export function serializeBehavioralAdaptivePracticeState(state: BehavioralAdaptivePracticeState) {
  const params = new URLSearchParams();
  if (state.questionSlug !== defaultBehavioralAdaptivePracticeState.questionSlug) params.set("question", state.questionSlug);
  if (state.level !== "mid") params.set("level", state.level);
  if (state.context !== "general") params.set("context", state.context);
  if (state.stage !== "review") params.set("stage", state.stage);
  if (state.gaps.length) params.set("gaps", state.gaps.join(","));
  if (state.step) params.set("step", String(state.step));
  if (state.depth) params.set("depth", "1");
  if (state.resolved.length) params.set("resolved", state.resolved.join(","));
  if (state.strengthen.length) params.set("strengthen", state.strengthen.join(","));
  if (state.bounded.length) params.set("bounded", state.bounded.join(","));
  return params;
}

const questionFamilyDimension: Partial<Record<BehavioralQuestion["category"], BehavioralEvidenceDimensionId>> = {
  Leadership: "level-scope",
  Ownership: "ownership",
  Collaboration: "communication",
  "Conflict & Influence": "judgment",
  Ambiguity: "judgment",
  "Failure & Growth": "learning",
  "Execution & Prioritization": "judgment",
  Mentorship: "learning",
  "Technical Judgment": "technical-understanding",
  "Customer Impact": "outcome-evidence",
  "Cross-functional Work": "communication",
  "Incident & Quality": "technical-understanding",
};

export function orderBehavioralEvidenceGaps(question: BehavioralQuestion, gaps: readonly BehavioralEvidenceDimensionId[]) {
  const categoryDimension = questionFamilyDimension[question.category];
  return [...gaps].sort((left, right) => {
    if (left === categoryDimension && right !== categoryDimension) return -1;
    if (right === categoryDimension && left !== categoryDimension) return 1;
    const leftPriority = behavioralRubricDimensions.find((item) => item.id === left)?.priority ?? 99;
    const rightPriority = behavioralRubricDimensions.find((item) => item.id === right)?.priority ?? 99;
    return leftPriority - rightPriority;
  });
}

export function currentBehavioralProbe(question: BehavioralQuestion, state: BehavioralAdaptivePracticeState) {
  const ordered = orderBehavioralEvidenceGaps(question, state.gaps);
  const dimensionId = ordered[state.step];
  const dimension = behavioralRubricDimensions.find((item) => item.id === dimensionId);
  if (!dimension) return null;
  const level = behavioralPracticeLevels.find((item) => item.id === state.level)!;
  const context = behavioralPracticeContexts.find((item) => item.id === state.context)!;
  const curatedProbe = question.followUps[state.step % question.followUps.length];
  return {
    dimension,
    prompt: state.depth === 0 ? dimension.probes[0] : dimension.probes[1],
    curatedProbe,
    level,
    context,
    position: state.step + 1,
    total: ordered.length,
  };
}

export function recordBehavioralProbeOutcome(
  state: BehavioralAdaptivePracticeState,
  question: BehavioralQuestion,
  outcome: BehavioralProbeOutcome,
): BehavioralAdaptivePracticeState {
  const current = currentBehavioralProbe(question, state);
  if (!current) return { ...state, stage: "summary", step: state.gaps.length, depth: 0 };
  const without = (items: BehavioralEvidenceDimensionId[]) => items.filter((id) => id !== current.dimension.id);
  const next = {
    ...state,
    step: state.step + 1,
    depth: 0 as const,
    resolved: without(state.resolved),
    strengthen: without(state.strengthen),
    bounded: without(state.bounded),
  };
  next[outcome] = [...next[outcome], current.dimension.id];
  return { ...next, stage: next.step >= state.gaps.length ? "summary" : "drill" };
}

export function behavioralPracticeNextActions(state: BehavioralAdaptivePracticeState) {
  const actions: Array<{ label: string; href: string; reason: string }> = [];
  const firstStrengthen = state.strengthen[0];
  const dimension = behavioralRubricDimensions.find((item) => item.id === firstStrengthen);
  if (dimension) actions.push({ label: `Review ${dimension.label.toLowerCase()}`, href: dimension.lessonHref, reason: "Rebuild the first evidence gap before another rehearsal." });
  if (state.bounded.length) actions.push({ label: "Redact the canonical story", href: "/behavioral/stories", reason: "Replace sensitive specifics with safe, truthful boundaries." });
  if (!actions.length || state.resolved.length) actions.push({ label: "Practice a second prompt", href: "/behavioral/practice", reason: "Test whether the same facts stay stable under a different evidence target." });
  return [
    ...actions.slice(0, 2),
    { label: "Return evidence to the Playbook", href: "/interview-playbook", reason: "Carry one observed gap or confirmed strength into the next preparation block." },
  ];
}
