import { readFile } from "node:fs/promises";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const [systemRoadmap, systemConcepts, systemProblems, mlRoadmap, mlConcepts, mlProblems] = await Promise.all([
  load("data/system-design/roadmap.json"),
  load("data/system-design/concepts.json"),
  load("data/system-design/problems.json"),
  load("data/ml-design/roadmap.json"),
  load("data/ml-design/concepts.json"),
  load("data/ml-design/problems.json"),
]);

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const slugPattern = /^([a-z0-9]+-)*[a-z0-9]+$/;
const difficulties = new Set(["Foundation", "Intermediate", "Advanced"]);
const statuses = new Set(["active", "needs_review"]);
const systemDomains = new Set(["Web", "Messaging", "Storage", "Streaming", "Search", "Infrastructure", "Real-time", "Data Platform", "Reliability"]);
const systemPatterns = new Set(["Caching", "Sharding", "Replication", "Async Processing", "Fan-out", "Rate Limiting", "Pub/Sub", "Consistent Hashing", "CDN", "Event Sourcing", "Search Index", "Object Storage", "Leader Election", "Idempotency", "Backpressure"]);
const mlDomains = new Set(["Recommendation", "Ranking", "Risk", "Trust & Safety", "Search", "NLP", "Generative AI", "Advertising"]);

const unique = (items, field, label) => {
  const values = items.map((item) => item[field]);
  check(new Set(values).size === values.length, `${label} must have unique ${field} values`);
};
const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const nonEmptyList = (value) => Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);

function validateRoadmap(roadmap, label) {
  unique(roadmap, "id", `${label} roadmap`);
  unique(roadmap, "slug", `${label} roadmap`);
  unique(roadmap, "order", `${label} roadmap`);
  roadmap.forEach((stage) => {
    check(slugPattern.test(stage.slug), `${label} roadmap stage ${stage.id} has an invalid slug`);
    check(nonEmptyString(stage.title) && nonEmptyString(stage.summary), `${label} roadmap stage ${stage.id} has empty critical content`);
    check(nonEmptyList(stage.topics), `${label} roadmap stage ${stage.id} must include topics`);
  });
}

function validateConcepts(concepts, label) {
  unique(concepts, "id", `${label} concepts`);
  unique(concepts, "slug", `${label} concepts`);
  concepts.forEach((concept) => {
    check(slugPattern.test(concept.slug), `${label} concept ${concept.id} has an invalid slug`);
    for (const field of ["title", "summary", "solves", "useWhen", "tradeoff", "commonMistake"]) {
      check(nonEmptyString(concept[field]), `${label} concept ${concept.id} has empty ${field}`);
    }
  });
}

function validateSharedProblem(problem, label, roadmapSlugs, validDomains) {
  check(slugPattern.test(problem.slug), `${label} ${problem.id} has an invalid slug`);
  check(difficulties.has(problem.difficulty), `${label} ${problem.id} has invalid difficulty`);
  check(statuses.has(problem.status), `${label} ${problem.id} has invalid status`);
  check(problem.status !== "placeholder", `${label} ${problem.id} still has placeholder status`);
  check(roadmapSlugs.has(problem.roadmapStage), `${label} ${problem.id} references unknown roadmap stage ${problem.roadmapStage}`);
  check(nonEmptyString(problem.title) && nonEmptyString(problem.summary) && nonEmptyString(problem.prompt), `${label} ${problem.id} has empty critical content`);
  check(nonEmptyList(problem.domains), `${label} ${problem.id} must include at least one domain`);
  problem.domains?.forEach((domain) => check(validDomains.has(domain), `${label} ${problem.id} has invalid domain ${domain}`));
  check(problem.source?.name === "Engineering Foundry" && problem.source?.platform === "original", `${label} ${problem.id} must use original Engineering Foundry provenance`);
  check(!Object.hasOwn(problem, "companyAssociations") && !Object.hasOwn(problem, "companies"), `${label} ${problem.id} must not contain company associations`);
}

validateRoadmap(systemRoadmap, "System Design");
validateRoadmap(mlRoadmap, "ML Design");
validateConcepts(systemConcepts, "System Design");
validateConcepts(mlConcepts, "ML Design");
unique(systemProblems, "id", "System Design problems"); unique(systemProblems, "slug", "System Design problems");
unique(mlProblems, "id", "ML Design problems"); unique(mlProblems, "slug", "ML Design problems");

const systemRoadmapSlugs = new Set(systemRoadmap.map((stage) => stage.slug));
const mlRoadmapSlugs = new Set(mlRoadmap.map((stage) => stage.slug));
for (const problem of systemProblems) {
  validateSharedProblem(problem, "System Design problem", systemRoadmapSlugs, systemDomains);
  check(nonEmptyList(problem.patterns), `System Design problem ${problem.id} must include at least one pattern`);
  problem.patterns?.forEach((pattern) => check(systemPatterns.has(pattern), `System Design problem ${problem.id} has invalid pattern ${pattern}`));
  for (const field of ["clarifyingQuestions", "functionalRequirements", "nonFunctionalRequirements", "scaleAssumptions", "capacityDiscussion", "dataModelNotes", "apiNotes", "keyTradeoffs", "failureModes", "extensions", "interviewChecklist"]) {
    check(nonEmptyList(problem[field]), `System Design problem ${problem.id} must include ${field}`);
  }
  check(Array.isArray(problem.coreComponents) && problem.coreComponents.length > 0 && problem.coreComponents.every((component) => nonEmptyString(component.name) && nonEmptyString(component.purpose)), `System Design problem ${problem.id} must include valid coreComponents`);
}

for (const problem of mlProblems) {
  validateSharedProblem(problem, "ML Design problem", mlRoadmapSlugs, mlDomains);
  for (const field of ["productGoal", "predictionTarget", "successMetrics", "dataSources", "labeling", "features", "baseline", "modelDiscussion", "training", "evaluation", "serving", "monitoring", "feedbackLoop", "failureModes", "tradeoffs", "extensions", "interviewChecklist"]) {
    check(nonEmptyList(problem[field]), `ML Design problem ${problem.id} must include ${field}`);
  }
}

check(systemProblems.filter((problem) => problem.status === "active").length >= 8, "System Design must include at least 8 active problems");
check(mlProblems.filter((problem) => problem.status === "active").length >= 6, "ML Design must include at least 6 active problems");
check(systemConcepts.length >= 10, "System Design must include at least 10 concepts");
check(mlConcepts.length >= 8, "ML Design must include at least 8 concepts");

if (errors.length) {
  console.error(`Design content validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Design content validation passed: ${systemProblems.length} System Design problems, ${systemConcepts.length} System Design concepts, ${systemRoadmap.length} System Design stages; ${mlProblems.length} ML Design problems, ${mlConcepts.length} ML concepts, ${mlRoadmap.length} ML stages.`);
