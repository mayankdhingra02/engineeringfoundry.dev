import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROUND_EXECUTION_GUIDES,
  ROUND_EXECUTION_GUIDE_BY_SLUG,
  resolveRoundExecution,
} from "../lib/interview-playbook/round-execution.ts";
import {
  ROUND_EXECUTION_GUIDE_GROUPS,
  ROUND_EXECUTION_FRAMEWORK_STEPS,
  TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES,
  V1_ROUND_EXECUTION_GUIDES,
  LATER_ROUND_EXECUTION_GUIDES,
  getRoundExecutionGuide,
  roundExecutionGuideHref,
  roundExecutionRelatedLinkLabel,
  roundExecutionTreatmentLabel,
} from "../lib/interview-playbook/round-execution-presentation.ts";
import {
  ROUND_EXECUTION_DOSSIERS,
  ROUND_EXECUTION_DOSSIER_BY_SLUG,
  PUBLISHED_ROUND_EXECUTION_DOSSIERS,
  getRoundExecutionDossier,
} from "../lib/interview-playbook/round-execution-dossiers.ts";

const root = process.cwd();
const exists = (file) => { try { readFileSync(join(root, file), "utf8"); return true; } catch { return false; } };
const source = readFileSync(join(root, "lib/interview-playbook/round-execution.ts"), "utf8");
const presentationSource = readFileSync(join(root, "lib/interview-playbook/round-execution-presentation.ts"), "utf8");
const quickReferenceComponentSource = readFileSync(join(root, "components/interview-playbook/round-execution-quick-reference.tsx"), "utf8");
const roundsIndexPageSource = readFileSync(join(root, "app/interview-tips/rounds/page.tsx"), "utf8");
const roundsDetailPageSource = readFileSync(join(root, "app/interview-tips/rounds/[slug]/page.tsx"), "utf8");
const interviewPlaybookComponentSource = readFileSync(join(root, "components/interview-playbook.tsx"), "utf8");
const sitemapExists = exists("app/sitemap.ts");
const sitemapSource = sitemapExists ? readFileSync(join(root, "app/sitemap.ts"), "utf8") : null;
const dossierCompatibilitySource = readFileSync(join(root, "lib/interview-playbook/round-execution-dossiers.ts"), "utf8");
const dossierSchemaSource = readFileSync(join(root, "lib/interview-playbook/dossiers/schema.ts"), "utf8");
const algorithmicDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/algorithmic-coding.ts"), "utf8");
const practicalDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/practical-coding.ts"), "utf8");
const debuggingDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/debugging.ts"), "utf8");
const codeReviewDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/code-review.ts"), "utf8");
const lowLevelDesignDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/low-level-design.ts"), "utf8");
const systemDesignDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/system-design.ts"), "utf8");
const mlSystemDesignDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/ml-system-design.ts"), "utf8");
const behavioralDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/behavioral.ts"), "utf8");
const projectDeepDiveDossierSource = readFileSync(join(root, "lib/interview-playbook/dossiers/project-deep-dive.ts"), "utf8");
const dossierRegistrySource = readFileSync(join(root, "lib/interview-playbook/dossiers/index.ts"), "utf8");
const authoredDossierSource = [algorithmicDossierSource, practicalDossierSource, debuggingDossierSource, codeReviewDossierSource, lowLevelDesignDossierSource, systemDesignDossierSource, mlSystemDesignDossierSource, behavioralDossierSource, projectDeepDiveDossierSource].join("\n");
const allDossierModuleSource = [dossierCompatibilitySource, dossierSchemaSource, authoredDossierSource, dossierRegistrySource].join("\n");
const dossierComponentSource = readFileSync(join(root, "components/interview-playbook/round-execution-dossier.tsx"), "utf8");
const roundsDetailPageSourceAfterDossier = readFileSync(join(root, "app/interview-tips/rounds/[slug]/page.tsx"), "utf8");

const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * True when `text` contains a "pattern library/catalog/list/cheat sheet"
 * phrase that is not itself an anti-goal disclaimer. The negation cue must
 * sit immediately before the matched phrase (allowing up to 40 characters of
 * intervening words, but no sentence boundary) rather than merely appearing
 * somewhere in the look-behind window, so unrelated negation earlier in the
 * text cannot mask a later positive curriculum claim.
 */
function hasUnqualifiedPatternCurriculum(text) {
  return [...text.matchAll(/\bpattern (library|catalog|list|cheat sheet)\b/gi)].some((match) => {
    const index = match.index ?? 0;
    const prefix = text.slice(Math.max(0, index - 60), index);
    return !/\b(not a|not the|without turning|do not memorize|avoid a|never a)\b[^.!?]{0,40}$/i.test(prefix);
  });
}

// --- Catalog tests -----------------------------------------------------
const REQUIRED_ORDER = [
  "recruiter-screen", "online-assessment", "take-home", "technical-screen",
  "algorithmic-coding", "practical-coding", "debugging", "code-review",
  "low-level-design", "system-design", "ml-system-design", "behavioral",
  "project-deep-dive", "hiring-manager", "cross-functional", "technical-presentation",
];

check("catalog has exactly 16 entries", ROUND_EXECUTION_GUIDES.length === 16);
check("catalog slugs are unique", new Set(ROUND_EXECUTION_GUIDES.map((g) => g.slug)).size === ROUND_EXECUTION_GUIDES.length);
check("catalog order matches the required order exactly", arraysEqual(ROUND_EXECUTION_GUIDES.map((g) => g.slug), REQUIRED_ORDER));
check("exactly 15 entries have v1: true", ROUND_EXECUTION_GUIDES.filter((g) => g.v1 === true).length === 15);
check("technical-presentation is the only v1: false entry", ROUND_EXECUTION_GUIDES.filter((g) => g.v1 === false).map((g) => g.slug).join(",") === "technical-presentation");
check("exactly 12 entries use treatment complete", ROUND_EXECUTION_GUIDES.filter((g) => g.treatment === "complete").length === 12);
check("exactly two entries use treatment focused-variant", ROUND_EXECUTION_GUIDES.filter((g) => g.treatment === "focused-variant").length === 2);
check("exactly one entry uses treatment composition-shell", ROUND_EXECUTION_GUIDES.filter((g) => g.treatment === "composition-shell").length === 1);
check("exactly one entry uses treatment later", ROUND_EXECUTION_GUIDES.filter((g) => g.treatment === "later").length === 1);
check("no catalog slug contains forbidden substrings", ROUND_EXECUTION_GUIDES.every((g) => !/final|bar-raiser|onsite|mixed-signal/.test(g.slug)));
check("ROUND_EXECUTION_GUIDE_BY_SLUG resolves every catalog entry", ROUND_EXECUTION_GUIDES.every((g) => ROUND_EXECUTION_GUIDE_BY_SLUG.get(g.slug) === g));
check("every guide has complete non-empty fields", ROUND_EXECUTION_GUIDES.every((g) =>
  g.title.trim().length > 0 && g.shortTitle.trim().length > 0 && g.description.trim().length > 0
  && g.quickReference.firstMove.trim().length > 0 && g.quickReference.beforeDone.trim().length > 0
  && g.quickReference.biggestTrap.trim().length > 0 && g.ownerBoundary.trim().length > 0));
check("every related href begins with /", ROUND_EXECUTION_GUIDES.every((g) => g.relatedHrefs.every((href) => href.startsWith("/"))));
check("the Low-Level Design guide does not invent a route", !ROUND_EXECUTION_GUIDE_BY_SLUG.get("low-level-design").relatedHrefs.some((href) => href === "/low-level-design" || href === "/lld"));
check("no guide contains a company-specific process claim", !ROUND_EXECUTION_GUIDES.some((g) => /\b(google|meta|amazon|microsoft|apple|netflix)\b/i.test(`${g.description} ${g.ownerBoundary} ${g.quickReference.firstMove} ${g.quickReference.beforeDone} ${g.quickReference.biggestTrap}`)));
check("no guide claims a readiness score or passing probability", !ROUND_EXECUTION_GUIDES.some((g) => /readiness score|passing probability|percent ready|confidence score/i.test(`${g.description} ${g.ownerBoundary}`)));
check("no guide contains a universal minute allocation", !ROUND_EXECUTION_GUIDES.some((g) => /\b\d+\s*minutes?\b/i.test(`${g.description} ${g.quickReference.firstMove} ${g.quickReference.beforeDone} ${g.quickReference.biggestTrap} ${g.ownerBoundary}`)));

// --- Current tracker-type tests -----------------------------------------
function assertResolution(label, expected) {
  const result = resolveRoundExecution(label);
  if ("stage" in expected) check(`${label}: stage`, result.stage === expected.stage);
  if ("modality" in expected) check(`${label}: modality`, result.modality === expected.modality);
  if ("signals" in expected) check(`${label}: signals`, arraysEqual(result.signals, expected.signals));
  if ("guideSlugs" in expected) check(`${label}: guideSlugs`, arraysEqual(result.guideSlugs, expected.guideSlugs));
  if ("shell" in expected) check(`${label}: shell`, result.shell === expected.shell);
  if ("confidence" in expected) check(`${label}: confidence`, result.confidence === expected.confidence);
  if ("needsSignalClarification" in expected) check(`${label}: needsSignalClarification`, result.needsSignalClarification === expected.needsSignalClarification);
  if ("clarificationPrompt" in expected) check(`${label}: clarificationPrompt`, result.clarificationPrompt === expected.clarificationPrompt);
  return result;
}

assertResolution("Recruiter Screen", { stage: "recruiter-screen", guideSlugs: ["recruiter-screen"], shell: null, needsSignalClarification: false });
assertResolution("Hiring Manager", { stage: "hiring-manager", signals: ["hiring-manager"], guideSlugs: ["hiring-manager"], shell: null, needsSignalClarification: false });
assertResolution("Coding / DSA", { stage: "unknown", signals: ["algorithmic-coding"], guideSlugs: ["algorithmic-coding"], shell: null, needsSignalClarification: false });
assertResolution("System Design", { stage: "unknown", signals: ["system-design"], guideSlugs: ["system-design"], shell: null, needsSignalClarification: false });
assertResolution("Behavioral", { stage: "unknown", signals: ["behavioral"], guideSlugs: ["behavioral"], shell: null, needsSignalClarification: false });
assertResolution("Machine Coding", { stage: "unknown", signals: ["practical-coding"], guideSlugs: ["practical-coding"], shell: null, needsSignalClarification: false });
assertResolution("Debugging", { stage: "unknown", signals: ["debugging"], guideSlugs: ["debugging"], shell: null, needsSignalClarification: false });
assertResolution("Domain / Technical", { stage: "technical-screen", signals: [], guideSlugs: [], shell: "technical-screen", confidence: "inferred", needsSignalClarification: true });
assertResolution("Bar Raiser", { stage: "loop", signals: [], guideSlugs: [], shell: "mixed-signal", confidence: "inferred", needsSignalClarification: true });
assertResolution("Take-home", { stage: "assessment", modality: "take-home", signals: [], guideSlugs: ["take-home"], shell: null, needsSignalClarification: false });
assertResolution("Onsite / Virtual Onsite", { stage: "loop", modality: "live-remote", signals: [], guideSlugs: [], shell: "mixed-signal", confidence: "inferred", needsSignalClarification: true });
assertResolution("Other", { stage: "unknown", modality: "unknown", signals: [], guideSlugs: [], shell: null, confidence: "unknown", needsSignalClarification: true });

// --- Composition tests ---------------------------------------------------
assertResolution("Technical phone screen", { stage: "technical-screen", modality: "live-remote", signals: [], guideSlugs: [], shell: "technical-screen", needsSignalClarification: true });
assertResolution("Coding technical phone screen", { stage: "technical-screen", modality: "live-remote", signals: ["algorithmic-coding"], guideSlugs: ["algorithmic-coding"], shell: "technical-screen", needsSignalClarification: false });
assertResolution("Coding + Behavioral Technical Screen", { signals: ["algorithmic-coding", "behavioral"], guideSlugs: ["algorithmic-coding", "behavioral"], shell: "technical-screen" });
assertResolution("Practical Coding + DSA", { signals: ["algorithmic-coding", "practical-coding"], guideSlugs: ["algorithmic-coding", "practical-coding"] });
assertResolution("Code Review and Debugging", { signals: ["debugging", "code-review"], guideSlugs: ["debugging", "code-review"] });
assertResolution("ML System Design", { signals: ["ml-system-design"], guideSlugs: ["ml-system-design"] });
assertResolution("Low-Level Design", { signals: ["low-level-design"], guideSlugs: ["low-level-design"] });
assertResolution("Final System Design", { stage: "final", signals: ["system-design"], guideSlugs: ["system-design"], shell: "mixed-signal", needsSignalClarification: false });
assertResolution("Virtual Onsite — Coding and System Design", { stage: "loop", modality: "live-remote", signals: ["algorithmic-coding", "system-design"], guideSlugs: ["algorithmic-coding", "system-design"], shell: "mixed-signal", needsSignalClarification: false });
assertResolution("Onsite Project Deep Dive", { stage: "loop", modality: "onsite", signals: ["project-deep-dive"], guideSlugs: ["project-deep-dive"], shell: "mixed-signal", needsSignalClarification: false });
assertResolution("Technical Presentation", { modality: "presentation", signals: ["technical-presentation"], guideSlugs: ["technical-presentation"], confidence: "explicit" });
check("Technical Presentation guide is marked v1: false", ROUND_EXECUTION_GUIDE_BY_SLUG.get("technical-presentation").v1 === false);

assertResolution("", {
  rawRoundType: "",
  normalizedRoundType: "",
  stage: "unknown",
  modality: "unknown",
  signals: [],
  guideSlugs: [],
  shell: null,
  confidence: "unknown",
  needsSignalClarification: true,
  clarificationPrompt: "Ask the recruiter for the round's focus, format, expected artifact, tools, and duration before choosing a preparation guide.",
});
{
  const empty = resolveRoundExecution("");
  check("empty string: rawRoundType", empty.rawRoundType === "");
  check("empty string: normalizedRoundType", empty.normalizedRoundType === "");
}
{
  const whitespace = resolveRoundExecution("   \t  ");
  check("whitespace-only input: unknown stage", whitespace.stage === "unknown");
  check("whitespace-only input: unknown modality", whitespace.modality === "unknown");
  check("whitespace-only input: normalizedRoundType is empty", whitespace.normalizedRoundType === "");
  check("whitespace-only input: needsSignalClarification", whitespace.needsSignalClarification === true);
}
{
  const repeated = resolveRoundExecution("Coding    /   DSA");
  check("repeated spaces collapse in normalizedRoundType", repeated.normalizedRoundType === "coding / dsa");
  check("repeated spaces: still resolves algorithmic-coding", arraysEqual(repeated.signals, ["algorithmic-coding"]));
}
{
  const enDash = resolveRoundExecution("Virtual Onsite – Coding and System Design");
  check("en dash normalizes to hyphen", enDash.normalizedRoundType.includes(" - "));
  check("en dash: still resolves both signals", arraysEqual(enDash.signals, ["algorithmic-coding", "system-design"]));
}
{
  const emDash = resolveRoundExecution("Virtual Onsite — Coding and System Design");
  check("em dash normalizes to hyphen", emDash.normalizedRoundType.includes(" - "));
  check("em dash: still resolves both signals", arraysEqual(emDash.signals, ["algorithmic-coding", "system-design"]));
}
{
  const mixedCase = resolveRoundExecution("cOdInG TeChNiCaL pHoNe ScReEn");
  check("mixed casing still resolves stage", mixedCase.stage === "technical-screen");
  check("mixed casing still resolves signal", arraysEqual(mixedCase.signals, ["algorithmic-coding"]));
}
{
  const duplicateKeywords = resolveRoundExecution("Coding Coding Coding Technical Screen");
  check("duplicate keywords do not duplicate a signal", arraysEqual(duplicateKeywords.signals, ["algorithmic-coding"]));
  check("duplicate keywords do not duplicate a guide slug", arraysEqual(duplicateKeywords.guideSlugs, ["algorithmic-coding"]));
}

// --- Conservative-inference tests ----------------------------------------
check("Bar Raiser does not add behavioral", !resolveRoundExecution("Bar Raiser").signals.includes("behavioral"));
check("Onsite / Virtual Onsite does not add coding", !resolveRoundExecution("Onsite / Virtual Onsite").signals.includes("algorithmic-coding"));
check("Onsite / Virtual Onsite does not add System Design", !resolveRoundExecution("Onsite / Virtual Onsite").signals.includes("system-design"));
check("Onsite / Virtual Onsite does not add behavioral", !resolveRoundExecution("Onsite / Virtual Onsite").signals.includes("behavioral"));
check("Domain / Technical does not add algorithmic coding", !resolveRoundExecution("Domain / Technical").signals.includes("algorithmic-coding"));
check("Online Assessment does not automatically add algorithmic coding", !resolveRoundExecution("Online Assessment").signals.includes("algorithmic-coding"));
check("Take-home does not automatically add practical coding", !resolveRoundExecution("Take-home").signals.includes("practical-coding"));
check("Technical Screen with no signal requires clarification", resolveRoundExecution("Technical Screen").needsSignalClarification === true);
check("Final with no signal requires clarification", resolveRoundExecution("Final").needsSignalClarification === true);
check("Other remains unknown", resolveRoundExecution("Other").confidence === "unknown");
check("an arbitrary company name remains unknown", resolveRoundExecution("Acme Corporation").confidence === "unknown");
check("a generic job title remains unknown", resolveRoundExecution("Software Engineer").confidence === "unknown");
check("Technical Presentation remains post-v1", ROUND_EXECUTION_GUIDE_BY_SLUG.get("technical-presentation").v1 === false);
check("no resolution returns a final or bar-raiser guide slug", [
  "Recruiter Screen", "Hiring Manager", "Coding / DSA", "System Design", "Behavioral", "Machine Coding", "Debugging",
  "Domain / Technical", "Bar Raiser", "Take-home", "Onsite / Virtual Onsite", "Other", "Final System Design", "Final",
].every((label) => !resolveRoundExecution(label).guideSlugs.some((slug) => slug === "final" || slug === "bar-raiser")));

// --- Collision tests -------------------------------------------------------
check("ML System Design does not also return System Design", !resolveRoundExecution("ML System Design").signals.includes("system-design"));
check("Low-Level Design does not also return System Design", !resolveRoundExecution("Low-Level Design").signals.includes("system-design"));
check("Code Review does not return algorithmic coding", !resolveRoundExecution("Code Review").signals.includes("algorithmic-coding"));
check("Machine Coding does not return algorithmic coding", !resolveRoundExecution("Machine Coding").signals.includes("algorithmic-coding"));
check("Practical Coding does not return algorithmic coding", !resolveRoundExecution("Practical Coding").signals.includes("algorithmic-coding"));
check("Debugging does not return algorithmic coding", !resolveRoundExecution("Debugging").signals.includes("algorithmic-coding"));
check("Practical Coding + DSA returns both", arraysEqual(resolveRoundExecution("Practical Coding + DSA").signals, ["algorithmic-coding", "practical-coding"]));
check("Code Review + DSA returns both", arraysEqual(resolveRoundExecution("Code Review + DSA").signals, ["algorithmic-coding", "code-review"]));
check("Debugging + DSA returns both", arraysEqual(resolveRoundExecution("Debugging + DSA").signals, ["algorithmic-coding", "debugging"]));

// --- Architecture assertions ----------------------------------------------
check("exports ROUND_EXECUTION_GUIDES", source.includes("export const ROUND_EXECUTION_GUIDES"));
check("exports ROUND_EXECUTION_GUIDE_BY_SLUG", source.includes("export const ROUND_EXECUTION_GUIDE_BY_SLUG"));
check("exports resolveRoundExecution", source.includes("export function resolveRoundExecution"));
for (const typeName of [
  "InterviewRoundStage", "InterviewRoundModality", "InterviewRoundSignal", "RoundExecutionGuideTreatment",
  "RoundExecutionGuideSlug", "RoundExecutionGuideSummary", "RoundExecutionResolutionConfidence",
  "RoundExecutionCompositionShell", "RoundExecutionResolution",
]) check(`contains required type name ${typeName}`, source.includes(typeName));
check("does not import React", !source.includes('from "react"'));
check("does not import Next.js", !source.includes('from "next'));
check("does not import Supabase", !/^import.*supabase/im.test(source) && !source.includes("createSupabase") && !source.includes(".auth."));
check("does not contain direct table access", !source.includes(".from("));
check("does not contain authentication", !source.includes("getAuthenticatedActor") && !source.includes("auth.uid"));
check("does not read environment variables", !source.includes("process.env"));
check("does not call new Date()", !source.includes("new Date()"));
check("does not call Date.now()", !source.includes("Date.now()"));
check("does not call Math.random", !source.includes("Math.random"));
check("does not use fetch", !source.includes("fetch("));
check("does not use localStorage", !source.includes("localStorage"));
check("does not contain a Server Action", !source.includes('"use server"'));
check("does not calculate readiness", !/readiness\s*[:=]|readinessScore/.test(source));
check("does not calculate probability", !/probability\s*[:=]|passProbability/.test(source));
check("does not contain a numerical score", !/\bscore\s*[:=]\s*\d/.test(source));
check("does not create a generic final guide", !/slug:\s*"final"/.test(source));
check("does not create a bar-raiser guide", !/slug:\s*"bar-raiser"/.test(source));
check("does not invent a Low-Level Design route", !source.includes('"/low-level-design"') && !source.includes('"/lld"'));
check("does not contain a company name", !/\b(google|meta|amazon|microsoft|apple|netflix)\b/i.test(source));
check("does not contain proprietary question content", !/leaked question|actual interview question|verbatim question/i.test(source));
check("does not import server-only", !source.includes('import "server-only"'));

// --- Presentation model: groups --------------------------------------------
const REQUIRED_GROUP_IDS = ["process-assessment", "coding-practical", "design", "people-collaboration"];
const flattenedGroupSlugs = ROUND_EXECUTION_GUIDE_GROUPS.flatMap((group) => group.slugs);
const v1CatalogSlugsInOrder = V1_ROUND_EXECUTION_GUIDES.map((guide) => guide.slug);

check("there are exactly four guide groups", ROUND_EXECUTION_GUIDE_GROUPS.length === 4);
check("group IDs appear in the exact required order", arraysEqual(ROUND_EXECUTION_GUIDE_GROUPS.map((group) => group.id), REQUIRED_GROUP_IDS));
check("flattened group slugs contain exactly 15 items", flattenedGroupSlugs.length === 15);
check("flattened group slugs contain no duplicates", new Set(flattenedGroupSlugs).size === flattenedGroupSlugs.length);
check("flattened group slugs exactly equal the v1 catalog slugs in catalog order", arraysEqual(flattenedGroupSlugs, v1CatalogSlugsInOrder));
check("technical-presentation is absent from every v1 group", !flattenedGroupSlugs.includes("technical-presentation"));
check("no group contains final, onsite, bar-raiser, or mixed-signal", !flattenedGroupSlugs.some((slug) => /final|onsite|bar-raiser|mixed-signal/.test(slug)));

// --- V1 and later collections ------------------------------------------
check("V1_ROUND_EXECUTION_GUIDES contains exactly 15 guides", V1_ROUND_EXECUTION_GUIDES.length === 15);
check("every v1 guide has v1 === true", V1_ROUND_EXECUTION_GUIDES.every((guide) => guide.v1 === true));
check("LATER_ROUND_EXECUTION_GUIDES contains exactly one guide", LATER_ROUND_EXECUTION_GUIDES.length === 1);
check("the only later guide is technical-presentation", LATER_ROUND_EXECUTION_GUIDES[0]?.slug === "technical-presentation");
check("the later guide has treatment later", LATER_ROUND_EXECUTION_GUIDES[0]?.treatment === "later");

// --- Hrefs -----------------------------------------------------------------
check("every v1 guide href equals /interview-tips/rounds/{slug}", V1_ROUND_EXECUTION_GUIDES.every((guide) => roundExecutionGuideHref(guide.slug) === `/interview-tips/rounds/${guide.slug}`));
check("every href starts with /interview-tips/rounds/", V1_ROUND_EXECUTION_GUIDES.every((guide) => roundExecutionGuideHref(guide.slug).startsWith("/interview-tips/rounds/")));
check("getRoundExecutionGuide returns every catalog guide by slug", ROUND_EXECUTION_GUIDES.every((guide) => getRoundExecutionGuide(guide.slug) === guide));
check('getRoundExecutionGuide("not-a-guide") returns null', getRoundExecutionGuide("not-a-guide") === null);

// --- Treatment labels --------------------------------------------------
check("treatment label: complete", roundExecutionTreatmentLabel("complete") === "Core execution guide");
check("treatment label: focused-variant", roundExecutionTreatmentLabel("focused-variant") === "Focused variant");
check("treatment label: composition-shell", roundExecutionTreatmentLabel("composition-shell") === "Composition shell");
check("treatment label: later", roundExecutionTreatmentLabel("later") === "Later");

// --- Framework ---------------------------------------------------------
const REQUIRED_STEP_IDS = ["orient", "clarify", "structure", "execute", "validate", "close"];
check("there are exactly six framework steps", ROUND_EXECUTION_FRAMEWORK_STEPS.length === 6);
check("step IDs are exactly the required sequence", arraysEqual(ROUND_EXECUTION_FRAMEWORK_STEPS.map((step) => step.id), REQUIRED_STEP_IDS));
check("every step has a non-empty label", ROUND_EXECUTION_FRAMEWORK_STEPS.every((step) => step.label.trim().length > 0));
check("every step has a non-empty description", ROUND_EXECUTION_FRAMEWORK_STEPS.every((step) => step.description.trim().length > 0));
check("no framework step contains a universal minute allocation", !ROUND_EXECUTION_FRAMEWORK_STEPS.some((step) => /\b\d+\s*minutes?\b/i.test(step.description)));

// --- Technical-screen common signal guides ------------------------------
const REQUIRED_COMMON_SIGNAL_ORDER = [
  "algorithmic-coding", "practical-coding", "debugging", "code-review",
  "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive",
];
check("the common-signal list matches the exact required order", arraysEqual(TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES, REQUIRED_COMMON_SIGNAL_ORDER));
check("every listed slug is a v1 guide", TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES.every((slug) => v1CatalogSlugsInOrder.includes(slug)));
check("the list excludes technical-screen", !TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES.includes("technical-screen"));
check("the list excludes stage/modality concepts", !["recruiter-screen", "online-assessment", "take-home", "hiring-manager", "cross-functional"].some((slug) => TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES.includes(slug)));
check("the list excludes technical-presentation", !TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES.includes("technical-presentation"));

// --- Related labels ------------------------------------------------------
const allRelatedHrefs = new Set(ROUND_EXECUTION_GUIDES.flatMap((guide) => guide.relatedHrefs));
check("every current relatedHrefs entry receives a non-fallback label", [...allRelatedHrefs].every((href) => roundExecutionRelatedLinkLabel(href) !== "Engineering Foundry resource"));
check("an arbitrary unknown path returns the fallback label", roundExecutionRelatedLinkLabel("/not-a-real-path") === "Engineering Foundry resource");

// --- Presentation module architecture -----------------------------------
check("presentation module imports the canonical taxonomy rather than restating it", presentationSource.includes('from "./round-execution.ts"') && !presentationSource.includes('slug: "recruiter-screen"'));
for (const exported of [
  "ROUND_EXECUTION_GUIDE_GROUPS", "ROUND_EXECUTION_FRAMEWORK_STEPS", "V1_ROUND_EXECUTION_GUIDES",
  "LATER_ROUND_EXECUTION_GUIDES", "TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES",
]) check(`presentation module exports ${exported}`, presentationSource.includes(`export const ${exported}`));
for (const exported of ["getRoundExecutionGuide", "roundExecutionGuideHref", "roundExecutionTreatmentLabel", "roundExecutionRelatedLinkLabel"]) {
  check(`presentation module exports ${exported}`, presentationSource.includes(`export function ${exported}`));
}
check("presentation module imports no React", !presentationSource.includes('from "react"'));
check("presentation module imports no Next.js", !presentationSource.includes('from "next'));
check("presentation module imports no Supabase", !/^import.*supabase/im.test(presentationSource) && !presentationSource.includes("createSupabase"));
check("presentation module contains no direct table access", !presentationSource.includes(".from("));
check("presentation module contains no authentication", !presentationSource.includes("getAuthenticatedActor") && !presentationSource.includes("auth.uid"));
check("presentation module reads no environment variables", !presentationSource.includes("process.env"));
check("presentation module does not call new Date()", !presentationSource.includes("new Date()"));
check("presentation module does not call Date.now()", !presentationSource.includes("Date.now()"));
check("presentation module does not call Math.random", !presentationSource.includes("Math.random"));
check("presentation module does not call fetch", !presentationSource.includes("fetch("));
check("presentation module does not use localStorage", !presentationSource.includes("localStorage"));
check("presentation module does not calculate readiness", !/readiness\s*[:=]|readinessScore/.test(presentationSource));
check("presentation module does not calculate probability", !/probability\s*[:=]|passProbability/.test(presentationSource));
check("presentation module contains no company names", !/\b(google|meta|amazon|microsoft|apple|netflix)\b/i.test(presentationSource));
check("presentation module contains no proprietary questions", !/leaked question|actual interview question|verbatim question/i.test(presentationSource));

// --- Index page assertions ------------------------------------------------
check("index page uses createPageMetadata", roundsIndexPageSource.includes("createPageMetadata({"));
check("index page keeps path /interview-tips/rounds", roundsIndexPageSource.includes('path: "/interview-tips/rounds"'));
check("index page contains the required title", roundsIndexPageSource.includes("Software Engineering Interview Round Execution Guides"));
check("index page contains the required description", roundsIndexPageSource.includes("Choose the execution guide for the signal being evaluated"));
check("index page is a Server Component", !roundsIndexPageSource.includes("use client"));
check("index page does not require authentication", !roundsIndexPageSource.includes("requireMemberProfile") && !roundsIndexPageSource.includes("isAccountPlatformAvailable"));
check("index page does not import Supabase", !/^import.*supabase/im.test(roundsIndexPageSource) && !roundsIndexPageSource.includes("createSupabase"));
check("index page contains no direct table access", !roundsIndexPageSource.includes(".from("));
check("index page does not import private Playbook queries", !roundsIndexPageSource.includes("interview-playbook/queries"));
check("index page contains no Server Action", !roundsIndexPageSource.includes('"use server"'));
check("index page uses ROUND_EXECUTION_GUIDE_GROUPS", roundsIndexPageSource.includes("ROUND_EXECUTION_GUIDE_GROUPS"));
check("index page uses getRoundExecutionGuide", roundsIndexPageSource.includes("getRoundExecutionGuide"));
check("index page uses roundExecutionGuideHref", roundsIndexPageSource.includes("roundExecutionGuideHref"));
check("index page does not call .sort(", !roundsIndexPageSource.includes(".sort("));
for (const expected of [
  "Where the conversation sits in the process", "How the evaluation is delivered", "What the candidate must make observable",
  "confirm the format with the recruiter", "Execution guides are selected by signal",
]) check(`index page contains: ${expected}`, roundsIndexPageSource.includes(expected));
check('index page links to "/interview-tips"', roundsIndexPageSource.includes('"/interview-tips"'));
check('index page links to "/mock-interviews"', roundsIndexPageSource.includes('"/mock-interviews"'));
check("index page renders the later guide separately", roundsIndexPageSource.includes("LATER_ROUND_EXECUTION_GUIDES"));
check("index page does not link the technical-presentation later card", !/<Link[^>]*laterGuide/.test(roundsIndexPageSource));
check("index page does not create a generic final/onsite/bar-raiser/mixed-signal card", !/"final"|"onsite"|"bar-raiser"|"mixed-signal"/.test(roundsIndexPageSource));
check("index page does not calculate readiness or probability", !/readiness|probability/i.test(roundsIndexPageSource));
check("index page contains no universal minute allocation", !/\b\d+\s*minutes?\b/i.test(roundsIndexPageSource));

// --- Dynamic detail page assertions ---------------------------------------
check("detail page exports generateStaticParams", roundsDetailPageSource.includes("export function generateStaticParams"));
check("detail page uses V1_ROUND_EXECUTION_GUIDES", roundsDetailPageSource.includes("V1_ROUND_EXECUTION_GUIDES"));
check("detail page exports dynamicParams = false", roundsDetailPageSource.includes("export const dynamicParams = false"));
check("detail page uses Promise-based params", roundsDetailPageSource.includes("params: Promise<{ slug: string }>"));
check("detail page exports generateMetadata", roundsDetailPageSource.includes("export async function generateMetadata"));
check("detail page uses createPageMetadata", roundsDetailPageSource.includes("createPageMetadata({"));
check("detail page uses roundExecutionGuideHref", roundsDetailPageSource.includes("roundExecutionGuideHref"));
check("detail page uses getRoundExecutionGuide", roundsDetailPageSource.includes("getRoundExecutionGuide"));
check("detail page calls notFound() for an invalid or non-v1 guide", roundsDetailPageSource.includes("notFound()") && /!guide\s*\|\|\s*!guide\.v1/.test(roundsDetailPageSource));
check("detail page renders RoundExecutionQuickReference", roundsDetailPageSource.includes("<RoundExecutionQuickReference"));
check("detail page is a Server Component", !roundsDetailPageSource.includes("use client"));
check("detail page does not require authentication", !roundsDetailPageSource.includes("requireMemberProfile") && !roundsDetailPageSource.includes("isAccountPlatformAvailable"));
check("detail page does not import Supabase", !/^import.*supabase/im.test(roundsDetailPageSource) && !roundsDetailPageSource.includes("createSupabase"));
check("detail page contains no direct table access", !roundsDetailPageSource.includes(".from("));
check("detail page does not query applications or rounds", !roundsDetailPageSource.includes("getApplications") && !roundsDetailPageSource.includes("getDashboardPipeline") && !roundsDetailPageSource.includes("interview_rounds"));
check("detail page does not accept a company, application, round, level, or user ID", !/applicationId|roundId|companySlug|level:|userId/.test(roundsDetailPageSource));
{
  const paramSlugs = V1_ROUND_EXECUTION_GUIDES.map((guide) => guide.slug);
  check("detail page's generated params exclude technical-presentation", !paramSlugs.includes("technical-presentation"));
  check("detail page's generated params exclude final/onsite/bar-raiser/mixed-signal", !paramSlugs.some((slug) => /final|onsite|bar-raiser|mixed-signal/.test(slug)));
}

// --- Quick-reference component assertions ---------------------------------
check("component exports RoundExecutionQuickReference", quickReferenceComponentSource.includes("export function RoundExecutionQuickReference"));
check("component is a Server Component", !quickReferenceComponentSource.includes("use client"));
check("component does not use React state", !quickReferenceComponentSource.includes("useState"));
check("component does not use effects", !quickReferenceComponentSource.includes("useEffect"));
check("component contains no form", !quickReferenceComponentSource.includes("<form"));
check("component contains no input", !quickReferenceComponentSource.includes("<input"));
check("component contains no checkbox", !quickReferenceComponentSource.includes('type="checkbox"'));
check("component contains no Server Action", !quickReferenceComponentSource.includes('"use server"'));
check("component does not import Supabase", !/^import.*supabase/im.test(quickReferenceComponentSource) && !quickReferenceComponentSource.includes("createSupabase"));
check("component does not call a data query", !quickReferenceComponentSource.includes("await ") && !quickReferenceComponentSource.includes(".from("));
check("component uses guide.title", quickReferenceComponentSource.includes("guide.title"));
check("component uses guide.description", quickReferenceComponentSource.includes("guide.description"));
check("component uses guide.ownerBoundary", quickReferenceComponentSource.includes("guide.ownerBoundary"));
for (const field of ["guide.quickReference.firstMove", "guide.quickReference.beforeDone", "guide.quickReference.biggestTrap"]) {
  check(`component uses ${field}`, quickReferenceComponentSource.includes(field));
}
check("component uses ROUND_EXECUTION_FRAMEWORK_STEPS", quickReferenceComponentSource.includes("ROUND_EXECUTION_FRAMEWORK_STEPS"));
check("component uses roundExecutionTreatmentLabel", quickReferenceComponentSource.includes("roundExecutionTreatmentLabel"));
check("component uses roundExecutionRelatedLinkLabel", quickReferenceComponentSource.includes("roundExecutionRelatedLinkLabel"));
check('component links to "/interview-tips/rounds"', quickReferenceComponentSource.includes('"/interview-tips/rounds"'));
check('component links to "/mock-interviews"', quickReferenceComponentSource.includes('"/mock-interviews"'));
check("component maps guide.relatedHrefs", quickReferenceComponentSource.includes("guide.relatedHrefs.map("));
check("component has the technical-screen composition branch", quickReferenceComponentSource.includes('guide.slug === "technical-screen"'));
check("component uses TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES", quickReferenceComponentSource.includes("TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES"));
check("component contains the flexible-sequence disclaimer", quickReferenceComponentSource.includes("not a mandatory script or universal timer"));
check("component contains the non-rubric statement", quickReferenceComponentSource.includes("it is not a pass/fail rubric"));
check("component contains the company-boundary statement", quickReferenceComponentSource.includes("Company-specific differences belong in verified Company Guides"));
check("component contains the integrity/proprietary-question statement", quickReferenceComponentSource.includes("do not reproduce proprietary questions"));
check("component does not contain forbidden outcome language", !/you will pass|likely to pass|readiness score|pass probability|guaranteed|secret rubric|bar raiser tricks|final-round secrets/i.test(quickReferenceComponentSource));
check("component contains no universal minute allocation", !/\b\d+\s*minutes?\b/i.test(quickReferenceComponentSource));
check("component contains no company-specific process claims", !/\b(google|meta|amazon|microsoft|apple|netflix)\b/i.test(quickReferenceComponentSource));
check("component does not use dangerouslySetInnerHTML", !quickReferenceComponentSource.includes("dangerouslySetInnerHTML"));

// --- Public Execution Guide home assertions -------------------------------
check('interview-playbook.tsx contains href="/interview-tips/rounds"', interviewPlaybookComponentSource.includes('href="/interview-tips/rounds"'));
check("interview-playbook.tsx contains Browse round guides", interviewPlaybookComponentSource.includes("Browse round guides"));
check('interview-playbook.tsx still contains href="#playbook"', interviewPlaybookComponentSource.includes('href="#playbook"'));
check("interview-playbook.tsx still contains Open the execution guide", interviewPlaybookComponentSource.includes("Open the execution guide"));
check('interview-playbook.tsx still contains href="#checklists"', interviewPlaybookComponentSource.includes('href="#checklists"'));
check("interview-playbook.tsx still contains Open final-preparation checklists", interviewPlaybookComponentSource.includes("Open final-preparation checklists"));
check('interview-playbook.tsx still contains "use client"', interviewPlaybookComponentSource.includes("use client"));
check("interview-playbook.tsx still uses session-only React state", interviewPlaybookComponentSource.includes("useState"));
check("interview-playbook.tsx still calls existing checklist analytics", interviewPlaybookComponentSource.includes('"interview_checklist_used"'));
check("interview-playbook.tsx still calls existing section analytics", interviewPlaybookComponentSource.includes('"interview_playbook_section_viewed"'));
{
  const analyticsEventNames = [...interviewPlaybookComponentSource.matchAll(/track\(\s*"([^"]+)"/g)].map((match) => match[1]);
  check("interview-playbook.tsx adds no new analytics event", arraysEqual([...new Set(analyticsEventNames)].sort(), ["interview_checklist_used", "interview_playbook_section_viewed"].sort()));
}
check("interview-playbook.tsx adds no persistence behavior", !interviewPlaybookComponentSource.includes("localStorage") && !interviewPlaybookComponentSource.includes("sessionStorage") && !interviewPlaybookComponentSource.includes("createSupabase"));

// --- Sitemap assertions (only when app/sitemap.ts exists) ------------------
if (sitemapExists) {
  check("sitemap contains /interview-tips/rounds", sitemapSource.includes('"/interview-tips/rounds"'));
  check("sitemap derives detail routes from V1_ROUND_EXECUTION_GUIDES", sitemapSource.includes("V1_ROUND_EXECUTION_GUIDES"));
  check("sitemap does not manually repeat all 15 slugs", !ROUND_EXECUTION_GUIDES.filter((g) => g.v1).every((g) => sitemapSource.includes(`"/interview-tips/rounds/${g.slug}"`)));
  check("sitemap excludes technical-presentation", !sitemapSource.includes('"/interview-tips/rounds/technical-presentation"'));
  check("sitemap does not add /interview-playbook", !sitemapSource.includes('"/interview-playbook"'));
  check("sitemap does not add final/onsite/bar-raiser/mixed-signal routes", !/\/interview-tips\/rounds\/(final|onsite|bar-raiser|mixed-signal)/.test(sitemapSource));
}

// --- Dossier catalog state ------------------------------------------------
const algorithmicCodingDossier = ROUND_EXECUTION_DOSSIERS[0];
const practicalCodingDossier = ROUND_EXECUTION_DOSSIERS[1];
const debuggingDossier = ROUND_EXECUTION_DOSSIERS[2];
const codeReviewDossier = ROUND_EXECUTION_DOSSIERS[3];
const lowLevelDesignDossier = ROUND_EXECUTION_DOSSIERS[4];
const systemDesignDossier = ROUND_EXECUTION_DOSSIERS[5];
const mlSystemDesignDossier = ROUND_EXECUTION_DOSSIERS[6];
const behavioralDossier = ROUND_EXECUTION_DOSSIERS[7];
const projectDeepDiveDossier = ROUND_EXECUTION_DOSSIERS[8];

check("ROUND_EXECUTION_DOSSIERS contains exactly nine dossiers", ROUND_EXECUTION_DOSSIERS.length === 9);
check("the dossier order is exactly algorithmic-coding, practical-coding, debugging, code-review, low-level-design, system-design, ml-system-design, behavioral, project-deep-dive", arraysEqual(ROUND_EXECUTION_DOSSIERS.map((dossier) => dossier.slug), ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"]));
check("the first dossier slug is algorithmic-coding", algorithmicCodingDossier?.slug === "algorithmic-coding");
check("the first dossier status is published", algorithmicCodingDossier?.status === "published");
check("the second dossier slug is practical-coding", practicalCodingDossier?.slug === "practical-coding");
check("the second dossier status is published", practicalCodingDossier?.status === "published");
check("the third dossier slug is debugging", debuggingDossier?.slug === "debugging");
check("the third dossier status is published", debuggingDossier?.status === "published");
check("the fourth dossier slug is code-review", codeReviewDossier?.slug === "code-review");
check("the fourth dossier status is published", codeReviewDossier?.status === "published");
check("the fifth dossier slug is low-level-design", lowLevelDesignDossier?.slug === "low-level-design");
check("the fifth dossier status is published", lowLevelDesignDossier?.status === "published");
check("the sixth dossier slug is system-design", systemDesignDossier?.slug === "system-design");
check("the sixth dossier status is published", systemDesignDossier?.status === "published");
check("the seventh dossier slug is ml-system-design", mlSystemDesignDossier?.slug === "ml-system-design");
check("the seventh dossier status is published", mlSystemDesignDossier?.status === "published");
check("the eighth dossier slug is behavioral", behavioralDossier?.slug === "behavioral");
check("the eighth dossier status is published", behavioralDossier?.status === "published");
check("the ninth dossier slug is project-deep-dive", projectDeepDiveDossier?.slug === "project-deep-dive");
check("the ninth dossier status is published", projectDeepDiveDossier?.status === "published");
check("dossier slugs are unique", new Set(ROUND_EXECUTION_DOSSIERS.map((dossier) => dossier.slug)).size === ROUND_EXECUTION_DOSSIERS.length);
check("every dossier has status published", ROUND_EXECUTION_DOSSIERS.every((dossier) => dossier.status === "published"));
check("every dossier slug is unique", new Set(ROUND_EXECUTION_DOSSIERS.map((dossier) => dossier.slug)).size === ROUND_EXECUTION_DOSSIERS.length);
check("every dossier slug is a v1 guide", ROUND_EXECUTION_DOSSIERS.every((dossier) => V1_ROUND_EXECUTION_GUIDES.some((guide) => guide.slug === dossier.slug)));
check("PUBLISHED_ROUND_EXECUTION_DOSSIERS contains exactly nine dossiers", PUBLISHED_ROUND_EXECUTION_DOSSIERS.length === 9);
check('getRoundExecutionDossier("algorithmic-coding") returns the dossier', getRoundExecutionDossier("algorithmic-coding") === algorithmicCodingDossier);
check('getRoundExecutionDossier("practical-coding") returns the dossier', getRoundExecutionDossier("practical-coding") === practicalCodingDossier);
check('getRoundExecutionDossier("debugging") returns the dossier', getRoundExecutionDossier("debugging") === debuggingDossier);
check('getRoundExecutionDossier("code-review") returns the dossier', getRoundExecutionDossier("code-review") === codeReviewDossier);
check('getRoundExecutionDossier("low-level-design") returns the dossier', getRoundExecutionDossier("low-level-design") === lowLevelDesignDossier);
check('getRoundExecutionDossier("system-design") returns the dossier', getRoundExecutionDossier("system-design") === systemDesignDossier);
check('getRoundExecutionDossier("ml-system-design") returns the dossier', getRoundExecutionDossier("ml-system-design") === mlSystemDesignDossier);
check('getRoundExecutionDossier("behavioral") returns the dossier', getRoundExecutionDossier("behavioral") === behavioralDossier);
check('getRoundExecutionDossier("project-deep-dive") returns the dossier', getRoundExecutionDossier("project-deep-dive") === projectDeepDiveDossier);
check('getRoundExecutionDossier("hiring-manager") returns null', getRoundExecutionDossier("hiring-manager") === null);
check('getRoundExecutionDossier("technical-presentation") returns null', getRoundExecutionDossier("technical-presentation") === null);
check('getRoundExecutionDossier("not-a-guide") returns null', getRoundExecutionDossier("not-a-guide") === null);
check("no dossier exists for a generic final round", getRoundExecutionDossier("final") === null);
check("no dossier exists for a generic onsite round", getRoundExecutionDossier("onsite") === null);
check("no dossier exists for a generic bar-raiser round", getRoundExecutionDossier("bar-raiser") === null);
check("no dossier exists for a generic mixed-signal round", getRoundExecutionDossier("mixed-signal") === null);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the first dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("algorithmic-coding") === algorithmicCodingDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the second dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("practical-coding") === practicalCodingDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the third dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("debugging") === debuggingDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the fourth dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("code-review") === codeReviewDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the fifth dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("low-level-design") === lowLevelDesignDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the sixth dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("system-design") === systemDesignDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the seventh dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("ml-system-design") === mlSystemDesignDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the eighth dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("behavioral") === behavioralDossier);
check("ROUND_EXECUTION_DOSSIER_BY_SLUG resolves the ninth dossier", ROUND_EXECUTION_DOSSIER_BY_SLUG.get("project-deep-dive") === projectDeepDiveDossier);
check("every dossier slug exists in V1_ROUND_EXECUTION_GUIDES", ROUND_EXECUTION_DOSSIERS.every((dossier) => V1_ROUND_EXECUTION_GUIDES.some((guide) => guide.slug === dossier.slug)));
check("no dossier exists for technical-presentation", getRoundExecutionDossier("technical-presentation") === null);
check("the debugging guide retains treatment complete in the canonical taxonomy", ROUND_EXECUTION_GUIDE_BY_SLUG.get("debugging")?.treatment === "complete");

// --- Taxonomy boundary: publishing a dossier does not alter the canonical guide's taxonomy ---
const codeReviewGuide = ROUND_EXECUTION_GUIDE_BY_SLUG.get("code-review");
check("code-review guide remains treatment focused-variant after dossier publication", codeReviewGuide?.treatment === "focused-variant");
check("code-review guide remains v1: true", codeReviewGuide?.v1 === true);
const lowLevelDesignGuide = ROUND_EXECUTION_GUIDE_BY_SLUG.get("low-level-design");
check("low-level-design guide remains treatment complete after dossier publication", lowLevelDesignGuide?.treatment === "complete");
check("low-level-design guide remains v1: true", lowLevelDesignGuide?.v1 === true);
const systemDesignGuide = ROUND_EXECUTION_GUIDE_BY_SLUG.get("system-design");
check("system-design guide remains treatment complete after dossier publication", systemDesignGuide?.treatment === "complete");
check("system-design guide remains v1: true", systemDesignGuide?.v1 === true);
const mlSystemDesignGuide = ROUND_EXECUTION_GUIDE_BY_SLUG.get("ml-system-design");
check("ml-system-design guide remains treatment complete after dossier publication", mlSystemDesignGuide?.treatment === "complete");
check("ml-system-design guide remains v1: true", mlSystemDesignGuide?.v1 === true);
const behavioralGuide = ROUND_EXECUTION_GUIDE_BY_SLUG.get("behavioral");
check("behavioral guide remains treatment complete after dossier publication", behavioralGuide?.treatment === "complete");
check("behavioral guide remains v1: true", behavioralGuide?.v1 === true);
const projectDeepDiveGuide = ROUND_EXECUTION_GUIDE_BY_SLUG.get("project-deep-dive");
check("project-deep-dive guide remains treatment complete after dossier publication", projectDeepDiveGuide?.treatment === "complete");
check("project-deep-dive guide remains v1: true", projectDeepDiveGuide?.v1 === true);

// --- Route-resolution coverage across all fifteen v1 guide slugs -----------
{
  const v1Slugs = V1_ROUND_EXECUTION_GUIDES.map((guide) => guide.slug);
  const dossierBackedSlugs = v1Slugs.filter((slug) => getRoundExecutionDossier(slug) !== null);
  const quickReferenceOnlySlugs = v1Slugs.filter((slug) => getRoundExecutionDossier(slug) === null);
  check("exactly nine v1 slugs resolve a dossier", dossierBackedSlugs.length === 9);
  check("the dossier-backed slugs are exactly algorithmic-coding, practical-coding, debugging, code-review, low-level-design, system-design, ml-system-design, behavioral, project-deep-dive", arraysEqual([...dossierBackedSlugs].sort(), ["algorithmic-coding", "behavioral", "code-review", "debugging", "low-level-design", "ml-system-design", "practical-coding", "project-deep-dive", "system-design"]));
  check("exactly six v1 slugs remain quick-reference-only", quickReferenceOnlySlugs.length === 6);
  check("static params are unaffected by dossier coverage (still fifteen v1 guides)", v1Slugs.length === 15);
}

// --- Dossier core content ---------------------------------------------
const d = algorithmicCodingDossier;
check("lastReviewed is exactly 2026-08-18", d.lastReviewed === "2026-08-18");
check("purpose is non-empty", d.purpose.trim().length > 0);
check("intendedEvaluation contains exactly seven items", d.intendedEvaluation.length === 7);
check("companyVariation contains exactly six items", d.companyVariation.length === 6);
check("beforeRound contains exactly four items", d.beforeRound.length === 4);
check("flow contains exactly seven steps", d.flow.length === 7);
check("flow IDs are exactly the required sequence", arraysEqual(d.flow.map((step) => step.id), ["orient", "clarify", "example-baseline", "approach", "implement", "validate", "follow-up-close"]));
check("every flow step is complete", d.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("there are exactly two time frameworks", d.timeFrameworks.length === 2);
check("every time framework is context-dependent", d.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("every time framework has exactly four phases", d.timeFrameworks.every((framework) => framework.phases.length === 4));
check("every time phase is complete", d.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("there are exactly four communication patterns", d.communication.length === 4);
check("there are exactly five recovery scenarios", d.recovery.length === 5);
check("there are exactly six validation items", d.validation.length === 6);
check("there are exactly four closing items", d.closing.length === 4);
check("there are exactly three questions to ask", d.questionsToAsk.length === 3);
check("there are exactly six strong signals", d.signals.strong.length === 6);
check("there are exactly six concern signals", d.signals.concern.length === 6);
check("there are exactly seven failure modes", d.failureModes.length === 7);
check("there are exactly three seniority entries", d.seniority.length === 3);
check("seniority levels appear in the exact required order", arraysEqual(d.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("remote contains exactly three items", d.environment.remote.length === 3);
check("onsite contains exactly three items", d.environment.onsite.length === 3);
check("accessibility contains exactly four items", d.environment.accessibility.length === 4);
check("there are exactly four company modifier rules", d.companyModifierRules.length === 4);
check("there are exactly five interaction examples", d.interactions.length === 5);
check("every interaction is classified as illustrative", d.interactions.every((example) => example.classification === "illustrative"));
check("interaction IDs are unique", new Set(d.interactions.map((example) => example.id)).size === d.interactions.length);
check("integrity contains exactly four statements", d.integrity.length === 4);

// --- Practical Coding dossier core content --------------------------------
const d2 = practicalCodingDossier;
check("practical-coding: lastReviewed is exactly 2026-08-18", d2.lastReviewed === "2026-08-18");
check("practical-coding: title is non-empty", d2.title.trim().length > 0);
check("practical-coding: purpose is non-empty", d2.purpose.trim().length > 0);
check("practical-coding: intendedEvaluation contains exactly seven items", d2.intendedEvaluation.length === 7);
check("practical-coding: companyVariation contains exactly six items", d2.companyVariation.length === 6);
check("practical-coding: beforeRound contains exactly four items", d2.beforeRound.length === 4);
check("practical-coding: flow contains exactly seven steps", d2.flow.length === 7);
check("practical-coding: flow IDs are exactly the required sequence", arraysEqual(d2.flow.map((step) => step.id), ["orient", "establish-behavior", "locate-surface", "plan-change", "implement", "validate", "close-risk"]));
check("practical-coding: every flow step is complete", d2.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("practical-coding: there are exactly two time frameworks", d2.timeFrameworks.length === 2);
check("practical-coding: every time framework is context-dependent", d2.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("practical-coding: every time framework has exactly four phases", d2.timeFrameworks.every((framework) => framework.phases.length === 4));
check("practical-coding: every time phase is complete", d2.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("practical-coding: there are exactly four communication patterns", d2.communication.length === 4);
check("practical-coding: there are exactly five recovery scenarios", d2.recovery.length === 5);
check("practical-coding: there are exactly six validation items", d2.validation.length === 6);
check("practical-coding: there are exactly four closing items", d2.closing.length === 4);
check("practical-coding: there are exactly three questions to ask", d2.questionsToAsk.length === 3);
check("practical-coding: there are exactly six strong signals", d2.signals.strong.length === 6);
check("practical-coding: there are exactly six concern signals", d2.signals.concern.length === 6);
check("practical-coding: there are exactly seven failure modes", d2.failureModes.length === 7);
check("practical-coding: there are exactly three seniority entries", d2.seniority.length === 3);
check("practical-coding: seniority levels appear in the exact required order", arraysEqual(d2.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("practical-coding: remote contains exactly three items", d2.environment.remote.length === 3);
check("practical-coding: onsite contains exactly three items", d2.environment.onsite.length === 3);
check("practical-coding: accessibility contains exactly four items", d2.environment.accessibility.length === 4);
check("practical-coding: there are exactly four company modifier rules", d2.companyModifierRules.length === 4);
check("practical-coding: there are exactly five interaction examples", d2.interactions.length === 5);
check("practical-coding: every interaction is classified as illustrative", d2.interactions.every((example) => example.classification === "illustrative"));
check("practical-coding: interaction IDs are unique", new Set(d2.interactions.map((example) => example.id)).size === d2.interactions.length);
check("practical-coding: integrity contains exactly four statements", d2.integrity.length === 4);

// --- Debugging dossier core content ---------------------------------------
const d3 = debuggingDossier;
check("debugging: lastReviewed is exactly 2026-08-18", d3.lastReviewed === "2026-08-18");
check("debugging: title is non-empty", d3.title.trim().length > 0);
check("debugging: purpose is non-empty", d3.purpose.trim().length > 0);
check("debugging: intendedEvaluation contains exactly seven items", d3.intendedEvaluation.length === 7);
check("debugging: companyVariation contains exactly six items", d3.companyVariation.length === 6);
check("debugging: beforeRound contains exactly four items", d3.beforeRound.length === 4);
check("debugging: flow contains exactly seven steps", d3.flow.length === 7);
check("debugging: flow IDs are exactly the required sequence", arraysEqual(d3.flow.map((step) => step.id), ["observe", "reproduce", "localize", "hypothesize", "discriminate", "repair", "regress-close"]));
check("debugging: flow IDs are unique", new Set(d3.flow.map((step) => step.id)).size === d3.flow.length);
check("debugging: every flow step is complete", d3.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("debugging: there are exactly two time frameworks", d3.timeFrameworks.length === 2);
check("debugging: every time framework is context-dependent", d3.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("debugging: every time framework has exactly four phases and a non-empty assumption", d3.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.assumption.trim().length > 0));
check("debugging: every time phase is complete", d3.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("debugging: there are exactly four communication patterns", d3.communication.length === 4);
check("debugging: there are exactly five recovery scenarios", d3.recovery.length === 5);
check("debugging: there are exactly six validation items", d3.validation.length === 6);
check("debugging: there are exactly four closing items", d3.closing.length === 4);
check("debugging: there are exactly three questions to ask", d3.questionsToAsk.length === 3);
check("debugging: there are exactly six strong signals", d3.signals.strong.length === 6);
check("debugging: there are exactly six concern signals", d3.signals.concern.length === 6);
check("debugging: there are exactly seven failure modes", d3.failureModes.length === 7);
check("debugging: there are exactly three seniority entries", d3.seniority.length === 3);
check("debugging: seniority levels appear in the exact required order", arraysEqual(d3.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("debugging: remote contains exactly three items", d3.environment.remote.length === 3);
check("debugging: onsite contains exactly three items", d3.environment.onsite.length === 3);
check("debugging: accessibility contains exactly four items", d3.environment.accessibility.length === 4);
check("debugging: there are exactly four company modifier rules", d3.companyModifierRules.length === 4);
check("debugging: there are exactly five interaction examples", d3.interactions.length === 5);
check("debugging: every interaction is classified as illustrative", d3.interactions.every((example) => example.classification === "illustrative"));
check("debugging: interaction IDs are unique", new Set(d3.interactions.map((example) => example.id)).size === d3.interactions.length);
check("debugging: integrity contains exactly four statements", d3.integrity.length === 4);

// --- Debugging semantic content assertions ---------------------------------
const debuggingSerialized = JSON.stringify(d3).toLowerCase();
for (const concept of [
  "expected behavior", "observed", "reproduce", "localize", "hypothes", "discriminat",
  "falsif", "root cause", "original", "regress", "blast radius", "monitor", "rollback", "uncertain",
]) check(`debugging content includes concept: ${concept}`, debuggingSerialized.includes(concept));
check("debugging integrity disclaimer about exploitation is present and intact", d3.integrity.some((statement) => statement.includes("It does not teach exploitation")));

// --- Code Review dossier core content ---------------------------------------
const d4 = codeReviewDossier;
check("code-review: lastReviewed is exactly 2026-08-18", d4.lastReviewed === "2026-08-18");
check("code-review: title is non-empty", d4.title.trim().length > 0);
check("code-review: purpose is non-empty", d4.purpose.trim().length > 0);
check("code-review: intendedEvaluation contains exactly seven items", d4.intendedEvaluation.length === 7);
check("code-review: companyVariation contains exactly six items", d4.companyVariation.length === 6);
check("code-review: beforeRound contains exactly four items", d4.beforeRound.length === 4);
check("code-review: flow contains exactly seven steps", d4.flow.length === 7);
check("code-review: flow IDs are exactly the required sequence", arraysEqual(d4.flow.map((step) => step.id), ["orient", "understand-change", "correctness", "risk", "tests-maintainability", "communicate", "summarize"]));
check("code-review: flow IDs are unique", new Set(d4.flow.map((step) => step.id)).size === d4.flow.length);
check("code-review: every flow step is complete", d4.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("code-review: there are exactly two time frameworks", d4.timeFrameworks.length === 2);
check("code-review: every time framework is context-dependent", d4.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("code-review: every time framework has exactly four phases and a non-empty label and assumption", d4.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.label.trim().length > 0 && framework.assumption.trim().length > 0));
check("code-review: every time phase is complete", d4.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("code-review: there are exactly four communication patterns", d4.communication.length === 4);
check("code-review: there are exactly five recovery scenarios", d4.recovery.length === 5);
check("code-review: there are exactly six validation items", d4.validation.length === 6);
check("code-review: there are exactly four closing items", d4.closing.length === 4);
check("code-review: there are exactly three questions to ask", d4.questionsToAsk.length === 3);
check("code-review: there are exactly six strong signals", d4.signals.strong.length === 6);
check("code-review: there are exactly six concern signals", d4.signals.concern.length === 6);
check("code-review: there are exactly seven failure modes", d4.failureModes.length === 7);
check("code-review: there are exactly three seniority entries", d4.seniority.length === 3);
check("code-review: seniority levels appear in the exact required order", arraysEqual(d4.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("code-review: remote contains exactly three items", d4.environment.remote.length === 3);
check("code-review: onsite contains exactly three items", d4.environment.onsite.length === 3);
check("code-review: accessibility contains exactly four items", d4.environment.accessibility.length === 4);
check("code-review: there are exactly four company modifier rules", d4.companyModifierRules.length === 4);
check("code-review: there are exactly five interaction examples", d4.interactions.length === 5);
check("code-review: every interaction is classified as illustrative", d4.interactions.every((example) => example.classification === "illustrative"));
check("code-review: interaction IDs are unique", new Set(d4.interactions.map((example) => example.id)).size === d4.interactions.length);
check("code-review: every interaction has non-empty title, scenario, weak, strong, and annotation", d4.interactions.every((example) =>
  example.title.trim().length > 0 && example.scenario.trim().length > 0 && example.weak.trim().length > 0
  && example.strong.trim().length > 0 && example.annotation.trim().length > 0));
check("code-review: integrity contains exactly four statements", d4.integrity.length === 4);

// --- Code Review semantic content assertions --------------------------------
const codeReviewSerialized = JSON.stringify(d4).toLowerCase();
for (const concept of [
  "intended behavior", "change as a whole", "correctness", "requirement", "material risk", "reliability",
  "security", "data", "compatibility", "failure", "test", "maintainability", "local convention",
  "blocker", "important suggestion", "question", "minor preference", "priorit", "consequence",
  "review boundary", "disagree",
]) check(`code-review content includes concept: ${concept}`, codeReviewSerialized.includes(concept));
check("code-review integrity disclaimer about proprietary artifacts is present and intact", d4.integrity.some((statement) => statement.includes("It does not reproduce proprietary review artifacts")));
check("code-review integrity disclaimer about live-assessment assistance is present and intact", d4.integrity.some((statement) => statement.includes("It does not authorize external assistance during a live interview.")));

// --- Low-Level Design dossier core content -----------------------------------
const d5 = lowLevelDesignDossier;
check("low-level-design: lastReviewed is exactly 2026-08-18", d5.lastReviewed === "2026-08-18");
check("low-level-design: title is non-empty", d5.title.trim().length > 0);
check("low-level-design: purpose is non-empty", d5.purpose.trim().length > 0);
check("low-level-design: intendedEvaluation contains exactly seven items", d5.intendedEvaluation.length === 7);
check("low-level-design: companyVariation contains exactly six items", d5.companyVariation.length === 6);
check("low-level-design: beforeRound contains exactly four items", d5.beforeRound.length === 4);
check("low-level-design: flow contains exactly seven steps", d5.flow.length === 7);
check("low-level-design: flow IDs are exactly the required sequence", arraysEqual(d5.flow.map((step) => step.id), ["clarify", "model-domain", "assign-responsibilities", "define-relationships", "design-interfaces-state", "walk-flow-evolve", "validate-close"]));
check("low-level-design: flow IDs are unique", new Set(d5.flow.map((step) => step.id)).size === d5.flow.length);
check("low-level-design: every flow step is complete", d5.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("low-level-design: there are exactly two time frameworks", d5.timeFrameworks.length === 2);
check("low-level-design: every time framework is context-dependent", d5.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("low-level-design: every time framework has exactly four phases and a non-empty label and assumption", d5.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.label.trim().length > 0 && framework.assumption.trim().length > 0));
check("low-level-design: every time phase is complete", d5.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("low-level-design: there are exactly four communication patterns", d5.communication.length === 4);
check("low-level-design: there are exactly five recovery scenarios", d5.recovery.length === 5);
check("low-level-design: there are exactly six validation items", d5.validation.length === 6);
check("low-level-design: there are exactly four closing items", d5.closing.length === 4);
check("low-level-design: there are exactly three questions to ask", d5.questionsToAsk.length === 3);
check("low-level-design: there are exactly six strong signals", d5.signals.strong.length === 6);
check("low-level-design: there are exactly six concern signals", d5.signals.concern.length === 6);
check("low-level-design: there are exactly seven failure modes", d5.failureModes.length === 7);
check("low-level-design: there are exactly three seniority entries", d5.seniority.length === 3);
check("low-level-design: seniority levels appear in the exact required order", arraysEqual(d5.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("low-level-design: remote contains exactly three items", d5.environment.remote.length === 3);
check("low-level-design: onsite contains exactly three items", d5.environment.onsite.length === 3);
check("low-level-design: accessibility contains exactly four items", d5.environment.accessibility.length === 4);
check("low-level-design: there are exactly four company modifier rules", d5.companyModifierRules.length === 4);
check("low-level-design: there are exactly five interaction examples", d5.interactions.length === 5);
check("low-level-design: every interaction is classified as illustrative", d5.interactions.every((example) => example.classification === "illustrative"));
check("low-level-design: interaction IDs are unique", new Set(d5.interactions.map((example) => example.id)).size === d5.interactions.length);
check("low-level-design: every interaction has non-empty title, scenario, weak, strong, and annotation", d5.interactions.every((example) =>
  example.title.trim().length > 0 && example.scenario.trim().length > 0 && example.weak.trim().length > 0
  && example.strong.trim().length > 0 && example.annotation.trim().length > 0));
check("low-level-design: integrity contains exactly four statements", d5.integrity.length === 4);

// --- Low-Level Design semantic content assertions -----------------------------
const lowLevelDesignSerialized = JSON.stringify(d5).toLowerCase();
for (const concept of [
  "use case", "domain", "responsibilit", "ownership", "relationship", "composition",
  "inheritance", "interface", "state", "invariant", "lifecycle", "coupling", "cohesion",
  "representative", "flow", "failure", "follow-up", "trade-off", "minimal", "validat",
]) check(`low-level-design content includes concept: ${concept}`, lowLevelDesignSerialized.includes(concept));
check("low-level-design integrity disclaimer about proprietary prompts is present and intact", d5.integrity.some((statement) => statement.includes("It does not reproduce proprietary prompts")));
check("low-level-design integrity disclaimer about live-assessment assistance is present and intact", d5.integrity.some((statement) => statement.includes("It does not authorize external assistance during a live interview.")));

// --- System Design dossier core content ---------------------------------------
const d6 = systemDesignDossier;
check("system-design: lastReviewed is exactly 2026-08-18", d6.lastReviewed === "2026-08-18");
check("system-design: title is non-empty", d6.title.trim().length > 0);
check("system-design: purpose is non-empty", d6.purpose.trim().length > 0);
check("system-design: intendedEvaluation contains exactly seven items", d6.intendedEvaluation.length === 7);
check("system-design: companyVariation contains exactly six items", d6.companyVariation.length === 6);
check("system-design: beforeRound contains exactly four items", d6.beforeRound.length === 4);
check("system-design: flow contains exactly seven steps", d6.flow.length === 7);
check("system-design: flow IDs are exactly the required sequence", arraysEqual(d6.flow.map((step) => step.id), ["clarify-objective", "scope-requirements", "establish-baseline", "trace-flows", "deepen-critical-paths", "handle-tradeoffs-followups", "validate-close"]));
check("system-design: flow IDs are unique", new Set(d6.flow.map((step) => step.id)).size === d6.flow.length);
check("system-design: every flow step is complete", d6.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("system-design: there are exactly two time frameworks", d6.timeFrameworks.length === 2);
check("system-design: every time framework is context-dependent", d6.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("system-design: every time framework has exactly four phases and a non-empty label and assumption", d6.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.label.trim().length > 0 && framework.assumption.trim().length > 0));
check("system-design: every time phase is complete", d6.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("system-design: there are exactly four communication patterns", d6.communication.length === 4);
check("system-design: there are exactly five recovery scenarios", d6.recovery.length === 5);
check("system-design: there are exactly six validation items", d6.validation.length === 6);
check("system-design: there are exactly four closing items", d6.closing.length === 4);
check("system-design: there are exactly three questions to ask", d6.questionsToAsk.length === 3);
check("system-design: there are exactly six strong signals", d6.signals.strong.length === 6);
check("system-design: there are exactly six concern signals", d6.signals.concern.length === 6);
check("system-design: there are exactly seven failure modes", d6.failureModes.length === 7);
check("system-design: there are exactly three seniority entries", d6.seniority.length === 3);
check("system-design: seniority levels appear in the exact required order", arraysEqual(d6.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("system-design: remote contains exactly three items", d6.environment.remote.length === 3);
check("system-design: onsite contains exactly three items", d6.environment.onsite.length === 3);
check("system-design: accessibility contains exactly four items", d6.environment.accessibility.length === 4);
check("system-design: there are exactly four company modifier rules", d6.companyModifierRules.length === 4);
check("system-design: there are exactly five interaction examples", d6.interactions.length === 5);
check("system-design: every interaction is classified as illustrative", d6.interactions.every((example) => example.classification === "illustrative"));
check("system-design: interaction IDs are unique", new Set(d6.interactions.map((example) => example.id)).size === d6.interactions.length);
check("system-design: every interaction has non-empty title, scenario, weak, strong, and annotation", d6.interactions.every((example) =>
  example.title.trim().length > 0 && example.scenario.trim().length > 0 && example.weak.trim().length > 0
  && example.strong.trim().length > 0 && example.annotation.trim().length > 0));
check("system-design: integrity contains exactly four statements", d6.integrity.length === 4);

// --- System Design semantic content assertions ---------------------------------
const systemDesignSerialized = JSON.stringify(d6).toLowerCase();
for (const concept of [
  "product objective", "primary user", "functional requirement", "non-functional", "scope", "assumption",
  "scale", "estimat", "minimal", "end-to-end", "interface", "data boundar", "request", "flow",
  "asynchronous", "bottleneck", "failure", "reliability", "availability", "consistency",
  "durability", "latency", "cost", "trade-off", "redirection", "validat",
]) check(`system-design content includes concept: ${concept}`, systemDesignSerialized.includes(concept));
check("system-design integrity disclaimer about proprietary prompts is present and intact", d6.integrity.some((statement) => statement.includes("It does not reproduce proprietary prompts")));
check("system-design integrity disclaimer about live-assessment assistance is present and intact", d6.integrity.some((statement) => statement.includes("It does not authorize external assistance during a live interview.")));

// --- ML System Design dossier core content ---------------------------------------
const d7 = mlSystemDesignDossier;
check("ml-system-design: lastReviewed is exactly 2026-08-18", d7.lastReviewed === "2026-08-18");
check("ml-system-design: title is non-empty", d7.title.trim().length > 0);
check("ml-system-design: purpose is non-empty", d7.purpose.trim().length > 0);
check("ml-system-design: intendedEvaluation contains exactly seven items", d7.intendedEvaluation.length === 7);
check("ml-system-design: companyVariation contains exactly six items", d7.companyVariation.length === 6);
check("ml-system-design: beforeRound contains exactly four items", d7.beforeRound.length === 4);
check("ml-system-design: flow contains exactly seven steps", d7.flow.length === 7);
check("ml-system-design: flow IDs are exactly the required sequence", arraysEqual(d7.flow.map((step) => step.id), ["clarify-product", "frame-ml-task", "define-success", "data-labels-baseline", "model-evaluation-lifecycle", "serve-monitor-feedback", "tradeoffs-validate-close"]));
check("ml-system-design: flow IDs are unique", new Set(d7.flow.map((step) => step.id)).size === d7.flow.length);
check("ml-system-design: every flow step is complete", d7.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("ml-system-design: there are exactly two time frameworks", d7.timeFrameworks.length === 2);
check("ml-system-design: every time framework is context-dependent", d7.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("ml-system-design: every time framework has exactly four phases and a non-empty label and assumption", d7.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.label.trim().length > 0 && framework.assumption.trim().length > 0));
check("ml-system-design: every time phase is complete", d7.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("ml-system-design: there are exactly four communication patterns", d7.communication.length === 4);
check("ml-system-design: there are exactly five recovery scenarios", d7.recovery.length === 5);
check("ml-system-design: there are exactly six validation items", d7.validation.length === 6);
check("ml-system-design: there are exactly four closing items", d7.closing.length === 4);
check("ml-system-design: there are exactly three questions to ask", d7.questionsToAsk.length === 3);
check("ml-system-design: there are exactly six strong signals", d7.signals.strong.length === 6);
check("ml-system-design: there are exactly six concern signals", d7.signals.concern.length === 6);
check("ml-system-design: there are exactly seven failure modes", d7.failureModes.length === 7);
check("ml-system-design: there are exactly three seniority entries", d7.seniority.length === 3);
check("ml-system-design: seniority levels appear in the exact required order", arraysEqual(d7.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("ml-system-design: remote contains exactly three items", d7.environment.remote.length === 3);
check("ml-system-design: onsite contains exactly three items", d7.environment.onsite.length === 3);
check("ml-system-design: accessibility contains exactly four items", d7.environment.accessibility.length === 4);
check("ml-system-design: there are exactly four company modifier rules", d7.companyModifierRules.length === 4);
check("ml-system-design: there are exactly five interaction examples", d7.interactions.length === 5);
check("ml-system-design: every interaction is classified as illustrative", d7.interactions.every((example) => example.classification === "illustrative"));
check("ml-system-design: interaction IDs are unique", new Set(d7.interactions.map((example) => example.id)).size === d7.interactions.length);
check("ml-system-design: every interaction has non-empty title, scenario, weak, strong, and annotation", d7.interactions.every((example) =>
  example.title.trim().length > 0 && example.scenario.trim().length > 0 && example.weak.trim().length > 0
  && example.strong.trim().length > 0 && example.annotation.trim().length > 0));
check("ml-system-design: integrity contains exactly four statements", d7.integrity.length === 4);

// --- ML System Design semantic content assertions ---------------------------------
const mlSystemDesignSerialized = JSON.stringify(d7).toLowerCase();
for (const concept of [
  "product objective", "decision", "prediction", "ranking", "retrieval", "generation",
  "metric", "guardrail", "data", "label", "leakage", "baseline", "training", "offline",
  "online", "serving", "latency", "freshness", "reliability", "monitoring", "drift",
  "feedback", "experiment", "safety", "bias", "trade-off", "validat",
]) check(`ml-system-design content includes concept: ${concept}`, mlSystemDesignSerialized.includes(concept));
check("ml-system-design integrity disclaimer about proprietary prompts is present and intact", d7.integrity.some((statement) => statement.includes("It does not reproduce proprietary prompts")));
check("ml-system-design integrity disclaimer about live-assessment assistance is present and intact", d7.integrity.some((statement) => statement.includes("It does not authorize external assistance during a live interview.")));

// --- Behavioral dossier core content ---------------------------------------
const d8 = behavioralDossier;
check("behavioral: lastReviewed is exactly 2026-08-18", d8.lastReviewed === "2026-08-18");
check("behavioral: title is non-empty", d8.title.trim().length > 0);
check("behavioral: purpose is non-empty", d8.purpose.trim().length > 0);
check("behavioral: intendedEvaluation contains exactly seven items", d8.intendedEvaluation.length === 7);
check("behavioral: companyVariation contains exactly six items", d8.companyVariation.length === 6);
check("behavioral: beforeRound contains exactly four items", d8.beforeRound.length === 4);
check("behavioral: flow contains exactly seven steps", d8.flow.length === 7);
check("behavioral: flow IDs are exactly the required sequence", arraysEqual(d8.flow.map((step) => step.id), ["identify-signal", "select-evidence", "establish-context", "explain-ownership", "outcome-learning", "handle-followups", "close-consistently"]));
check("behavioral: flow IDs are unique", new Set(d8.flow.map((step) => step.id)).size === d8.flow.length);
check("behavioral: every flow step is complete", d8.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("behavioral: there are exactly two time frameworks", d8.timeFrameworks.length === 2);
check("behavioral: every time framework is context-dependent", d8.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("behavioral: every time framework has exactly four phases and a non-empty label and assumption", d8.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.label.trim().length > 0 && framework.assumption.trim().length > 0));
check("behavioral: every time phase is complete", d8.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("behavioral: there are exactly four communication patterns", d8.communication.length === 4);
check("behavioral: there are exactly five recovery scenarios", d8.recovery.length === 5);
check("behavioral: there are exactly six validation items", d8.validation.length === 6);
check("behavioral: there are exactly four closing items", d8.closing.length === 4);
check("behavioral: there are exactly three questions to ask", d8.questionsToAsk.length === 3);
check("behavioral: there are exactly six strong signals", d8.signals.strong.length === 6);
check("behavioral: there are exactly six concern signals", d8.signals.concern.length === 6);
check("behavioral: there are exactly seven failure modes", d8.failureModes.length === 7);
check("behavioral: there are exactly three seniority entries", d8.seniority.length === 3);
check("behavioral: seniority levels appear in the exact required order", arraysEqual(d8.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("behavioral: remote contains exactly three items", d8.environment.remote.length === 3);
check("behavioral: onsite contains exactly three items", d8.environment.onsite.length === 3);
check("behavioral: accessibility contains exactly four items", d8.environment.accessibility.length === 4);
check("behavioral: there are exactly four company modifier rules", d8.companyModifierRules.length === 4);
check("behavioral: there are exactly five interaction examples", d8.interactions.length === 5);
check("behavioral: every interaction is classified as illustrative", d8.interactions.every((example) => example.classification === "illustrative"));
check("behavioral: interaction IDs are unique", new Set(d8.interactions.map((example) => example.id)).size === d8.interactions.length);
check("behavioral: every interaction has non-empty title, scenario, weak, strong, and annotation", d8.interactions.every((example) =>
  example.title.trim().length > 0 && example.scenario.trim().length > 0 && example.weak.trim().length > 0
  && example.strong.trim().length > 0 && example.annotation.trim().length > 0));
check("behavioral: integrity contains exactly four statements", d8.integrity.length === 4);

// --- Behavioral semantic content assertions ---------------------------------
const behavioralSerialized = JSON.stringify(d8).toLowerCase();
for (const concept of [
  "evidence", "competency", "truthful", "relevant", "context", "ownership", "decision",
  "trade-off", "collaboration", "failure", "conflict", "outcome", "impact", "learning",
  "follow-up", "uncertain", "confidential", "sensitive", "level", "reflection", "consisten",
]) check(`behavioral content includes concept: ${concept}`, behavioralSerialized.includes(concept));
check("behavioral integrity disclaimer about live-assessment assistance is present and intact", d8.integrity.some((statement) => statement.includes("It does not authorize external assistance during a live interview.")));
check("behavioral integrity disclaimer about fabricated candidate stories is present and intact", d8.integrity.some((statement) => statement.includes("fabricated candidate stories")));
check("behavioral integrity disclaims scoring/personality-assessment framing", d8.integrity.some((statement) => statement.includes("not a company scoring rubric or personality assessment")));
check("behavioral integrity confirms story creation, question coverage, and answer variants remain in the dedicated workspace", d8.integrity.some((statement) => statement.includes("Story creation, question coverage, answer frameworks, story-to-question mapping, answer variants, and repeated practice remain in the dedicated Behavioral learning and private workspace.")));

// --- Behavioral does not mandate STAR ---------------------------------------
check("behavioral dossier does not require STAR as a mandatory execution framework", !/\b(must use star|always use star|required star format|star is required)\b/i.test(behavioralSerialized));
check("behavioral dossier flow does not consist of situation/task/action/result labels", !arraysEqual(d8.flow.map((step) => step.title.toLowerCase()), ["situation", "task", "action", "result"]));

// --- Behavioral product-boundary assertions ---------------------------------
check("behavioral dossier does not import lib/behavioral/queries", !behavioralDossierSource.includes("lib/behavioral/queries"));
check("behavioral dossier does not import lib/behavioral/readiness", !behavioralDossierSource.includes("lib/behavioral/readiness"));
check("behavioral dossier does not import Supabase", !/^import.*supabase/im.test(behavioralDossierSource) && !behavioralDossierSource.includes("createSupabase"));
check("behavioral dossier does not import auth", !behavioralDossierSource.includes("getAuthenticatedActor") && !behavioralDossierSource.includes("auth.uid"));
check("behavioral dossier does not implement story persistence", !/\.insert\(|\.update\(|\.delete\(|\.upsert\(/.test(behavioralDossierSource));
check("behavioral dossier does not implement a story-to-question mapping data structure", !/storyToQuestion|questionToStory/.test(behavioralDossierSource));
check("behavioral dossier does not implement answer variants", !/answerVariant/.test(behavioralDossierSource));
check("behavioral dossier does not implement a question catalog", !/questionCatalog/.test(behavioralDossierSource));
check("behavioral dossier does not implement readiness calculation", !/readinessScore|calculateReadiness/.test(behavioralDossierSource));
check("behavioral dossier does not implement story scoring", !/storyScore/.test(behavioralDossierSource));
check("behavioral dossier does not implement company-values scoring", !/valuesScore/.test(behavioralDossierSource));

// --- Project Deep Dive dossier core content ---------------------------------------
const d9 = projectDeepDiveDossier;
check("project-deep-dive: lastReviewed is exactly 2026-08-18", d9.lastReviewed === "2026-08-18");
check("project-deep-dive: title is non-empty", d9.title.trim().length > 0);
check("project-deep-dive: purpose is non-empty", d9.purpose.trim().length > 0);
check("project-deep-dive: intendedEvaluation contains exactly seven items", d9.intendedEvaluation.length === 7);
check("project-deep-dive: companyVariation contains exactly six items", d9.companyVariation.length === 6);
check("project-deep-dive: beforeRound contains exactly four items", d9.beforeRound.length === 4);
check("project-deep-dive: flow contains exactly seven steps", d9.flow.length === 7);
check("project-deep-dive: flow IDs are exactly the required sequence", arraysEqual(d9.flow.map((step) => step.id), ["orient-project", "establish-technical-model", "separate-ownership", "explain-key-decisions", "trace-execution", "outcomes-aftermath", "handle-followups-close"]));
check("project-deep-dive: flow IDs are unique", new Set(d9.flow.map((step) => step.id)).size === d9.flow.length);
check("project-deep-dive: every flow step is complete", d9.flow.every((step) =>
  step.title.trim().length > 0 && step.objective.trim().length > 0 && step.actions.length >= 3
  && ["widely-applicable", "context-dependent"].includes(step.classification)));
check("project-deep-dive: there are exactly two time frameworks", d9.timeFrameworks.length === 2);
check("project-deep-dive: every time framework is context-dependent", d9.timeFrameworks.every((framework) => framework.classification === "context-dependent"));
check("project-deep-dive: every time framework has exactly four phases and a non-empty label and assumption", d9.timeFrameworks.every((framework) => framework.phases.length === 4 && framework.label.trim().length > 0 && framework.assumption.trim().length > 0));
check("project-deep-dive: every time phase is complete", d9.timeFrameworks.every((framework) => framework.phases.every((phase) =>
  phase.label.trim().length > 0 && phase.range.trim().length > 0 && phase.objective.trim().length > 0 && phase.adjustment.trim().length > 0)));
check("project-deep-dive: there are exactly four communication patterns", d9.communication.length === 4);
check("project-deep-dive: there are exactly five recovery scenarios", d9.recovery.length === 5);
check("project-deep-dive: there are exactly six validation items", d9.validation.length === 6);
check("project-deep-dive: there are exactly four closing items", d9.closing.length === 4);
check("project-deep-dive: there are exactly three questions to ask", d9.questionsToAsk.length === 3);
check("project-deep-dive: there are exactly six strong signals", d9.signals.strong.length === 6);
check("project-deep-dive: there are exactly six concern signals", d9.signals.concern.length === 6);
check("project-deep-dive: there are exactly seven failure modes", d9.failureModes.length === 7);
check("project-deep-dive: there are exactly three seniority entries", d9.seniority.length === 3);
check("project-deep-dive: seniority levels appear in the exact required order", arraysEqual(d9.seniority.map((entry) => entry.level), ["SDE I / entry level", "SDE II / mid level", "Senior+"]));
check("project-deep-dive: remote contains exactly three items", d9.environment.remote.length === 3);
check("project-deep-dive: onsite contains exactly three items", d9.environment.onsite.length === 3);
check("project-deep-dive: accessibility contains exactly four items", d9.environment.accessibility.length === 4);
check("project-deep-dive: there are exactly four company modifier rules", d9.companyModifierRules.length === 4);
check("project-deep-dive: there are exactly five interaction examples", d9.interactions.length === 5);
check("project-deep-dive: every interaction is classified as illustrative", d9.interactions.every((example) => example.classification === "illustrative"));
check("project-deep-dive: interaction IDs are unique", new Set(d9.interactions.map((example) => example.id)).size === d9.interactions.length);
check("project-deep-dive: every interaction has non-empty title, scenario, weak, strong, and annotation", d9.interactions.every((example) =>
  example.title.trim().length > 0 && example.scenario.trim().length > 0 && example.weak.trim().length > 0
  && example.strong.trim().length > 0 && example.annotation.trim().length > 0));
check("project-deep-dive: integrity contains exactly four statements", d9.integrity.length === 4);

// --- Project Deep Dive semantic content assertions ---------------------------------
const projectDeepDiveSerialized = JSON.stringify(d9).toLowerCase();
for (const concept of [
  "project", "objective", "constraint", "technical", "architecture", "ownership", "personal",
  "team", "decision", "alternative", "trade-off", "execution", "rollout", "failure", "operation",
  "migration", "outcome", "impact", "evidence", "learning", "follow-up", "uncertain",
  "confidential", "seniority", "reflection",
]) check(`project-deep-dive content includes concept: ${concept}`, projectDeepDiveSerialized.includes(concept));
check("project-deep-dive integrity disclaimer about proprietary prompts is present and intact", d9.integrity.some((statement) => statement.includes("It does not reproduce proprietary prompts")));
check("project-deep-dive integrity disclaimer about live-assessment assistance is present and intact", d9.integrity.some((statement) => statement.includes("It does not authorize external assistance during a live interview.")));
check("project-deep-dive integrity confirms story construction and technical curricula remain in their dedicated sections", d9.integrity.some((statement) => statement.includes("Project preparation and story construction remain in Behavioral, while System Design, ML Design, Low-Level Design, implementation, and other technical concepts remain in their dedicated learning and practice sections.")));

// --- Project Deep Dive does not become a curriculum ---------------------------------------
check("project-deep-dive dossier does not become a System Design curriculum", !/\bsystem design (curriculum|technology catalog|textbook)\b/i.test(projectDeepDiveSerialized));
check("project-deep-dive dossier does not become a Behavioral story-writing curriculum", !/\bbehavioral (story[- ]writing|story writing) curriculum\b/i.test(projectDeepDiveSerialized));
check("project-deep-dive dossier does not become a résumé-writing curriculum", !/\brésumé[- ]writing curriculum\b/i.test(projectDeepDiveSerialized) && !/\bresume[- ]writing curriculum\b/i.test(projectDeepDiveSerialized));
check("project-deep-dive dossier does not become an architecture-pattern catalog", !/\barchitecture[- ]pattern (catalog|library|cheat sheet|list of patterns)\b/i.test(projectDeepDiveSerialized));

// --- Project Deep Dive product-boundary assertions ---------------------------------
check("project-deep-dive dossier does not import lib/behavioral/queries", !projectDeepDiveDossierSource.includes("lib/behavioral/queries"));
check("project-deep-dive dossier does not import lib/behavioral/readiness", !projectDeepDiveDossierSource.includes("lib/behavioral/readiness"));
check("project-deep-dive dossier does not import System Design product queries", !projectDeepDiveDossierSource.includes("lib/system-design"));
check("project-deep-dive dossier does not import ML Design product queries", !projectDeepDiveDossierSource.includes("lib/ml-design"));
check("project-deep-dive dossier does not import LLD product code", !projectDeepDiveDossierSource.includes("lib/low-level-design"));
check("project-deep-dive dossier does not import Supabase", !/^import.*supabase/im.test(projectDeepDiveDossierSource) && !projectDeepDiveDossierSource.includes("createSupabase"));
check("project-deep-dive dossier does not import auth", !projectDeepDiveDossierSource.includes("getAuthenticatedActor") && !projectDeepDiveDossierSource.includes("auth.uid"));
check("project-deep-dive dossier does not implement story persistence", !/\.insert\(|\.update\(|\.delete\(|\.upsert\(/.test(projectDeepDiveDossierSource));
check("project-deep-dive dossier does not implement project persistence", !/projectPersist|saveProject/.test(projectDeepDiveDossierSource));
check("project-deep-dive dossier does not create a résumé parser", !/résuméParser|resumeParser/.test(projectDeepDiveDossierSource));
check("project-deep-dive dossier does not create a project score", !/projectScore/.test(projectDeepDiveDossierSource));
check("project-deep-dive dossier does not implement readiness calculation", !/readinessScore|calculateReadiness/.test(projectDeepDiveDossierSource));

// --- Dossier content integrity ------------------------------------------
const serializedDossier = JSON.stringify([d, d2, d3, d4, d5, d6, d7, d8, d9]);
check("dossier does not contain a company name", !/\b(google|meta|amazon|microsoft|apple|netflix)\b/i.test(serializedDossier));
check("dossier does not contain a proprietary question", !/leaked question|actual interview question|verbatim question/i.test(serializedDossier));
check("dossier does not contain source code", !/```|function\s*\(|=>\s*\{|;\s*\n\s*(const|let|var)\s/.test(serializedDossier));
check("dossier does not contain a named algorithm", !/\b(quicksort|mergesort|dijkstra|dynamic programming|binary search|breadth-first|depth-first|two pointers|sliding window)\b/i.test(serializedDossier));
check("dossier does not contain an unqualified pattern curriculum", !hasUnqualifiedPatternCurriculum(serializedDossier));

// --- Pattern-curriculum detector: automated positive/negative controls -----
check("pattern-curriculum detector allows without-turning anti-goal phrasing", !hasUnqualifiedPatternCurriculum("This remains execution guidance without turning the interview into a pattern catalog."));
check("pattern-curriculum detector allows do-not-memorize anti-goal phrasing", !hasUnqualifiedPatternCurriculum("Do not memorize a pattern list as the interview plan."));
check("pattern-curriculum detector rejects a direct positive claim", hasUnqualifiedPatternCurriculum("This guide includes a complete design pattern catalog for the interview."));
check("pattern-curriculum detector does not let unrelated negation mask a positive claim", hasUnqualifiedPatternCurriculum("Do not memorize syntax. This guide includes a pattern catalog."));
for (const forbidden of [
  "you will pass", "likely to pass", "pass probability", "readiness score", "percent ready",
  "guaranteed", "secret rubric", "bar raiser tricks", "actual interview question", "leaked question",
]) check(`dossier does not contain: ${forbidden}`, !serializedDossier.toLowerCase().includes(forbidden));
check("dossier does not instruct generative-AI use during an assessment", !/chatgpt|use an ai tool|use an llm|generative ai/i.test(serializedDossier));
check("dossier does not claim a universal number of questions", !/\b(exactly|always)\s+\d+\s+(problems?|questions?)\b/i.test(serializedDossier));
check("dossier does not describe timing ranges as mandatory", !/mandatory (timing|schedule|allocation)|must (spend|take) exactly/i.test(serializedDossier));
check("every time framework includes an explicit context-dependence assumption", [...d.timeFrameworks, ...d2.timeFrameworks, ...d3.timeFrameworks, ...d4.timeFrameworks, ...d5.timeFrameworks, ...d6.timeFrameworks, ...d7.timeFrameworks, ...d8.timeFrameworks, ...d9.timeFrameworks].every((framework) => /adaptable|assumes|context/i.test(framework.assumption)));
check("no interaction claims to be a real company transcript", ![...d.interactions, ...d2.interactions, ...d3.interactions, ...d4.interactions, ...d5.interactions, ...d6.interactions, ...d7.interactions, ...d8.interactions, ...d9.interactions].some((example) => /actual transcript|real interview transcript|verbatim transcript/i.test(`${example.scenario} ${example.annotation}`)));
check("no integrity statement implies legal advice", ![...d.integrity, ...d2.integrity, ...d3.integrity, ...d4.integrity, ...d5.integrity, ...d6.integrity, ...d7.integrity, ...d8.integrity, ...d9.integrity].some((statement) => /legal advice|constitutes legal/i.test(statement)));
check("generic role labels are present and allowed", serializedDossier.includes("SDE I") && serializedDossier.includes("SDE II") && serializedDossier.includes("Senior+"));
check("all nine dossier titles are distinct", new Set([d.title, d2.title, d3.title, d4.title, d5.title, d6.title, d7.title, d8.title, d9.title]).size === 9);
check("every dossier's integrity section disclaims live-assessment assistance rather than authorizing it", [d, d2, d3, d4, d5, d6, d7, d8, d9].every((dossier) => dossier.integrity.some((statement) => /does not (authorize external assistance during a live interview|provide assistance during a live assessment)/i.test(statement))));
check("dossier does not contain a security-exploitation instruction", !/\b(exploit a vulnerability|how to exploit|sql injection payload|privilege escalation technique|bypass authentication)\b/i.test(serializedDossier));
check("the debugging integrity disclaimer disclaiming exploitation teaching is not misflagged as an exploitation instruction", serializedDossier.toLowerCase().includes("it does not teach exploitation"));
check("dossier does not duplicate a language or framework curriculum", !/\b(learn (java|python|javascript|typescript|react|django|spring) (syntax|basics)|framework tutorial)\b/i.test(serializedDossier));
check("dossier does not reproduce an actual or real pull request", !/\b(actual pull request|real pull request|verbatim pull request)\b/i.test(serializedDossier));
check("ordinary code-review vocabulary (pull request, review artifact, testing, security) is not itself rejected", /\bpull request\b/i.test(codeReviewSerialized) && /\breview\b/i.test(codeReviewSerialized) && /\btest/i.test(codeReviewSerialized) && /\bsecurity\b/i.test(codeReviewSerialized));
check("the code-review integrity disclaimer about proprietary review artifacts is not misflagged as a proprietary artifact itself", serializedDossier.toLowerCase().includes("it does not reproduce proprietary review artifacts"));
check("dossier does not contain a complete proprietary design solution claim", !/\b(complete proprietary design|full proprietary solution|actual company design)\b/i.test(serializedDossier));
check("dossier does not contain a UML curriculum", !/\buml (tutorial|curriculum|lesson|course)\b/i.test(serializedDossier));
check("dossier does not contain a design-pattern catalog", !/\bdesign[- ]pattern (catalog|library|cheat sheet|list of patterns)\b/i.test(serializedDossier));
check("ordinary low-level-design vocabulary (class, object, interface, pattern, composition, inheritance, state, design) is not itself rejected", ["class", "object", "interface", "pattern", "composition", "inheritance", "state", "design"].every((word) => new RegExp(`\\b${word}\\b`, "i").test(lowLevelDesignSerialized)));
check("the low-level-design integrity disclaimer about proprietary prompts is not misflagged as a proprietary prompt itself", serializedDossier.toLowerCase().includes("it does not reproduce proprietary prompts"));
check("dossier does not contain a cloud-provider-specific tutorial", !/\b(aws|amazon web services|google cloud platform|\bgcp\b|microsoft azure) (tutorial|walkthrough|console guide|certification course)\b/i.test(serializedDossier));
check("dossier does not contain a System Design technology-catalog curriculum", !/\bsystem design (curriculum|technology catalog|textbook)\b/i.test(serializedDossier));
check("ordinary system-design vocabulary (API, storage, cache, queue, replication, partitioning, consistency, availability, latency, durability, reliability) is not itself rejected", ["API", "storage", "cach", "queue", "replicat", "partition", "consistency", "availability", "latency", "durability", "reliability"].every((word) => new RegExp(`\\b${word}`, "i").test(systemDesignSerialized)));
check("the system-design integrity disclaimer about proprietary prompts is not misflagged as a proprietary prompt itself", serializedDossier.toLowerCase().includes("it does not reproduce proprietary prompts"));
check("dossier does not contain an ML model-catalog curriculum", !/\bml (model catalog|model curriculum|algorithm catalog)\b/i.test(serializedDossier));
check("dossier does not contain a statistics curriculum", !/\bstatistics (curriculum|course|lesson|tutorial)\b/i.test(serializedDossier));
check("dossier does not contain a specific company ML architecture claim", !/\b(actual company architecture|company-specific model architecture|proprietary model architecture)\b/i.test(serializedDossier));
check("ordinary ML System Design vocabulary (model, ranking, retrieval, generation, feature, label, training, serving, metric, experiment, drift, monitoring, feedback) is not itself rejected", ["model", "ranking", "retrieval", "generation", "feature", "label", "training", "serving", "metric", "experiment", "drift", "monitoring", "feedback"].every((word) => new RegExp(`\\b${word}`, "i").test(mlSystemDesignSerialized)));
check("the ml-system-design integrity disclaimer about proprietary prompts is not misflagged as a proprietary prompt itself", serializedDossier.toLowerCase().includes("it does not reproduce proprietary prompts"));
for (const forbidden of [
  "culture-fit score", "personality score", "hiring prediction", "required universal story count",
  "mandatory answer duration", "real interview transcript",
]) check(`dossier does not contain: ${forbidden}`, !serializedDossier.toLowerCase().includes(forbidden));
check("dossier does not present a fabricated candidate answer as a real transcript", !/\bfabricated (candidate )?(answer|story|transcript) presented as real\b/i.test(serializedDossier));
check("ordinary Behavioral vocabulary (behavioral, story, example, competency, ownership, conflict, failure, impact, learning, follow-up, values, leadership, collaboration) is not itself rejected", ["behavioral", "story", "example", "competency", "ownership", "conflict", "failure", "impact", "learning", "follow-up", "values", "leadership", "collaboration"].every((word) => new RegExp(`\\b${word}`, "i").test(behavioralSerialized)));
check("the behavioral integrity disclaimer about fabricated candidate stories is not misflagged as a fabricated story itself", serializedDossier.toLowerCase().includes("hidden evaluation standards, or fabricated candidate stories"));
for (const forbidden of [
  "project complexity score", "seniority score", "confidential project architecture presented as public",
  "fabricated candidate project histories presented as real", "required universal project count",
  "mandatory project size", "mandatory architecture depth",
]) check(`dossier does not contain: ${forbidden}`, !serializedDossier.toLowerCase().includes(forbidden));
check("dossier does not present a real company transcript as a project deep dive artifact", !/\bactual company transcript\b/i.test(serializedDossier));
const projectDeepDiveOrdinaryVocabulary = [
  "architecture", "API", "service", "database", "queue", "migration", "monitoring", "security",
  "reliability", "latency", "cost", "stakeholder", "leadership", "project", "impact",
  "ownership", "failure", "trade-off",
];
function containsProjectDeepDiveOrdinaryVocabulary(text) {
  return projectDeepDiveOrdinaryVocabulary.every((word) => new RegExp(`\\b${word}`, "i").test(text));
}
check("ordinary Project Deep Dive vocabulary remains available in the dossier", containsProjectDeepDiveOrdinaryVocabulary(projectDeepDiveSerialized));
check("Project Deep Dive vocabulary qualification fails when a required term is removed", !containsProjectDeepDiveOrdinaryVocabulary(projectDeepDiveSerialized.replace(/\bdatabase\b/gi, "")));
check("the project-deep-dive integrity disclaimer about proprietary prompts is not misflagged as a proprietary prompt itself", serializedDossier.toLowerCase().includes("it does not reproduce proprietary prompts"));

// --- Dossier compatibility entry point -------------------------------------
check("compatibility entry point re-exports the dossier registry", dossierCompatibilitySource.includes('export * from "./dossiers/index.ts"'));
check("compatibility entry point contains no dossier object", !/slug:\s*"(algorithmic-coding|practical-coding|debugging|code-review|low-level-design|system-design|ml-system-design|behavioral|project-deep-dive)"/.test(dossierCompatibilitySource));
check("compatibility entry point contains no schema definition", !dossierCompatibilitySource.includes("export type RoundExecutionDossier") && !dossierCompatibilitySource.includes("export type RoundExecutionDossierFlowStep"));
check("compatibility entry point imports no React", !dossierCompatibilitySource.includes('from "react"'));
check("compatibility entry point imports no Next.js", !dossierCompatibilitySource.includes('from "next'));
check("compatibility entry point imports no Supabase", !/^import.*supabase/im.test(dossierCompatibilitySource) && !dossierCompatibilitySource.includes("createSupabase"));
check("compatibility entry point contains no direct table access", !dossierCompatibilitySource.includes(".from("));
check("compatibility entry point contains no authentication", !dossierCompatibilitySource.includes("getAuthenticatedActor") && !dossierCompatibilitySource.includes("auth.uid"));
check("compatibility entry point reads no environment variables", !dossierCompatibilitySource.includes("process.env"));
check("compatibility entry point does not call new Date()", !dossierCompatibilitySource.includes("new Date()"));
check("compatibility entry point does not call Date.now()", !dossierCompatibilitySource.includes("Date.now()"));
check("compatibility entry point does not call Math.random", !dossierCompatibilitySource.includes("Math.random"));

// --- Dossier schema ---------------------------------------------------------
for (const exported of ["RoundExecutionContentClassification", "RoundExecutionDossierFlowStep", "RoundExecutionTimePhase", "RoundExecutionTimeFramework", "RoundExecutionCommunicationPattern", "RoundExecutionRecoveryScenario", "RoundExecutionFailureMode", "RoundExecutionSeniorityCalibration", "RoundExecutionInteractionExample", "RoundExecutionDossier"]) {
  check(`dossier schema exports type ${exported}`, dossierSchemaSource.includes(`export type ${exported}`));
}
check("dossier schema imports only the canonical slug type", dossierSchemaSource.includes('import type { RoundExecutionGuideSlug } from "../round-execution.ts"') && !dossierSchemaSource.includes("ROUND_EXECUTION_GUIDES }"));
check("dossier schema contains no runtime dossier registry", !dossierSchemaSource.includes("ROUND_EXECUTION_DOSSIERS") && !dossierSchemaSource.includes("export function getRoundExecutionDossier"));
check("dossier schema contains no authored guide content", !/slug:\s*"(algorithmic-coding|practical-coding|debugging|code-review|low-level-design|system-design|ml-system-design|behavioral|project-deep-dive)"/.test(dossierSchemaSource));
check("dossier schema imports no React", !dossierSchemaSource.includes('from "react"'));
check("dossier schema imports no Next.js", !dossierSchemaSource.includes('from "next'));
check("dossier schema imports no Supabase", !/^import.*supabase/im.test(dossierSchemaSource) && !dossierSchemaSource.includes("createSupabase"));
check("dossier schema contains no direct table access", !dossierSchemaSource.includes(".from("));
check("dossier schema contains no authentication", !dossierSchemaSource.includes("getAuthenticatedActor") && !dossierSchemaSource.includes("auth.uid"));
check("dossier schema reads no environment variables", !dossierSchemaSource.includes("process.env"));
check("dossier schema does not call new Date()", !dossierSchemaSource.includes("new Date()"));
check("dossier schema does not call Date.now()", !dossierSchemaSource.includes("Date.now()"));
check("dossier schema does not call Math.random", !dossierSchemaSource.includes("Math.random"));

// --- Per-dossier files -------------------------------------------------------
const perDossierFiles = [
  { name: "algorithmic-coding.ts", source: algorithmicDossierSource, exportName: "algorithmicCodingDossier", slug: "algorithmic-coding", otherSlugs: ["practical-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"], otherFiles: ["practical-coding.ts", "debugging.ts", "code-review.ts", "low-level-design.ts", "system-design.ts", "ml-system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "practical-coding.ts", source: practicalDossierSource, exportName: "practicalCodingDossier", slug: "practical-coding", otherSlugs: ["algorithmic-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "debugging.ts", "code-review.ts", "low-level-design.ts", "system-design.ts", "ml-system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "debugging.ts", source: debuggingDossierSource, exportName: "debuggingDossier", slug: "debugging", otherSlugs: ["algorithmic-coding", "practical-coding", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "code-review.ts", "low-level-design.ts", "system-design.ts", "ml-system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "code-review.ts", source: codeReviewDossierSource, exportName: "codeReviewDossier", slug: "code-review", otherSlugs: ["algorithmic-coding", "practical-coding", "debugging", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "debugging.ts", "low-level-design.ts", "system-design.ts", "ml-system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "low-level-design.ts", source: lowLevelDesignDossierSource, exportName: "lowLevelDesignDossier", slug: "low-level-design", otherSlugs: ["algorithmic-coding", "practical-coding", "debugging", "code-review", "system-design", "ml-system-design", "behavioral", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "debugging.ts", "code-review.ts", "system-design.ts", "ml-system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "system-design.ts", source: systemDesignDossierSource, exportName: "systemDesignDossier", slug: "system-design", otherSlugs: ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "ml-system-design", "behavioral", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "debugging.ts", "code-review.ts", "low-level-design.ts", "ml-system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "ml-system-design.ts", source: mlSystemDesignDossierSource, exportName: "mlSystemDesignDossier", slug: "ml-system-design", otherSlugs: ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "system-design", "behavioral", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "debugging.ts", "code-review.ts", "low-level-design.ts", "system-design.ts", "behavioral.ts", "project-deep-dive.ts"] },
  { name: "behavioral.ts", source: behavioralDossierSource, exportName: "behavioralDossier", slug: "behavioral", otherSlugs: ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "project-deep-dive"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "debugging.ts", "code-review.ts", "low-level-design.ts", "system-design.ts", "ml-system-design.ts", "project-deep-dive.ts"] },
  { name: "project-deep-dive.ts", source: projectDeepDiveDossierSource, exportName: "projectDeepDiveDossier", slug: "project-deep-dive", otherSlugs: ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral"], otherFiles: ["algorithmic-coding.ts", "practical-coding.ts", "debugging.ts", "code-review.ts", "low-level-design.ts", "system-design.ts", "ml-system-design.ts", "behavioral.ts"] },
];
for (const file of perDossierFiles) {
  check(`${file.name} imports RoundExecutionDossier from ./schema.ts`, file.source.includes('import type { RoundExecutionDossier } from "./schema.ts"'));
  check(`${file.name} exports exactly its named dossier constant (${file.exportName})`, file.source.includes(`export const ${file.exportName}: RoundExecutionDossier`) && [...file.source.matchAll(/^export const (\w+)/gm)].every((match) => match[1] === file.exportName));
  check(`${file.name} contains its expected slug`, file.source.includes(`slug: "${file.slug}"`));
  check(`${file.name} does not contain either other dossier's slug`, file.otherSlugs.every((otherSlug) => !file.source.includes(`slug: "${otherSlug}"`)));
  check(`${file.name} does not create a registry`, !file.source.includes("ROUND_EXECUTION_DOSSIERS") && !file.source.includes("export function getRoundExecutionDossier"));
  check(`${file.name} does not import another dossier file`, file.otherFiles.every((otherFile) => !file.source.includes(otherFile)));
  check(`${file.name} imports no React`, !file.source.includes('from "react"'));
  check(`${file.name} imports no Next.js`, !file.source.includes('from "next'));
  check(`${file.name} imports no Supabase`, !/^import.*supabase/im.test(file.source) && !file.source.includes("createSupabase"));
  check(`${file.name} contains no direct table access`, !file.source.includes(".from("));
  check(`${file.name} contains no authentication`, !file.source.includes("getAuthenticatedActor") && !file.source.includes("auth.uid"));
  check(`${file.name} reads no environment variables`, !file.source.includes("process.env"));
  check(`${file.name} does not call new Date()`, !file.source.includes("new Date()"));
  check(`${file.name} does not call Date.now()`, !file.source.includes("Date.now()"));
  check(`${file.name} does not call Math.random`, !file.source.includes("Math.random"));
  check(`${file.name} does not call fetch`, !file.source.includes("fetch("));
  check(`${file.name} does not use localStorage`, !file.source.includes("localStorage"));
  check(`${file.name} does not use sessionStorage`, !file.source.includes("sessionStorage"));
  check(`${file.name} contains no Server Action`, !file.source.includes('"use server"'));
  check(`${file.name} contains no database write`, !file.source.includes(".insert(") && !file.source.includes(".update(") && !file.source.includes(".delete(") && !file.source.includes(".upsert("));
}

// --- Dossier registry --------------------------------------------------------
check("registry imports algorithmicCodingDossier from ./algorithmic-coding.ts", dossierRegistrySource.includes('import { algorithmicCodingDossier } from "./algorithmic-coding.ts"'));
check("registry imports practicalCodingDossier from ./practical-coding.ts", dossierRegistrySource.includes('import { practicalCodingDossier } from "./practical-coding.ts"'));
check("registry imports debuggingDossier from ./debugging.ts", dossierRegistrySource.includes('import { debuggingDossier } from "./debugging.ts"'));
check("registry imports codeReviewDossier from ./code-review.ts", dossierRegistrySource.includes('import { codeReviewDossier } from "./code-review.ts"'));
check("registry imports lowLevelDesignDossier from ./low-level-design.ts", dossierRegistrySource.includes('import { lowLevelDesignDossier } from "./low-level-design.ts"'));
check("registry imports systemDesignDossier from ./system-design.ts", dossierRegistrySource.includes('import { systemDesignDossier } from "./system-design.ts"'));
check("registry imports mlSystemDesignDossier from ./ml-system-design.ts", dossierRegistrySource.includes('import { mlSystemDesignDossier } from "./ml-system-design.ts"'));
check("registry imports behavioralDossier from ./behavioral.ts", dossierRegistrySource.includes('import { behavioralDossier } from "./behavioral.ts"'));
check("registry imports projectDeepDiveDossier from ./project-deep-dive.ts", dossierRegistrySource.includes('import { projectDeepDiveDossier } from "./project-deep-dive.ts"'));
check("registry uses the canonical dossier order", /ROUND_EXECUTION_DOSSIERS[\s\S]{0,60}=[\s\S]{0,520}algorithmicCodingDossier,\s*practicalCodingDossier,\s*debuggingDossier,\s*codeReviewDossier,\s*lowLevelDesignDossier,\s*systemDesignDossier,\s*mlSystemDesignDossier,\s*behavioralDossier,\s*projectDeepDiveDossier/.test(dossierRegistrySource));
check("registry registers codeReviewDossier after debuggingDossier", dossierRegistrySource.indexOf("debuggingDossier,") < dossierRegistrySource.indexOf("codeReviewDossier,"));
check("registry registers lowLevelDesignDossier after codeReviewDossier", dossierRegistrySource.indexOf("codeReviewDossier,") < dossierRegistrySource.indexOf("lowLevelDesignDossier,"));
check("registry registers systemDesignDossier after lowLevelDesignDossier", dossierRegistrySource.indexOf("lowLevelDesignDossier,") < dossierRegistrySource.indexOf("systemDesignDossier,"));
check("registry registers mlSystemDesignDossier after systemDesignDossier", dossierRegistrySource.indexOf("systemDesignDossier,") < dossierRegistrySource.indexOf("mlSystemDesignDossier,"));
check("registry registers behavioralDossier after mlSystemDesignDossier", dossierRegistrySource.indexOf("mlSystemDesignDossier,") < dossierRegistrySource.indexOf("behavioralDossier,"));
check("registry registers projectDeepDiveDossier after behavioralDossier", dossierRegistrySource.indexOf("behavioralDossier,") < dossierRegistrySource.indexOf("projectDeepDiveDossier,"));
check("registry exports ROUND_EXECUTION_DOSSIERS", dossierRegistrySource.includes("export const ROUND_EXECUTION_DOSSIERS"));
check("registry exports ROUND_EXECUTION_DOSSIER_BY_SLUG", dossierRegistrySource.includes("export const ROUND_EXECUTION_DOSSIER_BY_SLUG"));
check("registry exports PUBLISHED_ROUND_EXECUTION_DOSSIERS", dossierRegistrySource.includes("export const PUBLISHED_ROUND_EXECUTION_DOSSIERS"));
check("registry exports getRoundExecutionDossier", dossierRegistrySource.includes("export function getRoundExecutionDossier"));
check("registry re-exports the schema types", dossierRegistrySource.includes("export type {") && dossierRegistrySource.includes('from "./schema.ts"'));
check("registry re-exports all nine named dossier constants", /export\s*\{\s*algorithmicCodingDossier,\s*practicalCodingDossier,\s*debuggingDossier,\s*codeReviewDossier,\s*lowLevelDesignDossier,\s*systemDesignDossier,\s*mlSystemDesignDossier,\s*behavioralDossier,\s*projectDeepDiveDossier,?\s*\};/.test(dossierRegistrySource));
check("registry contains exactly nine registry entries", /ROUND_EXECUTION_DOSSIERS[\s\S]{0,60}=\s*\[([\s\S]{0,520}?)\];/.exec(dossierRegistrySource)?.[1]?.split(",").map((entry) => entry.trim()).filter(Boolean).length === 9);
check("registry preserves the other eight imports and exports alongside the new one", ["algorithmicCodingDossier", "practicalCodingDossier", "debuggingDossier", "codeReviewDossier", "lowLevelDesignDossier", "systemDesignDossier", "mlSystemDesignDossier", "behavioralDossier"].every((name) => dossierRegistrySource.includes(name)));
check("registry adds no fallback dossier", !dossierRegistrySource.includes("fallbackDossier") && !dossierRegistrySource.includes("defaultDossier"));
check("registry adds no dynamic file discovery", !dossierRegistrySource.includes("readdirSync") && !dossierRegistrySource.includes("readdir(") && !dossierRegistrySource.includes("import.meta.glob"));
check("registry adds no Hiring Manager dossier", !dossierRegistrySource.includes("hiringManagerDossier"));
check("registry adds no Technical Presentation dossier", !dossierRegistrySource.includes("technicalPresentationDossier"));
check("registry adds no generic final/onsite/bar-raiser/mixed-signal dossier", !/slug:\s*"(final|onsite|bar-raiser|mixed-signal)"/.test(dossierRegistrySource));

// --- Dossier module invariants (apply across the whole split module) --------
check("dossier module does not call fetch", !allDossierModuleSource.includes("fetch("));
check("dossier module does not use localStorage", !allDossierModuleSource.includes("localStorage"));
check("dossier module does not add a score field", !/\bscore\s*[:=]/.test(allDossierModuleSource));
check("dossier module does not add a weight field", !/\bweight\s*[:=]/.test(allDossierModuleSource));
check("dossier module does not add a percentage field", !/\bpercentage\s*[:=]/.test(allDossierModuleSource));
check("dossier module does not add a probability field", !/\bprobability\s*[:=]/.test(allDossierModuleSource));
check("dossier module does not add a pass threshold field", !/pass\s*threshold/i.test(allDossierModuleSource));
check("dossier module does not add a readiness level field", !/readinessLevel/.test(allDossierModuleSource));
check("dossier module does not add a difficulty field", !/\bdifficulty\s*[:=]/.test(allDossierModuleSource));
check("dossier module does not fabricate a fallback dossier", !allDossierModuleSource.includes("fallbackDossier") && !allDossierModuleSource.includes("defaultDossier"));

// --- Dossier renderer component -------------------------------------------
check("component exports RoundExecutionDossierView", dossierComponentSource.includes("export function RoundExecutionDossierView"));
check("component is a Server Component", !dossierComponentSource.includes("use client"));
check("component does not use React state", !dossierComponentSource.includes("useState"));
check("component does not use effects", !dossierComponentSource.includes("useEffect"));
check("component contains no form", !dossierComponentSource.includes("<form"));
check("component contains no input", !dossierComponentSource.includes("<input"));
check("component contains no checkbox", !dossierComponentSource.includes('type="checkbox"'));
check("component contains no Server Action", !dossierComponentSource.includes('"use server"'));
check("component does not import Supabase", !/^import.*supabase/im.test(dossierComponentSource) && !dossierComponentSource.includes("createSupabase"));
check("component does not call a data query", !dossierComponentSource.includes("await "));
check("component does not use dangerouslySetInnerHTML", !dossierComponentSource.includes("dangerouslySetInnerHTML"));
check("component fails closed when guide and dossier slugs mismatch", dossierComponentSource.includes("guide.slug !== dossier.slug") && dossierComponentSource.includes("return null"));
check("component uses SectionHeading", dossierComponentSource.includes("SectionHeading"));
check("component uses StatusPill", dossierComponentSource.includes("StatusPill"));
for (const anchor of ["evaluate", "before", "flow", "time-control", "communication-recovery", "validate-close", "signals", "seniority", "environment", "interactions", "boundaries"]) {
  check(`component contains anchor #${anchor}`, dossierComponentSource.includes(`id="${anchor}"`) || dossierComponentSource.includes(`#${anchor}`));
}
check("component renders dossier.purpose", dossierComponentSource.includes("dossier.purpose"));
check("component renders dossier.intendedEvaluation", dossierComponentSource.includes("dossier.intendedEvaluation"));
check("component renders dossier.companyVariation", dossierComponentSource.includes("dossier.companyVariation"));
check("component renders dossier.beforeRound", dossierComponentSource.includes("dossier.beforeRound"));
check("component renders dossier.flow", dossierComponentSource.includes("dossier.flow"));
check("component renders dossier.timeFrameworks", dossierComponentSource.includes("dossier.timeFrameworks"));
check("component renders dossier.communication", dossierComponentSource.includes("dossier.communication"));
check("component renders dossier.recovery", dossierComponentSource.includes("dossier.recovery"));
check("component renders dossier.validation", dossierComponentSource.includes("dossier.validation"));
check("component renders dossier.closing", dossierComponentSource.includes("dossier.closing"));
check("component renders dossier.questionsToAsk", dossierComponentSource.includes("dossier.questionsToAsk"));
check("component renders dossier.signals", dossierComponentSource.includes("dossier.signals"));
check("component renders dossier.failureModes", dossierComponentSource.includes("dossier.failureModes"));
check("component renders dossier.seniority", dossierComponentSource.includes("dossier.seniority"));
check("component renders dossier.environment", dossierComponentSource.includes("dossier.environment"));
check("component renders dossier.companyModifierRules", dossierComponentSource.includes("dossier.companyModifierRules"));
check("component renders dossier.interactions", dossierComponentSource.includes("dossier.interactions"));
check("component renders dossier.integrity", dossierComponentSource.includes("dossier.integrity"));
check("component contains the time-control disclaimer", dossierComponentSource.includes("not universal interview rules or pass/fail timing thresholds"));
check("component contains the signals disclaimer", dossierComponentSource.includes("not a scoring rubric, hiring decision, or probability of passing"));
check("component contains the generic seniority disclaimer", dossierComponentSource.includes("Seniority changes the evidence emphasized; it does not remove the requirement to complete the round’s core task and validate the result."));
check("component no longer contains the algorithmic-coding-specific seniority sentence", !dossierComponentSource.includes("does not remove the requirement to write correct code"));
check("component contains the accessibility accommodation sentence", dossierComponentSource.includes("designated accommodations contact"));
check("component contains the company-variation disclaimer", dossierComponentSource.includes("does not make candidate reports official policy"));
check("component renders a generic dossier title", dossierComponentSource.includes("title={dossier.title}"));
check("component renders a generic dossier description from purpose", dossierComponentSource.includes("description={dossier.purpose}"));
check("component does not hardcode the algorithmic-coding title", !dossierComponentSource.includes("Algorithmic coding: from prompt to validated solution"));
check("component renders the validate-the-result heading", dossierComponentSource.includes("Validate the result"));
check("component no longer contains the algorithmic-coding-specific validation heading", !dossierComponentSource.includes("Validate the implementation"));
check("component derives related-preparation links from guide.relatedHrefs", dossierComponentSource.includes("guide.relatedHrefs.map("));
check("component uses roundExecutionRelatedLinkLabel for related-preparation links", dossierComponentSource.includes("roundExecutionRelatedLinkLabel(href)"));
check("component imports roundExecutionRelatedLinkLabel from the presentation module", dossierComponentSource.includes('import { roundExecutionRelatedLinkLabel } from "@/lib/interview-playbook/round-execution-presentation"'));
check("component no longer hardcodes /dsa in related preparation", !dossierComponentSource.includes('href="/dsa"'));
check("component no longer hardcodes /dsa/practice in related preparation", !dossierComponentSource.includes('href="/dsa/practice"'));
check('component links to "/companies"', dossierComponentSource.includes('href="/companies"'));
check('component links to "/interview-tips/rounds"', dossierComponentSource.includes('href="/interview-tips/rounds"'));
check('component links to "/interview-tips"', dossierComponentSource.includes('href="/interview-tips"'));
check("component does not link to the private Playbook", !dossierComponentSource.includes('href="/interview-playbook"'));
check("component contains no company-specific process claims", !/\b(google|meta|amazon|microsoft|apple|netflix)\b/i.test(dossierComponentSource));
check("component contains no universal minute allocation outside supplied dossier data", !/\bmust take \d+ minutes\b/i.test(dossierComponentSource));
check("component does not add a score field", !/\bscore\s*[:=]/.test(dossierComponentSource));
check("component does not add a probability field", !/\bprobability\s*[:=]/.test(dossierComponentSource));
check("component does not add a fixed countdown timer", !/setInterval|setTimeout|useCountdown/.test(dossierComponentSource));

// --- Detail-route integration assertions ----------------------------------
check("detail page still exports generateStaticParams", roundsDetailPageSourceAfterDossier.includes("export function generateStaticParams"));
check("detail page still uses V1_ROUND_EXECUTION_GUIDES for static params", roundsDetailPageSourceAfterDossier.includes("V1_ROUND_EXECUTION_GUIDES.map((guide) => ({ slug: guide.slug }))"));
check("detail page still exports dynamicParams = false", roundsDetailPageSourceAfterDossier.includes("export const dynamicParams = false"));
check("detail page still uses Promise-based params", roundsDetailPageSourceAfterDossier.includes("params: Promise<{ slug: string }>"));
check("detail page still calls notFound() for invalid or post-v1 guides", roundsDetailPageSourceAfterDossier.includes("notFound()") && /!guide\s*\|\|\s*!guide\.v1/.test(roundsDetailPageSourceAfterDossier));
check("detail page renders the quick reference before the dossier", roundsDetailPageSourceAfterDossier.indexOf("<RoundExecutionQuickReference") < roundsDetailPageSourceAfterDossier.indexOf("<RoundExecutionDossierView"));
check("detail page renders the dossier conditionally", /\{dossier \? <RoundExecutionDossierView/.test(roundsDetailPageSourceAfterDossier));
check("detail page does not render an empty dossier shell when absent", roundsDetailPageSourceAfterDossier.includes(": null"));
check("detail page uses getRoundExecutionDossier", roundsDetailPageSourceAfterDossier.includes("getRoundExecutionDossier(guide.slug)"));
check("detail page still requires no authentication", !roundsDetailPageSourceAfterDossier.includes("requireMemberProfile") && !roundsDetailPageSourceAfterDossier.includes("isAccountPlatformAvailable"));
check("detail page still performs no direct Supabase query", !/^import.*supabase/im.test(roundsDetailPageSourceAfterDossier) && !roundsDetailPageSourceAfterDossier.includes(".from("));
{
  const paramSlugs = V1_ROUND_EXECUTION_GUIDES.map((guide) => guide.slug);
  check("static params still generate exactly 15 v1 pages", paramSlugs.length === 15);
  check("technical-presentation still excluded from static params", !paramSlugs.includes("technical-presentation"));
  check("exactly algorithmic-coding, practical-coding, debugging, code-review, low-level-design, system-design, ml-system-design, behavioral, and project-deep-dive currently resolve a dossier among all v1 slugs", arraysEqual(
    paramSlugs.filter((slug) => getRoundExecutionDossier(slug) !== null).sort(),
    ["algorithmic-coding", "practical-coding", "debugging", "code-review", "low-level-design", "system-design", "ml-system-design", "behavioral", "project-deep-dive"].sort(),
  ));
  check("exactly six v1 routes remain quick-reference-only (no dossier)", paramSlugs.filter((slug) => getRoundExecutionDossier(slug) === null).length === 6);
  check("code-review still resolves a dossier", getRoundExecutionDossier("code-review") !== null);
  check("code-review remains a valid v1 route", paramSlugs.includes("code-review"));
  check("low-level-design still resolves a dossier", getRoundExecutionDossier("low-level-design") !== null);
  check("low-level-design remains a valid v1 route", paramSlugs.includes("low-level-design"));
  check("system-design still resolves a dossier", getRoundExecutionDossier("system-design") !== null);
  check("system-design remains a valid v1 route", paramSlugs.includes("system-design"));
  check("ml-system-design still resolves a dossier", getRoundExecutionDossier("ml-system-design") !== null);
  check("ml-system-design remains a valid v1 route", paramSlugs.includes("ml-system-design"));
  check("behavioral still resolves a dossier", getRoundExecutionDossier("behavioral") !== null);
  check("behavioral remains a valid v1 route", paramSlugs.includes("behavioral"));
  check("project-deep-dive now resolves a dossier", getRoundExecutionDossier("project-deep-dive") !== null);
  check("project-deep-dive remains a valid v1 route", paramSlugs.includes("project-deep-dive"));
  check("hiring-manager does not resolve a dossier", getRoundExecutionDossier("hiring-manager") === null);
  check("hiring-manager remains a valid v1 route", paramSlugs.includes("hiring-manager"));
  check("a valid v1 route does not require a dossier (six still resolve null)", paramSlugs.filter((slug) => getRoundExecutionDossier(slug) === null).every((slug) => V1_ROUND_EXECUTION_GUIDES.some((guide) => guide.slug === slug)));
}

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview execution taxonomy qualification passed (${cases.length} cases).`);
