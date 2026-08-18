export type DSARoadmapRoleSlug = "new-grad" | "sde-1" | "sde-2" | "senior";
export type DSARoadmapDuration = 30 | 60 | 90;

export interface DSARoadmapTask {
  id: string;
  label: string;
  href?: string;
  kind: "concept" | "practice" | "review" | "simulation";
}

export interface DSARoadmapPhase {
  id: string;
  title: string;
  days: string;
  summary: string;
  goals: string[];
  topics: string[];
  tasks: DSARoadmapTask[];
  targetProblems?: number;
  recommendedPatterns?: string[];
}

export interface DSARoadmap {
  roleSlug: DSARoadmapRoleSlug;
  role: string;
  durationDays: DSARoadmapDuration;
  description: string;
  timeCommitment: string;
  status: "published" | "coming-soon";
  phases: DSARoadmapPhase[];
  revisionNote: string;
}

export const dsaRoadmapRoles = [
  { slug: "new-grad", name: "New Grad", focus: "Build reliable foundations and solve common easy-to-medium patterns cleanly." },
  { slug: "sde-1", name: "SDE I", focus: "Strengthen core patterns, implementation speed, and clear complexity explanations." },
  { slug: "sde-2", name: "SDE II", focus: "Add deeper graph, interval, dynamic-programming, and company-targeted practice." },
  { slug: "senior", name: "SDE III / Senior", focus: "Pair sound algorithms with decomposition, tradeoffs, testing, and precise communication." },
] as const;

export const dsaRoadmapDurations: DSARoadmapDuration[] = [30, 60, 90];

const sde2Phases: DSARoadmapPhase[] = [
  { id: "sde2-60-foundations", title: "Refresh fundamentals", days: "Days 1–7", summary: "Rebuild fluency before increasing difficulty.", goals: ["Write clean code without fighting syntax", "State time and space complexity", "Revisit the failure modes in your mistake log"], topics: ["Arrays", "Hashing", "Strings", "Complexity"], targetProblems: 10, recommendedPatterns: ["Hash maps", "Two pointers", "Sliding window"], tasks: [
    { id: "sde2-60-python", label: "Refresh your interview language and core collections", href: "/dsa/languages/python", kind: "concept" },
    { id: "sde2-60-arrays", label: "Review arrays, hashing, and string invariants", href: "/dsa/arrays", kind: "concept" },
    { id: "sde2-60-baseline", label: "Complete one untimed baseline set and record mistakes", href: "/dsa/questions", kind: "practice" },
  ] },
  { id: "sde2-60-core", title: "Core patterns", days: "Days 8–20", summary: "Practice recognizing the solution shape before reaching for code.", goals: ["Name the invariant", "Compare brute force with the target approach", "Test boundary cases aloud"], topics: ["Two Pointers", "Sliding Window", "Binary Search", "Prefix Sum"], targetProblems: 20, recommendedPatterns: ["Two pointers", "Sliding window", "Binary search", "Prefix sum"], tasks: [
    { id: "sde2-60-pattern-index", label: "Map recognition signals to the core pattern index", href: "/dsa/patterns", kind: "concept" },
    { id: "sde2-60-core-practice", label: "Build two mixed, time-boxed practice queues", href: "/dsa/questions", kind: "practice" },
  ] },
  { id: "sde2-60-structures", title: "Trees, graphs, heaps, and intervals", days: "Days 21–35", summary: "Strengthen traversal choices and state representation.", goals: ["Choose BFS versus DFS deliberately", "Model graph state without duplication", "Explain heap and interval ordering"], topics: ["Trees", "Graphs", "Heaps", "Intervals"], targetProblems: 22, recommendedPatterns: ["Tree DFS", "Graph BFS", "Topological sort", "Heap / Top K"], tasks: [
    { id: "sde2-60-trees", label: "Review tree traversal and graph representation", href: "/dsa/trees", kind: "concept" },
    { id: "sde2-60-graphs", label: "Practice graph, heap, and interval sets", href: "/dsa/graphs", kind: "practice" },
  ] },
  { id: "sde2-60-advanced", title: "DP and advanced patterns", days: "Days 36–45", summary: "Focus on deriving state and transitions instead of memorizing tables.", goals: ["Define state in one sentence", "Write a recurrence before implementation", "Recognize when greedy reasoning is sufficient"], topics: ["Dynamic Programming", "Backtracking", "Union Find", "Greedy"], targetProblems: 14, recommendedPatterns: ["1D DP", "2D DP", "Backtracking", "Union find"], tasks: [
    { id: "sde2-60-dp", label: "Review dynamic-programming state design", href: "/dsa/dynamic-programming", kind: "concept" },
    { id: "sde2-60-advanced-practice", label: "Solve a small, reviewed advanced-pattern set", href: "/dsa/questions", kind: "practice" },
  ] },
  { id: "sde2-60-targeted", title: "Company-targeted practice", days: "Days 46–53", summary: "Use verified associations once available; today, use the demo browser to learn the workflow.", goals: ["Filter by role and weak topics", "Avoid treating unverified frequency as fact", "Review solution quality, not only acceptance"], topics: ["Company Questions", "Weak Areas"], tasks: [
    { id: "sde2-60-company", label: "Build a company and role filter workflow", href: "/dsa/companies", kind: "practice" },
    { id: "sde2-60-review", label: "Re-solve the highest-value mistakes without notes", kind: "review" },
  ] },
  { id: "sde2-60-simulations", title: "Timed interview simulations", days: "Days 54–57", summary: "Practice the full conversation, not silent puzzle solving.", goals: ["Clarify before coding", "Narrate tradeoffs", "Test with concrete examples"], topics: ["Communication", "Testing", "Timing"], tasks: [
    { id: "sde2-60-framework", label: "Use the unseen-problem framework", href: "/dsa/interview-strategy/problem-solving-framework", kind: "simulation" },
    { id: "sde2-60-mocks", label: "Run two realistic timed simulations", kind: "simulation" },
  ] },
  { id: "sde2-60-revision", title: "Weak-area revision", days: "Days 58–60", summary: "Reduce last-minute scope and reinforce the mistakes that still repeat.", goals: ["Prioritize recurring errors", "Review templates without cramming", "Enter the interview rested"], topics: ["Mistake Log", "Review", "Interview Readiness"], tasks: [
    { id: "sde2-60-mistakes", label: "Review the mistake log and one representative problem per weak pattern", href: "/dsa/interview-strategy/mistake-log", kind: "review" },
    { id: "sde2-60-checklist", label: "Complete the interview-day checklist", href: "/dsa/interview-strategy/interview-day-checklist", kind: "review" },
  ] },
];

export const dsaRoadmaps: DSARoadmap[] = dsaRoadmapRoles.flatMap((role) => dsaRoadmapDurations.map((durationDays) => ({
  roleSlug: role.slug,
  role: role.name,
  durationDays,
  description: durationDays === 60 && role.slug === "sde-2" ? "Prepare for mid-level software engineering coding interviews with a deliberate progression from fluency to realistic simulations." : `${durationDays}-day route architecture for ${role.name} interview preparation. Full editorial planning is coming soon.`,
  timeCommitment: durationDays === 60 && role.slug === "sde-2" ? "Plan for roughly 60–90 focused minutes on most days; adjust to your baseline and interview date." : "Time guidance will be added during editorial review.",
  status: durationDays === 60 && role.slug === "sde-2" ? "published" as const : "coming-soon" as const,
  phases: durationDays === 60 && role.slug === "sde-2" ? sde2Phases : [],
  revisionNote: "This is a revision-friendly preparation framework, not a research-backed prescription or guarantee of interview outcomes.",
})));

export function getDsaRoadmap(roleSlug: string, durationSegment: string) {
  const duration = Number(durationSegment.replace("-day", ""));
  return dsaRoadmaps.find((roadmap) => roadmap.roleSlug === roleSlug && roadmap.durationDays === duration);
}
