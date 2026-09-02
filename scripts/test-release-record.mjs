import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertReleaseRecordDestinationAvailable, createReleaseRecord, renderReleaseMarkdown, validateGeneratedReleaseRecord, validateReleaseRecord, RELEASE_RECORD_PATHS } from "./release-record.mjs";

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
assert.throws(() => assertReleaseRecordDestinationAvailable(), /Refusing to overwrite the current immutable release record/, "Generation must not silently replace the current evidence pair.");

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
} finally {
  process.chdir(originalDirectory);
  rmSync(fixtureDirectory, { recursive: true, force: true });
}

console.log("Release-record regression passed: current/archive evidence remains immutable, descendants are allowed, a new record validates before its metadata commit, and generation cannot overwrite current evidence.");
