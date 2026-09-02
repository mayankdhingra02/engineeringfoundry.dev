import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  COVERAGE_PATH,
  REQUIRED_FAMILIES,
  REQUIRED_GAP_IDS,
  REQUIREMENTS_REGISTRY_PATH,
  SOURCES_REGISTRY_PATH,
  buildGovernanceArtifacts,
  repositoryStateSha256,
  validateCommittedGovernance,
  writeGovernanceArtifacts,
} from "./product-blueprint-governance.mjs";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const write = (cwd, file, contents) => {
  const destination = path.join(cwd, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
};
const commit = (cwd, message, extra = []) => {
  git(cwd, ["add", ...extra.length ? extra : ["."]]);
  git(cwd, ["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", message]);
  return git(cwd, ["rev-parse", "HEAD"]);
};

function requirement(id, gapInventoryIds = []) {
  return {
    id,
    section: id.split("-").slice(0, 2).join("-").toLowerCase(),
    kind: gapInventoryIds.length ? "content-gap" : "requirement-family",
    title: id,
    priority: "required",
    status: "partial",
    research_status: "needs-research",
    publication_status: "unpublished",
    routes: [],
    source_ledger_ids: [],
    prerequisite_ids: [],
    code_paths: [],
    content_paths: [],
    visual_ids: [],
    test_commands: [],
    acceptance_criteria: ["Remain explicitly represented until verified."],
    known_gaps: ["Governance bootstrap fixture."],
    owner: null,
    last_verified_at: null,
    notes: null,
    gap_inventory_ids: gapInventoryIds,
  };
}

function requirementsRegistry() {
  const requirements = [
    ...REQUIRED_FAMILIES.map((id) => requirement(id)),
    ...REQUIRED_GAP_IDS.map((id) => requirement(id, [id])),
  ];
  Object.assign(requirements.find((item) => item.id === "EF-COMP-GUIDE-COVERAGE"), {
    research_status: "needs-current-verification",
    publication_status: "stale-review",
  });
  Object.assign(requirements.find((item) => item.id === "EF-MOCK-PEER-FACILITATION"), {
    priority: "external-owner-gate",
    status: "blocked",
  });
  Object.assign(requirements.find((item) => item.id === "EF-AIB-BEGINNER-SCOPE"), {
    priority: "requires-founder-approval",
    status: "deferred",
  });
  Object.assign(requirements.find((item) => item.id === "EF-AIB-KIDS"), {
    priority: "excluded",
    status: "excluded",
  });
  return {
    schema_version: 1,
    blueprint_version: "1.0",
    reviewed_at: "2026-09-02",
    scope: {
      phase: "bootstrap",
      required_family_ids: REQUIRED_FAMILIES,
      required_gap_ids: REQUIRED_GAP_IDS,
    },
    unmodeled_atomic_requirements: [],
    requirements,
  };
}

function sourcesRegistry() {
  return { schema_version: 1, reviewed_at: "2026-09-02", sources: [] };
}

function gapInventory() {
  return [
    "# Fixture gap inventory", "", "| Gap ID | Section |", "| --- | --- |",
    ...REQUIRED_GAP_IDS.map((id) => `| \`${id}\` | Fixture |`), "",
  ].join("\n");
}

function createFixture() {
  const cwd = mkdtempSync(path.join(tmpdir(), "engineering-foundry-governance-"));
  git(cwd, ["init", "--quiet", "--initial-branch", "fixture"]);
  git(cwd, ["config", "user.name", "Governance Fixture"]);
  git(cwd, ["config", "user.email", "governance@example.invalid"]);
  write(cwd, "package.json", `${JSON.stringify({ scripts: { "test:fixture": "node fixture.mjs" } }, null, 2)}\n`);
  write(cwd, "fixture.mjs", "// fixture\n");
  write(cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(requirementsRegistry(), null, 2)}\n`);
  write(cwd, SOURCES_REGISTRY_PATH, `${JSON.stringify(sourcesRegistry(), null, 2)}\n`);
  write(cwd, "docs/public-v1-content-gap-inventory.md", gapInventory());
  const evaluated = commit(cwd, "test: add evaluated governance inputs");
  return { cwd, evaluated };
}

function commitGeneratedSnapshot(cwd, evaluated, { mixed = false } = {}) {
  const generated = writeGovernanceArtifacts(cwd, evaluated);
  assert.deepEqual(generated.changed.sort(), [
    "docs/product-blueprint/content-manifest.json",
    "docs/product-blueprint/generated/coverage.md",
    "docs/product-blueprint/source-ledger.json",
  ]);
  if (mixed) write(cwd, "ordinary-change.txt", "must make metadata topology invalid\n");
  return commit(cwd, mixed ? "test: mix output and ordinary change" : "test: add generated governance snapshot");
}

const staticScripts = STATIC_STEPS.filter((step) => step.command === "npm" && step.args[0] === "run").map((step) => step.args[1]);
assert.ok(staticScripts.includes("validate:product-blueprint"), "Static qualification must validate the committed blueprint snapshot.");
assert.ok(staticScripts.includes("test:product-blueprint-governance"), "Static qualification must run governance regression fixtures.");
assert.ok(!staticScripts.includes("report:product-blueprint-coverage"), "Static qualification must never mutate generated governance files.");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
for (const script of ["validate:product-blueprint", "report:product-blueprint-coverage", "test:product-blueprint-governance"]) assert.ok(packageJson.scripts[script], `package.json is missing ${script}.`);

const fixtureDirectories = [];
try {
  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    write(fixture.cwd, "large-tracked-fixture.bin", Buffer.alloc(1024 * 1024 + 257, 0x5a));
    const largeSnapshot = commit(fixture.cwd, "test: add blob larger than default maxBuffer");
    assert.match(repositoryStateSha256(fixture.cwd, largeSnapshot), /^[0-9a-f]{64}$/, "Normalized state hashing must support tracked blobs larger than Node's default maxBuffer.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const beforeTimezone = buildGovernanceArtifacts(fixture.cwd, fixture.evaluated);
    const coverage = beforeTimezone.files.get(COVERAGE_PATH);
    for (const heading of [
      "### Research status", "### Publication status", "## Requirements by family", "## Requirements by section",
      "## Stale-review items", "## External owner gates and blocked items", "## Deferred and excluded items", "## Source completeness",
    ]) assert.ok(coverage.includes(heading), `Coverage report is missing ${heading}.`);
    assert.match(coverage, /\| EF-COMP-GUIDE-COVERAGE \| ef-comp \| needs-current-verification \| 0 \|/, "Coverage must explicitly list stale-review requirements.");
    assert.match(coverage, /\| EF-MOCK-PEER-FACILITATION \| external-owner-gate \| blocked \|/, "Coverage must separate external/blocked requirements.");
    assert.match(coverage, /\| EF-AIB-KIDS \| excluded \| excluded \|/, "Coverage must separate deferred/excluded requirements.");
    assert.match(coverage, /\| missing \| \d+ \|/, "Coverage must count requirements with missing source support.");
    assert.ok(!/readiness percentage|overall completion percentage/i.test(coverage), "Coverage must not emit an aggregate readiness percentage.");
    const previousTimezone = process.env.TZ;
    process.env.TZ = "Pacific/Auckland";
    const afterTimezone = buildGovernanceArtifacts(fixture.cwd, fixture.evaluated);
    if (previousTimezone === undefined) delete process.env.TZ; else process.env.TZ = previousTimezone;
    assert.deepEqual([...afterTimezone.files], [...beforeTimezone.files], "Generation must be byte-identical across timezone changes.");

    const metadata = commitGeneratedSnapshot(fixture.cwd, fixture.evaluated);
    assert.equal(validateCommittedGovernance(fixture.cwd).metadataCommit, metadata, "Attached metadata HEAD must validate.");

    const originalCoverage = readFileSync(path.join(fixture.cwd, COVERAGE_PATH), "utf8");
    write(fixture.cwd, COVERAGE_PATH, `${originalCoverage}\nhand edit\n`);
    assert.throws(() => validateCommittedGovernance(fixture.cwd), /stale or hand-edited/, "A hand-edited generated report must fail.");
    write(fixture.cwd, COVERAGE_PATH, originalCoverage);

    git(fixture.cwd, ["checkout", "--quiet", "--detach", metadata]);
    assert.equal(validateCommittedGovernance(fixture.cwd).metadataCommit, metadata, "Detached metadata HEAD must validate without a branch name.");
    git(fixture.cwd, ["-c", "commit.gpgSign=false", "commit", "--quiet", "--allow-empty", "-m", "test: empty descendant"]);
    assert.equal(validateCommittedGovernance(fixture.cwd).metadataCommit, metadata, "An empty ordinary descendant must preserve the evaluated tracked state.");
    write(fixture.cwd, "ordinary-change.txt", "stale\n");
    commit(fixture.cwd, "test: add stale ordinary descendant");
    assert.throws(() => validateCommittedGovernance(fixture.cwd), /coverage is stale/, "Any non-output tracked change must make coverage stale.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const metadata = commitGeneratedSnapshot(fixture.cwd, fixture.evaluated);
    git(fixture.cwd, ["checkout", "--quiet", "-b", "merge-target", fixture.evaluated]);
    git(fixture.cwd, ["-c", "commit.gpgSign=false", "merge", "--quiet", "--no-ff", "-m", "test: merge metadata as second parent", metadata]);
    assert.equal(validateCommittedGovernance(fixture.cwd).metadataCommit, metadata, "A normal merge descendant must retain the output-only metadata commit.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    commitGeneratedSnapshot(fixture.cwd, fixture.evaluated, { mixed: true });
    assert.throws(() => validateCommittedGovernance(fixture.cwd), /coverage is stale|output-only metadata commit/, "A metadata commit mixed with ordinary changes must fail.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.requirements.find((item) => item.id === "EF-SD").prerequisite_ids = ["EF-ML"];
    registry.requirements.find((item) => item.id === "EF-ML").prerequisite_ids = ["EF-SD"];
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const cyclic = commit(fixture.cwd, "test: add prerequisite cycle");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, cyclic), /prerequisite cycle detected/, "Prerequisite cycles must fail production validation.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    const companyRequirement = registry.requirements.find((item) => item.id === "EF-COMP-GUIDE-COVERAGE");
    companyRequirement.research_status = "needs-current-verification";
    companyRequirement.source_ledger_ids = ["SRC-COMPANY-DISCOVERY"];
    const sources = sourcesRegistry();
    sources.sources.push({
      id: "SRC-COMPANY-DISCOVERY", title: "Company discovery seed", publisher: "Example Company",
      url: "https://example.invalid/careers", source_class: "official company hiring/candidate", published_at: null,
      verified_at: "2026-09-02", volatility: "volatile", applies_to: ["EF-COMP-GUIDE-COVERAGE"],
      claims_supported: [], usage_limits: "Identity and discovery metadata only until claim-level audit.", notes: null,
    });
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    write(fixture.cwd, SOURCES_REGISTRY_PATH, `${JSON.stringify(sources, null, 2)}\n`);
    const discoverySeed = commit(fixture.cwd, "test: add discovery-only source seed");
    const generated = buildGovernanceArtifacts(fixture.cwd, discoverySeed);
    const ledger = JSON.parse(generated.files.get("docs/product-blueprint/source-ledger.json"));
    assert.deepEqual(ledger.sources[0].claims_supported, [], "Discovery-only source seeds must retain an empty claims_supported array.");
    assert.equal(generated.model.requirements.find((item) => item.id === "EF-COMP-GUIDE-COVERAGE").research_status, "needs-current-verification", "A discovery-only seed must not promote research status.");
    assert.match(generated.files.get(COVERAGE_PATH), /\| EF-COMP-GUIDE-COVERAGE \| needs-current-verification \| unresolved \| SRC-COMPANY-DISCOVERY \|/, "A discovery-only seed must be reported as unresolved rather than source-complete.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.requirements.find((item) => item.id === "EF-SD").source_ledger_ids = ["SRC-FIXTURE"];
    const sources = sourcesRegistry();
    sources.sources.push({
      id: "SRC-FIXTURE", title: "Fixture", publisher: "Fixture", url: "https://example.invalid/source",
      source_class: "official documentation", published_at: null, verified_at: "2026-09-02", volatility: "stable",
      applies_to: [], claims_supported: ["Fixture claim"], usage_limits: "Fixture only", notes: null,
    });
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    write(fixture.cwd, SOURCES_REGISTRY_PATH, `${JSON.stringify(sources, null, 2)}\n`);
    const dangling = commit(fixture.cwd, "test: add one-way source reference");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, dangling), /missing the reverse source applies_to link/, "Source relations must be bidirectional.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    write(fixture.cwd, "docs/public-v1-content-gap-inventory.md", gapInventory().replace(`| \`${REQUIRED_GAP_IDS[0]}\` | Fixture |\n`, ""));
    const incomplete = commit(fixture.cwd, "test: omit one inventory gap");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, incomplete), /exactly match bootstrap scope.required_gap_ids/, "The public gap inventory must contain all 18 stable IDs.");
  }
} finally {
  for (const directory of fixtureDirectories) rmSync(directory, { recursive: true, force: true });
}

console.log("Product blueprint governance regression passed: deterministic generation, exact families/gaps, strict references, output-only topology, detached/merge portability, and stale-state detection hold.");
