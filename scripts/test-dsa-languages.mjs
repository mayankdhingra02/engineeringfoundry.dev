import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getCoreRoadmapTopicHref } from "../data/dsa/core-roadmap.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

if (getCoreRoadmapTopicHref("binary-search") !== "/dsa/roadmap/topic-map?topic=binary-search") failures.push("Canonical Binary Search roadmap handoff does not open its topic-map panel.");

const python = read("content/dsa/languages/python-content.ts");
const java = read("content/dsa/languages/java-content.ts");
const combined = `${python}\n${java}`;
const core = read("data/dsa/core-roadmap.ts");
const coreTopicIds = new Set([...core.matchAll(/\{ id: "([^"]+)", title:/g)].map((match) => match[1]));

for (const language of ["python", "java"]) requireText(combined, `slug: "${language}"`, `Missing ${language} guide data.`);
for (const section of ["Quick Reference", "Lists / Arrays", "Hash Maps / Sets", "Heap / Priority Queue", "Binary Search", "Common Interview Templates", "Common Interview Mistakes"]) requireText(read("features/dsa/languages/language-guide.tsx") + combined, section, `Language guides lack ${section}.`);
for (const template of ["Two Pointers", "Sliding Window", "Binary Search", "BFS", "DFS", "Tree DFS", "Tree BFS", "Backtracking", "Heap / Top K", "Prefix Sum", "Monotonic Stack", "Union Find", "Topological Sort", "1-D Dynamic Programming", "Grid Traversal"]) {
  if ((combined.match(new RegExp(`title: "${template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g")) ?? []).length < 2) failures.push(`Both guides must include the ${template} template.`);
}
for (const match of combined.matchAll(/roadmapTopicId: "([^"]+)"/g)) if (!coreTopicIds.has(match[1])) failures.push(`Language template references unknown roadmap topic ${match[1]}.`);
prohibit(combined, /leetcode\.com|class Solution|acceptance rate|frequency claim/i, "Language guides contain proprietary-solution or interview-frequency material.");

const codeComponent = read("features/dsa/languages/code-example.tsx");
for (const marker of ["navigator.clipboard.writeText(code)", "Copy", "Copied", "aria-live", "aria-label", 'role="region"']) requireText(codeComponent, marker, `Code example component lacks ${marker}.`);
const templateComponent = read("features/dsa/languages/interview-template.tsx");
for (const marker of ["getCoreRoadmapTopic", "getCoreRoadmapTopicHref", "getRoadmapPracticeHref"]) requireText(templateComponent, marker, `Interview template integration lacks ${marker}.`);
prohibit(templateComponent, /\/dsa\/roadmap\?topic=/, "Language templates still hand off to the level planner instead of the topic map.");

const pythonBlocks = [...python.matchAll(/code: `([\s\S]*?)`/g)].map((match) => match[1]);
if (pythonBlocks.length < 25) failures.push(`Expected at least 25 Python examples; found ${pythonBlocks.length}.`);
const scratch = mkdtempSync(join(tmpdir(), "ef-dsa-languages-"));
try {
  const pythonFile = join(scratch, "language_examples.py");
  writeFileSync(pythonFile, pythonBlocks.join("\n\n"));
  const pyCompile = spawnSync("python3", ["-m", "py_compile", pythonFile], { encoding: "utf8" });
  if (pyCompile.status !== 0) failures.push(`Python examples did not parse: ${pyCompile.stderr.trim()}`);

  const javaCheck = spawnSync("javac", ["-version"], { encoding: "utf8" });
  if (javaCheck.status === 0) {
    const javaCompile = spawnSync("javac", ["-d", scratch, "scripts/fixtures/LanguageGuideExamples.java"], { encoding: "utf8" });
    if (javaCompile.status !== 0) failures.push(`Representative Java examples did not compile: ${javaCompile.stderr.trim()}`);
  } else {
    console.warn("Java compile check skipped: a JDK runtime is not available in this environment.");
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

const route = read("app/dsa/[...segments]/page.tsx");
for (const marker of ["PythonDSAGuide", "JavaDSAGuide", 'slug === "python"', 'slug === "java"', "dsa-language-choice-list"]) requireText(route, marker, `Language route lacks ${marker}.`);
const languages = read("data/dsa/languages.ts");
for (const marker of ['slug: "python"', 'slug: "java"', 'status: "published"']) requireText(languages, marker, `Language metadata lacks ${marker}.`);

const css = read("app/globals.css");
for (const marker of [".dsa-language-doc-layout", ".dsa-language-code", ".dsa-language-template", ".dsa-language-mistakes", "@media (max-width: 430px)", "prefers-reduced-motion"]) requireText(css, marker, `Language-guide styling lacks ${marker}.`);
if (!/\.dsa-language-complexity td:nth-child\(2\),\s*\.dsa-language-mistakes h3\s*\{[^}]*font-size:\s*var\(--type-label\)\s*!important;?[^}]*\}/s.test(css)) failures.push("Language complexity values and mistake headings must retain the 12px readability floor.");

if (failures.length) {
  console.error(`DSA language-guide regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`DSA language-guide regression passed: ${pythonBlocks.length} Python examples parse, Java reference structure is valid, 30 canonical templates, copy controls, routes, responsive styles, and the 12px text floor hold.`);
