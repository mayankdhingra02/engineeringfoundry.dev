import type { DSARoadmap, RoadmapModule, RoadmapTopic, TopicPriority } from "./level-roadmaps.ts";
import { sde1ProblemById, sde1Problems } from "./sde1-problems.ts";

type TopicInput = Omit<RoadmapTopic, "id" | "priority" | "completionRequired"> & {
  id: string;
  priority?: TopicPriority;
  completionRequired?: boolean;
};

function topic(input: TopicInput): RoadmapTopic {
  return { priority: "core", completionRequired: true, ...input };
}

const foundations: RoadmapModule = {
  id: "foundations",
  title: "Foundations",
  description: "Build fast complexity judgment and the array, string, map, and set habits used everywhere else.",
  topics: [
    topic({
      id: "complexity-big-o",
      title: "Complexity & Big-O",
      description: "Describe the approach first, analyze it after coding, and distinguish auxiliary memory from the input and output.",
      concepts: ["O(1), O(log n), O(n), O(n log n), and O(n²)", "Recursive call stacks", "Auxiliary versus total memory", "Intuitive amortized analysis"],
      recognitionSignals: ["A proposed solution repeats work or scans the same data many times.", "The interviewer asks whether the approach scales or can use less memory."],
      masteryCriteria: ["Given ordinary interview code, explain its time and auxiliary space complexity without guessing.", "Count nested work accurately instead of assuming every nested loop is O(n²).", "Include recursion depth and state the dominant term clearly."],
      comparisonExamples: [
        { label: "Single pass", complexity: "O(n)" },
        { label: "Nested full scans", complexity: "O(n²)" },
        { label: "Sort + scan", complexity: "O(n log n)" },
        { label: "Binary search", complexity: "O(log n)" },
      ],
      interviewNotes: ["Analyze complexity after describing the approach and again after coding; the implementation may change the real cost."],
    }),
    topic({
      id: "arrays-strings",
      title: "Arrays & Strings",
      description: "Turn repeated scans into indexed lookups, counts, or one deliberate traversal while staying precise about mutation.",
      concepts: ["Indexing and traversal", "In-place mutation", "Frequency counting", "Auxiliary arrays or maps", "Sorting as preprocessing"],
      recognitionSignals: ["Pair or combination lookup", "Duplicates or frequencies", "Contiguous data", "Rearranging elements", "Comparing character counts"],
      problemIds: ["two-sum", "contains-duplicate", "valid-anagram", "isomorphic-strings", "majority-element", "find-pivot-index", "group-anagrams", "product-of-array-except-self", "longest-consecutive-sequence"],
      masteryCriteria: ["Recognize when repeated lookup suggests a map or set.", "Explain the O(n) alternative to an O(n²) brute force.", "Handle duplicates, missing values, empty input, and mutation constraints."],
    }),
    topic({
      id: "hash-maps-sets",
      title: "Hash Maps & Sets",
      description: "Use maps for associated state and sets for membership—not as automatic answers to every array problem.",
      concepts: ["Membership versus key/value state", "Frequency maps", "Canonical keys", "Average-case lookup", "Space trade-offs"],
      recognitionSignals: ["Repeated membership checks", "Counting or grouping", "Need to remember prior values", "Need a canonical representation"],
      problemIds: ["two-sum", "contains-duplicate", "valid-anagram", "isomorphic-strings", "group-anagrams", "longest-consecutive-sequence", "top-k-frequent-elements"],
      masteryCriteria: ["Choose map versus set deliberately.", "Design a key that preserves the required equivalence.", "Explain average O(1) lookup and the added O(n) space."],
    }),
  ],
};

const corePatterns: RoadmapModule = {
  id: "core-patterns",
  title: "Core Patterns",
  description: "Learn the small set of range, ordering, and search patterns that repeatedly replace brute force.",
  topics: [
    topic({
      id: "two-pointers", title: "Two Pointers", description: "Move boundaries only when you can explain which candidates that movement safely eliminates.",
      concepts: ["Opposite-end pointers", "Same-direction read/write pointers", "Partition and compaction", "Exploiting sorted order"],
      recognitionSignals: ["Sorted array", "Pair satisfying a constraint", "Palindrome", "In-place removal or compaction", "Compare opposite ends"],
      problemIds: ["valid-palindrome", "move-zeroes", "remove-duplicates-from-sorted-array", "two-sum-ii-input-array-is-sorted", "3sum", "container-with-most-water", "sort-colors"],
      masteryCriteria: ["State the pointer invariant before coding.", "Explain why moving one pointer cannot discard the optimal answer.", "Handle duplicates and termination without patching the loop afterward."],
    }),
    topic({
      id: "sliding-window", title: "Sliding Window", description: "Maintain just enough range state to expand and shrink without recomputing the entire region.",
      concepts: ["Fixed windows", "Variable windows", "State entering and leaving the range", "Validity and shrink conditions"],
      recognitionSignals: ["Contiguous subarray or substring", "Longest or shortest valid region", "At most or exactly K", "Range state updates incrementally"],
      problemIds: ["maximum-average-subarray-i", "best-time-to-buy-and-sell-stock", "longest-substring-without-repeating-characters", "permutation-in-string", "longest-repeating-character-replacement", "minimum-size-subarray-sum"],
      masteryCriteria: ["Identify fixed versus variable windows independently.", "Name what enters and leaves the maintained state.", "Explain why shrinking is valid and when it is not."],
      interviewNotes: ["Sliding window does not automatically work for every subarray problem; negative values and non-monotonic validity often require another tool."],
    }),
    topic({
      id: "prefix-sums", title: "Prefix Sums", description: "Pay one preprocessing pass to answer repeated range questions or compare left and right aggregates cheaply.",
      concepts: ["Cumulative sums", "O(1) immutable range queries", "Left/right aggregate reasoning", "Prefix and suffix arrays"],
      recognitionSignals: ["Repeated range totals", "Many immutable queries", "Left-versus-right balance", "Each answer re-sums overlapping data"],
      problemIds: ["running-sum-of-1d-array", "find-pivot-index", "range-sum-query-immutable", "product-of-array-except-self"],
      masteryCriteria: ["Define whether the prefix includes or excludes the current index.", "Derive the range formula without off-by-one guessing.", "Explain why Product Except Self is related prefix/suffix aggregation, not literally a prefix-sum problem."],
    }),
    topic({
      id: "sorting", title: "Sorting", description: "Accept O(n log n) preprocessing when it turns scattered comparisons into a structured scan.",
      concepts: ["Sorting as preprocessing", "Comparator and sort-key choice", "In-place partitioning", "Sort + scan composition"],
      recognitionSignals: ["Pairwise comparison becomes local after ordering", "Duplicates need grouping", "Ordering exposes a scan or two-pointer solution"],
      problemIds: ["3sum", "sort-colors"],
      masteryCriteria: ["State the sort key and why it is sufficient.", "Include sorting in the final complexity.", "Explain why the ordered scan is easier to prove correct."],
      interviewNotes: ["Sorting often costs O(n log n), but it can dramatically simplify what happens afterward."],
    }),
    topic({
      id: "intervals", title: "Intervals", description: "Sort ranges into a useful order, then make overlap and non-overlap decisions with one maintained boundary.",
      concepts: ["Interval overlap", "Merge versus insert phases", "Greedy end-time choice", "Touching-boundary semantics"],
      recognitionSignals: ["Overlapping ranges", "Events need chronological order", "Need to merge, insert, schedule, or remove ranges"],
      problemIds: ["merge-intervals", "insert-interval", "non-overlapping-intervals", "minimum-number-of-arrows-to-burst-balloons"],
      masteryCriteria: ["Write the overlap condition once and test touching boundaries.", "Choose a sort key that matches the decision being made.", "Explain when retaining the earlier finishing interval is safe."],
    }),
    topic({
      id: "binary-search", title: "Binary Search", description: "Treat binary search as a shrinking candidate-space invariant, then move from exact lookup to boundaries.",
      concepts: ["Exact lookup", "Inclusive and half-open boundaries", "First/last valid position", "Rotated sorted structure"],
      recognitionSignals: ["Sorted or monotonic search space", "First or last valid point", "A comparison discards half the candidates"],
      problemIds: ["binary-search", "search-insert-position", "first-bad-version", "search-a-2d-matrix", "find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array"],
      masteryCriteria: ["Define what left and right represent before coding.", "Prove every update shrinks the candidate interval.", "Return the correct boundary when the exact target is absent."],
    }),
  ],
};

const coreDataStructures: RoadmapModule = {
  id: "core-data-structures",
  title: "Core Data Structures",
  description: "Build implementation confidence with LIFO/FIFO state, pointer mutation, and priority-based candidate selection.",
  topics: [
    topic({
      id: "stack", title: "Stack", description: "Use LIFO state for nested structure, undo-like behavior, and unresolved candidates.",
      concepts: ["Push/pop invariants", "Matching nested structure", "Augmented state", "Introductory monotonic stacks"],
      recognitionSignals: ["Most recent unresolved item matters", "Nested delimiters", "Need constant-time state rollback", "Next greater/smaller candidate"],
      problemIds: ["valid-parentheses", "min-stack", "daily-temperatures"],
      masteryCriteria: ["Explain what each stack entry represents.", "Check empty-stack cases before reading the top.", "Reason about amortized O(n) behavior in Daily Temperatures."],
    }),
    topic({
      id: "queue-deque", title: "Queue / Deque", description: "Use FIFO order for layer-by-layer work; learn queues mainly where BFS makes the need real.",
      concepts: ["FIFO semantics", "Deque operations", "Level boundaries", "Amortized two-stack queues"],
      recognitionSignals: ["Process in arrival order", "Level-by-level traversal", "Minimum transitions in an unweighted graph", "A moving active frontier"],
      problemIds: ["implement-queue-using-stacks", "binary-tree-level-order-traversal", "rotting-oranges"],
      masteryCriteria: ["Choose queue rather than stack based on processing order.", "Capture a BFS level size before consuming that level.", "Explain amortized complexity of a two-stack queue."],
    }),
    topic({
      id: "linked-lists", title: "Linked Lists", description: "Draw the local pointer change, preserve the next reference, then mutate—never improvise multiple updates at once.",
      concepts: ["Dummy nodes", "Fast/slow pointers", "Preserving references", "Pointer gaps", "Reverse and merge"],
      recognitionSignals: ["In-place sequence mutation without indices", "Cycle or midpoint", "Remove relative to the end", "Merge sorted nodes"],
      problemIds: ["reverse-linked-list", "linked-list-cycle", "middle-of-the-linked-list", "merge-two-sorted-lists", "remove-nth-node-from-end-of-list", "reorder-list"],
      masteryCriteria: ["Manipulate pointers without losing part of the list.", "Use a dummy node when head mutation would create special cases.", "Trace odd, even, one-node, and empty inputs on a small diagram."],
    }),
    topic({
      id: "heaps-priority-queues", title: "Heaps / Priority Queues", description: "Maintain the best K candidates or repeatedly retrieve the current extreme without sorting everything.",
      concepts: ["Min heap versus max heap", "Bounded size-K heaps", "Streaming Top K", "Heap versus sorting or buckets"],
      recognitionSignals: ["Repeatedly need the smallest or largest candidate", "Maintain Top K", "Values arrive over time", "Full sorting does unnecessary work"],
      problemIds: ["kth-largest-element-in-a-stream", "kth-largest-element-in-an-array", "top-k-frequent-elements", "k-closest-points-to-origin"],
      masteryCriteria: ["Choose heap direction based on which candidate should be discarded.", "Explain O(n log k) versus sorting.", "Keep exactly the state required by K, not every value."],
      interviewNotes: ["Quickselect is a possible follow-up, not a core SDE I requirement."],
    }),
  ],
};

const treesGraphs: RoadmapModule = {
  id: "trees-graphs",
  title: "Trees & Graphs",
  description: "Make traversal state explicit: what enters a node, what returns from it, and what prevents repeated visits.",
  topics: [
    topic({
      id: "trees-bst", title: "Trees / BST", description: "Use the tree's recursive shape and, for BSTs, preserve global ordering bounds rather than only comparing neighbors.",
      concepts: ["Tree base cases", "BST ordering", "Recursive contracts", "Root-to-leaf state"],
      recognitionSignals: ["Hierarchical parent/child data", "Subtree answers combine", "Ordered tree supports branch elimination", "Path or ancestor question"],
      problemIds: ["maximum-depth-of-binary-tree", "invert-binary-tree", "path-sum", "validate-binary-search-tree", "lowest-common-ancestor-of-a-binary-search-tree"],
      masteryCriteria: ["Write the recursive base case before the recursive calls.", "State what each call returns.", "Use inherited bounds to validate a BST globally."],
    }),
    topic({
      id: "tree-bfs", title: "Tree BFS", description: "Process nodes level by level and separate one layer's work from the next.",
      concepts: ["Queue-based traversal", "Level sizing", "Per-level aggregation"],
      recognitionSignals: ["Level order", "Nearest depth", "One result per row or layer", "Breadth before depth"],
      problemIds: ["binary-tree-level-order-traversal", "binary-tree-right-side-view"],
      masteryCriteria: ["Write level-order BFS without mixing layers.", "Explain why the queue contains the current frontier.", "Handle an empty root without special-case clutter."],
    }),
    topic({
      id: "tree-dfs", title: "Tree DFS", description: "Distinguish carrying information into a subtree, returning information from it, and updating an answer during postorder.",
      concepts: ["Preorder/inorder/postorder purpose", "Subtree return values", "Path state", "Global versus returned answers"],
      recognitionSignals: ["Answer depends on descendants", "Need every root-to-leaf path", "Combine left and right subtree information", "Recursive structure mirrors the problem"],
      problemIds: ["maximum-depth-of-binary-tree", "invert-binary-tree", "path-sum", "validate-binary-search-tree", "diameter-of-binary-tree", "balanced-binary-tree", "lowest-common-ancestor-of-a-binary-tree"],
      masteryCriteria: ["Write recursive DFS without copying a template.", "Explain base cases and every return value.", "Know when the answer is computed at a node versus returned upward."],
    }),
    topic({
      id: "graph-fundamentals", title: "Graph Fundamentals", description: "Represent relationships with adjacency lists and make visited-state part of the algorithm, including for grids.",
      concepts: ["Vertices and edges", "Directed versus undirected", "Adjacency lists", "Visited sets", "Connected components", "Grid-as-graph modeling"],
      recognitionSignals: ["Arbitrary connections rather than hierarchy", "Reachability or components", "Grid neighbors form implicit edges", "Dependencies may form cycles"],
      problemIds: ["flood-fill", "number-of-islands", "clone-graph"],
      masteryCriteria: ["Build an adjacency list from an edge list.", "Mark visited at the correct time.", "Recognize a grid as a graph without constructing explicit nodes."],
    }),
    topic({
      id: "graph-bfs-dfs", title: "Graph BFS / DFS", description: "Use DFS to exhaust a reachable region and BFS for layers or shortest edge count in an unweighted graph.",
      concepts: ["DFS for full region exploration", "BFS frontiers", "Multi-source BFS", "Component aggregation"],
      recognitionSignals: ["Shortest path in an unweighted graph", "Level-by-level processing", "Minimum transitions", "Explore an entire connected region"],
      problemIds: ["flood-fill", "number-of-islands", "max-area-of-island", "rotting-oranges", "clone-graph"],
      masteryCriteria: ["Implement both BFS and DFS with correct visited handling.", "Explain why BFS gives the shortest number of edges in an unweighted graph.", "Choose recursion or an explicit stack based on depth and constraints."],
    }),
  ],
};

const highValuePatterns: RoadmapModule = {
  id: "high-value-patterns",
  title: "High-Value Patterns",
  description: "Add selective breadth after the foundations: search decisions, safe local choices, basic state recurrences, and dependencies.",
  topics: [
    topic({
      id: "backtracking", title: "Backtracking", priority: "high-value", description: "Enumerate a decision tree with the disciplined cycle: choose, recurse, undo.",
      concepts: ["Decision trees", "Choose / recurse / undo", "Copying results", "Basic pruning"],
      recognitionSignals: ["Enumerate combinations", "Enumerate permutations", "Explore all valid choices", "A choice must be undone before trying the next"],
      problemIds: ["subsets", "permutations", "combination-sum"],
      masteryCriteria: ["Define the partial state and available choices.", "Restore mutable state on every return path.", "Avoid duplicate work with a deliberate start index or used set."],
    }),
    topic({
      id: "greedy", title: "Greedy", priority: "high-value", description: "Use a local choice only when you can justify why it preserves a globally optimal or feasible solution.",
      concepts: ["Safe local choices", "Reachability invariants", "Exchange-style reasoning", "Greedy interval ordering"],
      recognitionSignals: ["Only the best boundary so far matters", "A failed prefix eliminates a range of choices", "Sorting exposes a safe earliest/latest choice"],
      problemIds: ["best-time-to-buy-and-sell-stock", "container-with-most-water", "non-overlapping-intervals", "minimum-number-of-arrows-to-burst-balloons", "jump-game", "gas-station"],
      masteryCriteria: ["State the greedy invariant, not just the code.", "Explain why the discarded alternatives cannot improve the answer.", "Recognize when greedy evidence is missing and another method is safer."],
    }),
    topic({
      id: "basic-dynamic-programming", title: "Basic Dynamic Programming", priority: "high-value", description: "Move from recursion to repeated subproblems, define state, then write memoized or bottom-up transitions.",
      concepts: ["Overlapping subproblems", "Memoization", "Bottom-up state", "Base cases", "Optional space optimization"],
      recognitionSignals: ["Repeated choices lead to the same remaining state", "Count, minimum, or maximum over prefixes", "A brute-force recursion repeats work"],
      problemIds: ["climbing-stairs", "min-cost-climbing-stairs", "house-robber", "unique-paths", "coin-change"],
      masteryCriteria: ["Define exactly what dp[i] means before writing the recurrence.", "Derive transitions and base cases from that definition.", "Convert simple memoization to bottom-up and identify when O(1) state is enough."],
    }),
    topic({
      id: "topological-sort", title: "Topological Sort", priority: "high-value", description: "Model prerequisites as a directed graph and determine whether every dependency can be resolved.",
      concepts: ["Indegrees", "Kahn's algorithm", "Dependency ordering", "DFS cycle detection concept"],
      recognitionSignals: ["Prerequisites or dependencies", "Need a valid order", "Directed graph may contain a cycle", "Items become available after requirements finish"],
      problemIds: ["course-schedule", "course-schedule-ii"],
      masteryCriteria: ["Build directed edges in the correct direction.", "Explain why processing all nodes proves acyclicity.", "Understand DFS cycle detection without memorizing multiple implementations."],
    }),
  ],
};

const interviewPractice: RoadmapModule = {
  id: "interview-practice",
  title: "Interview Practice",
  description: "Remove topic labels, rehearse the full interview loop, review misses, and use competency—not a fake score—to judge readiness.",
  topics: [
    topic({ id: "mixed-recognition-sets", title: "Mixed Recognition Sets", description: "Practice without being told the likely pattern; reveal the pattern only when you choose to use a hint.", concepts: ["Unlabeled problem selection", "Pattern explanation before coding", "Transfer across topics"], recognitionSignals: ["You can no longer rely on the topic heading as the first hint."], masteryCriteria: ["Name the likely pattern from constraints and examples.", "Explain at least one rejected alternative.", "Solve mixed problems without depending on memorized ordering."] }),
    topic({ id: "timed-coding-sessions", title: "Timed Coding Sessions", description: "Rehearse clarifying, brute force, optimization, coding, testing, and follow-ups under realistic time pressure.", concepts: ["Practice mode", "Guided 30–40 minute interview", "Full 45 minute interview"], recognitionSignals: ["Topic work is comfortable but full-loop execution is inconsistent."], masteryCriteria: ["Clarify requirements before solving.", "State brute force before optimization.", "Code, test manually, state complexity, and answer a follow-up within the session."] }),
    topic({ id: "review-queue", title: "Review Queue", description: "Return to missed or hint-assisted problems through repeated retrieval rather than passive editorial rereading.", concepts: ["New", "Learning", "Review", "Comfortable"], recognitionSignals: ["A solution required a hint, had a repeated bug, or cannot be re-derived later."], masteryCriteria: ["Re-solve missed work after a short gap and again around a week later when useful.", "Include weak problems in mixed practice.", "Advance only when the approach can be re-derived, not merely recognized."], interviewNotes: ["Review timing is guidance, not a rigid scientific schedule." ] }),
    topic({ id: "readiness-checkpoint", title: "Interview Readiness Check", description: "Use observable interview behaviors rather than a probabilistic pass score.", concepts: ["Recognition", "Independent Medium solutions", "Complexity", "Testing", "Communication", "Recovery"], recognitionSignals: ["Core topics are comfortable and mixed timed sessions are the remaining uncertainty."], masteryCriteria: ["Meet the roadmap readiness checklist consistently across several unlabeled sessions."], interviewNotes: ["This checkpoint does not predict a chance of passing; it identifies the next skill to rehearse."] }),
  ],
};

const optionalTopics: RoadmapTopic[] = [
  topic({ id: "optional-union-find", title: "Union Find", priority: "advanced", completionRequired: false, description: "Optional before an SDE I interview: a compact structure for dynamic connectivity.", concepts: ["Parent pointers", "Path compression", "Union by rank/size"], recognitionSignals: ["Repeated connectivity merges", "Need component membership after unions"], problemIds: ["number-of-provinces"], masteryCriteria: ["Explain the operations and when ordinary DFS is simpler."] }),
  topic({ id: "optional-tries", title: "Tries", priority: "advanced", completionRequired: false, description: "Optional before an SDE I interview: prefix-indexed lookup and stateful API practice.", concepts: ["Trie nodes", "Prefix queries"], recognitionSignals: ["Many prefix lookups over the same vocabulary"], problemIds: ["implement-trie-prefix-tree"], masteryCriteria: ["Implement insert, exact search, and prefix search with clear node ownership."] }),
  topic({ id: "optional-shortest-path", title: "Shortest Paths", priority: "advanced", completionRequired: false, description: "Optional before an SDE I interview: weighted shortest paths after unweighted BFS is solid.", concepts: ["Distance relaxation", "Min-heap frontier"], recognitionSignals: ["Edges have non-negative weights and shortest total cost matters"], problemIds: ["network-delay-time"], masteryCriteria: ["Explain why ordinary BFS is insufficient for varied edge weights."] }),
  topic({ id: "optional-bit-manipulation", title: "Bit Manipulation", priority: "advanced", completionRequired: false, description: "Optional before an SDE I interview: a small introduction to useful bit invariants.", concepts: ["XOR cancellation"], recognitionSignals: ["Paired values cancel and constant extra space is requested"], problemIds: ["single-number"], masteryCriteria: ["Explain the XOR invariant instead of quoting a trick."] }),
  topic({ id: "optional-advanced-dp", title: "Advanced Dynamic Programming", priority: "advanced", completionRequired: false, description: "Optional before an SDE I interview. Deeper DP taxonomies remain in the SDE II content pass.", concepts: ["Multi-dimensional and interval state"], recognitionSignals: ["The state requires several interacting dimensions"], masteryCriteria: ["Know that this can wait until the core roadmap is comfortable."] }),
];

export const sde1Roadmap: DSARoadmap = {
  level: "sde1",
  title: "SDE I Interview Roadmap",
  shortTitle: "SDE I",
  subtitle: "Build interview fundamentals",
  objective: "Recognize common patterns, implement them correctly, analyze the result, and test it like an interviewer expects.",
  progression: ["Recognize", "Implement", "Analyze", "Test"],
  modules: [foundations, corePatterns, coreDataStructures, treesGraphs, highValuePatterns, interviewPractice],
  optionalTopics,
  estimatedProblems: sde1Problems.length,
  estimatedWeeks: "8–10 weeks",
  scopePaths: [
    { id: "short", title: "Short on time", description: "Core problems only", classifications: ["core"] },
    { id: "standard", title: "Standard", description: "Core + Practice", classifications: ["core", "practice"] },
    { id: "thorough", title: "Thorough", description: "Core + Practice + Stretch + all mixed sets", classifications: ["core", "practice", "stretch"] },
  ],
  mixedPracticeSets: [
    { id: "mixed-foundations", title: "Mixed Set A — Foundations", description: "Four familiar foundations with their pattern labels removed.", problemIds: ["two-sum", "valid-palindrome", "valid-parentheses", "binary-search"], revealPatternsByDefault: false },
    { id: "mixed-data-structures", title: "Mixed Set B — Data Structures", description: "Choose between pointer, priority, traversal, and ordering tools.", problemIds: ["reverse-linked-list", "top-k-frequent-elements", "binary-tree-level-order-traversal", "merge-intervals"], revealPatternsByDefault: false },
    { id: "mixed-traversal", title: "Mixed Set C — Traversal", description: "Separate recursive returns, graph frontiers, grid components, and dependencies.", problemIds: ["diameter-of-binary-tree", "rotting-oranges", "number-of-islands", "course-schedule"], revealPatternsByDefault: false },
    { id: "mixed-interview", title: "Mixed Set D — Interview Mode", description: "Two medium problems with no pattern labels and no suggested order.", problemIds: ["longest-substring-without-repeating-characters", "group-anagrams"], revealPatternsByDefault: false },
  ],
  timedPracticeModes: [
    { id: "practice", title: "Practice Mode", duration: "No timer", description: "Work deliberately and use staged hints when needed.", expectations: ["Clarify", "Describe brute force", "Improve", "Code", "Test"] },
    { id: "guided", title: "Guided Interview", duration: "30–40 minutes", description: "Solve one problem with the recognition hint hidden initially.", expectations: ["Communicate decisions", "State complexity", "Answer one follow-up"] },
    { id: "full", title: "Full Coding Interview", duration: "45 minutes", description: "Solve one substantial problem or two shorter problems end to end.", expectations: ["Clarify", "Brute force", "Optimize", "Code", "Test", "Follow-up"] },
  ],
  reviewGuidance: ["Review missed or hint-assisted problems after a short 1–2 day gap.", "Revisit them around a week later when useful.", "Mix them with unrelated patterns so recognition must be retrieved again."],
  readinessCriteria: [
    "Identify the likely pattern on unseen common interview problems.",
    "Solve most foundational Easy problems quickly and common Medium problems independently.",
    "Explain brute force before optimization and state correct time and space complexity.",
    "Write syntactically clean code and test normal and edge cases.",
    "Communicate while solving and recover when the first approach does not work.",
    "Complete realistic timed sessions without relying on topic labels.",
  ],
};

export function getSde1RoadmapProblemIds() {
  return [...new Set([
    ...sde1Roadmap.modules.flatMap((module) => module.topics.flatMap((current) => current.problemIds ?? [])),
    ...(sde1Roadmap.optionalTopics ?? []).flatMap((current) => current.problemIds ?? []),
    ...(sde1Roadmap.mixedPracticeSets ?? []).flatMap((set) => set.problemIds),
  ])];
}

export function assertSde1RoadmapIntegrity() {
  const expectedStages = ["foundations", "core-patterns", "core-data-structures", "trees-graphs", "high-value-patterns", "interview-practice"];
  if (sde1Roadmap.modules.map((module) => module.id).join("|") !== expectedStages.join("|")) throw new Error("SDE I roadmap stages are incomplete or out of order.");
  const topicIds = [...sde1Roadmap.modules, { topics: sde1Roadmap.optionalTopics ?? [] }].flatMap((module) => module.topics.map((current) => current.id));
  if (new Set(topicIds).size !== topicIds.length) throw new Error("SDE I roadmap contains duplicate topic IDs.");
  const roadmapProblemIds = getSde1RoadmapProblemIds();
  for (const id of roadmapProblemIds) if (!sde1ProblemById.has(id)) throw new Error(`SDE I roadmap references unknown problem ${id}.`);
  if (roadmapProblemIds.length !== sde1Problems.length) throw new Error(`SDE I roadmap references ${roadmapProblemIds.length} of ${sde1Problems.length} registered problems.`);
  for (const set of sde1Roadmap.mixedPracticeSets ?? []) if (set.revealPatternsByDefault !== false) throw new Error(`${set.id} must hide pattern labels by default.`);
}

assertSde1RoadmapIntegrity();
