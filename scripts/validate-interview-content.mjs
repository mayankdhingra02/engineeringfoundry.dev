import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateCanonicalHttpsUrl } from "./canonical-content-url.mjs";

const slugPattern = /^([a-z0-9]+-)*[a-z0-9]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const behavioralScopes = new Set(["Individual", "Team", "Cross-functional", "Leadership"]);
const tipCategories = new Set(["Preparation", "Before the Interview", "Coding", "System Design", "ML Design", "Behavioral", "Communication", "Recovering When Stuck", "Closing", "After the Interview"]);
const resourceCategories = new Set(["DSA", "System Design", "ML / AI", "Behavioral", "Interview Strategy", "Engineering", "Career"]);
const resourceTypes = new Set(["Practice Platform", "Guide", "Course", "Book", "Documentation", "Repository", "Visualization", "Roadmap"]);
const resourceAccess = new Set(["Free", "Paid", "Freemium"]);
const resourceVerification = new Set(["verified", "unverified", "needs_review"]);
const internalPaths = new Set(["/dsa", "/system-design/start-here/introduction", "/ml-design", "/behavioral", "/interview-tips"]);
const trackingParams = /^(utm_.+|ref|referrer|affiliate|aff|source)$/i;
const resourceUrlPolicyByProvider = new Map([
  ["AWS", { hostnames: ["aws.amazon.com"] }],
  ["Full Stack Deep Learning", { hostnames: ["fullstackdeeplearning.com"] }],
  ["GitHub", { hostnames: ["skills.github.com"] }],
  ["Google Developers", { hostnames: ["developers.google.com"] }],
  ["Google SRE", { hostnames: ["sre.google"] }],
  ["Harvard FAS Mignone Center for Career Success", { hostnames: ["careerservices.fas.harvard.edu"] }],
  ["Hugging Face", { hostnames: ["huggingface.co"] }],
  ["LeetCode", { hostnames: ["leetcode.com"] }],
  ["MDN Web Docs", { hostnames: ["developer.mozilla.org"] }],
  ["Made With ML by Anyscale", { hostnames: ["madewithml.com"] }],
  ["System Design Primer", {
    hostnames: ["github.com"],
    exactUrl: "https://github.com/donnemartin/system-design-primer",
  }],
  ["Tech Interview Handbook", { hostnames: ["www.techinterviewhandbook.org"] }],
  ["UC Berkeley Career Engagement", { hostnames: ["www.career.berkeley.edu"] }],
  ["VisuAlgo", { hostnames: ["visualgo.net"] }],
  ["roadmap.sh", { hostnames: ["roadmap.sh"] }],
]);

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const nonEmptyList = (value) => Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);
const isCanonicalDate = (value) => {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const normalized = `${value}T00:00:00.000Z`;
  const parsed = new Date(normalized);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === normalized;
};

export function validateInterviewContent({ categories, frameworks, questions, tips, checklists, resources, validationDate = new Date().toISOString().slice(0, 10) }) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const unique = (items, field, label) => {
    const values = items.map((item) => item[field]);
    check(new Set(values).size === values.length, `${label} must have unique ${field} values`);
  };
  const validationDateIsCanonical = isCanonicalDate(validationDate);
  check(validationDateIsCanonical, "validationDate must use exact YYYY-MM-DD format and identify a real UTC calendar date");

  unique(categories, "id", "Behavioral categories");
  unique(categories, "name", "Behavioral categories");
  const categoryNames = new Set(categories.map((item) => item.name));
  categories.forEach((item) => check(nonEmptyString(item.summary), `Behavioral category ${item.id} must include a summary`));

  const storyTypes = new Set(frameworks.storyTypes?.map((item) => item.id));
  check(storyTypes.size >= 8, "Behavioral story taxonomy must include at least 8 story types");
  check(Array.isArray(frameworks.answerFramework) && frameworks.answerFramework.length >= 5, "Behavioral answer framework must include STAR plus reflection");
  check(Array.isArray(frameworks.storyInventory) && frameworks.storyInventory.length >= 8, "Behavioral story inventory must include at least 8 experiences");
  frameworks.storyInventory?.forEach((item) => check(storyTypes.has(item.storyType), `Story inventory ${item.id} references invalid story type ${item.storyType}`));

  unique(questions, "id", "Behavioral questions");
  unique(questions, "slug", "Behavioral questions");
  questions.forEach((question) => {
    check(slugPattern.test(question.slug), `Behavioral question ${question.id} has an invalid slug`);
    check(categoryNames.has(question.category), `Behavioral question ${question.id} has invalid category ${question.category}`);
    check(nonEmptyString(question.prompt), `Behavioral question ${question.id} must include a prompt`);
    check(nonEmptyList(question.signals), `Behavioral question ${question.id} must include signals`);
    check(nonEmptyList(question.storyTypes), `Behavioral question ${question.id} must include story types`);
    question.storyTypes?.forEach((item) => check(storyTypes.has(item), `Behavioral question ${question.id} has invalid story type ${item}`));
    check(nonEmptyList(question.scope), `Behavioral question ${question.id} must include scope`);
    question.scope?.forEach((item) => check(behavioralScopes.has(item), `Behavioral question ${question.id} has invalid scope ${item}`));
    check(nonEmptyList(question.followUps), `Behavioral question ${question.id} must include follow-ups`);
    check(nonEmptyList(question.answerGuidance), `Behavioral question ${question.id} must include answer guidance`);
    check(nonEmptyList(question.commonMistakes), `Behavioral question ${question.id} must include common mistakes`);
    check(question.source?.name === "Engineering Foundry" && question.source?.platform === "original", `Behavioral question ${question.id} must use original Engineering Foundry provenance`);
    check(!Object.hasOwn(question, "companyAssociations") && !Object.hasOwn(question, "companies") && !Object.hasOwn(question, "company"), `Behavioral question ${question.id} must not contain company associations`);
    check(question.status === "active" || question.status === "needs_review", `Behavioral question ${question.id} has invalid status`);
  });
  check(questions.filter((item) => item.status === "active").length >= 30, "Behavioral content must include at least 30 active prompts");

  unique(tips, "id", "Interview tips");
  tips.forEach((tip) => {
    check(tipCategories.has(tip.category), `Interview tip ${tip.id} has invalid category ${tip.category}`);
    check(nonEmptyString(tip.title) && nonEmptyString(tip.whyItMatters), `Interview tip ${tip.id} has empty critical content`);
    check(nonEmptyList(tip.guidance), `Interview tip ${tip.id} must include guidance`);
    check(nonEmptyList(tip.avoid), `Interview tip ${tip.id} must include avoid guidance`);
    check(tip.status === "active" || tip.status === "needs_review", `Interview tip ${tip.id} has invalid or demo status`);
    check(tip.status !== "demo", `Interview tip ${tip.id} must not use demo status`);
  });

  unique(checklists, "id", "Interview checklists");
  checklists.forEach((checklist) => {
    check(nonEmptyString(checklist.title) && nonEmptyString(checklist.description), `Interview checklist ${checklist.id} has empty critical content`);
    check(Array.isArray(checklist.items) && checklist.items.length > 0 && checklist.items.every((item) => nonEmptyString(item.id) && nonEmptyString(item.label)), `Interview checklist ${checklist.id} must include valid items`);
    check(checklist.status === "active" || checklist.status === "needs_review", `Interview checklist ${checklist.id} has invalid status`);
  });

  unique(resources, "id", "Resources");
  resources.forEach((resource) => {
    check(nonEmptyString(resource.title) && nonEmptyString(resource.description) && nonEmptyString(resource.provider), `Resource ${resource.id} has empty critical content`);
    check(resourceCategories.has(resource.category), `Resource ${resource.id} has invalid category ${resource.category}`);
    check(resourceTypes.has(resource.type), `Resource ${resource.id} has invalid type ${resource.type}`);
    check(resourceAccess.has(resource.access), `Resource ${resource.id} has invalid access ${resource.access}`);
    check(resourceVerification.has(resource.verification), `Resource ${resource.id} has invalid verification ${resource.verification}`);
    check(resource.status === "active" || resource.status === "needs_review", `Resource ${resource.id} has invalid status`);
    check(!(resource.status === "active" && (resource.demo === true || /demo/i.test(resource.status))), `Resource ${resource.id} is an active demo record`);
    if (resource.isInternal) {
      check(internalPaths.has(resource.url), `Internal resource ${resource.id} references invalid site path ${resource.url}`);
    } else {
      const urlPolicy = resourceUrlPolicyByProvider.get(resource.provider);
      check(Boolean(urlPolicy), `External resource ${resource.id} provider must have a registered exact hostname policy`);
      const urlResult = validateCanonicalHttpsUrl(resource.url, { allowedHostnames: urlPolicy?.hostnames });
      check(urlResult.ok, `External resource ${resource.id} URL ${urlResult.ok ? "is valid" : urlResult.reason}`);
      if (urlResult.ok && urlPolicy?.exactUrl) check(resource.url === urlPolicy.exactUrl, `External resource ${resource.id} URL must equal the provider's exact canonical URL ${urlPolicy.exactUrl}`);
      if (urlResult.ok) check(![...urlResult.url.searchParams.keys()].some((key) => trackingParams.test(key)), `External resource ${resource.id} must not include affiliate or tracking parameters`);
    }
    if (resource.verification === "verified") {
      check(
        validationDateIsCanonical && isCanonicalDate(resource.lastVerifiedAt) && resource.lastVerifiedAt <= validationDate,
        `Verified resource ${resource.id} lastVerifiedAt must use exact YYYY-MM-DD format, identify a real UTC calendar date, and not be later than validationDate ${validationDate}`,
      );
    } else {
      check(resource.lastVerifiedAt === null, `Unverified resource ${resource.id} must not include a verification date`);
    }
  });

  return errors;
}

async function load(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
}

async function main() {
  const [categories, frameworks, questions, tips, checklists, resources] = await Promise.all([
    load("data/behavioral/categories.json"), load("data/behavioral/frameworks.json"), load("data/behavioral/questions.json"),
    load("data/interview-tips/tips.json"), load("data/interview-tips/checklists.json"), load("data/resources/resources.json"),
  ]);
  const errors = validateInterviewContent({ categories, frameworks, questions, tips, checklists, resources });
  if (errors.length) {
    console.error(`Interview content validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(`Interview content validation passed: ${questions.length} behavioral prompts, ${categories.length} categories, ${tips.length} playbook tips, ${checklists.length} checklists, and ${resources.length} resources.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
