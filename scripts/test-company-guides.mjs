import assert from "node:assert/strict";
import fs from "node:fs";
import { priorityCompanyGuides } from "../data/company-guides/v1.ts";

const data = fs.readFileSync("data/company-guides/v1.ts", "utf8");
const route = fs.readFileSync("app/companies/[slug]/page.tsx", "utf8");
const ui = fs.readFileSync("features/company-guides/company-guide-v1.tsx", "utf8");
const freshness = fs.readFileSync("lib/company-guides/freshness.ts", "utf8");
const admin = fs.readFileSync("app/admin/company-freshness/page.tsx", "utf8");
const publicReports = fs.readFileSync("lib/supabase/public.ts", "utf8");
const indexPage = fs.readFileSync("app/companies/page.tsx", "utf8");
const registry = fs.readFileSync("data/companies/companies.json", "utf8");
const priority = ["amazon", "google", "meta", "walmart", "microsoft", "nvidia", "openai", "anthropic", "atlassian", "uber"];

assert.deepEqual(priorityCompanyGuides.map((guide) => guide.slug), priority, "the Required release set must be deterministic");
const claimIds = new Set();
for (const guide of priorityCompanyGuides) {
  assert.ok(guide.claims.length > 0, `${guide.slug} must publish evidence or an explicit evidence limit`);
  const sources = new Map(guide.sources.map((source) => [source.id, source]));
  for (const claim of guide.claims) {
    assert.ok(!claimIds.has(claim.id), `duplicate company claim id: ${claim.id}`);
    claimIds.add(claim.id);
    assert.ok(sources.has(claim.sourceId), `${claim.id} references a missing source`);
    assert.equal(claim.verifiedAt, sources.get(claim.sourceId).verifiedAt, `${claim.id} verification disagrees with its source`);
    assert.ok(Date.parse(claim.reviewBy) > Date.parse(claim.verifiedAt), `${claim.id} must have a future review date`);
    assert.ok(claim.applicability.length >= 24 && claim.editorialNote.length >= 24, `${claim.id} lacks usable applicability or limits`);
    assert.equal(claim.sourceClass === "official" ? claim.displayLabel : "Engineering Foundry inference", claim.displayLabel, `${claim.id} has a misleading evidence label`);
  }
}
assert.equal(claimIds.size, 17, "the reviewed release should expose exactly the approved atomic claim set");

for (const slug of priority) {
  assert.match(data, new RegExp(`slug: "${slug}"`), `missing priority guide: ${slug}`);
  assert.match(registry, new RegExp(`"slug":"${slug}"[^\n]*"guideStatus":"available"`), `priority route must be registered: ${slug}`);
}
assert.equal((registry.match(/"guideStatus":"available"/g) ?? []).length, 10, "exactly the ten priority companies must be available");
for (const slug of ["apple", "linkedin"]) assert.match(registry, new RegExp(`"slug":"${slug}"[^\n]*"guideStatus":"curating"`), `${slug} must remain curating`);

for (const field of ["id", "section", "text", "sourceClass", "sourceId", "sourcePublishedAt", "verifiedAt", "applicability", "confidence", "volatility", "reviewBy", "conflictGroup", "supersededBy", "editorialStatus", "displayLabel", "editorialNote", "mayVary"]) {
  assert.match(data, new RegExp(`${field}:`), `claim-level schema is missing ${field}`);
}
for (const claimId of [
  "COMP-AMAZON-TECHNICAL-PREP", "COMP-GOOGLE-VIRTUAL-TOOLS", "COMP-META-PROCESS-NOT-ESTABLISHED", "COMP-WALMART-ASSESSMENT-VARIATION",
  "COMP-MICROSOFT-ENGINEERING-LIFECYCLE", "COMP-NVIDIA-CODING-TOOLS", "COMP-OPENAI-TOOL-RULES", "COMP-ANTHROPIC-LIVE-CODING",
  "COMP-ATLASSIAN-SYSTEM-DESIGN", "COMP-UBER-ROLE-GUIDES",
]) assert.ok(data.includes(claimId), `missing reviewed claim ${claimId}`);
assert.match(data, /publicationKind: "neutral-hub"[\s\S]*slug: "walmart"|slug: "walmart"[\s\S]{0,160}publicationKind: "neutral-hub"/, "evidence-limited companies must support honest neutral hubs");
assert.doesNotMatch(data, /\bprocess:\s*"/, "company process prose must not bypass the atomic claim schema");
assert.doesNotMatch(data, /\bstatus:\s*"complete"/, "an internal complete label must not substitute for acceptance evidence");
assert.doesNotMatch(data, /\b\d{1,3}%\b/, "company guides must not contain unsupported percentage weighting");
assert.doesNotMatch(data, /readiness score|pass probability|hiring probability/i, "company guides must not create readiness or outcome scores");

for (const marker of ["Current guidance and evidence limits", "Open supporting source", "Applies to", "Review by", "Confidence", "May vary"]) assert.ok(ui.includes(marker), `public claim evidence is missing ${marker}`);
assert.ok(data.includes("Engineering Foundry inference") && ui.includes("item.displayLabel"), "public inference labels must come from the claim record");
for (const marker of ["Official guidance", "approved candidate reports", "Engineering Foundry recommendations", "private recruiter-confirmed details"]) assert.ok(ui.includes(marker), `evidence layers are not distinct: ${marker}`);
assert.match(ui, /Candidate-reported · approved/, "approved public experiences must remain visibly candidate-reported");
assert.match(ui, /Candidate-confirmed private[\s\S]*accountPlatformAvailable[\s\S]*Open private application planner[\s\S]*Open public execution guide/, "private process handoff must be application-scoped and public-safe");
for (const href of ["/dsa/practice?mode=recognition", "/interview-tips/rounds/algorithmic-coding", "/low-level-design/practice", "/system-design/problems", "/ml-design/problems", "/behavioral/practice"]) assert.ok(data.includes(href), `missing exact public specialist handoff ${href}`);
assert.doesNotMatch(ui, /CompanyGuideWorkspace|Detailed company-specific research|matureGuide/, "legacy research with unaudited claims must not be published inside normalized guides");

assert.match(publicReports, /eq\("status", "approved"\)[\s\S]*eq\("publication_consent", true\)/, "public reports must query only approved, consented experiences");
assert.match(route, /dynamic = "force-dynamic"[\s\S]*listPublicInterviewExperiences\(\{ companyName: company\.name, limit: 6 \}\)/, "company pages must use the fresh company-scoped public report query");
assert.match(route, /accountPlatformStatus\(\)\.available/, "company pages must render an honest account-capability handoff");
assert.doesNotMatch(route, /matureGuides|matureGuide=/, "the normalized route must not publish unaudited legacy claim collections");

for (const marker of ["guide.claims", "claim.reviewBy", "claim.editorialStatus", "sourceTitle", "review_soon", "review_due", "needs_review", "conflicting"]) assert.ok(freshness.includes(marker), `claim freshness operation is missing ${marker}`);
for (const marker of ["Company claim freshness", "Source:", "Verified", "Review by", "Review source", "View public claim"]) assert.ok(admin.includes(marker), `claim freshness queue is missing ${marker}`);
assert.match(indexPage, /company\.guideStatus === "available"/, "company index must derive display status from guideStatus");
assert.match(indexPage, /available \? "Guide available" : "Curation in progress"/, "curating companies must not render the available label");

console.log("Company Guide Required qualification passed: ten reviewed guides or neutral hubs, atomic provenance, exact public handoffs, private overrides, approved reports, and claim-level freshness operations hold.");
