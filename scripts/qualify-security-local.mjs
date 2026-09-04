/**
 * Phase 9 security qualification against local Supabase.
 *
 * Two disposable accounts exercise the boundaries that only a real Data API can
 * prove: throttle ownership, cross-user isolation for the surfaces added since
 * Phase 6, canonical-ID forgery, and post-deletion access.
 *
 * Local only. This script refuses any non-local Supabase URL.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  process.loadEnvFile?.(".env.local");
}
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "Phase9Qualification123!";

if (!apiUrl || !publishableKey) throw new Error("Local Supabase public environment is not configured.");
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl)) {
  throw new Error("Refusing security qualification against a non-local Supabase project.");
}

function localServiceToken() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = execFileSync("docker", ["exec", "supabase_auth_Engineeringfoundry", "printenv", "GOTRUE_JWT_SECRET"], { encoding: "utf8" }).trim();
  assert.ok(secret, "local Supabase JWT secret was unavailable");
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ aud: "authenticated", sub: "00000000-0000-0000-0000-000000000000", role: "service_role", iss: "supabase", iat: issuedAt, exp: issuedAt + 3600 })}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
}

const options = { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } };
const admin = createClient(apiUrl, localServiceToken(), options);
const anon = createClient(apiUrl, publishableKey, options);
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emails = [`phase9-a-${stamp}@example.test`, `phase9-b-${stamp}@example.test`];
const createdIds = [];
const results = [];

function behavioralStoryArgs(overrides = {}) {
  return {
    target_title: "Phase 9 aggregate security story",
    target_company_or_context: null,
    target_role: null,
    target_approximate_period: null,
    target_project: null,
    target_situation: "A private aggregate security situation.",
    target_task: "Protect the private aggregate boundary.",
    target_action: "I validated every owner-derived write and exercised the aggregate mutation path.",
    target_result: "The private story and themes remained coherent.",
    target_reflection: null,
    target_short_summary: null,
    target_notes: "Owner A private Behavioral note.",
    target_themes: ["Ownership"],
    ...overrides,
  };
}

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
  createdIds.push(created.data.user.id);
  const client = createClient(apiUrl, publishableKey, options);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  return { client, user: signedIn.data.user };
}

const [a, b] = await Promise.all(emails.map(createAccount));
const consume = (client, max = 3, window = 900) =>
  client.rpc("consume_account_action_rate_limit", { action_key: "account_export", max_requests: max, window_seconds: window });

let behavioralStory;

await check("Behavioral aggregate RPCs deny anonymous callers", async () => {
  const attempts = await Promise.all([
    anon.rpc("create_behavioral_story_with_themes", behavioralStoryArgs()),
    anon.rpc("update_behavioral_story_with_themes_if_revision", {
      target_story_id: crypto.randomUUID(),
      target_expected_updated_at: new Date().toISOString(),
      ...behavioralStoryArgs(),
    }),
    anon.rpc("duplicate_behavioral_story_with_themes", { target_story_id: crypto.randomUUID() }),
  ]);
  for (const attempt of attempts) assert.equal(attempt.error?.code, "42501", "anonymous Behavioral aggregate execution must fail with 42501");
  return "create, update, and duplicate returned SQLSTATE 42501";
});

await check("Behavioral aggregate derives its owner and closes direct mutation bypasses", async () => {
  const created = await a.client.rpc("create_behavioral_story_with_themes", behavioralStoryArgs());
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1);
  behavioralStory = created.data[0];
  const directMutations = await Promise.all([
    a.client.from("behavioral_stories").insert({ user_id: a.user.id, title: "Direct bypass" }),
    a.client.from("behavioral_stories").update({ title: "Direct overwrite" }).eq("id", behavioralStory.story_id),
    a.client.from("behavioral_story_themes").insert({ user_id: a.user.id, story_id: behavioralStory.story_id, theme: "Conflict" }),
    a.client.from("behavioral_story_themes").delete().eq("story_id", behavioralStory.story_id),
  ]);
  for (const mutation of directMutations) assert.equal(mutation.error?.code, "42501", "direct Behavioral aggregate mutation must fail with 42501");
  const legacy = await a.client.rpc("replace_behavioral_story_themes", {
    target_story_id: behavioralStory.story_id,
    theme_values: ["Conflict"],
  });
  assert.equal(legacy.error?.code, "0A000", "legacy theme replacement must fail safely with 0A000");
  return `owner aggregate ${behavioralStory.story_id}; direct writes denied; legacy retired`;
});

await check("foreign and missing Behavioral aggregate targets are indistinguishable", async () => {
  assert.ok(behavioralStory, "owner Behavioral fixture was unavailable");
  const foreignUpdate = await b.client.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: behavioralStory.story_id,
    target_expected_updated_at: behavioralStory.updated_at,
    ...behavioralStoryArgs({ target_title: "Foreign overwrite" }),
  });
  const missingUpdate = await b.client.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: crypto.randomUUID(),
    target_expected_updated_at: behavioralStory.updated_at,
    ...behavioralStoryArgs({ target_title: "Missing overwrite" }),
  });
  const foreignDuplicate = await b.client.rpc("duplicate_behavioral_story_with_themes", { target_story_id: behavioralStory.story_id });
  const missingDuplicate = await b.client.rpc("duplicate_behavioral_story_with_themes", { target_story_id: crypto.randomUUID() });
  for (const attempt of [foreignUpdate, missingUpdate, foreignDuplicate, missingDuplicate]) {
    assert.ifError(attempt.error);
    assert.deepEqual(attempt.data, []);
  }
  const owner = await a.client.from("behavioral_stories").select("title,notes").eq("id", behavioralStory.story_id).single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, { title: "Phase 9 aggregate security story", notes: "Owner A private Behavioral note." });
  return "foreign and missing updates/duplicates returned zero rows; owner data unchanged";
});

// --- Export throttle -------------------------------------------------------
await check("User A consumes their own export budget", async () => {
  const first = await consume(a.client);
  assert.ifError(first.error);
  assert.equal(first.data[0].allowed, true);
  return `remaining ${first.data[0].remaining}`;
});

await check("the export budget is exhausted after the configured maximum", async () => {
  await consume(a.client);
  const third = await consume(a.client);
  assert.equal(third.data[0].allowed, true, "third request inside a budget of three must be allowed");
  const fourth = await consume(a.client);
  assert.equal(fourth.data[0].allowed, false, "fourth request must be denied");
  assert.ok(fourth.data[0].retry_after_seconds > 0, "a denied request must report a retry delay");
  return `retry after ${fourth.data[0].retry_after_seconds}s`;
});

await check("User B has an entirely independent budget", async () => {
  const first = await consume(b.client);
  assert.equal(first.data[0].allowed, true, "User A's exhausted budget must not throttle User B");
});

await check("User B cannot read User A throttle state", async () => {
  const { data, error } = await b.client.from("account_action_rate_limits").select("*").eq("user_id", a.user.id);
  assert.ifError(error);
  assert.equal(data.length, 0, "RLS must hide another account's throttle row");
});

await check("a client cannot delete its own throttle row to reset the limit", async () => {
  const { error } = await a.client.from("account_action_rate_limits").delete().eq("user_id", a.user.id);
  assert.ok(error, "delete must be refused");
  const stillDenied = await consume(a.client);
  assert.equal(stillDenied.data[0].allowed, false, "the limit must survive a reset attempt");
});

await check("a client cannot update its own throttle counter", async () => {
  const { error } = await a.client.from("account_action_rate_limits").update({ request_count: 0 }).eq("user_id", a.user.id);
  assert.ok(error, "update must be refused");
});

await check("a client cannot insert a throttle row for another account", async () => {
  const { error } = await b.client.from("account_action_rate_limits").insert({ user_id: a.user.id, action: "account_export", request_count: 0 });
  assert.ok(error, "insert must be refused");
});

await check("an anonymous caller cannot consume or read a budget", async () => {
  const consumed = await consume(anon);
  assert.ok(consumed.error, "anonymous RPC execution must be refused");
  const { data } = await anon.from("account_action_rate_limits").select("*");
  assert.ok(!data?.length, "anonymous reads must return nothing");
});

await check("an unrecognized throttle action is rejected", async () => {
  const { error } = await a.client.rpc("consume_account_action_rate_limit", { action_key: "free_stuff", max_requests: 100, window_seconds: 60 });
  assert.ok(error, "an unknown action must be refused");
});

// --- Canonical identifier forgery ------------------------------------------
await check("a fabricated DSA question cannot be persisted", async () => {
  const { error } = await a.client.rpc("save_dsa_question_progress_if_revision", {
    target_question_id: "totally-invented-question",
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_status: "solved",
    target_confidence: "high",
    target_bookmarked: false,
    target_notes: null,
  });
  assert.equal(error?.code, "23503", "an unknown canonical DSA id must fail with 23503");
});

await check("anonymous callers cannot invoke revision-checked DSA full progress", async () => {
  const attempted = await anon.rpc("save_dsa_question_progress_if_revision", {
    target_question_id: "two-sum",
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_status: "attempted",
    target_confidence: null,
    target_bookmarked: false,
    target_notes: null,
  });
  assert.equal(attempted.error?.code, "42501", "anonymous full progress must fail with 42501");
  return "SQLSTATE 42501";
});

await check("the authenticated legacy DSA full RPC is a no-mutation compatibility failure", async () => {
  const attempted = await a.client.rpc("save_dsa_question_progress", {
    target_question_id: "two-sum",
    target_status: "attempted",
    target_confidence: null,
    target_bookmarked: false,
    target_notes: null,
  });
  assert.equal(attempted.error?.code, "0A000", "legacy DSA full progress must fail with 0A000");
  return "SQLSTATE 0A000";
});

await check("atomic DSA quick progress rejects fabricated and ambiguous mutations", async () => {
  const fabricated = await a.client.rpc("set_dsa_question_quick_progress", {
    target_question_id: "totally-invented-question",
    target_status: "solved",
    target_bookmarked: null,
  });
  assert.equal(fabricated.error?.code, "23503", "an unknown canonical DSA id must fail with 23503");
  const ambiguous = await a.client.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum",
    target_status: "solved",
    target_bookmarked: true,
  });
  assert.equal(ambiguous.error?.code, "23514", "a multi-field quick mutation must fail with 23514");
  return "23503 fabricated; 23514 ambiguous";
});

await check("anonymous callers cannot invoke atomic DSA quick progress", async () => {
  const attempted = await anon.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum",
    target_status: "solved",
    target_bookmarked: null,
  });
  assert.equal(attempted.error?.code, "42501", "anonymous quick progress must fail with 42501");
  return "SQLSTATE 42501";
});

await check("atomic DSA quick progress derives the owner without exposing a foreign row", async () => {
  const ownerSeed = await a.client.rpc("save_dsa_question_progress_if_revision", {
    target_question_id: "two-sum",
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_status: "attempted",
    target_confidence: "high",
    target_bookmarked: true,
    target_notes: "Owner A private quick-progress fixture.",
  });
  assert.ifError(ownerSeed.error);
  assert.equal(ownerSeed.data?.length, 1, "owner revision seed did not return one row");
  const foreignRevisionAttempt = await b.client.rpc("save_dsa_question_progress_if_revision", {
    target_question_id: "two-sum",
    target_expect_absent: false,
    target_expected_updated_at: ownerSeed.data[0].updated_at,
    target_status: "review",
    target_confidence: "low",
    target_bookmarked: false,
    target_notes: "Foreign revision must not identify or change the owner row.",
  });
  assert.ifError(foreignRevisionAttempt.error);
  assert.deepEqual(foreignRevisionAttempt.data, [], "a foreign revision was distinguishable from a missing owner row");
  const foreignAttempt = await b.client.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum",
    target_status: "solved",
    target_bookmarked: null,
  });
  assert.ifError(foreignAttempt.error);
  assert.equal(foreignAttempt.data, "two-sum");
  const ownerRead = await a.client.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("question_id", "two-sum").single();
  assert.ifError(ownerRead.error);
  assert.deepEqual(ownerRead.data, {
    status: "attempted",
    confidence: "high",
    bookmarked: true,
    notes: "Owner A private quick-progress fixture.",
  });
  const callerRead = await b.client.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("question_id", "two-sum").single();
  assert.ifError(callerRead.error);
  assert.deepEqual(callerRead.data, { status: "solved", confidence: null, bookmarked: false, notes: null });
  return "separate owner rows; private fields preserved";
});

await check("anonymous callers cannot invoke insert-only browser import RPCs or System Design revision and quick saves", async () => {
  const attempts = await Promise.all([
    anon.rpc("save_system_design_item_progress_if_revision", {
      target_item_id: "estimation", target_item_type: "concept",
      target_expect_absent: true, target_expected_updated_at: null,
      target_status: "reviewed", target_confidence: null,
      target_bookmarked: false, target_notes: null,
    }),
    anon.rpc("set_system_design_item_quick_progress", {
      target_item_id: "estimation", target_item_type: "concept", target_status: "reviewed",
    }),
    anon.rpc("import_dsa_question_progress_if_absent", { target_question_id: "two-sum", target_status: "attempted" }),
    anon.rpc("import_system_design_item_progress_if_absent", { target_item_id: "estimation", target_item_type: "concept" }),
    anon.rpc("import_preparation_track_progress_if_absent", { target_track: "behavioral", target_item_id: "beh-lead-01", target_status: "completed" }),
  ]);
  for (const attempt of attempts) assert.equal(attempt.error?.code, "42501", "anonymous progress execution must fail with 42501");
  return "all five RPCs returned SQLSTATE 42501";
});

await check("insert-only browser import RPCs reject invalid catalog and bounded values", async () => {
  const invalid = await Promise.all([
    a.client.rpc("import_dsa_question_progress_if_absent", { target_question_id: "fabricated-question", target_status: "attempted" }),
    a.client.rpc("import_dsa_question_progress_if_absent", { target_question_id: "two-sum", target_status: "solved" }),
    a.client.rpc("import_system_design_item_progress_if_absent", { target_item_id: "fabricated-concept", target_item_type: "concept" }),
    a.client.rpc("import_system_design_item_progress_if_absent", { target_item_id: "estimation", target_item_type: "lesson" }),
    a.client.rpc("import_preparation_track_progress_if_absent", { target_track: "dsa", target_item_id: "two-sum", target_status: "completed" }),
    a.client.rpc("import_preparation_track_progress_if_absent", { target_track: "behavioral", target_item_id: "Not Canonical", target_status: "completed" }),
  ]);
  assert.deepEqual(invalid.map((result) => result.error?.code), ["23503", "23514", "23503", "23514", "23514", "23514"]);
  return "catalog failures 23503; bounded-value failures 23514";
});

await check("insert-only browser imports derive independent owners without exposing foreign state", async () => {
  const seeded = await Promise.all([
    a.client.rpc("save_dsa_question_progress_if_revision", {
      target_question_id: "valid-palindrome", target_status: "solved", target_confidence: "high",
      target_expect_absent: true, target_expected_updated_at: null,
      target_bookmarked: true, target_notes: "Owner A import-isolation note.",
    }),
    a.client.rpc("save_system_design_item_progress_if_revision", {
      target_item_id: "leaderboard", target_item_type: "design_problem",
      target_expect_absent: true, target_expected_updated_at: null, target_status: "comfortable",
      target_confidence: "high", target_bookmarked: true, target_notes: "Owner A design isolation note.",
    }),
    a.client.rpc("save_preparation_track_progress", {
      target_track: "behavioral", target_item_id: "beh-lead-02", target_status: "completed",
    }),
  ]);
  for (const result of seeded) assert.ifError(result.error);

  const ownerBefore = await Promise.all([
    a.client.from("dsa_question_progress").select("*").eq("question_id", "valid-palindrome").single(),
    a.client.from("system_design_item_progress").select("*").eq("item_id", "leaderboard").eq("item_type", "design_problem").single(),
    a.client.from("preparation_track_progress").select("*").eq("track", "behavioral").eq("item_id", "beh-lead-02").single(),
  ]);
  for (const result of ownerBefore) assert.ifError(result.error);

  const foreignFull = await b.client.rpc("save_system_design_item_progress_if_revision", {
    target_item_id: "leaderboard", target_item_type: "design_problem",
    target_expect_absent: false, target_expected_updated_at: seeded[1].data[0].updated_at,
    target_status: "not_started", target_confidence: null,
    target_bookmarked: false, target_notes: "Foreign overwrite must not identify the owner row.",
  });
  assert.ifError(foreignFull.error);
  assert.deepEqual(foreignFull.data, [], "foreign and missing System Design full-save targets must be indistinguishable");

  const foreignSameKeys = await Promise.all([
    b.client.rpc("import_dsa_question_progress_if_absent", { target_question_id: "valid-palindrome", target_status: "attempted" }),
    b.client.rpc("import_system_design_item_progress_if_absent", { target_item_id: "leaderboard", target_item_type: "design_problem" }),
    b.client.rpc("import_preparation_track_progress_if_absent", { target_track: "behavioral", target_item_id: "beh-lead-02", target_status: "in-progress" }),
  ]);
  for (const result of foreignSameKeys) {
    assert.ifError(result.error);
    assert.equal(result.data, true, "another owner's matching key must not be reported as existing");
  }

  const ownerAfter = await Promise.all([
    a.client.from("dsa_question_progress").select("*").eq("question_id", "valid-palindrome").single(),
    a.client.from("system_design_item_progress").select("*").eq("item_id", "leaderboard").eq("item_type", "design_problem").single(),
    a.client.from("preparation_track_progress").select("*").eq("track", "behavioral").eq("item_id", "beh-lead-02").single(),
  ]);
  for (const result of ownerAfter) assert.ifError(result.error);
  assert.deepEqual(ownerAfter.map((result) => result.data), ownerBefore.map((result) => result.data), "foreign imports changed Owner A state");
  return "Owner B inserted three independent rows; Owner A rows unchanged";
});

await check("a fabricated System Design concept cannot be persisted", async () => {
  const { error } = await a.client.rpc("save_system_design_item_progress_if_revision", {
    target_item_id: "invented-concept",
    target_item_type: "concept",
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_status: "reviewed",
    target_confidence: "high",
    target_bookmarked: false,
    target_notes: null,
  });
  assert.equal(error?.code, "23503", "an unknown canonical System Design id must be refused by the database catalog boundary");
});

// --- Cross-user isolation for later-phase surfaces -------------------------
let roundId;
await check("User A creates an application and interview round", async () => {
  // user_id is supplied explicitly and RLS verifies it matches the caller; the
  // server never accepts it from a browser payload.
  const application = await a.client.from("applications").insert({ user_id: a.user.id, company_name: "Phase 9 Co", role_title: "SDE II", status: "Applied" }).select("id").single();
  assert.ifError(application.error);
  const round = await a.client.rpc("create_interview_round", {
    target_application_id: application.data.id,
    round_name_value: "System Design",
    round_type_value: "System Design",
    scheduled_at_value: new Date(Date.now() + 86_400_000).toISOString(),
    duration_minutes_value: 60,
    timezone_value: "America/Chicago",
  });
  assert.ifError(round.error);
  roundId = round.data;
  assert.ok(roundId);
});

await check("User B cannot read User A interview round", async () => {
  const { data, error } = await b.client.from("interview_rounds").select("*").eq("id", roundId);
  assert.ifError(error);
  assert.equal(data.length, 0);
});

await check("User A creates note-only preparation before checklist isolation checks", async () => {
  const { error } = await a.client.rpc("save_interview_preparation", {
    target_round_id: roundId,
    notes_value: "Owner-only preparation note",
  });
  assert.ifError(error);
});

await check("foreign and nonexistent checklist targets are indistinguishable and do not mutate", async () => {
  const foreign = await b.client.rpc("set_interview_preparation_checklist_item", {
    target_round_id: roundId,
    target_item_id: "dsa-review-queue",
    target_completed: true,
  });
  const missing = await b.client.rpc("set_interview_preparation_checklist_item", {
    target_round_id: "93939393-9393-4939-8939-939393939393",
    target_item_id: "dsa-review-queue",
    target_completed: true,
  });
  assert.ok(foreign.error && missing.error, "foreign and nonexistent checklist targets must both fail");
  assert.equal(foreign.error.code, "P0002");
  assert.equal(missing.error.code, foreign.error.code);
  assert.equal(missing.error.message, foreign.error.message);
  const ownerState = await a.client.from("interview_preparations").select("private_notes,completed_template_item_ids").eq("round_id", roundId).single();
  assert.ifError(ownerState.error);
  assert.equal(ownerState.data.private_notes, "Owner-only preparation note");
  assert.deepEqual(ownerState.data.completed_template_item_ids, []);
  return "matching P0002 response; owner notes and checklist unchanged";
});

await check("User B cannot record a calendar export for User A round", async () => {
  const { data, error } = await b.client.rpc("record_interview_calendar_export", { target_round_id: roundId, provider_value: "ics" });
  assert.ok(error || data === false, "calendar export for an unowned round must be refused");
});

await check("User B cannot read User A reminder rows", async () => {
  const { data, error } = await b.client.from("interview_reminders").select("*").eq("round_id", roundId);
  assert.ifError(error);
  assert.equal(data.length, 0);
});

await check("User B cannot change User A reminder preferences", async () => {
  const { error } = await b.client.from("interview_reminder_preferences").update({ email_enabled: true }).eq("user_id", a.user.id);
  assert.ok(error, "direct preference writes must be refused");
  assert.match(a.user.id, /^[0-9a-f-]{36}$/i);
  const enabled = execFileSync("docker", ["exec", "supabase_db_Engineeringfoundry", "psql", "-At", "-U", "postgres", "-d", "postgres", "-c", `select coalesce(bool_or(email_enabled), false) from public.interview_reminder_preferences where user_id = '${a.user.id}'::uuid`], { encoding: "utf8" }).trim();
  assert.equal(enabled, "f", "User A preferences must be unchanged");
});

// --- Post-deletion access --------------------------------------------------
await check("deleting an account removes its private rows and throttle state", async () => {
  const deleted = await admin.auth.admin.deleteUser(a.user.id, false);
  assert.ifError(deleted.error);
  createdIds.splice(createdIds.indexOf(a.user.id), 1);
  // Counted directly in the database so the assertion cannot be satisfied by
  // RLS merely hiding rows that still exist.
  assert.match(a.user.id, /^[0-9a-f-]{36}$/i);
  for (const table of ["applications", "interview_rounds", "interview_reminders", "behavioral_stories", "account_action_rate_limits"]) {
    assert.match(table, /^[a-z_]+$/);
    const count = execFileSync("docker", ["exec", "supabase_db_Engineeringfoundry", "psql", "-At", "-U", "postgres", "-d", "postgres", "-c", `select count(*) from public.${table} where user_id = '${a.user.id}'::uuid`], { encoding: "utf8" }).trim();
    assert.equal(count, "0", `${table} retained deleted-user rows`);
  }
  const profiles = execFileSync("docker", ["exec", "supabase_db_Engineeringfoundry", "psql", "-At", "-U", "postgres", "-d", "postgres", "-c", `select count(*) from public.profiles where id = '${a.user.id}'::uuid`], { encoding: "utf8" }).trim();
  assert.equal(profiles, "0", "profile retained after deletion");
});

await check("a deleted account's session can no longer reach private data", async () => {
  const { data, error } = await a.client.from("applications").select("*");
  assert.ok(error || !data?.length, "a stale session must not return private rows");
});

await check("User B survives User A deletion intact", async () => {
  const { data, error } = await b.client.from("account_action_rate_limits").select("*");
  assert.ifError(error);
  assert.equal(data.length, 1, "User B throttle state must be untouched");
});

for (const userId of createdIds) await admin.auth.admin.deleteUser(userId, false).catch(() => undefined);

const failed = results.filter((entry) => entry.status === "FAIL");
console.log(`\n${results.length - failed.length}/${results.length} security qualification checks passed.`);
if (failed.length) {
  console.error(`Failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
