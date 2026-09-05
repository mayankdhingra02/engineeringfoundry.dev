import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  systemDesignManifestSections,
  systemDesignPracticeProblemManifest,
  systemDesignTopicManifest,
} from "../data/system-design/manifest.ts";
import { systemDesignPracticeContents } from "../content/system-design/problems/data.ts";

const priorityLabel = { "must-know": "Must Know", important: "Important", advanced: "Advanced" };
const visualLabel = { none: "Text only", mermaid: "Mermaid", sequence: "Sequence", comparison: "Comparison", interactive: "Custom interactive" };
const topicInventory = systemDesignTopicManifest.map((topic) => ({
  type: topic.sectionId === "technology" ? "technology-deep-dive" : "topic",
  id: topic.id,
  title: topic.title,
  slug: topic.slug,
  section: topic.section,
  sectionId: topic.sectionId,
  priority: topic.priority,
  estimatedMinutes: topic.estimatedMinutes,
  sdeRelevance: topic.levelPriority,
  roleRelevance: topic.rolePriority,
  prerequisites: topic.prerequisites,
  contentStatus: topic.contentStatus,
  published: topic.published,
  visualType: topic.visual.type,
  visualPurpose: topic.visual.description ?? null,
  practiceLinks: topic.practiceProblems.map((id) => `/system-design/problems/${id}`),
  sourceCoverage: topic.sourceCoverage,
  relatedTopics: topic.relatedTopics,
}));
const subtopicInventory = systemDesignTopicManifest.flatMap((topic) => topic.subtopics.map((subtopic) => ({
  type: "subtopic",
  id: subtopic.id,
  title: subtopic.title,
  slug: `${topic.slug}#${subtopic.id}`,
  section: topic.section,
  sectionId: topic.sectionId,
  parentTopicId: topic.id,
  priority: topic.priority,
  estimatedMinutes: null,
  sdeRelevance: topic.levelPriority,
  roleRelevance: topic.rolePriority,
  prerequisites: topic.prerequisites,
  contentStatus: topic.contentStatus,
  published: topic.published,
  visualType: subtopic.visual,
  visualPurpose: subtopic.visualDescription ?? null,
  practiceLinks: topic.practiceProblems.map((id) => `/system-design/problems/${id}`),
  sourceCoverage: topic.sourceCoverage,
  relatedTopics: topic.relatedTopics,
})));
const practiceInventory = systemDesignPracticeProblemManifest.map((problem) => ({
  type: "practice-problem",
  id: problem.id,
  title: problem.title,
  slug: problem.slug,
  section: `Practice Problems · ${problem.group}`,
  sectionId: "practice-problems",
  priority: problem.priority,
  estimatedMinutes: problem.estimatedMinutes,
  sdeRelevance: problem.levelPriority,
  roleRelevance: problem.rolePriority,
  prerequisites: problem.prerequisites,
  contentStatus: problem.contentStatus,
  published: problem.contentStatus === "published",
  visualType: problem.architectureDiagramNeeded ? "mermaid" : "none",
  visualPurpose: problem.architectureDiagramNeeded ? "Explain the simple and scaled architecture from identified bottlenecks." : null,
  practiceLinks: [],
  sourceCoverage: { primarySources: false, interviewSources: true, needsAdditionalVerification: problem.contentStatus !== "published" },
  relatedTopics: problem.concepts,
  difficulty: problem.difficulty,
}));

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const contentFiles = sourceFiles("content/system-design").filter((path) => !path.includes("/problems/"));
const dispatcherText = contentFiles.map((path) => readFileSync(path, "utf8")).join("\n");
const functionToTopicId = new Map([...dispatcherText.matchAll(/case\s+"([^"]+)":\s+return\s+<([A-Za-z0-9_]+)/g)].map((match) => [match[2], match[1]]));
for (const [functionName, topicId] of Object.entries({
  InterviewFrameworkLessonContent: "interview-framework",
  RequirementsLessonContent: "requirements",
  EstimationLessonContent: "estimation",
  CoreSystemPropertiesLessonContent: "core-system-properties",
})) functionToTopicId.set(functionName, topicId);

function mermaidNodeCount(chart) {
  if (!chart) return null;
  const nodeIds = new Set();

  // Flowcharts declare nodes with several bracket shapes: A[...], A(...),
  // A[(...)], and A{{...}}. Sequence and state diagrams use different
  // declaration forms, so include their participant/state identifiers too.
  for (const match of chart.matchAll(/(?:^|[\s;])([A-Za-z][A-Za-z0-9_]*)\s*(?=[\x5b\x28\x7b])/gm)) {
    nodeIds.add(match[1]);
  }
  for (const match of chart.matchAll(/^\s*(?:participant|actor)\s+([A-Za-z][A-Za-z0-9_]*)\b/gm)) {
    nodeIds.add(match[1]);
  }
  for (const match of chart.matchAll(/^\s*state\s+(?:"[^"]+"\s+as\s+)?([A-Za-z][A-Za-z0-9_]*)\b/gm)) {
    nodeIds.add(match[1]);
  }

  // State diagrams commonly introduce states only as transition endpoints.
  for (const line of chart.split("\n")) {
    if (!line.includes("-->")) continue;
    for (const match of line.matchAll(/\b([A-Za-z][A-Za-z0-9_]*)\b/g)) {
      if (!["stateDiagram", "v2"].includes(match[1])) nodeIds.add(match[1]);
    }
  }

  return nodeIds.size;
}

const conceptDiagramInventory = contentFiles.flatMap((path) => {
  const source = readFileSync(path, "utf8");
  const matches = [
    ...[...source.matchAll(/<MermaidDiagram\s+chart=\{([^}]+)\}\s+title="([^"]+)"\s+description="([^"]+)"\s*\/>/g)].map((match) => ({ index: match.index, chartExpression: match[1], title: match[2], description: match[3] })),
    ...[...source.matchAll(/diagram:\s*\{\s*chart:\s*([^,]+),\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)"\s*\}/g)].map((match) => ({ index: match.index, chartExpression: match[1], title: match[2], description: match[3] })),
    ...[...source.matchAll(/diagram:\s*\{\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*chart:\s*(`[^`]*`|[A-Za-z][A-Za-z0-9_]*)\s*\}/g)].map((match) => ({ index: match.index, chartExpression: match[3], title: match[1], description: match[2] })),
  ].sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
  return matches.map((match, occurrence) => {
    const before = source.slice(0, match.index);
    const functionMatches = [...before.matchAll(/export function\s+([A-Za-z0-9_]+)/g)];
    const functionName = functionMatches.at(-1)?.[1] ?? "unknown";
    const specId = [...before.matchAll(/\bid:\s*"([^"]+)"/g)].at(-1)?.[1];
    const topicId = functionToTopicId.get(functionName) ?? (specId && systemDesignTopicManifest.some((item) => item.id === specId) ? specId : null);
    const topic = topicId ? systemDesignTopicManifest.find((item) => item.id === topicId) : undefined;
    const chartExpression = match.chartExpression.trim();
    const chartMatch = /^[A-Za-z][A-Za-z0-9_]*$/.test(chartExpression)
      ? source.match(new RegExp(`const\\s+${chartExpression}\\s*=\\s*\\\`([\\s\\S]*?)\\\`;`))
      : null;
    const chart = chartMatch?.[1] ?? (/^`[\s\S]*`$/.test(chartExpression) ? chartExpression.slice(1, -1) : null);
    return {
      id: `${topicId ?? functionName}-${occurrence + 1}`,
      lessonId: topicId,
      lesson: topic?.title ?? functionName,
      route: topic?.slug ?? null,
      diagramType: chart?.includes("sequenceDiagram") ? "sequence" : chart?.includes("stateDiagram") ? "state" : "flowchart",
      purpose: match.title,
      description: match.description,
      nodes: mermaidNodeCount(chart),
      sourceFile: relative(".", path),
      mobileStatus: "shared responsive scroll/scale container",
      darkModeStatus: "theme-aware Mermaid renderer",
    };
  });
});
const practiceDiagramInventory = systemDesignPracticeContents.flatMap((problem) => ([
  { id: `${problem.id}-simple`, lessonId: problem.id, lesson: problem.title, route: `/system-design/problems/${problem.id}`, diagramType: problem.simpleDiagram.startsWith("sequenceDiagram") ? "sequence" : problem.simpleDiagram.startsWith("stateDiagram") ? "state" : "flowchart", purpose: "Show the smallest credible design before scaling.", description: `Simple architecture for ${problem.title}.`, nodes: mermaidNodeCount(problem.simpleDiagram), sourceFile: "content/system-design/problems", mobileStatus: "shared responsive scroll/scale container", darkModeStatus: "theme-aware Mermaid renderer" },
  { id: `${problem.id}-scaled`, lessonId: problem.id, lesson: problem.title, route: `/system-design/problems/${problem.id}`, diagramType: problem.scaledDiagram.startsWith("sequenceDiagram") ? "sequence" : problem.scaledDiagram.startsWith("stateDiagram") ? "state" : "flowchart", purpose: "Connect each added component to an identified bottleneck.", description: `Scaled architecture for ${problem.title}.`, nodes: mermaidNodeCount(problem.scaledDiagram), sourceFile: "content/system-design/problems", mobileStatus: "shared responsive scroll/scale container", darkModeStatus: "theme-aware Mermaid renderer" },
]));
const diagramInventory = [...conceptDiagramInventory, ...practiceDiagramInventory];
const inventory = {
  schemaVersion: 1,
  source: "data/system-design/manifest.ts",
  summary: {
    sections: systemDesignManifestSections.length,
    topics: topicInventory.length,
    subtopics: subtopicInventory.length,
    technologyDeepDives: topicInventory.filter((record) => record.type === "technology-deep-dive").length,
    practiceProblems: practiceInventory.length,
    publishedTopics: topicInventory.filter((record) => record.published).length,
    publishedPracticeProblems: practiceInventory.filter((record) => record.published).length,
  },
  sections: systemDesignManifestSections.map((section) => ({ id: section.id, title: section.title, routeBase: section.routeBase, description: section.description })),
  topics: topicInventory,
  subtopics: subtopicInventory,
  practiceProblems: practiceInventory,
  technologyDeepDives: topicInventory.filter((record) => record.type === "technology-deep-dive"),
};
const lines = [
  "# System Design curriculum manifest",
  "",
  "> Generated from `data/system-design/manifest.ts`. Edit the manifest, then run `npm run report:system-design-manifest`.",
  "",
  "This is the content architecture for interview preparation. It intentionally contains requirements and metadata—not lesson prose or placeholder solutions.",
  "",
  "## Summary",
  "",
  `- Sections: ${systemDesignManifestSections.length}`,
  `- Topics: ${systemDesignTopicManifest.length}`,
  `- Subtopics: ${systemDesignTopicManifest.reduce((sum, topic) => sum + topic.subtopics.length, 0)}`,
  `- Must Know: ${systemDesignTopicManifest.filter((topic) => topic.priority === "must-know").length}`,
  `- Important: ${systemDesignTopicManifest.filter((topic) => topic.priority === "important").length}`,
  `- Advanced: ${systemDesignTopicManifest.filter((topic) => topic.priority === "advanced").length}`,
  `- Mermaid visuals: ${systemDesignTopicManifest.filter((topic) => topic.visual.type === "mermaid").length}`,
  `- Sequence visuals: ${systemDesignTopicManifest.filter((topic) => topic.visual.type === "sequence").length}`,
  `- Comparison visuals: ${systemDesignTopicManifest.filter((topic) => topic.visual.type === "comparison").length}`,
  `- Custom interactives: ${systemDesignTopicManifest.filter((topic) => topic.visual.type === "interactive").length}`,
  `- Practice problems: ${systemDesignPracticeProblemManifest.length}`,
  "",
];

for (const section of systemDesignManifestSections) {
  lines.push(`## ${section.title}`, "", section.description, "");
  for (const topic of section.topics) {
    lines.push(`### ${topic.title}`, "");
    lines.push(`- ID: \`${topic.id}\``);
    lines.push(`- Route: \`${topic.slug}\``);
    lines.push(`- Priority: ${priorityLabel[topic.priority]}`);
    lines.push(`- Estimated time: ${topic.estimatedMinutes} minutes`);
    lines.push(`- Visual: ${visualLabel[topic.visual.type]}${topic.visual.description ? ` — ${topic.visual.description}` : ""}`);
    lines.push(`- Publishing phase: ${topic.publishingPhase}`);
    lines.push(`- Research status: ${topic.contentStatus}`);
    lines.push(`- Published: ${topic.published ? "Yes" : "No"}`);
    lines.push(`- Source coverage: primary=${topic.sourceCoverage.primarySources ? "yes" : "no"}, interview=${topic.sourceCoverage.interviewSources ? "yes" : "no"}, verification pending=${topic.sourceCoverage.needsAdditionalVerification ? "yes" : "no"}`);
    lines.push(`- Level relevance: ${Object.entries(topic.levelPriority).map(([level, priority]) => `${level}=${priorityLabel[priority]}`).join(", ")}`);
    lines.push(`- Role relevance: ${Object.entries(topic.rolePriority).map(([role, priority]) => `${role}=${priorityLabel[priority]}`).join(", ")}`);
    lines.push(`- Prerequisites: ${topic.prerequisites.length ? topic.prerequisites.map((id) => `\`${id}\``).join(", ") : "None"}`);
    lines.push(`- Practice problems: ${topic.practiceProblems.length ? topic.practiceProblems.map((id) => `\`${id}\``).join(", ") : "None currently mapped"}`);
    lines.push("- Major subtopics:");
    for (const subtopic of topic.subtopics) lines.push(`  - ${subtopic.title}`);
    lines.push("");
  }
}

lines.push("## Practice problem manifest", "");
for (const group of [...new Set(systemDesignPracticeProblemManifest.map((problem) => problem.group))]) {
  lines.push(`### ${group}`, "");
  for (const problem of systemDesignPracticeProblemManifest.filter((item) => item.group === group)) {
    lines.push(`- **${problem.title}** — ${problem.difficulty}; ${problem.estimatedMinutes} minutes; ${priorityLabel[problem.priority]}; concepts: ${problem.concepts.map((id) => `\`${id}\``).join(", ")}`);
  }
  lines.push("");
}

writeFileSync("docs/system-design-curriculum-manifest.md", `${lines.join("\n")}\n`);
writeFileSync("docs/system-design-content-inventory.json", `${JSON.stringify(inventory, null, 2)}\n`);
writeFileSync("docs/system-design-visual-inventory.json", `${JSON.stringify({ schemaVersion: 1, mermaidDiagrams: diagramInventory.length, diagrams: diagramInventory }, null, 2)}\n`);
console.log("Wrote curriculum manifest, content inventory, and visual inventory reports.");
