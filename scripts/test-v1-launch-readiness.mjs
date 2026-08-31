import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { METRIC_IDS, METRIC_SOURCE_REFERENCES } from "./validate-impact-ledger.mjs";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";
import { validateReleaseRecord } from "./release-record.mjs";

const read = (path) => readFileSync(path, "utf8");
const tracker = read("docs/v1-launch-readiness.md");
const plan = read("docs/launch-finish-plan.md");
const checklist = read("docs/production-launch-checklist.md");
const operations = read("docs/production-operations-runbook.md");
const analytics = read("docs/analytics-launch-operations.md");
const template = JSON.parse(read("docs/impact-ledger/monthly-snapshot.template.json"));
const ci = read(".github/workflows/ci.yml");
const packageJson = JSON.parse(read("package.json"));

assert.ok(tracker.includes("REPOSITORY RC READY"), "tracker must distinguish repository readiness from a production launch");
assert.ok(!/REPOSITORY RC READY[^.\n]{0,120}public launch completion/i.test(tracker), "repository readiness must not be called public launch completion");
assert.ok(tracker.includes("OWNER GATE"), "tracker must distinguish external owner gates");
assert.ok(tracker.includes("Visualization Lab Beta — DEFERRED P1"), "visualization beta must be explicitly deferred rather than promised");
const headings = ["Homepage", "Authentication", "Dashboard", "Onboarding and Settings", "Applications", "Calendar and Reminders", "DSA", "System Design", "ML Design", "Behavioral", "Interview Playbook", "Mock Interviews", "Interview Experiences", "Company Guides", "Low-Level Design", "Salary Negotiation", "Feedback", "Admin Operations", "Search and Resources", "Privacy, Terms, Contact, FAQ, About", "Analytics and Impact Ledger", "Production / Release Operations"];
for (const heading of headings) assert.ok(tracker.includes(`## ${heading}`), `tracker must have a page-wise ${heading} checklist`);
assert.ok(/^\s*- \[x\] /m.test(tracker) && /^\s*- \[ \] OWNER GATE:/m.test(tracker), "tracker must use completed and unchecked OWNER GATE checklist syntax");
const ownerGateItems = tracker.match(/^\s*- \[ \] OWNER GATE:/gm) ?? [];
assert.ok(ownerGateItems.length >= 25, "tracker must retain a meaningful set of unchecked owner-gate items");
assert.ok(tracker.includes("## P0 checkpoint status"), "tracker must include P0 checkpoint status");
for (const checkpoint of Array.from({ length: 10 }, (_, index) => `P0.${index + 1}`)) assert.ok(new RegExp(`\\| ${checkpoint} \\|`).test(tracker), `P0 checkpoint table must represent ${checkpoint}`);
assert.ok(/P0\.1 \|[\s\S]*?Merged \/ repository-proven/.test(tracker) && /P0\.9 \|[\s\S]*?Merged \/ repository-proven/.test(tracker), "P0.1–P0.9 must retain merged repository-proven status");
assert.ok(/P0\.10 \|[\s\S]*?Repository release controls implemented/.test(tracker), "P0.10 must describe durable repository state");
assert.ok(/P0\.10[\s\S]{0,260}OWNER GATE/.test(tracker), "P0.10 production verification must remain separate from implementation status");
for (const ephemeral of ["PR #25", "CI green", "not yet merged"]) assert.ok(!tracker.includes(ephemeral), `tracker must not hard-code ephemeral status: ${ephemeral}`);
for (const marker of ["DNS/TLS/origin", "hosted Supabase project", "SMTP", "OAuth", "service-role and reminder-worker secrets", "external HTTPS scheduler", "WAF or edge feedback rate limiting", "qualified legal review", "analytics-consent decision", "production PostHog project", "PostHog dashboards", "live payloads", "hosted two-user isolation", "production export/deletion", "headers/CSP", "mobile/desktop verification", "keyboard/focus/text-resize", "screen-reader", "Lighthouse/CWV", "deployed public-route smoke", "monitor deployment"]) assert.ok(tracker.includes(marker), `tracker must retain external production gate: ${marker}`);
assert.ok(plan.includes("Otherwise it moves to P1."), "launch plan must retain visualization deferral threshold");
assert.ok(checklist.includes("Local qualification is not hosted qualification."), "checklist must preserve hosted qualification boundary");
assert.ok(operations.includes("DNS, SSL, managed backups"), "operations runbook must preserve external operations boundary");
assert.ok(analytics.includes("does not implement a consent banner"), "analytics runbook must not claim an absent consent mechanism");
assert.ok(METRIC_IDS.includes("registered_accounts"), "impact ledger must use the canonical registered-account metric");
assert.ok(!METRIC_IDS.includes("registered_users"), "stale registered-users metric must not remain in the ledger schema");
assert.deepEqual(METRIC_SOURCE_REFERENCES.account_source_reference, ["registered_accounts"], "registered accounts must require an authoritative account source");
assert.ok(Object.hasOwn(template.metrics, "registered_accounts") && !Object.hasOwn(template.metrics, "registered_users"), "snapshot template must match canonical account terminology");

const staticScripts = new Set(STATIC_STEPS.filter((step) => step.command === "npm" && step.args[0] === "run").map((step) => step.args[1]));
for (const script of Object.keys(packageJson.scripts).filter((name) => name.startsWith("test:") && !["test:public-routes", "test:public-routes:hosted"].includes(name))) {
  assert.ok(staticScripts.has(script), `canonical static qualification must include ${script}`);
}
assert.ok(staticScripts.has("test:v1-launch-readiness"), "static qualification must include final launch-readiness evidence");
assert.equal(packageJson.scripts["qualify:launch:production"], "npm run qualify:production", "the documented local production qualification alias must run the canonical production lane");
assert.equal(packageJson.scripts["test:public-routes:hosted"], "node scripts/smoke-public-routes.mjs --hosted", "hosted public-route smoke must remain explicit and not silently use local mode");
for (const command of ["npm run qualify:static", "npm run qualify:database", "npm run qualify:production"]) assert.ok(ci.includes(command), `CI must invoke canonical command: ${command}`);
validateReleaseRecord({ allowAbsent: true });

console.log("P0.10 launch-readiness regression passed: tracker boundaries, deferred visualization scope, owner gates, and analytics account terminology are explicit and qualified.");
