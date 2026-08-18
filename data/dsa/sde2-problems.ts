import type { RoadmapProblem } from "./level-roadmaps.ts";

type Seed = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  pattern: string;
  why: string;
  skills: string[];
  tags: string[];
  followUps?: string[];
  hints?: [string, string, string];
};

function leetcode(seed: Seed): RoadmapProblem {
  return {
    ...seed,
    slug: seed.id,
    url: `https://leetcode.com/problems/${seed.id}/`,
    classification: "practice",
    whyItMatters: seed.why,
    topicTags: seed.tags,
    source: "leetcode",
  };
}

export const sde2Problems: readonly RoadmapProblem[] = [
  leetcode({ id: "subarray-sum-equals-k", title: "Subarray Sum Equals K", difficulty: "Medium", pattern: "Prefix sum + frequency map", why: "Replaces an invalid sliding-window instinct with cumulative-state reasoning that also supports negative values.", skills: ["prefix invariants", "frequency maps", "negative values"], tags: ["prefix-hashing"] }),
  leetcode({ id: "continuous-subarray-sum", title: "Continuous Subarray Sum", difficulty: "Medium", pattern: "Prefix remainder map", why: "Turns divisibility into repeated prefix remainders while preserving the minimum-length constraint.", skills: ["modular arithmetic", "earliest index", "edge cases"], tags: ["prefix-hashing"] }),
  leetcode({ id: "contiguous-array", title: "Contiguous Array", difficulty: "Medium", pattern: "Balanced prefix state", why: "Shows how transforming values can reduce a balance condition to repeated cumulative state.", skills: ["state transformation", "first occurrence", "longest range"], tags: ["prefix-hashing"] }),
  leetcode({ id: "subarray-sums-divisible-by-k", title: "Subarray Sums Divisible by K", difficulty: "Medium", pattern: "Prefix remainder frequencies", why: "Extends prefix counting to normalized modular states and repeated matches.", skills: ["normalized remainder", "frequency counting", "pair counting"], tags: ["prefix-hashing"] }),
  leetcode({ id: "path-sum-iii", title: "Path Sum III", difficulty: "Medium", pattern: "Tree DFS + prefix map", why: "Composes a path-local prefix invariant with recursive backtracking.", skills: ["tree paths", "prefix counts", "state restoration"], tags: ["prefix-hashing", "tree-invariants"] }),

  leetcode({ id: "minimum-window-substring", title: "Minimum Window Substring", difficulty: "Hard", pattern: "Minimum valid window", why: "Tests whether window validity can be updated and minimized without rescanning counts.", skills: ["formed/required state", "shrinking", "minimum range"], tags: ["advanced-sliding-window"] }),
  leetcode({ id: "max-consecutive-ones-iii", title: "Max Consecutive Ones III", difficulty: "Medium", pattern: "At-most-K window", why: "Builds a clean budget-based validity invariant.", skills: ["window budget", "shrink condition", "maximum length"], tags: ["advanced-sliding-window"] }),
  leetcode({ id: "fruit-into-baskets", title: "Fruit Into Baskets", difficulty: "Medium", pattern: "At-most-K distinct window", why: "Uses a frequency map to maintain a categorical window constraint.", skills: ["distinct counts", "frequency cleanup", "variable window"], tags: ["advanced-sliding-window"] }),
  leetcode({ id: "subarrays-with-k-different-integers", title: "Subarrays with K Different Integers", difficulty: "Hard", pattern: "Exactly-K via at-most-K", why: "Requires composing two monotonic counts instead of forcing an exactly-K window.", skills: ["count decomposition", "at-most helper", "subarray counting"], tags: ["advanced-sliding-window"] }),

  leetcode({ id: "koko-eating-bananas", title: "Koko Eating Bananas", difficulty: "Medium", pattern: "Binary search on answer", why: "Makes the monotonic feasibility predicate and answer bounds explicit.", skills: ["feasibility predicate", "bounds", "ceiling division"], tags: ["binary-search-answer"] }),
  leetcode({ id: "capacity-to-ship-packages-within-d-days", title: "Capacity To Ship Packages Within D Days", difficulty: "Medium", pattern: "Binary search on capacity", why: "Separates a greedy feasibility scan from the outer answer search.", skills: ["monotonic feasibility", "greedy simulation", "tight bounds"], tags: ["binary-search-answer"] }),
  leetcode({ id: "split-array-largest-sum", title: "Split Array Largest Sum", difficulty: "Hard", pattern: "Binary search on maximum", why: "Tests whether a minimax objective can be reframed as a yes/no capacity check.", skills: ["minimax reframing", "partition feasibility", "proof"], tags: ["binary-search-answer"] }),
  leetcode({ id: "minimum-number-of-days-to-make-m-bouquets", title: "Minimum Number of Days to Make m Bouquets", difficulty: "Medium", pattern: "Binary search on time", why: "Combines adjacency-aware feasibility with a first-valid-day search.", skills: ["first true", "adjacency runs", "impossible cases"], tags: ["binary-search-answer"] }),

  leetcode({ id: "next-greater-element-ii", title: "Next Greater Element II", difficulty: "Medium", pattern: "Circular monotonic stack", why: "Extends unresolved-candidate stacks to circular traversal without duplicating state.", skills: ["monotonic stack", "circular indexing", "candidate lifetime"], tags: ["monotonic-stack"] }),
  leetcode({ id: "largest-rectangle-in-histogram", title: "Largest Rectangle in Histogram", difficulty: "Hard", pattern: "Monotonic boundary stack", why: "Requires explaining when a bar's maximal span becomes known.", skills: ["monotonic invariant", "boundary widths", "sentinels"], tags: ["monotonic-stack"] }),
  leetcode({ id: "remove-k-digits", title: "Remove K Digits", difficulty: "Medium", pattern: "Greedy monotonic stack", why: "Connects lexicographic improvement to locally removing harmful digits.", skills: ["greedy proof", "monotonic stack", "leading zeros"], tags: ["monotonic-stack", "greedy"] }),

  leetcode({ id: "car-pooling", title: "Car Pooling", difficulty: "Medium", pattern: "Sweep line", why: "Models interval events as deltas and verifies a capacity invariant over ordered positions.", skills: ["difference events", "sorting", "capacity tracking"], tags: ["intervals-sweep"] }),
  leetcode({ id: "my-calendar-i", title: "My Calendar I", difficulty: "Medium", pattern: "Stateful interval set", why: "Turns interval overlap rules into a small mutable API with explicit invariants.", skills: ["interval overlap", "stateful API", "ordered alternatives"], tags: ["intervals-sweep", "stateful-design"] }),

  leetcode({ id: "binary-tree-maximum-path-sum", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", pattern: "Postorder tree DP", why: "Separates the path contribution returned upward from the best complete path seen anywhere.", skills: ["recursive contracts", "global optimum", "negative branches"], tags: ["tree-invariants"] }),
  leetcode({ id: "kth-smallest-element-in-a-bst", title: "Kth Smallest Element in a BST", difficulty: "Medium", pattern: "Ordered tree traversal", why: "Uses the BST ordering invariant and invites augmentation follow-ups.", skills: ["inorder traversal", "early stopping", "subtree-size follow-up"], tags: ["tree-invariants"] }),
  leetcode({ id: "construct-binary-tree-from-preorder-and-inorder-traversal", title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", pattern: "Recursive partitioning", why: "Tests index contracts, map-assisted partitioning, and avoiding repeated slicing.", skills: ["recursive boundaries", "index map", "tree construction"], tags: ["tree-invariants"] }),
  leetcode({ id: "serialize-and-deserialize-binary-tree", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", pattern: "Tree encoding", why: "Requires a reversible representation, precise null handling, and a stable parser contract.", skills: ["encoding design", "recursive parsing", "round-trip invariants"], tags: ["tree-invariants", "stateful-design"] }),

  leetcode({ id: "design-add-and-search-words-data-structure", title: "Design Add and Search Words Data Structure", difficulty: "Medium", pattern: "Trie + wildcard search", why: "Adds controlled branching to a prefix index while preserving API behavior.", skills: ["trie state", "wildcard DFS", "branching complexity"], tags: ["tries"] }),
  leetcode({ id: "replace-words", title: "Replace Words", difficulty: "Medium", pattern: "Trie prefix lookup", why: "Uses early prefix termination to turn a dictionary into an efficient replacement index.", skills: ["prefix termination", "trie construction", "token processing"], tags: ["tries"] }),
  leetcode({ id: "word-search-ii", title: "Word Search II", difficulty: "Hard", pattern: "Trie + backtracking", why: "Composes prefix pruning with grid search and careful state restoration.", skills: ["trie pruning", "backtracking", "deduplication"], tags: ["tries", "backtracking"] }),

  leetcode({ id: "find-eventual-safe-states", title: "Find Eventual Safe States", difficulty: "Medium", pattern: "Reverse topological sort", why: "Reframes eventual safety as eliminating nodes that can reach no cycle.", skills: ["reverse graph", "outdegree", "cycle reasoning"], tags: ["topological-sort"] }),
  leetcode({ id: "redundant-connection", title: "Redundant Connection", difficulty: "Medium", pattern: "Union Find cycle detection", why: "Makes disjoint-set cycle detection concrete in an incrementally built graph.", skills: ["union/find", "cycle detection", "path compression"], tags: ["union-find"] }),
  leetcode({ id: "accounts-merge", title: "Accounts Merge", difficulty: "Medium", pattern: "Union Find + grouping", why: "Composes identity modeling, connectivity, and deterministic output grouping.", skills: ["entity mapping", "union/find", "component aggregation"], tags: ["union-find", "multi-pattern"] }),
  leetcode({ id: "most-stones-removed-with-same-row-or-column", title: "Most Stones Removed with Same Row or Column", difficulty: "Medium", pattern: "Connectivity counting", why: "Requires discovering a graph model and relating removable items to component count.", skills: ["implicit graph", "components", "count invariant"], tags: ["union-find"] }),

  leetcode({ id: "path-with-minimum-effort", title: "Path With Minimum Effort", difficulty: "Medium", pattern: "Minimax Dijkstra", why: "Changes path aggregation from sum to maximum while retaining best-first relaxation.", skills: ["Dijkstra variants", "minimax cost", "grid graph"], tags: ["shortest-paths"] }),
  leetcode({ id: "cheapest-flights-within-k-stops", title: "Cheapest Flights Within K Stops", difficulty: "Medium", pattern: "Bounded shortest path", why: "Forces distance state to include the stop budget rather than one value per node.", skills: ["state modeling", "bounded relaxation", "trade-offs"], tags: ["shortest-paths"] }),
  leetcode({ id: "swim-in-rising-water", title: "Swim in Rising Water", difficulty: "Hard", pattern: "Minimax graph search", why: "Connects threshold feasibility and best-first traversal through a non-additive path cost.", skills: ["minimax paths", "priority queues", "visited timing"], tags: ["shortest-paths"] }),
  leetcode({ id: "path-with-maximum-probability", title: "Path with Maximum Probability", difficulty: "Medium", pattern: "Maximum-product Dijkstra", why: "Demonstrates that Dijkstra applies when the path score has the right monotonic property.", skills: ["max heap", "probability relaxation", "termination proof"], tags: ["shortest-paths"] }),
  leetcode({ id: "min-cost-to-connect-all-points", title: "Min Cost to Connect All Points", difficulty: "Medium", pattern: "Minimum spanning tree", why: "Distinguishes global connectivity cost from shortest paths between endpoints.", skills: ["Prim/Kruskal", "cut intuition", "complexity comparison"], tags: ["minimum-spanning-tree"] }),

  leetcode({ id: "find-median-from-data-stream", title: "Find Median from Data Stream", difficulty: "Hard", pattern: "Two heaps", why: "Maintains a balance invariant across updates and supports a constant-time median query.", skills: ["heap partition", "rebalance invariant", "streaming API"], tags: ["heaps-streaming", "stateful-design"] }),
  leetcode({ id: "merge-k-sorted-lists", title: "Merge k Sorted Lists", difficulty: "Hard", pattern: "K-way heap merge", why: "Uses a heap to expose only the next candidate from each sorted source.", skills: ["min heap", "k-way merge", "linked-list handling"], tags: ["heaps-streaming"] }),
  leetcode({ id: "task-scheduler", title: "Task Scheduler", difficulty: "Medium", pattern: "Greedy scheduling + heap", why: "Supports multiple approaches and tests scheduling invariants around cooldown slots.", skills: ["frequency counts", "heap scheduling", "closed-form alternative"], tags: ["heaps-streaming", "greedy", "multi-pattern"] }),
  leetcode({ id: "reorganize-string", title: "Reorganize String", difficulty: "Medium", pattern: "Greedy max heap", why: "Maintains the best available candidate while delaying the previously used character.", skills: ["max heap", "cooldown state", "impossibility condition"], tags: ["heaps-streaming", "greedy"] }),

  leetcode({ id: "house-robber-ii", title: "House Robber II", difficulty: "Medium", pattern: "Circular take/skip DP", why: "Reduces a circular constraint to two carefully bounded linear recurrences.", skills: ["case decomposition", "1-D DP", "boundary handling"], tags: ["dynamic-programming"] }),
  leetcode({ id: "decode-ways", title: "Decode Ways", difficulty: "Medium", pattern: "Prefix DP", why: "Tests precise transition validity and zeros instead of pattern memorization.", skills: ["state definition", "transition guards", "edge cases"], tags: ["dynamic-programming"] }),
  leetcode({ id: "minimum-path-sum", title: "Minimum Path Sum", difficulty: "Medium", pattern: "Grid DP", why: "Builds cost aggregation and safe traversal order in a two-dimensional state space.", skills: ["2-D recurrence", "base row/column", "space optimization"], tags: ["dynamic-programming"] }),
  leetcode({ id: "partition-equal-subset-sum", title: "Partition Equal Subset Sum", difficulty: "Medium", pattern: "0/1 knapsack", why: "Turns a partition question into bounded subset feasibility and correct reverse iteration.", skills: ["knapsack state", "reverse iteration", "early impossibility"], tags: ["dynamic-programming"] }),
  leetcode({ id: "target-sum", title: "Target Sum", difficulty: "Medium", pattern: "Counting DP", why: "Invites both signed-state memoization and an algebraic subset-sum reduction.", skills: ["state transformation", "counting", "memoization"], tags: ["dynamic-programming"] }),
  leetcode({ id: "longest-increasing-subsequence", title: "Longest Increasing Subsequence", difficulty: "Medium", pattern: "Sequence DP / binary tails", why: "Creates a high-signal comparison between an intuitive quadratic DP and optimized tails invariant.", skills: ["sequence DP", "binary search", "invariant comparison"], tags: ["dynamic-programming"] }),
  leetcode({ id: "longest-common-subsequence", title: "Longest Common Subsequence", difficulty: "Medium", pattern: "2-D sequence DP", why: "Builds a reusable two-sequence state and dependency order.", skills: ["2-D state", "match/skip transitions", "space optimization"], tags: ["dynamic-programming"] }),
  leetcode({ id: "palindromic-substrings", title: "Palindromic Substrings", difficulty: "Medium", pattern: "Expand centers / interval DP", why: "Provides two strong approaches with different implementation and extension trade-offs.", skills: ["center expansion", "interval state", "counting"], tags: ["dynamic-programming"] }),
  leetcode({ id: "edit-distance", title: "Edit Distance", difficulty: "Medium", pattern: "2-D transformation DP", why: "Requires a precise state meaning for insert, delete, and replace transitions.", skills: ["2-D recurrence", "operation modeling", "base cases"], tags: ["dynamic-programming"] }),

  leetcode({ id: "combination-sum-ii", title: "Combination Sum II", difficulty: "Medium", pattern: "Sorted backtracking + dedupe", why: "Tests duplicate control at one decision depth while each candidate can be used once.", skills: ["backtracking", "deduplication", "pruning"], tags: ["backtracking"] }),
  leetcode({ id: "word-search", title: "Word Search", difficulty: "Medium", pattern: "Grid backtracking", why: "Requires local mutation, restoration, and early pruning on a constrained path.", skills: ["grid DFS", "state restoration", "pruning"], tags: ["backtracking"] }),
  leetcode({ id: "palindrome-partitioning", title: "Palindrome Partitioning", difficulty: "Medium", pattern: "Partition backtracking", why: "Combines variable-length choices with a validity predicate and output construction.", skills: ["partition choices", "palindrome checks", "backtracking"], tags: ["backtracking"] }),
  leetcode({ id: "n-queens", title: "N-Queens", difficulty: "Hard", pattern: "Constraint backtracking", why: "Makes pruning state explicit across columns and diagonals.", skills: ["constraint sets", "search tree", "state restoration"], tags: ["backtracking"] }),

  leetcode({ id: "jump-game-ii", title: "Jump Game II", difficulty: "Medium", pattern: "Greedy range BFS", why: "Turns reachability into the minimum number of expanding frontiers with a clear level invariant.", skills: ["greedy frontier", "minimum jumps", "range reasoning"], tags: ["greedy"] }),
  leetcode({ id: "partition-labels", title: "Partition Labels", difficulty: "Medium", pattern: "Greedy last occurrence", why: "Uses future occurrence boundaries to make the earliest safe cut.", skills: ["last positions", "greedy boundary", "partition proof"], tags: ["greedy"] }),

  leetcode({ id: "lru-cache", title: "LRU Cache", difficulty: "Medium", pattern: "Hash map + doubly linked list", why: "The canonical stateful design exercise for composing O(1) lookup, recency updates, and eviction.", skills: ["API invariants", "linked-list mutation", "hash indexing"], tags: ["stateful-design", "multi-pattern"] }),
  leetcode({ id: "time-based-key-value-store", title: "Time Based Key-Value Store", difficulty: "Medium", pattern: "Versioned map + binary search", why: "Models append-only time-indexed state and query semantics before choosing binary search.", skills: ["API design", "versioned values", "binary search"], tags: ["stateful-design"] }),
  leetcode({ id: "insert-delete-getrandom-o1", title: "Insert Delete GetRandom O(1)", difficulty: "Medium", pattern: "Array + index map", why: "Uses swap-delete to reconcile constant-time random access with constant-time removal.", skills: ["swap-delete", "index maintenance", "API invariants"], tags: ["stateful-design"] }),
  leetcode({ id: "design-authentication-manager", title: "Design Authentication Manager", difficulty: "Medium", pattern: "TTL state management", why: "Exercises expiring state, operation contracts, and lazy-cleanup trade-offs.", skills: ["TTL semantics", "state cleanup", "API design"], tags: ["stateful-design"] }),

  leetcode({ id: "reconstruct-itinerary", title: "Reconstruct Itinerary", difficulty: "Hard", pattern: "Eulerian path + ordered traversal", why: "Requires recognizing edge consumption, lexical ordering, and a non-obvious postorder construction.", skills: ["Eulerian path", "ordered adjacency", "postorder"], tags: ["multi-pattern", "graphs"] }),
  leetcode({ id: "word-ladder", title: "Word Ladder", difficulty: "Hard", pattern: "Implicit graph BFS", why: "Combines graph modeling, neighbor generation, and shortest unweighted transitions.", skills: ["implicit graph", "BFS", "neighbor indexing"], tags: ["multi-pattern", "graphs"] }),
] as const;

export function assertSde2ProblemRegistryIntegrity() {
  const ids = sde2Problems.map((problem) => problem.id);
  if (new Set(ids).size !== ids.length) throw new Error("SDE II additions contain duplicate IDs.");
  for (const problem of sde2Problems) {
    if (problem.source !== "leetcode" || problem.slug !== problem.id || problem.url !== `https://leetcode.com/problems/${problem.id}/`) throw new Error(`${problem.id} does not use its canonical LeetCode URL.`);
    if (!problem.topicTags?.length || !problem.skills?.length || !problem.whyItMatters) throw new Error(`${problem.id} needs complete canonical metadata.`);
  }
}

assertSde2ProblemRegistryIntegrity();
