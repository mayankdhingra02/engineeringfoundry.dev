import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateCanonicalHttpsUrl } from "./canonical-content-url.mjs";

const slugPattern = /^([a-z0-9]+-)*[a-z0-9]+$/;
const sourcePlatforms = new Set(["leetcode", "hackerrank", "codeforces", "geeksforgeeks", "official", "community", "original", "other"]);
const verificationStates = new Set(["verified", "community-reported", "unverified", "demo"]);
const contentStatuses = new Set(["active", "unavailable", "needs_review"]);
const sourceIdentityByPlatform = new Map([
  ["leetcode", { name: "LeetCode", hostnames: ["leetcode.com"] }],
  ["hackerrank", { name: "HackerRank", hostnames: ["www.hackerrank.com"] }],
  ["codeforces", { name: "Codeforces", hostnames: ["codeforces.com"] }],
  ["geeksforgeeks", { name: "GeeksForGeeks", hostnames: ["www.geeksforgeeks.org"] }],
]);
const reservedSourceIdentityByNormalizedName = new Map(
  [...sourceIdentityByPlatform].map(([platform, identity]) => [
    identity.name.toLowerCase(),
    { platform, name: identity.name },
  ]),
);

const isIsoDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

export function validateContent({ topics, patterns, roadmap, companies, questions, validationDate = new Date().toISOString().slice(0, 10) }) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const unique = (items, field, label) => {
    const values = items.map((item) => item[field]);
    check(new Set(values).size === values.length, `${label} must have unique ${field} values`);
  };
  const validationDateIsCanonical = isIsoDate(validationDate);
  check(validationDateIsCanonical, "validationDate must use exact YYYY-MM-DD format and identify a real UTC calendar date");
  const validateSource = (source, label, { requireHttps = false } = {}) => {
    check(Boolean(source && typeof source === "object"), `${label} must include a source`);
    if (!source || typeof source !== "object") return;

    check(typeof source.name === "string" && source.name.trim().length > 0, `${label} source name must be non-empty`);
    check(sourcePlatforms.has(source.platform), `${label} has invalid source platform`);
    check(verificationStates.has(source.verification), `${label} has invalid source verification`);
    const brandedIdentity = sourceIdentityByPlatform.get(source.platform);
    const reservedIdentity = typeof source.name === "string"
      ? reservedSourceIdentityByNormalizedName.get(source.name.trim().toLowerCase())
      : undefined;
    if (reservedIdentity) check(source.platform === reservedIdentity.platform, `${label} source name ${reservedIdentity.name} is reserved for platform ${reservedIdentity.platform}`);
    if (brandedIdentity) check(source.name === brandedIdentity.name, `${label} source platform ${source.platform} must use exact source name ${brandedIdentity.name}`);
    if (source.platform === "original") {
      check(source.url === null, `${label} original source URL must be null`);
      check(!requireHttps, `${label} requiring external provenance must not use the original source platform`);
    } else if (requireHttps) {
      const urlResult = validateCanonicalHttpsUrl(source.url, {
        allowedHostnames: brandedIdentity?.hostnames,
      });
      check(urlResult.ok, `${label} must include a canonical HTTPS source URL: ${urlResult.ok ? "" : urlResult.reason}`);
    }
    if (source.lastVerifiedAt !== null && source.lastVerifiedAt !== undefined) {
      check(
        validationDateIsCanonical && isIsoDate(source.lastVerifiedAt) && source.lastVerifiedAt <= validationDate,
        `${label} has invalid source lastVerifiedAt; it must use exact YYYY-MM-DD format, identify a real UTC calendar date, and not be later than validationDate ${validationDate}`,
      );
    }
  };

  unique(topics, "id", "Topics"); unique(topics, "slug", "Topics");
  unique(patterns, "id", "Patterns"); unique(patterns, "slug", "Patterns");
  unique(roadmap, "id", "Roadmap stages"); unique(roadmap, "slug", "Roadmap stages");
  unique(companies, "id", "Companies"); unique(companies, "slug", "Companies");
  unique(questions, "id", "Questions"); unique(questions, "slug", "Questions");

  for (const topic of topics) check(slugPattern.test(topic.slug), `Topic ${topic.id} has an invalid slug`);
  for (const pattern of patterns) check(slugPattern.test(pattern.slug), `Pattern ${pattern.id} has an invalid slug`);
  for (const stage of roadmap) check(slugPattern.test(stage.slug), `Roadmap stage ${stage.id} has an invalid slug`);
  for (const company of companies) check(slugPattern.test(company.slug), `Company ${company.id} has an invalid slug`);

  const topicSlugs = new Set(topics.map((topic) => topic.slug));
  const patternSlugs = new Set(patterns.map((pattern) => pattern.slug));
  const stageSlugs = new Set(roadmap.map((stage) => stage.slug));
  const companySlugs = new Set(companies.map((company) => company.slug));

  for (const stage of roadmap) {
    stage.topics.forEach((slug) => check(topicSlugs.has(slug), `Roadmap ${stage.slug} references unknown topic ${slug}`));
    stage.patterns.forEach((slug) => check(patternSlugs.has(slug), `Roadmap ${stage.slug} references unknown pattern ${slug}`));
  }

  for (const topic of topics) topic.relatedTopics.forEach((slug) => check(topicSlugs.has(slug), `Topic ${topic.slug} references unknown related topic ${slug}`));

  for (const company of companies) {
    check(Array.isArray(company.claims), `Company ${company.slug} claims must be an array`);
    if (!Array.isArray(company.claims)) continue;

    company.claims.forEach((claim, index) => {
      const label = `Company ${company.slug} claim ${index + 1}`;
      check(typeof claim?.claim === "string" && claim.claim.trim().length > 0, `${label} text must be non-empty`);
      check(verificationStates.has(claim?.verification), `${label} has invalid verification`);
      validateSource(claim?.source, label, { requireHttps: true });
      if (claim?.verification === "verified") {
        check(claim?.source?.verification === "verified", `${label} marked verified requires a verified source`);
      }
    });
  }

  for (const question of questions) {
    check(slugPattern.test(question.slug), `Question ${question.id} has an invalid slug`);
    check(stageSlugs.has(question.roadmapStage), `Question ${question.id} references unknown roadmap stage ${question.roadmapStage}`);
    question.topics.forEach((slug) => check(topicSlugs.has(slug), `Question ${question.id} references unknown topic ${slug}`));
    question.patterns.forEach((slug) => check(patternSlugs.has(slug), `Question ${question.id} references unknown pattern ${slug}`));
    check(contentStatuses.has(question.status), `Question ${question.id} has invalid status`);
    check(verificationStates.has(question.verification), `Question ${question.id} has invalid verification`);
    if (question.lastVerifiedAt !== null && question.lastVerifiedAt !== undefined) {
      check(
        validationDateIsCanonical && isIsoDate(question.lastVerifiedAt) && question.lastVerifiedAt <= validationDate,
        `Question ${question.id} has invalid lastVerifiedAt; it must use exact YYYY-MM-DD format, identify a real UTC calendar date, and not be later than validationDate ${validationDate}`,
      );
    }
    validateSource(question.source, `Question ${question.id}`, { requireHttps: !question.isOriginal });

    if (question.isOriginal) {
      check(question.source?.platform === "original", `Original question ${question.id} must use the original source platform`);
      check(question.externalUrl === null, `Original question ${question.id} must not require an external URL`);
      check(Boolean(question.originalPrompt), `Original question ${question.id} must include its original prompt`);
      check(question.verification === "verified", `Original question ${question.id} must be verified`);
    } else {
      const externalUrlResult = validateCanonicalHttpsUrl(question.externalUrl, {
        allowedHostnames: sourceIdentityByPlatform.get(question.source?.platform)?.hostnames,
      });
      check(externalUrlResult.ok, `External question ${question.id} must have a canonical HTTPS URL: ${externalUrlResult.ok ? "" : externalUrlResult.reason}`);
      check(question.source?.platform !== "original", `External question ${question.id} must not use original source provenance`);
      check(!question.originalPrompt, `External question ${question.id} must not reproduce a problem statement`);
      check(question.source?.url === question.externalUrl, `Question ${question.id} source URL must match its external URL`);
    }

    for (const association of question.companyAssociations) {
      const label = `Company association on ${question.id}`;
      check(companySlugs.has(association.companySlug), `Question ${question.id} references unknown company ${association.companySlug}`);
      check(verificationStates.has(association.verification), `${label} has invalid verification`);
      validateSource(association.source, label, { requireHttps: true });
      if (association.verification === "verified") check(association.source?.verification === "verified", `Verified association on ${question.id} requires a verified source`);
    }
  }

  check(questions.length >= 30, `Seed dataset must contain at least 30 questions; found ${questions.length}`);
  check(questions.filter((question) => question.isOriginal).length >= 3, "Seed dataset must contain at least three original questions");

  return errors;
}

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));

async function main() {
  const [topics, patterns, roadmap, companies, ...questionGroups] = await Promise.all([
    load("data/dsa/topics.json"),
    load("data/dsa/patterns.json"),
    load("data/dsa/roadmap.json"),
    load("data/companies/companies.json"),
    load("data/dsa/questions-foundations.json"),
    load("data/dsa/questions-core-patterns.json"),
    load("data/dsa/questions-structures.json"),
    load("data/dsa/questions-advanced.json"),
  ]);
  const questions = questionGroups.flat();
  const errors = validateContent({ topics, patterns, roadmap, companies, questions });

  if (errors.length) {
    console.error(`Content validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Content validation passed: ${questions.length} questions, ${topics.length} topics, ${patterns.length} patterns, ${roadmap.length} stages, ${companies.length} companies.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
