import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  ANALYTICS_DEFINITION_VERSION,
  FIRST_USEFUL_ACTION_EVENTS,
  P09_EVENT_PROPERTY_ALLOWLIST,
  sanitizeP09AnalyticsProperties,
} from "../lib/analytics/launch-metrics.ts";

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
const qualifier = read("scripts/qualify-launch.mjs");
const ci = read(".github/workflows/ci.yml");

assert.equal(ANALYTICS_DEFINITION_VERSION, "analytics-definition-v1");
assert.ok(FIRST_USEFUL_ACTION_EVENTS.length >= 8, "first useful action set must remain a deliberate multi-track set");
for (const event of Object.keys(P09_EVENT_PROPERTY_ALLOWLIST)) assert.ok(analytics.includes(`| "${event}"`), `${event} is not registered with the analytics event type`);
for (const event of [...analytics.matchAll(/\| "([^"]+)"/g)].map((match) => match[1])) assert.ok(docs.includes(`\`${event}\``), `analytics documentation does not classify registered event ${event}`);
assert.deepEqual(sanitizeP09AnalyticsProperties("dsa_practice_started", { track: "dsa", problem_id: "two-sum", notes: "private", application_id: "uuid" }), { track: "dsa", problem_id: "two-sum" });
assert.deepEqual(sanitizeP09AnalyticsProperties("dsa_practice_started", { track: "dsa", problem_id: "two-sum", source: "unreviewed free text" }), { track: "dsa", problem_id: "two-sum" });
assert.equal(sanitizeP09AnalyticsProperties("legacy_event", { notes: "not transformed here" })?.notes, "not transformed here", "legacy events must continue to rely on the global sanitizer");
assert.ok(analytics.includes("sanitizeP09AnalyticsProperties(event, properties)"), "P0.9 allowlist must execute before capture");
for (const event of ["dsa_practice_started", "system_design_practice_started", "ml_design_practice_started", "behavioral_practice_started", "low_level_design_lesson_opened", "low_level_design_practice_started", "preparation_activity_recorded", "low_level_design_activity_recorded", "continuation_presented", "continuation_selected", "study_plan_activated", "study_plan_resumed", "mock_review_saved"]) assert.ok(docs.includes(`\`${event}\``), `analytics docs omit ${event}`);
assert.ok(docs.includes("first useful action") && docs.includes("never mastery"), "first useful action and activity semantics must remain explicit");
assert.ok(home.includes('track("continuation_presented"') && home.includes('track("continuation_selected"'), "continuation instrumentation is missing");
assert.ok(home.includes('track("study_plan_resumed"') && read("components/save-study-plan-control.tsx").includes('track("study_plan_activated"'), "saved-plan activation/resume instrumentation is missing");
assert.ok(mock.includes('if (result.ok) track("mock_review_saved"'), "mock completion must wait for a successful persisted review");
assert.ok(preparationActivity.includes('next === "completed" && (saved || localRecorded)') && lldActivity.includes('if (!complete) track("low_level_design_activity_recorded"'), "activity completion must be post-success/local-record only");
assert.ok(dsaProgress.includes('recordedStatus === "not_started"') && systemDesignProgress.includes('recordedStatus === "not_started"'), "non-meaningful progress statuses must stay out of activity metrics");
assert.ok(lldLesson.includes('low_level_design_lesson_opened') && lldPractice.includes('low_level_design_practice_started'), "LLD start instrumentation is missing");
assert.ok(salary.includes('track("offer_comparison_opened", { surface: "salary-negotiation" })') && !salary.includes("track(", salary.indexOf("const update")), "salary analytics must not include worksheet values");
assert.ok(experience.includes('track("interview_experience_submitted"') && !experience.includes("companyName }") && !experience.includes("summary }"), "experience analytics must not include user-entered report fields");
assert.ok(qualifier.includes('["Impact ledger integrity", "npm", ["run", "validate:impact-ledger"]]'), "local static qualification must validate the impact ledger");
assert.ok(ci.includes("Validate impact ledger integrity") && ci.includes("npm run validate:impact-ledger"), "CI must validate the impact ledger");
for (const marker of ["NEXT_PUBLIC_POSTHOG_KEY", "private routes produce no pageviews", "Seven-day useful-action return", "### 1. Acquisition / activation", "Templates and records with `record_kind: \"template\"` are never counted", "Do not add a decorative banner"]) assert.ok(operations.includes(marker) || read("docs/impact-ledger/README.md").includes(marker), `launch evidence operations are missing ${marker}`);
assert.ok(privacy.includes("fixed product events") && privacy.includes("inactive when its public environment key is absent"), "privacy copy must describe optional analytics");
assert.ok(!analytics.includes("autocapture: true") && !analytics.includes("disable_session_recording: false") && !analytics.includes("capture_exceptions: true"), "P0.9 must preserve privacy-first PostHog configuration");

console.log(`P0.9 analytics/evidence regression passed: ${FIRST_USEFUL_ACTION_EVENTS.length} first-useful-action events, explicit property allowlists, post-success activity semantics, dashboard/runbook definitions, and no fabricated evidence.`);
