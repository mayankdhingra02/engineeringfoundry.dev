import type { DsaQuestion } from "@/types";
import questionsAdvanced from "./questions-advanced.json";
import questionsCorePatterns from "./questions-core-patterns.json";
import questionsFoundations from "./questions-foundations.json";
import questionsStructures from "./questions-structures.json";
import { roadmapProblemById } from "./roadmap-problem-registry";

export const FOUNDRY_75_VERSION = "2026.09";
export const FOUNDRY_75_REVIEWED_AT = "2026-09-05";

export type Foundry75Question = DsaQuestion & {
  catalogVersion: typeof FOUNDRY_75_VERSION;
  sourceClass: "external-reference" | "engineering-foundry-original";
  roleRelevance: readonly string[];
  whyItBelongs: string;
  recognitionPrompt: string;
  clarifyingQuestions: readonly string[];
  bruteForceCheckpoint: string;
  complexityTarget: string;
  testCasePrompts: readonly string[];
  followUpVariants: readonly string[];
  interviewBehaviorFocus: string;
};

const existingQuestions = [
  ...questionsFoundations,
  ...questionsCorePatterns,
  ...questionsStructures,
  ...questionsAdvanced,
] as DsaQuestion[];

// The original 43 records remain in the collection so a catalog revision never
// strands a route or invalidates persisted progress. These additions bring the
// finite core to 75 while filling specific pattern and prerequisite gaps.
export const foundry75AdditionIds = [
  "isomorphic-strings",
  "move-zeroes",
  "remove-duplicates-from-sorted-array",
  "maximum-average-subarray-i",
  "permutation-in-string",
  "longest-repeating-character-replacement",
  "running-sum-of-1d-array",
  "range-sum-query-immutable",
  "sort-colors",
  "minimum-number-of-arrows-to-burst-balloons",
  "insert-interval",
  "search-insert-position",
  "first-bad-version",
  "search-a-2d-matrix",
  "find-minimum-in-rotated-sorted-array",
  "daily-temperatures",
  "min-stack",
  "middle-of-the-linked-list",
  "remove-nth-node-from-end-of-list",
  "kth-largest-element-in-a-stream",
  "k-closest-points-to-origin",
  "invert-binary-tree",
  "path-sum",
  "diameter-of-binary-tree",
  "flood-fill",
  "max-area-of-island",
  "rotting-oranges",
  "permutations",
  "jump-game",
  "climbing-stairs",
  "unique-paths",
  "network-delay-time",
] as const;

type PatternPracticeProfile = {
  recognitionPrompt: string;
  bruteForceCheckpoint: string;
  complexityTarget: string;
  interviewBehaviorFocus: string;
  testCasePrompts: readonly string[];
  followUpVariants: readonly string[];
};

const patternProfiles: Record<string, PatternPracticeProfile> = {
  "frequency-map": {
    recognitionPrompt: "Which repeated lookup, count, or grouping operation could become stored state?",
    bruteForceCheckpoint: "Describe the repeated scan first. Name exactly what a map or set would remember to remove it.",
    complexityTarget: "Aim for one linear pass and O(n) auxiliary state; state the average-case hashing assumption.",
    interviewBehaviorFocus: "Explain the key and update order before coding.",
    testCasePrompts: ["A duplicate at the first useful position", "Repeated values that update the same key", "Empty or single-element input"],
    followUpVariants: ["Can the input domain support counting storage instead of hashing?", "What changes if results must preserve order?"],
  },
  "two-pointers": {
    recognitionPrompt: "What invariant lets one boundary move without losing a possible answer?",
    bruteForceCheckpoint: "State the pairwise or copy-based baseline, then identify the candidates each pointer move discards.",
    complexityTarget: "Target O(n) after any required sorting; say whether sorting changes space or mutates the input.",
    interviewBehaviorFocus: "Narrate the invariant, not every pointer increment.",
    testCasePrompts: ["Pointers begin next to each other", "Many duplicate values", "The answer uses an outer boundary"],
    followUpVariants: ["What if the input is not sorted?", "Can the transformation remain stable and in place?"],
  },
  "sliding-window": {
    recognitionPrompt: "Is the answer a contiguous range whose validity can be updated when either boundary moves?",
    bruteForceCheckpoint: "Start from enumerating ranges and recomputing their state; identify the reusable add/remove work.",
    complexityTarget: "Target O(n) when each element enters and leaves the window at most once.",
    interviewBehaviorFocus: "Define the window and its validity condition before the loop.",
    testCasePrompts: ["The whole input is valid", "The window must shrink repeatedly", "No non-empty window satisfies the condition"],
    followUpVariants: ["Why does the shrinking rule remain valid?", "What changes when values can be negative?"],
  },
  "prefix-sum": {
    recognitionPrompt: "Would cumulative state turn repeated range work into one subtraction or lookup?",
    bruteForceCheckpoint: "Describe recomputing each requested range, then name the prefix state that makes it reusable.",
    complexityTarget: "Target O(n) preprocessing and O(1) range queries, or O(n) for a single-pass balance check.",
    interviewBehaviorFocus: "State what prefix index zero represents before using the formula.",
    testCasePrompts: ["A range beginning at index zero", "A one-element range", "Negative and zero values"],
    followUpVariants: ["How would point updates change the data structure?", "Can a running prefix remove the need for an array?"],
  },
  "binary-search": {
    recognitionPrompt: "What ordered domain or monotonic predicate allows half the candidates to be discarded?",
    bruteForceCheckpoint: "State the linear scan, then prove the predicate is monotonic before searching it.",
    complexityTarget: "Target O(log n) decisions with a single, explicit interval convention.",
    interviewBehaviorFocus: "Say whether the interval is closed or half-open and preserve it in every update.",
    testCasePrompts: ["Target at each boundary", "Target absent between two values", "One-element and empty domains"],
    followUpVariants: ["Return the first valid boundary instead of an exact match.", "Search the answer space rather than the input array."],
  },
  stack: {
    recognitionPrompt: "Which unresolved prior item must be revisited in last-in-first-out order?",
    bruteForceCheckpoint: "Describe rescanning unresolved history, then show what the stack keeps available at its top.",
    complexityTarget: "Target O(n) total work when every item is pushed and popped a bounded number of times.",
    interviewBehaviorFocus: "State what one stack entry means and when it becomes resolved.",
    testCasePrompts: ["The first token is invalid", "Deeply nested valid input", "Repeated equal candidates"],
    followUpVariants: ["Do you need indices rather than values?", "Can the same invariant support a monotonic stack?"],
  },
  "fast-slow-pointers": {
    recognitionPrompt: "Does pointer identity, relative speed, or a fixed gap reveal the required position?",
    bruteForceCheckpoint: "Start with stored nodes or two passes, then explain what the pointer spacing encodes.",
    complexityTarget: "Target O(n) time and O(1) auxiliary space with safe dereference checks.",
    interviewBehaviorFocus: "Draw the pointer relationship and state the termination condition first.",
    testCasePrompts: ["A one-node structure", "Even and odd lengths", "A cycle beginning at the head"],
    followUpVariants: ["What changes if mutation is allowed?", "How would you prove the pointers meet?"],
  },
  bfs: {
    recognitionPrompt: "Do levels or minimum unweighted steps determine when an answer is final?",
    bruteForceCheckpoint: "Contrast unrestricted path exploration with processing one frontier at a time.",
    complexityTarget: "Target O(V + E), including the queue and visited-state cost.",
    interviewBehaviorFocus: "Mark visited when enqueuing and explain what one frontier represents.",
    testCasePrompts: ["Several starting points", "A disconnected target", "A graph containing a cycle"],
    followUpVariants: ["How would weighted edges change the algorithm?", "Can traversal mutate the input instead of storing visited state?"],
  },
  dfs: {
    recognitionPrompt: "Can one branch or subtree return exactly the evidence its parent needs?",
    bruteForceCheckpoint: "Describe the full state-space search, then identify pruning, visited state, or a subtree contract.",
    complexityTarget: "Target O(V + E) for traversal and include recursion depth or explicit-stack space.",
    interviewBehaviorFocus: "Define the recursive return value and base case before implementation.",
    testCasePrompts: ["An empty root or grid", "A skewed/deep structure", "A disconnected component"],
    followUpVariants: ["Rewrite iteratively to avoid recursion depth.", "What state must be restored if the path is mutable?"],
  },
  "topological-sort": {
    recognitionPrompt: "Are directed prerequisites asking for an order or proof that no valid order exists?",
    bruteForceCheckpoint: "Explain why arbitrary ordering fails, then track either indegrees or DFS states.",
    complexityTarget: "Target O(V + E) and verify that every vertex appears in the resulting order.",
    interviewBehaviorFocus: "Confirm edge direction and describe how a cycle becomes observable.",
    testCasePrompts: ["No prerequisites", "Two independent valid orders", "A directed cycle"],
    followUpVariants: ["Return one valid ordering.", "How would newly added dependencies affect the result?"],
  },
  "union-find": {
    recognitionPrompt: "Are components repeatedly merged while connectivity queries continue?",
    bruteForceCheckpoint: "Start from repeated graph traversals, then identify the representative each set can retain.",
    complexityTarget: "Target near-constant amortized operations with path compression and rank or size.",
    interviewBehaviorFocus: "Explain the parent and rank invariants before optimizing find.",
    testCasePrompts: ["An edge within one component", "A chain of unions", "Disconnected singleton nodes"],
    followUpVariants: ["Why are deletions difficult?", "Can the structure report component sizes?"],
  },
  backtracking: {
    recognitionPrompt: "Does the task enumerate valid choices while partial states can be rejected early?",
    bruteForceCheckpoint: "Describe generating every candidate, then name the constraints that can prune a partial path.",
    complexityTarget: "Express cost using branching factor, depth, and output size rather than claiming a universal bound.",
    interviewBehaviorFocus: "Say choose, explore, undo while showing which state must be restored.",
    testCasePrompts: ["No valid result", "Duplicate input choices", "A result produced at the shallowest depth"],
    followUpVariants: ["How can ordering improve pruning?", "What changes when duplicate outputs are forbidden?"],
  },
  "heap-selection": {
    recognitionPrompt: "Do you need the next priority or only the best k candidates as data evolves?",
    bruteForceCheckpoint: "Compare sorting everything with retaining only the boundary candidates.",
    complexityTarget: "Target O(n log k) for bounded top-k work or O((V + E) log V) for heap-driven shortest paths.",
    interviewBehaviorFocus: "State which element sits at the heap root and why that direction is useful.",
    testCasePrompts: ["k equals one", "k equals the input size", "Equal priorities requiring a stable tie-breaker"],
    followUpVariants: ["What changes for a stream?", "Could buckets or selection avoid a heap?"],
  },
  trie: {
    recognitionPrompt: "Are prefix queries frequent enough to justify storing shared character paths?",
    bruteForceCheckpoint: "Start with scanning every word, then identify the reusable prefix state.",
    complexityTarget: "Express operations in word length and discuss alphabet-dependent memory.",
    interviewBehaviorFocus: "Distinguish prefix existence from a complete stored word.",
    testCasePrompts: ["One word is another word's prefix", "The empty prefix", "A missing branch after a shared prefix"],
    followUpVariants: ["How would deletion work?", "What representation reduces sparse-node memory?"],
  },
  "1d-dp": {
    recognitionPrompt: "Can each position be described from a small set of earlier solved states?",
    bruteForceCheckpoint: "Draw the repeated recursive choices, then define the smallest state that makes subproblems identical.",
    complexityTarget: "Target O(number of states × transitions) and justify any memory compression.",
    interviewBehaviorFocus: "Define the state in one sentence before writing a recurrence.",
    testCasePrompts: ["The smallest base case", "An unreachable or impossible state", "A choice that is locally attractive but globally worse"],
    followUpVariants: ["Can the table be compressed?", "How would you reconstruct the chosen solution?"],
  },
  "2d-dp": {
    recognitionPrompt: "Do two independent coordinates or prefixes determine the remaining subproblem?",
    bruteForceCheckpoint: "Write the repeated two-dimensional recursion before choosing the table order.",
    complexityTarget: "Target O(rows × columns × transition cost), then evaluate whether one dimension can be compressed.",
    interviewBehaviorFocus: "Explain the meaning and dependencies of one cell before filling the table.",
    testCasePrompts: ["One row or column", "A blocked or impossible boundary", "Dependencies that require a specific iteration order"],
    followUpVariants: ["Can one row replace the full matrix?", "What changes if a path must be reconstructed?"],
  },
  "merge-intervals": {
    recognitionPrompt: "Will sorting ranges expose overlap, coverage, or a safe scheduling choice?",
    bruteForceCheckpoint: "Describe checking every pair, then show why sorted endpoints make one scan sufficient.",
    complexityTarget: "Target O(n log n) for sorting followed by O(n) scanning.",
    interviewBehaviorFocus: "Define the endpoint convention and the current merged invariant.",
    testCasePrompts: ["Nested intervals", "Touching endpoints", "One interval disjoint from every other"],
    followUpVariants: ["Insert one interval into an already sorted list.", "Select the maximum non-overlapping subset."],
  },
  "monotonic-stack": {
    recognitionPrompt: "Do unresolved candidates wait for the next greater or smaller boundary?",
    bruteForceCheckpoint: "Start with scanning forward from every position, then explain which candidates remain unresolved.",
    complexityTarget: "Target O(n) total work because each index enters and leaves the stack once.",
    interviewBehaviorFocus: "Name the stack order and the exact pop condition.",
    testCasePrompts: ["Strictly increasing input", "Strictly decreasing input", "Equal values at adjacent positions"],
    followUpVariants: ["Do equal values pop or remain?", "Can the same idea maintain a window extremum?"],
  },
  greedy: {
    recognitionPrompt: "Which local choice can be proved safe by an invariant or exchange argument?",
    bruteForceCheckpoint: "State the exhaustive choices first, then explain why one local decision never needs reversal.",
    complexityTarget: "Target one pass after any required sort; include the sorting cost.",
    interviewBehaviorFocus: "Give the correctness argument before relying on the local choice.",
    testCasePrompts: ["The locally largest choice is wrong", "Several equal choices", "The answer changes at the final element"],
    followUpVariants: ["What input change breaks the greedy proof?", "Compare with a dynamic-programming formulation."],
  },
  "bit-manipulation": {
    recognitionPrompt: "Does parity, cancellation, or compact subset state match a bitwise identity?",
    bruteForceCheckpoint: "Give the collection- or arithmetic-based baseline before applying a bit identity.",
    complexityTarget: "State the integer-width assumption; target O(n) time and O(1) state when cancellation applies.",
    interviewBehaviorFocus: "Explain the identity in ordinary language instead of presenting a trick.",
    testCasePrompts: ["Zero", "Negative values under the language's integer model", "The repeated value at a boundary"],
    followUpVariants: ["What changes when values repeat three times?", "How do signed shifts behave in the chosen language?"],
  },
};

const topicByRoadmapTag: Record<string, string[]> = {
  "arrays-strings": ["arrays", "strings"],
  "hash-maps-sets": ["hash-maps"],
  "two-pointers": ["arrays"],
  "sliding-window": ["arrays", "strings"],
  "prefix-sums": ["arrays"],
  "sorting-intervals": ["sorting", "intervals"],
  "binary-search": ["binary-search"],
  stack: ["stacks-queues"],
  "queue-deque": ["stacks-queues"],
  "linked-lists": ["linked-lists"],
  "heaps-priority-queues": ["heaps"],
  "trees-bst": ["trees"],
  "tree-dfs": ["trees"],
  "tree-bfs": ["trees"],
  "graph-fundamentals": ["graphs"],
  "graph-bfs-dfs": ["graphs", "matrix-grid-traversal"],
  backtracking: ["backtracking"],
  greedy: ["greedy"],
  "basic-dynamic-programming": ["dynamic-programming"],
  "topological-sort": ["graphs", "topological-ordering"],
  "optional-shortest-path": ["graphs", "shortest-paths"],
};

function canonicalPattern(pattern: string): string[] {
  const value = pattern.toLowerCase();
  if (value.includes("topological")) return ["topological-sort"];
  if (value.includes("monotonic")) return ["monotonic-stack"];
  if (value.includes("sliding window") || value.includes("window")) return ["sliding-window"];
  if (value.includes("prefix")) return ["prefix-sum"];
  if (value.includes("binary search")) return ["binary-search"];
  if (value.includes("fast/slow") || value.includes("pointer gap")) return ["fast-slow-pointers"];
  if (value.includes("pointer") || value.includes("partition")) return ["two-pointers"];
  if (value.includes("heap") || value.includes("dijkstra")) return ["heap-selection"];
  if (value.includes("bfs")) return ["bfs"];
  if (value.includes("dfs") || value.includes("tree traversal") || value.includes("postorder")) return ["dfs"];
  if (value.includes("backtracking")) return ["backtracking"];
  if (value.includes("greedy")) return ["greedy"];
  if (value.includes("interval")) return ["merge-intervals"];
  if (value.includes("stack")) return ["stack"];
  if (value.includes("2-d") || value.includes("grid dynamic")) return ["2d-dp"];
  if (value.includes("dynamic programming")) return ["1d-dp"];
  return ["frequency-map"];
}

function normalizeExisting(question: DsaQuestion): Foundry75Question {
  const patterns = question.patterns.length
    ? question.patterns
    : canonicalPattern(roadmapProblemById.get(question.slug)?.pattern ?? "pointer traversal");
  const primaryPattern = patterns[0];
  const profile = patternProfiles[primaryPattern];
  if (!profile) throw new Error(`${question.slug} has no Foundry 75 practice profile for ${primaryPattern}.`);
  return {
    ...question,
    patterns,
    catalogVersion: FOUNDRY_75_VERSION,
    sourceClass: question.isOriginal ? "engineering-foundry-original" : "external-reference",
    roleRelevance: question.difficulty === "Hard" ? ["SDE II", "Senior / SDE III"] : ["New Grad", "SDE I", "SDE II"],
    whyItBelongs: question.note,
    recognitionPrompt: profile.recognitionPrompt,
    clarifyingQuestions: [
      "Which input bounds or ordering guarantees change the viable approach?",
      "May the input be modified, and what output shape is required?",
      "How should empty, duplicate, or otherwise ambiguous input be handled?",
    ],
    bruteForceCheckpoint: profile.bruteForceCheckpoint,
    complexityTarget: profile.complexityTarget,
    testCasePrompts: profile.testCasePrompts,
    followUpVariants: profile.followUpVariants,
    interviewBehaviorFocus: profile.interviewBehaviorFocus,
  };
}

function roadmapStage(patterns: readonly string[]) {
  if (patterns.some((pattern) => ["frequency-map", "two-pointers", "sliding-window", "prefix-sum"].includes(pattern))) return "core-patterns";
  if (patterns.some((pattern) => ["binary-search", "stack", "fast-slow-pointers"].includes(pattern))) return "structures";
  return "advanced";
}

function normalizeAddition(id: (typeof foundry75AdditionIds)[number]): Foundry75Question {
  const problem = roadmapProblemById.get(id);
  if (!problem?.url || !problem.difficulty || !problem.whyItMatters) throw new Error(`Foundry 75 addition ${id} lacks required public metadata.`);
  const patterns = canonicalPattern(problem.pattern);
  const profile = patternProfiles[patterns[0]];
  const topics = [...new Set((problem.topicTags ?? []).flatMap((tag) => topicByRoadmapTag[tag] ?? []))];
  if (!topics.length) throw new Error(`Foundry 75 addition ${id} lacks a canonical topic mapping.`);
  return {
    id: `lc-${id}`,
    slug: id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics,
    patterns,
    companyAssociations: [],
    roadmapStage: roadmapStage(patterns),
    priority: problem.classification === "core" ? 1 : problem.classification === "practice" ? 2 : 3,
    isFree: true,
    isOriginal: false,
    status: "active",
    verification: "unverified",
    lastVerifiedAt: null,
    externalUrl: problem.url,
    source: {
      name: "LeetCode",
      platform: "leetcode",
      url: problem.url,
      verification: "unverified",
      lastVerifiedAt: null,
      notes: "Public problem metadata link; Engineering Foundry does not reproduce the statement or editorial.",
    },
    note: problem.whyItMatters,
    catalogVersion: FOUNDRY_75_VERSION,
    sourceClass: "external-reference",
    roleRelevance: problem.classification === "stretch" ? ["SDE I", "SDE II"] : ["New Grad", "SDE I", "SDE II"],
    whyItBelongs: problem.whyItMatters,
    recognitionPrompt: profile.recognitionPrompt,
    clarifyingQuestions: [
      "Which input bounds or ordering guarantees change the viable approach?",
      "May the input be modified, and what output shape is required?",
      "How should empty, duplicate, or otherwise ambiguous input be handled?",
    ],
    bruteForceCheckpoint: profile.bruteForceCheckpoint,
    complexityTarget: profile.complexityTarget,
    testCasePrompts: profile.testCasePrompts,
    followUpVariants: problem.followUps?.length ? problem.followUps : profile.followUpVariants,
    interviewBehaviorFocus: profile.interviewBehaviorFocus,
  };
}

export const foundry75Questions: readonly Foundry75Question[] = [
  ...existingQuestions.map(normalizeExisting),
  ...foundry75AdditionIds.map(normalizeAddition),
];

export const foundry75QuestionById = new Map(foundry75Questions.map((question) => [question.slug, question]));

export function getFoundry75Question(id: string) {
  return foundry75QuestionById.get(id) ?? null;
}

function assertFoundry75() {
  if (foundry75Questions.length !== 75) throw new Error(`Foundry 75 must contain exactly 75 questions; found ${foundry75Questions.length}.`);
  if (foundry75QuestionById.size !== foundry75Questions.length) throw new Error("Foundry 75 contains duplicate canonical slugs.");
  const coveredPatterns = new Set(foundry75Questions.flatMap((question) => question.patterns));
  for (const pattern of Object.keys(patternProfiles)) if (!coveredPatterns.has(pattern)) throw new Error(`Foundry 75 does not cover ${pattern}.`);
  for (const question of foundry75Questions) {
    if (!question.isOriginal && !question.externalUrl) throw new Error(`${question.slug} lacks a recoverable external destination.`);
    if (question.isOriginal && !question.originalPrompt) throw new Error(`${question.slug} lacks an original prompt.`);
  }
}

assertFoundry75();
