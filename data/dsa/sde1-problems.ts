import type { ProblemClassification, RoadmapProblem } from "./level-roadmaps.ts";

type ProblemSeed = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  classification: ProblemClassification;
  pattern: string;
  why: string;
  skills: string[];
  tags: string[];
  followUps?: string[];
  hints?: [string, string, string];
};

function leetcode(seed: ProblemSeed): RoadmapProblem {
  return {
    id: seed.id,
    title: seed.title,
    slug: seed.id,
    url: `https://leetcode.com/problems/${seed.id}/`,
    difficulty: seed.difficulty,
    classification: seed.classification,
    pattern: seed.pattern,
    whyItMatters: seed.why,
    skills: seed.skills,
    topicTags: seed.tags,
    followUps: seed.followUps,
    hints: seed.hints,
    source: "leetcode",
  };
}

export const sde1Problems: readonly RoadmapProblem[] = [
  leetcode({ id: "two-sum", title: "Two Sum", difficulty: "Easy", classification: "core", pattern: "Hash map lookup", why: "Turns a quadratic pair search into one deliberate lookup pass.", skills: ["complement lookup", "duplicate handling", "O(n) analysis"], tags: ["arrays-strings", "hash-maps-sets"], followUps: ["What changes if the input is sorted?", "What would you precompute for many repeated queries?"], hints: ["For each value, what partner would complete the target?", "Store information that lets you test for that partner in O(1) average time.", "Scan once: check for the complement before recording the current index."] }),
  leetcode({ id: "contains-duplicate", title: "Contains Duplicate", difficulty: "Easy", classification: "core", pattern: "Set membership", why: "Builds the fastest recognition reflex for repeated membership checks.", skills: ["set use", "early return", "time-space trade-off"], tags: ["arrays-strings", "hash-maps-sets"] }),
  leetcode({ id: "valid-anagram", title: "Valid Anagram", difficulty: "Easy", classification: "core", pattern: "Frequency counting", why: "Teaches counts as a compact representation of unordered character data.", skills: ["frequency maps", "character counts", "input assumptions"], tags: ["arrays-strings", "hash-maps-sets"] }),
  leetcode({ id: "isomorphic-strings", title: "Isomorphic Strings", difficulty: "Easy", classification: "practice", pattern: "Bidirectional mapping", why: "Tests whether one-way mapping logic misses collisions.", skills: ["two-way maps", "consistency", "edge cases"], tags: ["arrays-strings", "hash-maps-sets"] }),
  leetcode({ id: "majority-element", title: "Majority Element", difficulty: "Easy", classification: "practice", pattern: "Counting / candidate tracking", why: "Creates a useful discussion about counting, sorting, and constant-space follow-ups.", skills: ["frequency counting", "trade-offs", "Boyer-Moore follow-up"], tags: ["arrays-strings", "hash-maps-sets"] }),
  leetcode({ id: "find-pivot-index", title: "Find Pivot Index", difficulty: "Easy", classification: "core", pattern: "Left/right aggregates", why: "Connects total-sum reasoning to prefix-style scans without extra arrays.", skills: ["running totals", "left/right invariant", "boundary handling"], tags: ["arrays-strings", "prefix-sums"] }),
  leetcode({ id: "group-anagrams", title: "Group Anagrams", difficulty: "Medium", classification: "core", pattern: "Canonical hash keys", why: "Teaches how to design a stable key for equivalence classes.", skills: ["key design", "frequency signatures", "grouping"], tags: ["arrays-strings", "hash-maps-sets"] }),
  leetcode({ id: "product-of-array-except-self", title: "Product of Array Except Self", difficulty: "Medium", classification: "stretch", pattern: "Prefix/suffix aggregation", why: "Builds two-direction aggregate reasoning without division.", skills: ["prefix products", "suffix products", "space optimization"], tags: ["arrays-strings", "prefix-sums"] }),
  leetcode({ id: "longest-consecutive-sequence", title: "Longest Consecutive Sequence", difficulty: "Medium", classification: "stretch", pattern: "Set-based sequence starts", why: "Tests whether a set solution can still be proved linear rather than accidentally quadratic.", skills: ["set membership", "sequence starts", "amortized analysis"], tags: ["arrays-strings", "hash-maps-sets"] }),

  leetcode({ id: "valid-palindrome", title: "Valid Palindrome", difficulty: "Easy", classification: "core", pattern: "Opposite-end pointers", why: "Introduces pointer movement with a simple, explainable invariant.", skills: ["two pointers", "normalization", "loop invariants"], tags: ["two-pointers"] }),
  leetcode({ id: "move-zeroes", title: "Move Zeroes", difficulty: "Easy", classification: "core", pattern: "In-place compaction", why: "Teaches read/write pointers and safe mutation.", skills: ["same-direction pointers", "in-place mutation", "stable compaction"], tags: ["two-pointers"] }),
  leetcode({ id: "remove-duplicates-from-sorted-array", title: "Remove Duplicates from Sorted Array", difficulty: "Easy", classification: "core", pattern: "Read/write pointers", why: "Makes the write-boundary invariant concrete.", skills: ["sorted order", "in-place writes", "boundary reasoning"], tags: ["two-pointers"] }),
  leetcode({ id: "two-sum-ii-input-array-is-sorted", title: "Two Sum II — Input Array Is Sorted", difficulty: "Medium", classification: "core", pattern: "Opposite-end pointers", why: "Requires explaining why each pointer move safely discards candidates.", skills: ["sorted order", "pointer proof", "constant space"], tags: ["two-pointers"], followUps: ["Why can moving the larger side never recover a sum that is already too large?"] }),
  leetcode({ id: "3sum", title: "3Sum", difficulty: "Medium", classification: "practice", pattern: "Sort + two pointers", why: "Tests pattern composition and careful duplicate handling.", skills: ["sorting", "two pointers", "deduplication"], tags: ["two-pointers", "sorting-intervals"] }),
  leetcode({ id: "container-with-most-water", title: "Container With Most Water", difficulty: "Medium", classification: "practice", pattern: "Greedy two pointers", why: "Strengthens the proof behind discarding one boundary.", skills: ["two pointers", "greedy elimination", "area analysis"], tags: ["two-pointers", "greedy"] }),

  leetcode({ id: "maximum-average-subarray-i", title: "Maximum Average Subarray I", difficulty: "Easy", classification: "core", pattern: "Fixed sliding window", why: "Separates fixed-window bookkeeping from variable-window logic.", skills: ["fixed windows", "rolling sums", "off-by-one control"], tags: ["sliding-window"] }),
  leetcode({ id: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", classification: "core", pattern: "Running boundary / greedy scan", why: "Teaches maintaining the best prior candidate during one pass.", skills: ["running minimum", "single pass", "greedy invariant"], tags: ["sliding-window", "greedy"] }),
  leetcode({ id: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", classification: "core", pattern: "Variable sliding window", why: "The canonical exercise for expanding, detecting invalidity, and shrinking.", skills: ["variable windows", "frequency state", "left-bound movement"], tags: ["sliding-window"] }),
  leetcode({ id: "permutation-in-string", title: "Permutation in String", difficulty: "Medium", classification: "practice", pattern: "Fixed window frequencies", why: "Tests whether counts can be updated without rebuilding each window.", skills: ["frequency arrays", "fixed windows", "incremental comparison"], tags: ["sliding-window"] }),
  leetcode({ id: "longest-repeating-character-replacement", title: "Longest Repeating Character Replacement", difficulty: "Medium", classification: "practice", pattern: "Variable sliding window", why: "Builds a subtler validity condition and follow-up reasoning.", skills: ["window validity", "frequency maximum", "shrink conditions"], tags: ["sliding-window"] }),
  leetcode({ id: "minimum-size-subarray-sum", title: "Minimum Size Subarray Sum", difficulty: "Medium", classification: "practice", pattern: "Shrinking sliding window", why: "Shows when positive values make monotonic shrinking valid.", skills: ["minimum windows", "positive-number invariant", "two boundaries"], tags: ["sliding-window"], followUps: ["Why does this window logic break when arbitrary negative values are allowed?"] }),

  leetcode({ id: "running-sum-of-1d-array", title: "Running Sum of 1d Array", difficulty: "Easy", classification: "core", pattern: "Prefix sum", why: "Introduces cumulative state with minimal implementation noise.", skills: ["cumulative sums", "in-place option", "linear scans"], tags: ["prefix-sums"] }),
  leetcode({ id: "range-sum-query-immutable", title: "Range Sum Query — Immutable", difficulty: "Easy", classification: "practice", pattern: "Prefix sum queries", why: "Makes the preprocessing-versus-query trade-off explicit.", skills: ["range queries", "preprocessing", "index boundaries"], tags: ["prefix-sums"] }),

  leetcode({ id: "sort-colors", title: "Sort Colors", difficulty: "Medium", classification: "practice", pattern: "Partitioning", why: "Tests in-place partition reasoning beyond calling a sort function.", skills: ["three-way partition", "in-place mutation", "invariants"], tags: ["sorting-intervals", "two-pointers"] }),
  leetcode({ id: "merge-intervals", title: "Merge Intervals", difficulty: "Medium", classification: "core", pattern: "Sort + scan", why: "Shows how sorting can turn pairwise overlap checks into one pass.", skills: ["sorting", "overlap invariant", "output construction"], tags: ["sorting-intervals"] }),
  leetcode({ id: "insert-interval", title: "Insert Interval", difficulty: "Medium", classification: "core", pattern: "Interval scan", why: "Tests clean phase-based decomposition without resorting everything.", skills: ["interval cases", "merging", "linear scans"], tags: ["sorting-intervals"] }),
  leetcode({ id: "non-overlapping-intervals", title: "Non-overlapping Intervals", difficulty: "Medium", classification: "stretch", pattern: "Greedy intervals", why: "Connects interval sorting to a provably safe local choice.", skills: ["greedy proof", "end-time ordering", "interval removal"], tags: ["sorting-intervals", "greedy"] }),
  leetcode({ id: "minimum-number-of-arrows-to-burst-balloons", title: "Minimum Number of Arrows to Burst Balloons", difficulty: "Medium", classification: "practice", pattern: "Accessible interval scheduling", why: "Provides a public interval-scheduling variation without requiring a premium Meeting Rooms problem.", skills: ["interval sorting", "overlap groups", "greedy boundaries"], tags: ["sorting-intervals", "greedy"] }),

  leetcode({ id: "binary-search", title: "Binary Search", difficulty: "Easy", classification: "core", pattern: "Exact binary search", why: "Builds boundary definitions and loop invariants before variants.", skills: ["search boundaries", "midpoint", "O(log n) reasoning"], tags: ["binary-search"], followUps: ["Find the first occurrence instead.", "Find the first value satisfying a monotonic condition."], hints: ["State what portion of the array can still contain the target.", "Each comparison should eliminate one closed half of that candidate range.", "Use inclusive boundaries and update them so the candidate interval strictly shrinks."] }),
  leetcode({ id: "search-insert-position", title: "Search Insert Position", difficulty: "Easy", classification: "core", pattern: "Boundary binary search", why: "Moves from exact lookup to the first valid insertion boundary.", skills: ["lower bound", "boundary meaning", "empty result position"], tags: ["binary-search"] }),
  leetcode({ id: "first-bad-version", title: "First Bad Version", difficulty: "Easy", classification: "core", pattern: "First-true binary search", why: "Makes a monotonic predicate and boundary contract explicit.", skills: ["monotonic predicates", "first true", "API-call analysis"], tags: ["binary-search"] }),
  leetcode({ id: "search-a-2d-matrix", title: "Search a 2D Matrix", difficulty: "Medium", classification: "practice", pattern: "Virtual-array binary search", why: "Tests mapping a conceptual sorted sequence onto two dimensions.", skills: ["index mapping", "binary search", "matrix boundaries"], tags: ["binary-search"] }),
  leetcode({ id: "find-minimum-in-rotated-sorted-array", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", classification: "practice", pattern: "Rotated binary search", why: "Teaches how one sorted half constrains the answer boundary.", skills: ["rotated order", "invariants", "boundary elimination"], tags: ["binary-search"] }),
  leetcode({ id: "search-in-rotated-sorted-array", title: "Search in Rotated Sorted Array", difficulty: "Medium", classification: "stretch", pattern: "Rotated binary search", why: "Combines exact lookup with identifying the usable sorted half.", skills: ["sorted-half detection", "binary search", "branch correctness"], tags: ["binary-search"] }),

  leetcode({ id: "valid-parentheses", title: "Valid Parentheses", difficulty: "Easy", classification: "core", pattern: "Stack matching", why: "Introduces LIFO state through nested structure validation.", skills: ["stack use", "matching pairs", "early invalidation"], tags: ["stack"] }),
  leetcode({ id: "min-stack", title: "Min Stack", difficulty: "Medium", classification: "core", pattern: "Augmented stack", why: "Teaches maintaining a queryable invariant alongside ordinary stack operations.", skills: ["state design", "O(1) queries", "duplicate minima"], tags: ["stack"] }),
  leetcode({ id: "daily-temperatures", title: "Daily Temperatures", difficulty: "Medium", classification: "practice", pattern: "Monotonic stack", why: "Introduces unresolved candidates without making monotonic structures a prerequisite.", skills: ["monotonic stack", "index storage", "amortized analysis"], tags: ["stack"] }),
  leetcode({ id: "implement-queue-using-stacks", title: "Implement Queue using Stacks", difficulty: "Easy", classification: "practice", pattern: "Amortized queue design", why: "Connects abstract queue behavior to a two-stack implementation.", skills: ["FIFO semantics", "two-stack transfer", "amortized complexity"], tags: ["queue-deque"] }),

  leetcode({ id: "reverse-linked-list", title: "Reverse Linked List", difficulty: "Easy", classification: "core", pattern: "Pointer reversal", why: "The cleanest test of preserving references before mutation.", skills: ["pointer updates", "iteration", "reference safety"], tags: ["linked-lists"], followUps: ["Can you solve it recursively?", "What auxiliary stack cost does recursion introduce?"], hints: ["Before changing a link, identify which reference would otherwise be lost.", "Track the processed prefix and the unprocessed remainder separately.", "Save next, reverse the current link, then advance both pointers."] }),
  leetcode({ id: "linked-list-cycle", title: "Linked List Cycle", difficulty: "Easy", classification: "core", pattern: "Fast/slow pointers", why: "Builds pointer reasoning without extra memory.", skills: ["cycle detection", "fast/slow pointers", "termination"], tags: ["linked-lists"] }),
  leetcode({ id: "middle-of-the-linked-list", title: "Middle of the Linked List", difficulty: "Easy", classification: "core", pattern: "Fast/slow pointers", why: "Makes relative pointer speed intuitive before harder list problems.", skills: ["fast/slow pointers", "even-length behavior", "single pass"], tags: ["linked-lists"] }),
  leetcode({ id: "merge-two-sorted-lists", title: "Merge Two Sorted Lists", difficulty: "Easy", classification: "core", pattern: "Dummy-head list construction", why: "Teaches safe output construction and tail management.", skills: ["dummy nodes", "sorted merge", "pointer advancement"], tags: ["linked-lists"] }),
  leetcode({ id: "remove-nth-node-from-end-of-list", title: "Remove Nth Node From End of List", difficulty: "Medium", classification: "core", pattern: "Pointer gap", why: "Combines dummy nodes with a fixed pointer distance.", skills: ["dummy nodes", "pointer gaps", "head removal"], tags: ["linked-lists"] }),
  leetcode({ id: "reorder-list", title: "Reorder List", difficulty: "Medium", classification: "stretch", pattern: "List pattern composition", why: "Combines midpoint, reversal, and merge operations in one pointer-heavy task.", skills: ["fast/slow pointers", "reversal", "alternating merge"], tags: ["linked-lists"] }),

  leetcode({ id: "kth-largest-element-in-a-stream", title: "Kth Largest Element in a Stream", difficulty: "Easy", classification: "core", pattern: "Bounded min heap", why: "Shows why retaining only K candidates beats sorting every update.", skills: ["min heaps", "stream updates", "size-K invariant"], tags: ["heaps-priority-queues"] }),
  leetcode({ id: "kth-largest-element-in-an-array", title: "Kth Largest Element in an Array", difficulty: "Medium", classification: "core", pattern: "Top-K heap", why: "Creates a direct sorting-versus-heap trade-off discussion.", skills: ["heap sizing", "Top K", "complexity comparison"], tags: ["heaps-priority-queues"], followUps: ["Heap versus sorting: when is each preferable?", "What changes if values arrive as a stream?", "How might Quickselect change average complexity?"] }),
  leetcode({ id: "top-k-frequent-elements", title: "Top K Frequent Elements", difficulty: "Medium", classification: "core", pattern: "Frequency map + Top K", why: "Composes counting with candidate selection and supports multiple valid strategies.", skills: ["frequency maps", "heaps", "bucket alternative"], tags: ["heaps-priority-queues", "hash-maps-sets"], followUps: ["When would you choose a heap over frequency buckets?", "How does the complexity change when K is close to n?"] }),
  leetcode({ id: "k-closest-points-to-origin", title: "K Closest Points to Origin", difficulty: "Medium", classification: "practice", pattern: "Bounded max heap", why: "Tests whether heap direction matches the candidates being discarded.", skills: ["max heaps", "distance comparison", "Top K"], tags: ["heaps-priority-queues"] }),

  leetcode({ id: "maximum-depth-of-binary-tree", title: "Maximum Depth of Binary Tree", difficulty: "Easy", classification: "core", pattern: "Tree DFS", why: "Introduces returning information from a subtree.", skills: ["recursive DFS", "base cases", "subtree return values"], tags: ["trees-bst", "tree-dfs"] }),
  leetcode({ id: "invert-binary-tree", title: "Invert Binary Tree", difficulty: "Easy", classification: "core", pattern: "Tree traversal", why: "Practices a simple mutation at every node with clear recursion boundaries.", skills: ["tree traversal", "mutation", "recursive structure"], tags: ["trees-bst", "tree-dfs"] }),
  leetcode({ id: "path-sum", title: "Path Sum", difficulty: "Easy", classification: "core", pattern: "Root-to-leaf DFS", why: "Distinguishes carrying path state into a subtree from returning aggregate state.", skills: ["path state", "leaf conditions", "DFS"], tags: ["trees-bst", "tree-dfs"] }),
  leetcode({ id: "validate-binary-search-tree", title: "Validate Binary Search Tree", difficulty: "Medium", classification: "core", pattern: "BST bounds", why: "Replaces incorrect local comparisons with a global recursive invariant.", skills: ["BST invariants", "lower/upper bounds", "recursive validation"], tags: ["trees-bst", "tree-dfs"] }),
  leetcode({ id: "lowest-common-ancestor-of-a-binary-search-tree", title: "Lowest Common Ancestor of a Binary Search Tree", difficulty: "Medium", classification: "practice", pattern: "BST navigation", why: "Uses ordered structure to avoid generic traversal.", skills: ["BST ordering", "branch selection", "ancestor reasoning"], tags: ["trees-bst"] }),
  leetcode({ id: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", difficulty: "Medium", classification: "core", pattern: "Tree BFS", why: "The core queue-based template for processing one level at a time.", skills: ["queues", "level sizing", "BFS"], tags: ["tree-bfs", "queue-deque"] }),
  leetcode({ id: "binary-tree-right-side-view", title: "Binary Tree Right Side View", difficulty: "Medium", classification: "practice", pattern: "Level-order BFS", why: "Tests extracting one result per BFS layer.", skills: ["level order", "queue boundaries", "per-level output"], tags: ["tree-bfs"] }),
  leetcode({ id: "diameter-of-binary-tree", title: "Diameter of Binary Tree", difficulty: "Easy", classification: "core", pattern: "Postorder DFS", why: "Separates the value returned upward from the global answer updated at a node.", skills: ["postorder", "subtree heights", "global answer"], tags: ["tree-dfs", "trees-bst"] }),
  leetcode({ id: "balanced-binary-tree", title: "Balanced Binary Tree", difficulty: "Easy", classification: "practice", pattern: "Postorder DFS", why: "Shows how one traversal can return both validity and height information.", skills: ["sentinel returns", "postorder", "early failure"], tags: ["tree-dfs"] }),
  leetcode({ id: "lowest-common-ancestor-of-a-binary-tree", title: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium", classification: "practice", pattern: "Recursive tree search", why: "Builds careful reasoning about what a subtree result means.", skills: ["recursive contracts", "subtree evidence", "base cases"], tags: ["tree-dfs"] }),

  leetcode({ id: "flood-fill", title: "Flood Fill", difficulty: "Easy", classification: "core", pattern: "Grid traversal", why: "Introduces a grid as an implicit graph with explicit visited-state choices.", skills: ["grid neighbors", "DFS/BFS", "visited state"], tags: ["graph-fundamentals", "graph-bfs-dfs"] }),
  leetcode({ id: "number-of-islands", title: "Number of Islands", difficulty: "Medium", classification: "core", pattern: "Connected components", why: "The central grid-as-graph exercise for component counting.", skills: ["components", "grid DFS/BFS", "visited state"], tags: ["graph-fundamentals", "graph-bfs-dfs"], followUps: ["How would BFS differ from DFS here?", "What changes if mutating the input is not allowed?"] }),
  leetcode({ id: "max-area-of-island", title: "Max Area of Island", difficulty: "Medium", classification: "core", pattern: "Component aggregation", why: "Adds a returned aggregate to ordinary component traversal.", skills: ["DFS returns", "area aggregation", "grid traversal"], tags: ["graph-bfs-dfs"] }),
  leetcode({ id: "rotting-oranges", title: "Rotting Oranges", difficulty: "Medium", classification: "core", pattern: "Multi-source BFS", why: "Teaches layer-by-layer shortest transitions from several starting points.", skills: ["multi-source BFS", "layers", "unreachable detection"], tags: ["graph-bfs-dfs", "queue-deque"] }),
  leetcode({ id: "clone-graph", title: "Clone Graph", difficulty: "Medium", classification: "practice", pattern: "Graph traversal + mapping", why: "Combines traversal with preserving graph identity and cycles.", skills: ["adjacency lists", "visited maps", "deep copy"], tags: ["graph-fundamentals", "graph-bfs-dfs"] }),

  leetcode({ id: "subsets", title: "Subsets", difficulty: "Medium", classification: "core", pattern: "Choose / recurse / undo", why: "The cleanest introduction to a reusable backtracking decision tree.", skills: ["backtracking", "decision trees", "state restoration"], tags: ["backtracking"] }),
  leetcode({ id: "permutations", title: "Permutations", difficulty: "Medium", classification: "practice", pattern: "Backtracking with used choices", why: "Tests state tracking when order matters.", skills: ["choice tracking", "backtracking", "output copying"], tags: ["backtracking"] }),
  leetcode({ id: "combination-sum", title: "Combination Sum", difficulty: "Medium", classification: "practice", pattern: "Backtracking with reuse", why: "Adds candidate reuse and basic pruning to the core template.", skills: ["backtracking", "candidate reuse", "pruning"], tags: ["backtracking"] }),

  leetcode({ id: "jump-game", title: "Jump Game", difficulty: "Medium", classification: "core", pattern: "Greedy reachability", why: "Requires a crisp invariant for why the farthest reachable point is sufficient.", skills: ["greedy invariants", "reachability", "single-pass reasoning"], tags: ["greedy"] }),
  leetcode({ id: "gas-station", title: "Gas Station", difficulty: "Medium", classification: "practice", pattern: "Greedy restart", why: "Challenges candidates to justify why a failed segment eliminates every start inside it.", skills: ["greedy proof", "running balance", "global feasibility"], tags: ["greedy"] }),

  leetcode({ id: "climbing-stairs", title: "Climbing Stairs", difficulty: "Easy", classification: "core", pattern: "1-D dynamic programming", why: "Introduces state and recurrence with minimal problem-specific machinery.", skills: ["state definition", "recurrence", "space optimization"], tags: ["basic-dynamic-programming"] }),
  leetcode({ id: "min-cost-climbing-stairs", title: "Min Cost Climbing Stairs", difficulty: "Easy", classification: "core", pattern: "1-D dynamic programming", why: "Tests whether the state meaning survives a small cost-model change.", skills: ["state definition", "base cases", "bottom-up DP"], tags: ["basic-dynamic-programming"] }),
  leetcode({ id: "house-robber", title: "House Robber", difficulty: "Medium", classification: "core", pattern: "Take / skip DP", why: "Builds the most reusable one-dimensional choice recurrence.", skills: ["take/skip recurrence", "memoization", "space optimization"], tags: ["basic-dynamic-programming"], followUps: ["Can the auxiliary space become O(1)?"] }),
  leetcode({ id: "unique-paths", title: "Unique Paths", difficulty: "Medium", classification: "practice", pattern: "Grid dynamic programming", why: "Extends state and recurrence reasoning into two dimensions without advanced transitions.", skills: ["2-D state", "base cases", "bottom-up order"], tags: ["basic-dynamic-programming"] }),
  leetcode({ id: "coin-change", title: "Coin Change", difficulty: "Medium", classification: "stretch", pattern: "Unbounded dynamic programming", why: "A high-value stretch problem for deriving a minimum-choice recurrence.", skills: ["state definition", "unbounded choices", "impossible states"], tags: ["basic-dynamic-programming"] }),

  leetcode({ id: "course-schedule", title: "Course Schedule", difficulty: "Medium", classification: "core", pattern: "Topological sort / cycle detection", why: "The essential dependency-graph problem for detecting whether all work can be ordered.", skills: ["indegrees", "Kahn's algorithm", "cycle detection"], tags: ["topological-sort"] }),
  leetcode({ id: "course-schedule-ii", title: "Course Schedule II", difficulty: "Medium", classification: "stretch", pattern: "Topological ordering", why: "Extends cycle detection into producing an explicit valid order.", skills: ["topological order", "indegrees", "dependency graphs"], tags: ["topological-sort"] }),

  leetcode({ id: "number-of-provinces", title: "Number of Provinces", difficulty: "Medium", classification: "stretch", pattern: "Union Find", why: "Optional practice for connectivity through disjoint sets.", skills: ["union/find", "components", "path compression"], tags: ["optional-union-find"] }),
  leetcode({ id: "implement-trie-prefix-tree", title: "Implement Trie (Prefix Tree)", difficulty: "Medium", classification: "stretch", pattern: "Trie", why: "Optional exposure to prefix-indexed stateful structures.", skills: ["trie nodes", "prefix queries", "API design"], tags: ["optional-tries"] }),
  leetcode({ id: "network-delay-time", title: "Network Delay Time", difficulty: "Medium", classification: "stretch", pattern: "Dijkstra", why: "Optional introduction to weighted shortest paths after BFS is comfortable.", skills: ["weighted graphs", "min heap", "distance relaxation"], tags: ["optional-shortest-path"] }),
  leetcode({ id: "single-number", title: "Single Number", difficulty: "Easy", classification: "practice", pattern: "Bit manipulation", why: "Optional exposure to XOR as a cancellation invariant.", skills: ["XOR", "bit reasoning", "constant space"], tags: ["optional-bit-manipulation"] }),
] as const;

export const sde1ProblemById = new Map(sde1Problems.map((problem) => [problem.id, problem]));

export function getSde1Problems(problemIds: readonly string[]) {
  return problemIds.map((id) => {
    const problem = sde1ProblemById.get(id);
    if (!problem) throw new Error(`Unknown SDE I roadmap problem: ${id}`);
    return problem;
  });
}

export function getSde1ProblemCounts() {
  return sde1Problems.reduce<Record<ProblemClassification, number>>((counts, problem) => {
    counts[problem.classification] += 1;
    return counts;
  }, { learn: 0, core: 0, practice: 0, stretch: 0 });
}

export function assertSde1ProblemRegistryIntegrity() {
  const ids = sde1Problems.map((problem) => problem.id);
  if (new Set(ids).size !== ids.length) throw new Error("SDE I problem registry contains duplicate IDs.");
  for (const problem of sde1Problems) {
    if (problem.source !== "leetcode" || problem.slug !== problem.id || problem.url !== `https://leetcode.com/problems/${problem.id}/`) throw new Error(`${problem.id} does not use its canonical LeetCode URL.`);
    if (!problem.topicTags?.length) throw new Error(`${problem.id} needs at least one topic tag.`);
  }
}

assertSde1ProblemRegistryIntegrity();
