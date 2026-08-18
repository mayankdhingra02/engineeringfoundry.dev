import type { AlternativeApproach, CategorizedFollowUp, DSARoadmap, ProblemClassification, RoadmapModule, RoadmapProblemAssignment, RoadmapTopic, TopicPriority } from "./level-roadmaps.ts";

type TopicInput = Omit<RoadmapTopic, "priority" | "completionRequired"> & { priority?: TopicPriority; completionRequired?: boolean };
const topic = (input: TopicInput): RoadmapTopic => ({ priority: "core", completionRequired: true, ...input });

const coreIds = [
  "product-of-array-except-self", "search-in-rotated-sorted-array", "binary-tree-maximum-path-sum", "number-of-islands",
  "top-k-frequent-elements", "course-schedule", "network-delay-time", "longest-increasing-subsequence", "lru-cache",
  "insert-delete-getrandom-o1", "time-based-key-value-store", "design-authentication-manager", "my-calendar-i",
  "find-median-from-data-stream", "kth-largest-element-in-a-stream", "task-scheduler", "accounts-merge",
  "cheapest-flights-within-k-stops", "path-with-minimum-effort", "number-of-provinces", "redundant-connection",
  "implement-trie-prefix-tree", "house-robber", "coin-change", "longest-common-subsequence", "edit-distance",
  "koko-eating-bananas", "my-calendar-ii", "snapshot-array", "sliding-window-maximum", "search-suggestions-system", "word-break",
] as const;

const practiceIds = [
  "reorganize-string", "reconstruct-itinerary", "word-ladder", "swim-in-rising-water", "path-with-maximum-probability",
  "most-stones-removed-with-same-row-or-column", "design-add-and-search-words-data-structure", "word-search-ii", "course-schedule-ii",
  "lfu-cache", "design-twitter", "stock-price-fluctuation", "number-of-recent-calls", "critical-connections-in-a-network",
] as const;

const stretchIds = [
  "all-oone-data-structure", "data-stream-as-disjoint-intervals", "range-module", "burst-balloons", "range-sum-query-mutable", "single-number-ii",
] as const;

const followUps = (...items: CategorizedFollowUp[]) => items;

const tradeoffs: Record<string, AlternativeApproach[]> = {
  "top-k-frequent-elements": [
    { title: "Full sort", time: "O(n log n)", space: "O(n)", whenUseful: "The dataset is already in memory and simplicity matters." },
    { title: "Heap of K", time: "O(n log k)", space: "O(n) + O(k)", whenUseful: "k is much smaller than the number of candidates." },
    { title: "Buckets", time: "O(n)", space: "O(n)", whenUseful: "Frequency is bounded by input size and memory is acceptable." },
    { title: "Bounded stream state", time: "Update-dependent", space: "Bounded / approximate", whenUseful: "The history cannot be retained and exactness is negotiable." },
  ],
  "sliding-window-maximum": [
    { title: "Monotonic deque", time: "O(n)", space: "O(k)", whenUseful: "Window size is fixed and values arrive in order." },
    { title: "Heap + lazy deletion", time: "O(n log n)", space: "O(n)", whenUseful: "A priority queue is easier to adapt but stale entries need validation." },
  ],
  "search-suggestions-system": [
    { title: "Sorted array + prefix bounds", time: "O(log n + k)", space: "Low extra", whenUseful: "The catalog is mostly static." },
    { title: "Trie", time: "O(prefix + k)", space: "High", whenUseful: "Prefix navigation is frequent and memory is acceptable." },
    { title: "Precomputed Top-K per node", time: "Fast reads", space: "High", whenUseful: "Reads dominate and ranking changes infrequently." },
  ],
  "design-twitter": [
    { title: "Collect and sort", time: "High per read", space: "Low extra state", whenUseful: "Small follow sets make the simple baseline sufficient." },
    { title: "K-way heap merge", time: "O(limit log follows)", space: "O(follows)", whenUseful: "Per-user histories are ordered and feeds are assembled on read." },
  ],
  "lru-cache": [
    { title: "Coarse lock", time: "Simple contention", space: "Low overhead", whenUseful: "Correctness and maintainability dominate peak concurrency." },
    { title: "Partitioned cache", time: "Parallel by shard", space: "Per-shard metadata", whenUseful: "Key partitioning can reduce lock contention and approximate global LRU is acceptable." },
  ],
};

const rich: Record<string, Omit<RoadmapProblemAssignment, "problemId" | "classification">> = {
  "lru-cache": {
    levelRationale: "Senior depth comes from defining ownership and recency invariants, then reasoning about races, TTL, durability, partitioning, and hot keys without losing the O(1) core.",
    invariants: ["The linked list is ordered from most recently used to least recently used.", "Every cached key maps to exactly one linked-list node.", "The list size never exceeds capacity after put completes."],
    categorizedFollowUps: followUps(
      { category: "concurrency", prompt: "get() mutates recency. Which state needs protection, and would a coarse lock be acceptable?" },
      { category: "persistence", prompt: "What changes if cache state must survive process restart?" },
      { category: "scale", prompt: "If capacity is distributed across machines, where should eviction decisions happen?" },
      { category: "failure", prompt: "How do TTL expiry, hot keys, and background cleanup interact with the list invariant?" },
    ),
    failureChecks: ["Duplicate nodes for one key", "Dangling previous/next pointers", "Incorrect head or tail updates", "Capacity-zero boundary behavior"],
    apiContract: { operations: ["get(key) → value or miss", "put(key, value)"], complexityGoals: ["O(1) lookup", "O(1) recency update and eviction"], assumptions: ["Capacity is fixed and non-negative", "Thread safety is a follow-up, not assumed"] },
    alternativeApproaches: tradeoffs["lru-cache"], alternativeLabel: "Engineering trade-offs",
    designBridge: { title: "Where this appears in systems: caching and eviction", points: ["Expiration and capacity eviction are separate policies.", "Metadata overhead matters when values are small.", "Distributed caches may trade exact global recency for partition-local decisions."], href: "/system-design/fundamentals/eviction-policies", linkLabel: "Study cache eviction" },
  },
  "lfu-cache": {
    levelRationale: "The hard part is synchronized mutation across key lookup, frequency buckets, recency ties, and minimum frequency—not the individual containers.",
    invariants: ["Every key belongs to exactly one frequency bucket.", "Keys within a bucket are ordered by recency.", "minFrequency identifies the lowest non-empty bucket."],
    categorizedFollowUps: followUps(
      { category: "alternative", prompt: "When does LFU outperform LRU, and when does stale popularity make it worse?" },
      { category: "memory", prompt: "How much metadata is required per entry and per active frequency?" },
      { category: "scale", prompt: "How might a large cache approximate or decay historical frequency?" },
    ),
    failureChecks: ["Leaving an empty frequency bucket behind", "Failing to advance minimum frequency", "Breaking recency ties inside a bucket"],
    designBridge: { title: "Where this appears in systems: frequency-aware eviction", points: ["Frequency can preserve repeatedly useful entries.", "Historical counts often need aging or decay.", "Approximate admission policies may be cheaper at large scale."], href: "/system-design/fundamentals/eviction-policies", linkLabel: "Compare eviction policies" },
  },
  "all-oone-data-structure": {
    levelRationale: "Use this as an advanced state-management drill, not a universal senior readiness gate.",
    invariants: ["Frequency buckets are strictly ordered.", "Every key appears in exactly one bucket.", "Minimum and maximum keys are available from the boundary buckets."],
    failureChecks: ["Orphaned empty bucket", "Key present in multiple buckets", "Broken boundary pointer after deletion"],
  },
  "find-median-from-data-stream": {
    levelRationale: "State the partition invariant first, then discuss synchronization, bounded memory, and when exact quantiles stop being worth their cost.",
    invariants: ["The heaps differ in size by at most one.", "Every value in the lower max-heap is less than or equal to every value in the upper min-heap."],
    categorizedFollowUps: followUps(
      { category: "concurrency", prompt: "What atomicity is required if updates and median reads interleave?" },
      { category: "memory", prompt: "Can exact median be maintained without retaining all values?" },
      { category: "approximation", prompt: "At distributed scale, when would an approximate quantile sketch be acceptable?" },
    ),
    failureChecks: ["Heap sizes drift by more than one", "Lower-half maximum exceeds upper-half minimum", "Median arithmetic overflows before conversion"],
    designBridge: { title: "Where this appears in systems: streaming statistics", points: ["Exact global quantiles are expensive to merge.", "Windowed statistics add expiry or deletion.", "Approximation can bound memory and communication."], href: "/system-design/fundamentals/time-series-databases", linkLabel: "Study time-series storage" },
  },
  "sliding-window-maximum": {
    levelRationale: "This is a compact senior exercise in candidate lifetime, amortized reasoning, online processing, and heap-versus-deque trade-offs.",
    invariants: ["Deque indices are inside the current window.", "Their values are monotonically decreasing from front to back.", "The front is the maximum for the current window."],
    categorizedFollowUps: followUps(
      { category: "alternative", prompt: "Compare a heap with lazy deletion to the monotonic deque." },
      { category: "streaming", prompt: "What state is retained when values arrive continuously?" },
      { category: "mutation", prompt: "What changes if the window size changes dynamically?" },
    ),
    alternativeApproaches: tradeoffs["sliding-window-maximum"], alternativeLabel: "Engineering trade-offs",
    designBridge: { title: "Where this appears in systems: rolling metrics", points: ["Event-time windows may receive late data.", "Large-scale aggregation partitions state by key.", "Retention should match the longest query window."], href: "/system-design/problems/metrics-platform", linkLabel: "Open Metrics Platform design" },
  },
  "top-k-frequent-elements": {
    levelRationale: "The senior signal is selecting batch, bounded-state, or approximate processing from the workload rather than defaulting to one accepted algorithm.",
    categorizedFollowUps: followUps(
      { category: "streaming", prompt: "What state must be retained when updates never stop?" },
      { category: "memory", prompt: "Can the solution retain K candidates instead of all observations?" },
      { category: "approximation", prompt: "If exact heavy hitters are too expensive, what error could the product tolerate?" },
      { category: "scale", prompt: "How would partial Top-K results be merged across partitions?" },
    ),
    alternativeApproaches: tradeoffs["top-k-frequent-elements"], alternativeLabel: "Engineering trade-offs",
    designBridge: { title: "Where this appears in systems: ranking and analytics", points: ["Partition-local candidates can be merged into a global ranking.", "Time windows change retained state.", "Approximate heavy hitters can reduce memory."], href: "/system-design/specialized/leaderboards-top-k", linkLabel: "Study Leaderboards / Top-K" },
  },
  "time-based-key-value-store": {
    levelRationale: "Treat timestamps and ordering as API assumptions, then reason about retention, out-of-order writes, compaction, and disk-backed indexes.",
    invariants: ["Each key's versions are ordered by timestamp under the stated write contract.", "A lookup returns the newest version whose timestamp is not greater than the query."],
    categorizedFollowUps: followUps(
      { category: "mutation", prompt: "What if timestamps arrive out of order?" },
      { category: "memory", prompt: "What if historical versions are retained forever?" },
      { category: "persistence", prompt: "How would the index change if values live on disk?" },
    ),
    failureChecks: ["Assuming sorted timestamps without an API guarantee", "Using the wrong upper-bound result", "Unbounded history without retention"],
    apiContract: { operations: ["set(key, value, timestamp)", "get(key, timestamp) → latest eligible value"], complexityGoals: ["Append or indexed write", "Logarithmic historical lookup"], assumptions: ["Timestamp ordering must be explicit", "Retention is initially unbounded"] },
    designBridge: { title: "Where this appears in systems: versioned data", points: ["Retention and compaction control historical growth.", "Out-of-order writes affect index choice.", "Disk-backed storage adds pages, caching, and recovery."], href: "/system-design/problems/key-value-store", linkLabel: "Open Key-Value Store design" },
  },
  "snapshot-array": {
    levelRationale: "Sparse version storage demonstrates how a strong representation avoids full-copy cost while preserving historical reads.",
    invariants: ["Each index stores changes ordered by snapshot id.", "Reading snapshot s returns the latest change with id ≤ s."],
    categorizedFollowUps: followUps(
      { category: "memory", prompt: "When can adjacent equal versions be coalesced?" },
      { category: "persistence", prompt: "How would snapshots and compaction work on disk?" },
    ),
    failureChecks: ["Copying the entire array for every snapshot", "Wrong historical binary-search boundary", "Recording redundant writes in one snapshot"],
    apiContract: { operations: ["set(index, value)", "snap() → snapshot id", "get(index, snapshot id)"], complexityGoals: ["Avoid O(n) snapshot copies", "Logarithmic historical lookup"], assumptions: ["Snapshot ids are monotonically increasing"] },
    designBridge: { title: "Where this appears in systems: sparse version histories", points: ["Copy-on-write avoids copying unchanged data.", "Compaction can coalesce redundant historical state.", "Durability adds snapshot metadata and recovery."], href: "/system-design/fundamentals/database-indexes", linkLabel: "Study database indexes" },
  },
  "search-suggestions-system": {
    levelRationale: "Use this to compare static ordered indexes, tries, and precomputation before discussing ranking freshness and personalization.",
    categorizedFollowUps: followUps(
      { category: "mutation", prompt: "What changes when products update continuously?" },
      { category: "memory", prompt: "How much memory does prefix expansion or precomputed Top-K consume?" },
      { category: "scale", prompt: "How would popularity, locale, or personalization change ranking and caching?" },
    ),
    alternativeApproaches: tradeoffs["search-suggestions-system"], alternativeLabel: "Engineering trade-offs",
    designBridge: { title: "Where this appears in systems: autocomplete and search indexing", points: ["Static catalogs favor sorted indexes and offline precomputation.", "Fresh ranking makes updates more expensive.", "Personalization changes cache keys and candidate merging."], href: "/system-design/specialized/search-autocomplete", linkLabel: "Study Search Autocomplete" },
  },
  "implement-trie-prefix-tree": {
    invariants: ["Each path from the root represents a prefix.", "Terminal markers distinguish complete keys from prefixes."],
    categorizedFollowUps: followUps(
      { category: "memory", prompt: "Array children or hashmap children: which is cheaper for this alphabet and sparsity?" },
      { category: "scale", prompt: "What changes when popular prefixes are cached or ranking metadata is attached?" },
    ),
    designBridge: { title: "Where this appears in systems: prefix indexing", points: ["Compressed prefixes reduce node overhead.", "Ranking requires metadata beyond membership.", "A hashmap is simpler when only complete-key lookup is needed."], href: "/system-design/specialized/tries-prefix-search", linkLabel: "Study Tries / Prefix Search" },
  },
  "stock-price-fluctuation": {
    invariants: ["The timestamp map holds the current value for every timestamp.", "Heap entries are valid only when they match the current map version."],
    categorizedFollowUps: followUps(
      { category: "memory", prompt: "When and how should stale heap entries be compacted?" },
      { category: "streaming", prompt: "Which queries require ordered state versus only extreme values?" },
    ),
    failureChecks: ["Returning a stale heap value", "Incorrect latest timestamp after correction", "Unbounded stale heap growth"],
  },
  "my-calendar-i": {
    invariants: ["Stored bookings never overlap under half-open interval semantics."],
    categorizedFollowUps: followUps(
      { category: "concurrency", prompt: "How can concurrent conflict checks and inserts become atomic?" },
      { category: "scale", prompt: "When does a linear scan require an ordered interval index?" },
    ),
    apiContract: { operations: ["book(start, end) → accepted"], complexityGoals: ["Conflict detection consistent with expected booking volume"], assumptions: ["Intervals are half-open", "Concurrent booking is a follow-up"] },
    designBridge: { title: "Where this appears in systems: reservation conflicts", points: ["Conflict detection and insertion must be atomic.", "Time zones and recurrence belong in the domain model.", "Large booking sets need an ordered index."], href: "/system-design/problems/ticketmaster", linkLabel: "Open Reservation System design" },
  },
  "my-calendar-ii": {
    invariants: ["No point in time is covered by more than two accepted bookings.", "A rejected booking leaves all maintained state unchanged."],
    categorizedFollowUps: followUps({ category: "concurrency", prompt: "How would two simultaneous bookings avoid jointly creating a triple booking?" }, { category: "alternative", prompt: "Compare overlap lists, sweep deltas, and an interval tree." }),
    failureChecks: ["Failing to roll back a rejected delta update", "Mishandling equal endpoints", "Quadratic overlap growth without acknowledging it"],
  },
  "design-authentication-manager": {
    invariants: ["A token is valid exactly when its stored expiry is greater than the query time."],
    categorizedFollowUps: followUps({ category: "concurrency", prompt: "How can expiry cleanup and renewal race?" }, { category: "memory", prompt: "Can expired tokens be discarded without scanning every token?" }, { category: "persistence", prompt: "What state must survive restart?" }),
    apiContract: { operations: ["generate(token, time)", "renew(token, time)", "countUnexpiredTokens(time)"], complexityGoals: ["Avoid a full scan on every count when scale requires it"], assumptions: ["Time is monotonic unless explicitly changed"] },
  },
  "design-twitter": {
    levelRationale: "Keep the coding scope to API state and feed assembly, then use follow-ups to compare read/write fan-out, pagination, and celebrity behavior.",
    invariants: ["Tweet sequence values establish a total recency order.", "Follow relationships do not duplicate candidates.", "Feed assembly returns at most the requested newest items."],
    categorizedFollowUps: followUps({ category: "alternative", prompt: "Compare collect-and-sort with a K-way heap merge." }, { category: "scale", prompt: "Fan-out-on-read or fan-out-on-write: what changes for celebrity accounts?" }, { category: "persistence", prompt: "How are feed pagination and storage growth handled?" }, { category: "failure", prompt: "What consistency is acceptable if follow updates and tweet reads race?" }),
    apiContract: { operations: ["postTweet(user, tweet)", "getNewsFeed(user)", "follow(user, target)", "unfollow(user, target)"], complexityGoals: ["Bound feed output", "Avoid sorting unbounded global history"], assumptions: ["Single-process state for the coding problem", "Production distribution is discussion-only"] },
    alternativeApproaches: tradeoffs["design-twitter"], alternativeLabel: "Engineering trade-offs",
    designBridge: { title: "Where this appears in systems: feed assembly", points: ["Read versus write fan-out shifts cost and freshness.", "Celebrity accounts create skew.", "Pagination requires a stable cursor or ordering key."], href: "/system-design/problems/news-feed", linkLabel: "Open News Feed design" },
  },
  "course-schedule": {
    categorizedFollowUps: followUps({ category: "mutation", prompt: "What if dependencies change after an ordering is computed?" }, { category: "failure", prompt: "How would you return the actual cycle instead of only false?" }, { category: "scale", prompt: "How could independent ready tasks be executed in parallel?" }),
    designBridge: { title: "Where this appears in systems: dependency execution", points: ["Partial recomputation matters when edges change.", "Ready nodes expose available parallelism.", "Cycle reporting improves operational debugging."] },
  },
  "network-delay-time": {
    categorizedFollowUps: followUps({ category: "correctness", prompt: "Which property of nonnegative weights makes Dijkstra safe?" }, { category: "mutation", prompt: "What changes if edge costs update during queries?" }, { category: "scale", prompt: "How might a graph be partitioned without hiding cross-partition routes?" }),
    designBridge: { title: "Where this appears in systems: routing and path planning", points: ["The graph model and weight meaning determine the algorithm.", "Changing topology may invalidate precomputed paths.", "Partition boundaries add coordination and stale-route concerns."] },
  },
  "cheapest-flights-within-k-stops": {
    invariants: ["The state includes both current node and used/remaining edge budget.", "A cheaper path with too many stops cannot dominate a valid bounded path."],
    failureChecks: ["Collapsing all states for one node into one distance", "Off-by-one between stops and edges", "Incorrect early termination"],
  },
  "accounts-merge": {
    categorizedFollowUps: followUps({ category: "mutation", prompt: "Why is Union Find attractive when links are added incrementally?" }, { category: "failure", prompt: "Why are edge deletions difficult for basic Union Find?" }, { category: "scale", prompt: "What identity and partition keys would make distributed grouping difficult?" }),
    failureChecks: ["Unioning non-root parents", "Losing the canonical owner metadata", "Counting components before all unions complete"],
  },
  "critical-connections-in-a-network": {
    levelRationale: "The useful senior idea is whether a subtree can reach an earlier ancestor without the parent edge—not memorizing Tarjan terminology.",
    invariants: ["discovery[node] records first-visit order.", "low[node] is the earliest discovery reachable from the subtree without using the parent edge."],
    categorizedFollowUps: followUps({ category: "correctness", prompt: "Why does low[child] > discovery[parent] make the connecting edge critical?" }, { category: "scale", prompt: "What could a bridge represent in a physical or service network?" }),
    designBridge: { title: "Where this appears in systems: topology resilience", points: ["A bridge can represent a single path whose failure partitions connectivity.", "Real topology data changes and may require recomputation.", "Criticality is one signal, not a complete reliability model."] },
  },
  "longest-increasing-subsequence": {
    categorizedFollowUps: followUps({ category: "alternative", prompt: "Compare the explainable O(n²) DP with the O(n log n) tails invariant." }, { category: "memory", prompt: "What additional state is needed to reconstruct an actual subsequence?" }),
  },
  "word-break": {
    invariants: ["dp[i] means the prefix ending before i can be segmented under the dictionary."],
    categorizedFollowUps: followUps({ category: "complexity", prompt: "What hidden substring or dictionary lookup costs appear in the recurrence?" }, { category: "alternative", prompt: "When would a trie or BFS formulation be preferable?" }),
  },
};

function assignments(ids: readonly string[], classification: ProblemClassification): RoadmapProblemAssignment[] {
  return ids.map((problemId) => {
    const metadata = rich[problemId];
    return { problemId, classification, ...metadata, levelRationaleLabel: metadata?.levelRationale ? "Why this is SDE III+" : undefined };
  });
}

export const sde3ProblemAssignments = [
  ...assignments(coreIds, "core"),
  ...assignments(practiceIds, "practice"),
  ...assignments(stretchIds, "stretch"),
] satisfies RoadmapProblemAssignment[];

const modules: RoadmapModule[] = [
  {
    id: "foundations", title: "Coding Fluency Diagnostic", description: "Confirm that core coding mechanics are still interview-ready without repeating the lower-level catalog.",
    topics: [
      topic({ id: "sde3-array-search-refresh", title: "Arrays, Hashing & Ordered Search", description: "Refresh compact state, boundary search, and answer-space search through composition rather than syntax drills.", concepts: ["Prefix/suffix state", "Exact and boundary search", "Answer-space predicates"], recognitionSignals: ["Repeated lookup or aggregate state", "A monotonic boundary can eliminate candidates"], problemIds: ["product-of-array-except-self", "search-in-rotated-sorted-array", "koko-eating-bananas"], masteryCriteria: ["Explain the invariant and edge boundaries without a memorized template."] }),
      topic({ id: "sde3-tree-recursion-refresh", title: "Trees & Recursive Contracts", description: "Define what each call returns before touching traversal code.", concepts: ["Recursive contracts", "Local versus global state", "Stack-depth risk"], recognitionSignals: ["A parent combines summaries returned by children"], problemIds: ["binary-tree-maximum-path-sum"], masteryCriteria: ["State the downward-path return contract and the complete-path update separately."] }),
      topic({ id: "sde3-graph-refresh", title: "Graph Modeling Refresh", description: "Name vertices, edges, direction, weights, and the required graph operation first.", concepts: ["Reachability", "Dependency ordering", "Weighted paths"], recognitionSignals: ["Relationships form an implicit or explicit network"], problemIds: ["number-of-islands", "course-schedule", "network-delay-time"], masteryCriteria: ["Select BFS, topological reasoning, or Dijkstra from graph properties."] }),
      topic({ id: "sde3-heap-refresh", title: "Heap & Streaming Refresh", description: "Retain only the candidates required by an online or ranked query.", concepts: ["Bounded heaps", "Extreme-value queries", "Streaming updates"], recognitionSignals: ["Only the best K or current median matters"], problemIds: ["top-k-frequent-elements", "kth-largest-element-in-a-stream"], masteryCriteria: ["Explain what state can be discarded forever."] }),
      topic({ id: "sde3-dp-state-refresh", title: "DP State Refresh", description: "Use one sequence problem to verify state definition and optimization fluency.", concepts: ["State meaning", "Transition order", "Quadratic versus optimized formulation"], recognitionSignals: ["A sequence answer depends on best smaller prefixes"], problemIds: ["longest-increasing-subsequence"], masteryCriteria: ["Derive the O(n²) state before comparing the tails optimization."] }),
    ],
  },
  {
    id: "core-data-structures", title: "Invariants & Mutable State", description: "Build APIs whose synchronized state remains correct across every update, eviction, expiry, and interval mutation.",
    topics: [
      topic({ id: "sde3-cache-structures", title: "Cache Structures", description: "Treat lookup, recency/frequency order, eviction, and metadata as one invariant system.", concepts: ["O(1) lookup and mutation", "Recency versus frequency", "Capacity and expiration"], recognitionSignals: ["A bounded key/value API needs an eviction policy"], problemIds: ["lru-cache", "lfu-cache"], masteryCriteria: ["Define every synchronized structure and trace one get, update, and eviction."] }),
      topic({ id: "sde3-mutable-api", title: "Mutable API Structures", description: "Specify operations, complexity goals, invalid states, and mutation behavior before implementation.", concepts: ["API contracts", "Swap-delete indexing", "Expiry state"], recognitionSignals: ["Several operations require incompatible access patterns"], problemIds: ["insert-delete-getrandom-o1", "design-authentication-manager"], masteryCriteria: ["State operation guarantees and edge behavior before choosing containers."] }),
      topic({ id: "sde3-mutable-intervals", title: "Mutable Intervals", priority: "high-value", description: "Move from sorting static ranges once to interleaved conflict checks and updates.", concepts: ["Half-open intervals", "Rollback", "Sweep deltas", "Ordered interval indexes"], recognitionSignals: ["Bookings and queries arrive over time"], problemIds: ["my-calendar-i", "my-calendar-ii"], masteryCriteria: ["Choose a structure from update/query workload rather than from a memorized interval template."] }),
      topic({ id: "sde3-monotonic-state", title: "Monotonic Structures", priority: "high-value", description: "Keep unresolved candidates ordered and prove each candidate enters and exits once.", concepts: ["Monotonic deque", "Candidate lifetime", "Amortized O(n)"], recognitionSignals: ["A rolling range needs its extreme value online"], problemIds: ["sliding-window-maximum"], masteryCriteria: ["State the deque invariant before coding and compare it with lazy heap deletion."] }),
      topic({ id: "sde3-time-indexed-state", title: "Time-Indexed & Versioned State", description: "Store sparse histories and retrieve the newest eligible version by time or snapshot.", concepts: ["Version ordering", "Sparse history", "Historical lookup", "Retention"], recognitionSignals: ["Queries ask for state as of a prior time"], problemIds: ["time-based-key-value-store", "snapshot-array"], masteryCriteria: ["Make ordering and retention assumptions explicit in the API contract."] }),
    ],
  },
  {
    id: "trees-graphs", title: "Graph & Dependency Reasoning", description: "Choose the graph abstraction and algorithm from direction, weights, update behavior, and the required result.",
    topics: [
      topic({ id: "sde3-graph-modeling", title: "Graph Modeling Checklist", description: "Before coding, define vertices, edges, direction, weights, mutability, and whether the goal is reachability, ordering, cost, connectivity, or criticality.", concepts: ["Vertices and edges", "Directed versus undirected", "Weighted versus unweighted", "Static versus changing"], recognitionSignals: ["The domain hides relationships behind strings, grids, accounts, or routes"], problemIds: ["reconstruct-itinerary", "word-ladder"], masteryCriteria: ["Write the graph model in plain language before selecting traversal."] }),
      topic({ id: "sde3-dependencies", title: "Dependency Graphs", description: "Model prerequisites and reason about ordering, cycles, partial recomputation, and ready-task parallelism.", concepts: ["Kahn versus DFS state", "Cycle reporting", "Multiple valid orders", "Dynamic dependencies"], recognitionSignals: ["One task or artifact depends on another"], problemIds: ["course-schedule", "course-schedule-ii"], masteryCriteria: ["Distinguish possibility, ordering, and cycle-explanation outputs."] }),
      topic({ id: "sde3-shortest-paths", title: "Shortest-Path Decision Guide", description: "Use BFS for equal-cost edges, Dijkstra for nonnegative weights, augmented state for constrained paths, and reject Dijkstra when negative edges violate its proof.", concepts: ["Unweighted BFS", "Dijkstra", "0–1 BFS awareness", "Negative-edge boundary", "State augmentation"], recognitionSignals: ["The route objective and constraints determine more state than current node"], problemIds: ["network-delay-time", "path-with-minimum-effort", "cheapest-flights-within-k-stops", "swim-in-rising-water", "path-with-maximum-probability"], masteryCriteria: ["Explain why the graph state may need more than the current node."] }),
      topic({ id: "sde3-connectivity", title: "Connectivity Over Time", priority: "high-value", description: "Compare traversal for static graphs with Union Find for incremental additions, then name the deletion boundary.", concepts: ["DFS/BFS components", "Union Find", "Edge additions", "Deletion limitations"], recognitionSignals: ["Entities merge into connected groups over time"], problemIds: ["number-of-provinces", "redundant-connection", "accounts-merge", "most-stones-removed-with-same-row-or-column"], masteryCriteria: ["Explain why basic Union Find does not support arbitrary edge deletion."] }),
      topic({ id: "sde3-graph-criticality", title: "Critical Connections", priority: "advanced", description: "Use discovery and low-link intuition to find edges whose removal disconnects a graph.", concepts: ["Discovery order", "Reachable ancestor", "Bridge intuition"], recognitionSignals: ["The question asks which connection is a single point of failure"], problemIds: ["critical-connections-in-a-network"], masteryCriteria: ["Explain the ancestor-reachability invariant without relying on terminology alone."] }),
    ],
  },
  {
    id: "high-value-patterns", title: "Indexing, Search & Streaming", description: "Build online and indexed structures around what must be retained, discarded, ranked, or retrieved historically.",
    topics: [
      topic({ id: "sde3-tries-indexing", title: "Tries & Prefix Indexing", priority: "high-value", description: "Compare prefix trees with simpler complete-key maps and ordered prefix ranges.", concepts: ["Prefix sharing", "Sparse versus dense children", "Wildcard branching", "Ranking metadata"], recognitionSignals: ["Many prefix queries or dictionary-pruned searches"], problemIds: ["implement-trie-prefix-tree", "design-add-and-search-words-data-structure", "word-search-ii"], masteryCriteria: ["Discuss alphabet size, memory cost, updates, and when a hashmap is better."] }),
      topic({ id: "sde3-search-ranking", title: "Search Suggestions & Ranking", priority: "high-value", description: "Compare static prefix bounds, tries, and precomputed Top-K under update and ranking requirements.", concepts: ["Prefix ranges", "Precomputed suggestions", "Popularity and freshness"], recognitionSignals: ["A query prefix needs a small ranked candidate set"], problemIds: ["search-suggestions-system"], masteryCriteria: ["Choose an index from catalog mutability, read volume, and ranking freshness."] }),
      topic({ id: "sde3-streaming-statistics", title: "Streaming Statistics", description: "Process updates online while retaining only state that can affect future answers.", concepts: ["Batch versus online", "Two-heap median", "Time-window expiry", "Exact versus approximate"], recognitionSignals: ["Values arrive continuously and history may not fit in memory"], problemIds: ["kth-largest-element-in-a-stream", "find-median-from-data-stream", "number-of-recent-calls", "sliding-window-maximum"], masteryCriteria: ["State what must be retained and what can be discarded forever."] }),
      topic({ id: "sde3-heap-index", title: "Heap + Index Composition", priority: "high-value", description: "Pair heaps with maps, versions, or ordered histories when arbitrary updates make heap entries stale.", concepts: ["Lazy deletion", "Version validation", "K-way merge", "Cooldown state"], recognitionSignals: ["Extreme queries coexist with correction, deletion, or multiple sources"], problemIds: ["stock-price-fluctuation", "design-twitter", "task-scheduler", "reorganize-string"], masteryCriteria: ["Explain how stale entries are detected and when compaction becomes necessary."] }),
      topic({ id: "sde3-dp-fluency", title: "DP Fluency Check", description: "Keep DP focused: define the state, compare top-down and bottom-up, and identify useful space reduction.", concepts: ["State and recurrence", "Iteration dependency", "Memoization versus tabulation", "Space reduction"], recognitionSignals: ["Overlapping subproblems are truly the right abstraction"], problemIds: ["house-robber", "coin-change", "longest-increasing-subsequence", "longest-common-subsequence", "edit-distance", "word-break"], masteryCriteria: ["Define state before recurrence and explain why DP—not greed or graph search—fits."] }),
    ],
  },
  {
    id: "level-patterns", title: "Coding → Production Bridge", description: "Extend local algorithmic invariants into restrained conversations about concurrency, persistence, memory, partitioning, approximation, and failure.",
    topics: [
      topic({ id: "sde3-api-contracts", title: "API & Object Design", description: "Specify operations, outputs, complexity goals, mutation semantics, invalid states, and thread-safety assumptions.", concepts: ["Operation contracts", "Complexity budgets", "Invalid states", "Ownership"], recognitionSignals: ["The prompt asks for a mutable object rather than one pure function"], problemIds: ["lru-cache", "time-based-key-value-store", "snapshot-array", "design-authentication-manager", "my-calendar-i", "design-twitter"], masteryCriteria: ["Write the API contract and assumptions before implementation."] }),
      topic({ id: "sde3-concurrency", title: "Concurrency Follow-ups", priority: "high-value", description: "Identify protected state, atomic operations, lock granularity, and acceptable consistency without implementing lock-free algorithms.", concepts: ["Races", "Atomicity", "Coarse versus fine locks", "Read operations that mutate"], recognitionSignals: ["Updates and reads may interleave across threads"], problemIds: ["lru-cache", "design-authentication-manager", "my-calendar-i", "find-median-from-data-stream"], masteryCriteria: ["Name the invariant a race could violate and the smallest useful atomic boundary."] }),
      topic({ id: "sde3-memory-approximation", title: "Memory & Approximation Awareness", priority: "high-value", description: "Ask what grows, what can be discarded, and whether exactness is worth its memory and coordination cost.", concepts: ["Metadata overhead", "Retention", "Bounded state", "Approximate Top-K and quantiles"], recognitionSignals: ["History is unbounded or exact global answers are expensive"], problemIds: ["top-k-frequent-elements", "find-median-from-data-stream", "implement-trie-prefix-tree", "time-based-key-value-store"], masteryCriteria: ["State an accuracy or retention trade-off instead of naming probabilistic structures by rote."] }),
      topic({ id: "sde3-persistence-scale", title: "Persistence, Partitioning & Scale", priority: "high-value", description: "Discuss how restart, disk, distribution, and skew change ownership and invariants.", concepts: ["Durability", "Compaction", "Partition ownership", "Hot keys"], recognitionSignals: ["In-memory state must survive or exceed one process"], problemIds: ["lru-cache", "snapshot-array", "design-twitter", "network-delay-time"], masteryCriteria: ["Identify which invariant becomes local, approximate, or coordinated after partitioning."] }),
      topic({ id: "sde3-failure-reasoning", title: "Failure-Mode Reasoning", description: "Review the mutations and boundaries most likely to violate correctness before declaring the solution done.", concepts: ["Pointer integrity", "Version ordering", "Heap balance", "Union correctness"], recognitionSignals: ["Several structures must change together"], problemIds: ["lru-cache", "time-based-key-value-store", "find-median-from-data-stream", "accounts-merge"], masteryCriteria: ["Name at least three concrete failure modes and tests for each stateful implementation."] }),
    ],
  },
  {
    id: "interview-practice", title: "Senior Interview Simulation", description: "Practice ambiguous requirements, code review, mixed coding, trade-offs, and concise production-oriented extensions.",
    topics: [
      topic({ id: "sde3-ambiguous-mode", title: "Ambiguous Requirements", description: "Ask about operations, ordering, duplicates, concurrency, memory, complexity, and scale before choosing a representation.", concepts: ["Clarifying questions", "Assumption log", "Progressive constraints"], recognitionSignals: ["The prompt intentionally omits operation and workload details"], masteryCriteria: ["Delay implementation until the contract is specific enough to test."] }),
      topic({ id: "sde3-code-review-mode", title: "Code Review", priority: "high-value", description: "Find correctness bugs, edge cases, complexity issues, invariant violations, and maintainability risks in original Foundry snippets.", concepts: ["Invariant audit", "Adversarial tests", "Complexity review", "Repair plan"], recognitionSignals: ["A plausible implementation exists but has hidden defects"], masteryCriteria: ["Explain the bug, exhibit a failing case, and propose the smallest safe repair."] }),
      topic({ id: "sde3-tradeoff-mode", title: "Engineering Trade-offs", priority: "high-value", description: "Compare valid designs using workload, update frequency, memory, exactness, and operational risk.", concepts: ["Batch versus online", "Read versus write cost", "Exact versus approximate", "Simple versus flexible"], recognitionSignals: ["More than one approach satisfies the base constraints"], problemIds: ["top-k-frequent-elements", "search-suggestions-system", "sliding-window-maximum", "design-twitter"], masteryCriteria: ["Choose an approach and name the requirement that would make you switch."] }),
      topic({ id: "sde3-mixed-rounds", title: "Mixed Senior Rounds", description: "Keep pattern labels hidden and combine coding with one focused extension.", concepts: ["Model selection", "Invariant-first implementation", "Follow-up adaptation"], recognitionSignals: ["The problem category is intentionally withheld"], problemIds: ["lru-cache", "cheapest-flights-within-k-stops", "snapshot-array", "word-break"], masteryCriteria: ["Communicate assumptions, invariant, alternatives, and changed constraints without overengineering."] }),
      topic({ id: "sde3-readiness", title: "Senior Readiness Check", description: "Judge readiness by repeatable reasoning and implementation behavior, not solved-Hard totals.", concepts: ["Fluency", "Robustness", "Trade-offs", "Code review"], recognitionSignals: ["Preparation decisions should follow observed competency gaps"], masteryCriteria: ["Use the readiness criteria and review queue to choose the next rehearsal."] }),
    ],
  },
];

export const sde3Roadmap: DSARoadmap = {
  level: "sde3plus",
  title: "SDE III+ Interview Roadmap",
  shortTitle: "SDE III+",
  subtitle: "Define invariants, build robust state, and make engineering trade-offs",
  objective: "Stay fluent in coding while making state, API, failure, memory, concurrency, and scale implications explicit.",
  progression: ["Reason about Invariants", "Build Robust Solutions", "Discuss Scale", "Make Trade-offs"],
  modules,
  problemAssignments: sde3ProblemAssignments,
  diagnostic: {
    title: "Are your coding fundamentals still interview-ready?",
    description: "Attempt these shared problems without topic labels. Mark only the areas that need refresh; this view-only diagnostic is not persisted.",
    problemIds: ["product-of-array-except-self", "search-in-rotated-sorted-array", "binary-tree-maximum-path-sum", "number-of-islands", "top-k-frequent-elements", "course-schedule", "network-delay-time", "longest-increasing-subsequence", "lru-cache"],
    masteryCriteria: ["Reach a correct implementation without extensive warm-up.", "State the governing invariant before coding.", "Explain one alternative and one changed-constraint follow-up."],
  },
  optionalTopics: [
    topic({ id: "sde3-optional-state", title: "Advanced State-Management Drills", priority: "advanced", completionRequired: false, description: "Useful for roles that heavily emphasize intricate mutable structures; not a universal senior readiness gate.", concepts: ["Frequency buckets", "Ordered interval mutation"], recognitionSignals: ["Several O(1) indexes must stay synchronized"], problemIds: ["all-oone-data-structure", "data-stream-as-disjoint-intervals", "range-module"], masteryCriteria: ["State the structure invariants before implementing any mutation."] }),
    topic({ id: "sde3-optional-range", title: "Segment & Fenwick Trees", priority: "advanced", completionRequired: false, description: "Company- and role-dependent structures for mutable range workloads.", concepts: ["Point updates", "Range aggregation", "Tree versus Fenwick trade-off"], recognitionSignals: ["Updates and range queries are repeatedly interleaved"], problemIds: ["range-sum-query-mutable"], masteryCriteria: ["Explain the workload that makes prefix sums insufficient."] }),
    topic({ id: "sde3-optional-dp-bit", title: "Advanced DP & Specialized Bits", priority: "advanced", completionRequired: false, description: "Optional breadth that should not delay normal senior interview preparation.", concepts: ["Interval DP", "Bit-state invariants"], recognitionSignals: ["A specific target loop emphasizes advanced DP or bit manipulation"], problemIds: ["burst-balloons", "single-number-ii"], masteryCriteria: ["Use only when target-role evidence justifies the preparation cost."] }),
  ],
  mixedPracticeSets: [
    { id: "sde3-mixed-stateful", title: "Set A — Stateful", description: "Mix cache, historical state, and heap/index composition without visible labels.", problemIds: ["lru-cache", "snapshot-array", "stock-price-fluctuation"], revealPatternsByDefault: false },
    { id: "sde3-mixed-graphs", title: "Set B — Graph Reasoning", description: "Choose among dependency ordering, weighted paths, and connectivity.", problemIds: ["course-schedule", "cheapest-flights-within-k-stops", "accounts-merge"], revealPatternsByDefault: false },
    { id: "sde3-mixed-online", title: "Set C — Online Data", description: "Retain bounded state for streaming, rolling windows, and ordered updates.", problemIds: ["find-median-from-data-stream", "sliding-window-maximum", "time-based-key-value-store"], revealPatternsByDefault: false },
    { id: "sde3-mixed-extension", title: "Set D — Coding + Follow-up", description: "Solve one high-signal problem, then open its production-oriented extension.", problemIds: ["search-suggestions-system", "design-twitter", "network-delay-time"], revealPatternsByDefault: false },
    { id: "sde3-mixed-round", title: "Set E — Senior Round", description: "Begin from incomplete requirements, clarify the contract, then choose one of these implementations.", problemIds: ["lru-cache", "time-based-key-value-store"], revealPatternsByDefault: false },
  ],
  timedPracticeModes: [
    { id: "sde3-fluency", title: "Fluency Check", duration: "30–40 min", description: "One coding problem with no production follow-up.", expectations: ["Clarify quickly", "State invariant", "Implement and test"] },
    { id: "sde3-coding", title: "Senior Coding Round", duration: "45 min", description: "One coding problem plus an explicit algorithm trade-off discussion.", expectations: ["Establish a baseline", "Compare alternatives", "Avoid unnecessary complexity"] },
    { id: "sde3-extension", title: "Coding + Extension", duration: "50–60 min", description: "Coding followed by a focused 10–15 minute production or API extension.", expectations: ["Finish the local invariant first", "Discuss one scale or failure dimension", "Keep the bridge concise"] },
    { id: "sde3-ambiguous", title: "Ambiguous Round", duration: "45–60 min", description: "Clarify an incomplete requirement set before implementation.", expectations: ["Ask operation questions", "Set assumptions", "Revise when constraints appear"] },
    { id: "sde3-review", title: "Code Review Round", duration: "20–30 min", description: "Identify defects and improve an existing Foundry-authored implementation.", expectations: ["Find a failing case", "Explain invariant violation", "Propose a maintainable repair"] },
  ],
  ambiguousExercises: [
    { id: "versioned-store", title: "Versioned Store", prompt: "Design an in-memory structure that stores values by key and retrieves a value as of a timestamp.", clarifyingQuestions: ["Can writes arrive out of timestamp order?", "What should happen before the first version?", "How many writes and historical reads are expected?", "Must history be retained forever?", "Are concurrent readers and writers in scope?"], revealedConstraints: ["Writes are initially timestamp-ordered per key.", "Historical lookup should be logarithmic in versions for that key.", "Retention and persistence are follow-ups."] },
    { id: "bounded-cache", title: "Bounded Cache", prompt: "Design a bounded cache with constant-time reads and writes.", clarifyingQuestions: ["Which eviction policy defines the bound?", "Does a read update policy state?", "Can capacity be zero?", "Is TTL required?", "What thread-safety assumptions apply?"], revealedConstraints: ["Use recency-based eviction.", "Both reads and writes update recency.", "Start single-threaded; concurrency is a follow-up."] },
    { id: "rolling-ranking", title: "Rolling Ranking", prompt: "Maintain the most important items from a continuous stream.", clarifyingQuestions: ["What defines importance?", "Is the answer exact?", "Is there a time window?", "Can scores be corrected?", "How large can the key space become?"], revealedConstraints: ["Begin with exact Top-K frequencies in one process.", "Then discuss bounded memory and partitioned aggregation."] },
  ],
  codeReviewExercises: [
    { id: "buggy-lru", title: "Broken LRU Update", description: "Review a plausible recency update that leaves two structures inconsistent.", language: "pseudocode", code: "put(key, value):\n  if key exists:\n    map[key].value = value\n    return\n  node = Node(key, value)\n  map[key] = node\n  addToFront(node)\n  if map.size > capacity:\n    removeTail()", reviewPrompts: ["Which operation fails to update recency?", "What must eviction remove from the map?", "What happens at capacity zero?"], findings: ["Updating an existing key returns without moving its node to the front.", "removeTail must also delete the evicted key from the map.", "Capacity zero needs a valid empty-list path."] },
    { id: "late-visited-bfs", title: "Late-Visited BFS", description: "Find the complexity and correctness risks in a traversal that marks nodes only when dequeued.", language: "pseudocode", code: "queue = [start]\nwhile queue not empty:\n  node = queue.popFront()\n  visited.add(node)\n  for next in graph[node]:\n    if next not in visited:\n      queue.pushBack(next)", reviewPrompts: ["Can a node enter the queue more than once?", "What happens in a dense cyclic graph?", "Where should visited be updated?"], findings: ["Several parents can enqueue the same node before its first dequeue.", "Queue growth can become much larger than O(V).", "Mark the node visited when it is enqueued."] },
    { id: "broken-lower-bound", title: "Broken Lower Bound", description: "Audit a binary search whose interval contract and return value disagree.", language: "pseudocode", code: "left = 0; right = values.length - 1\nwhile left < right:\n  mid = (left + right) // 2\n  if values[mid] < target:\n    left = mid\n  else:\n    right = mid\nreturn left", reviewPrompts: ["Can the loop stop shrinking?", "What input demonstrates it?", "Should the search interval be closed or half-open?"], findings: ["left = mid can repeat forever when right = left + 1.", "The return contract does not represent insertion after the final element.", "Use a consistent closed or half-open lower-bound template."] },
  ],
  readinessCriteria: [
    "Solve common interview problems without extensive warm-up.", "Define invariants before implementing stateful structures.", "Choose data structures from operation requirements.",
    "Compare multiple valid approaches.", "Explain both time and memory trade-offs.", "Model graph vertices, edges, direction, weights, and mutability correctly.",
    "Distinguish BFS, Dijkstra, topological ordering, and connectivity workloads.", "Handle mutation without breaking synchronized state.", "Design clean API contracts and state assumptions.",
    "Identify edge cases and failure modes proactively.", "Adapt to changed constraints without discarding a correct core.", "Discuss concurrency implications at a useful high level.",
    "Connect algorithmic choices to restrained production concerns.", "Avoid overengineering a simple coding requirement.", "Communicate decisions while the design evolves.",
    "Review unfamiliar code and demonstrate concrete correctness or complexity defects.",
  ],
  reviewGuidance: ["Review any problem whose invariant was stated only after coding.", "Revisit solutions that worked but used the wrong graph model or complexity argument.", "Track whether you handled the follow-up, not merely whether the base code passed.", "For stateful structures, write the broken invariant and failing operation sequence in the review note."],
  failureModes: [
    { title: "Coding before defining the contract", description: "Clarify operations, complexity, ordering, and mutation assumptions first." },
    { title: "Invisible invariants", description: "Write the relationships that every mutation must preserve before implementation." },
    { title: "Heap-only thinking", description: "Ask how arbitrary corrections or deletions make entries stale and require an index." },
    { title: "Graph abstraction drift", description: "Name vertices, edges, weights, and the required operation before choosing an algorithm." },
    { title: "Ignoring memory growth", description: "Identify retained history, metadata overhead, and a deletion or retention policy." },
    { title: "Premature distribution", description: "Finish the correct in-process algorithm before discussing partitions and failures." },
    { title: "Vague concurrency answers", description: "Name the protected state and atomic boundary rather than only saying use a lock." },
    { title: "Overvaluing Hard counts", description: "Use competency gaps and follow-up quality—not arbitrary totals—to direct practice." },
  ],
  scopePaths: [
    { id: "short", title: "Diagnostic & Essentials", description: "Verify fluency, then focus on Core invariant and stateful problems.", classifications: ["core"] },
    { id: "standard", title: "Standard Senior", description: "Cover Core and selected Practice problems with their senior extensions.", classifications: ["core", "practice"] },
    { id: "thorough", title: "Thorough", description: "Add Stretch drills, every mixed set, and Optional Advanced content.", classifications: ["core", "practice", "stretch"] },
  ],
  estimatedProblems: sde3ProblemAssignments.length,
  estimatedWeeks: "8–10 weeks",
};

export function assertSde3RoadmapIntegrity() {
  const ids = sde3ProblemAssignments.map((assignment) => assignment.problemId);
  if (new Set(ids).size !== ids.length) throw new Error("SDE III+ assignments contain duplicate canonical IDs.");
  if (ids.length < 45 || ids.length > 60) throw new Error(`SDE III+ must contain 45–60 unique problems; found ${ids.length}.`);
  const counts = sde3ProblemAssignments.reduce<Record<ProblemClassification, number>>((result, assignment) => { result[assignment.classification] += 1; return result; }, { learn: 0, core: 0, practice: 0, stretch: 0 });
  if (counts.core < 28 || counts.core > 35 || counts.practice < 12 || counts.practice > 18 || counts.stretch < 5 || counts.stretch > 10) throw new Error(`SDE III+ classification mix is outside the approved range: ${JSON.stringify(counts)}.`);
  const referenced = new Set([
    ...modules.flatMap((module) => module.topics.flatMap((current) => current.problemIds ?? [])),
    ...(sde3Roadmap.optionalTopics ?? []).flatMap((current) => current.problemIds ?? []),
  ]);
  for (const id of ids) if (!referenced.has(id)) throw new Error(`${id} is assigned to SDE III+ but not referenced by a curriculum topic.`);
}

assertSde3RoadmapIntegrity();
