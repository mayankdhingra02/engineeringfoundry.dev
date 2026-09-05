import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  COVERAGE_PATH,
  REQUIRED_FAMILIES,
  REQUIRED_GAP_IDS,
  REQUIRED_RESEARCH_ARTIFACTS,
  RESEARCH_ARTIFACTS_REGISTRY_PATH,
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
    research_artifact_ids: [],
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
  for (const artifact of REQUIRED_RESEARCH_ARTIFACTS) requirements.find((item) => item.id === artifact.familyId).research_artifact_ids.push(artifact.id);
  return {
    schema_version: 1,
    blueprint_version: "1.0",
    reviewed_at: "2026-09-02",
    scope: {
      phase: "bootstrap",
      required_family_ids: REQUIRED_FAMILIES,
      required_gap_ids: REQUIRED_GAP_IDS,
    },
    unmodeled_atomic_requirements: [
      { id: "EF-GLOBAL-ATOMIC-FIXTURE", section: "global", reason: "Required atomic fixture remains unmodeled.", priority: "required" },
      { id: "EF-SD-ATOMIC-FIXTURE", section: "system-design", reason: "P1 atomic fixture remains unmodeled.", priority: "p1" },
    ],
    requirements,
  };
}

function sourcesRegistry() {
  return { schema_version: 1, reviewed_at: "2026-09-02", sources: [] };
}

function researchArtifactsRegistry() {
  return {
    schema_version: 1,
    reviewed_at: "2026-09-02",
    artifacts: REQUIRED_RESEARCH_ARTIFACTS.map(({ id, title, familyId }) => ({
      id, title, family_id: familyId, requirement_ids: [familyId],
      repository_path: null, external_record: null, version_or_hash: null, availability: "missing",
      approval_status: "unverified", verified_at: null, notes: "Synthetic unresolved input.",
    })),
  };
}

function sourceRecord(id, { publishedAt = null, verifiedAt = "2026-09-02" } = {}) {
  return {
    id,
    title: `Fixture source ${id}`,
    publisher: "Fixture",
    url: `https://example.invalid/${id.toLowerCase()}`,
    source_class: "official documentation",
    published_at: publishedAt,
    verified_at: verifiedAt,
    volatility: "stable",
    applies_to: ["EF-COMP-GUIDE-COVERAGE"],
    claims_supported: [],
    usage_limits: "Fixture only.",
    notes: null,
  };
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
  write(cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(researchArtifactsRegistry(), null, 2)}\n`);
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
    const invalidCalendarCases = [
      {
        name: "requirements registry reviewed_at",
        expectedLabel: "requirements registry reviewed_at",
        mutate: (requirements) => { requirements.reviewed_at = "2026-02-29"; },
      },
      {
        name: "sources registry reviewed_at",
        expectedLabel: "sources registry reviewed_at",
        mutate: (_requirements, sources) => { sources.reviewed_at = "2026-04-31"; },
      },
      {
        name: "research artifacts registry reviewed_at",
        expectedLabel: "research artifacts registry reviewed_at",
        mutate: (_requirements, _sources, artifacts) => { artifacts.reviewed_at = "2026-09-02T24:00:00Z"; },
      },
      {
        name: "requirement last_verified_at",
        expectedLabel: "EF-GLOBAL.last_verified_at",
        mutate: (requirements) => { requirements.requirements.find((item) => item.id === "EF-GLOBAL").last_verified_at = "2026-02-30"; },
      },
      {
        name: "source published_at",
        expectedLabel: "SRC-INVALID-PUBLISHED.published_at",
        mutate: (requirements, sources) => {
          requirements.requirements.find((item) => item.id === "EF-COMP-GUIDE-COVERAGE").source_ledger_ids = ["SRC-INVALID-PUBLISHED"];
          sources.sources.push(sourceRecord("SRC-INVALID-PUBLISHED", { publishedAt: "2026-04-31" }));
        },
      },
      {
        name: "source verified_at",
        expectedLabel: "SRC-INVALID-VERIFIED.verified_at",
        mutate: (requirements, sources) => {
          requirements.requirements.find((item) => item.id === "EF-COMP-GUIDE-COVERAGE").source_ledger_ids = ["SRC-INVALID-VERIFIED"];
          sources.sources.push(sourceRecord("SRC-INVALID-VERIFIED", { verifiedAt: "2026-09-02T24:00:00Z" }));
        },
      },
      {
        name: "research artifact verified_at",
        expectedLabel: "RA-SD-CURRICULUM-TOPIC-MAP.verified_at",
        mutate: (_requirements, _sources, artifacts) => {
          artifacts.artifacts.find((item) => item.id === "RA-SD-CURRICULUM-TOPIC-MAP").verified_at = "2026-02-29";
        },
      },
      {
        name: "noncanonical offset timestamp",
        expectedLabel: "requirements registry reviewed_at",
        mutate: (requirements) => { requirements.reviewed_at = "2026-09-02T12:34:56+00:00"; },
      },
      {
        name: "noncanonical fractional timestamp",
        expectedLabel: "sources registry reviewed_at",
        mutate: (_requirements, sources) => { sources.reviewed_at = "2026-09-02T12:34:56.1Z"; },
      },
    ];

    for (const invalidCase of invalidCalendarCases) {
      const requirements = requirementsRegistry();
      const sources = sourcesRegistry();
      const artifacts = researchArtifactsRegistry();
      invalidCase.mutate(requirements, sources, artifacts);
      write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(requirements, null, 2)}\n`);
      write(fixture.cwd, SOURCES_REGISTRY_PATH, `${JSON.stringify(sources, null, 2)}\n`);
      write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
      const invalidCalendar = commit(fixture.cwd, `test: reject invalid ${invalidCase.name}`);
      assert.throws(
        () => buildGovernanceArtifacts(fixture.cwd, invalidCalendar),
        (error) => error instanceof Error && error.message.includes(`${invalidCase.expectedLabel} must use YYYY-MM-DD, YYYY-MM-DDTHH:mm:ssZ, or YYYY-MM-DDTHH:mm:ss.SSSZ.`),
        `An invalid or noncanonical ${invalidCase.name} must fail canonical calendar validation.`,
      );
    }

    const requirements = requirementsRegistry();
    const sources = sourcesRegistry();
    const artifacts = researchArtifactsRegistry();
    requirements.reviewed_at = "2028-02-29";
    sources.reviewed_at = "2028-02-29";
    artifacts.reviewed_at = "2028-02-29";
    requirements.requirements.find((item) => item.id === "EF-GLOBAL").last_verified_at = "2028-02-29";
    const sourcedRequirement = requirements.requirements.find((item) => item.id === "EF-COMP-GUIDE-COVERAGE");
    sourcedRequirement.source_ledger_ids = ["SRC-VALID-DATED", "SRC-VALID-NULLABLE"];
    sources.sources.push(
      sourceRecord("SRC-VALID-DATED", { publishedAt: "2028-02-29T12:34:56.123Z", verifiedAt: "2028-02-29T23:59:59Z" }),
      sourceRecord("SRC-VALID-NULLABLE", { publishedAt: null, verifiedAt: "2028-02-29" }),
    );
    Object.assign(artifacts.artifacts.find((item) => item.id === "RA-SD-CURRICULUM-TOPIC-MAP"), {
      repository_path: "fixture.mjs",
      version_or_hash: "fixture-leap-day",
      availability: "repository-present",
      verified_at: "2028-02-29T12:34:56.123Z",
    });
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(requirements, null, 2)}\n`);
    write(fixture.cwd, SOURCES_REGISTRY_PATH, `${JSON.stringify(sources, null, 2)}\n`);
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const validCalendar = commit(fixture.cwd, "test: accept canonical leap-day and nullable dates");
    assert.doesNotThrow(
      () => buildGovernanceArtifacts(fixture.cwd, validCalendar),
      "Canonical leap-day dates, whole-second and millisecond UTC timestamps, and nullable governed dates must validate.",
    );
  }

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
    assert.ok(coverage.endsWith("\n") && !coverage.endsWith("\n\n"), "Generated coverage must end with exactly one newline.");
    for (const heading of [
      "### Research status", "### Publication status", "## Requirements by family", "## Requirements by section",
      "## Required blockers", "## P1 blockers and dispositions", "## Stale-review items", "## External owner gates and blocked items",
      "## Deferred and excluded items", "## Source record states", "## Source records", "## Research artifact inputs", "## Unresolved research artifact inputs",
    ]) assert.ok(coverage.includes(heading), `Coverage report is missing ${heading}.`);
    assert.match(coverage, /\| EF-COMP-GUIDE-COVERAGE \| ef-comp \| needs-current-verification \| 0 \|/, "Coverage must explicitly list stale-review requirements.");
    assert.match(coverage, /\| EF-MOCK-PEER-FACILITATION \| modeled \| external-owner-gate \| blocked \|/, "Coverage must separate external/blocked requirements.");
    assert.match(coverage, /\| EF-AIB-KIDS \| modeled \| excluded \| excluded \|/, "Coverage must separate deferred/excluded requirements.");
    assert.match(coverage, /\| missing \| \d+ \|/, "Coverage must count requirements with missing source support.");
    assert.match(coverage, /\| EF-GLOBAL-ATOMIC-FIXTURE \| unmodeled \| unmodeled \| Required atomic fixture remains unmodeled\. \|/, "Required blockers must include required unmodeled records without inventing a modeled status.");
    assert.match(coverage, /\| EF-SD-ATOMIC-FIXTURE \| unmodeled \| unmodeled \| P1 atomic fixture remains unmodeled\. \|/, "P1 dispositions must include P1 unmodeled records.");
    assert.match(coverage, /\| RA-SD-CURRICULUM-TOPIC-MAP \| missing \| unverified \|/, "Coverage must explicitly list unresolved research artifacts.");
    assert.match(coverage, /\| Routes \| Route families \| Sources \|/, "Coverage must distinguish concrete routes from structural route families.");
    assert.match(coverage, /\| Approval \| Version\/hash \| Verified \| Requirements \|/, "Artifact coverage must expose version/hash and verification metadata.");
    assert.ok(!/readiness percentage|overall completion percentage/i.test(coverage), "Coverage must not emit an aggregate readiness percentage.");
    assert.ok(!coverage.includes("source-complete"), "Coverage must not overclaim source completeness.");
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
    commitGeneratedSnapshot(fixture.cwd, fixture.evaluated);
    write(fixture.cwd, "second-refresh-input.txt", "ordinary input change\n");
    const secondEvaluated = commit(fixture.cwd, "test: add second evaluated input");
    const secondMetadata = commitGeneratedSnapshot(fixture.cwd, secondEvaluated);
    const result = validateCommittedGovernance(fixture.cwd);
    assert.equal(result.repositorySha, secondEvaluated, "A refreshed snapshot must evaluate the second ordinary commit.");
    assert.equal(result.metadataCommit, secondMetadata, "A refreshed snapshot must select the second output-only metadata commit when prior outputs exist.");
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
    registry.requirements = registry.requirements.filter((item) => item.id !== "EF-SD");
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const missingRoot = commit(fixture.cwd, "test: remove exact family root");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, missingRoot), /missing exact required family root EF-SD/, "A prefixed gap record must not substitute for its exact family root.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.unmodeled_atomic_requirements[0].id = "EF-GLOBAL";
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const collision = commit(fixture.cwd, "test: collide modeled and unmodeled IDs");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, collision), /collides with a modeled requirement ID/, "Unmodeled IDs must not collide with modeled requirements.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    delete registry.unmodeled_atomic_requirements[0].priority;
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const incompleteUnmodeled = commit(fixture.cwd, "test: omit unmodeled priority");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, incompleteUnmodeled), /\.priority is required/, "Unmodeled records must use the exact required schema.");
  }

  for (const contradiction of [
    { requirementId: "EF-DSA", artifactId: "RA-DSA-JAVASCRIPT-REQUEST", approval: "unverified" },
    { requirementId: "EF-AIB", artifactId: "RA-AIB-MVP-RECOMMENDATION", approval: "requires-founder-approval" },
  ]) {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.requirements.find((item) => item.id === contradiction.requirementId).research_status = "approved-needs-source-import";
    const artifacts = researchArtifactsRegistry();
    for (const artifact of artifacts.artifacts.filter((item) => item.requirement_ids.includes(contradiction.requirementId))) artifact.approval_status = "approved-needs-source-import";
    artifacts.artifacts.find((item) => item.id === contradiction.artifactId).approval_status = contradiction.approval;
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const contradictoryStatus = commit(fixture.cwd, `test: reject ${contradiction.requirementId} research overclaim`);
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, contradictoryStatus), new RegExp(`${contradiction.requirementId} research_status .* overclaims linked artifact ${contradiction.artifactId}`), `${contradiction.requirementId} must not overclaim its linked research artifact.`);
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const artifacts = researchArtifactsRegistry();
    artifacts.artifacts.find((item) => item.id === "RA-SAL-SECTION-BLUEPRINT").approval_status = "needs-current-verification";
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const conservativeLowerStatus = commit(fixture.cwd, "test: retain conservative lower research status");
    assert.doesNotThrow(() => buildGovernanceArtifacts(fixture.cwd, conservativeLowerStatus), "A requirement may retain the lower needs-research state when its artifact permits needs-current-verification.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.requirements.find((item) => item.id === "EF-LLD").research_status = "not-applicable";
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const notApplicableWithArtifact = commit(fixture.cwd, "test: link artifact to not-applicable requirement");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, notApplicableWithArtifact), /cannot use research_status not-applicable while linked to research artifacts/, "not-applicable requirements must not link research artifacts.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    const requirementWithTests = registry.requirements.find((item) => item.id === "EF-SUP");
    requirementWithTests.status = "implemented-unverified";
    requirementWithTests.test_commands = ["npm run test:fixture"];
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const implementedUnverifiedWithTests = commit(fixture.cwd, "test: reject implemented-unverified behavior tests");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, implementedUnverifiedWithTests), /cannot be implemented-unverified when behavior test commands are recorded/, "Behavior-tested records must remain partial until verification and source criteria close.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.requirements.find((item) => item.id === "EF-GLOBAL").known_gaps = [String.raw`windows\path | cell
| injected |`];
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const adversarial = commit(fixture.cwd, "test: add adversarial markdown cell");
    const coverage = buildGovernanceArtifacts(fixture.cwd, adversarial).files.get(COVERAGE_PATH);
    assert.ok(coverage.includes("windows\\\\path \\| cell \\| injected \\|"), "Markdown cells must escape backslashes before pipes and flatten newlines.");
    assert.ok(!coverage.includes("\n| injected |"), "Adversarial content must not inject a Markdown table row.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    const routeRequirement = registry.requirements.find((item) => item.id === "EF-SUP");
    routeRequirement.routes = ["/catalog/example"];
    routeRequirement.route_families = ["/catalog/[item]", "/dsa/languages/[slug]"];
    write(fixture.cwd, "app/catalog/[slug]/page.tsx", "export default function Page() { return null; }\n");
    write(fixture.cwd, "app/dsa/[...segments]/page.tsx", "export default function Page() { return null; }\n");
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const validRoutes = commit(fixture.cwd, "test: add dynamic and catch-all routes");
    assert.doesNotThrow(() => buildGovernanceArtifacts(fixture.cwd, validRoutes), "Dynamic and catch-all App Router pages must cover compatible declared routes.");
    const generated = buildGovernanceArtifacts(fixture.cwd, validRoutes);
    const generatedRequirement = generated.model.requirements.find((item) => item.id === "EF-SUP");
    assert.deepEqual(generatedRequirement.routes, ["/catalog/example"]);
    assert.deepEqual(generatedRequirement.route_families, ["/catalog/[item]", "/dsa/languages/[slug]"]);

    routeRequirement.route_families = ["/does-not-exist/[slug]"];
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const nonexistentRoute = commit(fixture.cwd, "test: add nonexistent route");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, nonexistentRoute), /nonexistent evaluated App Router route family/, "Nonexistent route families must fail snapshot validation.");

    routeRequirement.route_families = ["/bad//[slug]"];
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const malformedRoute = commit(fixture.cwd, "test: add malformed route");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, malformedRoute), /malformed route/, "Malformed routes must fail snapshot validation.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const registry = requirementsRegistry();
    registry.requirements.find((item) => item.id === "EF-SUP").routes = ["/catalog/[item]"];
    write(fixture.cwd, "app/catalog/[slug]/page.tsx", "export default function Page() { return null; }\n");
    write(fixture.cwd, REQUIREMENTS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    const patternInConcreteRoutes = commit(fixture.cwd, "test: put route family in concrete routes");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, patternInConcreteRoutes), /move dynamic or catch-all patterns to route_families/, "Dynamic declarations must not masquerade as verified concrete routes.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const artifacts = researchArtifactsRegistry();
    artifacts.artifacts.shift();
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const missingBootstrapArtifact = commit(fixture.cwd, "test: remove bootstrap research artifact");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, missingBootstrapArtifact), /exactly the 30 Section 25\.1 bootstrap artifact IDs/, "Deleting a required Section 25.1 artifact must fail validation.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const artifacts = researchArtifactsRegistry();
    artifacts.artifacts[0].title = "Renamed bootstrap artifact";
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const renamedBootstrapArtifact = commit(fixture.cwd, "test: rename bootstrap research artifact");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, renamedBootstrapArtifact), /title must exactly match the Section 25\.1 bootstrap title/, "Renaming a required Section 25.1 artifact must fail validation.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const artifacts = researchArtifactsRegistry();
    artifacts.artifacts[0].approval_status = "approved";
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const approvedMissingArtifact = commit(fixture.cwd, "test: approve missing research artifact");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, approvedMissingArtifact), /with approved status requires repository-present or external-recorded availability/, "Missing artifacts must never be marked approved.");
  }

  {
    const fixture = createFixture(); fixtureDirectories.push(fixture.cwd);
    const artifacts = researchArtifactsRegistry();
    Object.assign(artifacts.artifacts[0], {
      repository_path: "fixture.mjs", version_or_hash: "fixture-v1", availability: "repository-present",
      approval_status: "approved", verified_at: "2026-09-02",
    });
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const repositoryArtifact = commit(fixture.cwd, "test: add repository-present research artifact");
    const generated = buildGovernanceArtifacts(fixture.cwd, repositoryArtifact);
    assert.match(generated.files.get(COVERAGE_PATH), /\| fixture-v1 \| 2026-09-02 \|/, "Artifact coverage must expose version and verification date.");

    artifacts.artifacts[0].repository_path = "missing-research-artifact.md";
    write(fixture.cwd, RESEARCH_ARTIFACTS_REGISTRY_PATH, `${JSON.stringify(artifacts, null, 2)}\n`);
    const missingArtifactPath = commit(fixture.cwd, "test: add missing research artifact path");
    assert.throws(() => buildGovernanceArtifacts(fixture.cwd, missingArtifactPath), /missing evaluated-snapshot repository_path/, "Repository-present artifact paths must exist in the evaluated snapshot.");
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
    assert.match(generated.files.get(COVERAGE_PATH), /\| EF-COMP-GUIDE-COVERAGE \| needs-current-verification \| discovery-recorded \| SRC-COMPANY-DISCOVERY \|/, "A discovery-only seed must be reported as discovery-recorded without a completeness claim.");
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
