import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  ANALYTICS_DEFINITION_VERSION,
  FIRST_USEFUL_ACTION_EVENTS,
  P09_EVENT_PROPERTY_ALLOWLIST,
  sanitizeP09AnalyticsProperties,
} from "../lib/analytics/launch-metrics.ts";
import { validateEvidence, validateImpactLedger, validateRelease, validateSnapshot } from "./validate-impact-ledger.mjs";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const read = (path) => readFileSync(path, "utf8");
const analytics = read("lib/analytics.ts");
const docs = read("docs/analytics.md");
const operations = read("docs/analytics-launch-operations.md");
const privacy = read("app/privacy/page.tsx");
const home = read("components/home-entry-experience.tsx");
const mock = read("components/mock-interview-lab.tsx");
const salary = read("features/salary-negotiation/offer-comparison-worksheet.tsx");
const experience = read("features/interview-experiences/experience-submission.tsx");
const preparationActivity = read("components/preparation-activity-control.tsx");
const lldActivity = read("features/low-level-design/progress-control.tsx");
const lldLesson = read("features/low-level-design/lesson-view.tsx");
const lldPractice = read("features/low-level-design/practice-view.tsx");
const dsaProgress = read("features/dsa/progress/question-progress-editor.tsx");
const systemDesignProgress = read("features/system-design/progress-editor.tsx");
const dsaQuestionDetail = read("features/dsa/progress/question-detail.tsx");
const ci = read(".github/workflows/ci.yml");
const monthlySnapshotTemplate = JSON.parse(read("docs/impact-ledger/monthly-snapshot.template.json"));

assert.equal(ANALYTICS_DEFINITION_VERSION, "analytics-definition-v1");
assert.ok(FIRST_USEFUL_ACTION_EVENTS.length >= 8, "first useful action set must remain a deliberate multi-track set");
for (const event of Object.keys(P09_EVENT_PROPERTY_ALLOWLIST)) assert.ok(analytics.includes(`| "${event}"`), `${event} is not registered with the analytics event type`);
for (const event of [...analytics.matchAll(/\| "([^"]+)"/g)].map((match) => match[1])) assert.ok(docs.includes(`\`${event}\``), `analytics documentation does not classify registered event ${event}`);
const p09Contracts = [
  ["dsa_practice_started", { track: "dsa", problem_id: "two-sum", source: "leetcode" }],
  ["system_design_practice_started", { track: "system-design", problem_id: "url-shortener", difficulty: "intermediate", domain: "distributed-systems" }],
  ["ml_design_practice_started", { track: "ml-design", problem_id: "recommendation-system", difficulty: "advanced", domain: "machine-learning" }],
  ["behavioral_practice_started", { track: "behavioral", question_id: "beh-conflict-01", category: "conflict" }],
  ["low_level_design_lesson_opened", { track: "low-level-design", lesson_id: "lld-interview-approach" }],
  ["low_level_design_practice_started", { track: "low-level-design", practice_id: "parking-allocation" }],
  ["preparation_activity_recorded", { track: "dsa", item_id: "two-sum", status: "solved", persistence: "account" }],
  ["low_level_design_activity_recorded", { track: "low-level-design", item_id: "lld-interview-approach", item_type: "lesson", status: "completed", persistence: "local" }],
  ["low_level_design_activity_recorded", { track: "low-level-design", item_id: "parking-allocation", item_type: "practice", status: "completed", persistence: "local" }],
  ["continuation_presented", { track: "dsa", continuation_source: "account:active-plan", authenticated: true }],
  ["continuation_selected", { track: "system-design", continuation_source: "local:next", authenticated: false }],
  ["study_plan_activated", { track: "dsa", plan_id: "sde2-60d", persistence: "account" }],
  ["study_plan_activated", { track: "system-design", plan_id: "senior-2-weeks-infrastructure-60m", persistence: "local" }],
  ["study_plan_resumed", { track: "system-design", continuation_source: "account:active-plan", authenticated: true }],
  ["mock_review_saved", { track: "dsa", mode: "solo", prompt_id: "two-sum", rubric_id: "coding-foundations" }],
  ["salary_negotiation_module_viewed", { module_id: "compensation-package-anatomy" }],
  ["offer_comparison_opened", { surface: "salary-negotiation" }],
  ["interview_experience_submission_started", { source: "directory_contribution" }],
  ["interview_experience_submitted", { source: "directory_contribution" }],
];
for (const [event, expected] of p09Contracts) {
  assert.deepEqual(
    sanitizeP09AnalyticsProperties(event, { ...expected, notes: "private narrative", application_id: "550e8400-e29b-41d4-a716-446655440000" }),
    expected,
    `${event} must retain every documented call-site property and remove unexpected private values`,
  );
  const freeFormSubstitution = Object.fromEntries(Object.keys(expected).map((key) => [key, "private free-form value"]));
  assert.deepEqual(sanitizeP09AnalyticsProperties(event, freeFormSubstitution), {}, `${event} must reject free-form substitutions`);
}
assert.deepEqual(sanitizeP09AnalyticsProperties("dsa_practice_started", { track: "dsa", problem_id: "two-sum", source: "directory_contribution" }), { track: "dsa", problem_id: "two-sum" }, "Interview Experience source cannot be accepted as a DSA source");
assert.deepEqual(sanitizeP09AnalyticsProperties("dsa_practice_started", { track: "dsa", problem_id: "two-sum", source: "unreviewed free text", source_label: "LeetCode", url: "https://leetcode.com/problems/two-sum" }), { track: "dsa", problem_id: "two-sum" }, "DSA labels and URLs cannot enter analytics");
assert.deepEqual(sanitizeP09AnalyticsProperties("interview_experience_submission_started", { source: "leetcode", company: "Example", role: "Engineer", summary: "private" }), {}, "DSA sources and contribution fields cannot enter Interview Experience analytics");
assert.deepEqual(sanitizeP09AnalyticsProperties("low_level_design_activity_recorded", { track: "low-level-design", item_id: "practice:parking-allocation", item_type: "practice", status: "completed", persistence: "local" }), { track: "low-level-design", item_type: "practice", status: "completed", persistence: "local" }, "LLD browser storage keys cannot enter analytics");
assert.equal(sanitizeP09AnalyticsProperties("legacy_event", { notes: "not transformed here" })?.notes, "not transformed here", "legacy events must continue to rely on the global sanitizer");
assert.ok(analytics.includes("sanitizeP09AnalyticsProperties(event, properties)"), "P0.9 allowlist must execute before capture");
for (const event of ["dsa_practice_started", "system_design_practice_started", "ml_design_practice_started", "behavioral_practice_started", "low_level_design_lesson_opened", "low_level_design_practice_started", "preparation_activity_recorded", "low_level_design_activity_recorded", "continuation_presented", "continuation_selected", "study_plan_activated", "study_plan_resumed", "mock_review_saved"]) assert.ok(docs.includes(`\`${event}\``), `analytics docs omit ${event}`);
assert.ok(docs.includes("first useful action") && docs.includes("never mastery"), "first useful action and activity semantics must remain explicit");
assert.ok(home.includes('track("continuation_presented"') && home.includes('track("continuation_selected"'), "continuation instrumentation is missing");
assert.ok(home.includes('track("study_plan_resumed"') && read("components/save-study-plan-control.tsx").includes('track("study_plan_activated"'), "saved-plan activation/resume instrumentation is missing");
assert.ok(mock.includes('if (result.ok) track("mock_review_saved"'), "mock completion must wait for a successful persisted review");
assert.ok(preparationActivity.includes('next === "completed" && outcome.persisted') && preparationActivity.includes("persistence: outcome.persistence") && lldActivity.includes('if (!complete) track("low_level_design_activity_recorded"'), "activity completion must require a resolved confirmed persistence outcome");
assert.equal((preparationActivity.match(/trackAnalytics\("preparation_activity_recorded"/g) ?? []).length, 1, "shared preparation activity must keep exactly one post-persistence analytics emission point");
assert.match(preparationActivity, /writeLocalPreparationProgress\(window\.localStorage, updated\);\s*window\.dispatchEvent\(new CustomEvent\(preparationProgressEvent\)\)/, "browser-local preparation events must follow a verified storage write");
assert.ok(dsaProgress.includes('recordedStatus === "not_started"') && systemDesignProgress.includes('recordedStatus === "not_started"'), "non-meaningful progress statuses must stay out of activity metrics");
assert.ok(lldLesson.includes('low_level_design_lesson_opened') && lldPractice.includes('low_level_design_practice_started'), "LLD start instrumentation is missing");
assert.ok(lldActivity.includes("analyticsItemId") && lldActivity.includes("analyticsItemType") && lldLesson.includes('analyticsItemType="lesson"') && lldPractice.includes('analyticsItemType="practice"'), "LLD analytics must not reuse colon-delimited browser storage keys");
assert.ok(dsaQuestionDetail.includes("source: question.sourceType") && !dsaQuestionDetail.includes("sourceLabel.toLowerCase"), "DSA analytics must use canonical source types rather than display labels");
assert.ok(salary.includes('track("offer_comparison_opened", { surface: "salary-negotiation" })') && !salary.includes("track(", salary.indexOf("const update")), "salary analytics must not include worksheet values");
assert.ok(experience.includes('track("interview_experience_submitted"') && !experience.includes("companyName }") && !experience.includes("summary }"), "experience analytics must not include user-entered report fields");
assert.ok(STATIC_STEPS.some((step) => step.args?.includes("validate:impact-ledger")), "local static qualification must validate the impact ledger");
assert.ok(ci.includes("npm run qualify:static"), "CI must invoke the canonical static lane");
assert.ok(operations.includes("| Registered accounts | Authoritative aggregate count of Supabase/Auth accounts") && operations.includes("| Signed-in users | Distinct identified users with `sign_in_completed`"), "registered accounts and signed-in users must remain distinct");
assert.ok(!operations.includes("Registered users | Distinct identified users with a successful `sign_in_completed`"), "sign-in events cannot define registered users");
for (const key of ["analytics_source_reference", "account_source_reference", "product_data_source_reference"]) assert.equal(typeof monthlySnapshotTemplate[key], "string", `monthly snapshot template must include ${key}`);
for (const marker of ["NEXT_PUBLIC_POSTHOG_KEY", "private routes produce no pageviews", "Seven-day useful-action return", "### 1. Acquisition / activation", "Templates and records with `record_kind: \"template\"` are never counted", "Do not add a decorative banner"]) assert.ok(operations.includes(marker) || read("docs/impact-ledger/README.md").includes(marker), `launch evidence operations are missing ${marker}`);
assert.ok(privacy.includes("fixed product events") && privacy.includes("inactive when its public environment key is absent"), "privacy copy must describe optional analytics");
assert.ok(!analytics.includes("autocapture: true") && !analytics.includes("disable_session_recording: false") && !analytics.includes("capture_exceptions: true"), "P0.9 must preserve privacy-first PostHog configuration");
const snapshot = {
  record_kind: "evidence",
  analytics_definition_version: ANALYTICS_DEFINITION_VERSION,
  month: "2026-08",
  measurement_window: { start: "2026-08-01T00:00:00Z", end: "2026-09-01T00:00:00Z" },
  analytics_source_reference: "docs/impact-ledger/references/analytics-2026-08.json",
  account_source_reference: "docs/impact-ledger/references/accounts-2026-08.json",
  product_data_source_reference: "docs/impact-ledger/references/approvals-2026-08.json",
  metrics: Object.fromEntries(Object.keys(monthlySnapshotTemplate.metrics).map((metric) => [metric, 0])),
  notes: "Verified aggregate fixture.",
};
const validationInstant = new Date("2026-09-02T12:00:00.000Z");
const validationOptions = { validationInstant };
const snapshotPath = "docs/impact-ledger/snapshots/2026-08.json";
const clone = (value) => structuredClone(value);
const mustReject = (validate, message, expected = undefined) => assert.throws(validate, expected, message);

assert.doesNotThrow(() => validateSnapshot(snapshot, snapshotPath, validationOptions), "snapshot source provenance must cover analytics, account, and product-data metrics at an injected validation instant");
mustReject(() => validateSnapshot({ ...snapshot, account_source_reference: "" }, snapshotPath, validationOptions), "registered accounts require authoritative account provenance", /account_source_reference must be a non-empty trimmed string/);
mustReject(() => validateSnapshot(snapshot, snapshotPath, { validationInstant: new Date("invalid") }), "snapshot validation must reject an invalid injected clock before validating record fields", /validationInstant must be a valid Date/);
for (const [reference, expected, message] of [
  ["PostHog aggregate report", /valid HTTPS URL or clearly shaped safe repository-relative path/, "arbitrary prose must not satisfy an aggregate evidence reference"],
  ["docs/impact-ledger/../private.json", /must not be an absolute, backslash, or traversing path/, "traversing aggregate evidence references must be rejected"],
  ["docs\\impact-ledger\\references\\analytics.json", /must not be an absolute, backslash, or traversing path/, "backslash aggregate evidence references must be rejected"],
  ["http://example.com/analytics.json", /must use (?:the )?exact https:\/\/ form/, "HTTP aggregate evidence references must be rejected"],
  ["https://user:password@example.com/analytics.json", /must not contain URL credentials/, "credential-bearing aggregate evidence references must be rejected"],
  ["docs/impact-ledger/references/analytics\nprivate.json", /bounded single-line reference without control characters/, "control characters in aggregate evidence references must be rejected"],
]) mustReject(
  () => validateSnapshot({ ...snapshot, analytics_source_reference: reference }, snapshotPath, validationOptions),
  message,
  expected,
);
for (const [record, path, expected, message] of [
  [{ ...snapshot, month: "2026-13" }, "docs/impact-ledger/snapshots/2026-13.json", /month must identify a real UTC calendar month/, "out-of-range snapshot months must be rejected"],
  [snapshot, "docs/impact-ledger/snapshots/2026-07.json", /month must equal snapshot filename 2026-07/, "snapshot month must match its filename"],
  [{ ...snapshot, measurement_window: { start: "2026-08-01", end: snapshot.measurement_window.end } }, snapshotPath, /measurement_window\.start must be the canonical UTC start/, "malformed measurement timestamps must be rejected"],
  [{ ...snapshot, measurement_window: { start: "2026-08-32T00:00:00Z", end: snapshot.measurement_window.end } }, snapshotPath, /measurement_window\.start must be the canonical UTC start/, "rollover measurement dates must be rejected"],
  [{ ...snapshot, measurement_window: { start: "2026-10-01T00:00:00Z", end: "2026-11-01T00:00:00Z" }, month: "2026-10" }, "docs/impact-ledger/snapshots/2026-10.json", /measurement_window must not end after validationInstant/, "future measurement windows must be rejected"],
  [{ ...snapshot, measurement_window: { start: "2026-08-01T00:00:01Z", end: snapshot.measurement_window.end } }, snapshotPath, /measurement_window\.start must be the canonical UTC start/, "measurement windows must start at the exact month boundary"],
  [{ ...snapshot, measurement_window: { start: snapshot.measurement_window.start, end: "2026-08-31T23:59:59Z" } }, snapshotPath, /measurement_window\.end must be the canonical UTC start/, "measurement windows must end at the exact next-month boundary"],
  [{ ...snapshot, measurement_window: { start: snapshot.measurement_window.end, end: snapshot.measurement_window.start } }, snapshotPath, /measurement_window\.start must be the canonical UTC start/, "reversed measurement windows must be rejected"],
]) mustReject(() => validateSnapshot(record, path, validationOptions), message, expected);

mustReject(() => validateSnapshot({ ...snapshot, undeclared: true }, snapshotPath, validationOptions), "undeclared snapshot keys must be rejected", /snapshot must contain exactly/);
mustReject(() => validateSnapshot({ ...snapshot, measurement_window: { ...snapshot.measurement_window, timezone: "UTC" } }, snapshotPath, validationOptions), "undeclared measurement-window keys must be rejected", /measurement_window must contain exactly: end, start/);
mustReject(() => validateSnapshot({ ...snapshot, metrics: { ...snapshot.metrics, invented_metric: 1 } }, snapshotPath, validationOptions), "undeclared metrics must be rejected", /metrics must contain exactly/);
const missingMetricSnapshot = clone(snapshot);
delete missingMetricSnapshot.metrics.registered_accounts;
mustReject(() => validateSnapshot(missingMetricSnapshot, snapshotPath, validationOptions), "every declared metric must be present", /metrics must contain exactly/);
for (const [value, message] of [
  [-1, "negative count metrics must be rejected"],
  [0.5, "fractional count metrics must be rejected"],
  [Number.MAX_SAFE_INTEGER + 1, "unsafe count metrics must be rejected"],
]) mustReject(() => validateSnapshot({ ...snapshot, metrics: { ...snapshot.metrics, registered_accounts: value } }, snapshotPath, validationOptions), message, /registered_accounts must be a nonnegative safe integer/);
for (const rate of [-0.01, 1.01, Number.NaN]) {
  mustReject(() => validateSnapshot({ ...snapshot, metrics: { ...snapshot.metrics, seven_day_return_rate: rate } }, snapshotPath, validationOptions), `invalid seven-day return rate must be rejected: ${String(rate)}`, /seven_day_return_rate must be a finite decimal from 0 to 1/);
}
assert.doesNotThrow(
  () => validateSnapshot({ ...snapshot, metrics: { ...snapshot.metrics, registered_accounts: Number.MAX_SAFE_INTEGER, seven_day_return_rate: 0.5 } }, snapshotPath, validationOptions),
  "safe integer counts and fractional rates within zero to one must remain valid",
);

const release = {
  record_kind: "evidence",
  release: "v1.2.3",
  date: "2026-09-02",
  git_sha: "0123456789abcdef0123456789abcdef01234567",
  major_capabilities: ["Verified capability"],
  deployment: { environment: "production", url: "https://engineering-foundry.example" },
  ci_run: "https://github.com/example/engineering-foundry/actions/runs/1",
  latest_migration: "no schema change",
  owner_verification: { verified_by: "release owner", verified_at: "2026-09-02" },
  notes: "Verified release fixture.",
};
const releasePath = "docs/impact-ledger/releases/2026-09-02-v1.2.3.json";
assert.doesNotThrow(() => validateRelease(release, releasePath, validationOptions), "canonical release evidence must validate at an injected instant");
mustReject(() => validateRelease(release, releasePath, { validationInstant: "2026-09-02" }), "release validation must reject a non-Date injected clock", /validationInstant must be a valid Date/);
for (const [record, expected, message] of [
  [{ ...release, date: "2026-9-2" }, /date must use exact YYYY-MM-DD format/, "malformed release dates must be rejected"],
  [{ ...release, date: "2026-02-30" }, /date must identify a real UTC calendar date/, "rollover release dates must be rejected"],
  [{ ...release, date: "2026-09-03" }, /date must not be later than the validation date/, "future release dates must be rejected"],
  [{ ...release, git_sha: "0123456" }, /git_sha must be a full lowercase 40-hex commit SHA/, "abbreviated release SHAs must be rejected"],
  [{ ...release, undeclared: true }, /release record must contain exactly/, "undeclared release keys must be rejected"],
  [{ ...release, deployment: { ...release.deployment, undeclared: true } }, /deployment must contain exactly: environment, url/, "undeclared deployment keys must be rejected"],
  [{ ...release, owner_verification: { ...release.owner_verification, undeclared: true } }, /owner_verification must contain exactly: verified_at, verified_by/, "undeclared owner-verification keys must be rejected"],
  [{ ...release, owner_verification: { ...release.owner_verification, verified_at: "2026-09-03" } }, /owner_verification\.verified_at must not be later than the validation date/, "future release verification dates must be rejected"],
]) mustReject(() => validateRelease(record, releasePath, validationOptions), message, expected);
mustReject(
  () => validateRelease({ ...release, owner_verification: { ...release.owner_verification, verified_at: "2026-09-01" } }, releasePath, validationOptions),
  "release verification must not predate the release",
  /owner_verification\.verified_at must not be earlier than the release date/,
);
for (const [field, value, expected, message] of [
  ["deployment", "http://engineering-foundry.example", /deployment\.url must use (?:HTTPS in )?(?:the )?exact https:\/\/ form/, "release deployment URLs must use HTTPS"],
  ["deployment", "https://", /deployment\.url must be a valid HTTPS URL/, "malformed release deployment URLs must be rejected"],
  ["deployment", "https://user:password@engineering-foundry.example", /deployment\.url must not contain URL credentials/, "credential-bearing release deployment URLs must be rejected"],
  ["ci_run", "http://github.com/example/actions/runs/1", /ci_run must use (?:HTTPS in )?(?:the )?exact https:\/\/ form/, "release CI URLs must use HTTPS"],
  ["ci_run", "https://", /ci_run must be a valid HTTPS URL/, "malformed release CI URLs must be rejected"],
  ["ci_run", "https://token:private@github.com/example/actions/runs/1", /ci_run must not contain URL credentials/, "credential-bearing release CI URLs must be rejected"],
]) {
  const invalidRelease = field === "deployment"
    ? { ...release, deployment: { ...release.deployment, url: value } }
    : { ...release, ci_run: value };
  mustReject(() => validateRelease(invalidRelease, releasePath, validationOptions), message, expected);
}

const evidence = {
  record_kind: "evidence",
  date: "2026-09-01",
  type: "article",
  title: "Independent review",
  source: "Independent publication",
  evidence_reference: "https://example.com/review",
  verified_by: "evidence reviewer",
  verified_at: "2026-09-02",
  notes: "Observed independent publication.",
};
const evidencePath = "docs/impact-ledger/records/2026-09-01-independent-review.json";
assert.doesNotThrow(() => validateEvidence(evidence, evidencePath, validationOptions), "canonical non-testimonial evidence must validate at an injected instant");
assert.doesNotThrow(
  () => validateEvidence({ ...evidence, evidence_reference: "docs/impact-ledger/references/independent-review.json" }, evidencePath, validationOptions),
  "a clearly shaped safe repository-relative evidence reference must remain valid",
);
mustReject(() => validateEvidence(evidence, evidencePath, { validationInstant: new Date("invalid") }), "evidence validation must reject an invalid injected clock", /validationInstant must be a valid Date/);
const testimonial = {
  ...evidence,
  type: "testimonial",
  title: "Consented testimonial",
  testimonial_permission: { retention_allowed: true, public_attribution_allowed: false, approved_excerpt: null },
};
assert.doesNotThrow(() => validateEvidence(testimonial, "docs/impact-ledger/records/2026-09-01-consented-testimonial.json", validationOptions), "a retained nonpublic testimonial with a null excerpt must remain valid");
for (const [record, expected, message] of [
  [{ ...evidence, date: "2026/09/01" }, /date must use exact YYYY-MM-DD format/, "malformed evidence dates must be rejected"],
  [{ ...evidence, date: "2026-02-29" }, /date must identify a real UTC calendar date/, "rollover evidence dates must be rejected in a non-leap year"],
  [{ ...evidence, date: "2026-09-03" }, /date must not be later than the validation date/, "future evidence dates must be rejected"],
  [{ ...evidence, verified_at: "2026-09-03" }, /verified_at must not be later than the validation date/, "future evidence verification dates must be rejected"],
  [{ ...evidence, undeclared: true }, /evidence record must contain exactly/, "undeclared evidence keys must be rejected"],
  [{ ...testimonial, testimonial_permission: { ...testimonial.testimonial_permission, undeclared: true } }, /testimonial_permission must contain exactly/, "undeclared testimonial-permission keys must be rejected"],
]) mustReject(() => validateEvidence(record, evidencePath, validationOptions), message, expected);
const testimonialWithoutPermission = clone(testimonial);
delete testimonialWithoutPermission.testimonial_permission;
mustReject(() => validateEvidence(testimonialWithoutPermission, evidencePath, validationOptions), "testimonials must include explicit permission metadata", /evidence record must contain exactly.*testimonial_permission/);
mustReject(() => validateEvidence({ ...testimonial, testimonial_permission: { ...testimonial.testimonial_permission, retention_allowed: "yes" } }, evidencePath, validationOptions), "testimonial retention permission must be boolean", /testimonial retention consent must be explicit/);
mustReject(() => validateEvidence({ ...testimonial, testimonial_permission: { ...testimonial.testimonial_permission, public_attribution_allowed: "yes" } }, evidencePath, validationOptions), "testimonial attribution permission must be boolean", /testimonial attribution consent must be explicit/);
mustReject(() => validateEvidence({ ...evidence, testimonial_permission: testimonial.testimonial_permission }, evidencePath, validationOptions), "non-testimonial evidence must not carry testimonial-only permission metadata", /evidence record must contain exactly/);
mustReject(
  () => validateEvidence({ ...testimonial, testimonial_permission: { ...testimonial.testimonial_permission, retention_allowed: false } }, evidencePath, validationOptions),
  "a real testimonial without retention consent must be rejected",
  /real testimonial retention consent must be explicitly true/,
);
mustReject(
  () => validateEvidence({ ...testimonial, testimonial_permission: { ...testimonial.testimonial_permission, approved_excerpt: "Private quote" } }, evidencePath, validationOptions),
  "a testimonial excerpt without public-attribution permission must be rejected",
  /approved_excerpt must be null unless public attribution is allowed/,
);
mustReject(
  () => validateEvidence({ ...evidence, date: "2026-09-02", verified_at: "2026-09-01" }, "docs/impact-ledger/records/2026-09-02-independent-review.json", validationOptions),
  "evidence verification must not predate the evidence",
  /verified_at must not be earlier than the evidence date/,
);

const dispatcherRoot = mkdtempSync(join(tmpdir(), "engineering-foundry-impact-ledger-"));
const writeLedgerFile = (relativePath, value) => {
  const path = join(dispatcherRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === "string" ? value : `${JSON.stringify(value)}\n`, "utf8");
  return path;
};
try {
  for (const templatePath of ["monthly-snapshot.template.json", "release-record.template.json", "evidence-record.template.json"]) {
    writeLedgerFile(templatePath, read(`docs/impact-ledger/${templatePath}`));
  }
  writeLedgerFile("snapshots/2026-08.json", snapshot);
  writeLedgerFile("releases/2026-09-02-v1.2.3.json", release);
  writeLedgerFile("records/2026-09-01-independent-review.json", evidence);
  assert.deepEqual(
    validateImpactLedger(dispatcherRoot, validationOptions).map((path) => relative(dispatcherRoot, path)).sort(),
    ["records/2026-09-01-independent-review.json", "releases/2026-09-02-v1.2.3.json", "snapshots/2026-08.json"],
    "the dispatcher must skip only the three canonical root templates and validate each direct real-record family",
  );

  for (const [fixturePath, record, expected, message] of [
    ["snapshots/monthly-snapshot.template.json", { record_kind: "template" }, /real records must declare record_kind: evidence/, "a canonical template name outside the ledger root must not be skipped"],
    ["unknown.template.json", { record_kind: "template" }, /real records must declare record_kind: evidence/, "an unknown root template must not be skipped"],
    ["releases/archive/2026-09-02-v1.2.3.json", release, /release record filename must be YYYY-MM-DD-nonempty-safe-suffix\.json directly under releases/, "nested release records must be rejected"],
    ["releases/release.json", release, /release record filename must be YYYY-MM-DD-nonempty-safe-suffix\.json directly under releases/, "arbitrarily named release records must be rejected"],
    ["releases/2026-09-01-v1.2.3.json", release, /date must equal the release filename date prefix/, "release filenames must match the record date"],
    ["records/archive/2026-09-01-independent-review.json", evidence, /evidence record filename must be YYYY-MM-DD-nonempty-safe-suffix\.json directly under records/, "nested evidence records must be rejected"],
    ["records/review.json", evidence, /evidence record filename must be YYYY-MM-DD-nonempty-safe-suffix\.json directly under records/, "arbitrarily named evidence records must be rejected"],
    ["records/2026-08-31-independent-review.json", evidence, /date must equal the evidence filename date prefix/, "evidence filenames must match the record date"],
  ]) {
    const fixture = writeLedgerFile(fixturePath, record);
    try {
      mustReject(() => validateImpactLedger(dispatcherRoot, validationOptions), message, expected);
    } finally {
      rmSync(fixture);
    }
  }
} finally {
  rmSync(dispatcherRoot, { recursive: true, force: true });
}

console.log(`P0.9 analytics/evidence regression passed: ${FIRST_USEFUL_ACTION_EVENTS.length} first-useful-action events, explicit property allowlists, post-success activity semantics, dashboard/runbook definitions, and no fabricated evidence.`);
