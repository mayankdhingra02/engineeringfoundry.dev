export type CompanyGuideLevel = "sde-i" | "sde-ii" | "sde-iii" | "l3" | "l4" | "l5" | "e3" | "e4" | "e5" | "early" | "mid" | "senior";
export type EvidenceKind = "official" | "candidate" | "recommendation";
export type Confidence = "Very High" | "High" | "Medium–High" | "Medium" | "Low–Medium" | "Low";
export type QuestionMatch = "Exact" | "Similar" | "Same pattern" | "Unknown";

export interface EvidenceRef {
  kind: EvidenceKind;
  confidence: Confidence;
  label: string;
  sourceUrl?: string;
}

export interface InterviewStage {
  title: string;
  detail?: string;
}

export interface InterviewLoop {
  id: string;
  level: CompanyGuideLevel;
  title: string;
  baseline: boolean;
  stages: InterviewStage[];
  interviewsLabel?: string;
  location?: string;
  geography?: string;
  roleSpecialization?: string;
  year?: number;
  evidence: EvidenceRef;
  note?: string;
}

export interface TopicTier {
  title: string;
  topics: string[];
}

export interface RoleGuide {
  id: CompanyGuideLevel;
  role: string;
  level: string;
  careerStage: string;
  geographyTitles?: Record<string, string>;
  summary: string;
  experienceRange: string;
  intensity: string;
  process: InterviewStage[];
  processEvidence: EvidenceRef;
  processNotes: string[];
  processMetrics?: Array<{ value: string; label: string }>;
  codingTiers: TopicTier[];
  codingGoal: string;
  codingNote?: string;
  hldLabel: string;
  hldSummary: string;
  hldGuidance?: string;
  lldExamples: string[];
  lldExamplesTitle?: string;
  lldEvidence?: EvidenceRef;
  storyCount: string;
  storyFocus: string[];
  storyWarning?: string;
  preparationAllocation: Array<{ label: string; value: number; displayValue?: string }>;
  allocationNote?: string;
  failureModes: string[];
  successMessage: string;
  mockGuidance?: string[];
}

export interface ReportedQuestion {
  id: string;
  company: string;
  levels: CompanyGuideLevel[];
  normalizedLevels?: string[];
  question: string;
  category: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Unknown";
  questionType: "Coding" | "HLD" | "LLD / OOD" | "Practical";
  year: number;
  reported: true;
  sourceType: "Candidate Report";
  sourceUrl?: string;
  sourceConfidence?: "Corroborated" | "Anecdotal" | "Limited";
  matchType?: QuestionMatch;
  location?: string;
  geography?: string;
  companyTitle?: string;
  notes: string;
  leetcodeId?: number;
  leetcodeUrl?: string;
  alternativeUrl?: string;
  reportCount?: number;
  lastReported?: string;
  recentSixMonthCount?: number;
  oneYearCount?: number;
  sourceCount?: number;
  premium?: boolean;
}

export interface InterviewExperience {
  id: string;
  level: CompanyGuideLevel;
  title: string;
  location?: string;
  geography?: string;
  approximateDate?: string;
  yearsExperience?: string;
  year: number;
  result: string;
  sequence: string[];
  topics: string[];
  environment?: string;
  note?: string;
  confidence?: Confidence;
  sourceUrl?: string;
}

export interface PreparationPlan {
  duration: "Tomorrow" | "1 Day" | "3 Days" | "7 Days" | "14 Days" | "30 Days" | "60 Days" | "90 Days";
  byLevel: Partial<Record<CompanyGuideLevel, string[]>>;
}

export interface GuideResource {
  title: string;
  category: string;
  url: string;
  description: string;
  evidence: EvidenceKind;
}

export interface CompanyComparison {
  columns: string[];
  rows: string[][];
  disclaimer: string;
}

export interface ExecutionFramework {
  title: string;
  description: string;
  warning?: string;
  steps: Array<{ title: string; detail: string }>;
}

export interface CodingTransformation {
  textbook: string;
  companyStyle: string;
}

export interface DesignQuestion {
  title: string;
  detail?: string;
  themes: string[];
  evidence: EvidenceRef;
}

export interface WatchItem {
  title: string;
  text: string;
  evidence: EvidenceRef;
}

export interface CodingRoundFormat {
  title: string;
  label: string;
  description: string;
  durationLabel: string;
  questionCountLabel: string;
  evidence: EvidenceRef;
  warning: string;
  timingRecommendationLabel: string;
  timing: Array<{ range: string; title: string; detail: string }>;
  environment: string[];
  flow: string[];
  measurements: string[];
}

export interface QuestionStrategy {
  title: string;
  description: string;
  warning: string;
  steps: Array<{ title: string; detail: string }>;
  examples: string[];
}

export interface DesignTrack {
  id: string;
  title: string;
  description: string;
  focus: string[];
  examples: string[];
}

export interface ReadinessScorecard {
  title: string;
  description: string;
  spotlight: string;
  metrics: string[];
  groups?: Array<{ title: string; metrics: string[] }>;
  targets: Partial<Record<CompanyGuideLevel, string[]>>;
  disclaimer: string;
}

export interface GeographyContext {
  title: string;
  description: string;
  defaultId: string;
  warning: string;
  options: Array<{
    id: string;
    label: string;
    description: string;
    processCaveats: string[];
  }>;
}

export interface PracticalEngineeringGuide {
  title: string;
  description: string;
  warning: string;
  categories: Array<{ title: string; items: string[] }>;
  exercises: string[];
  evidence: EvidenceRef;
}

export interface ProjectDeepDiveGuide {
  title: string;
  description: string;
  levels: CompanyGuideLevel[];
  fields: string[];
  seniorSignals: string[];
}

export interface CompanyInterviewGuide {
  company: string;
  slug: string;
  brandCode: string;
  updatedAt: string;
  subtitle: string;
  officialUrl: string;
  officialLinkLabel?: string;
  levelFirst?: boolean;
  defaultLevel: CompanyGuideLevel;
  levelSummary: string;
  geographyContext?: GeographyContext;
  roles: RoleGuide[];
  comparison: CompanyComparison;
  processDisclaimer: string;
  loopVariants?: InterviewLoop[];
  codingRoundFormat?: CodingRoundFormat;
  codingExecution?: ExecutionFramework;
  codingTransformations?: CodingTransformation[];
  codingInsightPatterns?: string[];
  questionStrategy?: QuestionStrategy;
  hldFramework: string[];
  lldFramework: string[];
  designTracks?: DesignTrack[];
  designQuestionLevels?: CompanyGuideLevel[];
  designWarning?: { title: string; bad: string; better: string; text: string };
  designPracticeDomains?: { title: string; description: string; domains: string[] };
  practicalEngineering?: PracticalEngineeringGuide;
  projectDeepDive?: ProjectDeepDiveGuide;
  behavioralTitle: string;
  behavioralThemes: string[];
  storyFields?: string[];
  questions: ReportedQuestion[];
  designQuestions?: DesignQuestion[];
  experiences: InterviewExperience[];
  plans: PreparationPlan[];
  readiness?: ReadinessScorecard;
  errorTaxonomy?: string[];
  postInterview?: {
    title: string;
    description: string;
    stages: string[];
    reround: string;
  };
  specializedRoles?: {
    title: string;
    description: string;
    roles: string[];
    model: string;
  };
  watchItems?: WatchItem[];
  systemsReading?: Array<{ title: string; lesson: string; url: string }>;
  resourceCategories: string[];
  resources: GuideResource[];
  sourceNotes: Array<{ kind: EvidenceKind; confidence: Confidence; title: string; text: string }>;
}
