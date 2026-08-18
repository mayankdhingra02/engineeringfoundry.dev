import type { RoadmapProblem } from "./level-roadmaps.ts";

type Seed = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  pattern: string;
  why: string;
  skills: string[];
  tags: string[];
};

function leetcode(seed: Seed): RoadmapProblem {
  return {
    id: seed.id,
    title: seed.title,
    slug: seed.id,
    url: `https://leetcode.com/problems/${seed.id}/`,
    difficulty: seed.difficulty,
    classification: "practice",
    pattern: seed.pattern,
    whyItMatters: seed.why,
    skills: seed.skills,
    topicTags: seed.tags,
    source: "leetcode",
  };
}

export const sde3Problems: readonly RoadmapProblem[] = [
  leetcode({ id: "lfu-cache", title: "LFU Cache", difficulty: "Hard", pattern: "Frequency buckets + recency lists", why: "The difficulty is synchronizing key lookup, frequency groups, recency ties, and minimum-frequency state after every mutation.", skills: ["multi-structure invariants", "frequency eviction", "O(1) mutation"], tags: ["stateful-design", "caching"] }),
  leetcode({ id: "all-oone-data-structure", title: "All O`one Data Structure", difficulty: "Hard", pattern: "Bucketed frequency list", why: "An advanced state-management drill where minimum, maximum, buckets, and key positions must stay synchronized in O(1).", skills: ["bucket lists", "hash indexing", "boundary mutation"], tags: ["stateful-design", "advanced"] }),
  leetcode({ id: "my-calendar-ii", title: "My Calendar II", difficulty: "Medium", pattern: "Mutable interval overlap state", why: "Moves calendar state from pairwise conflicts to bounded overlap while keeping updates reversible when a booking fails.", skills: ["interval deltas", "rollback", "mutable API"], tags: ["mutable-intervals", "stateful-design"] }),
  leetcode({ id: "snapshot-array", title: "Snapshot Array", difficulty: "Medium", pattern: "Sparse versioned storage", why: "Avoids copying the full array by storing only version changes and searching historical values.", skills: ["versioned state", "sparse history", "boundary binary search"], tags: ["time-indexed-data", "stateful-design"] }),
  leetcode({ id: "design-twitter", title: "Design Twitter", difficulty: "Medium", pattern: "Stateful API + K-way feed merge", why: "Combines API contracts, mutable relationships, append-only histories, and bounded feed assembly.", skills: ["API modeling", "heap merge", "state ownership"], tags: ["stateful-design", "heaps-streaming"] }),
  leetcode({ id: "sliding-window-maximum", title: "Sliding Window Maximum", difficulty: "Hard", pattern: "Monotonic deque", why: "Makes candidate lifetime, online updates, and amortized O(n) reasoning explicit.", skills: ["deque invariant", "amortized analysis", "streaming windows"], tags: ["monotonic-structures", "streaming"] }),
  leetcode({ id: "stock-price-fluctuation", title: "Stock Price Fluctuation", difficulty: "Medium", pattern: "Heap + version map", why: "Demonstrates why heaps need an index or version map when updates invalidate arbitrary historical entries.", skills: ["lazy deletion", "versioned updates", "extreme queries"], tags: ["heaps-streaming", "time-indexed-data"] }),
  leetcode({ id: "number-of-recent-calls", title: "Number of Recent Calls", difficulty: "Easy", pattern: "Streaming time window", why: "A compact online-state exercise: retain only timestamps that can still affect future queries.", skills: ["deque", "expiry", "online processing"], tags: ["streaming"] }),
  leetcode({ id: "data-stream-as-disjoint-intervals", title: "Data Stream as Disjoint Intervals", difficulty: "Hard", pattern: "Ordered mutable intervals", why: "Tests incremental merging and the choice of an ordered index for interleaved updates and queries.", skills: ["ordered state", "interval merging", "API invariants"], tags: ["mutable-intervals", "advanced"] }),
  leetcode({ id: "range-module", title: "Range Module", difficulty: "Hard", pattern: "Mutable range index", why: "An advanced workload-driven structure for adding, removing, and querying covered ranges without assuming a static sort.", skills: ["range updates", "ordered intervals", "query invariants"], tags: ["mutable-intervals", "advanced"] }),
  leetcode({ id: "critical-connections-in-a-network", title: "Critical Connections in a Network", difficulty: "Hard", pattern: "DFS discovery + low-link", why: "Connects graph invariants to identifying edges whose removal breaks connectivity.", skills: ["discovery order", "low-link reasoning", "bridge detection"], tags: ["graph-criticality", "advanced-graphs"] }),
  leetcode({ id: "search-suggestions-system", title: "Search Suggestions System", difficulty: "Medium", pattern: "Sorted prefix bounds / trie", why: "Supports a strong comparison between static binary-search indexes, tries, and precomputed ranked suggestions.", skills: ["prefix bounds", "index trade-offs", "ranking extension"], tags: ["tries-indexing", "search-ranking"] }),
  leetcode({ id: "word-break", title: "Word Break", difficulty: "Medium", pattern: "Prefix feasibility DP", why: "A focused DP fluency check that requires a clear state definition and substring-cost awareness.", skills: ["state definition", "prefix transitions", "memoization trade-offs"], tags: ["dynamic-programming"] }),
  leetcode({ id: "burst-balloons", title: "Burst Balloons", difficulty: "Hard", pattern: "Interval dynamic programming", why: "A deliberately optional advanced DP drill for changing the decision perspective from first action to last action.", skills: ["interval state", "boundary sentinels", "transition order"], tags: ["dynamic-programming", "advanced"] }),
  leetcode({ id: "range-sum-query-mutable", title: "Range Sum Query — Mutable", difficulty: "Medium", pattern: "Fenwick / segment tree", why: "Represents the point-update plus range-query workload without making advanced trees mandatory for general senior interviews.", skills: ["range aggregation", "point updates", "structure comparison"], tags: ["advanced-range-structures"] }),
  leetcode({ id: "single-number-ii", title: "Single Number II", difficulty: "Medium", pattern: "Bit-state counting", why: "A specialized constant-space bit invariant that belongs in role-dependent advanced practice.", skills: ["bit counts", "finite-state reasoning", "constant space"], tags: ["advanced-bit-manipulation"] }),
] as const;

export function assertSde3ProblemRegistryIntegrity() {
  const ids = sde3Problems.map((problem) => problem.id);
  if (new Set(ids).size !== ids.length) throw new Error("SDE III+ additions contain duplicate IDs.");
  for (const problem of sde3Problems) {
    if (problem.source !== "leetcode" || problem.slug !== problem.id || problem.url !== `https://leetcode.com/problems/${problem.id}/`) throw new Error(`${problem.id} does not use its canonical LeetCode URL.`);
    if (!problem.whyItMatters || !problem.skills?.length || !problem.topicTags?.length) throw new Error(`${problem.id} needs complete canonical metadata.`);
  }
}

assertSde3ProblemRegistryIntegrity();
