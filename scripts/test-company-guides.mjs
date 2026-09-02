import assert from "node:assert/strict";
import fs from "node:fs";

const data = fs.readFileSync("data/company-guides/v1.ts", "utf8");
const route = fs.readFileSync("app/companies/[slug]/page.tsx", "utf8");
const ui = fs.readFileSync("features/company-guides/company-guide-v1.tsx", "utf8");
const publicReports = fs.readFileSync("lib/supabase/public.ts", "utf8");
const matureWorkspace = fs.readFileSync("features/company-guides/company-guide-workspace.tsx", "utf8");
const indexPage = fs.readFileSync("app/companies/page.tsx", "utf8");
const registry = fs.readFileSync("data/companies/companies.json", "utf8");
const priority = ["amazon", "google", "meta", "walmart", "microsoft", "nvidia", "openai", "anthropic", "atlassian", "uber"];
for (const slug of priority) {
  assert.match(data, new RegExp(`slug: "${slug}"`), `missing priority guide: ${slug}`);
  assert.match(registry, new RegExp(`"slug":"${slug}"[^\n]*"guideStatus":"available"`), `priority route must be registered: ${slug}`);
}
for (const level of ["Entry", "Mid", "Senior", "Staff+"]) assert.ok(data.includes(`"${level}"`), `missing canonical level ${level}`);
for (const id of ["dsa", "practical", "lld", "system-design", "ml-design", "behavioral"]) assert.match(data, new RegExp(`id: "${id}"`), `missing separated domain ${id}`);
for (const marker of ["official", "candidate", "recommendation", "verifiedAt", "confidence", "applicability", "Processes vary by role, team, location, and time", "approved", "publication_consent"]) assert.match(`${data}\n${route}\n${ui}\n${publicReports}`, new RegExp(marker), `missing source, freshness, or experience boundary: ${marker}`);
assert.match(publicReports, /eq\("status", "approved"\)[\s\S]*eq\("publication_consent", true\)/, "public reports must query only approved, consented experiences");
assert.match(route, /dynamic = "force-dynamic"[\s\S]*listPublicInterviewExperiences\(\{ companyName: company\.name, limit: 6 \}\)/, "company pages must use the fresh sessionless company-scoped public report query");
for (const marker of ["experienceAvailability", "temporarily unavailable", "cannot make a completeness claim", "/interview-experiences/${guide.slug}"]) assert.ok(ui.includes(marker), `company guide report handoff is missing ${marker}`);
assert.match(route, /matureGuides:[\s\S]*amazon:[\s\S]*google:[\s\S]*meta:[\s\S]*walmart:/, "the company route must register all four mature guides for composition");
assert.match(route, /matureGuide=\{matureGuide\}/, "the normalized route must pass the mature guide into the rendered P0.4 surface");
assert.match(ui, /CompanyGuideWorkspace guide=\{matureGuide\} embedded/, "the normalized surface must actually render mature guide detail when supplied");
assert.match(matureWorkspace, /embedded = false/, "the mature guide component must support embedded composition");
assert.match(matureWorkspace, /!embedded && <header[\s\S]*!embedded && <nav/s, "embedded mature detail must suppress its competing header and navigation");
assert.match(matureWorkspace, /!embedded && guide\.readiness/, "embedded mature detail must not surface legacy readiness scoring");
assert.match(ui, /Detailed company-specific research[\s\S]*Open detailed \{guide\.company\} guide/s, "mature detail must be progressively disclosed under a clear label");
assert.match(indexPage, /company\.guideStatus === "available"/, "company index must derive display status from guideStatus");
assert.match(indexPage, /available \? "Guide available" : "Curation in progress"/, "curating companies must not render the available label");
assert.match(indexPage, /company-guide-curating/, "curating cards must have a visually distinct state hook");
for (const slug of ["apple", "linkedin"]) assert.match(registry, new RegExp(`"slug":"${slug}"[^\n]*"guideStatus":"curating"`), `${slug} must remain curating`);
assert.equal((registry.match(/"guideStatus":"available"/g) ?? []).length, 10, "exactly the ten priority companies must be available");
assert.doesNotMatch(data, /\b\d{1,3}%\b/, "company guides must not contain unsupported percentage weighting");
assert.doesNotMatch(data, /readiness score|pass probability|hiring probability/i, "company guides must not create readiness or outcome scores");
console.log("P0.4 company-guide qualification passed: ten routes, canonical levels, domain separation, provenance, freshness, and approved-experience boundaries hold.");
