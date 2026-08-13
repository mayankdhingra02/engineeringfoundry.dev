import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data", "interview-experiences");
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
const roundTypes = readJson("round-types.json");
const topics = readJson("topics.json");
const guidance = readJson("guidance.json");
const failures = [];
const fail = (message) => failures.push(message);
const ensureUnique = (records, label) => {
  const ids = records.map((record) => record.id);
  if (ids.some((id) => typeof id !== "string" || !/^[a-z0-9-]+$/.test(id))) fail(`${label} IDs must be non-empty kebab-case strings.`);
  if (new Set(ids).size !== ids.length) fail(`${label} IDs must be unique.`);
};

ensureUnique(roundTypes, "Round type");
ensureUnique(topics, "Topic");
if (roundTypes.length !== 11) fail(`Expected the 11 neutral round types; found ${roundTypes.length}.`);
for (const roundType of roundTypes) if (!roundType.label?.trim() || !roundType.description?.trim()) fail(`Round type ${roundType.id} needs a label and description.`);

const allowedCategories = new Set(["Coding", "System Design", "ML", "Behavioral"]);
for (const topic of topics) {
  if (!topic.label?.trim()) fail(`Topic ${topic.id} needs a label.`);
  if (!allowedCategories.has(topic.category)) fail(`Topic ${topic.id} has invalid category ${topic.category}.`);
}
for (const category of allowedCategories) if (!topics.some((topic) => topic.category === category)) fail(`Topic taxonomy needs ${category}.`);

if (guidance.currentPublicExperienceCount !== 0) fail("Current public experience count must be explicitly zero.");
for (const key of ["draftFields", "writingGuidance", "privacyGuidance", "safetyChecklist", "futureModerationStates", "futureIdentityChoices"]) if (!Array.isArray(guidance[key]) || !guidance[key].length) fail(`${key} must be a non-empty array.`);
const expectedStates = ["Draft", "Submitted", "Needs changes", "Approved", "Rejected", "Archived"];
if (JSON.stringify(guidance.futureModerationStates) !== JSON.stringify(expectedStates)) fail("Future moderation states are incomplete or out of order.");
if (!guidance.privacyGuidance.some((item) => item.includes("permitted and comfortable"))) fail("Privacy guidance must include the public-sharing permission reminder.");
if (!guidance.privacyGuidance.some((item) => item.includes("not legal advice"))) fail("Privacy guidance must avoid a legal-advice claim.");

const serialized = JSON.stringify({ roundTypes, topics, guidance }).toLowerCase();
for (const prohibited of ["demo entry", "sample company", "fake user", "candidate name", "glassdoor.com", "teamblind.com", "scrape_source", "scraped_source"]) if (serialized.includes(prohibited)) fail(`Static experience architecture contains prohibited content: ${prohibited}.`);
if (guidance.draftFields.some((field) => /exact.*(question|prompt)|question.*wording/i.test(field))) fail("Draft schema must not contain an exact-question field.");
if (Object.hasOwn(guidance, "experiences") || Object.hasOwn(guidance, "users") || Object.hasOwn(guidance, "submissions")) fail("Guidance data must not contain fake experience, user, or submission records.");

const companyRegistry = JSON.parse(fs.readFileSync(path.join(root, "data", "companies", "companies.json"), "utf8"));
const companyNames = new Set(companyRegistry.map((company) => company.name.toLowerCase()));
for (const record of [...roundTypes, ...topics]) if (companyNames.has(record.label?.toLowerCase())) fail(`Experience taxonomy must not encode a company claim: ${record.label}.`);
const indexSource = fs.readFileSync(path.join(dataDir, "index.ts"), "utf8");
if (!/currentPublicExperiences\s*=\s*\[\]\s*as const/.test(indexSource)) fail("Static public experience registry must be explicitly empty.");

const allowedFiles = new Set(["guidance.json", "index.ts", "round-types.json", "topics.json"]);
for (const name of fs.readdirSync(dataDir)) if (!allowedFiles.has(name)) fail(`Unexpected static experience file could contain fabricated records: ${name}.`);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Experience content valid: ${roundTypes.length} round types, ${topics.length} high-level topics, ${guidance.futureModerationStates.length} future states, and 0 public experiences.`);
