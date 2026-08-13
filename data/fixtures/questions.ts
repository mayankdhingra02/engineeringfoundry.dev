import type { Question } from "@/types";

export const dsaTopics = ["All topics", "Arrays", "Strings", "Hash Maps", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Binary Search", "Sliding Window", "Two Pointers", "Heaps", "Backtracking"];

export const questions: Question[] = [
  { id: "q1", title: "Pair Sum Warm-up", difficulty: "Easy", topic: "Arrays", companies: ["Google", "Meta"], completed: true, externalUrl: "https://leetcode.com/problemset/" },
  { id: "q2", title: "Longest Unique Window", difficulty: "Medium", topic: "Sliding Window", companies: ["Amazon"], completed: false, externalUrl: "https://leetcode.com/problemset/" },
  { id: "q3", title: "Level Order Traversal", difficulty: "Medium", topic: "Trees", companies: ["Microsoft", "LinkedIn"], completed: false, externalUrl: "https://leetcode.com/problemset/" },
  { id: "q4", title: "Dependency Ordering", difficulty: "Medium", topic: "Graphs", companies: ["Google"], completed: false, externalUrl: "https://leetcode.com/problemset/" },
  { id: "q5", title: "Balanced Partition", difficulty: "Hard", topic: "Dynamic Programming", companies: ["Meta"], completed: false, externalUrl: "https://leetcode.com/problemset/" },
  { id: "q6", title: "Merge Sorted Streams", difficulty: "Hard", topic: "Heaps", companies: ["Apple", "Amazon"], completed: true, externalUrl: "https://leetcode.com/problemset/" },
];
