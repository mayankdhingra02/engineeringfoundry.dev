import { readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const data = read("data/dsa/core-roadmap.ts");
const topicRows = [...data.matchAll(/\{ id: "([^"]+)", title: "([^"]+)", level: "([^"]+)"[^\n]+prerequisites: \[([^\]]*)\]/g)].map((match) => ({ id: match[1], title: match[2], level: match[3], prerequisites: [...match[4].matchAll(/"([^"]+)"/g)].map((item) => item[1]) }));
if (topicRows.length !== 18) failures.push(`Core roadmap has ${topicRows.length} topics; expected 18.`);
const ids = new Set(topicRows.map((topic) => topic.id));
if (ids.size !== topicRows.length) failures.push("Core roadmap contains duplicate topic IDs.");
for (const topic of topicRows) for (const prerequisite of topic.prerequisites) if (!ids.has(prerequisite)) failures.push(`${topic.id} references missing prerequisite ${prerequisite}.`);

const visiting = new Set(); const visited = new Set();
const byId = new Map(topicRows.map((topic) => [topic.id, topic]));
function visit(id) {
  if (visiting.has(id)) { failures.push(`Core roadmap contains a cycle at ${id}.`); return; }
  if (visited.has(id)) return;
  visiting.add(id); for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite); visiting.delete(id); visited.add(id);
}
for (const topic of topicRows) visit(topic.id);

for (const id of ["arrays-hashing", "two-pointers", "stack", "binary-search", "sliding-window", "linked-list", "trees", "tries", "heap-priority-queue", "backtracking", "intervals", "greedy", "graphs", "advanced-graphs", "one-d-dp", "two-d-dp", "bit-manipulation", "math-geometry"]) if (!ids.has(id)) failures.push(`Core roadmap is missing ${id}.`);
for (const edge of [["binary-search", "trees"], ["linked-list", "trees"], ["heap-priority-queue", "advanced-graphs"], ["graphs", "advanced-graphs"], ["graphs", "two-d-dp"], ["one-d-dp", "two-d-dp"], ["two-d-dp", "math-geometry"], ["bit-manipulation", "math-geometry"]]) if (!byId.get(edge[1])?.prerequisites.includes(edge[0])) failures.push(`Core roadmap is missing shared dependency ${edge[0]} -> ${edge[1]}.`);
for (const marker of ["assertCoreRoadmapIntegrity", "getCoreRoadmapQuestionCounts", "getRoadmapPracticeHref", 'kind: "topic"', 'kind: "search"']) requireText(data, marker, `Core roadmap data lacks ${marker}.`);
prohibit(data, /completed|progress|streak|\bXP\b|badge/i, "Core roadmap data contains unsupported progress or gamification state.");

const canvas = read("features/dsa/roadmap/roadmap-canvas.tsx");
for (const marker of ["createRoadmapLayout", "getRoadmapAncestors", "onPointerDown", "onPointerMove", "handleWheel", "Fit roadmap to view", "Reset roadmap viewport", "ResizeObserver"]) requireText(canvas, marker, `Roadmap canvas lacks ${marker}.`);
requireText(read("features/dsa/roadmap/roadmap-node.tsx"), "aria-pressed", "Roadmap nodes do not expose selected state.");

const experience = read("features/dsa/roadmap/roadmap-experience.tsx");
for (const marker of ["useSearchParams", 'params.set("topic"', 'params.delete("topic"', "RoadmapTopicPanel", "RoadmapCanvas", 'setView("list")', "Start here"]) requireText(experience, marker, `Roadmap experience lacks ${marker}.`);

const panel = read("features/dsa/roadmap/roadmap-topic-panel.tsx");
for (const marker of ["Recommended prerequisites", "Key interview patterns", "Practice", "Topic guide", "getRoadmapPracticeHref"]) requireText(panel, marker, `Roadmap topic panel lacks ${marker}.`);

const route = read("app/dsa/[...segments]/page.tsx");
for (const marker of ['segments[0] === "roadmap"', 'segments[1] === "topic-map"', "TopicDependencyMapPage", "RoadmapExperience", "getCoreRoadmapQuestionCounts"]) requireText(route, marker, `DSA topic-map route lacks ${marker}.`);

const css = read("app/globals.css");
for (const marker of [".dsa-roadmap-canvas", ".dsa-roadmap-node", ".dsa-roadmap-edge", ".dsa-roadmap-topic-panel", ".dsa-roadmap-list", "@media (max-width: 480px)", "prefers-reduced-motion"]) requireText(css, marker, `Roadmap styling lacks ${marker}.`);

if (failures.length) {
  console.error(`DSA roadmap regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("DSA roadmap regression passed: 18-node DAG, shared dependencies, integrity checks, controls, URL state, practice integration, accessibility, and responsive views hold.");
