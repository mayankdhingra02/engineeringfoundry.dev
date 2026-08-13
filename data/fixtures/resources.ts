import type { Resource } from "@/types";

export const resources: Resource[] = [
  { id: "r1", title: "Coding Practice Platform", description: "Demo entry for a question-practice platform with filters and guided tracks.", category: "DSA", type: "Platform", url: "https://leetcode.com/", access: "Freemium", tags: ["practice", "coding"], demo: true },
  { id: "r2", title: "Systems Reading List", description: "Demo collection of foundational distributed-systems papers and engineering articles.", category: "System Design", type: "Blog", url: "https://github.com/donnemartin/system-design-primer", access: "Free", tags: ["architecture", "distributed systems"], demo: true },
  { id: "r3", title: "ML Systems Primer", description: "Demo learning path covering data, training, serving, and monitoring concepts.", category: "ML Design", type: "Course", url: "https://madewithml.com/", access: "Free", tags: ["mlops", "serving"], demo: true },
  { id: "r4", title: "Behavioral Story Workbook", description: "Demo template for organizing impact stories using the STAR framework.", category: "Behavioral", type: "Book", url: "https://engineeringfoundry.dev/resources", access: "Free", tags: ["STAR", "communication"], demo: true },
];
