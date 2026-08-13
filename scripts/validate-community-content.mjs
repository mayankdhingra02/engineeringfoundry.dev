import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const challengePath = path.join(projectRoot, "data/challenges/challenges.json");
const rubricPath = path.join(projectRoot, "data/challenges/rubrics.json");
const companyPath = path.join(projectRoot, "data/companies/companies.json");

const categories = new Set(["DSA", "System Design", "ML System Design", "Backend Engineering"]);
const levels = new Set(["Foundation", "Intermediate", "Advanced"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const placeholderPattern = /\b(lorem ipsum|placeholder|demo challenge|coming soon|tbd|todo)\b/i;
const rewardPattern = /\b(cash prize|prize pool|winner receives|guaranteed reward|bounty|competition deadline)\b/i;
const requiredArrays = ["context", "deliverables", "constraints", "success_criteria", "workflow", "guidance", "common_mistakes"];

function fail(errors, location, message) {
  errors.push(`${location}: ${message}`);
}

function requireText(value, errors, location) {
  if (typeof value !== "string" || !value.trim()) fail(errors, location, "requires non-empty text");
}

export async function validateCommunityContent() {
  const [challengeRaw, rubricRaw, companyRaw] = await Promise.all([readFile(challengePath, "utf8"), readFile(rubricPath, "utf8"), readFile(companyPath, "utf8")]);
  const challenges = JSON.parse(challengeRaw);
  const rubrics = JSON.parse(rubricRaw);
  const companies = JSON.parse(companyRaw);
  const errors = [];
  const ids = new Set();
  const slugs = new Set();
  const rubricIds = new Set();

  if (!Array.isArray(rubrics) || rubrics.length !== categories.size) fail(errors, "rubrics", "requires one rubric for each public category");
  else for (const [index, rubric] of rubrics.entries()) {
    const location = `rubrics[${index}]`;
    requireText(rubric.id, errors, `${location}.id`);
    requireText(rubric.title, errors, `${location}.title`);
    if (rubricIds.has(rubric.id)) fail(errors, location, `duplicates rubric id '${rubric.id}'`);
    rubricIds.add(rubric.id);
    if (!categories.has(rubric.category)) fail(errors, location, "uses an invalid category");
    if (!Array.isArray(rubric.dimensions) || rubric.dimensions.length < 5) fail(errors, location, "requires at least five qualitative dimensions");
    else {
      const dimensionIds = new Set();
      for (const [dimensionIndex, dimension] of rubric.dimensions.entries()) {
        const dimensionLocation = `${location}.dimensions[${dimensionIndex}]`;
        for (const key of ["id", "label", "strong", "developing", "needs_attention"]) requireText(dimension[key], errors, `${dimensionLocation}.${key}`);
        if (dimensionIds.has(dimension.id)) fail(errors, dimensionLocation, `duplicates dimension id '${dimension.id}'`);
        dimensionIds.add(dimension.id);
      }
    }
  }

  if (!Array.isArray(challenges)) fail(errors, "challenges", "must be an array");
  else for (const [index, challenge] of challenges.entries()) {
    const location = `challenges[${index}]`;
    for (const key of ["id", "slug", "title", "summary", "prompt", "rubric_id"]) requireText(challenge[key], errors, `${location}.${key}`);
    if (ids.has(challenge.id)) fail(errors, location, `duplicates challenge id '${challenge.id}'`);
    ids.add(challenge.id);
    if (slugs.has(challenge.slug)) fail(errors, location, `duplicates slug '${challenge.slug}'`);
    slugs.add(challenge.slug);
    if (!slugPattern.test(challenge.slug ?? "")) fail(errors, location, "slug is not URL-safe");
    if (!categories.has(challenge.category)) fail(errors, location, "uses an invalid category");
    if (!levels.has(challenge.level)) fail(errors, location, "uses an invalid Engineering Foundry level");
    if (!rubricIds.has(challenge.rubric_id)) fail(errors, location, `references unknown rubric '${challenge.rubric_id}'`);
    const rubric = rubrics.find((item) => item.id === challenge.rubric_id);
    if (rubric && rubric.category !== challenge.category) fail(errors, location, "references a rubric from another category");
    if (!Number.isInteger(challenge.suggested_minutes) || challenge.suggested_minutes < 30 || challenge.suggested_minutes > 90) fail(errors, location, "suggested_minutes must be an integer from 30 through 90");
    if (!new Set(["active", "needs_review"]).has(challenge.status)) fail(errors, location, "uses an invalid status");
    if (challenge.source?.name !== "Engineering Foundry" || challenge.source?.platform !== "original") fail(errors, location, "must use original Engineering Foundry provenance");
    for (const key of requiredArrays) if (!Array.isArray(challenge[key]) || challenge[key].length === 0) fail(errors, `${location}.${key}`, "must be a non-empty array");
    if (!Array.isArray(challenge.stretch_goals)) fail(errors, `${location}.stretch_goals`, "must be an array");
    for (const section of challenge.guidance ?? []) {
      requireText(section.id, errors, `${location}.guidance.id`);
      requireText(section.title, errors, `${location}.guidance.title`);
      if (!Array.isArray(section.considerations) || section.considerations.length === 0) fail(errors, `${location}.guidance.considerations`, "must be non-empty");
    }
    const copy = JSON.stringify(challenge);
    if (challenge.status === "active" && placeholderPattern.test(copy)) fail(errors, location, "active content contains demo or placeholder language");
    if (rewardPattern.test(copy)) fail(errors, location, "must not claim a competition reward, winner, or deadline");
    for (const forbidden of ["deadline", "prize", "reward", "winner", "companyAssociations", "companyId"]) if (Object.hasOwn(challenge, forbidden)) fail(errors, location, `must not contain '${forbidden}'`);
  }

  const active = challenges.filter((challenge) => challenge.status === "active");
  if (active.length < 8) fail(errors, "challenges", "requires at least eight active challenges");
  for (const category of categories) if (active.filter((challenge) => challenge.category === category).length < 2) fail(errors, "challenges", `requires at least two active '${category}' challenges`);
  for (const company of companies) {
    const escapedName = company.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escapedName}\\b`, "i").test(challengeRaw)) fail(errors, "challenges", `must not make company-specific claims about '${company.name}'`);
  }

  if (errors.length) throw new Error(`Community content validation failed:\n- ${errors.join("\n- ")}`);
  return { challenges: challenges.length, active: active.length, rubrics: rubrics.length, categories: categories.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validateCommunityContent();
    console.log(`Community content valid: ${result.active} active challenges across ${result.categories} categories and ${result.rubrics} rubrics.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
