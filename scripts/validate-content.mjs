import { readFile } from "node:fs/promises";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
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
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const unique = (items, field, label) => {
  const values = items.map((item) => item[field]);
  check(new Set(values).size === values.length, `${label} must have unique ${field} values`);
};
const isHttpsUrl = (value) => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

unique(topics, "id", "Topics"); unique(topics, "slug", "Topics");
unique(patterns, "id", "Patterns"); unique(patterns, "slug", "Patterns");
unique(roadmap, "id", "Roadmap stages"); unique(roadmap, "slug", "Roadmap stages");
unique(companies, "id", "Companies"); unique(companies, "slug", "Companies");
unique(questions, "id", "Questions"); unique(questions, "slug", "Questions");

const topicSlugs = new Set(topics.map((topic) => topic.slug));
const patternSlugs = new Set(patterns.map((pattern) => pattern.slug));
const stageSlugs = new Set(roadmap.map((stage) => stage.slug));
const companySlugs = new Set(companies.map((company) => company.slug));

for (const stage of roadmap) {
  stage.topics.forEach((slug) => check(topicSlugs.has(slug), `Roadmap ${stage.slug} references unknown topic ${slug}`));
  stage.patterns.forEach((slug) => check(patternSlugs.has(slug), `Roadmap ${stage.slug} references unknown pattern ${slug}`));
}

for (const topic of topics) topic.relatedTopics.forEach((slug) => check(topicSlugs.has(slug), `Topic ${topic.slug} references unknown related topic ${slug}`));

for (const question of questions) {
  check(/^([a-z0-9]+-)*[a-z0-9]+$/.test(question.slug), `Question ${question.id} has an invalid slug`);
  check(stageSlugs.has(question.roadmapStage), `Question ${question.id} references unknown roadmap stage ${question.roadmapStage}`);
  question.topics.forEach((slug) => check(topicSlugs.has(slug), `Question ${question.id} references unknown topic ${slug}`));
  question.patterns.forEach((slug) => check(patternSlugs.has(slug), `Question ${question.id} references unknown pattern ${slug}`));
  check(["active", "unavailable", "needs_review"].includes(question.status), `Question ${question.id} has invalid status`);
  check(["verified", "community-reported", "unverified", "demo"].includes(question.verification), `Question ${question.id} has invalid verification`);
  if (question.lastVerifiedAt) check(/^\d{4}-\d{2}-\d{2}$/.test(question.lastVerifiedAt), `Question ${question.id} has invalid lastVerifiedAt`);

  if (question.isOriginal) {
    check(question.source.platform === "original", `Original question ${question.id} must use the original source platform`);
    check(question.externalUrl === null, `Original question ${question.id} must not require an external URL`);
    check(Boolean(question.originalPrompt), `Original question ${question.id} must include its original prompt`);
    check(question.verification === "verified", `Original question ${question.id} must be verified`);
  } else {
    check(isHttpsUrl(question.externalUrl), `External question ${question.id} must have a valid HTTPS URL`);
    check(!question.originalPrompt, `External question ${question.id} must not reproduce a problem statement`);
    check(question.source.url === question.externalUrl, `Question ${question.id} source URL must match its external URL`);
  }

  for (const association of question.companyAssociations) {
    check(companySlugs.has(association.companySlug), `Question ${question.id} references unknown company ${association.companySlug}`);
    check(isHttpsUrl(association.source.url), `Company association on ${question.id} must include an HTTPS source`);
    if (association.verification === "verified") check(association.source.verification === "verified", `Verified association on ${question.id} requires a verified source`);
  }
}

check(questions.length >= 30 && questions.length <= 50, `Seed dataset must contain 30–50 questions; found ${questions.length}`);
check(questions.filter((question) => question.isOriginal).length >= 3, "Seed dataset must contain at least three original questions");

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Content validation passed: ${questions.length} questions, ${topics.length} topics, ${patterns.length} patterns, ${roadmap.length} stages, ${companies.length} companies.`);
