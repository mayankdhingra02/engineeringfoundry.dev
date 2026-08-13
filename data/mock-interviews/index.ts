import { activeBehavioralQuestions } from "@/data/behavioral";
import { activeQuestions } from "@/data/dsa";
import { activeMlDesignProblems } from "@/data/ml-design";
import { activeSystemDesignProblems } from "@/data/system-design";
import type {
  BehavioralQuestion,
  DsaQuestion,
  MlDesignProblem,
  MockRubric,
  MockSessionPlan,
  MockTrack,
  SystemDesignProblem,
} from "@/types";
import rubricsData from "./rubrics.json";
import sessionPlansData from "./session-plans.json";

export const mockTrackLabels: Record<MockTrack, string> = {
  dsa: "DSA",
  "system-design": "System Design",
  "ml-design": "ML System Design",
  behavioral: "Behavioral",
};

export const mockSessionPlans = sessionPlansData as MockSessionPlan[];
export const activeMockSessionPlans = mockSessionPlans.filter((plan) => plan.status === "active");
export const mockRubrics = rubricsData as MockRubric[];

export type MockReferencedContent = DsaQuestion | SystemDesignProblem | MlDesignProblem | BehavioralQuestion;

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
  if (kind === "ml-design-problem") return activeMlDesignProblems.find((item) => item.id === id);
  return activeBehavioralQuestions.find((item) => item.id === id);
}

export function getMockPreparationHref(plan: MockSessionPlan) {
  const content = resolveMockContent(plan);
  if (!content) return "/mock-interviews";
  if (plan.track === "dsa") return `/dsa?search=${encodeURIComponent((content as DsaQuestion).title)}`;
  if (plan.track === "system-design") return `/system-design/${content.slug}`;
  if (plan.track === "ml-design") return `/ml-design/${content.slug}`;
  return `/behavioral?question=${content.slug}`;
}
