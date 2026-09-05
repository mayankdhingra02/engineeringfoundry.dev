import type { LanguageGuideData } from "@/features/dsa/languages/language-guide-types";

export const pythonLanguageGuide: LanguageGuideData = {
  slug: "python",
  name: "Python",
  label: "Python for Coding Interviews",
  description: "The syntax and standard-library patterns worth remembering before a DSA interview.",
  runtimeNote: "Portable Python 3.11+ subset; examples parsed in CI with the repository runner. Reviewed against Python 3.14 documentation.",
  reviewedAt: "September 5, 2026",
  sources: [
    { id: "SRC-DSA-PY-DATA", label: "Python data structures", url: "https://docs.python.org/3/tutorial/datastructures.html", supports: "List, tuple, set, dictionary, queue, and ordering semantics." },
    { id: "SRC-DSA-PY-COLLECTIONS", label: "Python collections", url: "https://docs.python.org/3/library/collections.html", supports: "deque, Counter, and defaultdict behavior and cost boundaries." },
    { id: "SRC-DSA-PY-HEAPQ", label: "Python heapq", url: "https://docs.python.org/3/library/heapq.html", supports: "Heap invariants, push/pop behavior, and supported max-heap operations." },
    { id: "SRC-DSA-PY-BISECT", label: "Python bisect", url: "https://docs.python.org/3/library/bisect.html", supports: "Insertion-point semantics and the linear insertion-cost caveat." },
  ],
  quickReference: [
    { title: "Iteration and ordering", code: `for i, value in enumerate(nums):
    pass

for left, right in zip(nums, nums[1:]):
    pass

for i in range(len(nums) - 1, -1, -1):
    pass

nums.sort()
items.sort(key=lambda item: (item[0], -item[1]))` },
    { title: "Counting and adjacency", code: `from collections import Counter, defaultdict

frequency = Counter(nums)
graph = defaultdict(list)

for source, target in edges:
    graph[source].append(target)` },
    { title: "Queue and heap", code: `from collections import deque
import heapq

queue = deque([start])
node = queue.popleft()

heap = []
heapq.heappush(heap, (priority, value))
priority, value = heapq.heappop(heap)` },
    { title: "Sorted boundaries", code: `from bisect import bisect_left, bisect_right

first = bisect_left(nums, target)
after_last = bisect_right(nums, target)

left, right = 0, len(nums) - 1
while left <= right:
    mid = left + (right - left) // 2
    if nums[mid] < target:
        left = mid + 1
    else:
        right = mid - 1` },
  ],
  sections: [
    {
      id: "python-basics", title: "Python Interview Basics", introduction: "Use the compact constructs that improve clarity under time pressure; avoid clever one-liners that hide the invariant.",
      examples: [{ title: "Useful syntax", code: `minimum = min(nums, default=0)
total = sum(nums)
ordered = sorted(nums, reverse=True)

quotient = 7 // 3       # floor division
letter_index = ord("c") - ord("a")
letter = chr(ord("a") + letter_index)

left, right = right, left
label = "even" if value % 2 == 0 else "odd"` }],
      points: ["Tuple unpacking is useful for swaps and coordinates.", "Slicing creates a copy; account for it inside loops.", "Use enumerate when both index and value matter, and zip for aligned sequences."],
    },
    {
      id: "lists-arrays", title: "Lists / Arrays", introduction: "A list is Python’s dynamic-array workhorse. End operations are efficient; front insertion and removal shift elements.",
      examples: [{ title: "List operations and safe grids", code: `nums = [0] * n
nums.append(value)
last = nums.pop()
copy = nums.copy()
reversed_copy = nums[::-1]
nums.reverse()

# Each row is a distinct list.
grid = [[0] * cols for _ in range(rows)]` }],
      warning: "Do not write grid = [[0] * cols] * rows. Every row aliases the same inner list, so one update changes multiple rows.",
      complexity: [
        { operation: "list.append(x)", complexity: "O(1) amortized" }, { operation: "list.pop()", complexity: "O(1)" },
        { operation: "list.pop(0)", complexity: "O(n)", note: "Use deque for a queue." }, { operation: "x in list", complexity: "O(n)" },
        { operation: "nums[a:b]", complexity: "O(k)", note: "Copies k elements." }, { operation: "nums.sort()", complexity: "O(n log n)" },
      ],
    },
    {
      id: "strings", title: "Strings", introduction: "Strings are immutable. Index and slice freely when the copying cost is acceptable; accumulate many fragments in a list.",
      examples: [{ title: "String operations", code: `character = text[i]
prefix = text[:i]
words = text.split()
joined = " ".join(words)
is_digit = character.isdigit()

chars = []
chars.append("a")
chars.append("b")
result = "".join(chars)` }],
      points: ["Use ord and chr for character/integer conversions.", "Use == for content equality.", "Repeated concatenation in a loop can create avoidable copying."],
    },
    {
      id: "hash-maps-sets", title: "Hash Maps / Sets", introduction: "dict and set provide average O(1) lookup and are the default tools for counting, deduplication, and visited state.",
      examples: [{ title: "Lookup patterns", code: `from collections import Counter, defaultdict

frequency = {}
for value in nums:
    frequency[value] = frequency.get(value, 0) + 1

counts = Counter(nums)
groups = defaultdict(list)
seen = set()

for key, count in frequency.items():
    pass` }],
      complexity: [{ operation: "mapping[key]", complexity: "O(1) average" }, { operation: "key in mapping", complexity: "O(1) average" }, { operation: "value in seen", complexity: "O(1) average" }],
    },
    {
      id: "stack-queue", title: "Stack / Queue / Deque", introduction: "Use list for a stack and collections.deque for FIFO work or operations at both ends.",
      examples: [{ title: "Stack and queue", code: `from collections import deque

stack = []
stack.append(value)
value = stack.pop()

queue = deque()
queue.append(value)
value = queue.popleft()` }],
      warning: "list.pop(0) is O(n), not a queue operation you want inside a BFS loop.",
    },
    {
      id: "heap", title: "Heap / Priority Queue", introduction: "heapq is a min-heap. Store tuples for priority plus payload, heapify an existing list in O(n), and keep tuple tie-breakers comparable.",
      examples: [{ title: "Min heap, max heap, and top K", code: `import heapq

min_heap = list(nums)
heapq.heapify(min_heap)
heapq.heappush(min_heap, value)
smallest = heapq.heappop(min_heap)

# Portable max-heap pattern for numeric priorities.
max_heap = []
heapq.heappush(max_heap, (-priority, value))
priority, value = heapq.heappop(max_heap)
priority = -priority

largest_k = heapq.nlargest(k, nums)` }],
      warning: "heapq orders tuples lexicographically. If priorities tie, later tuple fields must still be mutually comparable.",
      complexity: [{ operation: "heapq.heapify(values)", complexity: "O(n)" }, { operation: "heappush / heappop", complexity: "O(log n)" }, { operation: "heap[0]", complexity: "O(1)" }],
    },
    {
      id: "sorting", title: "Sorting", introduction: "Use list.sort() to mutate and sorted() to return a new list. Prefer key functions to custom comparison logic.",
      examples: [{ title: "Custom sorting", code: `nums.sort()
descending = sorted(nums, reverse=True)
intervals.sort(key=lambda interval: interval[0])
items.sort(key=lambda item: (item[0], -item[1]))` }],
    },
    {
      id: "binary-search", title: "Binary Search", introduction: "bisect is ideal for insertion boundaries. Use a manual template when the interview is testing the boundary invariant itself.",
      examples: [{ title: "Lower bound", code: `def lower_bound(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left` }, { title: "bisect boundaries", code: `from bisect import bisect_left, bisect_right

first_at_least_target = bisect_left(nums, target)
first_greater_than_target = bisect_right(nums, target)` }],
    },
    {
      id: "linked-lists", title: "Linked Lists", introduction: "Keep node definitions minimal. Dummy nodes simplify head changes; fast/slow pointers handle cycle and midpoint work.",
      examples: [{ title: "Node and reversal", code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse(head: ListNode | None) -> ListNode | None:
    previous = None
    current = head
    while current:
        following = current.next
        current.next = previous
        previous = current
        current = following
    return previous` }],
    },
    {
      id: "trees", title: "Trees", introduction: "Use recursive DFS when depth is safe, an explicit stack when it is not, and deque for level-order traversal.",
      examples: [{ title: "Tree node and traversals", code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def preorder(root: TreeNode | None) -> list[int]:
    if not root:
        return []
    return [root.val] + preorder(root.left) + preorder(root.right)

def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    queue, levels = deque([root]), []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        levels.append(level)
    return levels` }],
    },
    {
      id: "graphs", title: "Graphs", introduction: "Choose an adjacency list representation that matches whether nodes are dense integers or arbitrary keys, then mark visited state deliberately.",
      examples: [{ title: "Adjacency lists and traversal", code: `from collections import defaultdict, deque

graph_by_key = defaultdict(list)
graph_by_index = [[] for _ in range(n)]

def bfs(graph: dict[int, list[int]], start: int) -> list[int]:
    queue, seen, order = deque([start]), {start}, []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph.get(node, []):
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append(neighbor)
    return order` }],
      warning: "For BFS, mark a node seen when you enqueue it. Waiting until dequeue can add the same node many times.",
    },
    {
      id: "standard-library", title: "Useful Standard Library", introduction: "Know a small, dependable set of tools well enough to explain their behavior and complexity.",
      points: ["collections: Counter, defaultdict, deque", "heapq: heapify, heappush, heappop, nsmallest, nlargest", "bisect: bisect_left and bisect_right", "math: inf, gcd, ceil, floor, isqrt", "itertools: accumulate, combinations, permutations only when the problem truly calls for them"],
    },
  ],
  templates: [
    { id: "two-pointers", title: "Two Pointers", useWhen: "A sorted sequence or pairwise constraint lets you discard one side at a time.", roadmapTopicId: "two-pointers", complexity: "Usually O(n) time and O(1) extra space.", code: `def scan_pairs(nums: list[int]) -> None:
    left, right = 0, len(nums) - 1
    while left < right:
        if should_move_left(nums[left], nums[right]):
            left += 1
        else:
            right -= 1

def should_move_left(left_value: int, right_value: int) -> bool:
    return left_value < right_value` },
    { id: "sliding-window", title: "Sliding Window", useWhen: "A contiguous range can be maintained incrementally as its boundaries move.", roadmapTopicId: "sliding-window", complexity: "Often O(n) when each boundary advances at most n times.", code: `def scan_window(nums: list[int]) -> int:
    left = 0
    answer = 0
    window_sum = 0
    for right, value in enumerate(nums):
        window_sum += value
        while window_sum > 0:  # replace with the real invalid condition
            window_sum -= nums[left]
            left += 1
        answer = max(answer, right - left + 1)
    return answer` },
    { id: "binary-search", title: "Binary Search", useWhen: "The search space is ordered or a feasibility predicate is monotonic.", roadmapTopicId: "binary-search", complexity: "O(log n) predicate evaluations.", code: `def first_true(left: int, right: int) -> int:
    while left < right:
        mid = left + (right - left) // 2
        if feasible(mid):
            right = mid
        else:
            left = mid + 1
    return left

def feasible(value: int) -> bool:
    return value >= 0` },
    { id: "bfs", title: "BFS", useWhen: "You need shortest unweighted distance, levels, or layer-by-layer traversal.", roadmapTopicId: "graphs", complexity: "O(V + E) time and O(V) space.", code: `from collections import deque

def bfs(graph: list[list[int]], start: int) -> list[int]:
    queue, seen, order = deque([start]), {start}, []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append(neighbor)
    return order` },
    { id: "dfs", title: "DFS", useWhen: "You need reachability, components, path exploration, or postorder structure.", roadmapTopicId: "graphs", complexity: "O(V + E) time and O(V) space.", code: `def dfs(graph: list[list[int]], start: int) -> list[int]:
    stack, seen, order = [start], set(), []
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        order.append(node)
        stack.extend(reversed(graph[node]))
    return order` },
    { id: "tree-dfs", title: "Tree DFS", useWhen: "A tree answer depends on information returned from subtrees.", roadmapTopicId: "trees", complexity: "O(n) time and O(h) call-stack space.", code: `def tree_depth(node: TreeNode | None) -> int:
    if not node:
        return 0
    left_depth = tree_depth(node.left)
    right_depth = tree_depth(node.right)
    return 1 + max(left_depth, right_depth)` },
    { id: "tree-bfs", title: "Tree BFS", useWhen: "You need levels, nearest depth, or breadth-first tree order.", roadmapTopicId: "trees", complexity: "O(n) time and O(w) queue space.", code: `from collections import deque

def tree_levels(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    queue, result = deque([root]), []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            for child in (node.left, node.right):
                if child:
                    queue.append(child)
        result.append(level)
    return result` },
    { id: "backtracking", title: "Backtracking", useWhen: "You must enumerate choices while restoring state after each branch.", roadmapTopicId: "backtracking", complexity: "Problem-dependent; often exponential in decision depth.", code: `def generate(choices: list[int]) -> list[list[int]]:
    answers, path = [], []

    def search(index: int) -> None:
        if index == len(choices):
            answers.append(path.copy())
            return
        search(index + 1)
        path.append(choices[index])
        search(index + 1)
        path.pop()

    search(0)
    return answers` },
    { id: "heap-top-k", title: "Heap / Top K", useWhen: "You need repeated access to the smallest/largest candidate without sorting everything.", roadmapTopicId: "heap-priority-queue", complexity: "O(n log k) time and O(k) space for a size-k heap.", code: `import heapq

def top_k(nums: list[int], k: int) -> list[int]:
    heap: list[int] = []
    for value in nums:
        heapq.heappush(heap, value)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap` },
    { id: "prefix-sum", title: "Prefix Sum", useWhen: "Many range-sum queries can reuse cumulative work.", roadmapTopicId: "arrays-hashing", complexity: "O(n) preprocessing and O(1) per range query.", code: `def prefix_sums(nums: list[int]) -> list[int]:
    prefix = [0]
    for value in nums:
        prefix.append(prefix[-1] + value)
    return prefix

def range_sum(prefix: list[int], left: int, right: int) -> int:
    return prefix[right + 1] - prefix[left]` },
    { id: "monotonic-stack", title: "Monotonic Stack", useWhen: "You need the next previous greater/smaller boundary for each element.", roadmapTopicId: "stack", complexity: "O(n) time and O(n) space.", code: `def next_greater(nums: list[int]) -> list[int]:
    answer = [-1] * len(nums)
    stack: list[int] = []
    for i, value in enumerate(nums):
        while stack and nums[stack[-1]] < value:
            answer[stack.pop()] = i
        stack.append(i)
    return answer` },
    { id: "union-find", title: "Union Find", useWhen: "Edges merge components and you need fast connectivity checks.", roadmapTopicId: "advanced-graphs", complexity: "Near-constant amortized operations with path compression and rank.", code: `class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, node: int) -> int:
        if self.parent[node] != node:
            self.parent[node] = self.find(self.parent[node])
        return self.parent[node]

    def union(self, first: int, second: int) -> bool:
        root_a, root_b = self.find(first), self.find(second)
        if root_a == root_b:
            return False
        if self.rank[root_a] < self.rank[root_b]:
            root_a, root_b = root_b, root_a
        self.parent[root_b] = root_a
        if self.rank[root_a] == self.rank[root_b]:
            self.rank[root_a] += 1
        return True` },
    { id: "topological-sort", title: "Topological Sort", useWhen: "Directed dependencies must be processed only after their prerequisites.", roadmapTopicId: "advanced-graphs", complexity: "O(V + E) time and O(V) space.", code: `from collections import deque

def topological_order(graph: list[list[int]]) -> list[int]:
    indegree = [0] * len(graph)
    for neighbors in graph:
        for neighbor in neighbors:
            indegree[neighbor] += 1
    queue = deque(i for i, degree in enumerate(indegree) if degree == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    return order if len(order) == len(graph) else []` },
    { id: "one-d-dp", title: "1-D Dynamic Programming", useWhen: "Each state depends on a small set of earlier states along one dimension.", roadmapTopicId: "one-d-dp", complexity: "Usually O(n) time; space may compress to O(1).", code: `def best_total(values: list[int]) -> int:
    previous_two = 0
    previous_one = 0
    for value in values:
        current = max(previous_one, previous_two + value)
        previous_two, previous_one = previous_one, current
    return previous_one` },
    { id: "grid-traversal", title: "Grid Traversal", useWhen: "Cells form an implicit graph with local directional moves.", roadmapTopicId: "graphs", complexity: "O(rows × cols) time and space in the worst case.", code: `from collections import deque

def visit_grid(grid: list[list[int]], start_row: int, start_col: int) -> set[tuple[int, int]]:
    rows, cols = len(grid), len(grid[0])
    queue = deque([(start_row, start_col)])
    seen = {(start_row, start_col)}
    while queue:
        row, col = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = row + dr, col + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc))
    return seen` },
  ],
  debuggingChecklist: [
    "Restate the invariant and trace the smallest failing input before changing code.",
    "Check aliasing, mutable defaults, slice copies, and whether a nested container shares references.",
    "Verify every index boundary and whether binary-search intervals are closed or half-open.",
    "Inspect queue and heap operations for an accidental O(n) front removal or reversed priority.",
    "Test empty, singleton, duplicate, negative, and depth-heavy inputs; replace recursion when depth is not bounded.",
  ],
  interviewerTopics: [
    "Why dict and set keys must be hashable, and what mutation would invalidate a key model.",
    "When deque is a better queue than list and when list remains better for indexed access.",
    "What slicing and repeated string concatenation allocate.",
    "How tuple ordering affects heap tie-breaking and what happens when payloads are incomparable.",
    "When recursion depth makes an iterative traversal safer.",
  ],
  exercises: [
    { kind: "predict", title: "Find the alias", prompt: "Predict which cells change after grid = [[0] * 2] * 2; grid[0][1] = 7, and explain why.", answerCheck: "Both rows show 7 in column 1 because the outer list contains two references to the same inner list." },
    { kind: "trace", title: "Trace one BFS layer", prompt: "Using deque, trace queue and visited state when A connects to B and C and both connect to D. Mark when visited changes.", answerCheck: "Mark on enqueue: start [A]/{A}; after A, [B,C]/{A,B,C}; after B, [C,D]/{A,B,C,D}; C must not enqueue D again." },
    { kind: "repair", title: "Repair the queue", prompt: "A BFS repeatedly calls items.pop(0). Replace only the queue mechanics and state the complexity change.", answerCheck: "Use collections.deque with popleft; front removal changes from O(n) shifting to approximately O(1)." },
    { kind: "choose", title: "Choose a container", prompt: "Choose list, set, dict, deque, or heap for membership, stable append order, FIFO removal, and retaining the smallest k boundary.", answerCheck: "Set for membership, list for indexed append order, deque for FIFO, and a bounded max-heap strategy for retaining the smallest k." },
    { kind: "transfer", title: "Unlabeled transfer", prompt: "Given a stream of events, keep the three highest priorities while preserving a deterministic order among ties. Name the stored tuple and test one tie.", answerCheck: "Use a size-three min-heap with a numeric tie-breaker such as (priority, sequence, event); never let Python compare non-orderable event payloads." },
  ],
  mistakes: [
    { title: "Using pop(0) for a queue", explanation: "It shifts the remaining list and costs O(n). Use deque.popleft()." },
    { title: "Aliasing a 2-D list", explanation: "[[0] * cols] * rows repeats references to one inner list. Build each row independently." },
    { title: "Forgetting string immutability", explanation: "Accumulate many characters in a list and join once." },
    { title: "Confusing / and //", explanation: "/ returns floating-point division; // performs floor division." },
    { title: "Treating heapq as a max heap", explanation: "heapq is a min-heap. Use an intentional max-heap strategy for the supported runtime." },
    { title: "Ignoring recursion depth", explanation: "A very deep DFS can exceed Python’s recursion limit; use an explicit stack when depth is unbounded." },
    { title: "Costly slicing inside loops", explanation: "A slice copies its elements. Repeated large slices can turn an intended linear solution quadratic." },
    { title: "Unsafe heap tuple ties", explanation: "When priorities tie, Python compares later tuple fields. Add a deterministic numeric tie-breaker when payloads are not comparable." },
    { title: "Mutating while iterating", explanation: "Iterate over a copy or collect updates separately when structural mutation would change traversal behavior." },
  ],
};
