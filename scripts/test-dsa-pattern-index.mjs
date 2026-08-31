import { readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const route = read("app/dsa/[...segments]/page.tsx");
const browser = read("features/dsa/questions/question-browser.tsx");
const patterns = JSON.parse(read("data/dsa/patterns.json"));
const questions = [
  ...JSON.parse(read("data/dsa/questions-foundations.json")),
  ...JSON.parse(read("data/dsa/questions-core-patterns.json")),
  ...JSON.parse(read("data/dsa/questions-structures.json")),
  ...JSON.parse(read("data/dsa/questions-advanced.json")),
].filter((question) => question.status === "active");
const patternNameBySlug = new Map(patterns.map((pattern) => [pattern.slug, pattern.name]));

if (!Array.isArray(patterns) || patterns.length === 0) failures.push("Curated DSA pattern data is empty.");
for (const pattern of patterns) {
  if (!pattern.id || !pattern.slug || !pattern.name || !pattern.summary || !pattern.recognitionSignals?.length || !pattern.commonMistakes?.length) {
    failures.push(`Curated pattern ${pattern.slug ?? pattern.id ?? "(unknown)"} is missing index content.`);
  }
}

requireText(route, 'import { activeQuestions, dsaPatterns, dsaTopics, questionsForTopic, roadmapStages, topicBySlug } from "@/data/dsa";', "Pattern index does not import the curated pattern and active-question collections.");
requireText(route, 'className="pattern-grid"', "Pattern index does not use the responsive pattern-card grid.");
requireText(route, 'dsaPatterns.map((pattern) =>', "Pattern index is not derived from curated pattern data.");
for (const field of ["pattern.id", "pattern.name", "pattern.summary", "pattern.recognitionSignals.map", "pattern.commonMistakes.map"]) {
  requireText(route, field, `Pattern index does not render ${field} from curated data.`);
}
requireText(route, 'activeQuestions.filter((question) => question.patterns.includes(pattern.slug)).length', "Pattern index does not derive practice availability from active questions.");
requireText(route, 'href={`/dsa/questions?q=${encodeURIComponent(pattern.name)}`}', "Pattern practice link does not safely encode the browser-visible pattern name.");
requireText(route, "No matching questions cataloged yet.", "Pattern index must be honest when no active question matches a pattern.");
prohibit(route, /Detailed guide coming soon|dsaPatternIndex/, "Pattern index still contains the hard-coded coming-soon listing.");
requireText(browser, 'search: params.get("q") ?? ""', "Question browser does not read the linked q filter.");
requireText(browser, "...question.patterns", "Question browser search does not include browser-visible pattern names.");

for (const pattern of patterns) {
  const matching = questions.filter((question) => question.patterns.includes(pattern.slug));
  if (matching.length === 0) continue;
  const matchesBrowserSearch = matching.every((question) => [question.id, question.slug, question.title, ...question.patterns.map((slug) => patternNameBySlug.get(slug) ?? slug)]
    .join(" ").toLowerCase().includes(pattern.name.toLowerCase()));
  if (!matchesBrowserSearch) failures.push(`${pattern.name} does not produce a recoverable browser query for each linked question.`);
}

if (failures.length) {
  console.error(`DSA pattern-index regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`DSA pattern-index regression passed: ${patterns.length} curated patterns render summaries, recognition signals, mistakes, and safely encoded question-filter links.`);
