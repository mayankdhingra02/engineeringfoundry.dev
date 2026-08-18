import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;
import java.util.Set;

final class LanguageGuideExamples {
    static final class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;
        TreeNode(int val) { this.val = val; }
    }

    static int lowerBound(int[] nums, int target) {
        int left = 0;
        int right = nums.length;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] < target) left = mid + 1;
            else right = mid;
        }
        return left;
    }

    static List<Integer> bfs(List<List<Integer>> graph, int start) {
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
    }

    static void collectionExamples(int[] nums) {
        Arrays.sort(nums);
        List<Integer> list = new ArrayList<>();
        Map<Integer, Integer> frequency = new HashMap<>();
        Set<Integer> seen = new HashSet<>();
        Deque<Integer> stack = new ArrayDeque<>();
        Queue<Integer> queue = new ArrayDeque<>();
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        PriorityQueue<int[]> byFirst = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        StringBuilder builder = new StringBuilder();
        for (int value : nums) {
            list.add(value);
            frequency.put(value, frequency.getOrDefault(value, 0) + 1);
            seen.add(value);
            stack.push(value);
            queue.offer(value);
            minHeap.offer(value);
            maxHeap.offer(value);
            byFirst.offer(new int[]{value, value});
            builder.append(value);
        }
        if (!list.isEmpty()) list.remove(Integer.valueOf(list.get(0)));
        if (!"".equals(builder.toString())) builder.reverse();
    }
}
