import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import buildSitemap from "../app/sitemap.ts";
import {
  activeMlDesignProblems,
  getMlDesignProblem,
  mlDesignConcepts,
  mlDesignProblems,
  mlDesignRoadmap,
  selectActiveMlDesignProblems,
} from "../data/ml-design/index.ts";
import { globalSearchItems } from "../lib/global-search.ts";
import { mlDesignProblemHref } from "../lib/ml-design-routes.ts";
import {
  buildMlDesignStaticParams,
  finitePublicRouteDefinitions,
  indexableFinitePublicRoutes,
} from "../lib/public-route-inventory.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const load = (path) => JSON.parse(read(path));

const roadmap = mlDesignRoadmap;
const concepts = mlDesignConcepts;
const problems = mlDesignProblems;
const activeProblems = problems.filter((problem) => problem.status === "active");
const unique = (items, field, label) => assert.equal(new Set(items.map((item) => item[field])).size, items.length, `${label} must have unique ${field} values`);

assert.equal(roadmap.length, 8, "the current ML Design roadmap must retain its eight honest stages");
assert.equal(concepts.length, 10, "the current compact ML Design concept directory must retain ten entries");
assert.equal(activeProblems.length, 7, "the current ML Design practice catalog must retain seven active original prompts");
assert.deepEqual(roadmap.map((stage) => stage.order), [1, 2, 3, 4, 5, 6, 7, 8], "ML Design roadmap stages must remain contiguous and ordered");
for (const [items, label] of [[roadmap, "roadmap stages"], [concepts, "concepts"], [problems, "problems"]]) {
  unique(items, "id", label);
  unique(items, "slug", label);
}

const roadmapSlugs = new Set(roadmap.map((stage) => stage.slug));
const activeHrefs = activeProblems.map((problem) => mlDesignProblemHref(problem.slug));
assert.equal(new Set(activeHrefs).size, activeHrefs.length, "active ML Design practices must resolve to unique canonical routes");
assert.deepEqual(activeMlDesignProblems.map((problem) => problem.id), activeProblems.map((problem) => problem.id), "the production catalog export must exactly match status-active ML Design problems");
assert.deepEqual(selectActiveMlDesignProblems([{ id: "published", status: "active" }, { id: "held-back", status: "needs_review" }]).map((problem) => problem.id), ["published"], "the production publication selector must exclude needs-review fixtures");
for (const problem of problems) {
  assert.ok(["active", "needs_review"].includes(problem.status), `${problem.id} has an unsupported publication status`);
  assert.ok(roadmapSlugs.has(problem.roadmapStage), `${problem.id} references an unknown roadmap stage`);
  assert.deepEqual(problem.source, { name: "Engineering Foundry", platform: "original" }, `${problem.id} must retain honest original provenance`);
  assert.ok(!Object.hasOwn(problem, "companies") && !Object.hasOwn(problem, "companyAssociations"), `${problem.id} must not acquire unsupported company claims`);
}
for (const problem of activeProblems) assert.equal(getMlDesignProblem(problem.slug)?.id, problem.id, `${problem.id} must resolve through the production active-only lookup`);
assert.equal(getMlDesignProblem("not-a-real-problem"), undefined, "the production active-only lookup must fail closed for unknown slugs");

const dynamicRoute = read("app/ml-design/[slug]/page.tsx");
assert.match(dynamicRoute, /export const dynamicParams = false;/, "ML Design practice routes must remain a finite catalog");
assert.match(dynamicRoute, /buildMlDesignStaticParams\(\)/, "ML Design route must use the shared finite-route static-param builder");
assert.deepEqual(buildMlDesignStaticParams(), activeProblems.map((problem) => ({ slug: problem.slug })), "static params must derive only from active ML Design problems");
const mlDefinition = finitePublicRouteDefinitions.find(({ pagePattern }) => pagePattern === "/ml-design/[slug]");
assert.deepEqual(mlDefinition?.paths, activeHrefs, "finite-route inventory must exactly match the active ML Design catalog");
const indexableRoutes = new Set(indexableFinitePublicRoutes);
for (const problem of problems) assert.equal(indexableRoutes.has(mlDesignProblemHref(problem.slug)), problem.status === "active", `${problem.slug} sitemap publication must follow active status`);
assert.match(dynamicRoute, /getMlDesignProblem\(slug\)/, "the route must use the active-only lookup");
assert.equal((dynamicRoute.match(/if \(!problem\) notFound\(\);/g) ?? []).length, 2, "metadata and page rendering must both fail closed for unknown practices");
assert.match(dynamicRoute, /path: mlDesignProblemHref\(problem\.slug\)/, "practice metadata must use the canonical ML Design route helper");
assert.match(dynamicRoute, /const accountPlatformAvailable = isAccountPlatformAvailable\(\);/, "ML Design practice must derive the account-platform boundary on the server");
assert.match(dynamicRoute, /accountPlatformAvailable=\{accountPlatformAvailable\}/, "ML Design practice must pass the server-derived account-platform boundary to its client surface");
const practicePage = read("components/design-practice-page.tsx");
assert.match(practicePage, /accountPlatformAvailable: boolean;/, "the ML Design practice client must require an explicit account-platform boundary");
assert.match(practicePage, /track="ml-design"[^>]+accountPlatformAvailable=\{accountPlatformAvailable\}/, "the ML Design practice client must pass account availability to its activity control");
const activityControl = read("components/preparation-activity-control.tsx");
assert.match(activityControl, /Account saving is unavailable\. This control uses browser storage when available;/, "disabled ML Design practice must render an honest account-saving marker through its activity control");

const search = read("lib/global-search.ts");
assert.match(search, /activeMlDesignProblems\.map\(\(problem\) => \(\{ title: problem\.title, type: "ML Design problem", href: mlDesignProblemHref\(problem\.slug\) \}\)\)/, "Global Search must exactly follow the active ML Design catalog");
const sitemapPaths = new Set(buildSitemap().map((entry) => new URL(entry.url).pathname));
assert.deepEqual(activeHrefs.filter((href) => sitemapPaths.has(href)).sort(), [...activeHrefs].sort(), "the runtime sitemap must publish every active ML Design practice");
const searchHrefs = globalSearchItems.filter((item) => item.type === "ML Design problem").map((item) => item.href).sort();
assert.deepEqual(searchHrefs, [...activeHrefs].sort(), "the runtime Global Search catalog must publish exactly the active ML Design practices");
const rootPage = read("app/ml-design/page.tsx");
assert.match(rootPage, /problems=\{activeMlDesignProblems\}/, "the public ML Design directory must render only active practices");

const trackPage = read("components/design-track-page.tsx");
assert.match(trackPage, /className="design-result-meta" role="status" aria-live="polite" aria-atomic="true"/, "filtered ML Design counts must be announced as a polite atomic status");

const smoke = read("scripts/smoke-public-routes.mjs");
assert.ok(smoke.includes('"/ml-design"') && smoke.includes('"/ml-design/recommendation-system"') && smoke.includes('"/ml-design/not-a-real-problem"'), "public smoke must cover the ML root, a representative practice, and the finite-route 404 boundary");

const governance = load("docs/product-blueprint/registry/requirements.json").requirements.find((requirement) => requirement.id === "EF-ML");
assert.equal(governance.status, "partial", "route coverage must not misclassify the research-backed ML curriculum as complete");
assert.ok(governance.known_gaps.some((gap) => gap.includes("20 concepts and 13 dossiers")), "the master-depth ML content gap must remain explicit");
assert.ok(governance.known_gaps.some((gap) => gap.includes("research artifacts")), "the ML source-import gap must remain explicit");

console.log(`ML Design contract passed: ${roadmap.length} roadmap stages, ${concepts.length} compact concepts, and ${activeProblems.length} active original practices stay aligned across routes, sitemap, search, smoke, and accessible filtering.`);
