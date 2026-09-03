import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCanonicalHttpsUrl } from "./canonical-content-url.mjs";
import { validateInterviewContent } from "./validate-interview-content.mjs";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const [categories, frameworks, questions, tips, checklists, resources] = await Promise.all([
  load("data/behavioral/categories.json"), load("data/behavioral/frameworks.json"), load("data/behavioral/questions.json"),
  load("data/interview-tips/tips.json"), load("data/interview-tips/checklists.json"), load("data/resources/resources.json"),
]);
const validationDate = "2026-09-02";
const validate = (overrides = {}) => validateInterviewContent({ categories, frameworks, questions, tips, checklists, resources, validationDate, ...overrides });

const expectError = (errors, expected, label) => {
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${label} did not produce an error containing ${JSON.stringify(expected)}:\n${errors.join("\n")}`,
  );
};

const mutateResource = (predicate, mutate) => {
  const nextResources = structuredClone(resources);
  const resource = nextResources.find(predicate);
  assert.ok(resource, "The regression fixture requires a matching resource");
  mutate(resource);
  return nextResources;
};

const externalResource = resources.find((resource) => !resource.isInternal && resource.verification === "verified");
assert.ok(externalResource, "The URL/date regression requires a verified external resource");

// Execute every production record and the shared canonical URL helper without
// copying the provider-to-host policy out of the production validator.
assert.ok(questions.length >= 31, "The production dataset must retain at least 31 behavioral prompts");
assert.deepEqual(validate(), [], "The complete interview/resource dataset must validate at the injected date");
for (const resource of resources.filter((item) => !item.isInternal)) {
  const result = validateCanonicalHttpsUrl(resource.url, {
    allowedHostnames: [new URL(resource.url).hostname],
  });
  assert.equal(result.ok, true, `Published resource ${resource.id} must use a canonical HTTPS URL`);
}

for (const value of [
  "https://leetcode.com/problemset/",
  "https://github.com/donnemartin/system-design-primer",
  "https://developer.mozilla.org/en-US/docs/Web",
  "https://leetcode.com/problemset/?difficulty=EASY#list",
]) {
  const result = validateCanonicalHttpsUrl(value);
  assert.equal(result.ok, true, `Canonical helper positive failed for ${value}`);
  assert.equal(result.url.href, value);
}

const providerPolicyFixtures = [
  ["AWS", "https://aws.amazon.com/architecture/"],
  ["Full Stack Deep Learning", "https://fullstackdeeplearning.com/"],
  ["GitHub", "https://skills.github.com/"],
  ["Google Developers", "https://developers.google.com/machine-learning/crash-course"],
  ["Google SRE", "https://sre.google/sre-book/table-of-contents/"],
  ["Harvard FAS Mignone Center for Career Success", "https://careerservices.fas.harvard.edu/resources/interviewing/"],
  ["Hugging Face", "https://huggingface.co/learn"],
  ["LeetCode", "https://leetcode.com/problemset/"],
  ["MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web"],
  ["Made With ML by Anyscale", "https://madewithml.com/"],
  ["System Design Primer", "https://github.com/donnemartin/system-design-primer"],
  ["Tech Interview Handbook", "https://www.techinterviewhandbook.org/"],
  ["UC Berkeley Career Engagement", "https://www.career.berkeley.edu/prepare-for-success/interviewing/"],
  ["VisuAlgo", "https://visualgo.net/en"],
  ["roadmap.sh", "https://roadmap.sh/"],
];
for (const [provider, url] of providerPolicyFixtures) {
  const policyResources = mutateResource(
    (resource) => resource.id === externalResource.id,
    (resource) => {
      resource.provider = provider;
      resource.url = url;
    },
  );
  assert.deepEqual(validate({ resources: policyResources }), [], `Canonical ${provider} URL policy must validate`);
}

const malformedUrlCases = [
  [null, "must be a string"],
  [123, "must be a string"],
  [[], "must be a string"],
  [{ toString: () => externalResource.url }, "must be a string"],
  ["not-a-resource-url", "must use exact https:// form"],
  ["http://leetcode.com/problemset/", "must use exact https:// form"],
  ["https:leetcode.com/problemset/", "must use exact https:// form"],
  ["https://", "must be a valid URL"],
  ["https://leetcode.com/problem set/", "must not contain whitespace, control characters, or backslashes"],
  ["https://leetcode.com/problemset/\t", "must not contain whitespace, control characters, or backslashes"],
  ["https://leetcode.com/problemset/\u007f", "must not contain whitespace, control characters, or backslashes"],
  ["https://leetcode.com\\problemset", "must not contain whitespace, control characters, or backslashes"],
  ["https://person:secret@leetcode.com/problemset/", "must not contain URL credentials"],
  ["https://leetcode.com:8443/problemset/", "must not contain a port"],
  ["https://leetcode.com:443/problemset/", "must use its canonical serialized form"],
  ["https://leetcode.com./problemset/", "must not use a trailing-dot hostname"],
  ["https://LeetCode.com/problemset/", "must use its canonical serialized form"],
  ["https://leetcode.com/a/../problemset/", "must use its canonical serialized form"],
  ["https://www.leetcode.com/problemset/", "must use an approved exact source hostname"],
  ["https://practice.leetcode.com/problemset/", "must use an approved exact source hostname"],
  ["https://leetcode.com.evil.test/problemset/", "must use an approved exact source hostname"],
  ["https://evilleetcode.com/problemset/", "must use an approved exact source hostname"],
  ["https://xn--leetcde-74a.com/problemset/", "must use an approved exact source hostname"],
];
for (const [value, reason] of malformedUrlCases) {
  const malformedResources = mutateResource(
    (resource) => resource.id === externalResource.id,
    (resource) => { resource.url = value; },
  );
  expectError(validate({ resources: malformedResources }), `URL ${reason}`, `Resource URL ${String(value)}`);
}

const providerCrossSwaps = [
  ["LeetCode", "https://skills.github.com/"],
  ["GitHub", "https://leetcode.com/problemset/"],
  ["AWS", "https://developers.google.com/machine-learning/crash-course"],
  ["Google Developers", "https://aws.amazon.com/architecture/"],
];
for (const [provider, url] of providerCrossSwaps) {
  const swappedResources = mutateResource(
    (resource) => resource.provider === provider,
    (resource) => { resource.url = url; },
  );
  expectError(validate({ resources: swappedResources }), "must use an approved exact source hostname", `${provider} provider/host cross-swap`);
}

const arbitraryGithubRepositoryResources = mutateResource(
  (resource) => resource.id === externalResource.id,
  (resource) => {
    resource.provider = "System Design Primer";
    resource.url = "https://github.com/facebook/react";
  },
);
expectError(
  validate({ resources: arbitraryGithubRepositoryResources }),
  "URL must equal the provider's exact canonical URL https://github.com/donnemartin/system-design-primer",
  "System Design Primer arbitrary GitHub repository",
);

const unregisteredProviderResources = mutateResource(
  (resource) => resource.id === externalResource.id,
  (resource) => { resource.provider = "Unregistered Provider"; },
);
expectError(validate({ resources: unregisteredProviderResources }), "provider must have a registered exact hostname policy", "Unregistered provider");

for (const parameter of ["utm_source", "UTM_campaign", "ref", "referrer", "affiliate", "aff", "source"]) {
  const trackedResources = mutateResource(
    (resource) => resource.id === externalResource.id,
    (resource) => {
      const url = new URL(resource.url);
      url.searchParams.set(parameter, "engineering-foundry");
      resource.url = url.href;
    },
  );
  expectError(validate({ resources: trackedResources }), "must not include affiliate or tracking parameters", `Tracking parameter ${parameter}`);
}

const untrackedQueryResources = mutateResource(
  (resource) => resource.id === externalResource.id,
  (resource) => {
    const url = new URL(resource.url);
    url.searchParams.set("difficulty", "easy");
    resource.url = url.href;
  },
);
assert.deepEqual(validate({ resources: untrackedQueryResources }), [], "A canonical non-tracking resource query must remain valid");

const demoResource = structuredClone(resources);
demoResource[0].demo = true;
const companyTagged = structuredClone(questions);
companyTagged[0].companies = ["Example Company"];
for (const [errors, expected] of [
  [validate({ resources: demoResource }), "active demo record"],
  [validate({ questions: companyTagged }), "must not contain company associations"],
]) {
  expectError(errors, expected, "Interview content invariant");
}

const resourcesWithVerifiedDate = (lastVerifiedAt) => mutateResource(
  (resource) => resource.id === externalResource.id,
  (resource) => { resource.lastVerifiedAt = lastVerifiedAt; },
);
for (const lastVerifiedAt of ["2000-02-29", validationDate]) {
  const errors = validate({ resources: resourcesWithVerifiedDate(lastVerifiedAt) });
  assert.deepEqual(errors, [], `A valid calendar boundary failed validation (${lastVerifiedAt})`);
}

const expectedDateError = `Verified resource ${externalResource.id} lastVerifiedAt must use exact YYYY-MM-DD format, identify a real UTC calendar date, and not be later than validationDate ${validationDate}`;
for (const lastVerifiedAt of ["", "1900-02-29", "2026-02-29", "2026-02-30", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "2026-09-03"]) {
  const errors = validate({ resources: resourcesWithVerifiedDate(lastVerifiedAt) });
  assert.ok(errors.includes(expectedDateError), `Expected exact verification-date failure was not produced for ${lastVerifiedAt}`);
}

const undatedUnverifiedResources = mutateResource(
  (resource) => resource.id === externalResource.id,
  (resource) => {
    resource.verification = "unverified";
    resource.lastVerifiedAt = null;
  },
);
assert.deepEqual(validate({ resources: undatedUnverifiedResources }), [], "An unverified resource with a null verification date must validate");
const datedUnverifiedResources = structuredClone(undatedUnverifiedResources);
datedUnverifiedResources.find((resource) => resource.id === externalResource.id).lastVerifiedAt = "2000-02-29";
expectError(validate({ resources: datedUnverifiedResources }), "must not include a verification date", "Unverified resource date");

expectError(validate({ validationDate: "2026-02-30" }), "validationDate must use exact YYYY-MM-DD format", "Invalid injected validationDate");

console.log("Interview content validator regression checks passed: all production records, canonical provider URLs, tracking exclusion, provenance host binding, and deterministic verification dates.");
