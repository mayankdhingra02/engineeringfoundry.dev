import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const REQUIREMENTS_REGISTRY_PATH = "docs/product-blueprint/registry/requirements.json";
export const SOURCES_REGISTRY_PATH = "docs/product-blueprint/registry/sources.json";
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

const PRIORITIES = new Set(["required", "p1", "p2", "requires-founder-approval", "requires-new-research", "external-owner-gate", "excluded"]);
const STATUSES = new Set(["not-started", "placeholder", "partial", "implemented-unverified", "implemented", "blocked", "deferred", "excluded"]);
const RESEARCH_STATUSES = new Set(["approved", "approved-needs-source-import", "needs-current-verification", "needs-research", "not-applicable"]);
const PUBLICATION_STATUSES = new Set(["unpublished", "noindex-draft", "published", "stale-review", "archived"]);
const SOURCE_CLASSES = new Set([
  "standard / RFC", "original paper", "official documentation", "first-party engineering/science",
  "official company hiring/candidate", "institutional/career center", "candidate-reported",
  "respected secondary synthesis", "pedagogy/pain-point source", "Engineering Foundry editorial inference",
]);
const SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;

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
    if (typeof item === "string") {
      assertString(item, `unmodeled_atomic_requirements[${index}]`);
      return { id: item, reason: "Not yet modeled during governance bootstrap." };
    }
    assertObject(item, `unmodeled_atomic_requirements[${index}]`);
    assertString(item.id, `unmodeled_atomic_requirements[${index}].id`);
    assertString(item.reason, `unmodeled_atomic_requirements[${index}].reason`);
    if (!familyFor(item.id)) fail(`unmodeled atomic requirement ${item.id} does not belong to a registered EF family.`);
    return Object.fromEntries(Object.entries(item).sort(([left], [right]) => compareText(left, right)));
  }).sort((left, right) => compareText(left.id, right.id));
}

function validateRequirementShape(requirement, index) {
  const label = `requirements[${index}]`;
  assertObject(requirement, label);
  const allowed = new Set([
    "id", "section", "kind", "title", "priority", "status", "research_status", "publication_status",
    "routes", "source_ledger_ids", "prerequisite_ids", "code_paths", "content_paths", "visual_ids",
    "test_commands", "acceptance_criteria", "known_gaps", "owner", "last_verified_at", "notes",
    "gap_inventory_ids",
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
  if (requirement.gap_inventory_ids === undefined) requirement.gap_inventory_ids = [];
  assertStringArray(requirement.gap_inventory_ids, `${requirement.id}.gap_inventory_ids`);
  for (const route of requirement.routes) if (!route.startsWith("/") || /[?#\s]/.test(route)) fail(`${requirement.id} has invalid public route ${route}.`);
  assertString(requirement.owner, `${requirement.id}.owner`, { nullable: true });
  assertIsoDate(requirement.last_verified_at, `${requirement.id}.last_verified_at`, { nullable: true });
  assertString(requirement.notes, `${requirement.id}.notes`, { nullable: true });
  if (requirement.acceptance_criteria.length === 0) fail(`${requirement.id} must have at least one acceptance criterion.`);
  if (requirement.status === "implemented" && requirement.test_commands.length === 0) fail(`${requirement.id} cannot be implemented without a test command.`);
  if (requirement.status === "implemented" && requirement.known_gaps.length > 0) fail(`${requirement.id} cannot be implemented while known gaps remain.`);
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
  let output;
  try {
    output = execFileSync("git", ["cat-file", "--batch"], {
      cwd,
      encoding: "buffer",
      input: Buffer.from(`${objectIds.join("\n")}\n`),
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

function normalizedRequirement(requirement) {
  const arrayFields = new Set(["routes", "source_ledger_ids", "prerequisite_ids", "code_paths", "content_paths", "visual_ids", "test_commands", "gap_inventory_ids"]);
  return Object.fromEntries(Object.entries(requirement).map(([key, value]) => [key, arrayFields.has(key) ? stableStrings(value) : value]));
}

function normalizedSource(source) {
  const arrayFields = new Set(["applies_to", "claims_supported"]);
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, arrayFields.has(key) ? stableStrings(value) : value]));
}

export function loadAndValidateModel(cwd, repositorySha) {
  const requirementsRoot = parseJson(snapshotFile(cwd, repositorySha, REQUIREMENTS_REGISTRY_PATH), REQUIREMENTS_REGISTRY_PATH);
  const sourcesRoot = parseJson(snapshotFile(cwd, repositorySha, SOURCES_REGISTRY_PATH), SOURCES_REGISTRY_PATH);
  assertObject(requirementsRoot, "requirements registry");
  assertObject(sourcesRoot, "sources registry");
  assertOnlyKeys(requirementsRoot, new Set(["schema_version", "blueprint_version", "reviewed_at", "scope", "unmodeled_atomic_requirements", "requirements"]), "requirements registry");
  assertOnlyKeys(sourcesRoot, new Set(["schema_version", "reviewed_at", "sources"]), "sources registry");
  if (requirementsRoot.schema_version !== 1 || sourcesRoot.schema_version !== 1) fail("both registries must use schema_version 1.");
  assertString(requirementsRoot.blueprint_version, "requirements registry blueprint_version");
  assertIsoDate(requirementsRoot.reviewed_at, "requirements registry reviewed_at");
  assertIsoDate(sourcesRoot.reviewed_at, "sources registry reviewed_at");
  if (requirementsRoot.reviewed_at !== sourcesRoot.reviewed_at) fail("requirements and source registries must share the same reviewed_at value.");
  const scope = normalizeScope(requirementsRoot.scope);
  const unmodeled = normalizeUnmodeled(requirementsRoot.unmodeled_atomic_requirements);
  if (!Array.isArray(requirementsRoot.requirements)) fail("requirements registry requirements must be an array.");
  if (!Array.isArray(sourcesRoot.sources)) fail("sources registry sources must be an array.");
  requirementsRoot.requirements.forEach(validateRequirementShape);
  sourcesRoot.sources.forEach(validateSourceShape);
  const requirements = requirementsRoot.requirements.map(normalizedRequirement).sort((left, right) => compareText(left.id, right.id));
  const sources = sourcesRoot.sources.map(normalizedSource).sort((left, right) => compareText(left.id, right.id));
  const requirementIds = new Set(requirements.map((item) => item.id));
  const sourceIds = new Set(sources.map((item) => item.id));
  if (requirementIds.size !== requirements.length) fail("requirement IDs must be unique.");
  if (sourceIds.size !== sources.length) fail("source IDs must be unique.");
  if (new Set(unmodeled.map((item) => item.id)).size !== unmodeled.length) fail("unmodeled atomic requirement IDs must be unique.");
  for (const family of REQUIRED_FAMILIES) if (!requirements.some((item) => familyFor(item.id) === family)) fail(`requirements registry does not represent required family ${family}.`);
  for (const requirement of requirements) {
    for (const prerequisite of requirement.prerequisite_ids) if (!requirementIds.has(prerequisite)) fail(`${requirement.id} references unknown prerequisite ${prerequisite}.`);
    for (const sourceId of requirement.source_ledger_ids) {
      if (!sourceIds.has(sourceId)) fail(`${requirement.id} references unknown source ${sourceId}.`);
      if (!sources.find((source) => source.id === sourceId).applies_to.includes(requirement.id)) fail(`${requirement.id} -> ${sourceId} is missing the reverse source applies_to link.`);
    }
  }
  for (const source of sources) for (const requirementId of source.applies_to) {
    if (!requirementIds.has(requirementId)) fail(`${source.id} applies_to unknown requirement ${requirementId}.`);
    if (!requirements.find((item) => item.id === requirementId).source_ledger_ids.includes(source.id)) fail(`${source.id} -> ${requirementId} is missing the reverse requirement source_ledger_ids link.`);
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
  const packageJson = parseJson(snapshotFile(cwd, repositorySha, "package.json"), "package.json");
  for (const requirement of requirements) {
    for (const candidate of [...requirement.code_paths, ...requirement.content_paths]) if (!pathExists(entries, candidate)) fail(`${requirement.id} references missing evaluated-snapshot path ${candidate}.`);
    for (const command of requirement.test_commands) {
      const match = command.match(/^npm run ([A-Za-z0-9:_-]+)$/);
      const script = match?.[1] ?? (packageJson.scripts?.[command] ? command : null);
      if (!script || !packageJson.scripts?.[script]) fail(`${requirement.id} references missing npm test command ${command}.`);
    }
  }

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
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function sourceState(requirement, sourcesById) {
  if (requirement.research_status === "not-applicable") return "source-complete";
  if (requirement.source_ledger_ids.length === 0) return "missing";
  const sources = requirement.source_ledger_ids.map((id) => sourcesById.get(id));
  if (requirement.research_status === "approved" && sources.every((source) => source.claims_supported.length > 0)) return "source-complete";
  return "unresolved";
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts].sort(([left], [right]) => compareText(left, right));
}

function renderCoverage(model, envelope) {
  const statuses = [...STATUSES];
  const priorities = [...PRIORITIES];
  const researchStatuses = [...RESEARCH_STATUSES];
  const publicationStatuses = [...PUBLICATION_STATUSES];
  const sourcesById = new Map(model.sources.map((source) => [source.id, source]));
  const sourceStates = new Map(model.requirements.map((requirement) => [requirement.id, sourceState(requirement, sourcesById)]));
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
    "### Implementation status", "",
    "| Status | Count |", "| --- | ---: |",
    ...statuses.map((status) => `| ${status} | ${model.requirements.filter((item) => item.status === status).length} |`), "",
    "### Priority/disposition", "", "| Priority | Count |", "| --- | ---: |",
    ...priorities.map((priority) => `| ${priority} | ${model.requirements.filter((item) => item.priority === priority).length} |`), "",
    "### Research status", "", "| Research status | Count |", "| --- | ---: |",
    ...researchStatuses.map((status) => `| ${status} | ${model.requirements.filter((item) => item.research_status === status).length} |`), "",
    "### Publication status", "", "| Publication status | Count |", "| --- | ---: |",
    ...publicationStatuses.map((status) => `| ${status} | ${model.requirements.filter((item) => item.publication_status === status).length} |`), "",
    "## Requirements by family", "", "| Family | Count |", "| --- | ---: |",
    ...countBy(model.requirements, (item) => familyFor(item.id)).map(([family, count]) => `| ${family} | ${count} |`), "",
    "## Requirements by section", "", "| Section | Count |", "| --- | ---: |",
    ...countBy(model.requirements, (item) => item.section).map(([section, count]) => `| ${escapeCell(section)} | ${count} |`), "",
    "## Requirement inventory", "",
    "| ID | Section | Priority | Status | Research | Publication | Source state | Routes | Sources | Tests | Gaps |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |",
    ...model.requirements.map((item) => `| ${escapeCell(item.id)} | ${escapeCell(item.section)} | ${escapeCell(item.priority)} | ${escapeCell(item.status)} | ${escapeCell(item.research_status)} | ${escapeCell(item.publication_status)} | ${sourceStates.get(item.id)} | ${escapeCell(item.routes.join(", "))} | ${item.source_ledger_ids.length} | ${item.test_commands.length} | ${escapeCell(item.known_gaps.join("; "))} |`), "",
    "## Required blockers", "",
  ];
  const blockers = model.requirements.filter((item) => item.priority === "required" && item.status !== "implemented");
  if (blockers.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Status | Known gaps |", "| --- | --- | --- |");
    for (const item of blockers) lines.push(`| ${escapeCell(item.id)} | ${escapeCell(item.status)} | ${escapeCell(item.known_gaps.join("; ") || "Not yet implemented")} |`);
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
  const externalOrBlocked = model.requirements.filter((item) => item.priority === "external-owner-gate" || item.status === "blocked");
  const externalOrBlockedIds = new Set(externalOrBlocked.map((item) => item.id));
  lines.push("## External owner gates and blocked items", "");
  if (externalOrBlocked.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Priority | Status | Known gaps |", "| --- | --- | --- | --- |");
    for (const item of externalOrBlocked) lines.push(`| ${item.id} | ${item.priority} | ${item.status} | ${escapeCell(item.known_gaps.join("; "))} |`);
    lines.push("");
  }
  const deferredOrExcluded = model.requirements.filter((item) => !externalOrBlockedIds.has(item.id) && (item.status === "deferred" || item.status === "excluded" || item.priority === "excluded"));
  lines.push("## Deferred and excluded items", "");
  if (deferredOrExcluded.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Priority | Status |", "| --- | --- | --- |");
    for (const item of deferredOrExcluded) lines.push(`| ${item.id} | ${item.priority} | ${item.status} |`);
    lines.push("");
  }
  lines.push("## Source completeness", "", "| Source state | Count |", "| --- | ---: |");
  for (const state of ["source-complete", "missing", "unresolved"]) lines.push(`| ${state} | ${[...sourceStates.values()].filter((value) => value === state).length} |`);
  lines.push("", "| Requirement | Research status | Source state | Source IDs |", "| --- | --- | --- | --- |");
  for (const item of model.requirements) lines.push(`| ${item.id} | ${item.research_status} | ${sourceStates.get(item.id)} | ${escapeCell(item.source_ledger_ids.join(", "))} |`);
  lines.push("");
  lines.push("## Explicitly unmodeled atomic requirements", "");
  if (model.unmodeled.length === 0) lines.push("None.", "");
  else {
    lines.push("| ID | Reason |", "| --- | --- |");
    for (const item of model.unmodeled) lines.push(`| ${escapeCell(item.id)} | ${escapeCell(item.reason)} |`);
    lines.push("");
  }
  lines.push("## Source readiness", "", "| ID | Class | Verified | Applies to |", "| --- | --- | --- | --- |");
  for (const source of model.sources) lines.push(`| ${escapeCell(source.id)} | ${escapeCell(source.source_class)} | ${escapeCell(source.verified_at)} | ${escapeCell(source.applies_to.join(", "))} |`);
  if (model.sources.length === 0) lines.push("| — | — | — | — |");
  lines.push("");
  return `${lines.join("\n")}\n`;
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
  const manifest = { ...envelope, scope: model.scope, unmodeled_atomic_requirements: model.unmodeled, requirements: model.requirements };
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
