import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(projectRoot, "app/leaderboard/page.tsx"), "utf8");
const errors = [];

for (const pattern of [/Demo User/i, /\bconst\s+(?:rows|rankings|leaders|scores)\s*=/i, /\{\s*rank\s*:/i, /\{\s*score\s*:/i, /className="data-table"/, /<table\b/i]) {
  if (pattern.test(source)) errors.push(`Recognition Preview matched forbidden fabricated-leaderboard pattern ${pattern}.`);
}
if (!source.includes("No public leaderboard is active yet.")) errors.push("Recognition Preview must expose an explicit empty state.");
if (!source.includes("actual product activity") || !source.includes("Opt-in visibility") || !source.includes("Transparent rules")) errors.push("Recognition Preview must explain evidence, consent, and transparent rules.");

if (errors.length) {
  console.error(`Recognition integrity regression failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else console.log("Recognition integrity regression passed: no fabricated rows, ranks, scores, or demo identities were found.");
