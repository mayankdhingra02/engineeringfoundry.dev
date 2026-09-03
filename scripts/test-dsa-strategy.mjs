import { readFileSync } from "node:fs";
import { getCoreRoadmapTopicHref } from "../data/dsa/core-roadmap.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

if (getCoreRoadmapTopicHref("two-pointers") !== "/dsa/roadmap/topic-map?topic=two-pointers") failures.push("Canonical Two Pointers roadmap handoff does not open its topic-map panel.");

const page = read("features/dsa/strategy/strategy-page.tsx");
const flow = read("features/dsa/strategy/interview-flow.tsx");
const quick = read("features/dsa/strategy/quick-review.tsx");
const stuck = read("features/dsa/strategy/stuck-recovery.tsx");
const timing = read("features/dsa/strategy/timing-guide.tsx");
const walkthrough = read("features/dsa/strategy/interview-walkthrough.tsx");
const data = read("features/dsa/strategy/strategy-content.ts");
const combined = [page, flow, quick, stuck, timing, walkthrough, data].join("\n");

for (const anchor of ["interview-flow", "clarify", "brute-force", "optimize", "communication", "coding", "testing", "debugging", "stuck", "complexity", "follow-ups", "quick-review"]) {
  requireText(combined, `id="${anchor}"`, `Strategy guide lacks stable #${anchor} anchor.`);
}
for (const stage of ["Understand", "Clarify", "Solve", "Code", "Test", "Analyze"]) requireText(data, `title: "${stage}"`, `Interview flow lacks ${stage}.`);
for (const content of ["Explain decisions, not keystrokes.", "Ask questions that can change your solution.", "Example pacing, not a rule", "recovery ladder", "A full interview walkthrough", "Weak workflow", "Interview-day mini checklist"]) requireText(combined, content, `Strategy content lacks ${content}.`);

const route = read("app/dsa/[...segments]/page.tsx");
for (const marker of ["CodingInterviewStrategyPage", 'segments[0] === "strategy"', 'permanentRedirect("/dsa/strategy")', 'variant="strategy"']) requireText(route, marker, `Strategy routing lacks ${marker}.`);
const curriculum = read("data/dsa/curriculum.ts");
for (const marker of ['"/dsa/strategy"', 'navigationTitle: "Coding interview playbook"', 'status: "published"']) requireText(curriculum, marker, `Strategy curriculum lacks ${marker}.`);

const core = read("data/dsa/core-roadmap.ts");
const coreTopicIds = new Set([...core.matchAll(/\{ id: "([^"]+)", title:/g)].map((match) => match[1]));
for (const match of data.matchAll(/roadmapTopicId: "([^"]+)"/g)) if (!coreTopicIds.has(match[1])) failures.push(`Strategy pattern references unknown roadmap topic ${match[1]}.`);
const pattern = read("features/dsa/strategy/pattern-reference.tsx");
for (const source of [pattern, stuck]) {
  requireText(source, "getCoreRoadmapTopicHref", "Strategy roadmap handoff does not use the canonical topic-map helper.");
  prohibit(source, /\/dsa\/roadmap\?topic=/, "Strategy still hands a topic off to the level planner instead of the topic map.");
}
for (const marker of ["getCoreRoadmapTopic", "getRoadmapPracticeHref"]) requireText(pattern, marker, `Strategy roadmap/practice integration lacks ${marker}.`);
for (const href of ["/dsa/languages/python", "/dsa/languages/java", "/dsa/questions", "/dsa/study-plans"]) requireText(page, href, `Strategy guide lacks integration link ${href}.`);

const studyOverview = read("features/dsa/study-plans/study-plan-overview.tsx");
const readiness = read("features/dsa/study-plans/readiness-checklist.tsx");
requireText(studyOverview, "/dsa/strategy#interview-flow", "Study-plan overview lacks the interview-flow deep link.");
requireText(readiness, "/dsa/strategy#communication", "Study-plan readiness lacks the communication deep link.");

const css = read("app/globals.css");
for (const marker of [".dsa-strategy-doc-layout", ".dsa-interview-flow", ".dsa-strategy-quick-review", ".dsa-recovery-ladder", ".dsa-strategy-walkthrough", "@media (max-width: 430px)", "prefers-reduced-motion"]) requireText(css, marker, `Strategy styling lacks ${marker}.`);
prohibit(combined, /always spend exactly|always ask exactly|guaranteed interview|every company evaluates/i, "Strategy guide contains a rigid or unsupported universal interview claim.");
prohibit(combined, /leetcode\.com|class Solution|acceptance rate|interview frequency/i, "Strategy guide contains proprietary-solution or unsupported frequency material.");

if (failures.length) {
  console.error(`DSA strategy regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("DSA strategy regression passed: canonical route, six-stage flow, stable anchors, quick review, recovery ladder, integrations, accessibility structure, and responsive styles hold.");
