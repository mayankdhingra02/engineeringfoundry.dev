import { readFileSync } from "node:fs";
import { buildBehavioralCoverageMap } from "../lib/behavioral/coverage.ts";
import { reviewAnswerFacts } from "../lib/behavioral/fact-integrity.ts";

const read = (path) => readFileSync(path, "utf8");
const failures = [];
const check = (name, condition) => { if (!condition) failures.push(name); };

const questions = [
  { id: "q-ownership", source: "curated", prompt: "Ownership", description: null, category: "Ownership", companySlug: null },
  { id: "q-conflict", source: "curated", prompt: "Conflict", description: null, category: "Conflict & Influence", companySlug: null },
];
const story = { id: "story-a", title: "Stabilized a service", situation: "A four-person team inherited a service.", task: "Own recovery.", action: "I instrumented the path and coordinated the fix.", result: "Latency improved by 20%.", reflection: null, short_summary: null };
const map = buildBehavioralCoverageMap({ questions, stories: [story], links: [{ story_id: "story-a", curated_question_id: "q-ownership", custom_question_id: null }] });

check("coverage marks one-story category as thin", map.areas.find((area) => area.category === "Ownership")?.status === "Thin");
check("coverage marks absent category uncovered", map.areas.find((area) => area.category === "Conflict & Influence")?.status === "Uncovered");
check("coverage prioritizes first deterministic uncovered category", map.nextArea?.category === "Conflict & Influence");
const reuse = buildBehavioralCoverageMap({ questions: Array.from({ length: 6 }, (_, index) => ({ ...questions[0], id: `q-${index}` })), stories: [story], links: Array.from({ length: 6 }, (_, index) => ({ story_id: "story-a", curated_question_id: `q-${index}`, custom_question_id: null })) });
check("coverage surfaces gentle overuse after six linked questions", reuse.overusedStories[0]?.questionCount === 6);

check("matching source metric is not flagged", reviewAnswerFacts(story, { answer_text: "We improved latency by 20%." }).length === 0);
check("unmatched metric is flagged", reviewAnswerFacts(story, { answer_text: "We improved latency by 50%." }).some((finding) => finding.kind === "unsupported-numeric-claim"));
check("worded ratio contradiction is flagged", reviewAnswerFacts(story, { answer_text: "I cut latency in half." }).some((finding) => finding.kind === "unsupported-numeric-claim"));
check("new responsibility cue is surfaced", reviewAnswerFacts(story, { answer_text: "I led the recovery." }).some((finding) => finding.kind === "possible-new-claim"));
check("missing source is flagged", reviewAnswerFacts(undefined, { answer_text: "An answer without a story." }).some((finding) => finding.kind === "missing-source"));

const answerForm = read("features/behavioral/answer-form.tsx");
for (const marker of ["Source story", "required", "AnswerIntegrityReview", "AnswerPresentationGuidance"]) check(`answer form includes ${marker}`, answerForm.includes(marker));
check("fact review links to source-story editing", read("features/behavioral/answer-integrity-review.tsx").includes("Edit source story"));
const guidance = read("features/behavioral/preparation-guidance.tsx");
for (const marker of ["STAR", "CAR", "SOAR", "Entry", "Mid", "Senior", "Staff+", "source-aware company guide"]) check(`question guidance includes ${marker}`, guidance.includes(marker));
check("question guidance excludes Principal overlay", !guidance.includes("Principal"));
const workspace = read("app/behavioral/workspace/page.tsx");
for (const marker of ["buildBehavioralCoverageMap", "Content coverage", "Build next", "Consider whether you need another example for variety"]) check(`workspace includes ${marker}`, workspace.includes(marker));
check("workspace does not claim a readiness score", !/readiness score/i.test(workspace));
check("Behavioral presentation maps stored Ready to content completeness", read("lib/behavioral/readiness.ts").includes('return "Content complete"'));
const validation = read("lib/behavioral/validation.ts");
check("answer validation requires a source story", validation.includes("Choose the source story for this answer variant."));
const actions = read("features/behavioral/actions.ts");
check("answer actions require source-story confirmation for detected claims", actions.includes("hasConfirmedAnswerFacts") && actions.includes("fact_integrity_confirmed"));
const analytics = read("lib/analytics.ts");
check("no new private Behavioral analytics event was added", !analytics.includes("behavioral_answer_variant_created"));
const publicPage = read("components/behavioral-practice.tsx");
check("public entry points to the private workspace", publicPage.includes("Open private story workspace"));
check("hosted CI runs the P0.7 regression", read(".github/workflows/ci.yml").includes("npm run test:behavioral-v1-polish"));

if (failures.length) {
  console.error(`Behavioral v1 polish regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Behavioral v1 polish regression passed: story-first variants, coverage semantics, fact-integrity prompts, framework guidance, level overlays, company handoff, and private analytics boundary hold.");
