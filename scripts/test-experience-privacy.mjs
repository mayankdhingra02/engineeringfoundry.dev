import fs from "node:fs";

const source = fs.readFileSync("features/interview-experiences/experience-builder.tsx", "utf8");
const failures = [];
for (const api of ["localStorage", "sessionStorage", "indexedDB", "supabase"]) if (source.toLowerCase().includes(api.toLowerCase())) failures.push(`Builder references prohibited persistence API: ${api}.`);
for (const api of ["URLSearchParams", "history.pushState", "history.replaceState", "router.push", "router.replace"]) if (source.includes(api)) failures.push(`Builder may write draft state into a URL: ${api}.`);

const calls = [...source.matchAll(/track\(("experience_[a-z_]+"[\s\S]*?)\)/g)].map((match) => match[1]);
const privateFields = ["company:", "role:", "level:", "region:", "periodMonth", "periodYear", "result:", "topics:", "notes:", "overallSummary", "preparationLessons", "whatWentWell", "whatWouldChange", "generatedSummary", "checks:"];
for (const call of calls) for (const field of privateFields) if (call.includes(field)) failures.push(`Analytics call contains private draft field: ${field}`);
if (calls.length !== 8) failures.push(`Expected 8 builder analytics calls; found ${calls.length}.`);
if (/<(?:label|span|legend)[^>]*>\s*Exact interview question/i.test(source)) failures.push("Builder contains an exact-interview-question field label.");
if (!source.includes("Draft is session-only and is not sent to Engineering Foundry.")) failures.push("Builder is missing its session-only privacy statement.");
if (!source.includes("navigator.clipboard.writeText(generatedSummary)")) failures.push("Copy action must use the Clipboard API locally.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Experience privacy regression passed: ${calls.length} safe analytics calls, no persistence APIs, and no draft-to-URL path.`);
