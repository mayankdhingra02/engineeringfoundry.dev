import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import buildSitemap from "../app/sitemap.ts";
import {
  activeMlDesignProblems,
  getMlDesignConcept,
  getMlDesignLegacyProblem,
  getMlDesignProblem,
  mlDesignConcepts,
  mlDesignLegacyProblemSlugs,
  mlDesignProblems,
  mlDesignRoadmap,
} from "../data/ml-design/index.ts";
import { mlDesignFramework, mlGlossary, mlRoleProfiles, mlRubric } from "../data/ml-design/reference.ts";
import { mlDesignSources } from "../data/ml-design/sources.ts";
import { globalSearchItems } from "../lib/global-search.ts";
import {
  ML_DESIGN_CONCEPTS_ROOT,
  ML_DESIGN_GLOSSARY,
  ML_DESIGN_PRACTICE_ROOT,
  ML_DESIGN_PROBLEMS_ROOT,
  ML_DESIGN_RUBRIC,
  legacyMlDesignProblemHref,
  mlDesignConceptHref,
  mlDesignProblemHref,
} from "../lib/ml-design-routes.ts";
import { buildMlDesignStaticParams, finitePublicRouteDefinitions, indexableFinitePublicRoutes, publicRedirectSourcePaths } from "../lib/public-route-inventory.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const unique = (items, field, label) => assert.equal(new Set(items.map((item) => item[field])).size, items.length, `${label} must have unique ${field} values`);
const nonEmptyList = (value) => Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim());

assert.equal(mlDesignRoadmap.length, 8, "ML Design must retain eight ordered stages");
assert.deepEqual(mlDesignRoadmap.map((stage) => stage.order), [1, 2, 3, 4, 5, 6, 7, 8]);
assert.equal(mlDesignConcepts.length, 20, "ML Design must publish exactly twenty required concepts");
assert.equal(activeMlDesignProblems.length, 13, "ML Design must publish exactly thirteen canonical dossiers");
assert.equal(mlDesignProblems.length, 13, "no held-back or placeholder dossier may inflate the canonical catalog");
assert.equal(mlDesignFramework.length, 6, "DECIDE must contain its six named stages");
assert.equal(mlRubric.length, 10, "the descriptive rubric must cover ten required dimensions");
assert.ok(mlRoleProfiles.length >= 6, "rubric guidance must include level and role overlays");
assert.equal(mlGlossary.length, 20, "the glossary must contain twenty substantive terms");
for (const [items, label] of [[mlDesignRoadmap, "roadmap stages"], [mlDesignConcepts, "concepts"], [mlDesignProblems, "dossiers"], [mlDesignSources, "sources"]]) unique(items, "id", label);
unique(mlDesignConcepts, "slug", "concepts");
unique(mlDesignProblems, "slug", "dossiers");

const sourceIds = new Set(mlDesignSources.map((source) => source.id));
const conceptIds = new Set(mlDesignConcepts.map((concept) => concept.id));
const problemIds = new Set(activeMlDesignProblems.map((problem) => problem.id));
const problemSlugs = new Set(activeMlDesignProblems.map((problem) => problem.slug));
const roadmapSlugs = new Set(mlDesignRoadmap.map((stage) => stage.slug));
for (const source of mlDesignSources) {
  assert.match(source.url, /^https:\/\//, `${source.id} must use a public HTTPS source`);
  assert.match(source.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
}
for (const concept of mlDesignConcepts) {
  assert.equal(getMlDesignConcept(concept.slug)?.id, concept.id);
  for (const field of ["mechanism", "alternatives", "productConsequences", "operationalConsequences", "failureModes", "workedExample", "interviewerProbes", "sourceIds"]) assert.ok(nonEmptyList(concept[field]), `${concept.id} must include ${field}`);
  for (const field of ["learningObjective", "scenario", "mentalModel", "interviewImpact", "riskCallout", "decisionTrigger", "lastReviewed"]) assert.ok(concept[field]?.trim(), `${concept.id} must include ${field}`);
  assert.ok(concept.exercise?.prompt?.trim() && concept.exercise?.expected?.trim(), `${concept.id} must include an exercise contract`);
  assert.ok(concept.visual?.title?.trim() && nonEmptyList(concept.visual.steps), `${concept.id} must include a reusable visual`);
  assert.ok(Object.values(concept.levelOverlays).every((item) => item.trim()), `${concept.id} must include all level overlays`);
  assert.ok(concept.sourceIds.every((id) => sourceIds.has(id)), `${concept.id} must reference known sources`);
  assert.ok(concept.relatedProblemSlugs.every((slug) => problemSlugs.has(slug)), `${concept.id} must link only canonical problems`);
}
for (const problem of activeMlDesignProblems) {
  assert.equal(getMlDesignProblem(problem.slug)?.id, problem.id);
  assert.ok(roadmapSlugs.has(problem.roadmapStage), `${problem.id} must map to a known roadmap stage`);
  assert.deepEqual(problem.source, { name: "Engineering Foundry", platform: "original" });
  assert.ok(!Object.hasOwn(problem, "companies") && !Object.hasOwn(problem, "companyAssociations"), `${problem.id} must not claim employer provenance`);
  for (const field of ["clarifyingQuestions", "scaleAndConstraints", "datasetPlan", "offlineArchitecture", "onlineArchitecture", "capacityReliability", "rollout", "responsibleMl", "alternatives", "seniorExtensions", "variants", "rubricEmphasis", "sourceIds"]) assert.ok(nonEmptyList(problem[field]), `${problem.id} must include ${field}`);
  assert.ok(problem.decisionUnit.trim() && problem.family.trim() && problem.lastReviewed.trim(), `${problem.id} must include decision, family, and review data`);
  assert.ok(problem.visual?.title?.trim() && nonEmptyList(problem.visual.steps), `${problem.id} must include a primary visual`);
  assert.ok(problem.sourceIds.every((id) => sourceIds.has(id)), `${problem.id} must reference known sources`);
}
for (const stage of mlDesignRoadmap) {
  assert.ok(nonEmptyList(stage.conceptIds) && stage.conceptIds.every((id) => conceptIds.has(id)), `${stage.id} must map known concepts`);
  assert.ok(nonEmptyList(stage.problemIds) && stage.problemIds.every((id) => problemIds.has(id)), `${stage.id} must map known dossiers`);
}

const canonicalPaths = [ML_DESIGN_CONCEPTS_ROOT, ML_DESIGN_PROBLEMS_ROOT, ML_DESIGN_PRACTICE_ROOT, ML_DESIGN_RUBRIC, ML_DESIGN_GLOSSARY, ...mlDesignConcepts.map((item) => mlDesignConceptHref(item.slug)), ...activeMlDesignProblems.map((item) => mlDesignProblemHref(item.slug))];
const legacyPaths = Object.keys(mlDesignLegacyProblemSlugs).map(legacyMlDesignProblemHref);
assert.deepEqual(buildMlDesignStaticParams(), [...canonicalPaths, ...legacyPaths].map((path) => ({ segments: path.slice("/ml-design/".length).split("/") })));
assert.deepEqual(finitePublicRouteDefinitions.find((definition) => definition.pagePattern === "/ml-design/[...segments]")?.paths, [...canonicalPaths, ...legacyPaths]);
assert.ok(legacyPaths.every((path) => publicRedirectSourcePaths.includes(path)), "legacy ML URLs must be explicit redirect sources");
assert.ok(canonicalPaths.every((path) => indexableFinitePublicRoutes.includes(path)), "all canonical ML routes must be indexable");
assert.ok(legacyPaths.every((path) => !indexableFinitePublicRoutes.includes(path)), "legacy ML URLs must not be indexable");
for (const [legacySlug, canonicalSlug] of Object.entries(mlDesignLegacyProblemSlugs)) assert.equal(getMlDesignLegacyProblem(legacySlug)?.slug, canonicalSlug);

const route = read("app/ml-design/[...segments]/page.tsx");
assert.match(route, /export const dynamicParams = false;/);
assert.match(route, /redirect\(mlDesignProblemHref\(legacy\.slug\)\)/);
for (const routeName of ["core-concepts", "problems", "practice", "rubric", "glossary"]) assert.ok(route.includes(`segments[0] === "${routeName}"`), `${routeName} route must be implemented`);
const practice = read("components/ml-design-practice-workspace.tsx");
for (const mode of ["guided", "untimed", "timed"]) assert.ok(practice.includes(`"${mode}"`), `${mode} practice mode must be present`);
assert.match(practice, /No total score is calculated\./);
assert.match(practice, /does not send them to analytics/);
assert.doesNotMatch(practice, /track\([^\n]*(assumptions|notes|review)/i, "private attempt content must not enter analytics");

const sitemapPaths = new Set(buildSitemap().map((entry) => new URL(entry.url).pathname));
assert.ok(canonicalPaths.every((path) => sitemapPaths.has(path)), "the sitemap must publish every canonical ML route");
const searchHrefs = new Set(globalSearchItems.filter((item) => item.type.startsWith("ML Design")).map((item) => item.href));
assert.ok(mlDesignConcepts.every((item) => searchHrefs.has(mlDesignConceptHref(item.slug))), "search must deep-link every concept");
assert.ok(activeMlDesignProblems.every((item) => searchHrefs.has(mlDesignProblemHref(item.slug))), "search must deep-link every dossier");

const governance = JSON.parse(read("docs/product-blueprint/registry/requirements.json")).requirements.find((requirement) => requirement.id === "EF-ML");
assert.equal(governance.status, "partial", "content/routes alone must not close EF-ML before authenticated attempts and provenance artifacts land");

console.log("ML Design contract passed: 20 concepts, 13 canonical dossiers, DECIDE, canonical routes, three practice modes, descriptive rubric, glossary, sources, search, and sitemap are aligned.");
