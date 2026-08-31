import assert from "node:assert/strict";
import fs from "node:fs";
import {
  calculateOfferComparison,
  salaryNegotiationLevels,
  salaryNegotiationModules,
} from "../data/salary-negotiation/index.ts";

const source = fs.readFileSync("data/salary-negotiation/index.ts", "utf8");
const entryRoute = fs.readFileSync("app/salary-negotiation/page.tsx", "utf8");
const moduleRoute = fs.readFileSync("app/salary-negotiation/[slug]/page.tsx", "utf8");
const worksheet = fs.readFileSync("features/salary-negotiation/offer-comparison-worksheet.tsx", "utf8");
const search = fs.readFileSync("components/global-search.tsx", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const applications = fs.readFileSync("app/applications/[id]/page.tsx", "utf8");
const playbook = fs.readFileSync("app/interview-playbook/page.tsx", "utf8");
const docs = fs.readFileSync("docs/salary-negotiation-v1.md", "utf8");

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
assert.match(source, /You can negotiate without bluffing/, "honest leverage must explicitly reject bluffing");
assert.match(source, /fake competing offers[\s\S]*altered offer letters/i, "anti-fabrication boundary must cover offers and documents");
assert.match(source, /Private-company equity may ultimately be worth zero/, "startup equity uncertainty must be explicit");
assert.match(`${source}\n${docs}`, /general educational guidance|General education/i, "legal and financial boundary must be present");
assert.doesNotMatch(source, /\$\d{2,3}(?:,\d{3})+/, "curriculum must not publish hard-coded market salary numbers");
assert.doesNotMatch(source, /best offer score|negotiation readiness score|probability of acceptance/i, "P0.6 must not create offer or readiness scores");
assert.doesNotMatch(source, /guarantee that negotiation/i, "content must not guarantee a negotiation outcome");

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
assert.match(search, /salaryNegotiationModules/, "global search must register published modules");
assert.match(sitemap, /salaryNegotiationModules/, "sitemap must register published module routes");
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
assert.match(worksheet, /Offer values, labels, notes, dates, and draft text stay only in this browser session and never leave it\.[\s\S]*Visiting this page sends one fixed, value-free analytics event; it never includes anything you enter\./, "worksheet must disclose the fixed, value-free page-visit event without weakening the session-only privacy boundary");
assert.match(docs, /browser-session state only[\s\S]*does not use localStorage[\s\S]*Opening the worksheet emits the existing fixed, allowlisted `offer_comparison_opened` event with only `surface: "salary-negotiation"`[\s\S]*no compensation values, labels, notes, dates, or message-builder text[\s\S]*remain session-only and never leave the browser session/i, "persistence and fixed-event privacy boundaries must be documented together");
console.log("Salary Negotiation v1 qualification passed: eight modules, privacy, math, safeguards, discovery, and offer handoffs hold.");
