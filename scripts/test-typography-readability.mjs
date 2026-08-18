import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");
const failures = [];

function requireMatch(pattern, message) {
  if (!pattern.test(css)) failures.push(message);
}

requireMatch(/--type-body:\s*1rem/, "The 16px body type token is missing.");
requireMatch(/--type-reading:\s*1\.0625rem/, "The 17px reading type token is missing.");
requireMatch(/--type-small:\s*\.875rem/, "The 14px supporting-text token is missing.");
requireMatch(/--type-meta:\s*\.8125rem/, "The 13px metadata token is missing.");
requireMatch(/--type-label:\s*\.75rem/, "The 12px label token is missing.");
requireMatch(/--reading-width:\s*72ch/, "The long-form reading-width guardrail is missing.");
requireMatch(/body\s*\{[^}]*font-size:\s*var\(--type-body\)[^}]*line-height:\s*var\(--leading-body\)/s, "Body copy must use the semantic size and line-height tokens.");
requireMatch(/\.sd-article\s*\{[^}]*max-width:\s*var\(--reading-width\)[^}]*font-size:\s*var\(--type-reading\)/s, "Documentation articles must use the reading scale and comfortable measure.");
requireMatch(/\.sd-curriculum-lesson\s*\{[^}]*font-size:\s*var\(--type-meta\)/s, "Curriculum links must remain readable.");
requireMatch(/\.sd-article-toc a\s*\{[^}]*font-size:\s*var\(--type-meta\)/s, "On-this-page links must remain readable.");
requireMatch(/\.dsa-browser-table\s*\{[^}]*font-size:\s*var\(--type-meta\)/s, "The DSA question table must use readable table text.");
requireMatch(/\.company-comparison-table,\s*\.company-question-table\s*\{[^}]*font-size:\s*var\(--type-small\)/s, "Company-guide tables must use the supporting-text scale.");
requireMatch(/@media \(max-width:\s*700px\)\s*\{[\s\S]*?--type-reading:\s*1rem/, "Mobile reading text must remain at least 16px.");

if (failures.length) {
  console.error(`Typography readability regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Typography readability regression passed: semantic type tokens, long-form measure, navigation, tables, and mobile reading sizes are protected.");
