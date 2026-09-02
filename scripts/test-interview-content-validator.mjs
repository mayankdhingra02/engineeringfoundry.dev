import { readFile } from "node:fs/promises";
import { validateInterviewContent } from "./validate-interview-content.mjs";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const [categories, frameworks, questions, tips, checklists, resources] = await Promise.all([
  load("data/behavioral/categories.json"), load("data/behavioral/frameworks.json"), load("data/behavioral/questions.json"),
  load("data/interview-tips/tips.json"), load("data/interview-tips/checklists.json"), load("data/resources/resources.json"),
]);
const validate = (overrides = {}) => validateInterviewContent({ categories, frameworks, questions, tips, checklists, resources, ...overrides });

if (questions.length < 31 || validate().length) throw new Error("The valid 31+ behavioral-question dataset failed validation");

const malformedUrl = structuredClone(resources);
malformedUrl.find((item) => !item.isInternal).url = "not-a-resource-url";
const demoResource = structuredClone(resources);
demoResource[0].demo = true;
const companyTagged = structuredClone(questions);
companyTagged[0].companies = ["Example Company"];
const resourcesWithVerifiedDate = (lastVerifiedAt) => {
  const datedResources = structuredClone(resources);
  const verifiedResource = datedResources.find((resource) => resource.verification === "verified");
  if (!verifiedResource) throw new Error("The date regression requires at least one verified resource fixture");
  verifiedResource.lastVerifiedAt = lastVerifiedAt;
  return datedResources;
};

for (const lastVerifiedAt of ["2000-02-29", "2026-12-31"]) {
  const errors = validate({ resources: resourcesWithVerifiedDate(lastVerifiedAt) });
  if (errors.length) throw new Error(`A valid calendar boundary failed validation (${lastVerifiedAt}):\n${errors.join("\n")}`);
}

const cases = [
  [validate({ resources: malformedUrl }), "malformed URL"],
  [validate({ resources: demoResource }), "active demo record"],
  [validate({ questions: companyTagged }), "must not contain company associations"],
];
for (const lastVerifiedAt of ["2026-02-29", "2026-02-30", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00"]) {
  cases.push([validate({ resources: resourcesWithVerifiedDate(lastVerifiedAt) }), "valid verification date"]);
}
for (const [errors, expected] of cases) {
  if (!errors.some((error) => error.includes(expected))) throw new Error(`Expected validator failure was not produced: ${expected}`);
}

console.log("Interview content validator regression checks passed: 31+ prompt scale, malformed URL, active demo, company tag, and canonical verification dates.");
