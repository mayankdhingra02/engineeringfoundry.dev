import { readFile } from "node:fs/promises";
import { validateContent } from "./validate-content.mjs";

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
const validate = (overrides = {}) => validateContent({ topics, patterns, roadmap, companies, questions, ...overrides });

const expandedQuestions = [...questions];
while (expandedQuestions.length < 51) {
  const index = expandedQuestions.length + 1;
  expandedQuestions.push({ ...questions[0], id: `validator-scale-${index}`, slug: `validator-scale-${index}` });
}
const scaleErrors = validate({ questions: expandedQuestions });
if (scaleErrors.length) throw new Error(`A valid 51-question dataset failed validation:\n${scaleErrors.join("\n")}`);

const malformedCompanies = structuredClone(companies);
malformedCompanies[0].claims = [{
  claim: " ",
  verification: "verified",
  source: {
    name: " ",
    platform: "unsupported",
    url: "http://example.com/claim",
    verification: "unsupported",
    lastVerifiedAt: "2026-99-99",
  },
}];
const claimErrors = validate({ companies: malformedCompanies });
const expectedClaimFailures = [
  "text must be non-empty",
  "source name must be non-empty",
  "invalid source platform",
  "invalid source verification",
  "HTTPS source URL",
  "invalid source lastVerifiedAt",
  "marked verified requires a verified source",
];
for (const expected of expectedClaimFailures) {
  if (!claimErrors.some((error) => error.includes(expected))) throw new Error(`Malformed claim did not produce the expected failure: ${expected}`);
}

console.log("Content validator regression checks passed: 51-question scale and malformed company claims.");
