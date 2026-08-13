import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const validTracks = new Set(["dsa", "system-design", "ml-design", "behavioral"]);
const validStatuses = new Set(["active", "needs_review"]);
const expectedKinds = new Map([
  ["dsa", "dsa-question"],
  ["system-design", "system-design-problem"],
  ["ml-design", "ml-design-problem"],
  ["behavioral", "behavioral-question"],
]);
const slugPattern = /^([a-z0-9]+-)*[a-z0-9]+$/;
const placeholderPattern = /\b(placeholder|demo|lorem ipsum|coming soon)\b/i;

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const nonEmptyList = (value) => Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);

export function validateMockContent({ plans, rubrics, dsaQuestions, systemProblems, mlProblems, behavioralQuestions }) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const unique = (items, field, label) => {
    const values = items.map((item) => item[field]);
    check(new Set(values).size === values.length, `${label} must have unique ${field} values`);
  };

  unique(plans, "id", "Mock session plans");
  unique(plans, "slug", "Mock session plans");
  unique(rubrics, "id", "Mock rubrics");

  const rubricIds = new Set(rubrics.map((rubric) => rubric.id));
  const registries = {
    "dsa-question": new Map(dsaQuestions.map((item) => [item.id, item])),
    "system-design-problem": new Map(systemProblems.map((item) => [item.id, item])),
    "ml-design-problem": new Map(mlProblems.map((item) => [item.id, item])),
    "behavioral-question": new Map(behavioralQuestions.map((item) => [item.id, item])),
  };

  rubrics.forEach((rubric) => {
    check(validTracks.has(rubric.track), `Mock rubric ${rubric.id} has invalid track ${rubric.track}`);
    check(nonEmptyString(rubric.title) && nonEmptyString(rubric.disclaimer), `Mock rubric ${rubric.id} has empty critical content`);
    check(Array.isArray(rubric.dimensions) && rubric.dimensions.length > 0, `Mock rubric ${rubric.id} must include dimensions`);
    unique(rubric.dimensions ?? [], "id", `Mock rubric ${rubric.id} dimensions`);
    rubric.dimensions?.forEach((dimension) => check(nonEmptyString(dimension.label) && nonEmptyString(dimension.description), `Mock rubric ${rubric.id} has an invalid dimension ${dimension.id}`));
    check(!Object.hasOwn(rubric, "company") && !Object.hasOwn(rubric, "companies") && !Object.hasOwn(rubric, "companyAssociations"), `Mock rubric ${rubric.id} must not contain company associations`);
  });

  plans.forEach((plan) => {
    check(slugPattern.test(plan.slug), `Mock session plan ${plan.id} has an invalid slug`);
    check(validTracks.has(plan.track), `Mock session plan ${plan.id} has invalid track ${plan.track}`);
    check(validStatuses.has(plan.status), `Mock session plan ${plan.id} has invalid status ${plan.status}`);
    check(nonEmptyString(plan.title), `Mock session plan ${plan.id} must include a title`);
    check(!placeholderPattern.test(`${plan.id} ${plan.slug} ${plan.title}`), `Mock session plan ${plan.id} is a placeholder or demo plan`);
    check(rubricIds.has(plan.rubric_id), `Mock session plan ${plan.id} references unknown rubric ${plan.rubric_id}`);
    const rubric = rubrics.find((item) => item.id === plan.rubric_id);
    check(!rubric || rubric.track === plan.track, `Mock session plan ${plan.id} uses a rubric for another track`);

    const range = plan.recommended_minutes;
    check(Number.isInteger(range?.min) && Number.isInteger(range?.max) && range.min >= 10 && range.max <= 120 && range.min <= range.max, `Mock session plan ${plan.id} has invalid suggested duration`);
    check(Array.isArray(plan.sections) && plan.sections.length > 0 && plan.sections.every((section) => nonEmptyString(section.id) && nonEmptyString(section.title) && Number.isInteger(section.minutes) && section.minutes > 0), `Mock session plan ${plan.id} must include valid sections`);
    const sectionMinutes = plan.sections?.reduce((total, section) => total + section.minutes, 0) ?? 0;
    check(!range || (sectionMinutes >= range.min && sectionMinutes <= range.max), `Mock session plan ${plan.id} section timing must fit its suggested duration`);
    if (plan.status === "active") {
      check(nonEmptyList(plan.candidate_instructions), `Active mock session plan ${plan.id} requires candidate instructions`);
      check(nonEmptyList(plan.interviewer_instructions), `Active mock session plan ${plan.id} requires interviewer instructions`);
    }

    check(!Object.hasOwn(plan, "company") && !Object.hasOwn(plan, "companies") && !Object.hasOwn(plan, "companyAssociations"), `Mock session plan ${plan.id} must not contain company associations`);
    const reference = plan.content_reference;
    check(reference && expectedKinds.get(plan.track) === reference.kind, `Mock session plan ${plan.id} has a content kind that does not match its track`);
    const referenced = reference && registries[reference.kind]?.get(reference.id);
    check(Boolean(referenced), `Mock session plan ${plan.id} has invalid prompt reference ${reference?.id ?? "missing"}`);
    check(!referenced || referenced.status === "active", `Mock session plan ${plan.id} must reference active content`);
    if (reference?.kind === "dsa-question") check(!referenced || (referenced.isOriginal === true && referenced.originalPrompt && referenced.source?.platform === "original"), `Mock session plan ${plan.id} must reference an original DSA prompt`);
    if (reference?.kind !== "dsa-question") check(!referenced || referenced.source?.name === "Engineering Foundry" && referenced.source?.platform === "original", `Mock session plan ${plan.id} must reference original Engineering Foundry content`);
  });

  for (const track of validTracks) check(plans.some((plan) => plan.track === track && plan.status === "active"), `Mock session plans must include an active ${track} plan`);
  return errors;
}

async function load(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
}

async function loadInputs() {
  const [plans, rubrics, dsaFoundations, dsaCore, dsaStructures, dsaAdvanced, systemProblems, mlProblems, behavioralQuestions] = await Promise.all([
    load("data/mock-interviews/session-plans.json"), load("data/mock-interviews/rubrics.json"),
    load("data/dsa/questions-foundations.json"), load("data/dsa/questions-core-patterns.json"), load("data/dsa/questions-structures.json"), load("data/dsa/questions-advanced.json"),
    load("data/system-design/problems.json"), load("data/ml-design/problems.json"), load("data/behavioral/questions.json"),
  ]);
  return { plans, rubrics, dsaQuestions: [...dsaFoundations, ...dsaCore, ...dsaStructures, ...dsaAdvanced], systemProblems, mlProblems, behavioralQuestions };
}

async function main() {
  const inputs = await loadInputs();
  const errors = validateMockContent(inputs);
  if (errors.length) {
    console.error(`Mock content validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(`Mock content validation passed: ${inputs.plans.length} session plans across 4 tracks and ${inputs.rubrics.length} track-specific rubrics.`);
}

export { loadInputs };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
