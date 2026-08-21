import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { METRIC_IDS, METRIC_SOURCE_REFERENCES } from "./validate-impact-ledger.mjs";

const read = (path) => readFileSync(path, "utf8");
const tracker = read("docs/v1-launch-readiness.md");
const releaseCandidate = read("docs/releases/v1-release-candidate.md");
const plan = read("docs/launch-finish-plan.md");
const checklist = read("docs/production-launch-checklist.md");
const operations = read("docs/production-operations-runbook.md");
const analytics = read("docs/analytics-launch-operations.md");
const template = JSON.parse(read("docs/impact-ledger/monthly-snapshot.template.json"));
const qualifier = read("scripts/qualify-launch.mjs");
const ci = read(".github/workflows/ci.yml");

assert.ok(tracker.includes("REPOSITORY RC READY"), "tracker must distinguish repository readiness from a production launch");
assert.ok(tracker.includes("OWNER GATE — external verification required"), "tracker must distinguish external owner gates");
assert.ok(tracker.includes("Visualization Lab Beta | DEFERRED P1"), "visualization beta must be explicitly deferred rather than promised");
for (const surface of ["Home and preparation hub", "DSA curriculum", "System Design curriculum", "ML Design", "Low-Level Design", "Behavioral", "Company guides", "Mock Interview", "Salary Negotiation", "Sign-up, sign-in", "Account export", "Feedback and least-privilege admin", "Analytics and impact ledger"]) assert.ok(tracker.includes(surface), `tracker must cover ${surface}`);
for (const control of ["Content provenance", "Internal and curated public links", "Metadata, canonical URLs, sitemap, robots", "Keyboard/focus/form semantics", "Security headers", "RLS, ownership isolation", "Production backups, DNS, TLS"]) assert.ok(tracker.includes(control), `tracker must cover release control ${control}`);
for (const marker of ["docs/production-launch-checklist.md", "docs/production-operations-runbook.md", "qualified review of the Privacy and Terms", "NEXT_PUBLIC_ACCOUNTS_ENABLED=false"]) assert.ok(tracker.includes(marker), `tracker must preserve external launch gate: ${marker}`);
assert.ok(plan.includes("Otherwise it moves to P1."), "launch plan must retain visualization deferral threshold");
assert.ok(checklist.includes("Local qualification is not hosted qualification."), "checklist must preserve hosted qualification boundary");
assert.ok(operations.includes("DNS, SSL, managed backups"), "operations runbook must preserve external operations boundary");
assert.ok(analytics.includes("does not implement a consent banner"), "analytics runbook must not claim an absent consent mechanism");
for (const marker of ["RC date", "Base SHA", "Candidate SHA", "all 25 migrations", "Production Webpack build: **PASS — exit 0**", "Visualization Lab Beta is **DEFERRED P1**", "Required external release gates", "Rollback reference", "Not deployed or production-qualified"]) assert.ok(releaseCandidate.includes(marker), `release-candidate record must retain ${marker}`);

assert.ok(METRIC_IDS.includes("registered_accounts"), "impact ledger must use the canonical registered-account metric");
assert.ok(!METRIC_IDS.includes("registered_users"), "stale registered-users metric must not remain in the ledger schema");
assert.deepEqual(METRIC_SOURCE_REFERENCES.account_source_reference, ["registered_accounts"], "registered accounts must require an authoritative account source");
assert.ok(Object.hasOwn(template.metrics, "registered_accounts") && !Object.hasOwn(template.metrics, "registered_users"), "snapshot template must match canonical account terminology");

assert.ok(qualifier.includes('["V1 launch readiness", "npm", ["run", "test:v1-launch-readiness"]]'), "static qualification must include final launch-readiness evidence");
assert.ok(ci.includes("Test v1 launch readiness") && ci.includes("npm run test:v1-launch-readiness"), "CI must include final launch-readiness evidence");

console.log("P0.10 launch-readiness regression passed: tracker boundaries, deferred visualization scope, owner gates, and analytics account terminology are explicit and qualified.");
