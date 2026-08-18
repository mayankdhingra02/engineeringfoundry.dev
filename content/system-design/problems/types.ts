import type {
  SystemDesignLevel,
  SystemDesignPracticeDifficulty,
  SystemDesignTargetRole,
} from "@/data/system-design/manifest";

export interface PracticeApi {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
}

export interface PracticeDataModel {
  entity: string;
  fields: string;
  notes: string;
}

export interface PracticeDecision {
  option: string;
  chooseWhen: string;
  cost: string;
}

export interface PracticeFailure {
  failure: string;
  impact: string;
  detection: string;
  mitigation: string;
  tradeoff: string;
}

export interface CapacityEstimate {
  assumptions: readonly string[];
  arithmetic: readonly string[];
  decision: string;
}

export interface TimedPracticePlan {
  minutes: 30 | 45 | 60;
  allocation: readonly string[];
}

export interface SystemDesignPracticeContent {
  id: string;
  title: string;
  summary: string;
  prompt: string;
  difficulty: SystemDesignPracticeDifficulty;
  category: "Foundation" | "Product" | "Infrastructure" | "Data" | "ML";
  estimatedMinutes: number;
  roleRelevance: readonly SystemDesignTargetRole[];
  levelRelevance: readonly SystemDesignLevel[];
  concepts: readonly string[];
  prerequisites: readonly string[];
  functionalRequirements: readonly string[];
  nonFunctionalRequirements: readonly string[];
  outOfScope: readonly string[];
  clarifyingQuestions: readonly string[];
  capacity?: CapacityEstimate;
  apis: readonly PracticeApi[];
  dataModel: readonly PracticeDataModel[];
  simpleDesign: readonly string[];
  simpleDiagram: string;
  scaledDiagram: string;
  criticalFlows: readonly { title: string; steps: readonly string[] }[];
  bottlenecks: readonly string[];
  scalingSteps: readonly string[];
  failures: readonly PracticeFailure[];
  decisions: readonly PracticeDecision[];
  deepDives: readonly string[];
  mistakes: readonly string[];
  followUps: readonly string[];
  variants: readonly string[];
  remember: string;
  quickReview: {
    coreProblem: string;
    mainDecisions: readonly string[];
    importantFailure: string;
    keyTradeoff: string;
  };
  selfCheck: readonly string[];
  timedPlans: readonly TimedPracticePlan[];
  deepDiveOptions: readonly string[];
  lastReviewed: string;
}
