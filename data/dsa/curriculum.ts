import { dsaCompanies } from "./interview-prep";
import { dsaLanguages } from "./languages";
import { dsaRoadmapDurations, dsaRoadmapRoles } from "./roadmaps";

export type DSACurriculumNodeType = "major-category" | "section" | "page";
export type DSAContentStatus = "published" | "coming-soon";

export interface DSACurriculumNode {
  id: string;
  title: string;
  navigationTitle?: string;
  slug?: string;
  description?: string;
  type: DSACurriculumNodeType;
  category: string;
  status?: DSAContentStatus;
  estimatedReadTime?: number;
  keywords?: string[];
  children?: DSACurriculumNode[];
}

function segment(title: string) {
  return title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function page(title: string, category: string, slug: string, options: Partial<DSACurriculumNode> = {}): DSACurriculumNode {
  return {
    id: options.id ?? slug.replace(/^\//, "").replaceAll("/", "-"), title, slug, type: "page", category,
    description: options.description ?? `${title} for practical coding-interview preparation.`,
    status: options.status ?? "coming-soon", estimatedReadTime: options.estimatedReadTime ?? 6,
    keywords: options.keywords ?? [title, category, "DSA", "coding interview"], navigationTitle: options.navigationTitle,
  };
}

function section(title: string, category: string, children: DSACurriculumNode[]): DSACurriculumNode {
  return { id: `${segment(category)}-${segment(title)}`, title, type: "section", category, children };
}

function major(title: string, description: string, children: DSACurriculumNode[]): DSACurriculumNode {
  return { id: segment(title), title, description, type: "major-category", category: title, children };
}

const startHereTitles = [
  ["DSA Interview Preparation Overview", "overview"], ["How Coding Interviews Work", "how-coding-interviews-work"],
  ["How to Use Engineering Foundry DSA", "how-to-use-engineering-foundry"], ["How to Choose What to Practice", "choosing-what-to-practice"],
  ["Pattern Recognition vs Memorization", "patterns-vs-memorization"], ["How Much DSA Do You Actually Need?", "how-much-dsa"],
  ["How to Practice LeetCode Effectively", "practicing-leetcode"], ["How to Review Problems", "reviewing-problems"],
  ["What to Do When You Get Stuck", "when-you-get-stuck"],
] as const;

const strategyPages = [
  ["How to Solve an Unseen Coding Problem", "problem-solving-framework"], ["Clarifying Questions to Ask", "clarifying-questions"],
  ["Brute Force Before Optimization", "brute-force-first"], ["How to Communicate While Coding", "communication"],
  ["How to Explain Complexity", "complexity"], ["How to Test Your Solution", "testing"], ["Handling Edge Cases", "edge-cases"],
  ["What to Do When Stuck", "when-stuck"], ["When to Ask for a Hint", "asking-for-a-hint"],
  ["How to Practice Under Time Pressure", "time-pressure"], ["How to Review Failed Problems", "review-failed-problems"],
  ["How to Build a Mistake Log", "mistake-log"], ["Interview Day Checklist", "interview-day-checklist"],
] as const;

const startHere = major("Start Here", "Set a focused interview-preparation workflow before choosing question lists.", startHereTitles.map(([title, slug], index) => page(title, "Start Here", `/dsa/start-here/${slug}`, { status: index === 0 ? "published" : "coming-soon", estimatedReadTime: index === 0 ? 7 : 6 })));

const companyQuestions = major("Company Tagged Questions", "Browse an index designed for verified company-question imports.", [
  page("Browse All Companies", "Company Questions", "/dsa/companies", { status: "published", navigationTitle: "Browse all companies", description: "Search the company directory and preview the filterable question index built for a future verified dataset." }),
  section("Companies", "Company Questions", dsaCompanies.map((company) => page(company.name, "Company Questions", `/dsa/companies/${company.slug}`, { status: "published", description: company.description }))),
]);

const languages = major("DSA by Language", "Refresh only the syntax, collections, and templates useful in coding interviews.", [
  page("DSA by Language", "DSA by Language", "/dsa/languages", { status: "published", navigationTitle: "Browse language guides", description: "Refresh the syntax and standard-library tools you need for coding interviews." }),
  page("Which Language Should You Use?", "DSA by Language", "/dsa/languages/choose-a-language", { status: "published", navigationTitle: "Choose a language", estimatedReadTime: 8 }),
  ...dsaLanguages.map((language) => page(`${language.name} for Coding Interviews`, "DSA by Language", `/dsa/languages/${language.slug}`, { status: language.status, navigationTitle: language.name, description: language.description, estimatedReadTime: language.status === "published" ? 24 : 8, keywords: language.keywords })),
]);

const roadmaps = major("Interview Roadmaps", "Choose a role and a 30-, 60-, or 90-day preparation window.", [
  page("Level-Specific DSA Roadmaps", "Interview Roadmaps", "/dsa/roadmap", { status: "published", navigationTitle: "SDE I, II & III+ roadmaps", description: "Choose an SDE I, SDE II, or SDE III+ roadmap with distinct priorities, stages, and interview expectations." }),
  page("DSA Topic Dependency Map", "Interview Roadmaps", "/dsa/roadmap/topic-map", { status: "published", navigationTitle: "Topic dependency map", description: "Explore the visual prerequisite order for 18 connected DSA interview topics." }),
  page("Study Plans", "Interview Roadmaps", "/dsa/study-plans", { status: "published", description: "Choose a role-aware 30-, 60-, or 90-day coding interview preparation plan." }),
  page("Choose a Roadmap", "Interview Roadmaps", "/dsa/roadmaps", { status: "published", description: "Select a target role and a 30-, 60-, or 90-day preparation window." }),
  ...dsaRoadmapRoles.map((role) => section(role.name, "Interview Roadmaps", dsaRoadmapDurations.map((days) => page(`${days} Days`, `Interview Roadmaps · ${role.name}`, `/dsa/roadmaps/${role.slug}/${days}-day`, { status: role.slug === "sde-2" && days === 60 ? "published" : "coming-soon", description: `${role.name} ${days}-day DSA interview-preparation roadmap.` })))),
]);

const strategy = major("Interview Strategy", "Practice the reasoning and communication wrapped around correct code.", [
  page("Coding Interview Strategy", "Interview Strategy", "/dsa/strategy", { status: "published", navigationTitle: "Coding interview playbook", description: "A practical playbook for turning a problem into a clear, correct solution while communicating with the interviewer.", estimatedReadTime: 22, keywords: ["coding interview strategy", "interview communication", "problem solving", "testing", "debugging", "complexity"] }),
  ...strategyPages.map(([title, slug], index) => page(title, "Interview Strategy", `/dsa/interview-strategy/${slug}`, { status: index === 0 ? "published" : "coming-soon", estimatedReadTime: index === 0 ? 9 : 6 })),
]);

export const dsaCurriculum: DSACurriculumNode[] = [startHere, companyQuestions, languages, roadmaps, strategy];

function flattenPages(nodes: readonly DSACurriculumNode[]): DSACurriculumNode[] {
  return nodes.flatMap((node) => node.type === "page" ? [node] : flattenPages(node.children ?? []));
}

export const dsaCurriculumPages = flattenPages(dsaCurriculum);

export function getDsaCurriculumPage(slug: string) {
  return dsaCurriculumPages.find((item) => item.slug === slug);
}

export function getDsaCurriculumTrail(slug: string) {
  function visit(nodes: readonly DSACurriculumNode[], trail: DSACurriculumNode[]): DSACurriculumNode[] | null {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.slug === slug) return next;
      const found = visit(node.children ?? [], next);
      if (found) return found;
    }
    return null;
  }
  return visit(dsaCurriculum, []) ?? [];
}

export function getDsaCurriculumPager(slug: string) {
  const index = dsaCurriculumPages.findIndex((item) => item.slug === slug);
  return { previous: index > 0 ? dsaCurriculumPages[index - 1] : undefined, next: index >= 0 ? dsaCurriculumPages[index + 1] : undefined };
}

export const dsaPatternIndex = ["Hash Map / Frequency Counting", "Two Pointers", "Sliding Window", "Prefix Sum", "Fast & Slow Pointers", "Binary Search", "Monotonic Stack", "Heap / Top K", "Merge Intervals", "Tree DFS", "Tree BFS", "Graph DFS", "Graph BFS", "Topological Sort", "Union Find", "Backtracking", "Trie", "Greedy", "1D DP", "2D DP", "Bit Manipulation"];
