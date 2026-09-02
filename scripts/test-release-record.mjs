import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertAllowedWorkingTree, assertReleaseRecordDestinationAvailable, createReleaseRecord, generateReleaseRecord, renderReleaseMarkdown, validateGeneratedReleaseRecord, validateReleaseRecord, RELEASE_RECORD_PATHS } from "./release-record.mjs";

const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

// Historical evidence must remain valid on ordinary descendant commits and
// while unrelated feature work is present in the working tree.
const result = validateReleaseRecord();
const head = git(["rev-parse", "HEAD"]);

assert.equal(result.status, "VALID");
assert.ok(result.records.length >= 2, "The current release record and its archived predecessor must both validate.");
assert.equal(git(["merge-base", result.metadataCommit, head]), result.metadataCommit, "The current record metadata commit must remain an ancestor of HEAD.");

for (const entry of result.records) {
  assert.equal(git(["merge-base", entry.metadataCommit, head]), entry.metadataCommit, `${entry.label} metadata commit must remain an ancestor of HEAD.`);
  assert.equal(git(["rev-parse", `${entry.metadataCommit}^`]), entry.record.candidate_sha, `${entry.label} metadata commit must be the direct child of its candidate.`);
  assert.deepEqual(
    git(["diff-tree", "--no-commit-id", "--name-only", "-r", entry.metadataCommit]).split("\n").filter(Boolean).sort(),
    [...RELEASE_RECORD_PATHS].sort(),
    `${entry.label} metadata commit may change only the canonical release-record pair.`,
  );
}

const generatedCandidate = git(["rev-parse", "HEAD"]);
const generatedBase = result.record.base_sha;
const generatedBranch = "test/generated-release-record";
assert.equal(
  git(["merge-base", generatedBase, generatedCandidate]),
  generatedBase,
  "The validated release-record base must remain an ancestor of the generated test candidate.",
);
const generated = createReleaseRecord({
  candidateSha: generatedCandidate,
  baseSha: generatedBase,
  candidateBranch: generatedBranch,
  qualifiedAtUtc: "2026-09-01T00:00:00Z",
});
assert.doesNotThrow(() => validateGeneratedReleaseRecord(generated), "A new candidate record must validate before its record-only metadata commit exists.");
assert.throws(() => assertReleaseRecordDestinationAvailable(), /Refusing to replace the current immutable release record/, "Generation must not replace the current evidence before its exact archive pair is committed.");

// Exercise both supported HEAD positions in an isolated repository so this
// regression does not depend on the checked-out repository having descendants.
const originalDirectory = process.cwd();
const fixtureDirectory = mkdtempSync(path.join(tmpdir(), "engineering-foundry-release-record-"));
try {
  process.chdir(fixtureDirectory);
  git(["init", "--quiet"]);
  git(["config", "user.name", "Release Record Test"]);
  git(["config", "user.email", "release-record-test@example.invalid"]);

  const writeFixture = (file, contents) => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, contents);
  };
  writeFixture(".nvmrc", "22.13.0\n");
  writeFixture("package.json", `${JSON.stringify({
    packageManager: "npm@10.9.2",
    engines: { node: "22.13.0" },
    scripts: { build: "next build" },
    devDependencies: { supabase: "2.115.0" },
  }, null, 2)}\n`);
  writeFixture("scripts/release-verification-manifest.mjs", `export const PINNED_NODE_VERSION = "22.13.0";
export const PINNED_NPM_VERSION = "10.9.2";
export const PINNED_SUPABASE_CLI_VERSION = "2.115.0";
export const PRODUCTION_BUILD_COMMAND = "next build";
export const PRODUCTION_BUILD_DESCRIPTION = "Synthetic production build";
export const RELEASE_QUALIFICATION_COMMANDS = ["npm ci", "npm run qualify:static"];
`);
  writeFixture("supabase/migrations/202609010001_fixture.sql", "select 1;\n");
  git(["add", "."]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add release base"]);
  const fixtureBase = git(["rev-parse", "HEAD"]);

  writeFixture("feature.txt", "qualified candidate\n");
  git(["add", "feature.txt"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add release candidate"]);
  const fixtureCandidate = git(["rev-parse", "HEAD"]);
  const fixtureRecord = createReleaseRecord({
    candidateSha: fixtureCandidate,
    baseSha: fixtureBase,
    candidateBranch: "test/generated-release-record",
    qualifiedAtUtc: "2026-09-01T00:00:00Z",
  });
  writeFixture(RELEASE_RECORD_PATHS[0], `${JSON.stringify(fixtureRecord, null, 2)}\n`);
  writeFixture(RELEASE_RECORD_PATHS[1], renderReleaseMarkdown(fixtureRecord));
  git(["add", ...RELEASE_RECORD_PATHS]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: record release candidate"]);
  const fixtureMetadataCommit = git(["rev-parse", "HEAD"]);
  git(["checkout", "--quiet", "--detach", fixtureMetadataCommit]);

  const metadataHeadResult = validateReleaseRecord();
  assert.equal(metadataHeadResult.metadataCommit, fixtureMetadataCommit, "A fresh record-only metadata commit must validate while it is a detached HEAD.");

  writeFixture("ordinary-descendant.txt", "ordinary change\n");
  git(["add", "ordinary-descendant.txt"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add ordinary descendant"]);
  const descendantResult = validateReleaseRecord();
  assert.equal(descendantResult.metadataCommit, fixtureMetadataCommit, "The same release evidence must validate after an ordinary descendant commit.");

  git(["checkout", "--quiet", "-b", "test/next-release-candidate"]);
  const archivedCandidateSha = metadataHeadResult.record.candidate_sha;
  const archivePaths = [
    `docs/releases/archive/v1-release-candidate-${archivedCandidateSha}.json`,
    `docs/releases/archive/v1-release-candidate-${archivedCandidateSha}.md`,
  ];
  writeFixture(archivePaths[0], readFileSync(RELEASE_RECORD_PATHS[0], "utf8"));
  writeFixture(archivePaths[1], readFileSync(RELEASE_RECORD_PATHS[1], "utf8"));
  writeFileSync(".git/info/exclude", `${archivePaths.join("\n")}\n`);
  assert.throws(() => assertReleaseRecordDestinationAvailable(), /exact pair is committed at HEAD/, "An ignored working-tree archive must not satisfy the committed-archive precondition.");
  git(["add", "-f", ...archivePaths]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: archive previous release record"]);
  assert.doesNotThrow(() => validateReleaseRecord(), "Committing an exact archive copy must preserve active-record validation during candidate qualification.");

  writeFixture("next-candidate.txt", "next qualified candidate\n");
  git(["add", "next-candidate.txt"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add next release candidate"]);
  const nextCandidate = git(["rev-parse", "HEAD"]);
  assert.doesNotThrow(() => assertReleaseRecordDestinationAvailable(), "An exact committed archive must permit replacing the canonical pair after qualification.");
  generateReleaseRecord(nextCandidate, fixtureBase);
  const generatedStatus = execFileSync("git", ["status", "--porcelain=v1"], { encoding: "utf8" }).trimEnd();
  assert.deepEqual(
    generatedStatus.split("\n").filter(Boolean).map((line) => line.slice(3)).sort(),
    [...RELEASE_RECORD_PATHS].sort(),
    "Rotation generation may modify only the canonical record pair.",
  );
  git(["add", ...RELEASE_RECORD_PATHS]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: record next release candidate"]);
  const nextMetadataCommit = git(["rev-parse", "HEAD"]);
  const rotatedResult = validateReleaseRecord();
  assert.equal(rotatedResult.metadataCommit, nextMetadataCommit, "The rotated current record must resolve to its new metadata-only commit.");
  assert.equal(rotatedResult.record.candidate_sha, nextCandidate, "The rotated record must identify the qualified candidate immediately before it.");
  assert.equal(rotatedResult.records.length, 2, "Rotation must retain the previous record as a validated archive.");

  git(["checkout", "--quiet", "-b", "test/merge-second-parent", nextCandidate]);
  writeFixture("parallel-change.txt", "parallel descendant\n");
  git(["add", "parallel-change.txt"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add parallel descendant"]);
  const parallelCommit = git(["rev-parse", "HEAD"]);
  git(["-c", "commit.gpgSign=false", "merge", "--quiet", "--no-ff", "-m", "test: merge release metadata as second parent", nextMetadataCommit]);
  assert.equal(validateReleaseRecord().metadataCommit, nextMetadataCommit, "Release evidence must validate when its metadata commit is retained on a merge's second-parent ancestry.");

  git(["checkout", "--quiet", "-b", "test/merge-first-parent", nextMetadataCommit]);
  git(["-c", "commit.gpgSign=false", "merge", "--quiet", "--no-ff", "-m", "test: merge parallel descendant", parallelCommit]);
  assert.equal(validateReleaseRecord().metadataCommit, nextMetadataCommit, "Release evidence must validate when its metadata commit is retained on a merge's first-parent ancestry.");

  git(["checkout", "--quiet", "--detach", fixtureBase]);
  git(["checkout", "--quiet", "-b", "test/manifest-decoy"]);
  writeFixture("scripts/release-verification-manifest.mjs", `// export const PINNED_NODE_VERSION = "22.13.0";
export const PINNED_NODE_VERSION = "99.0.0";
export const PINNED_NPM_VERSION = "10.9.2";
export const PINNED_SUPABASE_CLI_VERSION = "2.115.0";
export const PRODUCTION_BUILD_COMMAND = "next build";
export const PRODUCTION_BUILD_DESCRIPTION = "Synthetic production build";
export const RELEASE_QUALIFICATION_COMMANDS = ["npm ci"];
`);
  git(["add", "scripts/release-verification-manifest.mjs"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add misleading manifest comment"]);
  const decoyCandidate = git(["rev-parse", "HEAD"]);
  assert.throws(
    () => createReleaseRecord({ candidateSha: decoyCandidate, baseSha: fixtureBase, candidateBranch: "test/manifest-decoy", qualifiedAtUtc: "2026-09-01T00:00:00Z" }),
    /manifest Node pin must match/,
    "A commented-out matching pin must not mask the actual exported value.",
  );

  git(["checkout", "--quiet", "--detach", fixtureBase]);
  git(["checkout", "--quiet", "-b", "test/manifest-commented-command"]);
  writeFixture("scripts/release-verification-manifest.mjs", `export const PINNED_NODE_VERSION = "22.13.0";
export const PINNED_NPM_VERSION = "10.9.2";
export const PINNED_SUPABASE_CLI_VERSION = "2.115.0";
export const PRODUCTION_BUILD_COMMAND = "next build";
export const PRODUCTION_BUILD_DESCRIPTION = "Synthetic production build";
export const RELEASE_QUALIFICATION_COMMANDS = [
  "npm ci",
  // "npm run qualify:database",
];
`);
  git(["add", "scripts/release-verification-manifest.mjs"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add commented qualification command"]);
  const commentedCommandCandidate = git(["rev-parse", "HEAD"]);
  const commentSafeRecord = createReleaseRecord({ candidateSha: commentedCommandCandidate, baseSha: fixtureBase, candidateBranch: "test/manifest-commented-command", qualifiedAtUtc: "2026-09-01T00:00:00Z" });
  assert.deepEqual(commentSafeRecord.qualification_commands, ["npm ci"], "Commented commands must not become recorded qualification evidence.");

  writeFixture("scripts/release-verification-manifest.mjs", `export const PINNED_NODE_VERSION = "22.13.0";
export const PINNED_NPM_VERSION = "10.9.2";
export const PINNED_SUPABASE_CLI_VERSION = "2.115.0";
export const PRODUCTION_BUILD_COMMAND = "next build";
export const PRODUCTION_BUILD_DESCRIPTION = "Synthetic production build";
export const RELEASE_QUALIFICATION_COMMANDS = ["npm ci", "npm run qualify:database"];
RELEASE_QUALIFICATION_COMMANDS.pop();
`);
  git(["add", "scripts/release-verification-manifest.mjs"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: mutate qualification commands"]);
  const mutatedCommandCandidate = git(["rev-parse", "HEAD"]);
  assert.throws(
    () => createReleaseRecord({ candidateSha: mutatedCommandCandidate, baseSha: fixtureBase, candidateBranch: "test/manifest-commented-command", qualifiedAtUtc: "2026-09-01T00:00:00Z" }),
    /must not be referenced or mutated/,
    "Post-declaration command mutation must not be accepted as immutable qualification evidence.",
  );

  git(["checkout", "--quiet", "--detach", fixtureBase]);
  git(["checkout", "--quiet", "-b", "test/rename-guard"]);
  writeFixture("unrelated-record.json", "{}\n");
  git(["add", "unrelated-record.json"]);
  git(["-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "test: add unrelated tracked file"]);
  mkdirSync(path.dirname(RELEASE_RECORD_PATHS[0]), { recursive: true });
  git(["mv", "unrelated-record.json", RELEASE_RECORD_PATHS[0]]);
  assert.throws(() => assertAllowedWorkingTree(), /unrelated-record\.json/, "A rename into an allowed canonical path must still expose and reject its unrelated source deletion.");
} finally {
  process.chdir(originalDirectory);
  rmSync(fixtureDirectory, { recursive: true, force: true });
}

console.log("Release-record regression passed: immutable current/archive evidence, detached and merge descendants, safe rotation, static manifest parsing, and overwrite guards hold.");
