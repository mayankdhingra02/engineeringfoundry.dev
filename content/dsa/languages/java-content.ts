import type { LanguageGuideData } from "@/features/dsa/languages/language-guide-types";

export const javaLanguageGuide: LanguageGuideData = {
  slug: "java",
  name: "Java",
  label: "Java for Coding Interviews",
  description: "Collections, syntax, and implementation patterns worth remembering before a DSA interview.",
  runtimeNote: "Portable Java 17+ subset; the representative fixture compiles in CI with Temurin 25. Reviewed against Java SE 25 LTS specifications and APIs.",
  reviewedAt: "September 5, 2026",
  sources: [
    { id: "SRC-DSA-JAVA-JLS", label: "Java Language Specification 25", url: "https://docs.oracle.com/javase/specs/jls/se25/html/", supports: "Primitive/reference values, equality, numeric promotion, strings, arrays, generics, and language semantics." },
    { id: "SRC-DSA-JAVA-UTIL", label: "Java SE 25 java.util", url: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/package-summary.html", supports: "Collections Framework, comparators, maps, sets, deques, and priority queues." },
    { id: "SRC-DSA-JAVA-ARRAYDEQUE", label: "Java SE 25 ArrayDeque", url: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayDeque.html", supports: "Stack/queue operations, null restrictions, and amortized operation guarantees." },
    { id: "SRC-DSA-JAVA-PRIORITYQUEUE", label: "Java SE 25 PriorityQueue", url: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/PriorityQueue.html", supports: "Heap ordering, head semantics, comparator behavior, and operation costs." },
  ],
  quickReference: [
    { title: "Arrays and lists", code: `int[] nums = new int[n];
int[][] grid = new int[rows][cols];
Arrays.fill(nums, -1);
Arrays.sort(nums);

List<Integer> list = new ArrayList<>();
list.add(value);
int first = list.get(0);` },
    { title: "Maps and sets", code: `Map<Integer, Integer> frequency = new HashMap<>();
Set<Integer> seen = new HashSet<>();

frequency.put(value, frequency.getOrDefault(value, 0) + 1);
boolean present = seen.contains(value);
seen.add(value);` },
    { title: "Stack and queue", code: `Deque<Integer> stack = new ArrayDeque<>();
stack.push(value);
int top = stack.pop();

Queue<Integer> queue = new ArrayDeque<>();
queue.offer(value);
int next = queue.poll();` },
    { title: "Priority queues", code: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap =
    new PriorityQueue<>(Collections.reverseOrder());

PriorityQueue<int[]> byFirst =
    new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));` },
  ],
  sections: [
    {
      id: "java-basics", title: "Java Interview Basics", introduction: "Be explicit about primitive versus boxed values, lengths, and conversions. Keep helper classes and methods minimal.",
      examples: [{ title: "Useful syntax and conversions", code: `for (int i = 0; i < nums.length; i++) {
    int value = nums[i];
}

for (int value : nums) {
    // Read-only iteration over values.
}

char letter = text.charAt(index);
int digit = letter - '0';
String number = String.valueOf(value);
int parsed = Integer.parseInt(number);

long safeSum = (long) first + second;` }],
      points: ["Arrays use .length, strings use .length(), and collections use .size().", "Use long for sums/products that may exceed 32-bit int.", "Boxed collection elements can be null; primitives cannot."],
    },
    {
      id: "arrays", title: "Arrays", introduction: "Arrays provide fixed-size contiguous storage and work directly with Arrays utility methods.",
      examples: [{ title: "Array operations", code: `int[] nums = new int[n];
int[][] grid = new int[rows][cols];

Arrays.fill(nums, -1);
Arrays.sort(nums);
int[] copy = Arrays.copyOf(nums, nums.length);
int[] range = Arrays.copyOfRange(nums, left, rightExclusive);` }],
      complexity: [{ operation: "nums[i]", complexity: "O(1)" }, { operation: "Arrays.fill(nums, x)", complexity: "O(n)" }, { operation: "Arrays.copyOf(nums, n)", complexity: "O(n)" }, { operation: "Arrays.sort(int[])", complexity: "O(n log n)" }],
    },
    {
      id: "array-list", title: "ArrayList", introduction: "ArrayList is the usual resizable-array implementation. Be precise about index operations and removal overloads.",
      examples: [{ title: "ArrayList operations", code: `List<Integer> list = new ArrayList<>();
list.add(value);
int current = list.get(index);
list.set(index, replacement);
int size = list.size();

list.remove(index);                    // removes by position
list.remove(Integer.valueOf(value));   // removes a matching value` }],
      warning: "With List<Integer>, remove(1) removes index 1. Use remove(Integer.valueOf(1)) when you intend to remove the value 1.",
      complexity: [{ operation: "ArrayList.get(i)", complexity: "O(1)" }, { operation: "ArrayList.add(x)", complexity: "O(1) amortized" }, { operation: "ArrayList.remove(i)", complexity: "O(n)", note: "Later elements shift." }],
    },
    {
      id: "hash-map-set", title: "HashMap / HashSet", introduction: "Use HashMap for lookup/counting and HashSet for membership or visited state. Average lookup and update are O(1).",
      examples: [{ title: "Frequency and membership", code: `Map<Integer, Integer> frequency = new HashMap<>();
Set<Integer> seen = new HashSet<>();

for (int value : nums) {
    frequency.put(value, frequency.getOrDefault(value, 0) + 1);
    seen.add(value);
}

for (Map.Entry<Integer, Integer> entry : frequency.entrySet()) {
    int key = entry.getKey();
    int count = entry.getValue();
}` }],
      complexity: [{ operation: "map.get / put", complexity: "O(1) average" }, { operation: "map.containsKey", complexity: "O(1) average" }, { operation: "set.contains", complexity: "O(1) average" }],
    },
    {
      id: "stack-queue-deque", title: "Stack / Queue / Deque", introduction: "Prefer ArrayDeque over the legacy Stack class. Use stack-shaped or queue-shaped APIs consistently.",
      examples: [{ title: "ArrayDeque APIs", code: `Deque<Integer> stack = new ArrayDeque<>();
stack.push(value);
int removedTop = stack.pop();
int currentTop = stack.peek();

Queue<Integer> queue = new ArrayDeque<>();
queue.offer(value);
int removedFront = queue.poll();
Integer currentFront = queue.peek();` }],
      points: ["offer/poll/peek return a status or null rather than throwing for normal capacity/empty cases.", "ArrayDeque does not permit null elements.", "Choose one end convention and keep it consistent."],
    },
    {
      id: "priority-queue", title: "PriorityQueue", introduction: "PriorityQueue is a min-heap by default. Use reverseOrder for boxed comparable values and Integer.compare for custom array/object priorities.",
      examples: [{ title: "Min, max, and custom heaps", code: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap =
    new PriorityQueue<>(Collections.reverseOrder());

PriorityQueue<int[]> byDistance =
    new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));

minHeap.offer(value);
int smallest = minHeap.poll();
Integer next = minHeap.peek();` }],
      warning: "Avoid comparator subtraction such as a[0] - b[0]. It can overflow and violate comparator ordering; use Integer.compare(a[0], b[0]).",
      complexity: [{ operation: "pq.offer(x)", complexity: "O(log n)" }, { operation: "pq.poll()", complexity: "O(log n)" }, { operation: "pq.peek()", complexity: "O(1)" }],
    },
    {
      id: "strings", title: "Strings / StringBuilder", introduction: "String is immutable. Use charAt and substring for access, equals for content comparison, and StringBuilder for repeated construction.",
      examples: [{ title: "String operations", code: `char first = text.charAt(0);
String suffix = text.substring(index);
char[] chars = text.toCharArray();

boolean sameContent = firstText.equals(secondText);

StringBuilder builder = new StringBuilder();
builder.append('a');
builder.append(value);
builder.reverse();
String result = builder.toString();` }],
      warning: "Use a.equals(b), not a == b, for String content. == compares object references.",
    },
    {
      id: "sorting", title: "Sorting", introduction: "Primitive arrays sort naturally with Arrays.sort. Lists and object arrays can use comparators; express multiple keys explicitly.",
      examples: [{ title: "Sorting and comparators", code: `Arrays.sort(nums);
Collections.sort(list);
list.sort(Collections.reverseOrder());

Arrays.sort(intervals, (a, b) -> {
    int byStart = Integer.compare(a[0], b[0]);
    return byStart != 0 ? byStart : Integer.compare(a[1], b[1]);
});` }],
      points: ["A primitive int[] cannot use a Comparator; use Integer[] or a custom approach when comparator ordering is required.", "Comparator.comparingInt is useful when records/objects expose a numeric key."],
    },
    {
      id: "binary-search", title: "Binary Search", introduction: "Arrays.binarySearch and Collections.binarySearch return an index or encoded insertion point. For boundary questions, write the invariant directly.",
      examples: [{ title: "Lower-bound template", code: `static int lowerBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}` }, { title: "Library search", code: `int arrayIndex = Arrays.binarySearch(nums, target);
int listIndex = Collections.binarySearch(sortedList, target);

// A negative result encodes: -(insertionPoint) - 1
int insertionPoint = arrayIndex >= 0 ? arrayIndex : -arrayIndex - 1;` }],
    },
    {
      id: "linked-lists", title: "Linked Lists", introduction: "Minimal node classes are enough. Dummy nodes simplify head changes; preserve next before rewiring pointers.",
      examples: [{ title: "Node and reversal", code: `static class ListNode {
    int val;
    ListNode next;

    ListNode(int val) {
        this.val = val;
    }
}

static ListNode reverse(ListNode head) {
    ListNode previous = null;
    ListNode current = head;
    while (current != null) {
        ListNode following = current.next;
        current.next = previous;
        previous = current;
        current = following;
    }
    return previous;
}` }],
    },
    {
      id: "trees", title: "Trees", introduction: "Use a minimal TreeNode, recursion for bounded depth, and ArrayDeque for iterative or level-order traversal.",
      examples: [{ title: "Tree node and BFS", code: `static class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

static List<Integer> levelOrder(TreeNode root) {
    List<Integer> order = new ArrayList<>();
    if (root == null) return order;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        TreeNode node = queue.poll();
        order.add(node.val);
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
    return order;
}` }],
    },
    {
      id: "graphs", title: "Graphs", introduction: "For dense integer nodes, List<List<Integer>> is a practical adjacency list. For arbitrary keys, use a Map<K, List<K>>.",
      examples: [{ title: "Adjacency list and BFS", code: `List<List<Integer>> graph = new ArrayList<>();
for (int node = 0; node < n; node++) {
    graph.add(new ArrayList<>());
}
for (int[] edge : edges) {
    graph.get(edge[0]).add(edge[1]);
}

Queue<Integer> queue = new ArrayDeque<>();
boolean[] seen = new boolean[n];
queue.offer(start);
seen[start] = true;
while (!queue.isEmpty()) {
    int node = queue.poll();
    for (int neighbor : graph.get(node)) {
        if (!seen[neighbor]) {
            seen[neighbor] = true;
            queue.offer(neighbor);
        }
    }
}` }],
    },
  ],
  templates: [
    { id: "two-pointers", title: "Two Pointers", useWhen: "A sorted sequence or pairwise constraint lets one boundary be discarded.", roadmapTopicId: "two-pointers", complexity: "Usually O(n) time and O(1) extra space.", code: `static void scanPairs(int[] nums) {
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
        if (nums[left] < nums[right]) {
            left++;
        } else {
            right--;
        }
    }
}` },
    { id: "sliding-window", title: "Sliding Window", useWhen: "A contiguous range can be updated as its boundaries move.", roadmapTopicId: "sliding-window", complexity: "Often O(n) when both boundaries move forward.", code: `static int scanWindow(int[] nums) {
    int left = 0;
    int windowSum = 0;
    int answer = 0;
    for (int right = 0; right < nums.length; right++) {
        windowSum += nums[right];
        while (windowSum > 0) { // replace with the real invalid condition
            windowSum -= nums[left++];
        }
        answer = Math.max(answer, right - left + 1);
    }
    return answer;
}` },
    { id: "binary-search", title: "Binary Search", useWhen: "The search space is sorted or a predicate is monotonic.", roadmapTopicId: "binary-search", complexity: "O(log n) predicate evaluations.", code: `static int lowerBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}` },
    { id: "bfs", title: "BFS", useWhen: "You need levels or shortest unweighted distance.", roadmapTopicId: "graphs", complexity: "O(V + E) time and O(V) space.", code: `static List<Integer> bfs(List<List<Integer>> graph, int start) {
    List<Integer> order = new ArrayList<>();
    Queue<Integer> queue = new ArrayDeque<>();
    boolean[] seen = new boolean[graph.size()];
    queue.offer(start);
    seen[start] = true;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : graph.get(node)) {
            if (!seen[neighbor]) {
                seen[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
    return order;
}` },
    { id: "dfs", title: "DFS", useWhen: "You need reachability, components, or postorder structure.", roadmapTopicId: "graphs", complexity: "O(V + E) time and O(V) space.", code: `static void dfs(List<List<Integer>> graph, int node, boolean[] seen) {
    if (seen[node]) return;
    seen[node] = true;
    for (int neighbor : graph.get(node)) {
        dfs(graph, neighbor, seen);
    }
}` },
    { id: "tree-dfs", title: "Tree DFS", useWhen: "A tree answer depends on values returned from child subtrees.", roadmapTopicId: "trees", complexity: "O(n) time and O(h) call-stack space.", code: `static int treeDepth(TreeNode node) {
    if (node == null) return 0;
    int leftDepth = treeDepth(node.left);
    int rightDepth = treeDepth(node.right);
    return 1 + Math.max(leftDepth, rightDepth);
}` },
    { id: "tree-bfs", title: "Tree BFS", useWhen: "You need levels, nearest depth, or breadth-first order.", roadmapTopicId: "trees", complexity: "O(n) time and O(w) queue space.", code: `static List<List<Integer>> treeLevels(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}` },
    { id: "backtracking", title: "Backtracking", useWhen: "You must enumerate choices and restore mutable state after each branch.", roadmapTopicId: "backtracking", complexity: "Problem-dependent and often exponential.", code: `static void generate(int[] choices, int index, List<Integer> path,
        List<List<Integer>> answers) {
    if (index == choices.length) {
        answers.add(new ArrayList<>(path));
        return;
    }
    generate(choices, index + 1, path, answers);
    path.add(choices[index]);
    generate(choices, index + 1, path, answers);
    path.remove(path.size() - 1);
}` },
    { id: "heap-top-k", title: "Heap / Top K", useWhen: "You need repeated access to the smallest candidate or a bounded top-k set.", roadmapTopicId: "heap-priority-queue", complexity: "O(n log k) time and O(k) space.", code: `static PriorityQueue<Integer> topK(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int value : nums) {
        heap.offer(value);
        if (heap.size() > k) heap.poll();
    }
    return heap;
}` },
    { id: "prefix-sum", title: "Prefix Sum", useWhen: "Many range queries can reuse cumulative work.", roadmapTopicId: "arrays-hashing", complexity: "O(n) preprocessing and O(1) per query.", code: `static long[] prefixSums(int[] nums) {
    long[] prefix = new long[nums.length + 1];
    for (int i = 0; i < nums.length; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }
    return prefix;
}

static long rangeSum(long[] prefix, int left, int right) {
    return prefix[right + 1] - prefix[left];
}` },
    { id: "monotonic-stack", title: "Monotonic Stack", useWhen: "You need the next previous greater/smaller boundary.", roadmapTopicId: "stack", complexity: "O(n) time and O(n) space.", code: `static int[] nextGreater(int[] nums) {
    int[] answer = new int[nums.length];
    Arrays.fill(answer, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            answer[stack.pop()] = i;
        }
        stack.push(i);
    }
    return answer;
}` },
    { id: "union-find", title: "Union Find", useWhen: "Edges merge components and connectivity queries repeat.", roadmapTopicId: "advanced-graphs", complexity: "Near-constant amortized operations with compression and rank.", code: `static class UnionFind {
    private final int[] parent;
    private final int[] rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int node) {
        if (parent[node] != node) parent[node] = find(parent[node]);
        return parent[node];
    }

    boolean union(int first, int second) {
        int rootA = find(first);
        int rootB = find(second);
        if (rootA == rootB) return false;
        if (rank[rootA] < rank[rootB]) {
            int swap = rootA;
            rootA = rootB;
            rootB = swap;
        }
        parent[rootB] = rootA;
        if (rank[rootA] == rank[rootB]) rank[rootA]++;
        return true;
    }
}` },
    { id: "topological-sort", title: "Topological Sort", useWhen: "Directed dependencies must be processed after prerequisites.", roadmapTopicId: "advanced-graphs", complexity: "O(V + E) time and O(V) space.", code: `static List<Integer> topologicalOrder(List<List<Integer>> graph) {
    int[] indegree = new int[graph.size()];
    for (List<Integer> neighbors : graph) {
        for (int neighbor : neighbors) indegree[neighbor]++;
    }
    Queue<Integer> queue = new ArrayDeque<>();
    for (int node = 0; node < indegree.length; node++) {
        if (indegree[node] == 0) queue.offer(node);
    }
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : graph.get(node)) {
            if (--indegree[neighbor] == 0) queue.offer(neighbor);
        }
    }
    return order.size() == graph.size() ? order : List.of();
}` },
    { id: "one-d-dp", title: "1-D Dynamic Programming", useWhen: "Each state depends on a small set of earlier states.", roadmapTopicId: "one-d-dp", complexity: "Usually O(n) time; space may compress to O(1).", code: `static int bestTotal(int[] values) {
    int previousTwo = 0;
    int previousOne = 0;
    for (int value : values) {
        int current = Math.max(previousOne, previousTwo + value);
        previousTwo = previousOne;
        previousOne = current;
    }
    return previousOne;
}` },
    { id: "grid-traversal", title: "Grid Traversal", useWhen: "Grid cells form an implicit graph with local directional moves.", roadmapTopicId: "graphs", complexity: "O(rows × cols) time and space in the worst case.", code: `static int visitGrid(int[][] grid, int startRow, int startCol) {
    int rows = grid.length;
    int cols = grid[0].length;
    int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    Queue<int[]> queue = new ArrayDeque<>();
    boolean[][] seen = new boolean[rows][cols];
    queue.offer(new int[]{startRow, startCol});
    seen[startRow][startCol] = true;
    int visited = 0;
    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        visited++;
        for (int[] direction : directions) {
            int row = cell[0] + direction[0];
            int col = cell[1] + direction[1];
            if (row >= 0 && row < rows && col >= 0 && col < cols && !seen[row][col]) {
                seen[row][col] = true;
                queue.offer(new int[]{row, col});
            }
        }
    }
    return visited;
}` },
  ],
  debuggingChecklist: [
    "Restate the invariant and trace the smallest failing input before editing the implementation.",
    "Check primitive versus reference equality, nullable wrappers, and every equals/hashCode assumption used by maps or sets.",
    "Promote operands to long before arithmetic that may overflow int; avoid subtraction comparators.",
    "Verify array, String, and collection length APIs and the chosen closed or half-open interval convention.",
    "Test empty, singleton, duplicate, overflow, Unicode, and deep traversal cases; choose an explicit stack when depth is unbounded.",
  ],
  interviewerTopics: [
    "Why == and equals answer different questions for references and how hashCode must agree with equals.",
    "Why ArrayDeque is normally preferable to legacy Stack and which operations reject null.",
    "How PriorityQueue chooses its head and how to build an overflow-safe comparator.",
    "Where boxing, unboxing, generic collections, and nullable lookup results create runtime cost or risk.",
    "When int is insufficient and why casting after an overflowing operation is too late.",
  ],
  exercises: [
    { kind: "predict", title: "Reference or value equality", prompt: "Predict the results of new String(\"x\") == new String(\"x\") and the corresponding equals call.", answerCheck: "The reference comparison is false for the two distinct objects; equals is true because String defines content equality." },
    { kind: "trace", title: "Trace queue discovery", prompt: "Trace an ArrayDeque BFS from A to neighbors B and C when both point to D. Mark visited at insertion time.", answerCheck: "D is offered once: mark it visited when B offers it so C cannot add a duplicate queue entry." },
    { kind: "repair", title: "Repair the comparator", prompt: "Replace (a, b) -> a.score - b.score and explain the failure it avoids.", answerCheck: "Use Comparator.comparingInt or Integer.compare(a.score, b.score); subtraction can overflow and violate comparator ordering." },
    { kind: "choose", title: "Choose a collection", prompt: "Choose ArrayList, HashSet, HashMap, ArrayDeque, TreeMap, or PriorityQueue for indexed access, membership, FIFO, ordered keys, and next priority.", answerCheck: "ArrayList, HashSet, ArrayDeque, TreeMap, and PriorityQueue respectively; HashMap is for key/value lookup without sorted-key requirements." },
    { kind: "transfer", title: "Unlabeled transfer", prompt: "Maintain the next three tasks by smallest deadline, breaking ties by insertion order. State the queue element and comparator.", answerCheck: "Store a record/object with deadline and sequence; compare first with Long.compare on deadline, then Long.compare on sequence." },
  ],
  mistakes: [
    { title: "Comparing strings with ==", explanation: "== compares references. Use equals for String content." },
    { title: "Defaulting to legacy Stack", explanation: "Prefer Deque with ArrayDeque for stack behavior." },
    { title: "Comparator subtraction", explanation: "a - b can overflow and break ordering. Use Integer.compare." },
    { title: "Mixing length APIs", explanation: "Arrays use length, strings use length(), and collections use size()." },
    { title: "ArrayList.remove overloads", explanation: "remove(int) uses an index; remove(Object) removes a matching value." },
    { title: "Ignoring integer overflow", explanation: "Promote to long before addition or multiplication when the result can exceed int." },
    { title: "Forgetting String immutability", explanation: "Use StringBuilder for repeated construction or mutation-like work." },
    { title: "Mutating during enhanced-for", explanation: "Structural modification can throw ConcurrentModificationException. Use an iterator or collect changes separately." },
    { title: "Mixing queue APIs", explanation: "offer/poll/peek and add/remove/element have different empty/capacity behavior. Choose intentionally." },
    { title: "Unsafe autounboxing", explanation: "Unboxing a null wrapper throws NullPointerException; check nullable map/queue results." },
  ],
};
