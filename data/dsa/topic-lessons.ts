import type { DsaTopic } from "@/types";
import topicData from "./topics.json";

export interface DsaTopicLesson extends DsaTopic {
  prerequisites: string[];
  recognitionClues: string[];
  implementationOptions: string[];
  interviewBehavior: string[];
  reviewPrompts: string[];
}

type TopicLessonFields = Pick<DsaTopicLesson, "prerequisites" | "recognitionClues" | "implementationOptions" | "interviewBehavior" | "reviewPrompts">;

const details: Record<string, TopicLessonFields | DsaTopicLesson> = {
  arrays: {
    prerequisites: [],
    recognitionClues: ["Indexed access or an in-place update matters", "A scan can carry a small amount of state", "Order, boundaries, or contiguous ranges shape the question"],
    implementationOptions: ["Single or multi-pass scan", "Sort, then scan or move pointers", "Auxiliary lookup, prefix state, or in-place marking when the value domain permits"],
    interviewBehavior: ["State whether mutation is allowed", "Name the index invariant before writing the loop", "Test empty, singleton, and boundary-position cases"],
    reviewPrompts: ["Which boundary failed?", "Did mutation change the caller-visible input?", "Could one carried value remove a second pass?"],
  },
  strings: {
    prerequisites: ["arrays"],
    recognitionClues: ["The answer depends on a substring, prefix, suffix, or character counts", "Normalization or encoding rules affect equality", "Repeated construction may hide copying cost"],
    implementationOptions: ["Index scan over code units under a stated character model", "Frequency map or fixed alphabet table", "Two pointers, sliding window, trie, or builder depending on the invariant"],
    interviewBehavior: ["Clarify case, whitespace, punctuation, and character set", "Avoid claiming O(1) alphabet space without an assumption", "Narrate how the chosen representation preserves the required text semantics"],
    reviewPrompts: ["What character-set assumption did I make?", "Where did I allocate substrings?", "Could a moving boundary preserve the same information?"],
  },
  "hash-maps": {
    prerequisites: ["arrays", "strings"],
    recognitionClues: ["A future lookup can replace a repeated scan", "Counts, complements, grouping, or visited membership drive the result", "The key has a stable equality and hash representation"],
    implementationOptions: ["Set for membership", "Map for counts, last positions, or adjacency", "Fixed array when the key domain is small and explicitly bounded"],
    interviewBehavior: ["Say exactly what each key and value mean", "Choose check-before-update or update-before-check deliberately", "Discuss average-case operations and any ordering requirement"],
    reviewPrompts: ["Was the map value the minimum sufficient state?", "Did update order admit the current element incorrectly?", "Would a bounded table be clearer?"],
  },
  sorting: {
    prerequisites: ["arrays"],
    recognitionClues: ["Useful neighbors appear after ordering", "An interval or greedy choice needs a consistent first key", "O(n log n) is acceptable and simplifies the remaining proof"],
    implementationOptions: ["Library comparison sort with an explicit key", "Counting or bucket ordering for a small known domain", "Partial ordering with a heap when only k results matter"],
    interviewBehavior: ["Include sorting in the complexity", "Clarify mutation and stability needs", "Explain why the selected key exposes the next decision"],
    reviewPrompts: ["Did the comparator obey a total order?", "Was stability actually required?", "Could selection avoid a full sort?"],
  },
  "linked-lists": {
    prerequisites: ["arrays"],
    recognitionClues: ["The task changes links rather than indexed values", "Head or tail replacement creates special cases", "Cycle, midpoint, or fixed-distance relationships matter"],
    implementationOptions: ["Dummy head for uniform insertion/removal", "Previous/current/next rewiring", "Fast and slow pointers for relative position or cycle state"],
    interviewBehavior: ["Name pointer ownership before mutation", "Save the next edge before rewiring", "Draw a two- or three-node example including the head"],
    reviewPrompts: ["Which pointer was lost?", "Would a dummy node remove a branch?", "Did I compare node identity rather than value?"],
  },
  "stacks-queues": {
    prerequisites: ["arrays", "linked-lists"],
    recognitionClues: ["The most recent unresolved item must be revisited first", "Work proceeds by arrival order or graph level", "A nearest prior/next boundary is required"],
    implementationOptions: ["Explicit stack", "FIFO deque", "Monotonic stack or queue when dominated candidates can be discarded"],
    interviewBehavior: ["Define what one stored entry represents", "Choose the visited/enqueue moment before coding BFS", "Check empty-state behavior of the language API"],
    reviewPrompts: ["Should the structure store values, indices, or nodes?", "Was an item inserted more than once?", "What invariant does the top/front satisfy?"],
  },
  "binary-search": {
    prerequisites: ["arrays", "sorting"],
    recognitionClues: ["The domain is ordered", "A boolean feasibility predicate changes once", "The question asks for a first, last, minimum feasible, or maximum feasible boundary"],
    implementationOptions: ["Closed interval [left, right]", "Half-open interval [left, right)", "Answer-space search over a monotonic predicate"],
    interviewBehavior: ["State the interval convention", "Prove which half cannot contain the answer", "Dry-run a missing target and a two-element interval"],
    reviewPrompts: ["Did every update shrink the interval?", "Was the predicate truly monotonic?", "Did the return value match the chosen convention?"],
  },
  trees: {
    prerequisites: ["linked-lists", "stacks-queues"],
    recognitionClues: ["The answer composes from subtrees", "Level, depth, ancestor, or ordered-tree constraints matter", "There is one unique path from root to a node"],
    implementationOptions: ["Recursive DFS with an explicit return meaning", "Iterative DFS with a stack", "BFS for levels or nearest depth"],
    interviewBehavior: ["Define the base case and subtree contract first", "Distinguish node count, height, and width in complexity", "Avoid hidden global state when a return value is sufficient"],
    reviewPrompts: ["What did each recursive call return?", "Could depth exceed safe recursion?", "Did I handle the null root?"],
  },
  heaps: {
    prerequisites: ["arrays", "sorting"],
    recognitionClues: ["Only the next minimum/maximum or best k items matter", "Candidates arrive over time", "Several sorted sources must advance incrementally"],
    implementationOptions: ["Min-heap for next-smallest priority", "Bounded min-heap for largest k values", "Heap entries with stable tie-breakers or lazy stale-entry removal"],
    interviewBehavior: ["Say why the heap direction matches the retained set", "Bound heap growth when solving top-k", "Include comparator and stale-entry behavior in the explanation"],
    reviewPrompts: ["Did I choose min versus max backwards?", "Could heap construction start in O(n)?", "Was a full sort simpler and acceptable?"],
  },
  graphs: {
    prerequisites: ["hash-maps", "stacks-queues", "trees"],
    recognitionClues: ["Entities have arbitrary relationships rather than one parent", "Reachability, components, paths, or dependencies drive the answer", "The input may be an implicit graph such as a grid or word transformation"],
    implementationOptions: ["Adjacency list for sparse edges", "Adjacency matrix for dense bounded graphs", "Implicit neighbor generation with BFS or DFS"],
    interviewBehavior: ["Clarify directedness and disconnected nodes", "State when a node becomes visited", "Use O(V + E) only for an adjacency representation that supports it"],
    reviewPrompts: ["Did I cover every component?", "Could duplicate queue entries grow unexpectedly?", "Was the graph directed, weighted, or implicit?"],
  },
  "topological-ordering": {
    prerequisites: ["graphs", "stacks-queues"],
    recognitionClues: ["Directed prerequisites must precede dependents", "The output is a valid order rather than a shortest path", "A cycle should make a complete ordering impossible"],
    implementationOptions: ["Kahn's algorithm with indegrees and a queue", "DFS postorder with three-state cycle detection", "Lexicographic variants with a heap when the tie rule requires it"],
    interviewBehavior: ["Confirm edge direction in words", "Explain how cycle detection follows from incomplete processing or a back edge", "Avoid promising one unique order unless the constraints prove it"],
    reviewPrompts: ["Were indegrees assigned to the dependent?", "Did the result include all nodes?", "What changes if a stable tie order is required?"],
    id: "topic-topological-ordering", slug: "topological-ordering", name: "Topological Ordering", summary: "Order directed work so every prerequisite appears before its dependents, while detecting cycles.", interviewUse: "Dependency scheduling tests graph modeling, edge direction, and honest cycle handling.", complexityFocus: "Kahn and DFS forms are O(V + E) with O(V) auxiliary state.", commonMistakes: ["Reversing prerequisite edges", "Returning a partial order after a cycle", "Claiming the ordering is unique"], relatedTopics: ["graphs", "stacks-queues", "shortest-paths-weighted-graphs"],
  },
  "union-find": {
    prerequisites: ["arrays", "graphs"],
    recognitionClues: ["Edges repeatedly merge components", "Connectivity or component count is queried after additions", "The task does not require arbitrary online deletions or actual path reconstruction"],
    implementationOptions: ["Parent forest with path compression", "Union by size or rank", "Offline activation/order reversal for variants that can avoid deletions"],
    interviewBehavior: ["Define what a representative means", "Keep size/rank updates on the chosen root", "Call out that disjoint-set connectivity does not recover a path"],
    reviewPrompts: ["Did find return the compressed representative?", "Was rank confused with component size?", "Would plain DFS be clearer for a one-time query?"],
    id: "topic-union-find", slug: "union-find", name: "Union-Find", summary: "Maintain disjoint connected components under repeated merges and representative lookups.", interviewUse: "Union-find fits incremental connectivity, redundant-edge, and clustering questions.", complexityFocus: "With path compression and union by size/rank, a sequence of operations is near constant amortized time.", commonMistakes: ["Updating rank on a non-root", "Skipping path compression", "Using it for unsupported online deletions"], relatedTopics: ["graphs", "arrays", "sorting"],
  },
  backtracking: {
    prerequisites: ["arrays", "strings", "trees"],
    recognitionClues: ["The task asks to enumerate valid choices", "A partial assignment can be rejected early", "Choice order or duplicate inputs affect whether outputs repeat"],
    implementationOptions: ["Choose/explore/unchoose with one mutable path", "Index-based recursion", "Constraint sets or sorted duplicate skipping for pruning"],
    interviewBehavior: ["Name the decision at each depth", "Separate validity, completion, and restoration", "Describe complexity with branching, depth, and output size"],
    reviewPrompts: ["Was state restored on every path?", "Did I copy results at completion?", "Could an earlier constraint prune more work?"],
  },
  tries: {
    prerequisites: ["strings", "trees", "hash-maps"],
    recognitionClues: ["Prefix lookup is a first-class operation", "Many strings share leading segments", "Exact set membership alone is not enough justification"],
    implementationOptions: ["Map-backed child edges", "Fixed child array for a small declared alphabet", "Compressed/radix variants only when memory or long unary paths justify them"],
    interviewBehavior: ["Include the terminal-word marker", "Express time in characters processed", "Discuss memory versus a hash set or sorted list"],
    reviewPrompts: ["Did prefix and whole-word lookup differ?", "Was the alphabet assumption explicit?", "Did the use case actually require prefix traversal?"],
  },
  greedy: {
    prerequisites: ["sorting", "intervals"],
    recognitionClues: ["A locally best boundary leaves maximal room for the future", "An exchange argument can replace an arbitrary optimal choice", "Past choices never need revision once the invariant is proved"],
    implementationOptions: ["Sort by finish, start, cost, or gain according to the proof", "Single-pass boundary maintenance", "Heap-assisted greedy when candidates become available over time"],
    interviewBehavior: ["Offer the correctness argument before code", "Identify the counterexample that defeats a tempting alternative", "Separate the greedy choice from the data structure used to obtain it"],
    reviewPrompts: ["What exchange proves this choice safe?", "Which sort key does the proof require?", "Would future information force a revised choice?"],
  },
  "dynamic-programming": {
    prerequisites: ["arrays", "backtracking", "graphs"],
    recognitionClues: ["Different decision paths revisit the same subproblem", "Optimal value or count depends on smaller states", "A state can summarize all future-relevant history"],
    implementationOptions: ["Top-down memoization", "Bottom-up table", "Rolling state when transitions only need a bounded prior frontier"],
    interviewBehavior: ["Define state and transition in a sentence", "Prove base cases before optimizing space", "Count states times transition work"],
    reviewPrompts: ["Did the state encode enough history?", "Was the iteration order consistent with dependencies?", "Did space compression overwrite a needed value?"],
  },
  intervals: {
    prerequisites: ["arrays", "sorting"],
    recognitionClues: ["Ranges overlap, cover, or compete for time", "Ordering endpoints reveals merge or selection structure", "The meaning of touching boundaries changes the answer"],
    implementationOptions: ["Sort and merge against the current accumulated interval", "Sweep events with a stated tie rule", "Heap for concurrent active intervals"],
    interviewBehavior: ["Clarify closed versus half-open endpoints", "Explain the sort key and tie handling", "Test nested, touching, and disjoint ranges"],
    reviewPrompts: ["Was the endpoint convention explicit?", "Did I compare with the merged boundary or the prior input?", "Would event ordering change a touch case?"],
  },
  "bit-manipulation": {
    prerequisites: ["arrays"],
    recognitionClues: ["Parity, XOR cancellation, or compact subset state matters", "The domain is a fixed-width integer or bounded set of flags", "The trick remains explainable under the language's signed semantics"],
    implementationOptions: ["XOR identities", "Set/test/clear masks", "Subset enumeration or bit-count primitives under a declared width"],
    interviewBehavior: ["State the algebraic identity", "Parenthesize operations and name integer width", "Prefer a readable collection solution when the bit form adds no value"],
    reviewPrompts: ["Did signed shifting change the result?", "Was operator precedence obvious?", "Could I explain the identity without calling it a trick?"],
  },
  "matrix-grid-traversal": {
    prerequisites: ["arrays", "graphs", "stacks-queues"],
    recognitionClues: ["Cells are nodes with local movement rules", "Components, spread time, boundary reachability, or paths matter", "Row/column shape and mutation policy affect visited state"],
    implementationOptions: ["DFS flood fill", "BFS for layers or minimum unweighted moves", "Multi-source BFS when several origins spread simultaneously"],
    interviewBehavior: ["State direction set and boundary predicate", "Clarify whether the grid may be mutated", "Convert rows × columns into V and local neighbors into E when explaining complexity"],
    reviewPrompts: ["Were ragged or empty grids possible?", "Was visited marked before enqueue?", "Did diagonal movement accidentally enter the model?"],
    id: "topic-matrix-grid-traversal", slug: "matrix-grid-traversal", name: "Matrix & Grid Traversal", summary: "Treat cells and legal moves as an implicit graph while controlling bounds, revisits, and layer state.", interviewUse: "Grid questions make traversal invariants visible through islands, fills, spreading processes, and path constraints.", complexityFocus: "A full traversal is O(rows × columns) time with up to O(rows × columns) visited, queue, or stack state.", commonMistakes: ["Checking bounds after indexing", "Marking visited too late", "Assuming rectangular input without clarification"], relatedTopics: ["graphs", "stacks-queues", "shortest-paths-weighted-graphs"],
  },
  "shortest-paths-weighted-graphs": {
    prerequisites: ["graphs", "heaps"],
    recognitionClues: ["Edges carry costs and the minimum total cost matters", "Unweighted BFS is insufficient", "Negative weights or repeated relaxation change the valid algorithm"],
    implementationOptions: ["Dijkstra with a min-heap for nonnegative weights", "Bellman-Ford style relaxation when negative edges are allowed", "DAG shortest paths after topological ordering"],
    interviewBehavior: ["Ask about weight sign and graph size", "Name the settled-distance invariant before choosing Dijkstra", "Explain stale heap entries or decrease-key strategy"],
    reviewPrompts: ["Were negative edges possible?", "Did a stale heap entry get processed incorrectly?", "Could topological order solve the DAG case more directly?"],
    id: "topic-shortest-paths-weighted-graphs", slug: "shortest-paths-weighted-graphs", name: "Shortest Paths & Weighted Graphs", summary: "Choose a path algorithm from edge-weight assumptions and preserve a defensible distance invariant.", interviewUse: "Weighted routing and latency questions test algorithm preconditions more than template recall.", complexityFocus: "Heap-based Dijkstra is typically O((V + E) log V); alternatives depend on weight and graph structure.", commonMistakes: ["Using Dijkstra with negative weights", "Confusing visited with finalized too early", "Omitting unreachable nodes"], relatedTopics: ["graphs", "heaps", "topological-ordering"],
  },
};

const baseTopics = topicData as DsaTopic[];

export const dsaTopicLessons: DsaTopicLesson[] = [
  ...baseTopics.map((topic) => ({ ...topic, ...details[topic.slug] })),
  details["topological-ordering"],
  details["union-find"],
  details["matrix-grid-traversal"],
  details["shortest-paths-weighted-graphs"],
] as DsaTopicLesson[];

if (dsaTopicLessons.length !== 20 || new Set(dsaTopicLessons.map((topic) => topic.slug)).size !== 20) {
  throw new Error("The Required DSA topic catalog must contain exactly 20 unique topics.");
}
for (const topic of dsaTopicLessons) {
  if (!topic.prerequisites || !topic.recognitionClues?.length || !topic.implementationOptions?.length || !topic.interviewBehavior?.length || !topic.reviewPrompts?.length) {
    throw new Error(`DSA topic ${topic.slug} is missing its lesson contract.`);
  }
}
