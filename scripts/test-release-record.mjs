import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { assertReleaseRecordDestinationAvailable, createReleaseRecord, validateGeneratedReleaseRecord, validateReleaseRecord, RELEASE_RECORD_PATHS } from "./release-record.mjs";

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

assert.ok(
  git(["diff", "--name-only", `${result.metadataCommit}..${head}`]).split("\n").filter(Boolean).some((file) => !RELEASE_RECORD_PATHS.includes(file)),
  "This regression must validate a normal descendant with non-record changes after the record-only metadata commit.",
);

const generatedCandidate = git(["rev-parse", "HEAD"]);
const generatedBase = git(["merge-base", "main", generatedCandidate]);
const generatedBranch = git(["branch", "--show-current"]);
const generated = createReleaseRecord({
  candidateSha: generatedCandidate,
  baseSha: generatedBase,
  candidateBranch: generatedBranch,
  qualifiedAtUtc: "2026-09-01T00:00:00Z",
});
assert.doesNotThrow(() => validateGeneratedReleaseRecord(generated), "A new candidate record must validate before its record-only metadata commit exists.");
assert.throws(() => assertReleaseRecordDestinationAvailable(), /Refusing to overwrite the current immutable release record/, "Generation must not silently replace the current evidence pair.");

console.log("Release-record regression passed: current/archive evidence remains immutable, descendants are allowed, a new record validates before its metadata commit, and generation cannot overwrite current evidence.");
