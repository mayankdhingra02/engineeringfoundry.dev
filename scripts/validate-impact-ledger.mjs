import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { strict as assert } from "node:assert";
import { ANALYTICS_DEFINITION_VERSION } from "../lib/analytics/launch-metrics.ts";

const ROOT = "docs/impact-ledger";
export const METRIC_IDS = [
  "unique_visitors", "registered_users", "first_useful_action_users", "engaged_users", "seven_day_returning_users", "seven_day_return_rate",
  "dsa_starts", "system_design_starts", "ml_design_starts", "behavioral_starts", "low_level_design_starts",
  "mock_starts", "mock_review_saves", "interview_experience_submissions", "interview_experience_approvals",
];
export const METRIC_SOURCE_REFERENCES = {
  analytics_source_reference: METRIC_IDS.filter((metric) => metric !== "registered_users" && metric !== "interview_experience_approvals"),
  account_source_reference: ["registered_users"],
  product_data_source_reference: ["interview_experience_approvals"],
};
const EVIDENCE_TYPES = new Set(["testimonial", "article", "podcast", "talk", "workshop", "adoption", "invitation", "citation", "technical_contribution"]);

function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : entry.name.endsWith(".json") ? [path] : [];
  });
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { throw new Error(`${path}: invalid JSON (${error instanceof Error ? error.message : String(error)})`); }
}

function required(record, key, path) {
  assert.ok(typeof record[key] === "string" && record[key].trim(), `${path}: missing ${key}`);
}

function nonnegative(value, label, path) {
  assert.ok(typeof value === "number" && Number.isFinite(value) && value >= 0, `${path}: ${label} must be a nonnegative finite number`);
}

export function validateSnapshot(record, path = "snapshot") {
  assert.match(relative(join(ROOT, "snapshots"), path), /^\d{4}-\d{2}\.json$/, `${path}: snapshot filename must be YYYY-MM.json`);
  assert.equal(record.analytics_definition_version, ANALYTICS_DEFINITION_VERSION, `${path}: use the current explicit analytics definition version`);
  assert.deepEqual(
    Object.values(METRIC_SOURCE_REFERENCES).flat().sort(),
    [...METRIC_IDS].sort(),
    "impact-ledger metric source mapping must cover every required metric exactly once",
  );
  assert.match(record.month ?? "", /^\d{4}-\d{2}$/, `${path}: month must be YYYY-MM`);
  assert.ok(record.measurement_window && typeof record.measurement_window === "object", `${path}: missing measurement_window`);
  required(record.measurement_window, "start", path); required(record.measurement_window, "end", path);
  for (const sourceReference of Object.keys(METRIC_SOURCE_REFERENCES)) required(record, sourceReference, path);
  assert.ok(record.metrics && typeof record.metrics === "object" && !Array.isArray(record.metrics), `${path}: metrics must be an object`);
  for (const metric of METRIC_IDS) nonnegative(record.metrics[metric], metric, path);
  assert.ok(record.metrics.seven_day_return_rate <= 1, `${path}: seven_day_return_rate must be a decimal from 0 to 1`);
}

function validateRelease(record, path) {
  for (const key of ["release", "date", "git_sha", "ci_run", "latest_migration"]) required(record, key, path);
  assert.match(record.date, /^\d{4}-\d{2}-\d{2}$/, `${path}: date must be YYYY-MM-DD`);
  assert.match(record.git_sha, /^[0-9a-f]{7,64}$/i, `${path}: git_sha must be a commit SHA`);
  assert.ok(Array.isArray(record.major_capabilities) && record.major_capabilities.length, `${path}: list major_capabilities`);
  assert.ok(record.deployment && typeof record.deployment === "object", `${path}: missing deployment`);
  required(record.deployment, "environment", path); required(record.deployment, "url", path);
  assert.ok(record.owner_verification && typeof record.owner_verification === "object", `${path}: missing owner_verification`);
  required(record.owner_verification, "verified_by", path); required(record.owner_verification, "verified_at", path);
}

function validateEvidence(record, path) {
  for (const key of ["date", "type", "title", "source", "evidence_reference", "verified_by", "verified_at"]) required(record, key, path);
  assert.match(record.date, /^\d{4}-\d{2}-\d{2}$/, `${path}: date must be YYYY-MM-DD`);
  assert.ok(EVIDENCE_TYPES.has(record.type), `${path}: type must be a registered evidence type`);
  if (record.type === "testimonial") {
    assert.ok(record.testimonial_permission && typeof record.testimonial_permission === "object", `${path}: testimonial requires permission metadata`);
    assert.equal(typeof record.testimonial_permission.retention_allowed, "boolean", `${path}: testimonial retention consent must be explicit`);
    assert.equal(typeof record.testimonial_permission.public_attribution_allowed, "boolean", `${path}: testimonial attribution consent must be explicit`);
  }
}

export function validateImpactLedger(root = ROOT) {
  const errors = [];
  const realRecords = [];
  for (const path of files(root)) {
    try {
      const record = readJson(path);
      if (record.record_kind === "template") continue;
      assert.ok(record.record_kind === "evidence", `${path}: real records must declare record_kind: evidence`);
      if (path.includes("/snapshots/")) validateSnapshot(record, path);
      else if (path.includes("/releases/")) validateRelease(record, path);
      else if (path.includes("/records/")) validateEvidence(record, path);
      else throw new Error(`${path}: real records belong in snapshots/, releases/, or records/`);
      realRecords.push(path);
    } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  }
  if (errors.length) throw new Error(`Impact-ledger validation failed:\n- ${errors.join("\n- ")}`);
  return realRecords;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const realRecords = validateImpactLedger();
  console.log(`Impact-ledger validation passed: ${realRecords.length} real evidence record${realRecords.length === 1 ? "" : "s"}; templates excluded from totals under ${ANALYTICS_DEFINITION_VERSION}.`);
}
