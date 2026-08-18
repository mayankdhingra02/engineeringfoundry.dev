import type { AlternativeApproach, DSARoadmap, ProblemClassification, RoadmapModule, RoadmapProblemAssignment, RoadmapTopic, TopicPriority } from "./level-roadmaps.ts";

type TopicInput = Omit<RoadmapTopic, "priority" | "completionRequired"> & { priority?: TopicPriority; completionRequired?: boolean };
const topic = (input: TopicInput): RoadmapTopic => ({ priority: "core", completionRequired: true, ...input });

const coreIds = [
  "longest-substring-without-repeating-characters", "permutation-in-string", "longest-repeating-character-replacement",
  "merge-intervals", "insert-interval", "search-in-rotated-sorted-array", "daily-temperatures", "validate-binary-search-tree",
  "course-schedule", "number-of-provinces", "number-of-islands", "network-delay-time", "top-k-frequent-elements",
  "house-robber", "unique-paths", "coin-change", "combination-sum", "jump-game", "subarray-sum-equals-k", "continuous-subarray-sum", "contiguous-array",
  "subarray-sums-divisible-by-k", "minimum-window-substring", "max-consecutive-ones-iii", "fruit-into-baskets", "koko-eating-bananas",
  "capacity-to-ship-packages-within-d-days", "next-greater-element-ii", "car-pooling",
  "binary-tree-maximum-path-sum", "kth-smallest-element-in-a-bst", "construct-binary-tree-from-preorder-and-inorder-traversal",
  "serialize-and-deserialize-binary-tree", "design-add-and-search-words-data-structure", "find-eventual-safe-states",
  "redundant-connection", "accounts-merge", "path-with-minimum-effort", "cheapest-flights-within-k-stops", "min-cost-to-connect-all-points",
  "find-median-from-data-stream", "merge-k-sorted-lists", "task-scheduler", "house-robber-ii", "decode-ways", "lru-cache", "partition-labels", "k-closest-points-to-origin",
] as const;

const practiceIds = [
  "non-overlapping-intervals", "minimum-number-of-arrows-to-burst-balloons", "lowest-common-ancestor-of-a-binary-tree",
  "binary-tree-right-side-view", "implement-trie-prefix-tree", "course-schedule-ii", "gas-station", "path-sum-iii",
  "split-array-largest-sum", "minimum-number-of-days-to-make-m-bouquets", "remove-k-digits",
  "my-calendar-i", "replace-words", "most-stones-removed-with-same-row-or-column", "path-with-maximum-probability",
  "reorganize-string", "minimum-path-sum", "partition-equal-subset-sum", "target-sum", "longest-increasing-subsequence", "time-based-key-value-store",
  "longest-common-subsequence", "combination-sum-ii", "word-search", "jump-game-ii",
] as const;

const stretchIds = [
  "subarrays-with-k-different-integers", "largest-rectangle-in-histogram", "word-search-ii", "swim-in-rising-water", "palindromic-substrings", "edit-distance", "palindrome-partitioning", "n-queens",
  "insert-delete-getrandom-o1", "design-authentication-manager", "reconstruct-itinerary", "word-ladder",
] as const;

const comparisons: Record<string, AlternativeApproach[]> = {
  "top-k-frequent-elements": [
    { title: "Sort frequencies", time: "O(n log n)", space: "O(n)", whenUseful: "Simplest when the full ordering is also useful." },
    { title: "Size-K heap", time: "O(n log k)", space: "O(n)", whenUseful: "Strong when k is small or candidates arrive incrementally." },
    { title: "Frequency buckets", time: "O(n)", space: "O(n)", whenUseful: "Best when frequencies are bounded by input size." },
  ],
  "number-of-islands": [
    { title: "DFS", time: "O(rows × cols)", space: "O(rows × cols)", whenUseful: "Compact traversal when recursion depth is safe." },
    { title: "BFS", time: "O(rows × cols)", space: "O(rows × cols)", whenUseful: "Avoids recursive stack depth and exposes layers." },
    { title: "Union Find", time: "Near O(rows × cols)", space: "O(rows × cols)", whenUseful: "Useful when connectivity is built incrementally." },
  ],
  "course-schedule": [
    { title: "Kahn's algorithm", time: "O(V + E)", space: "O(V + E)", whenUseful: "Produces an ordering and makes blocked nodes visible." },
    { title: "DFS colors", time: "O(V + E)", space: "O(V + E)", whenUseful: "Direct cycle detection with a recursion-state invariant." },
  ],
  "coin-change": [
    { title: "Top-down memoization", time: "O(amount × coins)", space: "O(amount)", whenUseful: "Natural when deriving the recurrence from choices." },
    { title: "Bottom-up DP", time: "O(amount × coins)", space: "O(amount)", whenUseful: "Avoids recursion and makes iteration order explicit." },
  ],
  "longest-increasing-subsequence": [
    { title: "Quadratic DP", time: "O(n²)", space: "O(n)", whenUseful: "Easier to derive and extend to reconstruct a sequence." },
    { title: "Binary-search tails", time: "O(n log n)", space: "O(n)", whenUseful: "Optimizes length when the tails invariant is understood." },
  ],
  "lru-cache": [
    { title: "Map + access timestamps", time: "O(n) eviction", space: "O(capacity)", whenUseful: "Simple baseline that clarifies the bottleneck." },
    { title: "Map + doubly linked list", time: "O(1) get/put", space: "O(capacity)", whenUseful: "Expected interview solution with explicit recency order." },
  ],
};

const rich: Record<string, Omit<RoadmapProblemAssignment, "problemId" | "classification">> = {
  "subarray-sum-equals-k": { levelRationale: "SDE II candidates should reject sliding window when negative values break monotonicity, derive the prefix equation, and explain why counts—not a set—are required.", followUps: ["Return the interval boundaries instead of only the count.", "What changes for many target queries over the same array?"] },
  "top-k-frequent-elements": { levelRationale: "The signal is not merely reaching a solution; compare sorting, a bounded heap, and buckets against n, k, and streaming constraints.", alternativeApproaches: comparisons["top-k-frequent-elements"], followUps: ["Support continuous updates to the frequencies.", "What changes when k is close to the number of unique values?"] },
  "number-of-islands": { levelRationale: "Use this refresh problem to compare traversal and connectivity models, mutation policy, and stack-depth risk.", alternativeApproaches: comparisons["number-of-islands"] },
  "course-schedule": { levelRationale: "Model dependencies first, then compare cycle detection with producing a useful execution order.", alternativeApproaches: comparisons["course-schedule"], followUps: ["Return one valid ordering.", "How would you report the cycle that blocks completion?"] },
  "coin-change": { levelRationale: "Derive the state and impossible sentinel, then compare top-down and bottom-up forms instead of recalling a loop template.", alternativeApproaches: comparisons["coin-change"] },
  "longest-increasing-subsequence": { levelRationale: "This is a deliberate optimization checkpoint: begin with the explainable DP and earn the O(n log n) tails invariant.", alternativeApproaches: comparisons["longest-increasing-subsequence"] },
  "network-delay-time": { levelRationale: "Explain why nonnegative weights permit greedy finalization, when stale heap entries occur, and why ordinary BFS is insufficient.", followUps: ["Return the actual slowest path.", "What changes if an edge weight can be negative?"] },
  "serialize-and-deserialize-binary-tree": { levelRationale: "Treat the encoding as a protocol: define grammar, null representation, parser state, and a round-trip guarantee.", designBridge: { title: "From tree encoding to storage formats", points: ["Version the format before representations evolve.", "Choose delimiters or length-prefixing so parsing is unambiguous.", "Consider schema compatibility, corruption, and payload size."] } },
  "implement-trie-prefix-tree": { followUps: ["When would a hashmap of complete strings be simpler and better than a trie?"], designBridge: { title: "From trie to search indexing", points: ["Compressed edges trade implementation complexity for memory.", "Ranking and typo tolerance require metadata beyond prefix membership.", "Sharding by prefix can create uneven partitions."] } },
  "find-median-from-data-stream": { levelRationale: "State and preserve the partition and size invariants before discussing insert/query complexity.", designBridge: { title: "From exact median to streaming analytics", points: ["Exact global medians are expensive to merge across machines.", "Approximate quantile sketches trade accuracy for bounded memory.", "Windowed medians require deletion or expiry support."] } },
  "lru-cache": { levelRationale: "This is the highest-signal SDE II stateful structure: compose two structures, define ownership, and keep every mutation consistent.", alternativeApproaches: comparisons["lru-cache"], followUps: ["What happens when capacity is zero?", "Add TTL expiration.", "Make operations safe under concurrency.", "What if data must survive process restart?", "What policy would replace LRU for scan-heavy workloads?"], designBridge: { title: "From LRU exercise to production cache", points: ["Capacity can be entries, bytes, or weighted cost.", "TTL, admission, and eviction are separate policy choices.", "Concurrency, metrics, and stampede protection change the API design."] } },
  "number-of-provinces": { followUps: ["What changes if edges are added over time?"] },
  "time-based-key-value-store": { levelRationale: "Model versioned values and ordering assumptions before choosing binary search.", designBridge: { title: "From TimeMap to versioned storage", points: ["Out-of-order writes require sorting or a different index.", "Retention and compaction bound storage growth.", "Replication introduces consistency and timestamp semantics."] } },
  "my-calendar-i": { designBridge: { title: "From interval checks to booking service", points: ["Concurrent reservations need atomic conflict detection.", "Recurring events and time zones expand the domain model.", "An ordered index avoids scanning every booking."] } },
};

function assignments(ids: readonly string[], classification: ProblemClassification): RoadmapProblemAssignment[] {
  return ids.map((problemId) => ({ problemId, classification, ...rich[problemId] }));
}

export const sde2ProblemAssignments = [
  ...assignments(coreIds, "core"),
  ...assignments(practiceIds, "practice"),
  ...assignments(stretchIds, "stretch"),
] satisfies RoadmapProblemAssignment[];

const modules: RoadmapModule[] = [
  {
    id: "foundations", title: "Diagnostic Refresh", description: "Prove the SDE I fundamentals are available under pressure, then spend refresh time only where the diagnostic exposes a gap.",
    topics: [
      topic({ id: "sde2-hashing-refresh", title: "Hashing, Windows & Heaps Refresh", description: "Re-establish frequency state, contiguous-range reasoning, and bounded candidate selection.", concepts: ["Frequency state", "Window validity", "Bounded heaps"], recognitionSignals: ["Repeated membership or grouping", "A contiguous range changes one boundary at a time", "Only the best K candidates matter"], problemIds: ["longest-substring-without-repeating-characters", "top-k-frequent-elements", "k-closest-points-to-origin"], masteryCriteria: ["Solve without pattern prompts and state the invariant before coding."] }),
      topic({ id: "sde2-two-pointers-refresh", title: "Two Pointers Refresh", description: "Confirm that pointer movement eliminates candidates by proof rather than habit.", concepts: ["Opposite-end pointers", "Read/write boundaries", "Sorted-order elimination"], recognitionSignals: ["A pair or range can be narrowed from its boundaries", "The input order makes one pointer movement safe"], masteryCriteria: ["Explain which candidates each pointer movement permanently eliminates."] }),
      topic({ id: "sde2-search-refresh", title: "Search & Interval Refresh", description: "Refresh boundary contracts and sort-then-scan interval reasoning.", concepts: ["Binary-search boundary meaning", "Interval overlap invariants"], recognitionSignals: ["A sorted half can be eliminated", "Sorting reveals a stable overlap order"], problemIds: ["search-in-rotated-sorted-array", "merge-intervals"], masteryCriteria: ["Explain every boundary movement and interval merge condition."] }),
      topic({ id: "sde2-tree-graph-refresh", title: "Tree & Graph Refresh", description: "Verify traversal contracts before weighted and stateful extensions.", concepts: ["Recursive return contracts", "Visited-state policy", "BFS versus DFS"], recognitionSignals: ["Hierarchical subproblems", "Implicit or explicit connectivity"], problemIds: ["validate-binary-search-tree", "number-of-islands"], masteryCriteria: ["Choose traversal and visited representation deliberately."] }),
      topic({ id: "sde2-optimization-refresh", title: "Heap, DP & Backtracking Refresh", description: "Check that candidate selection, state transitions, and state restoration remain fluent.", concepts: ["Bounded candidate sets", "DP state meaning", "Choose/recurse/undo"], recognitionSignals: ["Only the best K candidates matter", "Overlapping choice subproblems", "Enumerate constrained combinations"], problemIds: ["top-k-frequent-elements", "house-robber", "combination-sum"], masteryCriteria: ["Compare at least two valid approaches for one diagnostic problem."] }),
    ],
  },
  {
    id: "core-patterns", title: "High-Signal Intermediate Patterns", description: "Master the patterns most likely to turn a correct baseline into an optimized SDE II solution.",
    topics: [
      topic({ id: "sde2-prefix-hashing", title: "Prefix Sum + Hashing", description: "Count or locate ranges through repeated cumulative states.", concepts: ["prefix[j] − prefix[i − 1] = target", "Therefore prefix[i − 1] = prefix[j] − target", "Frequency versus earliest-index maps", "Remainder normalization"], recognitionSignals: ["Contiguous sums with negative values", "Balanced counts", "Divisibility across ranges"], problemIds: ["subarray-sum-equals-k", "continuous-subarray-sum", "contiguous-array", "subarray-sums-divisible-by-k", "path-sum-iii"], masteryCriteria: ["Derive the lookup state algebraically before coding.", "Explain why a normal sliding window fails for Subarray Sum Equals K when negative values are allowed."] }),
      topic({ id: "sde2-advanced-window", title: "Advanced Sliding Window", description: "Maintain richer validity state and derive exactly-K counts from monotonic helpers.", concepts: ["Minimum windows", "At-most-K decomposition", "Incremental frequency validity"], recognitionSignals: ["Longest or shortest contiguous valid range", "Validity becomes monotonic as a boundary moves"], problemIds: ["longest-repeating-character-replacement", "permutation-in-string", "minimum-window-substring", "max-consecutive-ones-iii", "fruit-into-baskets", "subarrays-with-k-different-integers"], masteryCriteria: ["Explain why shrinking preserves completeness and when the pattern fails."] }),
      topic({ id: "sde2-binary-answer", title: "Binary Search on Answer", description: "Turn optimization objectives into monotonic feasibility questions.", concepts: ["Answer-space bounds", "First feasible value", "Greedy feasibility checks"], recognitionSignals: ["Minimize a maximum or maximize a minimum", "Feasibility changes monotonically with a numeric threshold"], problemIds: ["koko-eating-bananas", "capacity-to-ship-packages-within-d-days", "split-array-largest-sum", "minimum-number-of-days-to-make-m-bouquets"], masteryCriteria: ["State and prove the monotonic predicate before writing binary search."] }),
      topic({ id: "sde2-monotonic-stack", title: "Monotonic Stack", priority: "high-value", description: "Retain unresolved candidates until the event that determines their boundary.", concepts: ["Increasing/decreasing invariants", "Amortized pushes and pops", "Circular scans"], recognitionSignals: ["Next greater/smaller element", "A span ends when a stricter boundary arrives"], problemIds: ["daily-temperatures", "next-greater-element-ii", "largest-rectangle-in-histogram", "remove-k-digits"], masteryCriteria: ["Explain what each stored index is waiting for and why popped elements never return."] }),
      topic({ id: "sde2-interval-sweep", title: "Intervals & Sweep Lines", description: "Compare merge, greedy selection, event deltas, and stateful overlap checks.", concepts: ["Sorted interval phases", "Event deltas", "Overlap predicates"], recognitionSignals: ["Overlapping time ranges", "Capacity changes at ordered endpoints"], problemIds: ["merge-intervals", "insert-interval", "non-overlapping-intervals", "minimum-number-of-arrows-to-burst-balloons", "car-pooling", "my-calendar-i"], masteryCriteria: ["Choose the representation that makes the key invariant easiest to maintain."] }),
    ],
  },
  {
    id: "trees-graphs", title: "Trees & Graph Algorithms", description: "Move beyond traversal into global invariants, ordering, connectivity, weighted paths, and spanning structures.",
    topics: [
      topic({ id: "sde2-tree-invariants", title: "Tree Invariants & Serialization", description: "Define what recursive calls return and what complete result is updated locally.", concepts: ["Define the recursive contract: dfs(node) returns the best downward path beginning at node", "Postorder contracts", "BST ordering", "Reversible encodings"], recognitionSignals: ["The parent needs a summary from each subtree", "Tree structure must cross an API or storage boundary"], problemIds: ["lowest-common-ancestor-of-a-binary-tree", "validate-binary-search-tree", "binary-tree-right-side-view", "binary-tree-maximum-path-sum", "kth-smallest-element-in-a-bst", "construct-binary-tree-from-preorder-and-inorder-traversal", "serialize-and-deserialize-binary-tree"], masteryCriteria: ["Separate returned state, global state, and serialization grammar clearly."] }),
      topic({ id: "sde2-tries", title: "Tries", priority: "high-value", description: "Use prefix-indexed state when ordinary hashing cannot answer partial-key queries.", concepts: ["Trie node API", "Prefix termination", "Wildcard branching"], recognitionSignals: ["Prefix lookup or autocomplete", "A search can be pruned by partial strings"], problemIds: ["implement-trie-prefix-tree", "design-add-and-search-words-data-structure", "replace-words", "word-search-ii"], masteryCriteria: ["Discuss time, memory, alphabet representation, and pruning."] }),
      topic({ id: "sde2-topological", title: "Topological Ordering", description: "Model dependencies, detect cycles, and produce executable orders.", concepts: ["Indegrees", "DFS color states", "Reverse graphs"], recognitionSignals: ["Prerequisites or dependency ordering", "A directed cycle makes completion impossible"], problemIds: ["course-schedule", "course-schedule-ii", "find-eventual-safe-states"], masteryCriteria: ["Compare Kahn and DFS and identify what output each naturally supports."] }),
      topic({ id: "sde2-union-find", title: "Union Find", description: "Maintain incremental connectivity and aggregate components by representative.", concepts: ["Path compression", "Union by size/rank", "Component aggregation"], recognitionSignals: ["Repeated merge and connectivity operations", "Edges progressively join entities"], problemIds: ["number-of-provinces", "redundant-connection", "accounts-merge", "most-stones-removed-with-same-row-or-column"], masteryCriteria: ["Model entities correctly and explain the near-constant amortized operations."] }),
      topic({ id: "sde2-shortest-path", title: "Shortest Paths", description: "Choose BFS, Dijkstra, or bounded state based on edge costs and constraints.", concepts: ["BFS for equal-cost edges", "Optional 0–1 BFS awareness", "Dijkstra for nonnegative weights", "Bellman–Ford awareness for negative edges", "Expanded state dimensions"], recognitionSignals: ["Minimum path cost with nonnegative weights", "Path validity includes a budget or threshold"], problemIds: ["network-delay-time", "path-with-minimum-effort", "cheapest-flights-within-k-stops", "swim-in-rising-water", "path-with-maximum-probability"], masteryCriteria: ["Justify the algorithm from edge and path-cost properties.", "Explain why ordinary BFS works for Rotting Oranges but not Network Delay Time."] }),
      topic({ id: "sde2-mst", title: "Minimum Spanning Trees", priority: "high-value", description: "Connect every node at minimum total edge cost rather than optimizing one source-to-target path.", concepts: ["Prim", "Kruskal", "Cut intuition"], recognitionSignals: ["All nodes must be connected", "The objective is total network cost"], problemIds: ["min-cost-to-connect-all-points"], masteryCriteria: ["Distinguish MST from shortest path and compare Prim with Kruskal."] }),
      topic({ id: "sde2-heaps", title: "Heaps, Top-K & Streaming", description: "Keep only the next or best candidates required by the query.", concepts: ["Bounded heaps", "K-way merge", "Two-heap partition", "Cooldown scheduling"], recognitionSignals: ["Repeated min/max extraction", "Multiple sorted sources", "Online median or scheduling"], problemIds: ["top-k-frequent-elements", "find-median-from-data-stream", "merge-k-sorted-lists", "task-scheduler", "reorganize-string"], masteryCriteria: ["Choose heap direction and state the retained-candidate invariant."] }),
    ],
  },
  {
    id: "high-value-patterns", title: "Dynamic Programming & Search", description: "Derive state instead of memorizing templates, then compare search, memoization, and optimized formulations.",
    topics: [
      topic({ id: "sde2-dp-families", title: "Dynamic Programming Families", description: "Practice take/skip, grid, knapsack, sequence, counting, and transformation states.", concepts: ["State and transition", "Base cases", "Iteration order", "Space optimization"], recognitionSignals: ["Overlapping choice subproblems", "A result depends on smaller prefixes, suffixes, or capacities"], problemIds: ["house-robber", "unique-paths", "coin-change", "house-robber-ii", "decode-ways", "minimum-path-sum", "partition-equal-subset-sum", "target-sum", "longest-increasing-subsequence", "longest-common-subsequence", "palindromic-substrings", "edit-distance"], masteryCriteria: ["Write the state sentence and recurrence before implementation."] }),
      topic({ id: "sde2-backtracking", title: "Backtracking & Pruning", priority: "high-value", description: "Control the search tree with deduplication, constraints, and early impossibility checks.", concepts: ["Choice tree", "State restoration", "Duplicate suppression", "Constraint pruning"], recognitionSignals: ["Enumerate valid combinations or partitions", "Partial choices can prove a branch impossible"], problemIds: ["combination-sum", "combination-sum-ii", "word-search", "palindrome-partitioning", "n-queens"], masteryCriteria: ["Estimate branching and explain each pruning rule's correctness."] }),
      topic({ id: "sde2-greedy", title: "Greedy Proofs", description: "Make a local choice only when its invariant proves discarded alternatives cannot win.", concepts: ["Exchange arguments", "Reachability frontier", "Safe interval boundaries"], recognitionSignals: ["A locally best boundary determines future options", "Only the farthest reachable frontier matters"], problemIds: ["jump-game", "jump-game-ii", "gas-station", "non-overlapping-intervals", "task-scheduler", "partition-labels"], masteryCriteria: ["Give the proof, not only the implementation pattern."] }),
      topic({ id: "sde2-multi-pattern", title: "Multi-Pattern Problems", priority: "high-value", description: "Compose modeling, traversal, ordering, hashing, heaps, and stateful invariants.", concepts: ["Problem decomposition", "Interface between sub-solutions", "Complexity across composed stages"], recognitionSignals: ["No single pattern covers the whole problem", "The output or follow-up adds another data structure"], problemIds: ["reconstruct-itinerary", "accounts-merge", "word-ladder", "serialize-and-deserialize-binary-tree", "find-median-from-data-stream", "top-k-frequent-elements", "task-scheduler"], masteryCriteria: ["Name the subproblems and justify how their invariants compose."] }),
    ],
  },
  {
    id: "level-patterns", title: "Stateful Data Structures", description: "Design APIs whose operations preserve several data-structure invariants over time.",
    topics: [
      topic({ id: "sde2-stateful-core", title: "Mutable API Design", description: "Define operation contracts before combining indexing, ordering, and mutation.", concepts: ["API invariants", "Ownership and mutation", "Amortized operations"], recognitionSignals: ["Operations arrive over time", "Several query types need different access paths"], problemIds: ["lru-cache", "time-based-key-value-store", "insert-delete-getrandom-o1", "design-authentication-manager"], masteryCriteria: ["Trace every mutation across all maintained structures."] }),
      topic({ id: "sde2-stateful-order", title: "Ordered & Streaming State", priority: "high-value", description: "Maintain ordered summaries for intervals and distributions as updates arrive.", concepts: ["Ordered partitions", "Rebalancing", "Incremental queries"], recognitionSignals: ["Online median", "Reservations or intervals arrive one at a time"], problemIds: ["find-median-from-data-stream", "my-calendar-i"], masteryCriteria: ["State the invariant that makes each query cheap."] }),
    ],
  },
  {
    id: "interview-practice", title: "Interview Simulation", description: "Hide pattern labels, rehearse alternative solutions and follow-ups, and review the decision process after every attempt.",
    topics: [
      topic({ id: "sde2-simulation", title: "Mixed Interview Rehearsal", description: "Practice the complete SDE II loop: clarify, model, baseline, optimize, test, compare, and extend.", concepts: ["Hidden-pattern recognition", "Manual testing"], recognitionSignals: ["The prompt is intentionally unlabeled", "The interviewer changes a constraint after a correct baseline"], problemIds: ["subarray-sum-equals-k", "course-schedule", "lru-cache", "network-delay-time", "longest-increasing-subsequence"], masteryCriteria: ["Complete the full loop without relying on a memorized opening line."] }),
      topic({ id: "sde2-follow-up-mode", title: "Follow-up Mode", priority: "high-value", description: "Reopen solved problems under changed time, space, streaming, repeated-query, mutation, or API constraints.", concepts: ["Time and space optimization", "Changed constraints", "Streaming and repeated queries", "Mutation and API design"], recognitionSignals: ["The baseline is correct and the interviewer changes one assumption"], masteryCriteria: ["Name the changed assumption before modifying the solution."] }),
      topic({ id: "sde2-alternatives", title: "Alternative-Solution Checkpoints", priority: "high-value", description: "Compare plausible solutions by complexity, implementation risk, and fit for likely follow-ups.", concepts: ["Baseline versus optimized", "Time-space trade-offs", "Constraint-sensitive selection"], recognitionSignals: ["Several accepted approaches exist", "A follow-up favors a different data structure"], masteryCriteria: ["Explain why the chosen approach fits better than at least one alternative."] }),
      topic({ id: "sde2-design-bridge", title: "From Algorithm to Design", priority: "high-value", description: "Use selected stateful problems for a concise API, indexing, retention, concurrency, or scale discussion.", concepts: ["API contracts", "State growth", "Concurrency awareness", "Exact versus approximate summaries"], recognitionSignals: ["An in-memory object resembles a production component"], masteryCriteria: ["Connect the algorithmic invariant to one realistic design trade-off without turning it into a full system-design round."] }),
    ],
  },
];

export const sde2Roadmap: DSARoadmap = {
  level: "sde2",
  title: "SDE II Interview Roadmap",
  shortTitle: "SDE II",
  subtitle: "Compose patterns, optimize deliberately, and own the follow-up",
  objective: "Build from a correct baseline to a well-justified optimized solution, compare credible alternatives, and adapt when constraints change.",
  progression: ["Compose", "Optimize", "Compare", "Handle Follow-ups"],
  modules,
  problemAssignments: sde2ProblemAssignments,
  diagnostic: {
    title: "Start with a diagnostic, not a full restart.",
    description: "Attempt these representative SDE I problems without pattern labels. Mark only the skills that need a refresh; this view-only check is not stored.",
    problemIds: ["longest-substring-without-repeating-characters", "merge-intervals", "search-in-rotated-sorted-array", "validate-binary-search-tree", "number-of-islands", "top-k-frequent-elements", "k-closest-points-to-origin", "house-robber", "combination-sum", "course-schedule"],
    masteryCriteria: ["Reach a correct baseline without a hint.", "State time and auxiliary space precisely.", "Name one alternative or useful follow-up."],
  },
  optionalTopics: [
    topic({ id: "sde2-optional-range-trees", title: "Segment & Fenwick Trees", priority: "advanced", completionRequired: false, description: "Useful for roles with repeated mutable range queries; safe to defer for most general SDE II loops.", concepts: ["Range aggregation", "Point/range updates"], recognitionSignals: ["Many queries and updates share one indexed range"], masteryCriteria: ["Explain when prefix sums are no longer sufficient."] }),
    topic({ id: "sde2-optional-bitmasking", title: "Bitmasking", priority: "advanced", completionRequired: false, description: "A compact state tool for small-set search and specialized constraints, not a default prerequisite.", concepts: ["Set encoding", "Subset iteration"], recognitionSignals: ["The state space is a small fixed set"], masteryCriteria: ["Translate mask operations back into domain meaning."] }),
  ],
  mixedPracticeSets: [
    { id: "sde2-mixed-1", title: "Constraints First", description: "Choose among prefix state, window state, and answer-space search.", problemIds: ["subarray-sum-equals-k", "minimum-window-substring", "koko-eating-bananas"], revealPatternsByDefault: false },
    { id: "sde2-mixed-2", title: "Ordering & Boundaries", description: "Find the invariant behind stacks, intervals, and ordered trees.", problemIds: ["largest-rectangle-in-histogram", "car-pooling", "kth-smallest-element-in-a-bst"], revealPatternsByDefault: false },
    { id: "sde2-mixed-3", title: "Graph Model", description: "Decide whether the graph needs ordering, connectivity, or weighted relaxation.", problemIds: ["course-schedule", "accounts-merge", "network-delay-time"], revealPatternsByDefault: false },
    { id: "sde2-mixed-4", title: "State Over Time", description: "Maintain several invariants across an operation sequence.", problemIds: ["lru-cache", "time-based-key-value-store", "find-median-from-data-stream"], revealPatternsByDefault: false },
    { id: "sde2-mixed-5", title: "Compose & Extend", description: "Solve a multi-pattern problem, then absorb a changed constraint.", problemIds: ["word-search-ii", "task-scheduler", "serialize-and-deserialize-binary-tree", "word-ladder"], revealPatternsByDefault: false },
  ],
  timedPracticeModes: [
    { id: "sde2-25", title: "Recognition Drill", duration: "20–25 min", description: "One Medium focused on identifying the useful model quickly.", expectations: ["Clarify and name constraints", "Implement and manually test", "State complexity"] },
    { id: "sde2-45", title: "Standard Interview", duration: "40–45 min", description: "One substantial Medium with a required follow-up.", expectations: ["Start with a credible baseline", "Optimize from the bottleneck", "Compare at least two approaches"] },
    { id: "sde2-50", title: "High-Pressure Round", duration: "45–50 min", description: "One Medium plus a smaller extension or changed constraint.", expectations: ["Preserve the original invariant", "Adjust complexity honestly", "Retest changed edge cases"] },
    { id: "sde2-60", title: "Design-Bridge Round", duration: "45–60 min", description: "A coding question followed by a concise API or data-structure extension.", expectations: ["Complete the coding core first", "Define operations and invariants", "Discuss one realistic trade-off"] },
  ],
  readinessCriteria: [
    "Solve common Medium problems independently.", "Recognize when multiple patterns must be composed.", "Explain why the proposed approach works.",
    "Move from a correct baseline to an optimized solution without discarding correctness.", "Compare plausible alternatives by time, space, implementation risk, and follow-up fit.",
    "Select Union Find, topological sort, and Dijkstra appropriately.", "Derive common DP families from a state definition rather than a memorized template.",
    "Design stateful in-memory data structures and preserve invariants after updates.", "Test ordinary, boundary, and adversarial cases deliberately.",
    "Handle follow-up constraints without rewriting blindly.", "Complete mixed problems without visible topic labels.", "Remain communicative while changing approach.",
  ],
  reviewGuidance: ["Review the decision that failed—not only the final code.", "Reattempt weak diagnostic problems before adding new topics.", "For every optimized solution, keep one sentence explaining why the baseline bottleneck is removed."],
  failureModes: [
    { title: "Pattern forcing", description: "Start from constraints and invariants instead of reusing whichever pattern was practiced most recently." },
    { title: "Premature optimization", description: "State a correct baseline first so the optimization has a reason and a safety net." },
    { title: "Missing invariants", description: "Explain what the maintained state means and why each update preserves it." },
    { title: "Graph autopilot", description: "Check weights, direction, dependencies, and update behavior before defaulting to BFS or DFS." },
    { title: "DP template memorization", description: "Define the state before writing a recurrence or choosing iteration order." },
    { title: "Silent coding", description: "Communicate decisions, checks, and trade-offs while the solution evolves." },
    { title: "Ignoring alternative solutions", description: "Use the comparison checkpoint to discuss constraints, trade-offs, and implementation risk." },
    { title: "Treating follow-ups as new problems", description: "Identify which original assumption changed and adapt the existing model deliberately." },
    { title: "Practicing only labeled sets", description: "Use mixed sets and timed modes so recognition—not category memory—drives the approach." },
  ],
  scopePaths: [
    { id: "short", title: "Refresh only what I forgot", description: "Start with the diagnostic, revisit weak core skills, then run a mixed set.", classifications: ["core"] },
    { id: "standard", title: "Standard", description: "Cover the Core and Practice layers, including comparisons and follow-ups.", classifications: ["core", "practice"] },
    { id: "thorough", title: "Thorough", description: "Add every Stretch problem and optional advanced topic after the main curriculum.", classifications: ["core", "practice", "stretch"] },
  ],
  estimatedProblems: sde2ProblemAssignments.length,
  estimatedWeeks: "10–12 weeks",
};

export function assertSde2RoadmapIntegrity() {
  const ids = sde2ProblemAssignments.map((assignment) => assignment.problemId);
  if (new Set(ids).size !== ids.length) throw new Error("SDE II assignments contain duplicate canonical IDs.");
  if (ids.length < 65 || ids.length > 85) throw new Error(`SDE II must contain 65–85 unique problems; found ${ids.length}.`);
  const counts = sde2ProblemAssignments.reduce<Record<ProblemClassification, number>>((result, assignment) => { result[assignment.classification] += 1; return result; }, { learn: 0, core: 0, practice: 0, stretch: 0 });
  if (counts.core < 40 || counts.core > 50 || counts.practice < 20 || counts.practice > 25 || counts.stretch < 5 || counts.stretch > 12) throw new Error(`SDE II classification mix is outside the approved range: ${JSON.stringify(counts)}.`);
  const referenced = new Set(modules.flatMap((module) => module.topics.flatMap((current) => current.problemIds ?? [])));
  for (const id of ids) if (!referenced.has(id)) throw new Error(`${id} is assigned to SDE II but not referenced by a curriculum topic.`);
}

assertSde2RoadmapIntegrity();
