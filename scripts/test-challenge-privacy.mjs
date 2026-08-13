import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(projectRoot, "features/challenges/challenge-workspace.tsx"), "utf8");
const errors = [];

for (const forbidden of ["localStorage", "sessionStorage", "indexedDB", "supabase"]) if (source.toLowerCase().includes(forbidden.toLowerCase())) errors.push(`Challenge workspace must not reference ${forbidden}.`);

const allowedEvents = new Set(["challenge_opened", "challenge_guidance_opened", "challenge_rubric_used", "challenge_solution_summary_copied", "challenge_community_clicked"]);
const allowedProperties = new Set(["challenge_id", "category", "level", "section", "placement"]);
const calls = [...source.matchAll(/track\(\s*"([^"]+)"\s*,\s*\{([^}]*)\}\s*\)/g)];
if (calls.length < 5) errors.push("Expected all Challenge Lab analytics calls to be statically inspectable.");
for (const [, event, properties] of calls) {
  if (!allowedEvents.has(event)) errors.push(`Unexpected challenge analytics event '${event}'.`);
  const keys = [...properties.matchAll(/(?:^|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((match) => match[1]);
  for (const key of keys) if (!allowedProperties.has(key)) errors.push(`Challenge analytics property '${key}' is not allowed.`);
  if (/worksheet|approach|decision|tradeoff|failure|validation|reflection|solutionUrl|copyState|assessment/.test(properties)) errors.push(`Challenge analytics event '${event}' appears to include private worksheet or assessment data.`);
}
if (/URLSearchParams|history\.(?:pushState|replaceState)|location\.search/.test(source)) errors.push("Challenge worksheet data must not be written to the URL.");

if (errors.length) {
  console.error(`Challenge privacy regression failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else console.log(`Challenge privacy regression passed: ${calls.length} analytics calls use registered content properties and no worksheet persistence was found.`);
