import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCanonicalHttpsUrl } from "./canonical-content-url.mjs";
import { validateContent } from "./validate-content.mjs";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const [topics, patterns, roadmap, companies, ...questionGroups] = await Promise.all([
  load("data/dsa/topics.json"),
  load("data/dsa/patterns.json"),
  load("data/dsa/roadmap.json"),
  load("data/companies/companies.json"),
  load("data/dsa/questions-foundations.json"),
  load("data/dsa/questions-core-patterns.json"),
  load("data/dsa/questions-structures.json"),
  load("data/dsa/questions-advanced.json"),
]);
const questions = questionGroups.flat();
const validationDate = "2026-09-02";
const validate = (overrides = {}) => validateContent({ topics, patterns, roadmap, companies, questions, validationDate, ...overrides });

const expectError = (errors, expected, label) => {
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${label} did not produce an error containing ${JSON.stringify(expected)}:\n${errors.join("\n")}`,
  );
};

const mutateQuestion = (predicate, mutate) => {
  const nextQuestions = structuredClone(questions);
  const question = nextQuestions.find(predicate);
  assert.ok(question, "The regression fixture requires a matching DSA question");
  mutate(question);
  return nextQuestions;
};

const externalQuestion = questions.find((question) => !question.isOriginal);
const originalQuestion = questions.find((question) => question.isOriginal);
assert.ok(externalQuestion && originalQuestion, "The provenance regression requires original and external questions");

// Execute the production validator over every repository record, then exercise
// the shared URL validator against every currently published external question.
assert.deepEqual(validate(), [], "The complete production content dataset must validate at the injected date");
for (const question of questions) {
  if (question.isOriginal) {
    assert.equal(question.externalUrl, null, `Original question ${question.id} must not expose an external URL`);
    assert.equal(question.source.url, null, `Original question ${question.id} must keep null source provenance`);
    continue;
  }
  assert.equal(question.source.url, question.externalUrl, `Question ${question.id} must keep identical source and external URLs`);
  const result = validateCanonicalHttpsUrl(question.externalUrl, {
    allowedHostnames: [new URL(question.externalUrl).hostname],
  });
  assert.equal(result.ok, true, `Published question ${question.id} must use a canonical HTTPS URL`);
}

for (const value of [
  "https://leetcode.com/",
  "https://leetcode.com/problems/two-sum/",
  "https://www.hackerrank.com/challenges/compare-the-triplets/problem",
  "https://codeforces.com/problemset/problem/1/A",
  "https://www.geeksforgeeks.org/dsa/two-sum/",
]) {
  const result = validateCanonicalHttpsUrl(value);
  assert.equal(result.ok, true, `Canonical helper positive failed for ${value}`);
  assert.equal(result.url.href, value);
}

const invalidCanonicalUrls = [
  [null, "must be a string"],
  [42, "must be a string"],
  [[], "must be a string"],
  [{ toString: () => "https://leetcode.com/problems/two-sum/" }, "must be a string"],
  ["", "must use exact https:// form"],
  ["http://leetcode.com/problems/two-sum/", "must use exact https:// form"],
  ["ftp://leetcode.com/problems/two-sum/", "must use exact https:// form"],
  ["javascript:alert(1)", "must use exact https:// form"],
  ["HTTPS://leetcode.com/problems/two-sum/", "must use exact https:// form"],
  ["https:leetcode.com/problems/two-sum/", "must use exact https:// form"],
  ["https://", "must be a valid URL"],
  ["https://[invalid", "must be a valid URL"],
  ["https://leetcode.com/problems/two sum/", "must not contain whitespace, control characters, or backslashes"],
  ["https://leetcode.com/problems/two-sum/\n", "must not contain whitespace, control characters, or backslashes"],
  ["https://leetcode.com/problems/\u0000two-sum/", "must not contain whitespace, control characters, or backslashes"],
  ["https://leetcode.com\\problems\\two-sum", "must not contain whitespace, control characters, or backslashes"],
  ["https://user:secret@leetcode.com/problems/two-sum/", "must not contain URL credentials"],
  ["https://leetcode.com:8443/problems/two-sum/", "must not contain a port"],
  ["https://leetcode.com:443/problems/two-sum/", "must use its canonical serialized form"],
  ["https://leetcode.com./problems/two-sum/", "must not use a trailing-dot hostname"],
  ["https://LeetCode.com/problems/two-sum/", "must use its canonical serialized form"],
  ["https://leetcode.com/problems/../two-sum/", "must use its canonical serialized form"],
];
for (const [value, reason] of invalidCanonicalUrls) {
  assert.deepEqual(validateCanonicalHttpsUrl(value), { ok: false, reason }, `Canonical helper accepted ${String(value)}`);
}

for (const value of [
  "https://discuss.leetcode.com/problems/two-sum/",
  "https://leetcode.com.evil.test/problems/two-sum/",
  "https://evilleetcode.com/problems/two-sum/",
  "https://xn--leetcde-74a.com/problems/two-sum/",
]) {
  assert.deepEqual(
    validateCanonicalHttpsUrl(value, { allowedHostnames: ["leetcode.com"] }),
    { ok: false, reason: "must use an approved exact source hostname" },
    `Exact-host policy accepted ${value}`,
  );
}

const expandedQuestions = [...questions];
while (expandedQuestions.length < 51) {
  const index = expandedQuestions.length + 1;
  expandedQuestions.push({ ...questions[0], id: `validator-scale-${index}`, slug: `validator-scale-${index}` });
}
const scaleErrors = validate({ questions: expandedQuestions });
if (scaleErrors.length) throw new Error(`A valid 51-question dataset failed validation:\n${scaleErrors.join("\n")}`);

const brandedSourcePolicies = [
  ["leetcode", "LeetCode", "https://leetcode.com/problems/two-sum/"],
  ["hackerrank", "HackerRank", "https://www.hackerrank.com/challenges/compare-the-triplets/problem"],
  ["codeforces", "Codeforces", "https://codeforces.com/problemset/problem/1/A"],
  ["geeksforgeeks", "GeeksForGeeks", "https://www.geeksforgeeks.org/dsa/two-sum/"],
];
for (const [platform, name, url] of brandedSourcePolicies) {
  const brandedQuestions = mutateQuestion(
    (question) => question.id === externalQuestion.id,
    (question) => {
      question.source.name = name;
      question.source.platform = platform;
      question.source.url = url;
      question.externalUrl = url;
    },
  );
  assert.deepEqual(validate({ questions: brandedQuestions }), [], `Canonical ${platform} name/host policy must validate`);
}

const wrongPlatformQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => { question.source.platform = "hackerrank"; },
);
const wrongPlatformErrors = validate({ questions: wrongPlatformQuestions });
expectError(wrongPlatformErrors, "must use exact source name HackerRank", "DSA branded source identity cross-swap");
expectError(wrongPlatformErrors, "must use an approved exact source hostname", "DSA platform/host cross-swap");

const wrongHostQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => {
    question.source.url = "https://www.hackerrank.com/challenges/compare-the-triplets/problem";
    question.externalUrl = question.source.url;
  },
);
expectError(validate({ questions: wrongHostQuestions }), "must use an approved exact source hostname", "DSA URL/provider cross-swap");

const genericPlatformEscapeQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => {
    question.source.name = " LeEtCoDe ";
    question.source.platform = "other";
    question.source.url = "https://evil.test/problems/two-sum/";
    question.externalUrl = question.source.url;
  },
);
expectError(
  validate({ questions: genericPlatformEscapeQuestions }),
  "source name LeetCode is reserved for platform leetcode",
  "Branded DSA name on a generic platform",
);

const mismatchedSourceQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => { question.source.url = "https://leetcode.com/problems/contains-duplicate/"; },
);
expectError(validate({ questions: mismatchedSourceQuestions }), "source URL must match its external URL", "DSA source/external equality");

const externalNullQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => {
    question.externalUrl = null;
    question.source.url = null;
  },
);
expectError(validate({ questions: externalNullQuestions }), "must have a canonical HTTPS URL: must be a string", "External null provenance");

const originalUrlQuestions = mutateQuestion(
  (question) => question.id === originalQuestion.id,
  (question) => {
    question.source.url = "https://engineeringfoundry.dev/dsa";
    question.externalUrl = question.source.url;
  },
);
const originalUrlErrors = validate({ questions: originalUrlQuestions });
expectError(originalUrlErrors, "original source URL must be null", "Original source URL");
expectError(originalUrlErrors, "must not require an external URL", "Original external URL");

const originalExternalProvenanceQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => {
    question.source.name = "Engineering Foundry";
    question.source.platform = "original";
    question.source.url = null;
  },
);
expectError(
  validate({ questions: originalExternalProvenanceQuestions }),
  "requiring external provenance must not use the original source platform",
  "External question with original provenance",
);

const validDateQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => {
    question.lastVerifiedAt = "2000-02-29";
    question.source.lastVerifiedAt = validationDate;
  },
);
assert.deepEqual(validate({ questions: validDateQuestions }), [], "Leap day and validationDate equality must validate deterministically");

for (const value of ["", "1900-02-29", "2026-02-29", "2026-02-30", "2026-04-31", "2026-00-01", "2026-13-01", "2026-09-03"]) {
  const datedQuestions = mutateQuestion(
    (question) => question.id === externalQuestion.id,
    (question) => { question.lastVerifiedAt = value; },
  );
  expectError(validate({ questions: datedQuestions }), `not be later than validationDate ${validationDate}`, `Question verification date ${value}`);
}

const futureSourceQuestions = mutateQuestion(
  (question) => question.id === externalQuestion.id,
  (question) => { question.source.lastVerifiedAt = "2026-09-03"; },
);
expectError(validate({ questions: futureSourceQuestions }), `not be later than validationDate ${validationDate}`, "Source future date");
expectError(validate({ validationDate: "2026-02-30" }), "validationDate must use exact YYYY-MM-DD format", "Invalid injected validationDate");

const malformedCompanies = structuredClone(companies);
malformedCompanies[0].claims = [{
  claim: " ",
  verification: "verified",
  source: {
    name: " ",
    platform: "unsupported",
    url: "http://example.com/claim",
    verification: "unsupported",
    lastVerifiedAt: "2026-99-99",
  },
}];
const claimErrors = validate({ companies: malformedCompanies });
for (const expected of [
  "text must be non-empty",
  "source name must be non-empty",
  "invalid source platform",
  "invalid source verification",
  "canonical HTTPS source URL",
  "invalid source lastVerifiedAt",
  "marked verified requires a verified source",
]) {
  expectError(claimErrors, expected, "Malformed company claim");
}

const originalClaimCompanies = structuredClone(companies);
originalClaimCompanies[0].claims = [{
  claim: "A sourced claim",
  verification: "verified",
  source: {
    name: "Engineering Foundry",
    platform: "original",
    url: "https://engineeringfoundry.dev/companies",
    verification: "verified",
    lastVerifiedAt: null,
  },
}];
const originalClaimErrors = validate({ companies: originalClaimCompanies });
expectError(originalClaimErrors, "original source URL must be null", "Externally sourced company claim with original URL");
expectError(originalClaimErrors, "requiring external provenance must not use the original source platform", "Externally sourced company claim with original platform");

console.log("Content validator regression checks passed: all production records, canonical URL policy, exact DSA provenance, source equality, and deterministic verification dates.");
