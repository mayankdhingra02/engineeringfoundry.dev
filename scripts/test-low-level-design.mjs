import assert from "node:assert/strict";
import fs from "node:fs";
import {
  lowLevelDesignFramework,
  lowLevelDesignInterviewTimeVersion,
  lowLevelDesignLessons,
  lowLevelDesignLevels,
  lowLevelDesignPractice,
} from "../data/low-level-design/index.ts";

const source = fs.readFileSync("data/low-level-design/index.ts", "utf8");
const entryRoute = fs.readFileSync("app/low-level-design/page.tsx", "utf8");
const lessonRoute = fs.readFileSync("app/low-level-design/lessons/[slug]/page.tsx", "utf8");
const practiceRoute = fs.readFileSync("app/low-level-design/practice/[slug]/page.tsx", "utf8");
const search = fs.readFileSync("lib/global-search.ts", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const companyData = fs.readFileSync("data/company-guides/v1.ts", "utf8");
const companyWorkspace = fs.readFileSync("features/company-guides/company-guide-workspace.tsx", "utf8");
const playbook = fs.readFileSync("lib/interview-playbook/round-execution.ts", "utf8");

const canonicalLevels = ["Entry", "Mid", "Senior", "Staff+"];
assert.deepEqual(lowLevelDesignLevels, canonicalLevels, "LLD must use Engineering Foundry's canonical level taxonomy");
assert.equal(lowLevelDesignLessons.length, 8, "LLD v1 must publish exactly eight core lessons");
assert.ok(lowLevelDesignPractice.length >= 6, "LLD v1 must publish at least six practice designs");

function unique(values, label) { assert.equal(new Set(values).size, values.length, `${label} must be unique`); }
function validLevels(values, label) { for (const level of values) assert.ok(canonicalLevels.includes(level), `${label} contains invalid level ${level}`); }
unique(lowLevelDesignLessons.map((item) => item.id), "lesson ids");
unique(lowLevelDesignLessons.map((item) => item.slug), "lesson slugs");
unique(lowLevelDesignPractice.map((item) => item.id), "practice ids");
unique(lowLevelDesignPractice.map((item) => item.slug), "practice slugs");

const lessonSlugs = new Set(lowLevelDesignLessons.map((item) => item.slug));
for (const lesson of lowLevelDesignLessons) {
  assert.equal(lesson.status, "published", `${lesson.slug} must be published`);
  assert.ok(lesson.objectives.length >= 3, `${lesson.slug} needs learning objectives`);
  assert.ok(lesson.sections.length >= 3, `${lesson.slug} needs substantial sections`);
  validLevels(lesson.levels, lesson.slug);
  for (const section of lesson.sections) {
    for (const field of ["explanation", "example", "commonMistake", "tradeoff", "avoidOverengineering"]) assert.ok(section[field].trim().length > 30, `${lesson.slug}/${section.title} needs ${field}`);
    assert.ok(section.followUps.length >= 2, `${lesson.slug}/${section.title} needs interviewer follow-ups`);
  }
  for (const related of lesson.relatedLessonSlugs) assert.ok(lessonSlugs.has(related), `${lesson.slug} references a missing lesson ${related}`);
}

assert.ok(lowLevelDesignFramework.length >= 9, "LLD framework must cover the reusable reasoning flow");
assert.ok(lowLevelDesignInterviewTimeVersion.length >= 4, "LLD needs a compact interview-time rehearsal version");
assert.ok(lowLevelDesignFramework.some(([label]) => label === "Patterns under pressure"), "patterns must follow pressure rather than prescription");
assert.ok(lowLevelDesignFramework.some(([label]) => label === "State and invariants"), "framework must cover state and invariants");
assert.match(source, /Pattern follows pressure or problem/, "curriculum must explicitly teach that patterns follow a concrete problem");
assert.doesNotMatch(source, /must use (?:the )?(?:strategy|factory|observer|state|adapter|command|repository)/i, "curriculum must not prescribe a named pattern as mandatory");

for (const problem of lowLevelDesignPractice) {
  assert.equal(problem.status, "published", `${problem.slug} must be published`);
  validLevels(problem.levels, problem.slug);
  assert.ok(problem.prompt.length > 80, `${problem.slug} needs a substantive prompt`);
  for (const field of ["clarificationQuestions", "requirements", "nonGoals", "entities", "reasoningAreas", "followUps", "commonMistakes", "extensibilityPrompts", "concurrencyAndTestability"]) assert.ok(problem[field].length >= 2, `${problem.slug} needs ${field}`);
  assert.ok(problem.guidance.length >= 3, `${problem.slug} needs progressive guidance`);
  assert.ok(problem.solutionApproach.length >= 2, `${problem.slug} needs alternatives and trade-offs`);
  for (const related of problem.relatedLessonSlugs) assert.ok(lessonSlugs.has(related), `${problem.slug} references a missing lesson ${related}`);
}

assert.doesNotMatch(source, /\b\d{1,3}%\b|readiness score|pass probability|hiring probability/i, "LLD must not create numeric readiness or pass scoring");
assert.doesNotMatch(source, /leetcode|grokking|hello interview|paid course/i, "LLD practice must remain original rather than copy a branded problem source");
assert.match(entryRoute, /Low-Level Design[\s\S]*Internal responsibilities[\s\S]*System Design[\s\S]*Distributed architecture/s, "entry page must represent the System Design boundary");
assert.match(entryRoute, /secondary public preparation surface[\s\S]*four primary continuation tracks/s, "entry page must document the P0.2 continuation boundary");
assert.match(lessonRoute, /dynamicParams = false[\s\S]*generateStaticParams/, "lesson route must use canonical static params and reject unknown slugs");
assert.match(practiceRoute, /dynamicParams = false[\s\S]*generateStaticParams/, "practice route must use canonical static params and reject unknown slugs");
assert.match(search, /lowLevelDesignLessons[\s\S]*lowLevelDesignPractice/, "global search must index published lessons and practice designs");
assert.match(sitemap, /lowLevelDesignLessons[\s\S]*lowLevelDesignPractice/, "sitemap must include published LLD lessons and practice designs");
assert.match(companyData, /id: "lld"[\s\S]*href: "\/low-level-design"/, "company-guide LLD domain must point to canonical LLD curriculum");
assert.match(companyWorkspace, /href="\/low-level-design"[\s\S]*Open the Low-Level Design curriculum/, "mature company guides must link to canonical LLD curriculum");
assert.match(playbook, /slug: "low-level-design"[\s\S]*relatedHrefs: \["\/low-level-design", "\/low-level-design\/practice", "\/mock-interviews"\]/, "Playbook LLD dossier must link to curriculum and practice without changing evidence semantics");
console.log("Low-Level Design v1 qualification passed: curriculum, practice, boundaries, discovery, integrations, and scoring safeguards hold.");
