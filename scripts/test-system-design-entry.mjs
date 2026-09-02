import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [route, planPage, introduction, planner, sidebar, practiceLibrary, nextConfig, smoke, search, sitemap, css] = await Promise.all([
  "app/system-design/[...segments]/page.tsx",
  "app/system-design/plan/page.tsx",
  "content/system-design/foundations/introduction.tsx",
  "components/system-design-focus-planner.tsx",
  "components/system-design-sidebar.tsx",
  "components/system-design-practice-library.tsx",
  "next.config.ts",
  "scripts/smoke-public-routes.mjs",
  "lib/global-search.ts",
  "app/sitemap.ts",
  "app/globals.css",
].map((file) => readFile(file, "utf8")));

assert.match(route, /lesson\.id === "introduction"[^\n]+<IntroductionLessonContent \/>/, "The introduction route must render the lesson directly.");
assert.doesNotMatch(route, /curriculumIntroduction|SystemDesignFocusPlanner/, "The introduction route must not embed the planner.");
assert.match(planPage, /path: "\/system-design\/plan"/, "The planner needs its own canonical metadata path.");
assert.match(planPage, /const accountPlatformAvailable = isAccountPlatformAvailable\(\);[\s\S]*?<SystemDesignFocusPlanner accountPlatformAvailable=\{accountPlatformAvailable\} \/>/, "The dedicated planner route must render the existing planner with one server-derived account-availability value.");
assert.doesNotMatch(planner, /curriculumIntroduction/, "The planner must not accept embedded lesson content.");
assert.match(planner, /Previewing 5 of/, "The default planner must preview rather than dump the full curriculum.");
assert.match(planner, /Browse all \{systemDesignTopics\.length\} topics/, "The full default curriculum must remain available on request.");
assert.match(planner, /view === "curriculum" && <button className="button"/, "The build-plan action must not repeat inside the active study-plan view.");

for (const marker of ["System Design turns requirements into defensible decisions", "One interview, one connected reasoning loop", "What interviewers evaluate", "Make complexity earn its place", "How to use this curriculum"]) {
  assert.ok(introduction.includes(marker), `The introductory lesson is missing: ${marker}`);
}
for (const href of ["/system-design/start-here/system-design-interview-framework", "/system-design/start-here/requirements-and-constraints", "/system-design/plan"]) {
  assert.ok(introduction.includes(`href="${href}"`), `The introductory lesson is missing ${href}.`);
}
assert.match(introduction, /Planning is optional/, "The introduction must frame planning as optional.");
assert.match(introduction, /Create a study plan/, "The introduction needs a secondary planner action.");

for (const label of ["Learn", "Practice", "Plan"]) assert.match(sidebar, new RegExp(`label: "${label}"`), `The workspace navigation is missing ${label}.`);
assert.match(sidebar, /aria-label="System Design workspace"/, "The Learn, Practice, and Plan links need a named navigation landmark.");
assert.match(sidebar, /aria-current=\{active \? "page"/, "The active workspace needs a semantic current-page state.");
assert.match(practiceLibrary, /Personalize practice in the study planner/, "Practice personalization guidance must target the dedicated planner.");
assert.match(practiceLibrary, /href="\/system-design\/plan"/, "Practice personalization needs a direct planner link.");
assert.match(practiceLibrary, /<h2>\{recommendedNext\.problem\.title\}<\/h2>/, "Recommended practice must preserve heading order.");
assert.match(practiceLibrary, /label: "Difficulty"[\s\S]*?label: "Role"/, "Practice filters must be grouped into scannable sets.");
assert.match(css, /\.sd-heading-anchor \{ min-width: 44px; min-height: 44px;/, "Mobile lesson permalinks must meet the interactive target floor.");
assert.match(css, /\.sd-focus-controls legend[^}]+var\(--type-label\)/, "Planner legends must meet the typography floor.");

assert.match(nextConfig, /source: "\/system-design"[\s\S]*?destination: "\/system-design\/start-here\/introduction"/, "The retired landing URL must still enter the introduction.");
assert.match(nextConfig, /source: "\/system-design\/introduction"[\s\S]*?destination: "\/system-design\/start-here\/introduction"/, "The short introduction URL must resolve to the canonical lesson.");
assert.match(smoke, /legacyUrlShortener = await request\("\/system-design\/url-shortener", 308\)/, "The smoke test must recognize the intentional legacy redirect.");
assert.doesNotMatch(smoke.match(/const publicRoutes = \[[\s\S]*?\];/)?.[0] ?? "", /\/system-design\/url-shortener/, "The legacy redirect must not be tested as a 200 page.");
assert.match(search, /System Design study planner[\s\S]*?href: "\/system-design\/plan"/, "Global search must send planning intent to the planner.");
assert.ok(sitemap.includes('"/system-design/plan"'), "The public planner should be in the sitemap.");

console.log("System Design entry experience passed: learning starts at a real lesson, planning is optional and canonical, workspace navigation is explicit, and legacy redirects remain correct.");
