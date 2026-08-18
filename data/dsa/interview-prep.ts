import type { Difficulty } from "@/types";

export type DSAInterviewRole = "New Grad" | "SDE I" | "SDE II" | "Senior / SDE III";
export type DSAQuestionFrequency = "Low" | "Medium" | "High";
export type DSAQuestionProgressStatus = "not-started" | "attempted" | "solved";
export type DSAQuestionSourceType = "leetcode" | "leetcode-ca" | "other";

export interface DSAQuestionSource {
  type: DSAQuestionSourceType;
  label: string;
  url: string | null;
  access: "public" | "public-reference" | "metadata-only";
}

export interface DSAInterviewQuestion {
  id: string;
  title: string;
  slug?: string;
  difficulty: Difficulty;
  topics: string[];
  patterns: string[];
  companies: Array<{
    companySlug: string;
    roles?: DSAInterviewRole[];
    frequency?: DSAQuestionFrequency;
    lastSeen?: string;
  }>;
  sources: DSAQuestionSource[];
  paidOnLeetCode?: boolean;
  metadata?: { notes?: string };
  isSample: boolean;
}

export interface DSACompany {
  slug: string;
  name: string;
  description: string;
  featured?: boolean;
}

export interface DSAProgressState {
  questionStatusById: Readonly<Record<string, DSAQuestionProgressStatus>>;
  bookmarkedQuestionIds: readonly string[];
  completedRoadmapTaskIds: readonly string[];
  savedCompanySlugs: readonly string[];
  preferredLanguageSlug?: string;
}

const companyNames = [
  "Amazon", "Google", "Meta", "Microsoft", "Apple", "Netflix", "Uber", "Airbnb", "LinkedIn", "Stripe",
  "Atlassian", "DoorDash", "Bloomberg", "TikTok", "Adobe", "Salesforce", "Walmart", "Coinbase", "Robinhood", "Databricks",
] as const;

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const dsaCompanies: DSACompany[] = companyNames.map((name, index) => ({
  slug: toSlug(name),
  name,
  featured: index < 6,
  description: `A ready-to-populate interview-preparation index for ${name}. Verified company associations will be added with the curated dataset.`,
}));

/**
 * Demonstration records only. Company associations below prove the filters and
 * route architecture; they are not claims about any company's interview history.
 * Titles and links point to public problem index pages and no statements are copied.
 */
export const sampleCompanyQuestions: DSAInterviewQuestion[] = [
  {
    id: "demo-two-sum", title: "Two Sum", difficulty: "Easy", topics: ["Arrays", "Hashing"], patterns: ["Hash Map / Frequency Counting"],
    companies: [{ companySlug: "amazon", roles: ["New Grad", "SDE I"] }, { companySlug: "google", roles: ["SDE I"] }],
    sources: [{ type: "leetcode", label: "LeetCode", url: "https://leetcode.com/problems/two-sum/", access: "public" }], isSample: true,
  },
  {
    id: "demo-longest-substring", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topics: ["Strings", "Hashing"], patterns: ["Sliding Window"],
    companies: [{ companySlug: "meta", roles: ["SDE I", "SDE II"] }, { companySlug: "microsoft", roles: ["SDE I"] }],
    sources: [{ type: "leetcode", label: "LeetCode", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", access: "public" }], isSample: true,
  },
  {
    id: "demo-level-order", title: "Binary Tree Level Order Traversal", difficulty: "Medium", topics: ["Trees", "Queues"], patterns: ["Tree BFS"],
    companies: [{ companySlug: "apple", roles: ["SDE I", "SDE II"] }, { companySlug: "amazon", roles: ["SDE II"] }],
    sources: [{ type: "leetcode", label: "LeetCode", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", access: "public" }], isSample: true,
  },
  {
    id: "demo-course-schedule", title: "Course Schedule", difficulty: "Medium", topics: ["Graphs"], patterns: ["Topological Sort"],
    companies: [{ companySlug: "google", roles: ["SDE II", "Senior / SDE III"] }, { companySlug: "uber", roles: ["SDE II"] }],
    sources: [{ type: "leetcode", label: "LeetCode", url: "https://leetcode.com/problems/course-schedule/", access: "public" }], isSample: true,
  },
  {
    id: "demo-merge-k-lists", title: "Merge k Sorted Lists", difficulty: "Hard", topics: ["Linked Lists", "Heaps"], patterns: ["Heap / Top K"],
    companies: [{ companySlug: "netflix", roles: ["Senior / SDE III"] }, { companySlug: "meta", roles: ["SDE II"] }],
    sources: [{ type: "leetcode", label: "LeetCode", url: "https://leetcode.com/problems/merge-k-sorted-lists/", access: "public" }], isSample: true,
  },
  {
    id: "demo-no-link", title: "Source pending editorial verification", difficulty: "Medium", topics: ["Arrays"], patterns: ["Two Pointers"],
    companies: [{ companySlug: "microsoft", roles: ["SDE II"] }],
    sources: [{ type: "other", label: "No public source", url: null, access: "metadata-only" }], metadata: { notes: "Demonstrates a metadata-only record when no lawful public source is available." }, isSample: true,
  },
];

export const dsaQuestionTopics = [...new Set(sampleCompanyQuestions.flatMap((question) => question.topics))].sort();
export const dsaQuestionPatterns = [...new Set(sampleCompanyQuestions.flatMap((question) => question.patterns))].sort();

export function getDsaCompany(slug: string) {
  return dsaCompanies.find((company) => company.slug === slug);
}

export function getSampleQuestionsForCompany(slug: string) {
  return sampleCompanyQuestions.filter((question) => question.companies.some((company) => company.companySlug === slug));
}
