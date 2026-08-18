export interface InterviewFlowStage {
  id: string;
  number: string;
  title: string;
  summary: string;
  actions: string[];
}

export interface PatternCue {
  signal: string;
  pattern: string;
  roadmapTopicId: string;
}

export const quickReviewSteps = [
  "Restate the problem",
  "Clarify constraints",
  "Explain a correct baseline",
  "Identify the bottleneck",
  "Propose the optimization",
  "Confirm the approach",
  "Code in reviewable steps",
  "Test deliberately",
  "State time and space complexity",
  "Adapt to the follow-up",
] as const;

export const interviewFlowStages: InterviewFlowStage[] = [
  { id: "understand", number: "01", title: "Understand", summary: "Build the right problem contract before solving.", actions: ["Restate", "Identify input/output", "Inspect an example"] },
  { id: "clarify", number: "02", title: "Clarify", summary: "Ask only questions that could change the solution.", actions: ["Constraints", "Edge cases", "Assumptions"] },
  { id: "solve", number: "03", title: "Solve", summary: "Anchor correctness, then remove the bottleneck.", actions: ["Baseline", "Optimize", "Validate"] },
  { id: "coding", number: "04", title: "Code", summary: "Implement clearly while explaining decisions.", actions: ["Invariants", "Clear names", "Reviewable steps"] },
  { id: "testing", number: "05", title: "Test", summary: "Trace the algorithm and repair the smallest defect.", actions: ["Sample", "Edge case", "Boundaries"] },
  { id: "complexity", number: "06", title: "Analyze", summary: "Close with costs, tradeoffs, and variations.", actions: ["Time", "Space", "Follow-up"] },
];

export const constraintGuides = [
  { scale: "n ≤ 20", guidance: "Exponential search or backtracking may be reasonable." },
  { scale: "n ≤ 10³", guidance: "A carefully justified O(n²) approach may be reasonable." },
  { scale: "n ≤ 10⁵", guidance: "Usually investigate O(n log n) or O(n)." },
  { scale: "n ≤ 10⁶", guidance: "Linear or near-linear work often becomes important." },
] as const;

export const patternCues: PatternCue[] = [
  { signal: "Pair in sorted input", pattern: "Two Pointers", roadmapTopicId: "two-pointers" },
  { signal: "Contiguous subarray or substring", pattern: "Sliding Window", roadmapTopicId: "sliding-window" },
  { signal: "Fast membership, counting, or lookup", pattern: "Arrays & Hashing", roadmapTopicId: "arrays-hashing" },
  { signal: "Repeated minimum, maximum, or top K", pattern: "Heap / Priority Queue", roadmapTopicId: "heap-priority-queue" },
  { signal: "Level-by-level traversal", pattern: "Trees or Graph BFS", roadmapTopicId: "trees" },
  { signal: "Explore choices and undo state", pattern: "Backtracking", roadmapTopicId: "backtracking" },
  { signal: "Overlapping smaller states", pattern: "Dynamic Programming", roadmapTopicId: "one-d-dp" },
  { signal: "Dependencies or relationships", pattern: "Graphs", roadmapTopicId: "graphs" },
];

export const stuckPrompts = [
  "What is the expensive operation?",
  "Am I recomputing something I could store?",
  "Would sorting make the useful relationship visible?",
  "Is the answer a contiguous range?",
  "Can I model the states and transitions as a graph?",
  "Does this state depend on solutions to smaller states?",
  "Can I search a monotonic answer space instead of constructing the answer directly?",
] as const;

export const bugChecklist = [
  "Off-by-one boundaries",
  "Empty or smallest valid input",
  "Duplicate handling",
  "Pointer or index updates",
  "Loop termination",
  "Null / None handling",
  "Wrong return type",
  "Unexpected input mutation",
  "Integer overflow where relevant",
] as const;

export const complexityTraps = [
  "Nested loops are not automatically O(n²); count how often each pointer or edge advances.",
  "Slicing and collection copies may cost O(k), even when the syntax looks constant-time.",
  "O(n log n) sorting dominates an O(n) scan that follows it.",
  "Recursive depth contributes to auxiliary space.",
  "Heap insertion and removal are O(log n), while peeking is O(1).",
  "Hash lookup is O(1) on average, not an unconditional worst-case guarantee.",
  "Repeated immutable-string rebuilding can add otherwise hidden work.",
] as const;

export const timingStages = [
  { range: "0–5 min", label: "Understand + clarify", note: "Restate the contract and ask solution-changing questions." },
  { range: "5–12 min", label: "Develop + validate", note: "Baseline, bottleneck, optimized approach, confirmation." },
  { range: "12–30 min", label: "Implement", note: "Write the core algorithm in reviewable steps." },
  { range: "30–38 min", label: "Test + debug", note: "Trace one sample and one meaningful edge case." },
  { range: "38–45 min", label: "Analyze + follow up", note: "State complexity and adapt to changed constraints." },
] as const;

export const antiPatterns = [
  "Starting code before understanding the problem",
  "Going silent for a long time without context",
  "Narrating every keystroke",
  "Ignoring or resisting interviewer hints",
  "Optimizing before establishing correctness",
  "Using an algorithm you cannot explain",
  "Writing code you cannot manually test",
  "Saying “done” without tracing an example",
  "Claiming complexity without connecting it to the operations",
  "Deleting the entire solution after finding a local bug",
] as const;

