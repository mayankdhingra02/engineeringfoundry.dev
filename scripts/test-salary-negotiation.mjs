import assert from "node:assert/strict";
import fs from "node:fs";
import {
  calculateOfferComparison,
  getSalaryNegotiationSources,
  salaryNegotiationLevels,
  salaryNegotiationModules,
  salaryNegotiationSources,
} from "../data/salary-negotiation/index.ts";
import {
  buildSalaryNegotiationStaticParams,
  finitePublicRouteDefinitions,
  indexableFinitePublicRoutes,
} from "../lib/public-route-inventory.ts";

const source = fs.readFileSync("data/salary-negotiation/index.ts", "utf8");
const entryRoute = fs.readFileSync("app/salary-negotiation/page.tsx", "utf8");
const moduleRoute = fs.readFileSync("app/salary-negotiation/[slug]/page.tsx", "utf8");
const moduleView = fs.readFileSync("features/salary-negotiation/module-view.tsx", "utf8");
const worksheet = fs.readFileSync("features/salary-negotiation/offer-comparison-worksheet.tsx", "utf8");
const editableScripts = fs.readFileSync("features/salary-negotiation/editable-scripts.tsx", "utf8");
const sourceNotes = fs.readFileSync("features/salary-negotiation/source-notes.tsx", "utf8");
const styles = fs.readFileSync("app/globals.css", "utf8");
const search = fs.readFileSync("lib/global-search.ts", "utf8");
const applications = fs.readFileSync("app/applications/[id]/page.tsx", "utf8");
const playbook = fs.readFileSync("app/interview-playbook/page.tsx", "utf8");
const docs = fs.readFileSync("docs/salary-negotiation-v1.md", "utf8");
const research = fs.readFileSync("docs/product-blueprint/research/salary-negotiation/final-synthesis.md", "utf8");

const levels = ["Entry", "Mid", "Senior", "Staff+"];
assert.deepEqual(salaryNegotiationLevels, levels, "Salary Negotiation must use the canonical level taxonomy");
assert.equal(salaryNegotiationModules.length, 8, "P0.6 must publish exactly eight required modules");
assert.equal(new Set(salaryNegotiationModules.map((item) => item.id)).size, 8, "module IDs must be unique");
assert.equal(new Set(salaryNegotiationModules.map((item) => item.slug)).size, 8, "module slugs must be unique");
const requiredSlugs = ["compensation-package-anatomy", "level-scope-and-bands", "timing-and-process", "honest-leverage", "counters-and-trade-offs", "startup-equity-diligence", "raises-and-promotions", "remote-and-written-terms"];
assert.deepEqual(salaryNegotiationModules.map((item) => item.slug), requiredSlugs, "module inventory must cover the launch-plan scope");
for (const item of salaryNegotiationModules) {
  assert.equal(item.status, "published", `${item.slug} must be published`);
  assert.ok(item.objectives.length >= 3, `${item.slug} needs learning objectives`);
  assert.ok(item.sections.length >= 3, `${item.slug} needs substantial sections`);
  assert.deepEqual(item.levels, levels, `${item.slug} must retain canonical level relevance`);
  for (const section of item.sections) {
    assert.ok(section.explanation.length > 90 && section.example.length > 70, `${item.slug}/${section.title} needs useful guidance and an example`);
    assert.ok(section.cautions.length >= 2, `${item.slug}/${section.title} needs caveats`);
  }
}
const scriptTitles = salaryNegotiationModules.flatMap((module) => module.scripts.map((item) => item.title));
for (const requiredTitle of ["Initial counter", "Low-offer clarification", "No competing offer", "Competing-offer disclosure", "Level discussion", "Sign-on request", "Equity request", "Deadline extension", "Remote or geography question", "Raise or promotion conversation", "Best offer response"]) {
  assert.ok(scriptTitles.includes(requiredTitle), `message examples must cover ${requiredTitle}`);
}
assert.match(source, /You can negotiate without bluffing/, "honest leverage must explicitly reject bluffing");
assert.match(source, /fake competing offers[\s\S]*altered offer letters/i, "anti-fabrication boundary must cover offers and documents");
assert.match(source, /Private-company equity may ultimately be worth zero/, "startup equity uncertainty must be explicit");
assert.match(`${source}\n${docs}`, /general educational guidance|General education/i, "legal and financial boundary must be present");
assert.doesNotMatch(source, /\$\d{2,3}(?:,\d{3})+/, "curriculum must not publish hard-coded market salary numbers");
assert.doesNotMatch(source, /best offer score|negotiation readiness score|probability of acceptance/i, "P0.6 must not create offer or readiness scores");
assert.doesNotMatch(source, /guarantee that negotiation/i, "content must not guarantee a negotiation outcome");

assert.equal(salaryNegotiationSources.length, 5, "current Salary Negotiation guidance needs the five bounded first-party sources");
assert.equal(new Set(salaryNegotiationSources.map(({ id }) => id)).size, salaryNegotiationSources.length, "source IDs must be unique");
for (const item of salaryNegotiationSources) {
  const url = new URL(item.url);
  assert.equal(url.protocol, "https:", `${item.id} must use HTTPS`);
  assert.ok(["www.dol.gov", "www.irs.gov", "www.ftc.gov", "www.uscis.gov"].includes(url.hostname), `${item.id} must remain first-party`);
  assert.match(item.verifiedAt, /^2026-09-05$/, `${item.id} must expose the current verification date`);
  assert.match(item.reviewBy, /^202(6|7)-\d{2}-\d{2}$/, `${item.id} must have a review deadline`);
  assert.ok(item.claim.length > 70 && item.limits.length > 70, `${item.id} needs bounded claim and usage-limit copy`);
}
assert.deepEqual(getSalaryNegotiationSources("startup-equity-diligence").map(({ id }) => id), ["SRC-SAL-IRS-STOCK-OPTIONS"], "equity guidance must cite the IRS boundary");
assert.deepEqual(getSalaryNegotiationSources("remote-and-written-terms").map(({ id }) => id), ["SRC-SAL-DOL-OTHER-COMP", "SRC-SAL-FTC-NONCOMPETE", "SRC-SAL-USCIS-I765"], "written-terms guidance must expose current compensation, noncompete, and work-authorization boundaries");
for (const field of ["source.jurisdiction", "source.volatility", "source.verifiedAt", "source.reviewBy", "source.limits"]) assert.ok(sourceNotes.includes(field), `public source cards must expose ${field}`);
assert.match(sourceNotes, /target="_blank" rel="noopener noreferrer"/, "external source links must isolate the opener");
assert.match(entryRoute, /SalaryNegotiationSourceNotes[\s\S]*salaryNegotiationSources/, "the landing page must publish the complete source and freshness record");
assert.match(research, /FTC[\s\S]*not in effect and is not enforceable[\s\S]*2026-12-05[\s\S]*2027-03-05/s, "the approved synthesis must record current volatile status and review windows");
assert.match(moduleView, /EditableNegotiationScripts/, "module pages must use the editable script surface");
assert.match(editableScripts, /useState\(script\.template\)[\s\S]*<textarea[\s\S]*onChange=/, "published examples must be genuinely editable");
assert.match(editableScripts, /draftRef\.current\?\.focus\(\)[\s\S]*draftRef\.current\?\.select\(\)/, "script copy failure must focus and select the edited draft");
assert.doesNotMatch(editableScripts, /localStorage|sessionStorage|fetch\(|supabase|searchParams|router\.|track\(/i, "edited module scripts must stay in memory and out of persistence, navigation, and analytics");

const transparent = calculateOfferComparison({ label: "A", baseSalary: 180000, targetBonus: 30000, targetBonusGuaranteed: false, signOn: 25000, equityGrantValue: 160000, vestingYears: 4, otherGuaranteedCompensation: 5000 });
assert.equal(transparent.firstYearGuaranteedCash, 210000, "target bonus must not silently count as guaranteed cash");
assert.equal(transparent.targetBonus, 30000, "target bonus must remain separately visible");
assert.equal(transparent.annualizedEquity, 40000, "equity annualization must be entered grant divided by vesting years");
const guaranteedBonus = calculateOfferComparison({ label: "B", baseSalary: 100, targetBonus: 20, targetBonusGuaranteed: true, signOn: null, equityGrantValue: 100, vestingYears: 0, otherGuaranteedCompensation: null });
assert.equal(guaranteedBonus.firstYearGuaranteedCash, 120, "explicitly guaranteed bonus may count in guaranteed cash");
assert.equal(guaranteedBonus.annualizedEquity, null, "zero or invalid vesting period cannot create annualized equity");
const invalid = calculateOfferComparison({ label: "C", baseSalary: -1, targetBonus: null, targetBonusGuaranteed: false, signOn: Number.NaN, equityGrantValue: -4, vestingYears: null, otherGuaranteedCompensation: -5 });
assert.deepEqual(invalid, { firstYearGuaranteedCash: 0, targetBonus: 0, annualizedEquity: null }, "empty and invalid inputs must be safe and transparent");

assert.match(entryRoute, /I just got an offer[\s\S]*I have multiple offers[\s\S]*I don’t have competing leverage[\s\S]*I’m negotiating a raise/s, "entry page must offer low-overwhelm paths");
assert.match(moduleRoute, /dynamicParams = false[\s\S]*generateStaticParams/, "unknown module slugs must not resolve");
assert.match(moduleRoute, /buildSalaryNegotiationStaticParams\(\)/, "module route must use the shared finite-route static-param builder");
assert.deepEqual(buildSalaryNegotiationStaticParams(), salaryNegotiationModules.map((item) => ({ slug: item.slug })), "static params must exactly match the complete Salary Negotiation module catalog");
const salaryDefinition = finitePublicRouteDefinitions.find(({ pagePattern }) => pagePattern === "/salary-negotiation/[slug]");
assert.deepEqual(salaryDefinition?.paths, salaryNegotiationModules.map((item) => `/salary-negotiation/${item.slug}`), "finite-route inventory must contain every Salary Negotiation module exactly once");
const indexableRoutes = new Set(indexableFinitePublicRoutes);
for (const item of salaryNegotiationModules) assert.equal(indexableRoutes.has(`/salary-negotiation/${item.slug}`), item.status === "published", `${item.slug} sitemap publication must follow module status`);
assert.match(search, /salaryNegotiationModules/, "global search must register published modules");
assert.match(applications, /application\.status === "Offer"[\s\S]*\/salary-negotiation/, "actual offer-status applications need a bounded handoff");
assert.match(playbook, /offerStageApplication[\s\S]*\/salary-negotiation/, "Playbook needs an actual-offer handoff without changing diagnostics");
assert.match(worksheet, /useState[\s\S]*MAX_OFFERS = 4/, "worksheet must be bounded client state");
assert.doesNotMatch(worksheet, /localStorage|sessionStorage|fetch\(|supabase|searchParams|router\.push/i, "private worksheet cannot persist or navigate values");
const worksheetAnalytics = worksheet.match(/useEffect\(\(\) => \{\s*(track\([^;]+\);)\s*\}, \[\]\);/s);
assert.ok(worksheetAnalytics, "worksheet may emit one mount-only analytics event");
assert.equal(
  worksheetAnalytics[1],
  'track("offer_comparison_opened", { surface: "salary-negotiation" });',
  "worksheet analytics must be the fixed, value-free open event",
);
assert.doesNotMatch(
  worksheetAnalytics[1],
  /label|baseSalary|targetBonus|signOn|equityGrantValue|vestingYears|otherGuaranteedCompensation/i,
  "worksheet analytics cannot include private offer values",
);
assert.match(worksheet, /in-memory state[\s\S]*does not transmit or store them[\s\S]*refreshing or closing the page clears them[\s\S]*If analytics is enabled and available[\s\S]*fixed, value-free event/, "worksheet must disclose in-memory-only inputs and the conditional fixed analytics event");
assert.match(worksheet, /await navigator\.clipboard\.writeText\(message\)[\s\S]*setCopyStatus\("copied"\)[\s\S]*catch[\s\S]*setCopyStatus\("unavailable"\)/, "copy must write the assembled message and report clipboard failure truthfully");
assert.match(worksheet, /messageOutputRef\.current\?\.focus\(\)[\s\S]*messageOutputRef\.current\?\.select\(\)/, "clipboard failure must focus and select the local draft for keyboard recovery");
assert.match(worksheet, /readOnly value=\{message[\s\S]*role="status" aria-live="polite"[\s\S]*Draft copied to your clipboard[\s\S]*Copy was unavailable\. The draft is selected; copy it manually\./, "copy feedback must be live and the fallback draft must be selectable");
assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.salary-module-list a \{ width: 44px; height: 44px; \}[\s\S]*\.salary-offer-fields input[\s\S]*min-height: 44px/s, "mobile module actions and private worksheet inputs must meet the 44px interaction floor");
assert.match(docs, /React in-memory page state[\s\S]*does not transmit or store[\s\S]*Refreshing or closing the page clears them[\s\S]*Copying writes the assembled message to the browser clipboard only[\s\S]*If analytics is enabled and available[\s\S]*no compensation values, labels, notes, dates, or message-builder text[\s\S]*never transmitted to or stored by Engineering Foundry/i, "persistence, clipboard, and conditional fixed-event privacy boundaries must be documented together");
console.log("Salary Negotiation v1 qualification passed: eight modules, privacy, math, safeguards, discovery, and offer handoffs hold.");
