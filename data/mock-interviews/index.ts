import { activeBehavioralQuestions } from "@/data/behavioral";
import { activeQuestions } from "@/data/dsa";
import { activeMlDesignProblems } from "@/data/ml-design";
import { activeSystemDesignProblems } from "@/data/system-design";
import type {
  BehavioralQuestion,
  DsaQuestion,
  LowLevelDesignMockProblem,
  MlDesignProblem,
  MockRubric,
  MockSessionPlan,
  MockTrack,
  SystemDesignProblem,
} from "@/types";
import rubricsData from "./rubrics.json";
import sessionPlansData from "./session-plans.json";
import lowLevelDesignProblemsData from "./lld-problems.json";

export const mockTrackLabels: Record<MockTrack, string> = {
  dsa: "DSA",
  "system-design": "System Design",
  "low-level-design": "LLD",
  "ml-design": "ML System Design",
  behavioral: "Behavioral",
};

type LowLevelDesignProblemSource = Omit<LowLevelDesignMockProblem, "summary" | "prompt" | "clarificationQuestions" | "keyTradeoffs" | "status" | "source"> & { focus: string };

const lowLevelDesignProblemSources = lowLevelDesignProblemsData as LowLevelDesignProblemSource[];

export const lowLevelDesignMockProblems: LowLevelDesignMockProblem[] = lowLevelDesignProblemSources.map((problem) => ({
  ...problem,
  summary: `Model a bounded ${problem.title} component with emphasis on ${problem.focus}.`,
  prompt: `Design the object-oriented core for ${problem.title}. Define the main use cases, responsibilities, interfaces, state, invariants, and failure behavior. Keep infrastructure outside the boundary unless it changes an object contract; focus especially on ${problem.focus}.`,
  clarificationQuestions: [
    "Which primary use case and actors should drive the first design?",
    "What state changes and failure cases must the model protect?",
    "Which follow-up variation should the design be able to absorb cleanly?",
  ],
  keyTradeoffs: [
    `Keep ${problem.focus} explicit without turning every noun into a class.`,
    "Prefer the simplest responsibility boundary that protects the invariant, then explain where a policy or interface earns its cost.",
  ],
  status: "active",
  source: { name: "Engineering Foundry", platform: "original" },
}));

const lowLevelDesignMockSessionPlans: MockSessionPlan[] = lowLevelDesignMockProblems.map((problem) => ({
  id: `mock-${problem.id}`,
  slug: problem.slug,
  title: problem.title,
  track: "low-level-design",
  recommended_minutes: { min: 35, max: 45 },
  sections: [
    { id: "clarify", title: "Clarify and scope", minutes: 8 },
    { id: "model", title: "Model behavior and state", minutes: 22 },
    { id: "evolve", title: "Validate and evolve", minutes: 10 },
  ],
  candidate_instructions: [
    "Clarify the primary flow, actors, constraints, and deliberate non-goals before naming classes.",
    "Assign responsibilities, define operations and state, then walk one success path and one failure path.",
    "Apply one follow-up change and explain the trade-off without forcing a design pattern.",
  ],
  interviewer_instructions: [
    "Ask who owns the most important invariant and why.",
    "Probe one invalid transition, concurrent action, or extension point relevant to the prompt.",
    "Observe whether the candidate keeps distributed infrastructure outside the model unless it changes a contract.",
  ],
  content_reference: { kind: "low-level-design-problem", id: problem.id },
  rubric_id: "rubric-low-level-design",
  status: "active",
}));

export const mockSessionPlans = [...sessionPlansData as MockSessionPlan[], ...lowLevelDesignMockSessionPlans];
export const activeMockSessionPlans = mockSessionPlans.filter((plan) => plan.status === "active");
export const mockRubrics = rubricsData as MockRubric[];

const lowLevelDesignPracticeHandoffs: Readonly<Record<string, string>> = {
  "parking-lot": "parking-allocation",
  "elevator-control": "elevator-dispatch",
  "vending-machine": "vending-workflow",
  "amazon-locker-parcel-locker": "package-delivery-lifecycle",
  "conference-room-booking": "meeting-room-scheduler",
  "notification-system": "notification-orchestrator",
};

export type MockReferencedContent = DsaQuestion | SystemDesignProblem | LowLevelDesignMockProblem | MlDesignProblem | BehavioralQuestion;

export function plansForMockTrack(track: MockTrack) {
  return activeMockSessionPlans.filter((plan) => plan.track === track);
}

export function getMockRubric(id: string) {
  return mockRubrics.find((rubric) => rubric.id === id);
}

export function resolveMockContent(plan: MockSessionPlan): MockReferencedContent | undefined {
  const { kind, id } = plan.content_reference;
  if (kind === "dsa-question") return activeQuestions.find((item) => item.id === id && item.isOriginal);
  if (kind === "system-design-problem") return activeSystemDesignProblems.find((item) => item.id === id);
  if (kind === "low-level-design-problem") return lowLevelDesignMockProblems.find((item) => item.id === id);
  if (kind === "ml-design-problem") return activeMlDesignProblems.find((item) => item.id === id);
  return activeBehavioralQuestions.find((item) => item.id === id);
}

export function getMockPreparationHref(plan: MockSessionPlan) {
  const content = resolveMockContent(plan);
  if (!content) return "/mock-interviews";
  if (plan.track === "dsa") return `/dsa?search=${encodeURIComponent((content as DsaQuestion).title)}`;
  if (plan.track === "system-design") return `/system-design/${content.slug}`;
  if (plan.track === "low-level-design") {
    const practiceSlug = lowLevelDesignPracticeHandoffs[plan.slug];
    return practiceSlug ? `/low-level-design/practice/${practiceSlug}` : "/low-level-design/practice";
  }
  if (plan.track === "ml-design") return `/ml-design/${content.slug}`;
  return `/behavioral?question=${content.slug}`;
}

export function getMockPreparationLinkLabel(plan: MockSessionPlan) {
  if (plan.track !== "low-level-design" || lowLevelDesignPracticeHandoffs[plan.slug]) return "Practice the exact specialist topic";
  return "Browse Low-Level Design specialist practice";
}
