import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { productionEngineeringSources, productionEngineeringSourcesReviewedAt } from "../content/system-design/production-engineering/sources.ts";

const expectedIds = [
  "observability", "logs", "metrics", "distributed-tracing", "request-ids", "alerts", "slis", "slos", "error-budgets",
  "authn-authz", "sessions-tokens", "jwt", "oauth-oidc", "tls", "encryption", "secrets-management", "api-abuse-ddos", "tenant-authorization",
];
const base = "content/system-design/production-engineering";
const contentFiles = ["observability-signals.tsx", "service-reliability.tsx", "identity-security.tsx", "platform-security.tsx"];
const [index, shared, ...contents] = await Promise.all([
  readFile(`${base}/index.tsx`, "utf8"),
  readFile(`${base}/shared.tsx`, "utf8"),
  ...contentFiles.map((file) => readFile(`${base}/${file}`, "utf8")),
]);
const combined = contents.join("\n");

const setMatch = index.match(/productionEngineeringLessonIds = new Set\(\[([\s\S]*?)\]\)/);
assert.ok(setMatch, "Production Engineering needs one explicit ID set.");
assert.deepEqual([...setMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]), expectedIds, "The ID set must contain exactly the approved 18 IDs in curriculum order.");
assert.deepEqual([...index.matchAll(/case "([^"]+)": return <([A-Za-z0-9]+) \/>/g)].map((match) => match[1]), expectedIds, "The dispatcher must handle every approved ID exactly once.");
assert.equal((index.match(/default: return null/g) ?? []).length, 1, "The dispatcher needs an honest null default.");

assert.deepEqual([...combined.matchAll(/\bid: "([^"]+)",/g)].map((match) => match[1]), expectedIds, "Grouped content must define exactly one substantive spec per approved ID.");
assert.equal((combined.match(/export function [A-Za-z0-9]+LessonContent\(\)/g) ?? []).length, 18, "Every approved lesson needs a named content component.");
for (const marker of ["mentalModel:", "mechanism:", "example:", "tradeoffs:", "exercise:", "probes:", "practice:", "remember:"]) {
  assert.equal((combined.match(new RegExp(marker, "g")) ?? []).length, 18, `Every lesson needs a substantive ${marker.slice(0, -1)} contract.`);
}
assert.equal((combined.match(/\n {2}failure: \{ failure:/g) ?? []).length, 18, "Every lesson needs one complete failure-diagnosis contract.");

for (const marker of ['id="mental-model"', 'id="mechanism"', 'id="worked-example"', 'id="tradeoffs"', 'id="failure-diagnosis"', 'id="exercise"', "<InterviewFollowUps>", "<ProductionEngineeringLessonEnd", "<FurtherReading items=", "Sources reviewed"]) {
  assert.match(shared, new RegExp(marker), `Shared renderer is missing page-contract marker ${marker}.`);
}
assert.match(shared, /<table><thead><tr><th>Option<\/th><th>Choose when<\/th><th>Cost or limit<\/th>/, "Comparison lessons need a semantic text table.");
assert.match(shared, /<details><summary>Work the scenario before revealing your answer<\/summary>/, "Every lesson needs a keyboard-native exercise disclosure.");
for (const lesson of ["DistributedTracing", "OAuthOidc", "Tls", "ApiAbuseDdos"]) {
  assert.match(combined, new RegExp(`export function ${lesson}LessonContent\\(\\)[\\s\\S]*?diagram: \\{ chart: [A-Za-z]+Flow, title: "[^"]+", description: "[^"]{80,}"`), `${lesson} needs a purposeful diagram with a substantive text alternative.`);
}

assert.deepEqual(Object.keys(productionEngineeringSources), expectedIds, "Source coverage must exactly match the 18 lesson IDs.");
assert.equal(productionEngineeringSourcesReviewedAt, "2026-09-04", "Sources need the approved verification date.");
const allSources = Object.values(productionEngineeringSources).flat();
assert.ok(Object.values(productionEngineeringSources).every((items) => items.length >= 2), "Every lesson needs at least two primary references.");
assert.ok(allSources.every((source) => source.url.startsWith("https://") && source.title && source.publisher), "Every source needs HTTPS, a title, and a publisher.");
assert.ok(allSources.every((source) => !/reddit|educative|bytebytego|designgurus|hellointerview/i.test(`${source.publisher} ${source.url}`)), "Sources must not depend on social or competitor material.");
for (const domain of ["opentelemetry.io", "sre.google", "rfc-editor.org", "openid.net", "owasp.org"]) assert.ok(allSources.some((source) => source.url.includes(domain)), `Primary source set must include ${domain}.`);
assert.ok(allSources.some((source) => source.url.includes("rfc9846")), "TLS must cite the current RFC 9846 specification.");
assert.ok(!allSources.some((source) => source.url.includes("rfc8446")), "The obsoleted RFC 8446 must not anchor the current TLS lesson.");
assert.ok(allSources.some((source) => source.url.includes("rfc7519")) && allSources.some((source) => source.url.includes("rfc8725")), "JWT must cite its format specification and current best-practices RFC.");

for (const phrase of [/in today's/i, /let's dive into/i, /it is important to note/i, /in conclusion/i, /this approach provides/i, /exactly how .* runs/i]) assert.doesNotMatch(combined, phrase, `Production Engineering contains weak or proprietary phrasing: ${phrase}.`);
for (const required of [/Threat model/i, /telemetry cost model/i, /operational coverage/i, /owning team/i, /Product-specific controls/i]) assert.match(`${combined}\n${shared}`, required, `Blueprint cross-cutting requirement is missing: ${required}.`);
assert.match(combined, /signed JWT is normally readable, not encrypted/, "JWT must distinguish signing from confidentiality.");
assert.match(combined, /OAuth delegates access[\s\S]*OpenID Connect adds an identity layer/, "OAuth and OpenID Connect roles must remain distinct.");
assert.match(combined, /Tenant isolation is an end-to-end invariant/, "Tenant authorization must be taught across system boundaries.");
assert.match(combined, /Page only when a person must act now/, "Alerting must be action-led.");

console.log(`System Design Production Engineering passed: ${expectedIds.length} lesson specs, ${allSources.length} primary reference placements, four accessible diagrams, complete decision/failure/exercise/probe contracts, and source review ${productionEngineeringSourcesReviewedAt}.`);
