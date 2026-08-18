import { patternBySlug, topicBySlug } from "@/data/dsa";
import type { DSAInterviewQuestion } from "@/data/dsa/interview-prep";

export type CoreRoadmapLevel = "foundations" | "core" | "advanced";

export interface CoreRoadmapQuestionFilter {
  kind: "topic" | "search";
  value: string;
}

export interface CoreRoadmapTopic {
  id: string;
  title: string;
  level: CoreRoadmapLevel;
  description: string;
  prerequisites: string[];
  patterns: string[];
  questionFilter?: CoreRoadmapQuestionFilter;
  guideSlug?: string;
  layout: { row: number; lane: number };
}

export interface CoreRoadmapTrack {
  id: string;
  title: string;
  description: string;
  topics: CoreRoadmapTopic[];
}

function topicSummary(slug: string) {
  const topic = topicBySlug.get(slug);
  if (!topic) throw new Error(`Core roadmap references an unknown topic summary: ${slug}`);
  return topic.summary;
}

function patternSummary(slug: string) {
  const pattern = patternBySlug.get(slug);
  if (!pattern) throw new Error(`Core roadmap references an unknown pattern summary: ${slug}`);
  return pattern.summary;
}

export const coreInterviewRoadmap: CoreRoadmapTrack = {
  id: "core",
  title: "Core Interview Roadmap",
  description: "A dependency map for learning the DSA topics and patterns most useful in coding interviews.",
  topics: [
    { id: "arrays-hashing", title: "Arrays & Hashing", level: "foundations", description: "Build fluency with indexed scans, lookup state, counting, and grouping before adding more specialized patterns.", prerequisites: [], patterns: ["Frequency Map", "Prefix Sum", "Sorting"], questionFilter: { kind: "topic", value: "arrays" }, guideSlug: "arrays", layout: { row: 0, lane: 2 } },
    { id: "two-pointers", title: "Two Pointers", level: "foundations", description: patternSummary("two-pointers"), prerequisites: ["arrays-hashing"], patterns: ["Opposing pointers", "Fast & slow pointers", "In-place compaction"], questionFilter: { kind: "search", value: "Two Pointers" }, layout: { row: 1, lane: 1 } },
    { id: "stack", title: "Stack", level: "foundations", description: patternSummary("stack"), prerequisites: ["arrays-hashing"], patterns: ["Monotonic Stack", "Delimiter matching", "Unresolved history"], questionFilter: { kind: "topic", value: "stacks-and-queues" }, guideSlug: "stacks-queues", layout: { row: 1, lane: 3 } },
    { id: "binary-search", title: "Binary Search", level: "foundations", description: topicSummary("binary-search"), prerequisites: ["two-pointers"], patterns: ["Ordered search", "Monotonic feasibility", "Boundary search"], questionFilter: { kind: "topic", value: "binary-search" }, guideSlug: "binary-search", layout: { row: 2, lane: 0 } },
    { id: "sliding-window", title: "Sliding Window", level: "foundations", description: patternSummary("sliding-window"), prerequisites: ["two-pointers"], patterns: ["Fixed window", "Variable window", "Incremental state"], questionFilter: { kind: "search", value: "Sliding Window" }, layout: { row: 2, lane: 2 } },
    { id: "linked-list", title: "Linked List", level: "foundations", description: topicSummary("linked-lists"), prerequisites: ["two-pointers"], patterns: ["Pointer rewiring", "Fast & slow pointers", "Sentinel node"], questionFilter: { kind: "topic", value: "linked-lists" }, guideSlug: "linked-lists", layout: { row: 2, lane: 4 } },
    { id: "trees", title: "Trees", level: "core", description: topicSummary("trees"), prerequisites: ["binary-search", "linked-list"], patterns: ["DFS", "BFS", "Recursive traversal", "Level-order traversal"], questionFilter: { kind: "topic", value: "trees" }, guideSlug: "trees", layout: { row: 3, lane: 2 } },
    { id: "tries", title: "Tries", level: "core", description: topicSummary("tries"), prerequisites: ["trees"], patterns: ["Prefix search", "Character branching", "Dictionary traversal"], questionFilter: { kind: "topic", value: "tries" }, guideSlug: "tries", layout: { row: 4, lane: 0 } },
    { id: "heap-priority-queue", title: "Heap / Priority Queue", level: "core", description: topicSummary("heaps"), prerequisites: ["trees"], patterns: ["Top K", "Heap selection", "K-way merge"], questionFilter: { kind: "topic", value: "heaps" }, guideSlug: "heaps", layout: { row: 4, lane: 2 } },
    { id: "backtracking", title: "Backtracking", level: "core", description: topicSummary("backtracking"), prerequisites: ["trees"], patterns: ["Choose, explore, undo", "Constraint search", "Pruning"], questionFilter: { kind: "topic", value: "backtracking" }, guideSlug: "backtracking", layout: { row: 4, lane: 4 } },
    { id: "intervals", title: "Intervals", level: "core", description: topicSummary("intervals"), prerequisites: ["heap-priority-queue"], patterns: ["Merge Intervals", "Endpoint ordering", "Sweep decisions"], questionFilter: { kind: "topic", value: "intervals" }, guideSlug: "intervals", layout: { row: 5, lane: 0 } },
    { id: "greedy", title: "Greedy", level: "core", description: topicSummary("greedy"), prerequisites: ["heap-priority-queue"], patterns: ["Exchange argument", "Earliest finish", "Boundary optimization"], questionFilter: { kind: "topic", value: "greedy" }, guideSlug: "greedy", layout: { row: 5, lane: 1.3 } },
    { id: "graphs", title: "Graphs", level: "advanced", description: topicSummary("graphs"), prerequisites: ["backtracking"], patterns: ["DFS", "BFS", "Connected components", "Topological Sort"], questionFilter: { kind: "topic", value: "graphs" }, guideSlug: "graphs", layout: { row: 5, lane: 3 } },
    { id: "one-d-dp", title: "1-D Dynamic Programming", level: "advanced", description: patternSummary("1d-dp"), prerequisites: ["backtracking"], patterns: ["Take or skip", "Linear state", "Rolling state"], questionFilter: { kind: "search", value: "1D DP" }, guideSlug: "dynamic-programming", layout: { row: 5, lane: 4 } },
    { id: "advanced-graphs", title: "Advanced Graphs", level: "advanced", description: "Combine dependency ordering, shortest paths, connectivity, and weighted traversal after basic graph state feels routine.", prerequisites: ["heap-priority-queue", "graphs"], patterns: ["Topological Sort", "Union Find", "Shortest path", "Minimum spanning tree"], questionFilter: { kind: "search", value: "Topological Sort" }, guideSlug: "graphs", layout: { row: 6, lane: 1.5 } },
    { id: "two-d-dp", title: "2-D Dynamic Programming", level: "advanced", description: patternSummary("2d-dp"), prerequisites: ["graphs", "one-d-dp"], patterns: ["Grid state", "Two-sequence state", "State compression"], questionFilter: { kind: "search", value: "2D DP" }, guideSlug: "dynamic-programming", layout: { row: 6, lane: 3 } },
    { id: "bit-manipulation", title: "Bit Manipulation", level: "advanced", description: topicSummary("bit-manipulation"), prerequisites: ["one-d-dp"], patterns: ["XOR identities", "Bit masks", "Parity"], questionFilter: { kind: "topic", value: "bit-manipulation" }, guideSlug: "bit-manipulation", layout: { row: 6, lane: 4.2 } },
    { id: "math-geometry", title: "Math & Geometry", level: "advanced", description: "Use arithmetic invariants, coordinate reasoning, and geometric structure when collection-based patterns are not enough.", prerequisites: ["two-d-dp", "bit-manipulation"], patterns: ["Coordinate transforms", "Number theory", "Matrix simulation"], layout: { row: 7, lane: 3.6 } },
  ],
};

export function getCoreRoadmapTopic(id: string) {
  return coreInterviewRoadmap.topics.find((topic) => topic.id === id);
}

export function getRoadmapPracticeHref(topic: CoreRoadmapTopic) {
  if (!topic.questionFilter) return undefined;
  const params = new URLSearchParams();
  params.set(topic.questionFilter.kind === "topic" ? "topic" : "q", topic.questionFilter.value);
  return `/dsa/questions?${params.toString()}`;
}

function questionMatches(question: DSAInterviewQuestion, filter: CoreRoadmapQuestionFilter) {
  const normalize = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (filter.kind === "topic") return question.topics.some((topic) => normalize(topic) === filter.value);
  const haystack = [question.title, ...question.topics, ...question.patterns].join(" ").toLowerCase();
  return haystack.includes(filter.value.toLowerCase());
}

export function getCoreRoadmapQuestionCounts(questions: DSAInterviewQuestion[]) {
  return Object.fromEntries(coreInterviewRoadmap.topics.map((topic) => [topic.id, topic.questionFilter ? questions.filter((question) => questionMatches(question, topic.questionFilter!)).length : 0]));
}

export function assertCoreRoadmapIntegrity(track: CoreRoadmapTrack = coreInterviewRoadmap) {
  const ids = new Set<string>();
  const positions = new Set<string>();
  for (const topic of track.topics) {
    if (ids.has(topic.id)) throw new Error(`Duplicate core roadmap topic: ${topic.id}`);
    ids.add(topic.id);
    const position = `${topic.layout.row}:${topic.layout.lane}`;
    if (positions.has(position)) throw new Error(`Overlapping core roadmap position: ${position}`);
    positions.add(position);
    if (topic.guideSlug && !topicBySlug.has(topic.guideSlug)) throw new Error(`Missing topic guide slug for ${topic.id}: ${topic.guideSlug}`);
  }
  for (const topic of track.topics) for (const prerequisite of topic.prerequisites) if (!ids.has(prerequisite)) throw new Error(`Missing prerequisite ${prerequisite} for ${topic.id}`);

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(track.topics.map((topic) => [topic.id, topic]));
  function visit(id: string) {
    if (visiting.has(id)) throw new Error(`Cycle detected in core roadmap at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  }
  for (const topic of track.topics) visit(topic.id);
  return true;
}

assertCoreRoadmapIntegrity();
