import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guidancePath = path.join(projectRoot, "data/referrals/guidance.json");
const templatesPath = path.join(projectRoot, "data/referrals/templates.json");
const companiesPath = path.join(projectRoot, "data/companies/companies.json");

const requiredCollections = [
  "requestQualityChecklist",
  "goodRequestBehavior",
  "poorRequestBehavior",
  "communitySafety",
  "referrerReviewChecklist",
  "availabilityCardHelp",
  "decisionSteps",
  "futureWorkflow",
];
const allowedStatuses = new Set(["active", "needs_review"]);
const unsafeKeys = new Set(["userId", "verificationStatus", "requestsReviewed", "compensation", "profiles"]);
const placeholderPattern = /\b(lorem ipsum|todo|tbd|placeholder|demo content)\b/i;
const guaranteePattern = /\b(guaranteed referral|guaranteed interview|guaranteed job|guarantees? (?:an? |your )?(?:referral|interview|job|employment)|will get you (?:an? )?(?:referral|interview|job))\b/i;
const compensationPromotionPattern = /\b(earn money|cash bounty|referral commission|paid referral access|sell referrals?)\b/i;
const personalDataPattern = /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|https?:\/\/(?!…)|\+?\d[\d\s().-]{8,}\d)/i;

function recordError(errors, location, message) {
  errors.push(`${location}: ${message}`);
}

function validateItem(item, location, expectedPhase, errors, ids) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    recordError(errors, location, "must be an object");
    return;
  }
  for (const key of Object.keys(item)) {
    if (unsafeKeys.has(key)) recordError(errors, location, `must not contain future-profile field '${key}'`);
  }
  if (typeof item.id !== "string" || !item.id.trim()) recordError(errors, location, "requires a non-empty id");
  else if (ids.has(item.id)) recordError(errors, location, `duplicates id '${item.id}'`);
  else ids.add(item.id);
  if (!allowedStatuses.has(item.status)) recordError(errors, location, "has an invalid status");
  if (item.phase !== expectedPhase) recordError(errors, location, `must use phase '${expectedPhase}'`);
  const copy = [item.title, item.text, item.body].filter((value) => typeof value === "string").join(" ");
  if (!copy.trim()) recordError(errors, location, "requires user-facing copy");
  if (item.status === "active" && placeholderPattern.test(copy)) recordError(errors, location, "active content cannot contain placeholders");
  if (guaranteePattern.test(copy)) recordError(errors, location, "must not promise a referral or hiring outcome");
  if (compensationPromotionPattern.test(copy)) recordError(errors, location, "must not promote compensation for referrals");
}

export async function validateReferralContent() {
  const [guidanceRaw, templatesRaw, companiesRaw] = await Promise.all([
    readFile(guidancePath, "utf8"),
    readFile(templatesPath, "utf8"),
    readFile(companiesPath, "utf8"),
  ]);
  const guidance = JSON.parse(guidanceRaw);
  const templates = JSON.parse(templatesRaw);
  const errors = [];
  const ids = new Set();

  for (const collection of requiredCollections) {
    const items = guidance[collection];
    if (!Array.isArray(items) || items.length === 0) {
      recordError(errors, collection, "must be a non-empty array");
      continue;
    }
    const expectedPhase = collection === "futureWorkflow" ? "future" : "current";
    items.forEach((item, index) => validateItem(item, `${collection}[${index}]`, expectedPhase, errors, ids));
  }
  for (const key of Object.keys(guidance)) {
    if (!requiredCollections.includes(key)) recordError(errors, key, "is an unsupported guidance collection");
  }

  if (!Array.isArray(templates) || templates.length < 2) {
    recordError(errors, "templates", "must contain decline and more-information options");
  } else {
    templates.forEach((item, index) => {
      validateItem(item, `templates[${index}]`, "current", errors, ids);
      if (!item.title?.trim() || !item.body?.trim()) recordError(errors, `templates[${index}]`, "requires title and body");
      if (!new Set(["decline", "more-information"]).has(item.kind)) recordError(errors, `templates[${index}]`, "has an invalid kind");
      if (personalDataPattern.test(item.body ?? "")) recordError(errors, `templates[${index}]`, "must not contain hard-coded contact details or links");
    });
    if (!templates.some((item) => item.kind === "decline")) recordError(errors, "templates", "requires a decline template");
    if (!templates.some((item) => item.kind === "more-information")) recordError(errors, "templates", "requires a more-information template");
  }

  const companyNames = JSON.parse(companiesRaw).map((company) => company.name);
  const staticCopy = `${guidanceRaw}\n${templatesRaw}`.toLowerCase();
  for (const companyName of companyNames) {
    if (staticCopy.includes(companyName.toLowerCase())) recordError(errors, "content", `must not make company-specific claims about '${companyName}'`);
  }

  if (errors.length) throw new Error(`Referral content validation failed:\n- ${errors.join("\n- ")}`);
  return { guidanceItems: [...ids].length - templates.length, templates: templates.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validateReferralContent();
    console.log(`Referral content valid: ${result.guidanceItems} guidance items and ${result.templates} templates.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
