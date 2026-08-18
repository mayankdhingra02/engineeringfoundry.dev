export type DSALanguageStatus = "published" | "coming-soon";

export interface DSALanguage {
  slug: "python" | "java" | "cpp" | "javascript-typescript" | "go";
  name: string;
  shortName: string;
  description: string;
  strengths: string[];
  watchFor: string[];
  status: DSALanguageStatus;
  prominence: "primary" | "standard";
  keywords: string[];
}

export const dsaLanguages: DSALanguage[] = [
  { slug: "python", name: "Python", shortName: "Python", description: "Concise syntax, practical collections, and reusable templates for time-boxed interview coding.", strengths: ["Low ceremony", "Built-in hash collections", "Readable pseudocode-like solutions"], watchFor: ["Heap direction", "Recursion depth", "Accidental quadratic string work"], status: "published", prominence: "primary", keywords: ["deque", "heapq", "bisect", "collections", "python dsa"] },
  { slug: "java", name: "Java", shortName: "Java", description: "Collections Framework, PriorityQueue, arrays, comparators, StringBuilder, and reusable interview templates.", strengths: ["Explicit types", "Strong standard collections", "Predictable implementation details"], watchFor: ["Comparator overflow", "Primitive boxing", "String equality"], status: "published", prominence: "primary", keywords: ["ArrayList", "HashMap", "ArrayDeque", "PriorityQueue", "java dsa"] },
  { slug: "cpp", name: "C++", shortName: "C++", description: "Fast, expressive standard-library tools for candidates already comfortable with ownership and iterator details.", strengths: ["Powerful STL", "Efficient containers", "Flexible algorithms"], watchFor: ["Comparator direction", "Iterator invalidation", "Undefined behavior"], status: "coming-soon", prominence: "standard", keywords: ["vector", "unordered_map", "priority_queue", "cpp dsa"] },
  { slug: "javascript-typescript", name: "JavaScript / TypeScript", shortName: "JS / TS", description: "A familiar choice for web engineers, with a few data-structure gaps worth preparing for explicitly.", strengths: ["Familiar syntax", "Fast iteration", "Good object and map support"], watchFor: ["No built-in heap", "Numeric sorting", "Shift complexity"], status: "coming-soon", prominence: "standard", keywords: ["Map", "Set", "typescript dsa", "javascript dsa"] },
  { slug: "go", name: "Go", shortName: "Go", description: "Simple control flow and explicit data structures for candidates fluent in Go's standard library.", strengths: ["Simple syntax", "Straightforward slices and maps", "Explicit implementations"], watchFor: ["Heap interface ceremony", "No generic utility set in older codebases", "Rune versus byte handling"], status: "coming-soon", prominence: "standard", keywords: ["slices", "maps", "container heap", "go dsa"] },
];

export function getDsaLanguage(slug: string) {
  return dsaLanguages.find((language) => language.slug === slug);
}
