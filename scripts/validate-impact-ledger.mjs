import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { strict as assert } from "node:assert";
import { ANALYTICS_DEFINITION_VERSION } from "../lib/analytics/launch-metrics.ts";

const ROOT = "docs/impact-ledger";
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const METRIC_IDS = [
  "unique_visitors", "registered_accounts", "first_useful_action_users", "engaged_users", "seven_day_returning_users", "seven_day_return_rate",
  "dsa_starts", "system_design_starts", "ml_design_starts", "behavioral_starts", "low_level_design_starts",
  "mock_starts", "mock_review_saves", "interview_experience_submissions", "interview_experience_approvals",
];
export const METRIC_SOURCE_REFERENCES = {
  analytics_source_reference: METRIC_IDS.filter((metric) => metric !== "registered_accounts" && metric !== "interview_experience_approvals"),
  account_source_reference: ["registered_accounts"],
  product_data_source_reference: ["interview_experience_approvals"],
};
const EVIDENCE_TYPES = new Set(["testimonial", "article", "podcast", "talk", "workshop", "adoption", "invitation", "citation", "technical_contribution"]);
const SNAPSHOT_KEYS = ["record_kind", "analytics_definition_version", "month", "measurement_window", "analytics_source_reference", "account_source_reference", "product_data_source_reference", "metrics", "notes"];
const RELEASE_KEYS = ["record_kind", "release", "date", "git_sha", "major_capabilities", "deployment", "ci_run", "latest_migration", "owner_verification", "notes"];
const EVIDENCE_KEYS = ["record_kind", "date", "type", "title", "source", "evidence_reference", "verified_by", "verified_at", "notes"];
const TESTIMONIAL_PERMISSION_KEYS = ["retention_allowed", "public_attribution_allowed", "approved_excerpt"];
const TEMPLATE_PATHS = new Set(["monthly-snapshot.template.json", "release-record.template.json", "evidence-record.template.json"]);

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

function object(value, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
}

function exactKeys(record, keys, label) {
  object(record, label);
  const expected = [...keys].sort();
  const actual = Object.keys(record).sort();
  assert.deepEqual(actual, expected, `${label} must contain exactly: ${expected.join(", ")}`);
}

function requiredString(value, label) {
  assert.ok(typeof value === "string" && value.trim() === value && value.length > 0, `${label} must be a non-empty trimmed string`);
}

function safeReferenceCharacters(value, label) {
  const hasControlCharacter = [...value].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127);
  assert.ok(value.length <= 2_048 && !hasControlCharacter, `${label} must be a bounded single-line reference without control characters`);
}

function validatedRepositoryRoot(repositoryRoot) {
  assert.ok(typeof repositoryRoot === "string" && repositoryRoot.length > 0, "repositoryRoot must be a non-empty path string");
  let realRoot;
  try { realRoot = realpathSync(resolve(repositoryRoot)); }
  catch { assert.fail("repositoryRoot must identify an existing directory"); }
  assert.ok(statSync(realRoot).isDirectory(), "repositoryRoot must identify an existing directory");
  return realRoot;
}

function isWithinRoot(root, path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === "" || (!isAbsolute(pathFromRoot) && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`));
}

function safeReference(value, label, repositoryRoot) {
  requiredString(value, label);
  safeReferenceCharacters(value, label);
  assert.ok(!value.includes("\\") && !value.startsWith("/") && !value.split("/").includes(".."), `${label} must not be an absolute, backslash, or traversing path`);
  if (value.startsWith("https://")) {
    let url;
    try { url = new URL(value); }
    catch { assert.fail(`${label} must be a valid HTTPS URL or safe repository-relative path`); }
    assert.equal(url.protocol, "https:", `${label} must use the exact https:// form when it is a URL`);
    assert.ok(!url.username && !url.password, `${label} must not contain URL credentials`);
    return;
  }
  assert.ok(!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value), `${label} must use the exact https:// form when it is a URL`);
  const segments = value.split("/");
  const safeSegments = segments.every((segment) => segment.length > 0 && segment !== "." && segment !== ".." && /^[A-Za-z0-9._-]+$/.test(segment));
  const shapedLikePath = segments.length > 1 || /^[A-Za-z0-9_-][A-Za-z0-9._-]*\.[A-Za-z0-9._-]+$/.test(value);
  assert.ok(safeSegments && shapedLikePath, `${label} must be a valid HTTPS URL or clearly shaped safe repository-relative path`);
  const candidate = resolve(repositoryRoot, ...segments);
  assert.ok(isWithinRoot(repositoryRoot, candidate), `${label} must resolve within repositoryRoot`);
  let realCandidate;
  try { realCandidate = realpathSync(candidate); }
  catch { assert.fail(`${label} repository-relative path must identify an existing regular file`); }
  assert.ok(isWithinRoot(repositoryRoot, realCandidate), `${label} repository-relative path must not escape repositoryRoot through a symlink`);
  assert.ok(statSync(realCandidate).isFile(), `${label} repository-relative path must identify an existing regular file`);
}

function httpsUrl(value, label) {
  requiredString(value, label);
  safeReferenceCharacters(value, label);
  if (!value.startsWith("https://")) {
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) assert.fail(`${label} must use HTTPS in exact https:// form`);
    assert.fail(`${label} must be a valid HTTPS URL`);
  }
  let url;
  try { url = new URL(value); }
  catch { assert.fail(`${label} must be a valid HTTPS URL`); }
  assert.equal(url.protocol, "https:", `${label} must use HTTPS`);
  assert.ok(!url.username && !url.password, `${label} must not contain URL credentials`);
}

function validationUtcDate(validationInstant) {
  assert.ok(validationInstant instanceof Date && Number.isFinite(validationInstant.valueOf()), "validationInstant must be a valid Date");
  return validationInstant.toISOString().slice(0, 10);
}

function canonicalDate(value, label, validationInstant) {
  requiredString(value, label);
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${label} must use exact YYYY-MM-DD format`);
  const normalized = `${value}T00:00:00.000Z`;
  const parsed = new Date(normalized);
  assert.ok(Number.isFinite(parsed.valueOf()) && parsed.toISOString() === normalized, `${label} must identify a real UTC calendar date`);
  assert.ok(value <= validationUtcDate(validationInstant), `${label} must not be later than the validation date`);
}

function canonicalMonth(value, label) {
  requiredString(value, label);
  assert.match(value, /^\d{4}-\d{2}$/, `${label} must use exact YYYY-MM format`);
  const normalized = `${value}-01T00:00:00.000Z`;
  const parsed = new Date(normalized);
  assert.ok(Number.isFinite(parsed.valueOf()) && parsed.toISOString() === normalized, `${label} must identify a real UTC calendar month`);
}

function ledgerRelativePath(path, root) {
  return relative(resolve(root), resolve(path)).split(sep).join("/");
}

function snapshotFileMonth(path, root) {
  const match = ledgerRelativePath(path, root).match(/^snapshots\/(\d{4}-\d{2})\.json$/);
  assert.ok(match, `${path}: snapshot filename must be YYYY-MM.json directly under snapshots/`);
  return match[1];
}

function datedRecordFileDate(path, root, directory, label) {
  const match = ledgerRelativePath(path, root).match(new RegExp(`^${directory}/(\\d{4}-\\d{2}-\\d{2})-[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*\\.json$`));
  assert.ok(match, `${path}: ${label} filename must be YYYY-MM-DD-nonempty-safe-suffix.json directly under ${directory}/`);
  return match[1];
}

function nextMonthStart(month) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  start.setUTCMonth(start.getUTCMonth() + 1);
  return start.toISOString().replace(".000Z", "Z");
}

function nonnegativeSafeInteger(value, label) {
  assert.ok(Number.isSafeInteger(value) && value >= 0, `${label} must be a nonnegative safe integer`);
}

export function validateSnapshot(record, path = "snapshot", { validationInstant = new Date(), root = ROOT, repositoryRoot = REPOSITORY_ROOT } = {}) {
  validationUtcDate(validationInstant);
  const resolvedRepositoryRoot = validatedRepositoryRoot(repositoryRoot);
  exactKeys(record, SNAPSHOT_KEYS, `${path}: snapshot`);
  assert.equal(record.record_kind, "evidence", `${path}: real snapshot must declare record_kind: evidence`);
  const filenameMonth = snapshotFileMonth(path, root);
  assert.equal(record.analytics_definition_version, ANALYTICS_DEFINITION_VERSION, `${path}: use the current explicit analytics definition version`);
  assert.deepEqual(
    Object.values(METRIC_SOURCE_REFERENCES).flat().sort(),
    [...METRIC_IDS].sort(),
    "impact-ledger metric source mapping must cover every required metric exactly once",
  );
  canonicalMonth(record.month, `${path}: month`);
  assert.equal(record.month, filenameMonth, `${path}: month must equal snapshot filename ${filenameMonth}`);
  exactKeys(record.measurement_window, ["start", "end"], `${path}: measurement_window`);
  const expectedStart = `${record.month}-01T00:00:00Z`;
  const expectedEnd = nextMonthStart(record.month);
  assert.equal(record.measurement_window.start, expectedStart, `${path}: measurement_window.start must be the canonical UTC start of ${record.month}`);
  assert.equal(record.measurement_window.end, expectedEnd, `${path}: measurement_window.end must be the canonical UTC start of the following month`);
  assert.ok(Date.parse(record.measurement_window.start) < Date.parse(record.measurement_window.end), `${path}: measurement_window must be ordered`);
  assert.ok(Date.parse(record.measurement_window.end) <= validationInstant.valueOf(), `${path}: measurement_window must not end after validationInstant`);
  for (const sourceReference of Object.keys(METRIC_SOURCE_REFERENCES)) safeReference(record[sourceReference], `${path}: ${sourceReference}`, resolvedRepositoryRoot);
  exactKeys(record.metrics, METRIC_IDS, `${path}: metrics`);
  for (const metric of METRIC_IDS) {
    if (metric === "seven_day_return_rate") continue;
    nonnegativeSafeInteger(record.metrics[metric], `${path}: ${metric}`);
  }
  assert.ok(typeof record.metrics.seven_day_return_rate === "number" && Number.isFinite(record.metrics.seven_day_return_rate) && record.metrics.seven_day_return_rate >= 0 && record.metrics.seven_day_return_rate <= 1, `${path}: seven_day_return_rate must be a finite decimal from 0 to 1`);
  requiredString(record.notes, `${path}: notes`);
}

export function validateRelease(record, path = "release", { validationInstant = new Date(), root = ROOT, repositoryRoot = REPOSITORY_ROOT } = {}) {
  validationUtcDate(validationInstant);
  validatedRepositoryRoot(repositoryRoot);
  exactKeys(record, RELEASE_KEYS, `${path}: release record`);
  assert.equal(record.record_kind, "evidence", `${path}: real release must declare record_kind: evidence`);
  requiredString(record.release, `${path}: release`);
  canonicalDate(record.date, `${path}: date`, validationInstant);
  assert.equal(record.date, datedRecordFileDate(path, root, "releases", "release record"), `${path}: date must equal the release filename date prefix`);
  assert.match(record.git_sha, /^[0-9a-f]{40}$/, `${path}: git_sha must be a full lowercase 40-hex commit SHA`);
  assert.ok(Array.isArray(record.major_capabilities) && record.major_capabilities.length > 0, `${path}: major_capabilities must be a non-empty array`);
  for (const [index, capability] of record.major_capabilities.entries()) requiredString(capability, `${path}: major_capabilities[${index}]`);
  assert.equal(new Set(record.major_capabilities).size, record.major_capabilities.length, `${path}: major_capabilities must not contain duplicates`);
  exactKeys(record.deployment, ["environment", "url"], `${path}: deployment`);
  requiredString(record.deployment.environment, `${path}: deployment.environment`);
  httpsUrl(record.deployment.url, `${path}: deployment.url`);
  httpsUrl(record.ci_run, `${path}: ci_run`);
  requiredString(record.latest_migration, `${path}: latest_migration`);
  exactKeys(record.owner_verification, ["verified_by", "verified_at"], `${path}: owner_verification`);
  requiredString(record.owner_verification.verified_by, `${path}: owner_verification.verified_by`);
  canonicalDate(record.owner_verification.verified_at, `${path}: owner_verification.verified_at`, validationInstant);
  assert.ok(record.owner_verification.verified_at >= record.date, `${path}: owner_verification.verified_at must not be earlier than the release date`);
  requiredString(record.notes, `${path}: notes`);
}

export function validateEvidence(record, path = "evidence record", { validationInstant = new Date(), root = ROOT, repositoryRoot = REPOSITORY_ROOT } = {}) {
  validationUtcDate(validationInstant);
  const resolvedRepositoryRoot = validatedRepositoryRoot(repositoryRoot);
  const keys = record?.type === "testimonial" ? [...EVIDENCE_KEYS, "testimonial_permission"] : EVIDENCE_KEYS;
  exactKeys(record, keys, `${path}: evidence record`);
  assert.equal(record.record_kind, "evidence", `${path}: real evidence record must declare record_kind: evidence`);
  canonicalDate(record.date, `${path}: date`, validationInstant);
  assert.equal(record.date, datedRecordFileDate(path, root, "records", "evidence record"), `${path}: date must equal the evidence filename date prefix`);
  assert.ok(EVIDENCE_TYPES.has(record.type), `${path}: type must be a registered evidence type`);
  requiredString(record.title, `${path}: title`);
  requiredString(record.source, `${path}: source`);
  safeReference(record.evidence_reference, `${path}: evidence_reference`, resolvedRepositoryRoot);
  requiredString(record.verified_by, `${path}: verified_by`);
  canonicalDate(record.verified_at, `${path}: verified_at`, validationInstant);
  assert.ok(record.verified_at >= record.date, `${path}: verified_at must not be earlier than the evidence date`);
  requiredString(record.notes, `${path}: notes`);
  if (record.type === "testimonial") {
    exactKeys(record.testimonial_permission, TESTIMONIAL_PERMISSION_KEYS, `${path}: testimonial_permission`);
    assert.equal(record.testimonial_permission.retention_allowed, true, `${path}: real testimonial retention consent must be explicitly true`);
    assert.equal(typeof record.testimonial_permission.public_attribution_allowed, "boolean", `${path}: testimonial attribution consent must be explicit`);
    if (record.testimonial_permission.approved_excerpt !== null) requiredString(record.testimonial_permission.approved_excerpt, `${path}: testimonial_permission.approved_excerpt`);
    if (!record.testimonial_permission.public_attribution_allowed) assert.equal(record.testimonial_permission.approved_excerpt, null, `${path}: approved_excerpt must be null unless public attribution is allowed`);
  }
}

export function validateImpactLedger(root = ROOT, { validationInstant = new Date(), repositoryRoot = REPOSITORY_ROOT } = {}) {
  validationUtcDate(validationInstant);
  const resolvedRepositoryRoot = validatedRepositoryRoot(repositoryRoot);
  const errors = [];
  const realRecords = [];
  for (const path of files(root)) {
    try {
      const record = readJson(path);
      const ledgerPath = ledgerRelativePath(path, root);
      if (record.record_kind === "template" && TEMPLATE_PATHS.has(ledgerPath)) continue;
      assert.ok(record.record_kind === "evidence", `${path}: real records must declare record_kind: evidence`);
      if (ledgerPath.startsWith("snapshots/")) validateSnapshot(record, path, { validationInstant, root, repositoryRoot: resolvedRepositoryRoot });
      else if (ledgerPath.startsWith("releases/")) validateRelease(record, path, { validationInstant, root, repositoryRoot: resolvedRepositoryRoot });
      else if (ledgerPath.startsWith("records/")) validateEvidence(record, path, { validationInstant, root, repositoryRoot: resolvedRepositoryRoot });
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
