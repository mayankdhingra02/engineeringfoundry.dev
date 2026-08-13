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
const invalidDate = structuredClone(resources);
invalidDate[0].lastVerifiedAt = "2026-99-99";

const cases = [
  [validate({ resources: malformedUrl }), "malformed URL"],
  [validate({ resources: demoResource }), "active demo record"],
  [validate({ questions: companyTagged }), "must not contain company associations"],
  [validate({ resources: invalidDate }), "valid verification date"],
];
for (const [errors, expected] of cases) {
  if (!errors.some((error) => error.includes(expected))) throw new Error(`Expected validator failure was not produced: ${expected}`);
}

console.log("Interview content validator regression checks passed: 31+ prompt scale, malformed URL, active demo, company tag, and invalid verification date.");
