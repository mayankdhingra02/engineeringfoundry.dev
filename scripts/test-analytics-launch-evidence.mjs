import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  ANALYTICS_DEFINITION_VERSION,
  FIRST_USEFUL_ACTION_EVENTS,
  P09_EVENT_PROPERTY_ALLOWLIST,
  sanitizeP09AnalyticsProperties,
} from "../lib/analytics/launch-metrics.ts";
import { validateSnapshot } from "./validate-impact-ledger.mjs";
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
  analytics_source_reference: "PostHog aggregate report",
  account_source_reference: "Supabase aggregate account count",
  product_data_source_reference: "Supabase aggregate approval count",
  metrics: Object.fromEntries(Object.keys(monthlySnapshotTemplate.metrics).map((metric) => [metric, 0])),
};
assert.doesNotThrow(() => validateSnapshot(snapshot, "docs/impact-ledger/snapshots/2026-08.json"), "snapshot source provenance must cover analytics, account, and product-data metrics");
assert.throws(() => validateSnapshot({ ...snapshot, account_source_reference: "" }, "docs/impact-ledger/snapshots/2026-08.json"), /account_source_reference/, "registered accounts require authoritative account provenance");
assert.throws(() => validateSnapshot({ ...snapshot, metrics: { ...snapshot.metrics, registered_accounts: -1 } }, "docs/impact-ledger/snapshots/2026-08.json"), /registered_accounts/, "impossible account metrics must be rejected");

console.log(`P0.9 analytics/evidence regression passed: ${FIRST_USEFUL_ACTION_EVENTS.length} first-useful-action events, explicit property allowlists, post-success activity semantics, dashboard/runbook definitions, and no fabricated evidence.`);
