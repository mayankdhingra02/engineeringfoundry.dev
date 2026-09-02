import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const REQUIREMENTS_REGISTRY_PATH = "docs/product-blueprint/registry/requirements.json";
export const SOURCES_REGISTRY_PATH = "docs/product-blueprint/registry/sources.json";
export const RESEARCH_ARTIFACTS_REGISTRY_PATH = "docs/product-blueprint/registry/research-artifacts.json";
export const GAP_INVENTORY_PATH = "docs/public-v1-content-gap-inventory.md";
export const MANIFEST_PATH = "docs/product-blueprint/content-manifest.json";
export const LEDGER_PATH = "docs/product-blueprint/source-ledger.json";
export const COVERAGE_PATH = "docs/product-blueprint/generated/coverage.md";
export const OUTPUT_PATHS = [MANIFEST_PATH, LEDGER_PATH, COVERAGE_PATH];

export const REQUIRED_FAMILIES = [
  "EF-GLOBAL", "EF-SD", "EF-ML", "EF-DSA", "EF-BEH", "EF-PLAY", "EF-MOCK", "EF-COMP",
  "EF-EXP", "EF-LLD", "EF-SAL", "EF-AIB", "EF-VIZ", "EF-SUP", "EF-OPS",
];

export const REQUIRED_GAP_IDS = [
  "EF-SD-TOPIC-COVERAGE", "EF-SD-PRACTICE-COVERAGE", "EF-ML-CONCEPT-COVERAGE", "EF-ML-ROADMAP-MAPPING",
  "EF-ML-PRACTICE-PROVENANCE", "EF-DSA-LANGUAGE-COVERAGE", "EF-DSA-CURRICULUM-SHELLS", "EF-COMP-GUIDE-COVERAGE",
  "EF-BEH-CURRICULUM-DEPTH", "EF-PLAY-CURRICULUM-DEPTH", "EF-PLAY-ROUND-PROVENANCE", "EF-PLAY-TECHNICAL-PRESENTATION",
  "EF-MOCK-PEER-FACILITATION", "EF-LLD-REHEARSAL", "EF-AIB-BEGINNER-SCOPE", "EF-AIB-KIDS",
  "EF-GLOBAL-CORE-CONCEPTS-SCOPE", "EF-SUP-REFERRAL-POLICY",
];

export const REQUIRED_RESEARCH_ARTIFACTS = Object.freeze([
  ["RA-LAUNCH-V1-FINISH-PLAN", "Engineering Foundry v1 Launch Finish Plan", "EF-OPS"],
  ["RA-DSA-COMPETITIVE-RESEARCH", "Engineering Foundry DSA for Interviews: Competitive Research and Product Design", "EF-DSA"],
  ["RA-DSA-ROLE-ROADMAPS", "Engineering Foundry DSA Roadmaps for SDE I, SDE II, and SDE III+", "EF-DSA"],
  ["RA-DSA-PYTHON-JAVA-LANGUAGES", "Engineering Foundry Python and Java DSA Language Pages", "EF-DSA"],
  ["RA-DSA-JAVASCRIPT-REQUEST", "JavaScript DSA research phase requested for Engineering Foundry", "EF-DSA"],
  ["RA-SD-CURRICULUM-TOPIC-MAP", "Engineering Foundry System Design Curriculum: Deep Research and Recommended Topic Map", "EF-SD"],
  ["RA-SD-CONTENT-RESEARCH-BLUEPRINT", "Engineering Foundry System Design Content Research Blueprint", "EF-SD"],
  ["RA-ML-CORE-CONCEPTS", "Engineering Foundry ML Design Core Concepts Curriculum", "EF-ML"],
  ["RA-ML-RECOMMENDATION-RANKING", "Engineering Foundry ML Design: Recommendation and Ranking Systems", "EF-ML"],
  ["RA-ML-SEARCH-RETRIEVAL-ADVERTISING", "Engineering Foundry ML Design Research: Search, Retrieval, Query Understanding, Autocomplete, and Advertising", "EF-ML"],
  ["RA-ML-TRUST-PREDICTION-DECISION", "Engineering Foundry ML Design: Trust, Prediction, Forecasting, and Decision Systems", "EF-ML"],
  ["RA-ML-INFRA-MODERN-AI", "Engineering Foundry ML Design: ML Infrastructure and Modern AI System Design", "EF-ML"],
  ["RA-ML-FINAL-SYNTHESIS", "Engineering Foundry ML Design: Final Synthesis, Quality Audit, and Implementation-Ready Content Specification", "EF-ML"],
  ["RA-BEH-CURRICULUM-ARCHITECTURE", "Engineering Foundry Behavioral Interview Curriculum and Learning Architecture", "EF-BEH"],
  ["RA-BEH-STORY-BANK-EXAMPLES", "Engineering Foundry Behavioral Interview Story Bank, Answer Construction, and Annotated Examples", "EF-BEH"],
  ["RA-BEH-RUBRICS-SENIORITY", "Engineering Foundry Behavioral Evaluation Rubrics and Seniority Calibration", "EF-BEH"],
  ["RA-BEH-COMPANY-GUIDES", "Engineering Foundry Behavioral Interview Company Guides: Evidence-Based Specification", "EF-BEH"],
  ["RA-BEH-PRACTICE-MOCK-FEEDBACK", "Engineering Foundry Behavioral Practice, Follow-Ups, Mock Interviews, and Feedback UX", "EF-BEH"],
  ["RA-BEH-FINAL-SYNTHESIS", "Engineering Foundry Behavioral Interview: Final Synthesis, Quality Audit, and Implementation Handoff", "EF-BEH"],
  ["RA-PLAY-SCOPE-BOUNDARIES", "Engineering Foundry Interview Playbook: Final Scope, Information Architecture, and Product Boundaries", "EF-PLAY"],
  ["RA-PLAY-DIAGNOSTIC-PLAN", "Engineering Foundry Interview Playbook: Preparation Diagnostic, Readiness Model, and Adaptive Plan Generator", "EF-PLAY"],
  ["RA-PLAY-ROUND-EXECUTION", "Engineering Foundry Interview Playbook: Round-by-Round Interview Execution Playbooks", "EF-PLAY"],
  ["RA-PLAY-MOCK-SIMULATIONS", "Engineering Foundry Interview Playbook: Mock Interviews, Full-Loop Simulations, and Readiness Evidence", "EF-PLAY"],
  ["RA-PLAY-FINAL-WEEK-DEBRIEF", "Engineering Foundry Interview Playbook: Final Week, Interview Day, Recovery, and Post-Interview Debrief", "EF-PLAY"],
  ["RA-PLAY-FINAL-SYNTHESIS", "Engineering Foundry Interview Playbook — Final Synthesis and Quality Audit", "EF-PLAY"],
  ["RA-COMP-PRIORITY-COMPANIES", "Software-Engineering Interview Deep Research: priority companies", "EF-COMP"],
  ["RA-LOW-LEVEL-SYSTEMS", "Low-Level Software Interview Preparation: Questions, Problem Sets, Resources, and Study Plans", "EF-LLD"],
  ["RA-SAL-SECTION-BLUEPRINT", "Salary Negotiation: Research-Backed Website Section Blueprint", "EF-SAL"],
  ["RA-AIB-MVP-RECOMMENDATION", "AI for Noobs at Engineering Foundry: Research and MVP Recommendation", "EF-AIB"],
  ["RA-AIB-LEARNING-STRATEGY", "AI for Noobs: Research-Backed Learning Strategy for Engineering Foundry", "EF-AIB"],
].map(([id, title, familyId]) => Object.freeze({ id, title, familyId })));

const PRIORITIES = new Set(["required", "p1", "p2", "requires-founder-approval", "requires-new-research", "external-owner-gate", "excluded"]);
const STATUSES = new Set(["not-started", "placeholder", "partial", "implemented-unverified", "implemented", "blocked", "deferred", "excluded"]);
const RESEARCH_STATUSES = new Set(["approved", "approved-needs-source-import", "needs-current-verification", "needs-research", "not-applicable"]);
const PUBLICATION_STATUSES = new Set(["unpublished", "noindex-draft", "published", "stale-review", "archived"]);
const SOURCE_CLASSES = new Set([
  "standard / RFC", "original paper", "official documentation", "first-party engineering/science",
  "official company hiring/candidate", "institutional/career center", "candidate-reported",
  "respected secondary synthesis", "pedagogy/pain-point source", "Engineering Foundry editorial inference",
]);
const ARTIFACT_AVAILABILITIES = new Set(["missing", "repository-present", "external-recorded"]);
const ARTIFACT_APPROVAL_STATUSES = new Set(["unverified", "approved-needs-source-import", "needs-current-verification", "requires-founder-approval", "approved", "excluded"]);
const RESEARCH_STATUS_LEVEL = new Map([
  ["needs-research", 0], ["needs-current-verification", 1], ["approved-needs-source-import", 2], ["approved", 3],
]);
const ARTIFACT_APPROVAL_LEVEL = new Map([
  ["unverified", 0], ["requires-founder-approval", 0], ["excluded", 0],
  ["needs-current-verification", 1], ["approved-needs-source-import", 2], ["approved", 3],
]);
const SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const MAX_NORMALIZED_STATE_BYTES = 512 * 1024 * 1024;

function fail(message) {
  throw new Error(`Product blueprint governance: ${message}`);
}

function git(cwd, args, options = {}) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trim();
  } catch (error) {
    const detail = error?.stderr?.toString().trim();
    fail(`${detail || `git ${args.join(" ")} failed`}. Ensure CI checks out full history (fetch-depth: 0).`);
  }
}

function gitBuffer(cwd, args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const detail = error?.stderr?.toString().trim();
    fail(`${detail || `git ${args.join(" ")} failed`}. Ensure CI checks out full history (fetch-depth: 0).`);
  }
}

export function resolveCommit(cwd, value) {
  if (!SHA_PATTERN.test(value)) fail(`repository_sha must be a full Git commit SHA, received ${JSON.stringify(value)}.`);
  const resolved = git(cwd, ["rev-parse", "--verify", `${value}^{commit}`]);
  if (resolved !== value) fail(`repository_sha must be the canonical full commit SHA (${resolved}), not ${value}.`);
  return resolved;
}

function snapshotFile(cwd, commit, file) {
  return gitBuffer(cwd, ["show", `${commit}:${file}`]).toString("utf8");
}

function parseJson(source, label) {
  try {
    return JSON.parse(source);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object.`);
}

function assertOnlyKeys(value, allowed, label) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${label} has unsupported field ${key}.`);
}

function assertString(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) fail(`${label} must be a non-empty trimmed string${nullable ? " or null" : ""}.`);
}

function assertIsoDate(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return;
  assertString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value) || Number.isNaN(Date.parse(value))) fail(`${label} must be an ISO-8601 date or UTC timestamp.`);
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item || item.trim() !== item)) fail(`${label} must be an array of non-empty trimmed strings.`);
  if (new Set(value).size !== value.length) fail(`${label} must not contain duplicates.`);
}

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const stableStrings = (value) => [...value].sort(compareText);

function familyFor(id) {
  return REQUIRED_FAMILIES.find((family) => id === family || id.startsWith(`${family}-`)) ?? null;
}

function normalizeScope(scope) {
  if (scope === "bootstrap") fail("bootstrap scope must explicitly enumerate required_family_ids and required_gap_ids.");
  assertObject(scope, "requirements registry scope");
  assertOnlyKeys(scope, new Set(["phase", "required_family_ids", "required_gap_ids"]), "requirements registry scope");
  if (scope.phase !== "bootstrap") fail('requirements registry scope.phase must be "bootstrap".');
  assertStringArray(scope.required_family_ids, "requirements registry scope.required_family_ids");
  assertStringArray(scope.required_gap_ids, "requirements registry scope.required_gap_ids");
  const familyIds = stableStrings(scope.required_family_ids);
  const gapIds = stableStrings(scope.required_gap_ids);
  if (JSON.stringify(familyIds) !== JSON.stringify(stableStrings(REQUIRED_FAMILIES))) fail("bootstrap scope.required_family_ids must contain exactly the 15 master requirement families.");
  if (JSON.stringify(gapIds) !== JSON.stringify(stableStrings(REQUIRED_GAP_IDS))) fail("bootstrap scope.required_gap_ids must contain exactly the 18 approved public content-gap IDs.");
  return { value: { phase: "bootstrap", required_family_ids: familyIds, required_gap_ids: gapIds }, requiredGapIds: gapIds };
}

function normalizeUnmodeled(items) {
  if (!Array.isArray(items)) fail("unmodeled_atomic_requirements must be an array.");
  return items.map((item, index) => {
    const label = `unmodeled_atomic_requirements[${index}]`;
    assertObject(item, label);
    assertOnlyKeys(item, new Set(["id", "section", "reason", "priority"]), label);
    for (const field of ["id", "section", "reason", "priority"]) {
      if (!Object.hasOwn(item, field)) fail(`${label}.${field} is required.`);
      assertString(item[field], `${label}.${field}`);
    }
    if (!PRIORITIES.has(item.priority)) fail(`${item.id} has unsupported unmodeled priority ${item.priority}.`);
    if (!familyFor(item.id)) fail(`unmodeled atomic requirement ${item.id} does not belong to a registered EF family.`);
    return Object.fromEntries(Object.entries(item).sort(([left], [right]) => compareText(left, right)));
  }).sort((left, right) => compareText(left.id, right.id));
}

function validateRequirementShape(requirement, index) {
  const label = `requirements[${index}]`;
  assertObject(requirement, label);
  const allowed = new Set([
    "id", "section", "kind", "title", "priority", "status", "research_status", "publication_status",
    "routes", "route_families", "source_ledger_ids", "prerequisite_ids", "code_paths", "content_paths", "visual_ids",
    "test_commands", "acceptance_criteria", "known_gaps", "owner", "last_verified_at", "notes",
    "gap_inventory_ids", "research_artifact_ids",
  ]);
  assertOnlyKeys(requirement, allowed, label);
  for (const field of ["id", "section", "kind", "title"]) assertString(requirement[field], `${label}.${field}`);
  if (!familyFor(requirement.id)) fail(`${requirement.id} does not belong to one of the 15 registered EF families.`);
  if (!PRIORITIES.has(requirement.priority)) fail(`${requirement.id} has unsupported priority ${requirement.priority}.`);
  if (!STATUSES.has(requirement.status)) fail(`${requirement.id} has unsupported status ${requirement.status}.`);
  if (!RESEARCH_STATUSES.has(requirement.research_status)) fail(`${requirement.id} has unsupported research_status ${requirement.research_status}.`);
  if (!PUBLICATION_STATUSES.has(requirement.publication_status)) fail(`${requirement.id} has unsupported publication_status ${requirement.publication_status}.`);
  for (const field of ["routes", "source_ledger_ids", "prerequisite_ids", "code_paths", "content_paths", "visual_ids", "test_commands", "acceptance_criteria", "known_gaps"]) {
    assertStringArray(requirement[field], `${requirement.id}.${field}`);
  }
  if (requirement.route_families === undefined) requirement.route_families = [];
  assertStringArray(requirement.route_families, `${requirement.id}.route_families`);
  if (requirement.gap_inventory_ids === undefined) requirement.gap_inventory_ids = [];
  assertStringArray(requirement.gap_inventory_ids, `${requirement.id}.gap_inventory_ids`);
  if (requirement.research_artifact_ids === undefined) fail(`${requirement.id}.research_artifact_ids is required.`);
  assertStringArray(requirement.research_artifact_ids, `${requirement.id}.research_artifact_ids`);
  for (const route of requirement.routes) if (!route.startsWith("/") || /[?#\s]/.test(route)) fail(`${requirement.id} has invalid public route ${route}.`);
  assertString(requirement.owner, `${requirement.id}.owner`, { nullable: true });
  assertIsoDate(requirement.last_verified_at, `${requirement.id}.last_verified_at`, { nullable: true });
  assertString(requirement.notes, `${requirement.id}.notes`, { nullable: true });
  if (requirement.acceptance_criteria.length === 0) fail(`${requirement.id} must have at least one acceptance criterion.`);
  if (requirement.status === "implemented" && requirement.test_commands.length === 0) fail(`${requirement.id} cannot be implemented without a test command.`);
  if (requirement.status === "implemented" && requirement.known_gaps.length > 0) fail(`${requirement.id} cannot be implemented while known gaps remain.`);
  if (requirement.status === "implemented-unverified" && requirement.test_commands.length > 0) fail(`${requirement.id} cannot be implemented-unverified when behavior test commands are recorded; use partial until verification and source criteria close.`);
  if (requirement.status === "blocked" && requirement.known_gaps.length === 0) fail(`${requirement.id} cannot be blocked without a known gap.`);
  if (requirement.status === "placeholder" && requirement.publication_status === "published") fail(`${requirement.id} cannot be both placeholder and published.`);
  if (requirement.status === "excluded" && requirement.priority !== "excluded") fail(`${requirement.id} with excluded status must use excluded priority.`);
  if (requirement.publication_status === "published" && !["approved", "not-applicable"].includes(requirement.research_status)) fail(`${requirement.id} cannot be published with research status ${requirement.research_status}.`);
  if (requirement.publication_status === "published" && requirement.research_status === "approved" && requirement.source_ledger_ids.length === 0) fail(`${requirement.id} cannot publish research-backed content without a source reference.`);
}

function validateSourceShape(source, index) {
  const label = `sources[${index}]`;
  assertObject(source, label);
  const allowed = new Set(["id", "title", "publisher", "url", "source_class", "published_at", "verified_at", "volatility", "applies_to", "claims_supported", "usage_limits", "notes"]);
  assertOnlyKeys(source, allowed, label);
  for (const field of ["id", "title", "publisher", "url", "source_class", "volatility", "usage_limits"]) assertString(source[field], `${label}.${field}`);
  if (!/^https:\/\//.test(source.url)) fail(`${source.id}.url must use https.`);
  if (!SOURCE_CLASSES.has(source.source_class)) fail(`${source.id} has unsupported source_class ${source.source_class}.`);
  assertIsoDate(source.published_at, `${source.id}.published_at`, { nullable: true });
  assertIsoDate(source.verified_at, `${source.id}.verified_at`);
  assertStringArray(source.applies_to, `${source.id}.applies_to`);
  assertStringArray(source.claims_supported, `${source.id}.claims_supported`);
  assertString(source.notes, `${source.id}.notes`, { nullable: true });
}

function validateResearchArtifactShape(artifact, index) {
  const label = `artifacts[${index}]`;
  assertObject(artifact, label);
  const fields = ["id", "title", "family_id", "requirement_ids", "repository_path", "external_record", "version_or_hash", "availability", "approval_status", "verified_at", "notes"];
  assertOnlyKeys(artifact, new Set(fields), label);
  for (const field of fields) if (!Object.hasOwn(artifact, field)) fail(`${label}.${field} is required.`);
  for (const field of ["id", "title", "family_id", "availability", "approval_status"]) assertString(artifact[field], `${label}.${field}`);
  assertStringArray(artifact.requirement_ids, `${artifact.id}.requirement_ids`);
  if (artifact.requirement_ids.length === 0) fail(`${artifact.id}.requirement_ids must not be empty.`);
  for (const field of ["repository_path", "external_record", "version_or_hash", "notes"]) assertString(artifact[field], `${artifact.id}.${field}`, { nullable: true });
  assertIsoDate(artifact.verified_at, `${artifact.id}.verified_at`, { nullable: true });
  if (!ARTIFACT_AVAILABILITIES.has(artifact.availability)) fail(`${artifact.id} has unsupported availability ${artifact.availability}.`);
  if (!ARTIFACT_APPROVAL_STATUSES.has(artifact.approval_status)) fail(`${artifact.id} has unsupported approval_status ${artifact.approval_status}.`);
  if (artifact.availability === "repository-present" && (!artifact.repository_path || !artifact.version_or_hash || !artifact.verified_at)) fail(`${artifact.id} with repository-present availability requires repository_path, version_or_hash, and verified_at.`);
  if (artifact.availability === "external-recorded" && (!artifact.external_record || !artifact.version_or_hash || !artifact.verified_at)) fail(`${artifact.id} with external-recorded availability requires external_record, version_or_hash, and verified_at.`);
  if (artifact.availability === "missing" && [artifact.repository_path, artifact.external_record, artifact.version_or_hash, artifact.verified_at].some((value) => value !== null)) fail(`${artifact.id} with missing availability must keep repository_path, external_record, version_or_hash, and verified_at null.`);
  if (artifact.approval_status === "approved" && (artifact.availability === "missing" || !artifact.version_or_hash || !artifact.verified_at)) fail(`${artifact.id} with approved status requires repository-present or external-recorded availability plus version_or_hash and verified_at.`);
}

function parseMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim().replace(/^`|`$/g, ""));
}

export function gapInventoryIds(markdown) {
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = parseMarkdownRow(lines[index]);
    const separator = parseMarkdownRow(lines[index + 1]);
    if (!header || !separator || !separator.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    const idColumn = header.findIndex((cell) => /^(?:gap )?id$/i.test(cell));
    if (idColumn < 0) continue;
    const ids = [];
    for (let row = index + 2; row < lines.length; row += 1) {
      const cells = parseMarkdownRow(lines[row]);
      if (!cells) break;
      if (cells[idColumn]) ids.push(cells[idColumn]);
    }
    assertStringArray(ids, "gap inventory IDs");
    return ids;
  }
  fail(`${GAP_INVENTORY_PATH} must contain a Markdown table with a stable Gap ID column.`);
}

function treeEntries(cwd, commit) {
  const output = gitBuffer(cwd, ["ls-tree", "-r", "-z", "--full-tree", commit]);
  if (output.length === 0) fail(`evaluated commit ${commit} has no tracked files.`);
  return output.toString("utf8").split("\0").filter(Boolean).map((record) => {
    const match = record.match(/^(\d+) ([^ ]+) ([0-9a-f]+)\t([\s\S]+)$/);
    if (!match) fail(`cannot parse Git tree entry ${JSON.stringify(record)}.`);
    return { mode: match[1], type: match[2], object: match[3], path: match[4] };
  });
}

function objectContents(cwd, entries) {
  const objectIds = [...new Set(entries.map((entry) => entry.object))];
  if (objectIds.length === 0) return new Map();
  const input = Buffer.from(`${objectIds.join("\n")}\n`);
  let sizeOutput;
  try {
    sizeOutput = execFileSync("git", ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], {
      cwd,
      encoding: "utf8",
      input,
      maxBuffer: Math.max(1024 * 1024, objectIds.length * 160),
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = error?.stderr?.toString().trim();
    fail(`${detail || "git cat-file --batch-check failed"}. Ensure the evaluated snapshot objects are available locally.`);
  }
  const objectSizes = new Map();
  for (const line of sizeOutput.split("\n")) {
    const match = line.match(/^([0-9a-f]+) ([^ ]+) (\d+)$/);
    if (!match || !objectIds.includes(match[1])) fail(`git cat-file returned invalid size metadata: ${line}.`);
    objectSizes.set(match[1], { type: match[2], size: Number(match[3]) });
  }
  if (objectSizes.size !== objectIds.length) fail("git cat-file did not report every evaluated snapshot object size.");
  const expectedOutputBytes = objectIds.reduce((total, objectId) => {
    const object = objectSizes.get(objectId);
    return total + Buffer.byteLength(`${objectId} ${object.type} ${object.size}\n`) + object.size + 1;
  }, 0);
  if (!Number.isSafeInteger(expectedOutputBytes) || expectedOutputBytes > MAX_NORMALIZED_STATE_BYTES) fail(`normalized tracked state requires ${expectedOutputBytes} bytes, exceeding the ${MAX_NORMALIZED_STATE_BYTES}-byte safety limit.`);
  let output;
  try {
    output = execFileSync("git", ["cat-file", "--batch"], {
      cwd,
      encoding: "buffer",
      input,
      maxBuffer: expectedOutputBytes + 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error?.stderr?.toString().trim();
    fail(`${detail || "git cat-file --batch failed"}. Ensure the evaluated snapshot objects are available locally.`);
  }
  const contents = new Map();
  let offset = 0;
  for (const requestedId of objectIds) {
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd < 0) fail(`git cat-file omitted the header for ${requestedId}.`);
    const header = output.subarray(offset, headerEnd).toString("utf8");
    const match = header.match(/^([0-9a-f]+) ([^ ]+) (\d+)$/);
    if (!match || match[1] !== requestedId) fail(`git cat-file returned an invalid header for ${requestedId}: ${header}.`);
    const size = Number(match[3]);
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + size;
    if (contentEnd >= output.length || output[contentEnd] !== 0x0a) fail(`git cat-file returned truncated content for ${requestedId}.`);
    contents.set(requestedId, output.subarray(contentStart, contentEnd));
    offset = contentEnd + 1;
  }
  if (offset !== output.length) fail("git cat-file returned unexpected trailing output.");
  return contents;
}

export function repositoryStateSha256(cwd, commit) {
  const hash = createHash("sha256");
  const entries = treeEntries(cwd, commit).filter((item) => !OUTPUT_PATHS.includes(item.path)).sort((left, right) => compareText(left.path, right.path));
  const contents = objectContents(cwd, entries);
  for (const entry of entries) {
    const content = contents.get(entry.object);
    if (!content) fail(`cannot read tracked object content for ${entry.path}.`);
    hash.update(entry.mode); hash.update("\0"); hash.update(entry.type); hash.update("\0"); hash.update(entry.path); hash.update("\0");
    hash.update(String(content.length)); hash.update("\0"); hash.update(content); hash.update("\0");
  }
  return hash.digest("hex");
}

function pathExists(entries, candidate) {
  const normalized = candidate.replace(/^\.\//, "").replace(/\/$/, "");
  return entries.some((entry) => entry.path === normalized || entry.path.startsWith(`${normalized}/`));
}

function parseRoute(route, label) {
  assertString(route, label);
  if (!route.startsWith("/") || (route.length > 1 && route.endsWith("/")) || route.includes("//") || /[?#\\\s]/.test(route)) fail(`${label} has malformed route ${route}.`);
  if (route === "/") return [];
  const segments = route.slice(1).split("/").map((segment, index, all) => {
    let match = segment.match(/^\[\[\.\.\.([A-Za-z][A-Za-z0-9_]*)\]\]$/);
    if (match) {
      if (index !== all.length - 1) fail(`${label} has a non-terminal optional catch-all in ${route}.`);
      return { kind: "optional-catchall", value: match[1] };
    }
    match = segment.match(/^\[\.\.\.([A-Za-z][A-Za-z0-9_]*)\]$/);
    if (match) {
      if (index !== all.length - 1) fail(`${label} has a non-terminal catch-all in ${route}.`);
      return { kind: "catchall", value: match[1] };
    }
    match = segment.match(/^\[([A-Za-z][A-Za-z0-9_]*)\]$/);
    if (match) return { kind: "dynamic", value: match[1] };
    if (!/^[A-Za-z0-9._~-]+$/.test(segment)) fail(`${label} has malformed route segment ${segment}.`);
    return { kind: "static", value: segment };
  });
  const parameterNames = segments.filter((segment) => segment.kind !== "static").map((segment) => segment.value);
  if (new Set(parameterNames).size !== parameterNames.length) fail(`${label} repeats a dynamic parameter in ${route}.`);
  return segments;
}

function appRoutePatterns(entries) {
  const patterns = [];
  for (const entry of entries) {
    const match = entry.path.match(/^app\/(.*\/)?page\.(?:js|jsx|ts|tsx)$/);
    if (!match) continue;
    const rawSegments = (match[1] ?? "").split("/").filter(Boolean);
    const routeSegments = [];
    for (const rawSegment of rawSegments) {
      if (rawSegment.startsWith("@") || /^\([^)]*\)$/.test(rawSegment)) continue;
      const segment = rawSegment.replace(/^(?:\(\.{1,3}\))+/, "");
      if (segment) routeSegments.push(segment);
    }
    const route = routeSegments.length ? `/${routeSegments.join("/")}` : "/";
    patterns.push({ route, segments: parseRoute(route, `evaluated App Router page ${entry.path}`) });
  }
  return patterns.sort((left, right) => compareText(left.route, right.route));
}

function minimumSegments(segments) {
  return segments.reduce((count, segment) => count + (segment.kind === "optional-catchall" ? 0 : 1), 0);
}

function appRouteCovers(appSegments, declaredSegments, appIndex = 0, declaredIndex = 0) {
  const appSegment = appSegments[appIndex];
  const declaredSegment = declaredSegments[declaredIndex];
  if (!appSegment) return !declaredSegment;
  if (appSegment.kind === "optional-catchall") return true;
  if (appSegment.kind === "catchall") return minimumSegments(declaredSegments.slice(declaredIndex)) >= 1;
  if (!declaredSegment || declaredSegment.kind === "catchall" || declaredSegment.kind === "optional-catchall") return false;
  if (appSegment.kind === "static" && (declaredSegment.kind !== "static" || appSegment.value !== declaredSegment.value)) return false;
  return appRouteCovers(appSegments, declaredSegments, appIndex + 1, declaredIndex + 1);
}

function normalizedRequirement(requirement) {
  const arrayFields = new Set(["routes", "route_families", "source_ledger_ids", "research_artifact_ids", "prerequisite_ids", "code_paths", "content_paths", "visual_ids", "test_commands", "gap_inventory_ids"]);
  return Object.fromEntries(Object.entries(requirement).map(([key, value]) => [key, arrayFields.has(key) ? stableStrings(value) : value]));
}

function normalizedSource(source) {
  const arrayFields = new Set(["applies_to", "claims_supported"]);
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, arrayFields.has(key) ? stableStrings(value) : value]));
}

function normalizedArtifact(artifact) {
  return { ...artifact, requirement_ids: stableStrings(artifact.requirement_ids) };
}

export function loadAndValidateModel(cwd, repositorySha) {
  const requirementsRoot = parseJson(snapshotFile(cwd, repositorySha, REQUIREMENTS_REGISTRY_PATH), REQUIREMENTS_REGISTRY_PATH);
  const sourcesRoot = parseJson(snapshotFile(cwd, repositorySha, SOURCES_REGISTRY_PATH), SOURCES_REGISTRY_PATH);
  const artifactsRoot = parseJson(snapshotFile(cwd, repositorySha, RESEARCH_ARTIFACTS_REGISTRY_PATH), RESEARCH_ARTIFACTS_REGISTRY_PATH);
  assertObject(requirementsRoot, "requirements registry");
  assertObject(sourcesRoot, "sources registry");
  assertObject(artifactsRoot, "research artifacts registry");
  assertOnlyKeys(requirementsRoot, new Set(["schema_version", "blueprint_version", "reviewed_at", "scope", "unmodeled_atomic_requirements", "requirements"]), "requirements registry");
  assertOnlyKeys(sourcesRoot, new Set(["schema_version", "reviewed_at", "sources"]), "sources registry");
  assertOnlyKeys(artifactsRoot, new Set(["schema_version", "reviewed_at", "artifacts"]), "research artifacts registry");
  if (requirementsRoot.schema_version !== 1 || sourcesRoot.schema_version !== 1 || artifactsRoot.schema_version !== 1) fail("all governance registries must use schema_version 1.");
  assertString(requirementsRoot.blueprint_version, "requirements registry blueprint_version");
  assertIsoDate(requirementsRoot.reviewed_at, "requirements registry reviewed_at");
  assertIsoDate(sourcesRoot.reviewed_at, "sources registry reviewed_at");
  assertIsoDate(artifactsRoot.reviewed_at, "research artifacts registry reviewed_at");
  if (requirementsRoot.reviewed_at !== sourcesRoot.reviewed_at || requirementsRoot.reviewed_at !== artifactsRoot.reviewed_at) fail("requirements, source, and research artifact registries must share the same reviewed_at value.");
  const scope = normalizeScope(requirementsRoot.scope);
  const unmodeled = normalizeUnmodeled(requirementsRoot.unmodeled_atomic_requirements);
  if (!Array.isArray(requirementsRoot.requirements)) fail("requirements registry requirements must be an array.");
  if (!Array.isArray(sourcesRoot.sources)) fail("sources registry sources must be an array.");
  if (!Array.isArray(artifactsRoot.artifacts)) fail("research artifacts registry artifacts must be an array.");
  requirementsRoot.requirements.forEach(validateRequirementShape);
  sourcesRoot.sources.forEach(validateSourceShape);
  artifactsRoot.artifacts.forEach(validateResearchArtifactShape);
  const requirements = requirementsRoot.requirements.map(normalizedRequirement).sort((left, right) => compareText(left.id, right.id));
  const sources = sourcesRoot.sources.map(normalizedSource).sort((left, right) => compareText(left.id, right.id));
  const artifacts = artifactsRoot.artifacts.map(normalizedArtifact).sort((left, right) => compareText(left.id, right.id));
  const requirementIds = new Set(requirements.map((item) => item.id));
  const sourceIds = new Set(sources.map((item) => item.id));
  const artifactIds = new Set(artifacts.map((item) => item.id));
  if (requirementIds.size !== requirements.length) fail("requirement IDs must be unique.");
  if (sourceIds.size !== sources.length) fail("source IDs must be unique.");
  if (artifactIds.size !== artifacts.length) fail("research artifact IDs must be unique.");
  const requiredArtifactById = new Map(REQUIRED_RESEARCH_ARTIFACTS.map((artifact) => [artifact.id, artifact]));
  if (artifactIds.size !== requiredArtifactById.size || [...artifactIds].some((id) => !requiredArtifactById.has(id))) fail("research artifacts registry must contain exactly the 30 Section 25.1 bootstrap artifact IDs.");
  for (const artifact of artifacts) {
    const requiredArtifact = requiredArtifactById.get(artifact.id);
    if (artifact.title !== requiredArtifact.title) fail(`${artifact.id} title must exactly match the Section 25.1 bootstrap title ${JSON.stringify(requiredArtifact.title)}.`);
    if (artifact.family_id !== requiredArtifact.familyId) fail(`${artifact.id} family_id must be ${requiredArtifact.familyId}.`);
  }
  if (new Set(unmodeled.map((item) => item.id)).size !== unmodeled.length) fail("unmodeled atomic requirement IDs must be unique.");
  for (const item of unmodeled) if (requirementIds.has(item.id)) fail(`unmodeled atomic requirement ${item.id} collides with a modeled requirement ID.`);
  for (const family of REQUIRED_FAMILIES) if (!requirementIds.has(family)) fail(`requirements registry is missing exact required family root ${family}.`);
  for (const requirement of requirements) {
    for (const prerequisite of requirement.prerequisite_ids) if (!requirementIds.has(prerequisite)) fail(`${requirement.id} references unknown prerequisite ${prerequisite}.`);
    for (const sourceId of requirement.source_ledger_ids) {
      if (!sourceIds.has(sourceId)) fail(`${requirement.id} references unknown source ${sourceId}.`);
      if (!sources.find((source) => source.id === sourceId).applies_to.includes(requirement.id)) fail(`${requirement.id} -> ${sourceId} is missing the reverse source applies_to link.`);
    }
    for (const artifactId of requirement.research_artifact_ids) {
      if (!artifactIds.has(artifactId)) fail(`${requirement.id} references unknown research artifact ${artifactId}.`);
      if (!artifacts.find((artifact) => artifact.id === artifactId).requirement_ids.includes(requirement.id)) fail(`${requirement.id} -> ${artifactId} is missing the reverse artifact requirement_ids link.`);
    }
    if (requirement.research_status === "not-applicable" && requirement.research_artifact_ids.length > 0) fail(`${requirement.id} cannot use research_status not-applicable while linked to research artifacts.`);
    if (requirement.research_status !== "not-applicable" && requirement.research_artifact_ids.length > 0) {
      const requirementLevel = RESEARCH_STATUS_LEVEL.get(requirement.research_status);
      for (const artifactId of requirement.research_artifact_ids) {
        const artifact = artifacts.find((item) => item.id === artifactId);
        const allowedLevel = ARTIFACT_APPROVAL_LEVEL.get(artifact.approval_status);
        if (requirementLevel > allowedLevel) fail(`${requirement.id} research_status ${requirement.research_status} overclaims linked artifact ${artifact.id} with approval_status ${artifact.approval_status}.`);
      }
    }
  }
  for (const source of sources) for (const requirementId of source.applies_to) {
    if (!requirementIds.has(requirementId)) fail(`${source.id} applies_to unknown requirement ${requirementId}.`);
    if (!requirements.find((item) => item.id === requirementId).source_ledger_ids.includes(source.id)) fail(`${source.id} -> ${requirementId} is missing the reverse requirement source_ledger_ids link.`);
  }
  for (const artifact of artifacts) {
    if (!REQUIRED_FAMILIES.includes(artifact.family_id) || !requirementIds.has(artifact.family_id)) fail(`${artifact.id} references unknown family root ${artifact.family_id}.`);
    for (const requirementId of artifact.requirement_ids) {
      if (!requirementIds.has(requirementId)) fail(`${artifact.id} references unknown requirement ${requirementId}.`);
      if (!requirements.find((item) => item.id === requirementId).research_artifact_ids.includes(artifact.id)) fail(`${artifact.id} -> ${requirementId} is missing the reverse requirement research_artifact_ids link.`);
    }
  }
  const visiting = new Set(); const visited = new Set();
  const visit = (id, ancestry = []) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) fail(`prerequisite cycle detected: ${[...ancestry, id].join(" -> ")}.`);
    visiting.add(id);
    for (const prerequisite of requirements.find((item) => item.id === id).prerequisite_ids) visit(prerequisite, [...ancestry, id]);
    visiting.delete(id); visited.add(id);
  };
  for (const requirement of requirements) visit(requirement.id);

  const entries = treeEntries(cwd, repositorySha);
  const routePatterns = appRoutePatterns(entries);
  const packageJson = parseJson(snapshotFile(cwd, repositorySha, "package.json"), "package.json");
  for (const requirement of requirements) {
    for (const candidate of [...requirement.code_paths, ...requirement.content_paths]) if (!pathExists(entries, candidate)) fail(`${requirement.id} references missing evaluated-snapshot path ${candidate}.`);
    for (const route of requirement.routes) {
      const declaredSegments = parseRoute(route, `${requirement.id}.routes`);
      if (declaredSegments.some((segment) => segment.kind !== "static")) fail(`${requirement.id}.routes must contain only concrete routes; move dynamic or catch-all patterns to route_families.`);
      if (!routePatterns.some((pattern) => appRouteCovers(pattern.segments, declaredSegments))) fail(`${requirement.id} references nonexistent evaluated App Router route ${route}.`);
    }
    for (const routeFamily of requirement.route_families) {
      const declaredSegments = parseRoute(routeFamily, `${requirement.id}.route_families`);
      if (!declaredSegments.some((segment) => segment.kind !== "static")) fail(`${requirement.id}.route_families must contain dynamic or catch-all patterns, not concrete routes.`);
      if (!routePatterns.some((pattern) => appRouteCovers(pattern.segments, declaredSegments))) fail(`${requirement.id} references nonexistent evaluated App Router route family ${routeFamily}.`);
    }
    for (const command of requirement.test_commands) {
      const match = command.match(/^npm run ([A-Za-z0-9:_-]+)$/);
      const script = match?.[1] ?? (packageJson.scripts?.[command] ? command : null);
      if (!script || !packageJson.scripts?.[script]) fail(`${requirement.id} references missing npm test command ${command}.`);
    }
  }
  for (const artifact of artifacts) if (artifact.repository_path && !pathExists(entries, artifact.repository_path)) fail(`${artifact.id} references missing evaluated-snapshot repository_path ${artifact.repository_path}.`);

  const inventoryIds = stableStrings(gapInventoryIds(snapshotFile(cwd, repositorySha, GAP_INVENTORY_PATH)));
  if (JSON.stringify(inventoryIds) !== JSON.stringify(scope.requiredGapIds)) fail("gap inventory IDs must exactly match bootstrap scope.required_gap_ids.");
  const expectedGapIds = new Set(scope.requiredGapIds);
  for (const requirement of requirements) for (const id of requirement.gap_inventory_ids) if (!expectedGapIds.has(id)) fail(`${requirement.id} references unknown gap inventory ID ${id}.`);
  for (const id of expectedGapIds) {
    const modeled = requirements.filter((requirement) => requirement.id === id || requirement.gap_inventory_ids.includes(id)).length;
    const explicitlyUnmodeled = unmodeled.filter((item) => item.id === id).length;
    if (modeled + explicitlyUnmodeled !== 1) fail(`gap ${id} must be represented by exactly one requirement record or explicitly unmodeled entry; found ${modeled + explicitlyUnmodeled}.`);
  }

  return {
    schemaVersion: 1,
    blueprintVersion: requirementsRoot.blueprint_version,
    reviewedAt: requirementsRoot.reviewed_at,
    scope: scope.value,
    unmodeled,
    requirements,
    sources,
    artifacts,
    inventoryIds,
  };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, canonicalize(value[key])]));
}

function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function escapeCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r\n?|\n/g, " ");
}

function sourceRecordState(requirement, sourcesById) {
  if (requirement.research_status === "not-applicable") return "not-applicable";
  if (requirement.source_ledger_ids.length === 0) return "missing";
  const sources = requirement.source_ledger_ids.map((id) => sourcesById.get(id));
  return sources.some((source) => source.claims_supported.length > 0) ? "claim-recorded" : "discovery-recorded";
}

function renderCoverage(model, envelope) {
  const statuses = [...STATUSES];
  const priorities = [...PRIORITIES];
  const researchStatuses = [...RESEARCH_STATUSES];
  const publicationStatuses = [...PUBLICATION_STATUSES];
  const sourcesById = new Map(model.sources.map((source) => [source.id, source]));
  const sourceStates = new Map(model.requirements.map((requirement) => [requirement.id, sourceRecordState(requirement, sourcesById)]));
  const priorityRecords = [...model.requirements.map((item) => ({ ...item, recordType: "modeled" })), ...model.unmodeled.map((item) => ({ ...item, recordType: "unmodeled" }))];
  const familyCounts = REQUIRED_FAMILIES.map((family) => ({
    family,
    modeled: model.requirements.filter((item) => familyFor(item.id) === family).length,
    unmodeled: model.unmodeled.filter((item) => familyFor(item.id) === family).length,
  }));
  const sectionNames = stableStrings(new Set(priorityRecords.map((item) => item.section)));
  const lines = [
    "---",
    `schema_version: ${envelope.schema_version}`,
    `blueprint_version: ${envelope.blueprint_version}`,
    `generated_or_reviewed_at: ${envelope.generated_or_reviewed_at}`,
    `repository_sha: ${envelope.repository_sha}`,
    `repository_state_sha256: ${envelope.repository_state_sha256}`,
    "---", "", "# Engineering Foundry requirement coverage", "",
    "> Generated from the versioned requirement and source registries. Do not edit this file directly.", "",
    "## Summary", "",
    `- Requirements: ${model.requirements.length}`,
    `- Sources: ${model.sources.length}`,
    `- Gap inventory IDs: ${model.inventoryIds.length}`,
    `- Explicitly unmodeled atomic requirements: ${model.unmodeled.length}`, "",
    "### Modeled implementation status", "",
    "| Status | Count |", "| --- | ---: |",
    ...statuses.map((status) => `| ${status} | ${model.requirements.filter((item) => item.status === status).length} |`), "",
    "### Priority/disposition across modeled and unmodeled records", "", "| Priority | Modeled | Unmodeled | Total |", "| --- | ---: | ---: | ---: |",
    ...priorities.map((priority) => {
      const modeled = model.requirements.filter((item) => item.priority === priority).length;
      const unmodeled = model.unmodeled.filter((item) => item.priority === priority).length;
      return `| ${priority} | ${modeled} | ${unmodeled} | ${modeled + unmodeled} |`;
    }), "",
    "### Research status", "", "| Research status | Count |", "| --- | ---: |",
    ...researchStatuses.map((status) => `| ${status} | ${model.requirements.filter((item) => item.research_status === status).length} |`), "",
    "### Publication status", "", "| Publication status | Count |", "| --- | ---: |",
    ...publicationStatuses.map((status) => `| ${status} | ${model.requirements.filter((item) => item.publication_status === status).length} |`), "",
    "## Requirements by family", "", "| Family | Modeled | Unmodeled | Total |", "| --- | ---: | ---: | ---: |",
    ...familyCounts.map(({ family, modeled, unmodeled }) => `| ${family} | ${modeled} | ${unmodeled} | ${modeled + unmodeled} |`), "",
    "## Requirements by section", "", "| Section | Modeled | Unmodeled | Total |", "| --- | ---: | ---: | ---: |",
    ...sectionNames.map((section) => {
      const modeled = model.requirements.filter((item) => item.section === section).length;
      const unmodeled = model.unmodeled.filter((item) => item.section === section).length;
      return `| ${escapeCell(section)} | ${modeled} | ${unmodeled} | ${modeled + unmodeled} |`;
    }), "",
    "## Requirement inventory", "",
    "| ID | Section | Priority | Status | Research | Publication | Source state | Routes | Route families | Sources | Tests | Gaps |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |",
    ...model.requirements.map((item) => `| ${escapeCell(item.id)} | ${escapeCell(item.section)} | ${escapeCell(item.priority)} | ${escapeCell(item.status)} | ${escapeCell(item.research_status)} | ${escapeCell(item.publication_status)} | ${sourceStates.get(item.id)} | ${escapeCell(item.routes.join(", "))} | ${escapeCell(item.route_families.join(", "))} | ${item.source_ledger_ids.length} | ${item.test_commands.length} | ${escapeCell(item.known_gaps.join("; "))} |`), "",
    "## Required blockers", "",
  ];
  const blockers = priorityRecords.filter((item) => item.priority === "required" && (item.recordType === "unmodeled" || item.status !== "implemented"));
  if (blockers.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Record type | Status | Gap/reason |", "| --- | --- | --- | --- |");
    for (const item of blockers) lines.push(`| ${escapeCell(item.id)} | ${item.recordType} | ${escapeCell(item.status ?? "unmodeled")} | ${escapeCell(item.recordType === "unmodeled" ? item.reason : item.known_gaps.join("; ") || "Not yet implemented")} |`);
    lines.push("");
  }
  const p1Items = priorityRecords.filter((item) => item.priority === "p1" && (item.recordType === "unmodeled" || item.status !== "implemented"));
  lines.push("## P1 blockers and dispositions", "");
  if (p1Items.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Record type | Status | Gap/reason |", "| --- | --- | --- | --- |");
    for (const item of p1Items) lines.push(`| ${escapeCell(item.id)} | ${item.recordType} | ${escapeCell(item.status ?? "unmodeled")} | ${escapeCell(item.recordType === "unmodeled" ? item.reason : item.known_gaps.join("; ") || "Not yet implemented")} |`);
    lines.push("");
  }
  const staleItems = model.requirements.filter((item) => item.publication_status === "stale-review");
  lines.push("## Stale-review items", "");
  if (staleItems.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Section | Research status | Sources |", "| --- | --- | --- | ---: |");
    for (const item of staleItems) lines.push(`| ${item.id} | ${escapeCell(item.section)} | ${item.research_status} | ${item.source_ledger_ids.length} |`);
    lines.push("");
  }
  const externalOrBlocked = priorityRecords.filter((item) => item.priority === "external-owner-gate" || item.status === "blocked");
  const externalOrBlockedIds = new Set(externalOrBlocked.map((item) => item.id));
  lines.push("## External owner gates and blocked items", "");
  if (externalOrBlocked.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Record type | Priority | Status | Gap/reason |", "| --- | --- | --- | --- | --- |");
    for (const item of externalOrBlocked) lines.push(`| ${escapeCell(item.id)} | ${item.recordType} | ${item.priority} | ${escapeCell(item.status ?? "unmodeled")} | ${escapeCell(item.recordType === "unmodeled" ? item.reason : item.known_gaps.join("; "))} |`);
    lines.push("");
  }
  const deferredOrExcluded = priorityRecords.filter((item) => !externalOrBlockedIds.has(item.id) && (item.status === "deferred" || item.status === "excluded" || item.priority === "excluded"));
  lines.push("## Deferred and excluded items", "");
  if (deferredOrExcluded.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Record type | Priority | Status |", "| --- | --- | --- | --- |");
    for (const item of deferredOrExcluded) lines.push(`| ${escapeCell(item.id)} | ${item.recordType} | ${item.priority} | ${escapeCell(item.status ?? "unmodeled")} |`);
    lines.push("");
  }
  lines.push("## Source record states", "", "These states describe recorded provenance only; they do not claim source completeness.", "", "| Source record state | Count |", "| --- | ---: |");
  for (const state of ["not-applicable", "missing", "discovery-recorded", "claim-recorded"]) lines.push(`| ${state} | ${[...sourceStates.values()].filter((value) => value === state).length} |`);
  lines.push("", "| Requirement | Research status | Source state | Source IDs |", "| --- | --- | --- | --- |");
  for (const item of model.requirements) lines.push(`| ${item.id} | ${item.research_status} | ${sourceStates.get(item.id)} | ${escapeCell(item.source_ledger_ids.join(", "))} |`);
  lines.push("");
  lines.push("## Explicitly unmodeled atomic requirements", "");
  if (model.unmodeled.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Family | Section | Priority | Reason |", "| --- | --- | --- | --- | --- |");
    for (const item of model.unmodeled) lines.push(`| ${escapeCell(item.id)} | ${familyFor(item.id)} | ${escapeCell(item.section)} | ${item.priority} | ${escapeCell(item.reason)} |`);
    lines.push("");
  }
  lines.push("## Source records", "", "| ID | Class | Verified | Applies to |", "| --- | --- | --- | --- |");
  for (const source of model.sources) lines.push(`| ${escapeCell(source.id)} | ${escapeCell(source.source_class)} | ${escapeCell(source.verified_at)} | ${escapeCell(source.applies_to.join(", "))} |`);
  if (model.sources.length === 0) lines.push("| — | — | — | — |");
  lines.push("");
  lines.push("## Research artifact inputs", "", "### Availability", "", "| Availability | Count |", "| --- | ---: |");
  for (const availability of ARTIFACT_AVAILABILITIES) lines.push(`| ${availability} | ${model.artifacts.filter((item) => item.availability === availability).length} |`);
  lines.push("", "### Approval status", "", "| Approval status | Count |", "| --- | ---: |");
  for (const approval of ARTIFACT_APPROVAL_STATUSES) lines.push(`| ${approval} | ${model.artifacts.filter((item) => item.approval_status === approval).length} |`);
  lines.push("", "| ID | Family | Availability | Approval | Version/hash | Verified | Requirements | Repository path | External record |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const artifact of model.artifacts) lines.push(`| ${escapeCell(artifact.id)} | ${artifact.family_id} | ${artifact.availability} | ${artifact.approval_status} | ${escapeCell(artifact.version_or_hash)} | ${escapeCell(artifact.verified_at)} | ${escapeCell(artifact.requirement_ids.join(", "))} | ${escapeCell(artifact.repository_path)} | ${escapeCell(artifact.external_record)} |`);
  if (model.artifacts.length === 0) lines.push("| — | — | — | — | — | — | — | — | — |");
  const unresolvedArtifacts = model.artifacts.filter((artifact) => artifact.approval_status !== "excluded" && (artifact.availability === "missing" || artifact.approval_status !== "approved"));
  lines.push("", "## Unresolved research artifact inputs", "");
  if (unresolvedArtifacts.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Availability | Approval |", "| --- | --- | --- |");
    for (const artifact of unresolvedArtifacts) lines.push(`| ${escapeCell(artifact.id)} | ${artifact.availability} | ${artifact.approval_status} |`);
    lines.push("");
  }
  return lines.join("\n");
}

export function buildGovernanceArtifacts(cwd, repositorySha) {
  resolveCommit(cwd, repositorySha);
  const model = loadAndValidateModel(cwd, repositorySha);
  const digest = repositoryStateSha256(cwd, repositorySha);
  const envelope = {
    schema_version: model.schemaVersion,
    blueprint_version: model.blueprintVersion,
    generated_or_reviewed_at: model.reviewedAt,
    repository_sha: repositorySha,
    repository_state_sha256: digest,
  };
  const manifest = { ...envelope, scope: model.scope, unmodeled_atomic_requirements: model.unmodeled, research_artifacts: model.artifacts, requirements: model.requirements };
  const ledger = { ...envelope, sources: model.sources };
  return {
    repositorySha,
    repositoryStateSha256: digest,
    model,
    files: new Map([
      [MANIFEST_PATH, canonicalJson(manifest)],
      [LEDGER_PATH, canonicalJson(ledger)],
      [COVERAGE_PATH, renderCoverage(model, envelope)],
    ]),
  };
}

export function writeGovernanceArtifacts(cwd, repositorySha) {
  const status = gitBuffer(cwd, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (status.length) fail("generation requires a clean working tree so only the three generated outputs can change.");
  const result = buildGovernanceArtifacts(cwd, repositorySha);
  for (const [file, contents] of result.files) {
    const destination = path.join(cwd, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, contents);
  }
  const changed = gitBuffer(cwd, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]).toString("utf8").split("\0").filter(Boolean).map((entry) => entry.slice(3)).sort();
  if (changed.some((file) => !OUTPUT_PATHS.includes(file))) fail(`generator changed an unauthorized path: ${changed.join(", ")}.`);
  return { ...result, changed };
}

function parseCoverageEnvelope(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) fail(`${COVERAGE_PATH} is missing deterministic metadata front matter.`);
  const values = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 1) fail(`${COVERAGE_PATH} has invalid metadata line ${line}.`);
    values[line.slice(0, separator)] = line.slice(separator + 1).trim();
  }
  return values;
}

function changedPaths(cwd, parent, commit) {
  return gitBuffer(cwd, ["diff", "--name-only", "-z", parent, commit, "--"]).toString("utf8").split("\0").filter(Boolean).sort();
}

function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function findMetadataCommit(cwd, head, repositorySha) {
  const lines = git(cwd, ["rev-list", "--parents", head]).split("\n").filter(Boolean);
  const matches = [];
  for (const line of lines) {
    const [commit, firstParent, ...otherParents] = line.split(" ");
    if (firstParent !== repositorySha || otherParents.length > 0) continue;
    if (!sameStrings(changedPaths(cwd, repositorySha, commit), [...OUTPUT_PATHS].sort())) continue;
    const blobsMatch = OUTPUT_PATHS.every((file) => git(cwd, ["rev-parse", `${commit}:${file}`]) === git(cwd, ["rev-parse", `${head}:${file}`]));
    if (blobsMatch) matches.push(commit);
  }
  if (matches.length !== 1) fail(`expected exactly one reachable output-only metadata commit with first parent ${repositorySha}; found ${matches.length}.`);
  return matches[0];
}

export function validateCommittedGovernance(cwd = process.cwd()) {
  const head = git(cwd, ["rev-parse", "HEAD"]);
  for (const file of OUTPUT_PATHS) if (!existsSync(path.join(cwd, file))) fail(`missing committed output ${file}.`);
  const manifestText = readFileSync(path.join(cwd, MANIFEST_PATH), "utf8");
  const ledgerText = readFileSync(path.join(cwd, LEDGER_PATH), "utf8");
  const coverageText = readFileSync(path.join(cwd, COVERAGE_PATH), "utf8");
  const manifest = parseJson(manifestText, MANIFEST_PATH);
  const ledger = parseJson(ledgerText, LEDGER_PATH);
  const coverage = parseCoverageEnvelope(coverageText);
  const shared = [manifest, ledger, coverage];
  for (const field of ["schema_version", "blueprint_version", "generated_or_reviewed_at", "repository_sha", "repository_state_sha256"]) {
    const values = shared.map((item) => String(item[field]));
    if (!values.every((value) => value === values[0])) fail(`${field} must match across manifest, source ledger, and coverage report.`);
  }
  if (!DIGEST_PATTERN.test(manifest.repository_state_sha256)) fail("repository_state_sha256 must be a lowercase SHA-256 digest.");
  const repositorySha = resolveCommit(cwd, manifest.repository_sha);
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", repositorySha, head], { cwd, stdio: "ignore" });
  } catch {
    fail(`evaluated repository_sha ${repositorySha} is not an ancestor of HEAD ${head}.`);
  }
  const expected = buildGovernanceArtifacts(cwd, repositorySha);
  if (expected.repositoryStateSha256 !== manifest.repository_state_sha256) fail("committed repository_state_sha256 does not match the evaluated repository_sha.");
  const currentDigest = repositoryStateSha256(cwd, head);
  if (currentDigest !== expected.repositoryStateSha256) fail(`coverage is stale: normalized tracked state at HEAD ${head} differs from evaluated ${repositorySha}. Regenerate after committing ordinary changes.`);
  for (const [file, contents] of expected.files) {
    const actual = readFileSync(path.join(cwd, file), "utf8");
    if (actual !== contents) fail(`${file} is stale or hand-edited; regenerate it deterministically.`);
    const committed = snapshotFile(cwd, head, file);
    if (committed !== actual) fail(`${file} differs from its committed HEAD blob.`);
  }
  const metadataCommit = findMetadataCommit(cwd, head, repositorySha);
  return { head, repositorySha, repositoryStateSha256: currentDigest, metadataCommit, requirementCount: expected.model.requirements.length, sourceCount: expected.model.sources.length };
}

export function currentHead(cwd = process.cwd()) {
  return git(cwd, ["rev-parse", "HEAD"]);
}
