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
import { createHmac, randomUUID } from "node:crypto";
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
const stamp = randomUUID();
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

function behavioralAnswerArgs(overrides = {}) {
  return {
    target_custom_question_id: null,
    target_curated_question_id: "beh-lead-01",
    target_story_id: null,
    target_company_slug: null,
    target_application_id: null,
    target_title: "Phase 9 aggregate security answer",
    target_answer_text: "Private Behavioral answer.",
    target_opening_framing: null,
    target_details_to_emphasize: null,
    target_details_to_avoid: null,
    target_notes: "Owner A private answer note.",
    target_status: "Draft",
    target_make_primary: false,
    ...overrides,
  };
}

function behavioralQuestionArgs(questionId, overrides = {}) {
  return {
    target_question_id: questionId,
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_question_text: "Phase 9 private custom Behavioral question?",
    target_description: "Owner A private question context.",
    target_category: "Leadership",
    target_company_slug: null,
    target_notes: "Owner A private custom-question note.",
    ...overrides,
  };
}

function interviewExperienceArgs(overrides = {}) {
  return {
    target_experience_id: crypto.randomUUID(),
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_submit: false,
    target_company_name: "Phase 9 aggregate security experience",
    target_role_title: "Software Engineer",
    target_role_level: null,
    target_region: null,
    target_interview_date: null,
    target_summary: "Private Interview Experience aggregate security fixture.",
    target_preparation_lessons: "Private preparation lesson.",
    target_public_identity: "anonymous",
    target_publication_consent: false,
    target_rounds: [{
      round_type: "Coding",
      topic_labels: ["Arrays"],
      process_notes: "Private round process notes.",
    }],
    ...overrides,
  };
}

function interviewPlaybookDiagnosticArgs(overrides = {}) {
  return {
    target_expect_absent: true,
    target_expected_updated_at: null,
    available_hours_per_week_value: 7,
    confidence_entries: [{ area: "system-design", confidence: "medium" }],
    priority_areas: ["system-design"],
    constraint_entries: [{ category: "work", description: "Bounded private planning window" }],
    behavioral_stories_coverage_value: "partial",
    project_deep_dive_coverage_value: "not-started",
    ...overrides,
  };
}

function profileArgs(revision, overrides = {}) {
  return {
    target_expected_updated_at: revision,
    target_username: `security-profile-${stamp}`.slice(0, 30),
    target_display_name: "Security Profile A",
    target_bio: "Owner A private profile biography.",
    target_current_company: "Engineering Foundry",
    target_current_role: "Security Engineer",
    target_years_experience: 8,
    target_update_linkedin_url: true,
    target_linkedin_url: "https://www.linkedin.com/in/security-profile-a",
    target_update_github_url: true,
    target_github_url: "https://github.com/security-profile-a",
    target_is_public: false,
    ...overrides,
  };
}

const systemDesignAttemptDocument = {
  functional_requirements: ["Create a short URL"],
  non_functional_requirements: ["p99 under 100 ms"],
  capacity: { assumptions: [], calculations: [] },
  apis: [],
  data_models: [],
  high_level_design: "Owner A private architecture.",
  deep_dives: [],
  bottlenecks: [],
  failure_modes: [],
  tradeoffs: [],
  follow_ups: [],
  final_review_notes: "Owner A private review notes.",
};

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
let behavioralAnswer;
let behavioralQuestion;
let interviewPlaybookDiagnosticRevision;
let interviewExperience;

await check("feedback triage requires an admin, a revision, and the controlled RPC", async () => {
  const targetId = randomUUID();
  const revision = "2026-09-04T12:00:00.000Z";
  const [anonymous, member, legacy, direct] = await Promise.all([
    anon.rpc("update_feedback_submission_if_revision", {
      target_feedback_id: targetId,
      target_expected_updated_at: revision,
      target_status: "resolved",
      target_admin_note: null,
    }),
    a.client.rpc("update_feedback_submission_if_revision", {
      target_feedback_id: targetId,
      target_expected_updated_at: revision,
      target_status: "resolved",
      target_admin_note: null,
    }),
    a.client.rpc("update_feedback_submission", {
      target_id: targetId,
      next_status: "resolved",
      next_note: null,
    }),
    a.client.from("feedback_submissions").update({ status: "resolved" }).eq("id", targetId),
  ]);
  assert.equal(anonymous.error?.code, "42501");
  assert.equal(member.error?.code, "42501");
  assert.equal(legacy.error?.code, "0A000");
  assert.equal(direct.error?.code, "42501");
  return "anonymous 42501; non-admin 42501; legacy 0A000; direct update 42501";
});

await check("profile revision writers derive the owner and deny anonymous or direct writes", async () => {
  const ownerBefore = await a.client.from("profiles").select("display_name,updated_at").single();
  assert.ifError(ownerBefore.error);
  assert.ok(ownerBefore.data?.updated_at);
  const anonymousCalls = await Promise.all([
    anon.rpc("save_profile_if_revision", profileArgs(ownerBefore.data.updated_at)),
    anon.rpc("set_profile_display_name", { target_display_name: "Anonymous profile" }),
  ]);
  for (const call of anonymousCalls) assert.equal(call.error?.code, "42501");

  const direct = await a.client.from("profiles").update({ display_name: "Direct profile bypass" }).eq("id", a.user.id);
  assert.equal(direct.error?.code, "42501");
  const saved = await a.client.rpc("save_profile_if_revision", profileArgs(ownerBefore.data.updated_at));
  assert.ifError(saved.error);
  assert.equal(saved.data?.length, 1);
  const ownerRevision = saved.data[0].updated_at;
  const foreignRevision = await b.client.rpc("save_profile_if_revision", profileArgs(ownerRevision, {
    target_username: `security-profile-b-${stamp}`.slice(0, 30),
    target_display_name: "Foreign profile overwrite",
  }));
  assert.ifError(foreignRevision.error);
  assert.deepEqual(foreignRevision.data, []);
  const ownerAfter = await a.client.from("profiles").select("display_name,bio,updated_at").single();
  assert.ifError(ownerAfter.error);
  assert.deepEqual(ownerAfter.data, {
    display_name: "Security Profile A",
    bio: "Owner A private profile biography.",
    updated_at: ownerRevision,
  });
  return "anonymous 42501; direct 42501; foreign revision zero rows; owner unchanged";
});

await check("revision-checked preparation preferences derive the owner and deny anonymous callers", async () => {
  const created = await a.client.rpc("save_account_preparation_preferences_if_revision", {
    target_expect_absent: true,
    target_expected_updated_at: null,
    preferred_role_level_value: "senior",
    primary_preparation_focus_value: "system_design",
    preferred_dsa_level_value: "sde3plus",
  });
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1, "owner preparation preference create did not return one revision");
  const ownerRevision = created.data[0].updated_at;

  const [anonymous, foreign, legacy] = await Promise.all([
    anon.rpc("save_account_preparation_preferences_if_revision", {
      target_expect_absent: true,
      target_expected_updated_at: null,
      preferred_role_level_value: "sde1",
      primary_preparation_focus_value: "dsa",
      preferred_dsa_level_value: "sde1",
    }),
    b.client.rpc("save_account_preparation_preferences_if_revision", {
      target_expect_absent: false,
      target_expected_updated_at: ownerRevision,
      preferred_role_level_value: "sde1",
      primary_preparation_focus_value: "dsa",
      preferred_dsa_level_value: "sde1",
    }),
    a.client.rpc("save_account_preparation_preferences", {
      preferred_role_level_value: "sde1",
      primary_preparation_focus_value: "dsa",
      preferred_dsa_level_value: "sde1",
    }),
  ]);
  assert.equal(anonymous.error?.code, "42501");
  assert.ifError(foreign.error);
  assert.deepEqual(foreign.data, [], "a foreign revision was accepted for User B");
  assert.equal(legacy.error?.code, "0A000");
  const owner = await a.client
    .from("user_preparation_preferences")
    .select("preferred_role_level,primary_preparation_focus,dsa_level,updated_at")
    .single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, {
    preferred_role_level: "senior",
    primary_preparation_focus: "system_design",
    dsa_level: "sde3plus",
    updated_at: ownerRevision,
  });
  return "owner row created; anonymous 42501; foreign zero rows; legacy 0A000";
});

await check("Interview Playbook diagnostic snapshot and CAS RPCs deny anonymous callers", async () => {
  const [read, write] = await Promise.all([
    anon.rpc("get_interview_playbook_diagnostic_inputs_snapshot"),
    anon.rpc("save_interview_playbook_diagnostic_inputs_if_revision", interviewPlaybookDiagnosticArgs()),
  ]);
  assert.equal(read.error?.code, "42501", "anonymous diagnostic snapshot read must fail with 42501");
  assert.equal(write.error?.code, "42501", "anonymous diagnostic aggregate save must fail with 42501");
  return "read and write returned SQLSTATE 42501";
});

await check("Interview Playbook diagnostic aggregate derives its owner and closes legacy and direct-write bypasses", async () => {
  const created = await a.client.rpc("save_interview_playbook_diagnostic_inputs_if_revision", interviewPlaybookDiagnosticArgs());
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1, "owner diagnostic create did not return one revision");
  interviewPlaybookDiagnosticRevision = created.data[0].updated_at;

  const directMutations = await Promise.all([
    a.client.from("interview_playbook_diagnostic_settings").update({ available_hours_per_week: 168 }).eq("user_id", a.user.id),
    a.client.from("interview_playbook_confidence").delete().eq("user_id", a.user.id),
    a.client.from("interview_playbook_priorities").insert({ user_id: a.user.id, area: "behavioral", position: 2 }),
    a.client.from("interview_playbook_constraints").update({ description: "Direct overwrite" }).eq("user_id", a.user.id),
  ]);
  for (const mutation of directMutations) assert.equal(mutation.error?.code, "42501", "direct diagnostic aggregate mutation must fail with 42501");

  const invalid = await a.client.rpc("save_interview_playbook_diagnostic_inputs_if_revision", interviewPlaybookDiagnosticArgs({
    target_expect_absent: false,
    target_expected_updated_at: interviewPlaybookDiagnosticRevision,
    confidence_entries: null,
  }));
  assert.equal(invalid.error?.code, "22023", "invalid diagnostic aggregate input must fail closed with 22023");

  const legacy = await a.client.rpc("save_interview_playbook_diagnostic_inputs", {
    available_hours_per_week_value: 168,
    confidence_entries: [],
    priority_areas: [],
    constraint_entries: [],
    behavioral_stories_coverage_value: "unknown",
    project_deep_dive_coverage_value: "unknown",
  });
  assert.equal(legacy.error?.code, "0A000", "legacy diagnostic save must fail safely with 0A000");

  const read = await a.client.rpc("get_interview_playbook_diagnostic_inputs_snapshot");
  assert.ifError(read.error);
  assert.equal(read.data?.length, 1);
  assert.deepEqual(
    {
      hasSavedInputs: read.data[0].has_saved_inputs,
      availableHoursPerWeek: read.data[0].available_hours_per_week,
      confidenceEntries: read.data[0].confidence_entries,
      priorityAreas: read.data[0].priority_areas,
      constraintDescriptions: read.data[0].constraint_entries.map(({ category, description }) => ({ category, description })),
      updatedAt: read.data[0].updated_at,
    },
    {
      hasSavedInputs: true,
      availableHoursPerWeek: 7,
      confidenceEntries: [{ area: "system-design", confidence: "medium" }],
      priorityAreas: ["system-design"],
      constraintDescriptions: [{ category: "work", description: "Bounded private planning window" }],
      updatedAt: interviewPlaybookDiagnosticRevision,
    },
  );
  return `owner revision ${interviewPlaybookDiagnosticRevision}; direct writes denied; legacy retired`;
});

await check("foreign and missing Interview Playbook diagnostic revision targets are indistinguishable", async () => {
  assert.ok(interviewPlaybookDiagnosticRevision, "owner diagnostic revision fixture was unavailable");
  const foreign = await b.client.rpc("save_interview_playbook_diagnostic_inputs_if_revision", interviewPlaybookDiagnosticArgs({
    target_expect_absent: false,
    target_expected_updated_at: interviewPlaybookDiagnosticRevision,
    available_hours_per_week_value: 20,
  }));
  const missing = await b.client.rpc("save_interview_playbook_diagnostic_inputs_if_revision", interviewPlaybookDiagnosticArgs({
    target_expect_absent: false,
    target_expected_updated_at: "2000-01-01T00:00:00.000Z",
    available_hours_per_week_value: 30,
  }));
  for (const attempt of [foreign, missing]) {
    assert.ifError(attempt.error);
    assert.deepEqual(attempt.data, [], "foreign or missing diagnostic target must return zero rows");
  }
  const bRead = await b.client.rpc("get_interview_playbook_diagnostic_inputs_snapshot");
  assert.ifError(bRead.error);
  assert.deepEqual(bRead.data, [{
    has_saved_inputs: false,
    available_hours_per_week: null,
    confidence_entries: [],
    priority_areas: [],
    constraint_entries: [],
    behavioral_stories_coverage: "unknown",
    project_deep_dive_coverage: "unknown",
    updated_at: null,
  }]);
  return "both writes returned zero rows; owner B remained explicitly absent";
});

await check("Interview Experience revision RPCs deny anonymous callers", async () => {
  const experienceId = crypto.randomUUID();
  const revision = new Date().toISOString();
  const attempts = await Promise.all([
    anon.rpc("save_interview_experience_if_revision", interviewExperienceArgs({ target_experience_id: experienceId })),
    anon.rpc("manage_interview_experience_if_revision", {
      target_experience_id: experienceId,
      target_expected_updated_at: revision,
      target_action: "withdraw",
    }),
    anon.rpc("moderate_interview_experience_if_revision", {
      target_experience_id: experienceId,
      target_expected_updated_at: revision,
      target_status: "approved",
      target_moderation_note: null,
    }),
  ]);
  for (const attempt of attempts) assert.equal(attempt.error?.code, "42501", "anonymous Interview Experience mutation must fail with 42501");
  return "save, management, and moderation returned SQLSTATE 42501";
});

await check("Interview Experience aggregate derives its owner and retires split mutation paths", async () => {
  const created = await a.client.rpc("save_interview_experience_if_revision", interviewExperienceArgs());
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1, "owner Interview Experience create did not return one revision");
  interviewExperience = created.data[0];

  const directMutations = await Promise.all([
    a.client.from("interview_experiences").insert({
      author_id: a.user.id,
      company_name: "Direct bypass",
      role_title: "Direct bypass",
    }),
    a.client.from("interview_experiences").update({ summary: "Direct stale overwrite" }).eq("id", interviewExperience.experience_id),
    a.client.from("interview_experience_rounds").delete().eq("experience_id", interviewExperience.experience_id),
  ]);
  for (const mutation of directMutations) assert.equal(mutation.error?.code, "42501", "direct Interview Experience aggregate mutation must fail with 42501");

  const legacyAttempts = await Promise.all([
    a.client.rpc("save_interview_experience_draft", { target_id: interviewExperience.experience_id, payload: {} }),
    a.client.rpc("submit_interview_experience", { target_id: interviewExperience.experience_id }),
    a.client.rpc("withdraw_interview_experience", { target_id: interviewExperience.experience_id }),
    a.client.rpc("delete_interview_experience", { target_id: interviewExperience.experience_id }),
    a.client.rpc("moderate_interview_experience", { target_id: interviewExperience.experience_id, next_status: "approved", moderation_note: null }),
  ]);
  for (const attempt of legacyAttempts) assert.equal(attempt.error?.code, "0A000", "legacy Interview Experience mutation must fail safely with 0A000");

  const owner = await a.client.from("interview_experiences").select("status,summary,updated_at,interview_experience_rounds(process_notes)").eq("id", interviewExperience.experience_id).single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, {
    status: "draft",
    summary: "Private Interview Experience aggregate security fixture.",
    updated_at: interviewExperience.updated_at,
    interview_experience_rounds: [{ process_notes: "Private round process notes." }],
  });
  return `owner aggregate ${interviewExperience.experience_id}; direct writes denied; legacy RPCs retired`;
});

await check("foreign and missing Interview Experience revision targets are indistinguishable", async () => {
  assert.ok(interviewExperience, "owner Interview Experience fixture was unavailable");
  const foreignSave = await b.client.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
    target_experience_id: interviewExperience.experience_id,
    target_expect_absent: false,
    target_expected_updated_at: interviewExperience.updated_at,
    target_summary: "Foreign overwrite must not identify the owner row.",
  }));
  const missingSave = await b.client.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
    target_experience_id: crypto.randomUUID(),
    target_expect_absent: false,
    target_expected_updated_at: interviewExperience.updated_at,
    target_summary: "Missing overwrite must match the foreign result.",
  }));
  const foreignManage = await b.client.rpc("manage_interview_experience_if_revision", {
    target_experience_id: interviewExperience.experience_id,
    target_expected_updated_at: interviewExperience.updated_at,
    target_action: "withdraw",
  });
  const missingManage = await b.client.rpc("manage_interview_experience_if_revision", {
    target_experience_id: crypto.randomUUID(),
    target_expected_updated_at: interviewExperience.updated_at,
    target_action: "withdraw",
  });
  for (const attempt of [foreignSave, missingSave, foreignManage, missingManage]) {
    assert.ifError(attempt.error);
    assert.deepEqual(attempt.data, [], "foreign and missing revision targets must both return zero rows");
  }
  const owner = await a.client.from("interview_experiences").select("summary,updated_at").eq("id", interviewExperience.experience_id).single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, {
    summary: "Private Interview Experience aggregate security fixture.",
    updated_at: interviewExperience.updated_at,
  });
  return "foreign and missing save/management targets returned zero rows; owner data unchanged";
});

await check("Behavioral aggregate RPCs deny anonymous callers", async () => {
  const attempts = await Promise.all([
    anon.rpc("create_behavioral_story_with_themes", behavioralStoryArgs()),
    anon.rpc("update_behavioral_story_with_themes_if_revision", {
      target_story_id: crypto.randomUUID(),
      target_expected_updated_at: new Date().toISOString(),
      ...behavioralStoryArgs(),
    }),
    anon.rpc("duplicate_behavioral_story_with_themes", { target_story_id: crypto.randomUUID() }),
    anon.rpc("delete_behavioral_story_if_revision", {
      target_story_id: crypto.randomUUID(),
      target_expected_updated_at: new Date().toISOString(),
    }),
    anon.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({ target_story_id: crypto.randomUUID() })),
    anon.rpc("update_behavioral_answer_aggregate_if_revision", {
      target_answer_id: crypto.randomUUID(),
      target_expected_updated_at: new Date().toISOString(),
      ...behavioralAnswerArgs({ target_story_id: crypto.randomUUID() }),
    }),
    anon.rpc("delete_behavioral_answer_if_revision", {
      target_answer_id: crypto.randomUUID(),
      target_expected_updated_at: new Date().toISOString(),
      target_custom_question_id: null,
      target_curated_question_id: "beh-lead-01",
    }),
  ]);
  for (const attempt of attempts) assert.equal(attempt.error?.code, "42501", "anonymous Behavioral aggregate execution must fail with 42501");
  return "story and answer aggregate saves, duplicates, and deletes returned SQLSTATE 42501";
});

await check("Behavioral custom-question RPCs deny anonymous and direct mutation", async () => {
  const questionId = randomUUID();
  const anonymousCalls = await Promise.all([
    anon.rpc("save_behavioral_custom_question_if_revision", behavioralQuestionArgs(questionId)),
    anon.rpc("delete_behavioral_custom_question_if_revision", {
      target_question_id: questionId,
      target_expected_updated_at: new Date().toISOString(),
    }),
  ]);
  for (const attempt of anonymousCalls) assert.equal(attempt.error?.code, "42501", "anonymous custom-question mutation must fail with 42501");
  const created = await a.client.rpc("save_behavioral_custom_question_if_revision", behavioralQuestionArgs(questionId));
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1);
  behavioralQuestion = created.data[0];
  const directMutations = await Promise.all([
    a.client.from("behavioral_custom_questions").insert({ user_id: a.user.id, question_text: "Direct custom question bypass" }),
    a.client.from("behavioral_custom_questions").update({ notes: "Direct private overwrite" }).eq("id", questionId),
    a.client.from("behavioral_custom_questions").delete().eq("id", questionId),
  ]);
  for (const mutation of directMutations) assert.equal(mutation.error?.code, "42501", "direct custom-question mutation must fail with 42501");
  return `owner question ${questionId}; anonymous and direct writes denied`;
});

await check("Behavioral aggregate derives its owner and closes direct mutation bypasses", async () => {
  const created = await a.client.rpc("create_behavioral_story_with_themes", behavioralStoryArgs());
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1);
  behavioralStory = created.data[0];
  const directMutations = await Promise.all([
    a.client.from("behavioral_stories").insert({ user_id: a.user.id, title: "Direct bypass" }),
    a.client.from("behavioral_stories").update({ title: "Direct overwrite" }).eq("id", behavioralStory.story_id),
    a.client.from("behavioral_stories").delete().eq("id", behavioralStory.story_id),
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

await check("Behavioral answer aggregate derives its owner and closes split-write bypasses", async () => {
  assert.ok(behavioralStory, "owner Behavioral story fixture was unavailable");
  const created = await a.client.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_story_id: behavioralStory.story_id,
    target_make_primary: true,
  }));
  assert.ifError(created.error);
  assert.equal(created.data?.length, 1);
  behavioralAnswer = created.data[0];
  const directMutations = await Promise.all([
    a.client.from("behavioral_answers").insert({
      user_id: a.user.id,
      curated_question_id: "beh-lead-01",
      story_id: behavioralStory.story_id,
      title: "Direct answer bypass",
    }),
    a.client.from("behavioral_answers").update({ notes: "Direct stale overwrite" }).eq("id", behavioralAnswer.answer_id),
    a.client.from("behavioral_answers").delete().eq("id", behavioralAnswer.answer_id),
  ]);
  for (const mutation of directMutations) assert.equal(mutation.error?.code, "42501", "direct Behavioral answer mutation must fail with 42501");
  const legacy = await a.client.rpc("set_behavioral_primary_answer", {
    target_answer_id: behavioralAnswer.answer_id,
    make_primary: false,
  });
  assert.equal(legacy.error?.code, "0A000", "legacy primary mutation must fail safely with 0A000");
  const read = await a.client.from("behavioral_answers").select("notes,is_primary,updated_at").eq("id", behavioralAnswer.answer_id).single();
  assert.ifError(read.error);
  assert.deepEqual(read.data, {
    notes: "Owner A private answer note.",
    is_primary: true,
    updated_at: behavioralAnswer.updated_at,
  });
  return `answer aggregate ${behavioralAnswer.answer_id}; direct writes denied; legacy retired`;
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
  const foreignDelete = await b.client.rpc("delete_behavioral_story_if_revision", {
    target_story_id: behavioralStory.story_id,
    target_expected_updated_at: behavioralStory.updated_at,
  });
  const missingDelete = await b.client.rpc("delete_behavioral_story_if_revision", {
    target_story_id: crypto.randomUUID(),
    target_expected_updated_at: behavioralStory.updated_at,
  });
  for (const attempt of [foreignUpdate, missingUpdate, foreignDuplicate, missingDuplicate, foreignDelete, missingDelete]) {
    assert.ifError(attempt.error);
    assert.deepEqual(attempt.data, []);
  }
  const owner = await a.client.from("behavioral_stories").select("title,notes").eq("id", behavioralStory.story_id).single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, { title: "Phase 9 aggregate security story", notes: "Owner A private Behavioral note." });
  return "foreign and missing updates/duplicates/deletes returned zero rows; owner data unchanged";
});

await check("foreign and missing Behavioral answer targets are indistinguishable", async () => {
  assert.ok(behavioralStory && behavioralAnswer, "owner Behavioral answer fixtures were unavailable");
  const bStory = await b.client.rpc("create_behavioral_story_with_themes", behavioralStoryArgs({
    target_title: "Phase 9 user B answer relationship",
    target_notes: "User B private story note.",
  }));
  assert.ifError(bStory.error);
  assert.equal(bStory.data?.length, 1);
  const updateArgs = behavioralAnswerArgs({
    target_story_id: bStory.data[0].story_id,
    target_title: "Foreign or missing answer update",
  });
  const [foreign, missing, foreignDelete, missingDelete] = await Promise.all([
    b.client.rpc("update_behavioral_answer_aggregate_if_revision", {
      target_answer_id: behavioralAnswer.answer_id,
      target_expected_updated_at: behavioralAnswer.updated_at,
      ...updateArgs,
    }),
    b.client.rpc("update_behavioral_answer_aggregate_if_revision", {
      target_answer_id: crypto.randomUUID(),
      target_expected_updated_at: behavioralAnswer.updated_at,
      ...updateArgs,
    }),
    b.client.rpc("delete_behavioral_answer_if_revision", {
      target_answer_id: behavioralAnswer.answer_id,
      target_expected_updated_at: behavioralAnswer.updated_at,
      target_custom_question_id: null,
      target_curated_question_id: "beh-lead-01",
    }),
    b.client.rpc("delete_behavioral_answer_if_revision", {
      target_answer_id: crypto.randomUUID(),
      target_expected_updated_at: behavioralAnswer.updated_at,
      target_custom_question_id: null,
      target_curated_question_id: "beh-lead-01",
    }),
  ]);
  for (const attempt of [foreign, missing, foreignDelete, missingDelete]) {
    assert.ifError(attempt.error);
    assert.deepEqual(attempt.data, []);
  }
  const foreignRelationship = await b.client.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_story_id: behavioralStory.story_id,
  }));
  assert.equal(foreignRelationship.error?.code, "23503", "foreign story relation must fail with 23503");
  const owner = await a.client.from("behavioral_answers").select("title,notes,is_primary,updated_at").eq("id", behavioralAnswer.answer_id).single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, {
    title: "Phase 9 aggregate security answer",
    notes: "Owner A private answer note.",
    is_primary: true,
    updated_at: behavioralAnswer.updated_at,
  });
  return "foreign and missing updates/deletes returned zero rows; foreign relationship rejected; owner answer unchanged";
});

await check("foreign and missing Behavioral custom-question targets are indistinguishable", async () => {
  assert.ok(behavioralQuestion, "owner custom-question fixture was unavailable");
  const missingId = randomUUID();
  const [foreignSave, missingSave, foreignDelete, missingDelete] = await Promise.all([
    b.client.rpc("save_behavioral_custom_question_if_revision", behavioralQuestionArgs(behavioralQuestion.question_id, {
      target_expect_absent: false,
      target_expected_updated_at: behavioralQuestion.updated_at,
      target_notes: "Foreign private overwrite.",
    })),
    b.client.rpc("save_behavioral_custom_question_if_revision", behavioralQuestionArgs(missingId, {
      target_expect_absent: false,
      target_expected_updated_at: behavioralQuestion.updated_at,
      target_notes: "Missing private overwrite.",
    })),
    b.client.rpc("delete_behavioral_custom_question_if_revision", {
      target_question_id: behavioralQuestion.question_id,
      target_expected_updated_at: behavioralQuestion.updated_at,
    }),
    b.client.rpc("delete_behavioral_custom_question_if_revision", {
      target_question_id: missingId,
      target_expected_updated_at: behavioralQuestion.updated_at,
    }),
  ]);
  for (const attempt of [foreignSave, missingSave, foreignDelete, missingDelete]) {
    assert.ifError(attempt.error);
    assert.deepEqual(attempt.data, []);
  }
  const owner = await a.client.from("behavioral_custom_questions").select("question_text,description,category,company_slug,notes,updated_at").eq("id", behavioralQuestion.question_id).single();
  assert.ifError(owner.error);
  assert.deepEqual(owner.data, {
    question_text: "Phase 9 private custom Behavioral question?",
    description: "Owner A private question context.",
    category: "Leadership",
    company_slug: null,
    notes: "Owner A private custom-question note.",
    updated_at: behavioralQuestion.updated_at,
  });
  return "foreign and missing save/delete returned zero rows; owner question unchanged";
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

await check("anonymous callers cannot invoke insert-only browser import RPCs or System Design progress and attempt mutations", async () => {
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
    anon.rpc("delete_system_design_attempt_if_revision", {
      target_attempt_id: randomUUID(), target_problem_id: "url-shortener", target_expected_revision: 1,
    }),
    anon.rpc("delete_system_design_attempt", { target_attempt_id: randomUUID() }),
    anon.rpc("import_dsa_question_progress_if_absent", { target_question_id: "two-sum", target_status: "attempted" }),
    anon.rpc("import_system_design_item_progress_if_absent", { target_item_id: "estimation", target_item_type: "concept" }),
    anon.rpc("import_preparation_track_progress_if_absent", { target_track: "behavioral", target_item_id: "beh-lead-01", target_status: "completed" }),
  ]);
  for (const attempt of attempts) assert.equal(attempt.error?.code, "42501", "anonymous progress execution must fail with 42501");
  return "all seven RPCs returned SQLSTATE 42501";
});

await check("System Design attempt deletion derives the owner and requires the exact revision", async () => {
  const created = await a.client.rpc("create_system_design_attempt", {
    target_problem_id: "url-shortener",
    target_application_id: null,
    target_title: "Phase 9 revision-delete security attempt",
    target_document: systemDesignAttemptDocument,
  });
  assert.ifError(created.error);
  assert.ok(created.data, "owner attempt creation did not return an ID");
  const attemptId = created.data;
  const ownerBefore = await a.client.from("system_design_attempts").select("title,problem_id,revision,document").eq("id", attemptId).single();
  assert.ifError(ownerBefore.error);
  assert.ok(ownerBefore.data, "owner attempt was unavailable");
  const [foreignDelete, missingDelete, directDelete, legacyDelete] = await Promise.all([
    b.client.rpc("delete_system_design_attempt_if_revision", {
      target_attempt_id: attemptId,
      target_problem_id: "url-shortener",
      target_expected_revision: ownerBefore.data.revision,
    }),
    b.client.rpc("delete_system_design_attempt_if_revision", {
      target_attempt_id: randomUUID(),
      target_problem_id: "url-shortener",
      target_expected_revision: ownerBefore.data.revision,
    }),
    a.client.from("system_design_attempts").delete().eq("id", attemptId),
    a.client.rpc("delete_system_design_attempt", { target_attempt_id: attemptId }),
  ]);
  assert.ifError(foreignDelete.error);
  assert.ifError(missingDelete.error);
  assert.deepEqual(foreignDelete.data, [], "foreign attempt deletion disclosed or changed the owner row");
  assert.deepEqual(missingDelete.data, [], "missing attempt deletion did not match the foreign result");
  assert.equal(directDelete.error?.code, "42501", "direct attempt deletion bypassed the revision RPC");
  assert.equal(legacyDelete.error?.code, "0A000", "legacy attempt deletion did not fail safely");
  const ownerAfter = await a.client.from("system_design_attempts").select("title,problem_id,revision,document").eq("id", attemptId).single();
  assert.ifError(ownerAfter.error);
  assert.deepEqual(ownerAfter.data, ownerBefore.data, "refused attempt deletions changed Owner A's worksheet");
  const exactDelete = await a.client.rpc("delete_system_design_attempt_if_revision", {
    target_attempt_id: attemptId,
    target_problem_id: "url-shortener",
    target_expected_revision: ownerBefore.data.revision,
  });
  assert.ifError(exactDelete.error);
  assert.deepEqual(exactDelete.data, [{ attempt_id: attemptId }], "exact owner revision did not delete the intended attempt");
  return "foreign/missing zero rows; direct 42501; legacy 0A000; exact owner delete succeeded";
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
let applicationId;
let roundId;
let preparationTaskId;
await check("User A creates an application and interview round", async () => {
  // user_id is supplied explicitly and RLS verifies it matches the caller; the
  // server never accepts it from a browser payload.
  const application = await a.client.from("applications").insert({ user_id: a.user.id, company_name: "Phase 9 Co", role_title: "SDE II", status: "Applied" }).select("id").single();
  assert.ifError(application.error);
  applicationId = application.data.id;
  const round = await a.client.rpc("create_interview_round", {
    target_application_id: applicationId,
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

await check("application and round deletion is revision-checked, owner-derived, and anonymous-denied", async () => {
  const [application, round] = await Promise.all([
    a.client.from("applications").select("updated_at").eq("id", applicationId).single(),
    a.client.from("interview_rounds").select("updated_at").eq("id", roundId).single(),
  ]);
  assert.ifError(application.error);
  assert.ifError(round.error);

  const anonymousCalls = await Promise.all([
    anon.rpc("delete_application_if_revision", {
      target_application_id: applicationId,
      target_expected_updated_at: application.data.updated_at,
    }),
    anon.rpc("delete_interview_round_if_revision", {
      target_application_id: applicationId,
      target_round_id: roundId,
      target_expected_updated_at: round.data.updated_at,
    }),
  ]);
  for (const call of anonymousCalls) assert.equal(call.error?.code, "42501", "anonymous tracker deletion must fail with 42501");

  const directCalls = await Promise.all([
    a.client.from("applications").delete().eq("id", applicationId),
    a.client.from("interview_rounds").delete().eq("id", roundId),
  ]);
  for (const call of directCalls) assert.equal(call.error?.code, "42501", "direct authenticated tracker deletion must fail with 42501");

  const missingApplicationId = "81818181-8181-4818-8818-818181818181";
  const missingRoundId = "82828282-8282-4828-8828-828282828282";
  const foreignAndMissing = await Promise.all([
    b.client.rpc("delete_application_if_revision", {
      target_application_id: applicationId,
      target_expected_updated_at: application.data.updated_at,
    }),
    b.client.rpc("delete_application_if_revision", {
      target_application_id: missingApplicationId,
      target_expected_updated_at: application.data.updated_at,
    }),
    b.client.rpc("delete_interview_round_if_revision", {
      target_application_id: applicationId,
      target_round_id: roundId,
      target_expected_updated_at: round.data.updated_at,
    }),
    b.client.rpc("delete_interview_round_if_revision", {
      target_application_id: missingApplicationId,
      target_round_id: missingRoundId,
      target_expected_updated_at: round.data.updated_at,
    }),
  ]);
  for (const call of foreignAndMissing) {
    assert.ifError(call.error);
    assert.deepEqual(call.data, [], "foreign and missing tracker deletes must be indistinguishable");
  }

  const [preservedApplication, preservedRound] = await Promise.all([
    a.client.from("applications").select("id").eq("id", applicationId).single(),
    a.client.from("interview_rounds").select("id").eq("id", roundId).single(),
  ]);
  assert.ifError(preservedApplication.error);
  assert.ifError(preservedRound.error);
  return "anonymous/direct 42501; foreign/missing zero rows; owner records unchanged";
});

await check("User A creates note-only preparation before checklist isolation checks", async () => {
  const { data, error } = await a.client.rpc("save_interview_preparation_notes_if_revision", {
    target_round_id: roundId,
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_notes: "Owner-only preparation note",
  });
  assert.ifError(error);
  assert.equal(data?.length, 1);
});

await check("User A creates an owner-scoped preparation task security fixture", async () => {
  const created = await a.client.rpc("add_interview_preparation_task", {
    target_round_id: roundId,
    title_value: "Owner-only preparation task",
  });
  assert.ifError(created.error);
  assert.ok(created.data);
  preparationTaskId = created.data;
});

await check("preparation task additions reject anonymous foreign and malformed writes", async () => {
  const [anonymous, foreign, missing, blank, control, oversized, direct] = await Promise.all([
    anon.rpc("add_interview_preparation_task", {
      target_round_id: roundId,
      title_value: "Anonymous task",
    }),
    b.client.rpc("add_interview_preparation_task", {
      target_round_id: roundId,
      title_value: "Foreign task",
    }),
    b.client.rpc("add_interview_preparation_task", {
      target_round_id: "93939393-9393-4939-8939-939393939393",
      title_value: "Missing task",
    }),
    a.client.rpc("add_interview_preparation_task", {
      target_round_id: roundId,
      title_value: "   ",
    }),
    a.client.rpc("add_interview_preparation_task", {
      target_round_id: roundId,
      title_value: "line\nbreak",
    }),
    a.client.rpc("add_interview_preparation_task", {
      target_round_id: roundId,
      title_value: "x".repeat(161),
    }),
    a.client.from("interview_preparation_custom_tasks").insert({
      id: randomUUID(),
      round_id: roundId,
      user_id: a.user.id,
      title: "Direct task",
      position: 1,
    }),
  ]);
  assert.equal(anonymous.error?.code, "42501");
  assert.equal(foreign.error?.code, "P0002");
  assert.equal(missing.error?.code, "P0002");
  for (const invalid of [blank, control, oversized]) {
    assert.equal(invalid.error?.code, "23514");
  }
  assert.equal(direct.error?.code, "42501");
  const ownerRows = await a.client
    .from("interview_preparation_custom_tasks")
    .select("id")
    .eq("round_id", roundId);
  assert.ifError(ownerRows.error);
  assert.deepEqual(ownerRows.data.map((row) => row.id), [preparationTaskId]);
  return "anonymous/direct 42501; foreign/missing P0002; malformed 23514; owner row unchanged";
});

await check("direct preparation task writes cannot bypass the desired-state or revision-delete RPCs", async () => {
  const [directUpdate, directDelete] = await Promise.all([
    a.client
      .from("interview_preparation_custom_tasks")
      .update({ completed: true })
      .eq("id", preparationTaskId),
    a.client
      .from("interview_preparation_custom_tasks")
      .delete()
      .eq("id", preparationTaskId),
  ]);
  assert.equal(directUpdate.error?.code, "42501");
  assert.equal(directDelete.error?.code, "42501");
  const ownerTask = await a.client
    .from("interview_preparation_custom_tasks")
    .select("completed")
    .eq("id", preparationTaskId)
    .single();
  assert.ifError(ownerTask.error);
  assert.equal(ownerTask.data.completed, false);
  return "direct UPDATE and DELETE denied with SQLSTATE 42501; owner task unchanged";
});

await check("foreign and nonexistent preparation text targets are indistinguishable", async () => {
  const missingRoundId = "93939393-9393-4939-8939-939393939393";
  const calls = await Promise.all([
    b.client.rpc("save_interview_preparation_notes_if_revision", {
      target_round_id: roundId,
      target_expect_absent: true,
      target_expected_updated_at: null,
      target_notes: "Foreign note",
    }),
    b.client.rpc("save_interview_preparation_notes_if_revision", {
      target_round_id: missingRoundId,
      target_expect_absent: true,
      target_expected_updated_at: null,
      target_notes: "Missing note",
    }),
    b.client.rpc("save_interview_preparation_reflection_if_revision", {
      target_round_id: roundId,
      target_expect_absent: true,
      target_expected_updated_at: null,
      target_topics_asked: "",
      target_went_well: "",
      target_needs_improvement: "",
      target_follow_up_notes: "",
    }),
    b.client.rpc("save_interview_preparation_reflection_if_revision", {
      target_round_id: missingRoundId,
      target_expect_absent: true,
      target_expected_updated_at: null,
      target_topics_asked: "",
      target_went_well: "",
      target_needs_improvement: "",
      target_follow_up_notes: "",
    }),
  ]);
  for (const call of calls) {
    assert.ifError(call.error);
    assert.deepEqual(call.data, []);
  }
  const ownerState = await a.client.from("interview_preparations").select("private_notes,private_notes_updated_at,reflection_updated_at").eq("round_id", roundId).single();
  assert.ifError(ownerState.error);
  assert.equal(ownerState.data.private_notes, "Owner-only preparation note");
  assert.ok(ownerState.data.private_notes_updated_at);
  assert.equal(ownerState.data.reflection_updated_at, null);
  return "matching zero-row results; owner text and revisions unchanged";
});

await check("anonymous callers cannot execute preparation text or legacy snapshot RPCs", async () => {
  const notes = await anon.rpc("save_interview_preparation_notes_if_revision", {
    target_round_id: roundId,
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_notes: "Anonymous note",
  });
  const reflection = await anon.rpc("save_interview_preparation_reflection_if_revision", {
    target_round_id: roundId,
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_topics_asked: "",
    target_went_well: "",
    target_needs_improvement: "",
    target_follow_up_notes: "",
  });
  const legacy = await anon.rpc("save_interview_preparation", {
    target_round_id: roundId,
    notes_value: "Anonymous legacy note",
  });
  for (const call of [notes, reflection, legacy]) {
    assert.equal(call.error?.code, "42501");
  }
  return "notes, reflection, and legacy denied with SQLSTATE 42501";
});

await check("anonymous callers cannot execute desired-state or legacy preparation task mutations", async () => {
  const desired = await anon.rpc("set_interview_preparation_task_completed", {
    target_round_id: roundId,
    target_task_id: preparationTaskId,
    target_completed: true,
  });
  const legacy = await anon.rpc("toggle_interview_preparation_task", {
    target_task_id: preparationTaskId,
  });
  const revisionDelete = await anon.rpc("delete_interview_preparation_task_if_revision", {
    target_round_id: roundId,
    target_task_id: preparationTaskId,
    target_expected_updated_at: new Date().toISOString(),
  });
  const legacyDelete = await anon.rpc("delete_interview_preparation_task", {
    target_task_id: preparationTaskId,
  });
  for (const call of [desired, legacy, revisionDelete, legacyDelete]) {
    assert.equal(call.error?.code, "42501");
  }
  return "desired state, revision delete, and both retired task mutations denied with SQLSTATE 42501";
});

await check("preparation task mutations derive the owner and keep foreign or missing targets indistinguishable", async () => {
  const ownerBefore = await a.client.from("interview_preparation_custom_tasks").select("completed,updated_at").eq("id", preparationTaskId).single();
  assert.ifError(ownerBefore.error);
  const calls = await Promise.all([
    b.client.rpc("set_interview_preparation_task_completed", {
      target_round_id: roundId,
      target_task_id: preparationTaskId,
      target_completed: true,
    }),
    b.client.rpc("set_interview_preparation_task_completed", {
      target_round_id: "93939393-9393-4939-8939-939393939393",
      target_task_id: "93939393-9393-4939-8939-939393939394",
      target_completed: true,
    }),
    b.client.rpc("delete_interview_preparation_task_if_revision", {
      target_round_id: roundId,
      target_task_id: preparationTaskId,
      target_expected_updated_at: ownerBefore.data.updated_at,
    }),
    b.client.rpc("delete_interview_preparation_task_if_revision", {
      target_round_id: "93939393-9393-4939-8939-939393939393",
      target_task_id: "93939393-9393-4939-8939-939393939394",
      target_expected_updated_at: ownerBefore.data.updated_at,
    }),
  ]);
  for (const call of calls) {
    assert.ifError(call.error);
    assert.deepEqual(call.data, []);
  }
  const ownerTask = await a.client.from("interview_preparation_custom_tasks").select("completed,updated_at").eq("id", preparationTaskId).single();
  assert.ifError(ownerTask.error);
  assert.deepEqual(ownerTask.data, ownerBefore.data, "foreign task mutations changed the owner row");
  const legacyDelete = await a.client.rpc("delete_interview_preparation_task", {
    target_task_id: preparationTaskId,
  });
  assert.equal(legacyDelete.error?.code, "0A000", "retired task deletion did not fail safely");
  const exactDelete = await a.client.rpc("delete_interview_preparation_task_if_revision", {
    target_round_id: roundId,
    target_task_id: preparationTaskId,
    target_expected_updated_at: ownerBefore.data.updated_at,
  });
  assert.ifError(exactDelete.error);
  assert.deepEqual(exactDelete.data, [{ task_id: preparationTaskId, round_id: roundId, application_id: applicationId }]);
  return "foreign/missing zero rows; legacy 0A000; owner state stayed exact; exact owner revision deleted once";
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

await check("revision-checked reminder preferences derive the owner and deny anonymous callers", async () => {
  const before = await b.client
    .from("interview_reminder_preferences")
    .select("updated_at")
    .single();
  assert.ifError(before.error);
  assert.ok(before.data?.updated_at);

  const saved = await b.client.rpc("save_interview_reminder_preferences_if_revision", {
    target_expect_absent: false,
    target_expected_updated_at: before.data.updated_at,
    preferred_timezone_value: "UTC",
    in_app_enabled_value: false,
    prep_3_days_enabled_value: false,
    interview_1_day_enabled_value: false,
    interview_1_hour_enabled_value: false,
    email_enabled_value: false,
  });
  assert.ifError(saved.error);
  assert.equal(saved.data?.length, 1, "User B reminder save did not return one revision");

  const anonymous = await anon.rpc("save_interview_reminder_preferences_if_revision", {
    target_expect_absent: true,
    target_expected_updated_at: null,
    preferred_timezone_value: "UTC",
    in_app_enabled_value: true,
    prep_3_days_enabled_value: true,
    interview_1_day_enabled_value: true,
    interview_1_hour_enabled_value: true,
    email_enabled_value: false,
  });
  assert.ok(anonymous.error, "anonymous reminder preference save unexpectedly succeeded");

  const [ownerA, ownerB] = [a.user.id, b.user.id].map((userId) => {
    assert.match(userId, /^[0-9a-f-]{36}$/i);
    return execFileSync(
      "docker",
      ["exec", "supabase_db_Engineeringfoundry", "psql", "-At", "-U", "postgres", "-d", "postgres", "-c", `select coalesce(preferred_timezone, 'null') || ':' || in_app_enabled::text from public.interview_reminder_preferences where user_id = '${userId}'::uuid`],
      { encoding: "utf8" },
    ).trim();
  });
  assert.equal(ownerA, "null:true", "User B reminder save changed User A preferences");
  assert.equal(ownerB, "UTC:false", "User B reminder save did not target User B");
  return "one owner-derived row; anonymous denied; foreign owner unchanged";
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
  const experiences = execFileSync("docker", ["exec", "supabase_db_Engineeringfoundry", "psql", "-At", "-U", "postgres", "-d", "postgres", "-c", `select count(*) from public.interview_experiences where author_id = '${a.user.id}'::uuid`], { encoding: "utf8" }).trim();
  assert.equal(experiences, "0", "Interview Experiences retained deleted-author rows");
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
