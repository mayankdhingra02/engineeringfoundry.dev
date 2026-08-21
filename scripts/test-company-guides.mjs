import assert from "node:assert/strict";
import fs from "node:fs";

const data = fs.readFileSync("data/company-guides/v1.ts", "utf8");
const route = fs.readFileSync("app/companies/[slug]/page.tsx", "utf8");
const ui = fs.readFileSync("features/company-guides/company-guide-v1.tsx", "utf8");
const registry = fs.readFileSync("data/companies/companies.json", "utf8");
const priority = ["amazon", "google", "meta", "walmart", "microsoft", "nvidia", "openai", "anthropic", "atlassian", "uber"];
for (const slug of priority) {
  assert.match(data, new RegExp(`slug: "${slug}"`), `missing priority guide: ${slug}`);
  assert.match(registry, new RegExp(`"slug":"${slug}"[^\n]*"guideStatus":"available"`), `priority route must be registered: ${slug}`);
}
for (const level of ["Entry", "Mid", "Senior", "Staff+"]) assert.ok(data.includes(`"${level}"`), `missing canonical level ${level}`);
for (const id of ["dsa", "practical", "lld", "system-design", "ml-design", "behavioral"]) assert.match(data, new RegExp(`id: "${id}"`), `missing separated domain ${id}`);
for (const marker of ["official", "candidate", "recommendation", "verifiedAt", "confidence", "applicability", "Processes vary by role, team, location, and time", "approved", "publication_consent"]) assert.match(`${data}\n${route}\n${ui}`, new RegExp(marker), `missing source, freshness, or experience boundary: ${marker}`);
assert.match(route, /eq\("status", "approved"\)[\s\S]*eq\("publication_consent", true\)/, "company pages must query only approved, consented experiences");
assert.doesNotMatch(data, /\b\d{1,3}%\b/, "company guides must not contain unsupported percentage weighting");
assert.doesNotMatch(data, /readiness score|pass probability|hiring probability/i, "company guides must not create readiness or outcome scores");
console.log("P0.4 company-guide qualification passed: ten routes, canonical levels, domain separation, provenance, freshness, and approved-experience boundaries hold.");
