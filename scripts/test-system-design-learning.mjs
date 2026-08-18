import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { systemDesignCurriculum, systemDesignLessons, systemDesignProblemLessons } from "../data/system-design/curriculum.ts";
import { systemDesignManifestSections, systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";

const route = readFileSync("app/system-design/[...segments]/page.tsx", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");
const sidebar = readFileSync("components/system-design-sidebar.tsx", "utf8");
const focusPlanner = readFileSync("components/system-design-focus-planner.tsx", "utf8");
const recommendations = readFileSync("data/system-design/recommendations.ts", "utf8");
const studyPlan = readFileSync("data/system-design/study-plan.ts", "utf8");
const studyPlanView = readFileSync("components/system-design-study-plan.tsx", "utf8");
const toc = readFileSync("components/article-toc.tsx", "utf8");
const content = ["content/system-design/caching.tsx", "content/system-design/caching/fundamentals.tsx", "content/system-design/caching/strategies.tsx", "content/system-design/caching/pressure.tsx", "content/system-design/caching/distributed.tsx", "components/cache-stampede-demo.tsx"].map((file) => readFileSync(file, "utf8")).join("\n");
const css = readFileSync("app/globals.css", "utf8");

assert.deepEqual(systemDesignCurriculum.slice(0, -1).map((section) => section.title), systemDesignManifestSections.map((section) => section.title), "Navigation sections must be derived from the manifest.");
assert.equal(systemDesignLessons.length, systemDesignTopicManifest.length + systemDesignPracticeProblemManifest.length, "All canonical lessons must be routable.");
assert.equal(systemDesignProblemLessons.length, systemDesignPracticeProblemManifest.length, "The full practice catalog must appear in course navigation.");
assert.equal(systemDesignLessons.find((lesson) => lesson.id === "caching")?.slug, "/system-design/fundamentals/caching", "Published caching content must retain its route.");
assert.equal(systemDesignLessons.find((lesson) => lesson.id === "caching")?.status, "published", "Published content status must survive manifest derivation.");
assert.ok(systemDesignLessons.some((lesson) => lesson.status === "coming-soon"), "Unwritten lessons must remain honest coming-soon routes.");

function requireSource(source, pattern, message) {
  assert.match(source, pattern, message);
}

requireSource(route, /generateStaticParams/, "System Design lesson routes must be statically generated from metadata.");
requireSource(route, /ComingSoonLesson/, "Unpublished curriculum routes must render an honest coming-soon shell.");
requireSource(nextConfig, /source:\s*"\/system-design"[\s\S]*?destination:\s*"\/system-design\/start-here\/introduction"[\s\S]*?permanent:\s*true/, "The retired System Design landing route must redirect to the introduction.");
requireSource(sidebar, /aria-expanded=/, "Curriculum controls must expose expanded state.");
requireSource(sidebar, /sessionStorage/, "Curriculum open sections should persist during navigation.");
requireSource(sidebar, /aria-current=.*page/, "The active lesson must be exposed semantically.");
requireSource(sidebar, /problemCatalogOpenIds/, "The 50+ problem catalog must be expanded in the left navigation by default.");
requireSource(sidebar, /openIds=\{openIds\}/, "The active curriculum branch must remain user-collapsible after navigation.");
assert.doesNotMatch(sidebar, /visibleOpenIds/, "Active ancestors must not be forced open on every render.");
for (const marker of ["Target level", "Target role", "Interview in", "Focus Now", "Learn Next", "Skip for Now", "All Topics", "Show all", "Reset recommendations", "Start with Focus Now", "Recommended practice"]) requireSource(focusPlanner, new RegExp(marker), `System Design personalization UI lacks ${marker}.`);
requireSource(focusPlanner, /localStorage/, "Anonymous recommendation preferences must persist locally.");
requireSource(recommendations, /getTopicRecommendation\(topic:/, "Topics need a centralized recommendation function.");
requireSource(recommendations, /systemDesignTopicManifest\.map/, "Recommendations must be derived from the canonical manifest.");
requireSource(studyPlan, /generateSystemDesignStudyPlan/, "System Design needs a deterministic study-plan generator.");
requireSource(studyPlan, /prerequisiteBundle/, "Study plans must resolve prerequisite ordering from metadata.");
for (const marker of ["Continue studying", "I missed a day", "Adjust plan", "System Design interview checklist", "Not Started", "In Progress", "Completed"]) requireSource(studyPlanView, new RegExp(marker), `Study-plan UI lacks ${marker}.`);
requireSource(toc, /IntersectionObserver/, "The article TOC must track visible headings.");
for (const primitive of ["<blockquote>", "<table>", "<pre><code>", "<details>", "LessonCallout", "MermaidDiagram"]) assert.ok(content.includes(primitive), `Caching lessons must demonstrate article primitive: ${primitive}.`);
for (const width of ["1220px", "900px", "650px", "390px"]) assert.ok(css.includes(`max-width: ${width}`), `Missing responsive breakpoint: ${width}.`);

console.log("System Design learning architecture passed: manifest-derived navigation, static routes, personalization, study plans, accessible navigation, and responsive lesson shells remain connected.");
