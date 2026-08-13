export type Difficulty = "Easy" | "Medium" | "Hard";

export type VerificationStatus = "verified" | "community-reported" | "unverified" | "demo";
export type SourcePlatform = "leetcode" | "hackerrank" | "codeforces" | "geeksforgeeks" | "official" | "community" | "original" | "other";
export type ContentStatus = "active" | "unavailable" | "needs_review";

export interface ProvenanceSource {
  name: string;
  platform: SourcePlatform;
  url: string | null;
  verification: VerificationStatus;
  lastVerifiedAt: string | null;
  notes?: string;
}

export interface CompanyAssociation {
  companySlug: string;
  verification: VerificationStatus;
  source: ProvenanceSource;
}

export interface DsaQuestion {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  patterns: string[];
  companyAssociations: CompanyAssociation[];
  roadmapStage: string;
  priority: 1 | 2 | 3;
  isFree: boolean;
  isOriginal: boolean;
  status: ContentStatus;
  verification: VerificationStatus;
  lastVerifiedAt: string | null;
  externalUrl: string | null;
  source: ProvenanceSource;
  note: string;
  originalPrompt?: string;
}

export interface DsaTopic {
  id: string;
  slug: string;
  name: string;
  summary: string;
  interviewUse: string;
  complexityFocus: string;
  commonMistakes: string[];
  relatedTopics: string[];
}

export interface DsaPattern {
  id: string;
  slug: string;
  name: string;
  summary: string;
  recognitionSignals: string[];
  commonMistakes: string[];
}

export interface RoadmapStage {
  id: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  topics: string[];
  patterns: string[];
}

export interface CompanyGuide {
  id: string;
  name: string;
  slug: string;
  description: string;
  guideStatus: "available" | "curating";
  claims: Array<{ claim: string; verification: VerificationStatus; source: ProvenanceSource }>;
}

export type BehavioralCategory =
  | "Leadership"
  | "Ownership"
  | "Collaboration"
  | "Conflict & Influence"
  | "Ambiguity"
  | "Failure & Growth"
  | "Execution & Prioritization"
  | "Mentorship"
  | "Technical Judgment"
  | "Customer Impact"
  | "Cross-functional Work"
  | "Incident & Quality";
export type BehavioralScope = "Individual" | "Team" | "Cross-functional" | "Leadership";

export interface BehavioralQuestion {
  id: string;
  slug: string;
  prompt: string;
  category: BehavioralCategory;
  signals: string[];
  storyTypes: string[];
  scope: BehavioralScope[];
  followUps: string[];
  answerGuidance: string[];
  commonMistakes: string[];
  searchFeatured?: boolean;
  status: "active" | "needs_review";
  source: { name: "Engineering Foundry"; platform: "original" };
}

export type InterviewTipCategory =
  | "Preparation"
  | "Before the Interview"
  | "Coding"
  | "System Design"
  | "ML Design"
  | "Behavioral"
  | "Communication"
  | "Recovering When Stuck"
  | "Closing"
  | "After the Interview";

export interface InterviewTip {
  id: string;
  category: InterviewTipCategory;
  title: string;
  guidance: string[];
  whyItMatters: string;
  avoid: string[];
  status: "active" | "needs_review";
}

export interface InterviewChecklist {
  id: string;
  title: string;
  timing: string;
  description: string;
  items: Array<{ id: string; label: string }>;
  status: "active" | "needs_review";
}

export type ResourceCategory = "DSA" | "System Design" | "ML / AI" | "Behavioral" | "Interview Strategy" | "Engineering" | "Career";
export type ResourceType = "Practice Platform" | "Guide" | "Course" | "Book" | "Documentation" | "Repository" | "Visualization" | "Roadmap";
export type ResourceAccess = "Free" | "Paid" | "Freemium";
export type ResourceVerification = "verified" | "unverified" | "needs_review";

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  type: ResourceType;
  access: ResourceAccess;
  url: string;
  provider: string;
  isInternal: boolean;
  status: "active" | "needs_review";
  verification: ResourceVerification;
  lastVerifiedAt: string | null;
  tags: string[];
}

export type DesignDifficulty = "Foundation" | "Intermediate" | "Advanced";
export type DesignContentStatus = "active" | "needs_review";

export interface DesignSource {
  name: "Engineering Foundry";
  platform: "original";
}

export interface DesignRoadmapStage {
  id: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  topics: string[];
}

export interface DesignConcept {
  id: string;
  slug: string;
  title: string;
  summary: string;
  solves: string;
  useWhen: string;
  tradeoff: string;
  commonMistake: string;
}

export interface SystemDesignProblem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: DesignDifficulty;
  roadmapStage: string;
  domains: string[];
  patterns: string[];
  prompt: string;
  clarifyingQuestions: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  scaleAssumptions: string[];
  capacityDiscussion: string[];
  coreComponents: Array<{ name: string; purpose: string }>;
  dataModelNotes: string[];
  apiNotes: string[];
  keyTradeoffs: string[];
  failureModes: string[];
  extensions: string[];
  interviewChecklist: string[];
  status: DesignContentStatus;
  source: DesignSource;
}

export interface MlDesignProblem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: DesignDifficulty;
  roadmapStage: string;
  domains: string[];
  prompt: string;
  productGoal: string[];
  predictionTarget: string[];
  successMetrics: string[];
  dataSources: string[];
  labeling: string[];
  features: string[];
  baseline: string[];
  modelDiscussion: string[];
  training: string[];
  evaluation: string[];
  serving: string[];
  monitoring: string[];
  feedbackLoop: string[];
  failureModes: string[];
  tradeoffs: string[];
  extensions: string[];
  interviewChecklist: string[];
  status: DesignContentStatus;
  source: DesignSource;
}

export type MockTrack = "dsa" | "system-design" | "ml-design" | "behavioral";
export type MockPracticeMode = "solo" | "peer";
export type MockContentKind = "dsa-question" | "system-design-problem" | "ml-design-problem" | "behavioral-question";

export interface MockSessionPlan {
  id: string;
  slug: string;
  title: string;
  track: MockTrack;
  recommended_minutes: { min: number; max: number };
  sections: Array<{ id: string; title: string; minutes: number }>;
  candidate_instructions: string[];
  interviewer_instructions: string[];
  content_reference: { kind: MockContentKind; id: string };
  rubric_id: string;
  status: "active" | "needs_review";
}

export interface MockRubricDimension {
  id: string;
  label: string;
  description: string;
}

export interface MockRubric {
  id: string;
  track: MockTrack;
  title: string;
  disclaimer: string;
  dimensions: MockRubricDimension[];
}

export type ReferralContentStatus = "active" | "needs_review";
export type ReferralContentPhase = "current" | "future";
export type ReferrerAvailability = "Open" | "Limited" | "Not reviewing requests";

export interface ReferralGuidanceItem {
  id: string;
  title?: string;
  text: string;
  status: ReferralContentStatus;
  phase: ReferralContentPhase;
}

export interface ReferralGuidanceCollection {
  requestQualityChecklist: ReferralGuidanceItem[];
  goodRequestBehavior: ReferralGuidanceItem[];
  poorRequestBehavior: ReferralGuidanceItem[];
  communitySafety: ReferralGuidanceItem[];
  referrerReviewChecklist: ReferralGuidanceItem[];
  availabilityCardHelp: ReferralGuidanceItem[];
  decisionSteps: ReferralGuidanceItem[];
  futureWorkflow: ReferralGuidanceItem[];
}

export interface ReferralTemplate {
  id: string;
  title: string;
  body: string;
  kind: "decline" | "more-information";
  status: ReferralContentStatus;
  phase: "current";
}

export interface InterviewExperience {
  id: string;
  companyId: string;
  role: string;
  level: string;
  interviewDate: string;
  location: string;
  rounds: string[];
  topics: string[];
  experience: string;
  result?: "Offer" | "No offer" | "Withdrew" | "In progress";
  anonymous: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  category: "DSA" | "System Design" | "ML Design" | "Backend Engineering";
  summary: string;
  deadline?: string;
  status: "Upcoming" | "Open" | "Judging" | "Complete";
  score?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}
