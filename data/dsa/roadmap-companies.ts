import type { RoadmapLevel } from "./level-roadmaps.ts";
import { roadmapProblemById } from "./roadmap-problem-registry.ts";

export type RoadmapCompanyId =
  | "amazon"
  | "google"
  | "meta"
  | "microsoft"
  | "apple"
  | "nvidia"
  | "uber"
  | "netflix"
  | "atlassian"
  | "walmart"
  | "openai"
  | "anthropic";

export type CompanyRecommendationEvidence =
  | "official"
  | "interview-report"
  | "community"
  | "editorial-synthesis";

export type CompanyProblemRelevance = "high" | "medium" | "supplemental";

export type CompanyRoadmapProblemAssignment = {
  problemId: string;
  levels: RoadmapLevel[];
  relevance: CompanyProblemRelevance;
  sourceType: CompanyRecommendationEvidence;
  note: string;
};

export type RoadmapCompany = {
  id: RoadmapCompanyId;
  name: string;
  researchStatus: "available" | "coming-soon";
  reviewedAt?: string;
  guideHref?: string;
  questionBrowserHref?: string;
  emphasis?: Partial<Record<RoadmapLevel, string[]>>;
  problemAssignments?: CompanyRoadmapProblemAssignment[];
  evidenceNote?: string;
};

const researchedCompanies: RoadmapCompany[] = [
  {
    id: "amazon",
    name: "Amazon",
    researchStatus: "available",
    reviewedAt: "August 2026",
    guideHref: "/companies/amazon",
    questionBrowserHref: "/dsa/companies/amazon",
    emphasis: {
      sde1: ["Arrays and hashing", "Trees and graphs", "Heaps", "Clean testing"],
      sde2: ["Graphs and dependency modeling", "Trees", "Heaps", "Stateful coding"],
      sde3plus: ["Coding fluency", "Stateful structures", "Graph modeling", "Trade-off discussion"],
    },
    problemAssignments: [
      { problemId: "rotting-oranges", levels: ["sde1"], relevance: "high", sourceType: "interview-report", note: "Reported in a recent SDE I technical round in the researched Amazon guide." },
      { problemId: "course-schedule-ii", levels: ["sde1", "sde2"], relevance: "high", sourceType: "interview-report", note: "Reported across recent SDE I and SDE II candidate experiences." },
      { problemId: "serialize-and-deserialize-binary-tree", levels: ["sde2"], relevance: "medium", sourceType: "interview-report", note: "Reported in an SDE II onsite variation; use as tree-state practice, not a frequency claim." },
      { problemId: "find-median-from-data-stream", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "interview-report", note: "Reported in an SDE II experience and useful for senior streaming-state preparation." },
      { problemId: "reorganize-string", levels: ["sde2"], relevance: "medium", sourceType: "interview-report", note: "Reported in a recent SDE II candidate experience." },
      { problemId: "task-scheduler", levels: ["sde3plus"], relevance: "high", sourceType: "interview-report", note: "Reported in a senior candidate coding round." },
    ],
    evidenceNote: "Official process guidance is separated from candidate-reported coding examples in the Amazon guide.",
  },
  {
    id: "google",
    name: "Google",
    researchStatus: "available",
    reviewedAt: "August 2026",
    guideHref: "/companies/google",
    questionBrowserHref: "/dsa/companies/google",
    emphasis: {
      sde1: ["Graph and tree fluency", "Sliding windows", "Binary search", "Clear implementation"],
      sde2: ["Graph modeling", "Shortest paths", "Heaps and Top-K", "Ambiguous transformations"],
      sde3plus: ["Model selection", "Online aggregation", "Indexing", "Changed-constraint reasoning"],
    },
    problemAssignments: [
      { problemId: "longest-substring-without-repeating-characters", levels: ["sde1", "sde2"], relevance: "medium", sourceType: "interview-report", note: "A similar sliding-window problem appears in current candidate-report research." },
      { problemId: "minimum-window-substring", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "interview-report", note: "Reported as an exact or similar sliding-window family; wording may vary." },
      { problemId: "course-schedule", levels: ["sde2", "sde3plus"], relevance: "high", sourceType: "editorial-synthesis", note: "A canonical dependency-modeling drill aligned with repeated topological-order signals in the guide." },
      { problemId: "network-delay-time", levels: ["sde2", "sde3plus"], relevance: "high", sourceType: "editorial-synthesis", note: "A canonical shortest-path drill aligned with researched graph and priority-queue patterns." },
      { problemId: "top-k-frequent-elements", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "editorial-synthesis", note: "A portable Top-K drill aligned with researched heap and ranking patterns." },
    ],
    evidenceNote: "Most coding signals are candidate-report pattern families, not official or guaranteed question lists.",
  },
  {
    id: "meta",
    name: "Meta",
    researchStatus: "available",
    reviewedAt: "August 2026",
    guideHref: "/companies/meta",
    questionBrowserHref: "/dsa/companies/meta",
    emphasis: {
      sde1: ["Arrays and strings", "Tree traversal", "Intervals", "Fast manual verification"],
      sde2: ["Trees and graphs", "Prefix sums", "Sliding windows", "Interview-speed implementation"],
      sde3plus: ["Tree and graph refresh", "Stateful follow-ups", "Clear trade-offs", "Concise coding"],
    },
    problemAssignments: [
      { problemId: "binary-tree-right-side-view", levels: ["sde1", "sde2", "sde3plus"], relevance: "high", sourceType: "interview-report", note: "Corroborated candidate-report signal in the current Meta guide." },
      { problemId: "merge-intervals", levels: ["sde1", "sde2"], relevance: "high", sourceType: "interview-report", note: "Corroborated recent candidate-report signal." },
      { problemId: "best-time-to-buy-and-sell-stock", levels: ["sde1"], relevance: "medium", sourceType: "interview-report", note: "Reported as an array/running-minimum exercise." },
      { problemId: "remove-duplicates-from-sorted-array", levels: ["sde1", "sde3plus"], relevance: "supplemental", sourceType: "interview-report", note: "Reported in candidate experiences; useful as a quick fluency check." },
      { problemId: "subarray-sum-equals-k", levels: ["sde2", "sde3plus"], relevance: "high", sourceType: "interview-report", note: "Reported as an exact prefix-sum and hashmap exercise." },
      { problemId: "max-consecutive-ones-iii", levels: ["sde2"], relevance: "medium", sourceType: "interview-report", note: "Candidate-reported variable-window signal." },
      { problemId: "clone-graph", levels: ["sde1", "sde2"], relevance: "medium", sourceType: "interview-report", note: "Reported graph-cloning exercise." },
      { problemId: "course-schedule", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "interview-report", note: "Reported dependency-graph family." },
    ],
    evidenceNote: "The overlay uses candidate-report signals and labels them as such; it does not imply official frequency.",
  },
  {
    id: "walmart",
    name: "Walmart",
    researchStatus: "available",
    reviewedAt: "August 2026",
    guideHref: "/companies/walmart",
    questionBrowserHref: "/dsa/companies/walmart",
    emphasis: {
      sde1: ["Arrays and hashing", "Graphs", "Practical implementation", "Testing"],
      sde2: ["Prefix sums", "Graphs", "Dynamic programming", "Backend implementation"],
      sde3plus: ["Coding fluency", "API implementation", "Intervals", "Production reasoning"],
    },
    problemAssignments: [
      { problemId: "house-robber-ii", levels: ["sde1", "sde2"], relevance: "high", sourceType: "interview-report", note: "Corroborated across multiple researched candidate experiences." },
      { problemId: "subarray-sum-equals-k", levels: ["sde2", "sde3plus"], relevance: "high", sourceType: "interview-report", note: "Corroborated exact or close mappings in the current research." },
      { problemId: "search-in-rotated-sorted-array", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "interview-report", note: "Reported in a recent senior candidate experience." },
      { problemId: "word-break", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "interview-report", note: "Reported in a recent accepted-offer experience." },
      { problemId: "course-schedule", levels: ["sde2", "sde3plus"], relevance: "medium", sourceType: "interview-report", note: "Reported in Software Engineer III interview evidence." },
    ],
    evidenceNote: "The guide also reports practical backend exercises, so the DSA add-on is intentionally not presented as the whole process.",
  },
];

const comingSoonCompanies: RoadmapCompany[] = [
  { id: "microsoft", name: "Microsoft", researchStatus: "coming-soon", guideHref: "/companies/microsoft", questionBrowserHref: "/dsa/companies/microsoft" },
  { id: "apple", name: "Apple", researchStatus: "coming-soon", guideHref: "/companies/apple", questionBrowserHref: "/dsa/companies/apple" },
  { id: "nvidia", name: "NVIDIA", researchStatus: "coming-soon" },
  { id: "uber", name: "Uber", researchStatus: "coming-soon", questionBrowserHref: "/dsa/companies/uber" },
  { id: "netflix", name: "Netflix", researchStatus: "coming-soon", questionBrowserHref: "/dsa/companies/netflix" },
  { id: "atlassian", name: "Atlassian", researchStatus: "coming-soon", questionBrowserHref: "/dsa/companies/atlassian" },
  { id: "openai", name: "OpenAI", researchStatus: "coming-soon" },
  { id: "anthropic", name: "Anthropic", researchStatus: "coming-soon" },
];

export const roadmapCompanies: readonly RoadmapCompany[] = [...researchedCompanies, ...comingSoonCompanies];
export const roadmapCompanyById = new Map(roadmapCompanies.map((company) => [company.id, company]));

export function getRoadmapCompany(id?: string | null) {
  return id ? roadmapCompanyById.get(id as RoadmapCompanyId) : undefined;
}

export function getCompanyProblemAssignments(companyId: RoadmapCompanyId | undefined, level: RoadmapLevel) {
  if (!companyId) return [];
  return getRoadmapCompany(companyId)?.problemAssignments?.filter((assignment) => assignment.levels.includes(level)) ?? [];
}

export function assertRoadmapCompanyIntegrity() {
  const ids = roadmapCompanies.map((company) => company.id);
  if (new Set(ids).size !== ids.length) throw new Error("Roadmap companies contain duplicate IDs.");
  for (const company of roadmapCompanies) {
    if (company.researchStatus === "available" && (!company.reviewedAt || !company.evidenceNote)) throw new Error(`${company.id} is missing research freshness metadata.`);
    for (const assignment of company.problemAssignments ?? []) {
      if (!roadmapProblemById.has(assignment.problemId)) throw new Error(`${company.id} references unknown canonical problem ${assignment.problemId}.`);
      if (!assignment.levels.length) throw new Error(`${company.id}/${assignment.problemId} has no roadmap levels.`);
    }
  }
}

assertRoadmapCompanyIntegrity();
