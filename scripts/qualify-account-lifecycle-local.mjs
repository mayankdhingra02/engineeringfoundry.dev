import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildAccountExport } from "../lib/account/export.ts";
import { queryLocalDatabase, readLocalSupabaseEnvironment, removeTrackedId } from "./lib/local-supabase.mjs";

if (existsSync(".env.local")) {
  process.loadEnvFile?.(".env.local");
}
const localEnvironment = readLocalSupabaseEnvironment();
const apiUrl = localEnvironment.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = localEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "Phase8Qualification123!";

const options = { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } };
const serviceToken = localEnvironment.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(publishableKey && serviceToken, "Local Supabase status did not provide the required keys.");
const admin = createClient(apiUrl, serviceToken, options);
const anon = createClient(apiUrl, publishableKey, options);
const stamp = randomUUID();
const emails = [`phase8-a-${stamp}@example.test`, `phase8-b-${stamp}@example.test`];
const feedbackMessage = `Private lifecycle feedback ${stamp}`;
const createdIds = [];
const results = [];

async function check(name, work) {
  try {
    const note = await work();
    results.push({ name, status: "PASS" });
    console.log(`PASS  ${name}${note ? ` — ${note}` : ""}`);
  } catch (error) {
    results.push({ name, status: "FAIL" });
    console.log(`FAIL  ${name} — ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function createAccount(email) {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  assert.ok(created.data.user);
  createdIds.push(created.data.user.id);
  const client = createClient(apiUrl, publishableKey, options);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  assert.ok(signedIn.data.user);
  return { client, user: signedIn.data.user };
}

let qualificationError;
const cleanupFailures = [];
try {
  // Sequential creation ensures finally never races a still-pending create.
  const a = await createAccount(emails[0]);
  const b = await createAccount(emails[1]);
  let applicationId;
  let roundId;

await check("new users begin with explicit incomplete onboarding state", async () => {
  const profile = await a.client.from("profiles").select("onboarding_complete,onboarding_completed_at").single();
  assert.ifError(profile.error);
  assert.equal(profile.data.onboarding_complete, false);
  assert.equal(profile.data.onboarding_completed_at, null);
});

await check("onboarding persists role, focus, DSA suggestion, and Phase 7 timezone", async () => {
  const completion = await a.client.rpc("complete_account_onboarding", {
    preferred_role_level_value: "sde2",
    primary_preparation_focus_value: "dsa",
    preferred_timezone_value: "America/Chicago",
  });
  assert.ifError(completion.error);
  const [profile, preference, reminder] = await Promise.all([
    a.client.from("profiles").select("onboarding_complete,onboarding_completed_at").single(),
    a.client.from("user_preparation_preferences").select("preferred_role_level,primary_preparation_focus,dsa_level").single(),
    a.client.from("interview_reminder_preferences").select("preferred_timezone").single(),
  ]);
  assert.equal(profile.data?.onboarding_complete, true);
  assert.ok(profile.data?.onboarding_completed_at);
  assert.deepEqual(preference.data, { preferred_role_level: "sde2", primary_preparation_focus: "dsa", dsa_level: "sde2" });
  assert.equal(reminder.data?.preferred_timezone, "America/Chicago");
});

await check("skip completes User B without invented preferences", async () => {
  const completion = await b.client.rpc("complete_account_onboarding", {
    preferred_role_level_value: null,
    primary_preparation_focus_value: null,
    preferred_timezone_value: null,
  });
  assert.ifError(completion.error);
  const preference = await b.client.from("user_preparation_preferences").select("user_id");
  assert.equal(preference.data?.length, 0);
});

await check("User B cannot read or update User A settings", async () => {
  const read = await b.client.from("user_preparation_preferences").select("preferred_role_level").eq("user_id", a.user.id);
  assert.ifError(read.error);
  assert.equal(read.data.length, 0);
  const update = await b.client.from("profiles").update({ display_name: "Intrusion" }).eq("id", a.user.id).select("id");
  assert.ifError(update.error);
  assert.equal(update.data.length, 0);
});

await check("disposable account can populate every major private workspace", async () => {
  const application = await a.client.from("applications").insert({ user_id: a.user.id, company_name: "Phase 8 Disposable Co", role_title: "SDE II", status: "Interviewing", notes: "Private application note" }).select("id").single();
  assert.ifError(application.error);
  applicationId = application.data.id;
  const round = await a.client.from("interview_rounds").insert({ application_id: applicationId, user_id: a.user.id, round_number: 1, round_name: "Technical screen", round_type: "Coding", scheduled_at: "2099-09-01T18:00:00Z", timezone: "America/Chicago", status: "Scheduled", notes: "Private round note" }).select("id").single();
  assert.ifError(round.error);
  roundId = round.data.id;
  assert.ifError((await a.client.rpc("save_interview_preparation", { target_round_id: roundId, notes_value: "Private preparation note" })).error);
  assert.ifError((await a.client.rpc("set_interview_preparation_checklist_item", { target_round_id: roundId, target_item_id: "dsa-review-queue", target_completed: true })).error);
  const story = await a.client.rpc("create_behavioral_story_with_themes", {
    target_title: "Phase 8 disposable story",
    target_company_or_context: null,
    target_role: null,
    target_approximate_period: null,
    target_project: null,
    target_situation: "Private behavioral situation",
    target_task: null,
    target_action: null,
    target_result: null,
    target_reflection: null,
    target_short_summary: null,
    target_notes: "Private behavioral note",
    target_themes: ["Leadership"],
  });
  assert.ifError(story.error);
  assert.equal(story.data?.length, 1);
  assert.ifError((await a.client.from("behavioral_answers").insert({ user_id: a.user.id, curated_question_id: "beh-lead-01", story_id: story.data[0].story_id, title: "Phase 8 private answer", opening_framing: "Private opening framing", details_to_emphasize: "Private detail to emphasize", details_to_avoid: "Private detail to avoid", answer_text: "Private prepared answer" })).error);
  assert.ifError((await a.client.rpc("save_dsa_question_progress_if_revision", { target_question_id: "two-sum", target_expect_absent: true, target_expected_updated_at: null, target_status: "attempted", target_confidence: "medium", target_bookmarked: true, target_notes: "Private DSA note" })).error);
  assert.ifError((await a.client.rpc("save_system_design_item_progress", { target_item_id: "introduction", target_item_type: "concept", target_status: "reviewed", target_confidence: "medium", target_bookmarked: true, target_notes: "Private System Design note" })).error);
  const document = { functional_requirements: [], non_functional_requirements: [], capacity: { assumptions: [], calculations: [] }, apis: [], data_models: [], high_level_design: "Private design", deep_dives: [], bottlenecks: [], failure_modes: [], tradeoffs: [], follow_ups: [], final_review_notes: "" };
  assert.ifError((await a.client.rpc("create_system_design_attempt", { target_problem_id: "url-shortener", target_application_id: applicationId, target_title: "Phase 8 disposable attempt", target_document: document })).error);
  const reminders = await a.client.from("interview_reminders").select("id").eq("round_id", roundId);
  assert.ok((reminders.data?.length ?? 0) > 0, "future interview did not create reminders");
  const feedback = await a.client.rpc("submit_feedback_submission", { payload: { category: "bug", message: feedbackMessage, page_context: "/dashboard", contact_email: null, contact_consent: false }, anonymous_subject: null });
  assert.ifError(feedback.error);
});

let exportPayload;
await check("private JSON export contains owned Phase 1–7 data and excludes secrets", async () => {
  exportPayload = await buildAccountExport({ user: a.user, supabase: a.client });
  assert.equal(exportPayload.export_version, "1.5");
  assert.equal(exportPayload.applications.length, 1);
  assert.equal(exportPayload.interview_rounds.length, 1);
  assert.equal(exportPayload.interview_preparation.records[0].private_notes, "Private preparation note");
  assert.equal(exportPayload.behavioral.stories[0].notes, "Private behavioral note");
  assert.equal(exportPayload.behavioral.answers[0].opening_framing, "Private opening framing");
  assert.equal(exportPayload.behavioral.answers[0].details_to_emphasize, "Private detail to emphasize");
  assert.equal(exportPayload.behavioral.answers[0].details_to_avoid, "Private detail to avoid");
  assert.equal(exportPayload.dsa.question_progress[0].notes, "Private DSA note");
  assert.equal(exportPayload.system_design.item_progress[0].notes, "Private System Design note");
  assert.equal(exportPayload.system_design.attempts.length, 1);
  assert.equal(exportPayload.account.preparation_preferences.preferred_role_level, "sde2");
  assert.equal(exportPayload.feedback.submissions[0].message, feedbackMessage);
  const serialized = JSON.stringify(exportPayload);
  for (const forbidden of ["access_token", "refresh_token", "encrypted_password", "claim_token", "provider_message_id", "service_role"]) assert.ok(!serialized.includes(forbidden), `export leaked ${forbidden}`);
});

await check("User B export cannot be redirected to User A", async () => {
  const payload = await buildAccountExport({ user: b.user, supabase: b.client });
  assert.equal(payload.applications.length, 0);
  assert.ok(!JSON.stringify(payload).includes("Phase 8 Disposable Co"));
});

await check("privileged Auth deletion removes identity, private rows, reminders, and stale access", async () => {
  const deleted = await admin.auth.admin.deleteUser(a.user.id, false);
  if (deleted.error) throw new Error(`Auth deletion failed (${deleted.error.status ?? "unknown"}): ${deleted.error.message}`);
  assert.equal(removeTrackedId(createdIds, a.user.id), true, "deleted account was not tracked for cleanup");
  const authLookup = await admin.auth.admin.getUserById(a.user.id);
  assert.ok(authLookup.error || !authLookup.data.user);
  const tables = ["applications", "interview_rounds", "interview_preparations", "behavioral_stories", "dsa_question_progress", "system_design_item_progress", "system_design_attempts", "user_preparation_preferences", "interview_reminder_preferences", "interview_reminders"];
  for (const table of tables) {
    assert.match(table, /^[a-z_]+$/, "cascade check contains an unsafe table identifier");
    const count = queryLocalDatabase(`select count(*) from public.${table} where user_id = :'user_id'::uuid`, { user_id: a.user.id });
    assert.equal(count, "0", `${table} retained deleted-user rows`);
  }
  const staleUser = await a.client.auth.getUser();
  assert.ok(staleUser.error || !staleUser.data.user, "deleted session still resolves an Auth user");
  const staleRead = await a.client.from("applications").select("id");
  assert.equal(staleRead.data?.length ?? 0, 0);
  const feedbackActorAfterDeletion = queryLocalDatabase("select coalesce(actor_id::text, 'null') from public.feedback_submissions where message = :'feedback_message'", { feedback_message: feedbackMessage });
  assert.equal(feedbackActorAfterDeletion, "null", "feedback account linkage was retained after deletion");
});

await check("anonymous clients cannot invoke account lifecycle RPCs", async () => {
  assert.ok((await anon.rpc("complete_account_onboarding", { preferred_role_level_value: null, primary_preparation_focus_value: null, preferred_timezone_value: null })).error);
  assert.ok((await anon.rpc("save_account_preparation_preferences", { preferred_role_level_value: "sde1", primary_preparation_focus_value: "dsa", preferred_dsa_level_value: "sde1" })).error);
});

  const failures = results.filter((result) => result.status === "FAIL");
  if (failures.length) throw new Error(`${failures.length} lifecycle qualification check(s) failed.`);
} catch (error) {
  qualificationError = error;
} finally {
  for (const userId of [...createdIds]) {
    try {
      const deleted = await admin.auth.admin.deleteUser(userId, false);
      if (deleted.error) {
        cleanupFailures.push(`Could not remove disposable account ${userId}: ${deleted.error.message}`);
      } else {
        removeTrackedId(createdIds, userId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      cleanupFailures.push(`Could not remove disposable account ${userId}: ${message}`);
    }
  }
  for (const message of cleanupFailures) console.error(`CLEANUP FAIL  ${message}`);
}

if (qualificationError && cleanupFailures.length) {
  throw new AggregateError([qualificationError, ...cleanupFailures.map((message) => new Error(message))], "Lifecycle qualification and cleanup both failed.");
}
if (qualificationError) throw qualificationError;
if (cleanupFailures.length) throw new AggregateError(cleanupFailures.map((message) => new Error(message)), "Lifecycle cleanup failed.");
console.log(`\n${results.length}/${results.length} Phase 8 local lifecycle checks passed; disposable accounts removed.`);
