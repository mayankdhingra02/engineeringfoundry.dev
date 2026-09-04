import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { queryLocalDatabase } from "./lib/local-supabase.mjs";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mailpitUrl = "http://127.0.0.1:54324";
const password = "Qualification123!";
const fixturePrefix = "phase5a-qualification";
const fixtureCompany = "Phase 5A Qualification Co";

if (!apiUrl || !publishableKey) {
  throw new Error("Local Supabase public environment is not configured.");
}

if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl)) {
  throw new Error("Refusing to run persistence qualification against a non-local Supabase project.");
}

function client() {
  return createClient(apiUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

const results = [];

async function check(name, assertion) {
  try {
    const note = await assertion();
    results.push({ name, result: "PASS", note: note ?? "" });
    console.log(`PASS  ${name}${note ? ` — ${note}` : ""}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, result: "FAIL", note: message });
    console.log(`FAIL  ${name} — ${message}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectSuccess(result, fallback) {
  expect(!result.error, result.error?.message ?? fallback);
  return result.data;
}

async function currentDsaProgressRevision(supabase, questionId) {
  const result = await supabase
    .from("dsa_question_progress")
    .select("updated_at")
    .eq("question_id", questionId)
    .maybeSingle();
  return expectSuccess(result, `DSA revision lookup failed for ${questionId}`)?.updated_at ?? null;
}

async function saveDsaProgress(supabase, values, expectation) {
  const expectedUpdatedAt = expectation === undefined
    ? await currentDsaProgressRevision(supabase, values.questionId)
    : expectation;
  return supabase.rpc("save_dsa_question_progress_if_revision", {
    target_question_id: values.questionId,
    target_expect_absent: expectedUpdatedAt === null,
    target_expected_updated_at: expectedUpdatedAt,
    target_status: values.status,
    target_confidence: values.confidence,
    target_bookmarked: values.bookmarked,
    target_notes: values.notes,
  });
}

async function currentSystemDesignProgressRevision(supabase, itemId, itemType) {
  const result = await supabase
    .from("system_design_item_progress")
    .select("updated_at")
    .eq("item_id", itemId)
    .eq("item_type", itemType)
    .maybeSingle();
  return expectSuccess(result, `System Design revision lookup failed for ${itemType}:${itemId}`)?.updated_at ?? null;
}

async function saveSystemDesignProgress(supabase, values, expectation) {
  const expectedUpdatedAt = expectation === undefined
    ? await currentSystemDesignProgressRevision(supabase, values.itemId, values.itemType)
    : expectation;
  return supabase.rpc("save_system_design_item_progress_if_revision", {
    target_item_id: values.itemId,
    target_item_type: values.itemType,
    target_expect_absent: expectedUpdatedAt === null,
    target_expected_updated_at: expectedUpdatedAt,
    target_status: values.status,
    target_confidence: values.confidence,
    target_bookmarked: values.bookmarked,
    target_notes: values.notes,
  });
}

async function currentReminderPreferences(supabase) {
  const result = await supabase
    .from("interview_reminder_preferences")
    .select("preferred_timezone,in_app_enabled,prep_3_days_enabled,interview_1_day_enabled,interview_1_hour_enabled,email_enabled,updated_at")
    .single();
  return expectSuccess(result, "Reminder preference revision lookup failed");
}

async function saveReminderPreferences(supabase, values, expectation) {
  const expectedUpdatedAt = expectation === undefined
    ? (await currentReminderPreferences(supabase)).updated_at
    : expectation;
  return supabase.rpc("save_interview_reminder_preferences_if_revision", {
    target_expect_absent: expectedUpdatedAt === null,
    target_expected_updated_at: expectedUpdatedAt,
    preferred_timezone_value: values.preferredTimezone,
    in_app_enabled_value: values.inAppEnabled,
    prep_3_days_enabled_value: values.prep3DaysEnabled,
    interview_1_day_enabled_value: values.interview1DayEnabled,
    interview_1_hour_enabled_value: values.interview1HourEnabled,
    email_enabled_value: values.emailEnabled,
  });
}

async function getInterviewPlaybookDiagnosticSnapshot(supabase) {
  const result = await supabase.rpc("get_interview_playbook_diagnostic_inputs_snapshot");
  const rows = expectSuccess(result, "Interview Playbook diagnostic snapshot lookup failed");
  expect(rows.length === 1, `expected one Interview Playbook diagnostic snapshot row, observed ${rows.length}`);
  return rows[0];
}

async function saveInterviewPlaybookDiagnosticSnapshot(supabase, values, expectedUpdatedAt) {
  return supabase.rpc("save_interview_playbook_diagnostic_inputs_if_revision", {
    target_expect_absent: expectedUpdatedAt === null,
    target_expected_updated_at: expectedUpdatedAt,
    available_hours_per_week_value: values.availableHoursPerWeek,
    confidence_entries: values.confidenceEntries,
    priority_areas: values.priorityAreas,
    constraint_entries: values.constraintEntries,
    behavioral_stories_coverage_value: values.behavioralStoriesCoverage,
    project_deep_dive_coverage_value: values.projectDeepDiveCoverage,
  });
}

function assertInterviewPlaybookDiagnosticSnapshot(actual, expected, revision) {
  expect(actual.has_saved_inputs === true, "diagnostic snapshot was not marked saved");
  expect(actual.available_hours_per_week === expected.availableHoursPerWeek, "diagnostic hours came from a different aggregate snapshot");
  expect(JSON.stringify(actual.confidence_entries) === JSON.stringify(expected.confidenceEntries), "diagnostic confidence came from a different aggregate snapshot");
  expect(JSON.stringify(actual.priority_areas) === JSON.stringify(expected.priorityAreas), "diagnostic priorities came from a different aggregate snapshot");
  const constraints = actual.constraint_entries.map(({ category, description }) => ({ category, description }));
  expect(JSON.stringify(constraints) === JSON.stringify(expected.constraintEntries), "diagnostic constraints came from a different aggregate snapshot");
  expect(actual.constraint_entries.every((entry) => /^[0-9a-f-]{36}$/i.test(entry.id)), "diagnostic constraint snapshot omitted a canonical row id");
  expect(actual.behavioral_stories_coverage === expected.behavioralStoriesCoverage, "Behavioral coverage came from a different aggregate snapshot");
  expect(actual.project_deep_dive_coverage === expected.projectDeepDiveCoverage, "Project Deep Dive coverage came from a different aggregate snapshot");
  expect(actual.updated_at === revision, "diagnostic aggregate returned the wrong revision");
}

const enabledReminderPreferences = {
  preferredTimezone: "America/Chicago",
  inAppEnabled: true,
  prep3DaysEnabled: true,
  interview1DayEnabled: true,
  interview1HourEnabled: true,
  emailEnabled: false,
};

function behavioralStoryArgs(overrides = {}) {
  return {
    target_title: "Phase 5A qualification launch recovery",
    target_company_or_context: null,
    target_role: null,
    target_approximate_period: null,
    target_project: null,
    target_situation: "A critical launch was at risk after an external dependency changed late in the release window.",
    target_task: "I owned the safe rollout decision and stakeholder alignment.",
    target_action: "I compared rollback options, reduced reversible scope, aligned the service owners, documented the decision, and monitored the agreed indicators throughout release.",
    target_result: "The launch completed without customer impact, and the team retained a tested rollback path for later releases.",
    target_reflection: null,
    target_short_summary: null,
    target_notes: null,
    target_themes: ["Leadership", "Ownership"],
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
    target_title: "Phase 5A qualification answer",
    target_answer_text: "",
    target_opening_framing: null,
    target_details_to_emphasize: null,
    target_details_to_avoid: null,
    target_notes: null,
    target_status: "Draft",
    target_make_primary: false,
    ...overrides,
  };
}

function interviewExperienceArgs(overrides = {}) {
  return {
    target_experience_id: randomUUID(),
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_submit: false,
    target_company_name: fixtureCompany,
    target_role_title: "Software Engineer",
    target_role_level: "Mid",
    target_region: null,
    target_interview_date: null,
    target_summary: "A bounded local qualification report that exercises one coherent private aggregate snapshot.",
    target_preparation_lessons: null,
    target_public_identity: "anonymous",
    target_publication_consent: false,
    target_rounds: [{
      round_type: "Coding",
      topic_labels: ["Arrays"],
      process_notes: "Private qualification process notes.",
    }],
    ...overrides,
  };
}

function expectSingleExperienceResult(result, fallback) {
  const rows = expectSuccess(result, fallback);
  expect(Array.isArray(rows) && rows.length === 1, `${fallback}: expected one result row, observed ${rows?.length ?? "unknown"}`);
  return rows[0];
}

function expectSqlError(result, expectedCodes) {
  const codes = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
  expect(result.error, `expected ${codes.join(" or ")}, observed no error`);
  expect(
    codes.includes(result.error.code),
    `expected ${codes.join(" or ")}, observed ${result.error.code ?? "an unclassified error"}: ${result.error.message}`,
  );
  return `SQLSTATE ${result.error.code}`;
}

function expectInvisible(result, label) {
  expect(!result.error, result.error?.message ?? `${label} lookup failed`);
  expect(Array.isArray(result.data) && result.data.length === 0, `${label} exposed or changed ${result.data?.length ?? "unknown"} row(s)`);
  return "0 rows";
}

function requireFixture(value, label) {
  expect(value, `${label} fixture was unavailable because an earlier assertion failed`);
  return value;
}

async function confirmLatestEmail(email) {
  const listResponse = await fetch(`${mailpitUrl}/api/v1/messages`);
  expect(listResponse.ok, `Mailpit message list returned ${listResponse.status}`);
  const list = await listResponse.json();
  const message = list.messages
    .filter((candidate) => candidate.To.some((recipient) => recipient.Address === email))
    .sort((left, right) => new Date(right.Created) - new Date(left.Created))[0];
  expect(message, "confirmation email was not captured by Mailpit");

  const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
  expect(detailResponse.ok, `Mailpit message detail returned ${detailResponse.status}`);
  const detail = await detailResponse.json();
  const verifyUrl = detail.Text.match(/https?:\/\/[^\s)]+\/auth\/v1\/verify\?[^\s)]+/)?.[0];
  expect(verifyUrl, "confirmation URL was absent from the captured email");

  const verification = await fetch(verifyUrl, { redirect: "manual" });
  expect([302, 303].includes(verification.status), `confirmation endpoint returned ${verification.status}`);
}

async function ensureConfirmedUser(email) {
  let authClient = client();
  let signedIn = await authClient.auth.signInWithPassword({ email, password });
  if (!signedIn.error && signedIn.data.user) {
    return { authClient, user: signedIn.data.user };
  }

  authClient = client();
  const signup = await authClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fdashboard" },
  });
  expect(!signup.error, `signup failed: ${signup.error?.message}`);
  expect(!signup.data.session, "confirmation-enabled signup unexpectedly returned a session");

  await new Promise((resolve) => setTimeout(resolve, 300));
  await confirmLatestEmail(email);

  authClient = client();
  signedIn = await authClient.auth.signInWithPassword({ email, password });
  expect(!signedIn.error && signedIn.data.user, `confirmed sign-in failed: ${signedIn.error?.message}`);
  return { authClient, user: signedIn.data.user };
}

async function cleanOwnedFixtures(account) {
  const owned = account.authClient;
  const attemptRows = expectSuccess(await owned.from("system_design_attempts").select("id").like("title", "Phase 5B qualification%"), "System Design attempt cleanup lookup failed");
  for (const attempt of attemptRows) expectSuccess(await owned.rpc("delete_system_design_attempt", { target_attempt_id: attempt.id }), "System Design attempt cleanup failed");
  const cleanupOperations = [
    owned.from("behavioral_answers").delete().like("title", "Phase 5A qualification%"),
    owned.from("behavioral_saved_questions").delete().eq("curated_question_id", "beh-conflict-01"),
    owned.from("behavioral_stories").delete().like("title", "Phase 5A qualification%"),
    owned.from("behavioral_custom_questions").delete().like("question_text", "Phase 5A qualification%"),
    owned.from("applications").delete().like("company_name", `${fixtureCompany}%`),
    owned.from("dsa_progress").delete().like("item_id", `${fixturePrefix}:%`),
    owned.from("dsa_question_progress").delete().in("question_id", ["two-sum", "longest-substring-without-repeating-characters", "course-schedule", "group-anagrams", "binary-search", "valid-parentheses", "valid-anagram", "climbing-stairs", "coin-change", "merge-intervals"]),
    owned.from("system_design_item_progress").delete().in("item_id", ["estimation", "url-shortener", "vector-search", "rate-limiter", "notification-service", "job-scheduler", "search-autocomplete", "leaderboard"]),
    owned.from("system_design_progress").delete().like("item_id", `${fixturePrefix}:%`),
    owned.from("user_preparation_preferences").delete().eq("user_id", account.user.id),
  ];

  for (const operation of cleanupOperations) {
    const result = await operation;
    expect(!result.error, `fixture cleanup failed: ${result.error?.message}`);
  }
  queryLocalDatabase(
    "delete from public.preparation_track_progress where user_id = :'user_id'::uuid",
    { user_id: account.user.id },
  );
  queryLocalDatabase(
    `delete from public.interview_playbook_constraints where user_id = :'user_id'::uuid;
     delete from public.interview_playbook_priorities where user_id = :'user_id'::uuid;
     delete from public.interview_playbook_confidence where user_id = :'user_id'::uuid;
     delete from public.interview_playbook_diagnostic_settings where user_id = :'user_id'::uuid;`,
    { user_id: account.user.id },
  );
}

function cleanPublicExperienceFixtures() {
  queryLocalDatabase(
    "delete from public.interview_experiences where company_name = :'company_name' and summary like 'A bounded local qualification report%'",
    { company_name: fixtureCompany },
  );
}

const a = await ensureConfirmedUser("persistence-qualification-a@example.test");
const b = await ensureConfirmedUser("persistence-qualification-b@example.test");
const anonymous = client();

await cleanOwnedFixtures(a);
await cleanOwnedFixtures(b);
cleanPublicExperienceFixtures();

const fixture = {
  applicationId: null,
  firstRoundId: null,
  secondRoundId: null,
  customQuestionId: null,
  storyId: null,
  storyRevision: null,
  storyLinkId: null,
  answerId: null,
  curatedSavedQuestionId: null,
  customSavedQuestionId: null,
  systemDesignAttemptId: null,
  preparationId: null,
  preparationTaskId: null,
  publicExperienceId: null,
};

let interviewPlaybookDiagnosticRevision = null;
let interviewPlaybookDiagnosticValue = null;

const diagnosticSnapshotA = {
  availableHoursPerWeek: 8,
  confidenceEntries: [
    { area: "algorithmic-coding", confidence: "medium" },
    { area: "system-design", confidence: "low" },
  ],
  priorityAreas: ["system-design", "behavioral"],
  constraintEntries: [
    { category: "work", description: "Weeknight practice window" },
    { category: "health", description: "Protected recovery break" },
  ],
  behavioralStoriesCoverage: "partial",
  projectDeepDiveCoverage: "not-started",
};

const diagnosticSnapshotB = {
  availableHoursPerWeek: 12,
  confidenceEntries: [{ area: "behavioral", confidence: "high" }],
  priorityAreas: ["behavioral"],
  constraintEntries: [{ category: "family", description: "Weekend caregiving plan" }],
  behavioralStoriesCoverage: "covered",
  projectDeepDiveCoverage: "partial",
};

const diagnosticSnapshotC = {
  availableHoursPerWeek: 6,
  confidenceEntries: [{ area: "project-deep-dive", confidence: "medium" }],
  priorityAreas: ["project-deep-dive"],
  constraintEntries: [{ category: "school", description: "Course deadline boundary" }],
  behavioralStoriesCoverage: "not-started",
  projectDeepDiveCoverage: "covered",
};

await check("public interview experience uses the exact anonymous nested projection", async () => {
  const experienceId = randomUUID();
  const saved = expectSingleExperienceResult(await a.authClient.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
    target_experience_id: experienceId,
    target_submit: true,
    target_summary: "A bounded local qualification report that verifies the public nested projection without exposing private moderation fields.",
    target_publication_consent: true,
  })), "experience aggregate creation and submission failed");
  fixture.publicExperienceId = saved.experience_id;
  queryLocalDatabase("insert into public.admin_memberships(user_id) values (:'user_id'::uuid) on conflict do nothing", { user_id: a.user.id });
  try {
    const moderated = expectSingleExperienceResult(await a.authClient.rpc("moderate_interview_experience_if_revision", {
      target_experience_id: saved.experience_id,
      target_expected_updated_at: saved.updated_at,
      target_status: "approved",
      target_moderation_note: "Private qualification moderation note.",
    }), "experience moderation failed");
    expect(moderated.status === "approved", "experience moderation returned the wrong status");
  } finally {
    queryLocalDatabase("delete from public.admin_memberships where user_id = :'user_id'::uuid", { user_id: a.user.id });
  }

  const publicRead = expectSuccess(await anonymous
    .from("interview_experiences")
    .select("id,company_name,role_title,summary,public_identity,interview_experience_rounds(round_type,topic_labels)")
    .eq("id", saved.experience_id)
    .single(), "anonymous nested experience read failed");
  expect(
    JSON.stringify(Object.keys(publicRead).sort()) === JSON.stringify(["company_name", "id", "interview_experience_rounds", "public_identity", "role_title", "summary"]),
    `public report returned an unexpected shape: ${Object.keys(publicRead).sort().join(",")}`,
  );
  expect(publicRead.interview_experience_rounds?.length === 1, "public nested round was absent");
  expect(
    JSON.stringify(Object.keys(publicRead.interview_experience_rounds[0]).sort()) === JSON.stringify(["round_type", "topic_labels"]),
    `public round returned an unexpected shape: ${Object.keys(publicRead.interview_experience_rounds[0]).sort().join(",")}`,
  );

  expectSqlError(await anonymous.from("interview_experiences").select("author_id,review_note").eq("id", saved.experience_id), "42501");
  expectSqlError(await anonymous.from("interview_experiences").select("id,interview_experience_rounds(process_notes)").eq("id", saved.experience_id), "42501");
  expectInvisible(await b.authClient.from("interview_experiences").select("id,author_id,review_note").eq("id", saved.experience_id), "approved report base row for a non-owner");
  const ownerRead = expectSuccess(await a.authClient.from("interview_experiences").select("author_id,review_note,created_at").eq("id", saved.experience_id).single(), "owner internal read failed");
  expect(ownerRead.author_id === a.user.id && ownerRead.review_note === "Private qualification moderation note.", "owner internal fields did not round-trip");
  return "safe nested fields only; anon hidden columns denied; non-owner base row invisible";
});

await check("concurrent Interview Experience full saves commit one coherent parent and round snapshot", async () => {
  const experienceId = randomUUID();
  const initial = expectSingleExperienceResult(await a.authClient.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
    target_experience_id: experienceId,
  })), "concurrent experience fixture creation failed");
  const candidates = [
    interviewExperienceArgs({
      target_experience_id: experienceId,
      target_expect_absent: false,
      target_expected_updated_at: initial.updated_at,
      target_role_title: "Concurrency candidate A",
      target_summary: "A bounded local qualification report for full-save concurrency candidate A.",
      target_rounds: [{ round_type: "Coding", topic_labels: ["Arrays"], process_notes: "Candidate A round." }],
    }),
    interviewExperienceArgs({
      target_experience_id: experienceId,
      target_expect_absent: false,
      target_expected_updated_at: initial.updated_at,
      target_role_title: "Concurrency candidate B",
      target_summary: "A bounded local qualification report for full-save concurrency candidate B.",
      target_rounds: [{ round_type: "Behavioral", topic_labels: ["Leadership"], process_notes: "Candidate B round." }],
    }),
  ];
  const attempts = await Promise.all(candidates.map((args) => a.authClient.rpc("save_interview_experience_if_revision", args)));
  attempts.forEach((attempt) => expect(!attempt.error, attempt.error?.message ?? "concurrent full save failed"));
  const winnerIndex = attempts.findIndex((attempt) => attempt.data?.length === 1);
  expect(winnerIndex >= 0 && attempts.filter((attempt) => attempt.data?.length === 1).length === 1, "concurrent full saves did not produce exactly one revision winner");
  const aggregate = expectSuccess(await a.authClient
    .from("interview_experiences")
    .select("role_title,summary,interview_experience_rounds(round_type,topic_labels,process_notes)")
    .eq("id", experienceId)
    .single(), "concurrent experience aggregate read failed");
  const expected = candidates[winnerIndex];
  expect(aggregate.role_title === expected.target_role_title && aggregate.summary === expected.target_summary, "winning parent snapshot was torn");
  expect(aggregate.interview_experience_rounds?.length === 1
    && aggregate.interview_experience_rounds[0].round_type === expected.target_rounds[0].round_type
    && aggregate.interview_experience_rounds[0].process_notes === expected.target_rounds[0].process_notes,
  "winning round snapshot did not match its parent");
  return `candidate ${winnerIndex + 1} won; losing save returned zero rows`;
});

await check("concurrent Interview Experience save and submit preserve one desired aggregate state", async () => {
  const experienceId = randomUUID();
  const initial = expectSingleExperienceResult(await a.authClient.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
    target_experience_id: experienceId,
  })), "save-versus-submit fixture creation failed");
  const candidates = [
    interviewExperienceArgs({
      target_experience_id: experienceId,
      target_expect_absent: false,
      target_expected_updated_at: initial.updated_at,
      target_submit: false,
      target_summary: "A bounded local qualification report whose desired state remains a private draft.",
      target_rounds: [{ round_type: "Coding", topic_labels: ["Arrays"], process_notes: "Private draft snapshot." }],
    }),
    interviewExperienceArgs({
      target_experience_id: experienceId,
      target_expect_absent: false,
      target_expected_updated_at: initial.updated_at,
      target_submit: true,
      target_summary: "A bounded local qualification report whose desired state is an atomic submission.",
      target_publication_consent: true,
      target_rounds: [{ round_type: "Behavioral", topic_labels: ["Leadership"], process_notes: "Submitted snapshot." }],
    }),
  ];
  const attempts = await Promise.all(candidates.map((args) => a.authClient.rpc("save_interview_experience_if_revision", args)));
  attempts.forEach((attempt) => expect(!attempt.error, attempt.error?.message ?? "concurrent save or submit failed"));
  const winnerIndex = attempts.findIndex((attempt) => attempt.data?.length === 1);
  expect(winnerIndex >= 0 && attempts.filter((attempt) => attempt.data?.length === 1).length === 1, "save-versus-submit did not produce exactly one revision winner");
  const aggregate = expectSuccess(await a.authClient
    .from("interview_experiences")
    .select("status,summary,publication_consent,interview_experience_rounds(process_notes)")
    .eq("id", experienceId)
    .single(), "save-versus-submit aggregate read failed");
  const expected = candidates[winnerIndex];
  expect(aggregate.status === (expected.target_submit ? "submitted" : "draft")
    && aggregate.summary === expected.target_summary
    && aggregate.publication_consent === expected.target_publication_consent
    && aggregate.interview_experience_rounds?.[0]?.process_notes === expected.target_rounds[0].process_notes,
  "save-versus-submit committed a torn or wrong desired state");
  return `${aggregate.status} won with one matching parent and round snapshot`;
});

await check("concurrent Interview Experience resubmit and moderation cannot approve unseen content", async () => {
  const experienceId = randomUUID();
  const initialSummary = "A bounded local qualification report submitted before a requested moderation correction.";
  const submitted = expectSingleExperienceResult(await a.authClient.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
    target_experience_id: experienceId,
    target_submit: true,
    target_publication_consent: true,
    target_summary: initialSummary,
  })), "resubmit-versus-moderation fixture creation failed");
  queryLocalDatabase("insert into public.admin_memberships(user_id) values (:'user_id'::uuid) on conflict do nothing", { user_id: a.user.id });
  try {
    const needsChanges = expectSingleExperienceResult(await a.authClient.rpc("moderate_interview_experience_if_revision", {
      target_experience_id: experienceId,
      target_expected_updated_at: submitted.updated_at,
      target_status: "needs_changes",
      target_moderation_note: "Clarify the high-level process description.",
    }), "needs-changes moderation failed");
    const revisedSummary = "A bounded local qualification report resubmitted with the requested high-level clarification.";
    const [resubmit, moderation] = await Promise.all([
      a.authClient.rpc("save_interview_experience_if_revision", interviewExperienceArgs({
        target_experience_id: experienceId,
        target_expect_absent: false,
        target_expected_updated_at: needsChanges.updated_at,
        target_submit: true,
        target_publication_consent: true,
        target_summary: revisedSummary,
      })),
      a.authClient.rpc("moderate_interview_experience_if_revision", {
        target_experience_id: experienceId,
        target_expected_updated_at: needsChanges.updated_at,
        target_status: "approved",
        target_moderation_note: "Approved the displayed revision.",
      }),
    ]);
    for (const attempt of [resubmit, moderation]) expect(!attempt.error, attempt.error?.message ?? "resubmit-versus-moderation RPC failed");
    expect((resubmit.data?.length ?? 0) + (moderation.data?.length ?? 0) === 1, "resubmit-versus-moderation did not produce exactly one revision winner");
    const aggregate = expectSuccess(await a.authClient.from("interview_experiences").select("status,summary,review_note").eq("id", experienceId).single(), "resubmit-versus-moderation read failed");
    if (resubmit.data?.length === 1) {
      expect(aggregate.status === "submitted" && aggregate.summary === revisedSummary && aggregate.review_note === null, "winning resubmit was not coherent");
    } else {
      expect(aggregate.status === "approved" && aggregate.summary === initialSummary && aggregate.review_note === "Approved the displayed revision.", "moderation approved content other than its displayed revision");
    }
    return `${aggregate.status} won; the competing stale mutation returned zero rows`;
  } finally {
    queryLocalDatabase("delete from public.admin_memberships where user_id = :'user_id'::uuid", { user_id: a.user.id });
  }
});

await check("User A creates and reads an application through the public Data API", async () => {
  const insertion = await a.authClient
    .from("applications")
    .insert({
      user_id: a.user.id,
      company_name: fixtureCompany,
      company_slug: "amazon",
      role_title: "Software Development Engineer II",
      status: "Applied",
      notes: "Phase 5A local Data API fixture.",
    })
    .select("id,company_name,role_title,status")
    .single();
  const row = expectSuccess(insertion, "application insertion failed");
  expect(row.company_name === fixtureCompany && row.status === "Applied", "created application did not round-trip");
  fixture.applicationId = row.id;
  return row.id;
});

await check("User A updates their application", async () => {
  const applicationId = requireFixture(fixture.applicationId, "application");
  const update = await a.authClient
    .from("applications")
    .update({ status: "Interviewing", notes: "Owner update persisted." })
    .eq("id", applicationId)
    .select("status,notes")
    .single();
  const row = expectSuccess(update, "application update failed");
  expect(row.status === "Interviewing" && row.notes === "Owner update persisted.", "application update did not persist");
});

await check("stale full application edit cannot overwrite a newer quick status", async () => {
  const created = expectSuccess(await a.authClient
    .from("applications")
    .insert({
      user_id: a.user.id,
      company_name: `${fixtureCompany} application CAS`,
      company_slug: "application-cas",
      role_title: "Original role",
      status: "Applied",
      notes: "Original private note.",
    })
    .select("id,updated_at")
    .single(), "application CAS fixture creation failed");

  await new Promise((resolve) => setTimeout(resolve, 5));
  const quickStatus = expectSuccess(await a.authClient
    .from("applications")
    .update({ status: "Interviewing" })
    .eq("id", created.id)
    .eq("user_id", a.user.id)
    .select("updated_at")
    .single(), "application quick-status setup failed");
  expect(quickStatus.updated_at !== created.updated_at, "application quick status did not advance the edit revision");

  const staleFullEdit = expectSuccess(await a.authClient
    .from("applications")
    .update({
      company_name: `${fixtureCompany} stale overwrite`,
      company_slug: "stale-overwrite",
      role_title: "Stale overwrite",
      status: "Applied",
      notes: "Stale private note.",
    })
    .eq("id", created.id)
    .eq("user_id", a.user.id)
    .eq("updated_at", created.updated_at)
    .select("id"), "stale application CAS request failed");
  expect(staleFullEdit.length === 0, `stale application edit affected ${staleFullEdit.length} row(s)`);

  const preserved = expectSuccess(await a.authClient
    .from("applications")
    .select("company_name,role_title,status,notes,updated_at")
    .eq("id", created.id)
    .eq("user_id", a.user.id)
    .single(), "application CAS preservation read failed");
  expect(
    preserved.company_name === `${fixtureCompany} application CAS`
      && preserved.role_title === "Original role"
      && preserved.status === "Interviewing"
      && preserved.notes === "Original private note."
      && preserved.updated_at === quickStatus.updated_at,
    "stale full application edit overwrote newer or unrelated saved values",
  );
  return "0 stale rows; newer status and original fields preserved";
});

await check("User A creates two owned interview rounds", async () => {
  const applicationId = requireFixture(fixture.applicationId, "application");
  const insertion = await a.authClient
    .from("interview_rounds")
    .insert([
      {
        application_id: applicationId,
        user_id: a.user.id,
        round_number: 1,
        round_name: "Phase 5A qualification recruiter screen",
        round_type: "Recruiter Screen",
      },
      {
        application_id: applicationId,
        user_id: a.user.id,
        round_number: 2,
        round_name: "Phase 5A qualification technical screen",
        round_type: "Coding",
      },
    ])
    .select("id,round_number,round_name")
    .order("round_number");
  const rows = expectSuccess(insertion, "round insertion failed");
  expect(rows.length === 2, `expected 2 rounds, observed ${rows.length}`);
  fixture.firstRoundId = rows[0].id;
  fixture.secondRoundId = rows[1].id;
});

await check("stale full round edit cannot overwrite a newer completion", async () => {
  const application = expectSuccess(await a.authClient
    .from("applications")
    .insert({
      user_id: a.user.id,
      company_name: `${fixtureCompany} round CAS`,
      company_slug: "round-cas",
      role_title: "Round CAS role",
      status: "Interviewing",
    })
    .select("id")
    .single(), "round CAS application fixture creation failed");
  const created = expectSuccess(await a.authClient
    .from("interview_rounds")
    .insert({
      application_id: application.id,
      user_id: a.user.id,
      round_number: 1,
      round_name: "Round CAS technical screen",
      round_type: "Coding",
      scheduled_at: "2026-09-18T19:00:00Z",
      timezone: "America/Chicago",
      status: "Scheduled",
      result: "Pending",
      notes: "Original round note.",
    })
    .select("id,updated_at")
    .single(), "round CAS fixture creation failed");

  await new Promise((resolve) => setTimeout(resolve, 5));
  const completed = expectSuccess(await a.authClient
    .from("interview_rounds")
    .update({ status: "Completed" })
    .eq("id", created.id)
    .eq("application_id", application.id)
    .eq("user_id", a.user.id)
    .select("updated_at")
    .single(), "round completion setup failed");
  expect(completed.updated_at !== created.updated_at, "round completion did not advance the edit revision");

  const staleFullEdit = expectSuccess(await a.authClient
    .from("interview_rounds")
    .update({
      round_name: "Stale round overwrite",
      round_type: "System Design",
      scheduled_at: "2026-09-18T19:00:00Z",
      timezone: "America/Chicago",
      status: "Scheduled",
      result: "Pending",
      notes: "Stale round note.",
    })
    .eq("id", created.id)
    .eq("application_id", application.id)
    .eq("user_id", a.user.id)
    .eq("updated_at", created.updated_at)
    .select("id"), "stale round CAS request failed");
  expect(staleFullEdit.length === 0, `stale round edit affected ${staleFullEdit.length} row(s)`);

  const preserved = expectSuccess(await a.authClient
    .from("interview_rounds")
    .select("round_name,round_type,status,result,notes,updated_at")
    .eq("id", created.id)
    .eq("application_id", application.id)
    .eq("user_id", a.user.id)
    .single(), "round CAS preservation read failed");
  expect(
    preserved.round_name === "Round CAS technical screen"
      && preserved.round_type === "Coding"
      && preserved.status === "Completed"
      && preserved.result === "Pending"
      && preserved.notes === "Original round note."
      && preserved.updated_at === completed.updated_at,
    "stale full round edit overwrote newer or unrelated saved values",
  );
  return "0 stale rows; completion and original fields preserved";
});

await check("atomic move_interview_round swaps adjacent owner rounds", async () => {
  const applicationId = requireFixture(fixture.applicationId, "application");
  const secondRoundId = requireFixture(fixture.secondRoundId, "second round");
  const move = await a.authClient.rpc("move_interview_round", {
    target_application_id: applicationId,
    target_round_id: secondRoundId,
    move_direction: "up",
  });
  expect(!move.error && move.data === true, move.error?.message ?? "round move returned false");

  const order = await a.authClient
    .from("interview_rounds")
    .select("id,round_number")
    .eq("application_id", applicationId)
    .order("round_number");
  const rows = expectSuccess(order, "round order lookup failed");
  expect(rows.length === 2 && rows[0].id === secondRoundId && rows[1].id === fixture.firstRoundId, "round swap was not committed atomically");
  expect(rows[0].round_number === 1 && rows[1].round_number === 2, "round numbers are not contiguous after the move");
});

await check("atomic round move treats an out-of-bounds move as a no-op", async () => {
  const move = await a.authClient.rpc("move_interview_round", {
    target_application_id: requireFixture(fixture.applicationId, "application"),
    target_round_id: requireFixture(fixture.secondRoundId, "second round"),
    move_direction: "up",
  });
  expect(!move.error && move.data === false, move.error?.message ?? "out-of-bounds move unexpectedly succeeded");
  return "false without mutation";
});

await check("User B cannot read User A application or rounds", async () => {
  const applicationRead = await b.authClient.from("applications").select("id").eq("id", requireFixture(fixture.applicationId, "application"));
  expectInvisible(applicationRead, "application");
  const roundRead = await b.authClient.from("interview_rounds").select("id").eq("application_id", fixture.applicationId);
  expectInvisible(roundRead, "interview rounds");
  return "0 application rows; 0 round rows";
});

await check("User B cannot update or delete User A application", async () => {
  const applicationId = requireFixture(fixture.applicationId, "application");
  const update = await b.authClient.from("applications").update({ role_title: "Intrusion" }).eq("id", applicationId).select("id");
  expectInvisible(update, "application update");
  const deletion = await b.authClient.from("applications").delete().eq("id", applicationId).select("id");
  expectInvisible(deletion, "application deletion");
  return "both mutations affected 0 rows";
});

await check("User B cannot update or delete User A interview round", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  const update = await b.authClient.from("interview_rounds").update({ status: "Completed" }).eq("id", roundId).select("id");
  expectInvisible(update, "round update");
  const deletion = await b.authClient.from("interview_rounds").delete().eq("id", roundId).select("id");
  expectInvisible(deletion, "round deletion");
  return "both mutations affected 0 rows";
});

await check("clearing a missing checklist item is idempotent without creating preparation", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  const cleared = expectSuccess(await a.authClient.rpc("set_interview_preparation_checklist_item", {
    target_round_id: roundId,
    target_item_id: "dsa-review-queue",
    target_completed: false,
  }), "missing checklist clear failed");
  expect(cleared === fixture.applicationId, "missing checklist clear returned the wrong application");
  const rows = expectSuccess(await a.authClient.from("interview_preparations").select("id").eq("round_id", roundId), "missing preparation lookup failed");
  expect(rows.length === 0, "clearing a missing item created an empty preparation row");
  return "application returned; 0 preparation rows";
});

await check("User A creates notes and concurrent desired-state checklist updates retain both items", async () => {
  const saved = await a.authClient.rpc("save_interview_preparation", {
    target_round_id: requireFixture(fixture.secondRoundId, "second round"),
    notes_value: "Review the interviewer context and narrate trade-offs.",
  });
  fixture.preparationId = expectSuccess(saved, "preparation save failed");
  const checklistResults = await Promise.all([
    a.authClient.rpc("set_interview_preparation_checklist_item", {
      target_round_id: fixture.secondRoundId,
      target_item_id: "logistics-confirm",
      target_completed: true,
    }),
    a.authClient.rpc("set_interview_preparation_checklist_item", {
      target_round_id: fixture.secondRoundId,
      target_item_id: "dsa-review-queue",
      target_completed: true,
    }),
  ]);
  for (const result of checklistResults) {
    expect(expectSuccess(result, "concurrent checklist update failed") === fixture.applicationId, "checklist update returned the wrong application");
  }
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("round_id,private_notes,completed_template_item_ids").eq("id", fixture.preparationId).single(), "preparation read failed");
  expect(row.round_id === fixture.secondRoundId, "preparation state attached to the wrong round");
  expect(row.private_notes.includes("trade-offs"), "concurrent checklist updates replaced private notes");
  expect(row.completed_template_item_ids.length === 2 && row.completed_template_item_ids.includes("logistics-confirm") && row.completed_template_item_ids.includes("dsa-review-queue"), "concurrent checklist updates did not retain both items");
  return "both items and private notes retained";
});

await check("desired-state checklist updates are idempotent and legacy array replacement fails closed", async () => {
  const roundId = requireFixture(fixture.secondRoundId, "second round");
  const repeated = await Promise.all([
    a.authClient.rpc("set_interview_preparation_checklist_item", { target_round_id: roundId, target_item_id: "dsa-review-queue", target_completed: true }),
    a.authClient.rpc("set_interview_preparation_checklist_item", { target_round_id: roundId, target_item_id: "dsa-review-queue", target_completed: true }),
  ]);
  for (const result of repeated) expectSuccess(result, "repeated desired-state update failed");
  const rejected = await a.authClient.rpc("save_interview_preparation", {
    target_round_id: roundId,
    completed_ids_value: ["company-research"],
  });
  expectSqlError(rejected, "0A000");
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("private_notes,completed_template_item_ids").eq("id", fixture.preparationId).single(), "idempotence read failed");
  expect(row.completed_template_item_ids.filter((item) => item === "dsa-review-queue").length === 1, "repeated true created a duplicate checklist item");
  expect(row.completed_template_item_ids.includes("logistics-confirm") && !row.completed_template_item_ids.includes("company-research"), "legacy array replacement changed checklist membership");
  expect(row.private_notes.includes("trade-offs"), "checklist updates replaced private notes");
  return "one canonical item; legacy SQLSTATE 0A000";
});

await check("clearing an item removes every legacy duplicate while preserving sibling state", async () => {
  const preparationId = requireFixture(fixture.preparationId, "preparation");
  queryLocalDatabase(
    "update public.interview_preparations set completed_template_item_ids = array['dsa-review-queue', 'dsa-review-queue', 'logistics-confirm'] where id = :'preparation_id'::uuid",
    { preparation_id: preparationId },
  );
  expectSuccess(await a.authClient.rpc("set_interview_preparation_checklist_item", {
    target_round_id: requireFixture(fixture.secondRoundId, "second round"),
    target_item_id: "dsa-review-queue",
    target_completed: false,
  }), "duplicate checklist clear failed");
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("private_notes,completed_template_item_ids").eq("id", preparationId).single(), "duplicate removal read failed");
  expect(!row.completed_template_item_ids.includes("dsa-review-queue"), "clearing retained a legacy duplicate");
  expect(row.completed_template_item_ids.length === 1 && row.completed_template_item_ids[0] === "logistics-confirm", "clearing one item changed sibling membership");
  expect(row.private_notes.includes("trade-offs"), "clearing a checklist item replaced private notes");
  return "all duplicates removed; sibling and notes retained";
});

await check("invalid checklist inputs fail before mutation", async () => {
  const roundId = requireFixture(fixture.secondRoundId, "second round");
  expectSqlError(await a.authClient.rpc("set_interview_preparation_checklist_item", {
    target_round_id: roundId,
    target_item_id: "unknown-item",
    target_completed: true,
  }), "23514");
  expectSqlError(await a.authClient.rpc("set_interview_preparation_checklist_item", {
    target_round_id: roundId,
    target_item_id: null,
    target_completed: true,
  }), "23514");
  expectSqlError(await a.authClient.rpc("set_interview_preparation_checklist_item", {
    target_round_id: roundId,
    target_item_id: "dsa-review-queue",
    target_completed: null,
  }), "23502");
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("completed_template_item_ids").eq("id", fixture.preparationId).single(), "invalid-input mutation read failed");
  expect(row.completed_template_item_ids.length === 1 && row.completed_template_item_ids[0] === "logistics-confirm", "invalid checklist input mutated state");
  return "SQLSTATE 23514/23502; state unchanged";
});

await check("concurrent note and checklist writes preserve both fields", async () => {
  const roundId = requireFixture(fixture.secondRoundId, "second round");
  const [notesResult, checklistResult] = await Promise.all([
    a.authClient.rpc("save_interview_preparation", {
      target_round_id: roundId,
      notes_value: "Concurrent note and checklist preservation; narrate trade-offs.",
    }),
    a.authClient.rpc("set_interview_preparation_checklist_item", {
      target_round_id: roundId,
      target_item_id: "company-research",
      target_completed: true,
    }),
  ]);
  expectSuccess(notesResult, "concurrent note save failed");
  expect(expectSuccess(checklistResult, "concurrent checklist save failed") === fixture.applicationId, "concurrent checklist save returned the wrong application");
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("private_notes,completed_template_item_ids").eq("id", fixture.preparationId).single(), "concurrent field read failed");
  expect(row.private_notes === "Concurrent note and checklist preservation; narrate trade-offs.", "concurrent checklist save lost the note update");
  expect(row.completed_template_item_ids.includes("logistics-confirm") && row.completed_template_item_ids.includes("company-research"), "concurrent note save lost checklist membership");
  return "note and two checklist memberships retained";
});

await check("direct client writes cannot spoof preparation ownership", async () => {
  return expectSqlError(await a.authClient.from("interview_preparations").insert({
    round_id: requireFixture(fixture.secondRoundId, "second round"), user_id: b.user.id, private_notes: "forged",
  }), "42501");
});

await check("User A adds a bounded custom preparation task", async () => {
  const added = await a.authClient.rpc("add_interview_preparation_task", {
    target_round_id: requireFixture(fixture.secondRoundId, "second round"), title_value: "Test the interview meeting link",
  });
  fixture.preparationTaskId = expectSuccess(added, "custom task creation failed");
  const task = expectSuccess(await a.authClient.from("interview_preparation_custom_tasks").select("title,completed").eq("id", fixture.preparationTaskId).single(), "custom task read failed");
  expect(task.title === "Test the interview meeting link" && task.completed === false, "custom task did not round-trip");
});

await check("User B cannot read or toggle User A preparation state", async () => {
  expectInvisible(await b.authClient.from("interview_preparations").select("id").eq("id", requireFixture(fixture.preparationId, "preparation")), "preparation read");
  expectInvisible(await b.authClient.from("interview_preparation_custom_tasks").select("id").eq("id", requireFixture(fixture.preparationTaskId, "preparation task")), "preparation task read");
  const toggled = expectSuccess(await b.authClient.rpc("toggle_interview_preparation_task", { target_task_id: fixture.preparationTaskId }), "foreign task toggle call failed");
  expect(toggled === false, "User B toggled User A task");
  return "0 rows and false mutation";
});

await check("post-interview reflection is rejected before completion", async () => {
  const result = await a.authClient.rpc("save_interview_preparation", {
    target_round_id: requireFixture(fixture.secondRoundId, "second round"), went_well_value: "Clear requirements pass",
  });
  expect(result.error, "reflection unexpectedly saved before completion");
  return result.error.code;
});

await check("rescheduling preserves round preparation", async () => {
  const roundId = requireFixture(fixture.secondRoundId, "second round");
  expectSuccess(await a.authClient.from("interview_rounds").update({ status: "Rescheduled", scheduled_at: "2026-09-01T15:00:00Z" }).eq("id", roundId).select("id").single(), "round reschedule failed");
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("id,private_notes").eq("round_id", roundId).single(), "preparation lookup after reschedule failed");
  expect(row.id === fixture.preparationId && row.private_notes.includes("trade-offs"), "reschedule replaced or cleared preparation");
});

await check("completed rounds accept a private reflection", async () => {
  const roundId = requireFixture(fixture.secondRoundId, "second round");
  expectSuccess(await a.authClient.from("interview_rounds").update({ status: "Completed" }).eq("id", roundId).select("id").single(), "round completion failed");
  expectSuccess(await a.authClient.rpc("save_interview_preparation", {
    target_round_id: roundId, topics_asked_value: "Caching and failure modes", went_well_value: "Clear trade-offs", needs_improvement_value: "Estimate sooner", follow_up_notes_value: "Send thanks",
  }), "completed reflection save failed");
  const row = expectSuccess(await a.authClient.from("interview_preparations").select("topics_asked,went_well,needs_improvement,follow_up_notes").eq("round_id", roundId).single(), "reflection read failed");
  expect(row.topics_asked.includes("Caching") && row.needs_improvement.includes("Estimate"), "reflection did not round-trip");
});

await check("User B cannot forge User A as an application owner", async () => {
  const insertion = await b.authClient.from("applications").insert({
    user_id: a.user.id,
    company_name: `${fixtureCompany} forged`,
    role_title: "Engineer",
  });
  return expectSqlError(insertion, "42501");
});

await check("User B cannot attach their round to User A application", async () => {
  const insertion = await b.authClient.from("interview_rounds").insert({
    application_id: requireFixture(fixture.applicationId, "application"),
    user_id: b.user.id,
    round_number: 3,
    round_name: "Forged parent round",
    round_type: "Coding",
  });
  return expectSqlError(insertion, ["42501", "23503"]);
});

await check("User B cannot invoke the round-move RPC for User A", async () => {
  const move = await b.authClient.rpc("move_interview_round", {
    target_application_id: requireFixture(fixture.applicationId, "application"),
    target_round_id: requireFixture(fixture.firstRoundId, "first round"),
    move_direction: "up",
  });
  expect(!move.error && move.data === false, move.error?.message ?? "cross-user move unexpectedly succeeded");
  return "owner check returned false";
});

await check("application insert rejects client-assigned generated IDs", async () => {
  const insertion = await a.authClient.from("applications").insert({
    id: crypto.randomUUID(),
    user_id: a.user.id,
    company_name: `${fixtureCompany} mass assignment`,
    role_title: "Engineer",
  });
  return expectSqlError(insertion, "42501");
});

await check("application update rejects ownership mass assignment", async () => {
  const update = await a.authClient
    .from("applications")
    .update({ user_id: b.user.id })
    .eq("id", requireFixture(fixture.applicationId, "application"));
  return expectSqlError(update, "42501");
});

await check("invalid application status is rejected", async () => {
  const update = await a.authClient
    .from("applications")
    .update({ status: "Published" })
    .eq("id", requireFixture(fixture.applicationId, "application"));
  return expectSqlError(update, "23514");
});

await check("Interview Playbook diagnostic snapshot distinguishes absence and saves one coherent aggregate", async () => {
  const absent = await getInterviewPlaybookDiagnosticSnapshot(a.authClient);
  expect(absent.has_saved_inputs === false, "missing diagnostic settings were not represented as explicit absence");
  expect(absent.updated_at === null, "missing diagnostic settings received a synthetic revision");
  expect(
    JSON.stringify([absent.confidence_entries, absent.priority_areas, absent.constraint_entries]) === JSON.stringify([[], [], []]),
    "missing diagnostic settings did not return exact neutral collections",
  );

  const created = expectSuccess(
    await saveInterviewPlaybookDiagnosticSnapshot(a.authClient, diagnosticSnapshotA, null),
    "diagnostic aggregate creation failed",
  );
  expect(created.length === 1 && typeof created[0].updated_at === "string", "diagnostic aggregate create did not return one revision");
  interviewPlaybookDiagnosticRevision = created[0].updated_at;
  interviewPlaybookDiagnosticValue = diagnosticSnapshotA;
  const loaded = await getInterviewPlaybookDiagnosticSnapshot(a.authClient);
  assertInterviewPlaybookDiagnosticSnapshot(loaded, diagnosticSnapshotA, interviewPlaybookDiagnosticRevision);
  return `saved coherent aggregate at ${interviewPlaybookDiagnosticRevision}`;
});

await check("concurrent stale Interview Playbook diagnostic saves commit exactly one coherent winner", async () => {
  expect(interviewPlaybookDiagnosticRevision, "diagnostic aggregate revision fixture was unavailable");
  const attempts = await Promise.all([
    saveInterviewPlaybookDiagnosticSnapshot(a.authClient, diagnosticSnapshotB, interviewPlaybookDiagnosticRevision),
    saveInterviewPlaybookDiagnosticSnapshot(a.authClient, diagnosticSnapshotC, interviewPlaybookDiagnosticRevision),
  ]);
  for (const attempt of attempts) expect(!attempt.error, attempt.error?.message ?? "concurrent diagnostic save failed");
  const successIndexes = attempts.flatMap((attempt, index) => attempt.data?.length === 1 ? [index] : []);
  const conflictCount = attempts.filter((attempt) => attempt.data?.length === 0).length;
  expect(successIndexes.length === 1 && conflictCount === 1, `expected one diagnostic winner and one conflict, observed ${successIndexes.length}/${conflictCount}`);

  const winnerIndex = successIndexes[0];
  const winner = winnerIndex === 0 ? diagnosticSnapshotB : diagnosticSnapshotC;
  const revision = attempts[winnerIndex].data[0].updated_at;
  const loaded = await getInterviewPlaybookDiagnosticSnapshot(a.authClient);
  assertInterviewPlaybookDiagnosticSnapshot(loaded, winner, revision);
  interviewPlaybookDiagnosticRevision = revision;
  interviewPlaybookDiagnosticValue = winner;
  return `one winner at ${revision}; losing full snapshot returned zero rows`;
});

await check("a snapshot read concurrent with a diagnostic save is entirely before or after the saved aggregate", async () => {
  expect(interviewPlaybookDiagnosticRevision && interviewPlaybookDiagnosticValue, "diagnostic winner fixture was unavailable");
  const priorRevision = interviewPlaybookDiagnosticRevision;
  const priorValue = interviewPlaybookDiagnosticValue;
  const [saved, concurrentRead] = await Promise.all([
    saveInterviewPlaybookDiagnosticSnapshot(a.authClient, diagnosticSnapshotA, priorRevision),
    getInterviewPlaybookDiagnosticSnapshot(a.authClient),
  ]);
  const savedRows = expectSuccess(saved, "diagnostic save during coherent read failed");
  expect(savedRows.length === 1, `expected the coherent-read save to return one row, observed ${savedRows.length}`);
  const savedRevision = savedRows[0].updated_at;

  if (concurrentRead.updated_at === priorRevision) {
    assertInterviewPlaybookDiagnosticSnapshot(concurrentRead, priorValue, priorRevision);
  } else {
    assertInterviewPlaybookDiagnosticSnapshot(concurrentRead, diagnosticSnapshotA, savedRevision);
  }

  const finalRead = await getInterviewPlaybookDiagnosticSnapshot(a.authClient);
  assertInterviewPlaybookDiagnosticSnapshot(finalRead, diagnosticSnapshotA, savedRevision);
  interviewPlaybookDiagnosticRevision = savedRevision;
  interviewPlaybookDiagnosticValue = diagnosticSnapshotA;
  return `concurrent read revision ${concurrentRead.updated_at}; saved revision ${savedRevision}`;
});

await check("legacy Interview Playbook diagnostic save fails before mutating the aggregate", async () => {
  expect(interviewPlaybookDiagnosticRevision && interviewPlaybookDiagnosticValue, "diagnostic aggregate fixture was unavailable");
  const legacy = await a.authClient.rpc("save_interview_playbook_diagnostic_inputs", {
    available_hours_per_week_value: 168,
    confidence_entries: [],
    priority_areas: [],
    constraint_entries: [],
    behavioral_stories_coverage_value: "unknown",
    project_deep_dive_coverage_value: "unknown",
  });
  expectSqlError(legacy, "0A000");
  const loaded = await getInterviewPlaybookDiagnosticSnapshot(a.authClient);
  assertInterviewPlaybookDiagnosticSnapshot(loaded, interviewPlaybookDiagnosticValue, interviewPlaybookDiagnosticRevision);
  return "SQLSTATE 0A000; aggregate unchanged";
});

await check("User A creates a custom behavioral question", async () => {
  const insertion = await a.authClient
    .from("behavioral_custom_questions")
    .insert({
      user_id: a.user.id,
      question_text: "Phase 5A qualification: tell me about an ambiguous technical decision?",
      category: "Leadership",
      notes: "Local qualification fixture.",
    })
    .select("id,question_text")
    .single();
  const row = expectSuccess(insertion, "custom question insertion failed");
  fixture.customQuestionId = row.id;
  return row.id;
});

await check("User A atomically creates a behavioral story and theme set", async () => {
  const created = await a.authClient.rpc("create_behavioral_story_with_themes", behavioralStoryArgs({
    target_themes: [" Leadership ", "Ownership", "Leadership"],
  }));
  const rows = expectSuccess(created, "story aggregate creation failed");
  expect(rows.length === 1, `expected one created aggregate row, observed ${rows.length}`);
  fixture.storyId = rows[0].story_id;
  fixture.storyRevision = rows[0].updated_at;
  const [story, themes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("id,title,status,updated_at").eq("id", rows[0].story_id).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", rows[0].story_id).order("theme"),
  ]);
  const storyRow = expectSuccess(story, "story aggregate read failed");
  const themeRows = expectSuccess(themes, "story theme read failed");
  expect(storyRow.status === "Ready" && storyRow.updated_at === rows[0].updated_at, "created aggregate returned the wrong canonical revision");
  expect(JSON.stringify(themeRows.map((row) => row.theme)) === JSON.stringify(["Leadership", "Ownership"]), "themes were not normalized and deduplicated");
  return `${rows[0].story_id} at ${rows[0].updated_at}`;
});

await check("revision-checked story update advances monotonically with coherent themes", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const priorRevision = requireFixture(fixture.storyRevision, "story revision");
  const updated = await a.authClient.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: storyId,
    target_expected_updated_at: priorRevision,
    ...behavioralStoryArgs({
      target_reflection: "Escalate the scope decision earlier.",
      target_themes: ["Growth", "Leadership"],
    }),
  });
  const rows = expectSuccess(updated, "story aggregate update failed");
  expect(rows.length === 1, `expected one updated aggregate row, observed ${rows.length}`);
  expect(rows[0].updated_at !== priorRevision, "story revision did not advance");
  fixture.storyRevision = rows[0].updated_at;
  const [story, themes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("status,reflection,updated_at").eq("id", storyId).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", storyId).order("theme"),
  ]);
  const storyRow = expectSuccess(story, "updated story read failed");
  const themeRows = expectSuccess(themes, "updated theme read failed");
  expect(storyRow.status === "Ready" && storyRow.reflection?.includes("earlier"), "story update did not round-trip");
  expect(storyRow.updated_at === rows[0].updated_at, "returned revision does not match persisted revision");
  expect(JSON.stringify(themeRows.map((row) => row.theme)) === JSON.stringify(["Growth", "Leadership"]), "updated aggregate themes were incoherent");
});

await check("concurrent stale full-story saves commit exactly one coherent aggregate", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const priorRevision = requireFixture(fixture.storyRevision, "story revision");
  const save = (label, theme) => a.authClient.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: storyId,
    target_expected_updated_at: priorRevision,
    ...behavioralStoryArgs({ target_notes: `Concurrent ${label} private note`, target_themes: [theme] }),
  });
  const attempts = await Promise.all([save("A", "Conflict"), save("B", "Execution")]);
  attempts.forEach((attempt) => expect(!attempt.error, attempt.error?.message ?? "concurrent story update failed"));
  expect(attempts.filter((attempt) => attempt.data?.length === 1).length === 1, "concurrent updates did not yield exactly one winner");
  expect(attempts.filter((attempt) => attempt.data?.length === 0).length === 1, "concurrent updates did not yield exactly one stale result");
  const winner = attempts.find((attempt) => attempt.data?.length === 1);
  fixture.storyRevision = winner.data[0].updated_at;
  const [story, themes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("notes,updated_at").eq("id", storyId).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", storyId),
  ]);
  const storyRow = expectSuccess(story, "concurrent story read failed");
  const themeRows = expectSuccess(themes, "concurrent theme read failed");
  const coherent = (storyRow.notes === "Concurrent A private note" && themeRows[0]?.theme === "Conflict")
    || (storyRow.notes === "Concurrent B private note" && themeRows[0]?.theme === "Execution");
  expect(coherent && themeRows.length === 1, "parent and theme rows came from different concurrent snapshots");
  return "one winner, one stale result, one coherent snapshot";
});

await check("reversed concurrent stale saves preserve the second winner as one aggregate", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const priorRevision = requireFixture(fixture.storyRevision, "story revision");
  const save = (label, theme) => a.authClient.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: storyId,
    target_expected_updated_at: priorRevision,
    ...behavioralStoryArgs({ target_notes: `Reverse ${label} private note`, target_themes: [theme] }),
  });
  const attempts = await Promise.all([save("B", "Customer"), save("A", "Initiative")]);
  attempts.forEach((attempt) => expect(!attempt.error, attempt.error?.message ?? "reverse concurrent story update failed"));
  expect(attempts.filter((attempt) => attempt.data?.length === 1).length === 1, "reverse-order updates did not yield exactly one winner");
  expect(attempts.filter((attempt) => attempt.data?.length === 0).length === 1, "reverse-order updates did not yield exactly one stale result");
  const winner = attempts.find((attempt) => attempt.data?.length === 1);
  fixture.storyRevision = winner.data[0].updated_at;
  const [story, themes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("notes").eq("id", storyId).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", storyId),
  ]);
  const storyRow = expectSuccess(story, "reverse-order story read failed");
  const themeRows = expectSuccess(themes, "reverse-order theme read failed");
  const coherent = (storyRow.notes === "Reverse A private note" && themeRows[0]?.theme === "Initiative")
    || (storyRow.notes === "Reverse B private note" && themeRows[0]?.theme === "Customer");
  expect(coherent && themeRows.length === 1, "reverse-order parent and themes were torn");
});

await check("a concurrent Behavioral story edit read keeps the parent revision and theme snapshot coherent", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const priorRevision = requireFixture(fixture.storyRevision, "story revision");
  const selectEditSnapshot = () => a.authClient
    .from("behavioral_stories")
    .select("id,user_id,title,company_or_context,role,approximate_period,project,situation,task,action,result,reflection,short_summary,status,notes,created_at,updated_at,behavioral_story_themes!behavioral_story_themes_story_owner_fkey(theme)")
    .eq("id", storyId)
    .eq("user_id", a.user.id)
    .single();
  const before = expectSuccess(await selectEditSnapshot(), "pre-update coherent story edit read failed");
  const beforeThemes = before.behavioral_story_themes.map((item) => item.theme).sort();
  const [concurrentRead, updated] = await Promise.all([
    selectEditSnapshot(),
    a.authClient.rpc("update_behavioral_story_with_themes_if_revision", {
      target_story_id: storyId,
      target_expected_updated_at: priorRevision,
      ...behavioralStoryArgs({
        target_notes: "Coherent edit snapshot after update",
        target_themes: ["Ownership", "Technical judgment"],
      }),
    }),
  ]);
  const updatedRows = expectSuccess(updated, "story update during coherent edit read failed");
  expect(updatedRows.length === 1, `expected one story update row, observed ${updatedRows.length}`);
  const updatedRevision = updatedRows[0].updated_at;
  const readRow = expectSuccess(concurrentRead, "concurrent coherent story edit read failed");
  const readThemes = readRow.behavioral_story_themes.map((item) => item.theme).sort();
  if (readRow.updated_at === priorRevision) {
    expect(readRow.notes === before.notes && JSON.stringify(readThemes) === JSON.stringify(beforeThemes), "pre-update edit read mixed old revision with new story or themes");
  } else {
    expect(readRow.updated_at === updatedRevision && readRow.notes === "Coherent edit snapshot after update" && JSON.stringify(readThemes) === JSON.stringify(["Ownership", "Technical judgment"]), "post-update edit read mixed new revision with old story or themes");
  }
  const finalRead = expectSuccess(await selectEditSnapshot(), "final coherent story edit read failed");
  expect(finalRead.updated_at === updatedRevision && finalRead.notes === "Coherent edit snapshot after update" && JSON.stringify(finalRead.behavioral_story_themes.map((item) => item.theme).sort()) === JSON.stringify(["Ownership", "Technical judgment"]), "final story edit snapshot did not match the committed aggregate");
  fixture.storyRevision = updatedRevision;
  return `concurrent read revision ${readRow.updated_at}; saved revision ${updatedRevision}`;
});

await check("concurrent duplicate captures either complete aggregate snapshot", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const priorRevision = requireFixture(fixture.storyRevision, "story revision");
  const beforeStory = expectSuccess(await a.authClient.from("behavioral_stories").select("notes").eq("id", storyId).single(), "pre-duplicate story read failed");
  const beforeThemes = expectSuccess(await a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", storyId).order("theme"), "pre-duplicate themes read failed");
  const [updated, duplicated] = await Promise.all([
    a.authClient.rpc("update_behavioral_story_with_themes_if_revision", {
      target_story_id: storyId,
      target_expected_updated_at: priorRevision,
      ...behavioralStoryArgs({ target_notes: "Concurrent duplicate new snapshot", target_themes: ["Mentorship"] }),
    }),
    a.authClient.rpc("duplicate_behavioral_story_with_themes", { target_story_id: storyId }),
  ]);
  const updatedRows = expectSuccess(updated, "concurrent duplicate source update failed");
  const duplicateRows = expectSuccess(duplicated, "concurrent duplicate failed");
  expect(updatedRows.length === 1 && duplicateRows.length === 1, "concurrent update or duplicate returned no aggregate row");
  fixture.storyRevision = updatedRows[0].updated_at;
  const copyId = duplicateRows[0].story_id;
  const [copy, copyThemes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("notes").eq("id", copyId).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", copyId).order("theme"),
  ]);
  const copyStory = expectSuccess(copy, "concurrent duplicate parent read failed");
  const copiedThemes = expectSuccess(copyThemes, "concurrent duplicate theme read failed");
  const copiedBefore = copyStory.notes === beforeStory.notes
    && JSON.stringify(copiedThemes) === JSON.stringify(beforeThemes);
  const copiedAfter = copyStory.notes === "Concurrent duplicate new snapshot"
    && JSON.stringify(copiedThemes) === JSON.stringify([{ theme: "Mentorship" }]);
  expect(copiedBefore || copiedAfter, "duplicate mixed the before/after parent and theme snapshots");
  expectSuccess(await a.authClient.from("behavioral_stories").delete().eq("id", copyId), "concurrent duplicate cleanup failed");
  return copiedBefore ? "complete pre-update snapshot" : "complete post-update snapshot";
});

await check("invalid aggregate themes roll back both parent and theme changes", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const before = expectSuccess(await a.authClient.from("behavioral_stories").select("notes,updated_at").eq("id", storyId).single(), "pre-rollback story read failed");
  const invalid = await a.authClient.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: storyId,
    target_expected_updated_at: before.updated_at,
    ...behavioralStoryArgs({ target_notes: "Must roll back", target_themes: ["Unsupported theme"] }),
  });
  expectSqlError(invalid, "23514");
  const [story, themes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("notes,updated_at").eq("id", storyId).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", storyId).order("theme"),
  ]);
  expect(JSON.stringify(expectSuccess(story, "rollback story read failed")) === JSON.stringify(before), "invalid themes changed the parent snapshot");
  expect(expectSuccess(themes, "rollback theme read failed").length === 1, "invalid themes changed the prior theme snapshot");
  return "SQLSTATE 23514; prior aggregate intact";
});

await check("atomic duplicate copies one owned parent and theme snapshot", async () => {
  const sourceId = requireFixture(fixture.storyId, "story");
  const duplicated = await a.authClient.rpc("duplicate_behavioral_story_with_themes", { target_story_id: sourceId });
  const rows = expectSuccess(duplicated, "story aggregate duplicate failed");
  expect(rows.length === 1, `expected one duplicate row, observed ${rows.length}`);
  const [source, copy, sourceThemes, copyThemes] = await Promise.all([
    a.authClient.from("behavioral_stories").select("company_or_context,role,approximate_period,project,situation,task,action,result,reflection,short_summary,notes").eq("id", sourceId).single(),
    a.authClient.from("behavioral_stories").select("title,company_or_context,role,approximate_period,project,situation,task,action,result,reflection,short_summary,notes").eq("id", rows[0].story_id).single(),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", sourceId).order("theme"),
    a.authClient.from("behavioral_story_themes").select("theme").eq("story_id", rows[0].story_id).order("theme"),
  ]);
  const sourceRow = expectSuccess(source, "source story snapshot read failed");
  const copyRow = expectSuccess(copy, "duplicate story snapshot read failed");
  const { title, ...copyWithoutTitle } = copyRow;
  expect(title.endsWith(" (copy)"), "duplicate title lacks the copy suffix");
  expect(JSON.stringify(copyWithoutTitle) === JSON.stringify(sourceRow), "duplicate parent is not the source snapshot");
  expect(JSON.stringify(expectSuccess(copyThemes, "duplicate themes read failed")) === JSON.stringify(expectSuccess(sourceThemes, "source themes read failed")), "duplicate themes are not the source snapshot");
  expectSuccess(await a.authClient.from("behavioral_stories").delete().eq("id", rows[0].story_id), "duplicate cleanup failed");
  return rows[0].story_id;
});

await check("User A maps one story to multiple curated and custom questions", async () => {
  const insertion = await a.authClient
    .from("behavioral_story_question_links")
    .insert([
      { user_id: a.user.id, story_id: requireFixture(fixture.storyId, "story"), curated_question_id: "beh-lead-01" },
      { user_id: a.user.id, story_id: requireFixture(fixture.storyId, "story"), curated_question_id: "beh-tech-01" },
      { user_id: a.user.id, story_id: requireFixture(fixture.storyId, "story"), custom_question_id: requireFixture(fixture.customQuestionId, "custom question") },
    ])
    .select("id,curated_question_id,custom_question_id");
  const rows = expectSuccess(insertion, "story/question mapping failed");
  expect(rows.length === 3, `expected 3 mappings, observed ${rows.length}`);
  fixture.storyLinkId = rows[0].id;
  return "2 curated + 1 custom";
});

await check("duplicate story and question mapping is rejected", async () => {
  const insertion = await a.authClient.from("behavioral_story_question_links").insert({
    user_id: a.user.id,
    story_id: requireFixture(fixture.storyId, "story"),
    curated_question_id: "beh-lead-01",
  });
  return expectSqlError(insertion, "23505");
});

await check("answer preparation creates its canonical story mapping", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const removed = await a.authClient
    .from("behavioral_story_question_links")
    .delete()
    .eq("story_id", storyId)
    .eq("curated_question_id", "beh-tech-01");
  expectSuccess(removed, "preparation mapping setup failed");
  const answer = await a.authClient.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_curated_question_id: "beh-tech-01",
    target_story_id: storyId,
    target_title: "Phase 5A qualification automatic mapping",
  }));
  const rows = expectSuccess(answer, "automatic mapping preparation failed");
  expect(rows.length === 1, `expected one automatic mapping answer, observed ${rows.length}`);
  const mapping = await a.authClient.from("behavioral_story_question_links").select("id").eq("story_id", storyId).eq("curated_question_id", "beh-tech-01").single();
  expectSuccess(mapping, "answer preparation did not create the canonical story mapping");
  const cleanup = await a.authClient.from("behavioral_answers").delete().eq("id", rows[0].answer_id);
  expectSuccess(cleanup, "automatic mapping answer cleanup failed");
});

await check("User A saves application-specific question notes without a full draft", async () => {
  const insertion = await a.authClient.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_story_id: requireFixture(fixture.storyId, "story"),
    target_application_id: requireFixture(fixture.applicationId, "application"),
    target_company_slug: "amazon",
    target_title: "Phase 5A qualification primary preparation",
    target_opening_framing: "Frame the ambiguous decision.",
    target_details_to_emphasize: "Emphasize the reversible scope decision.",
    target_details_to_avoid: "Avoid confidential launch details.",
    target_notes: "Private preparation note.",
    target_make_primary: true,
  }));
  const rows = expectSuccess(insertion, "question preparation insertion failed");
  expect(rows.length === 1, `expected one question preparation row, observed ${rows.length}`);
  const read = await a.authClient.from("behavioral_answers").select("id,answer_text,notes,is_primary").eq("id", rows[0].answer_id).single();
  const row = expectSuccess(read, "question preparation read failed");
  expect(row.answer_text === "" && row.notes === "Private preparation note.", "optional full draft or notes did not round-trip");
  expect(row.is_primary === true, "aggregate create did not persist desired primary state");
  fixture.answerId = row.id;
  return row.id;
});

await check("legacy primary-only mutation fails without changing the aggregate", async () => {
  const result = await a.authClient.rpc("set_behavioral_primary_answer", {
    target_answer_id: requireFixture(fixture.answerId, "answer"),
    make_primary: false,
  });
  expectSqlError(result, "0A000");
  const read = await a.authClient.from("behavioral_answers").select("is_primary").eq("id", fixture.answerId).single();
  const row = expectSuccess(read, "primary answer lookup failed");
  expect(row.is_primary === true, "legacy primary mutation changed the answer");
  return "SQLSTATE 0A000; primary unchanged";
});

await check("concurrent full Behavioral answer saves accept one revision and preserve the winner", async () => {
  const created = expectSuccess(await a.authClient.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_curated_question_id: "beh-lead-02",
    target_story_id: requireFixture(fixture.storyId, "story"),
    target_title: "Phase 5A qualification concurrent answer baseline",
    target_answer_text: "Concurrent baseline answer.",
  })), "concurrent answer fixture failed");
  expect(created.length === 1, `expected one concurrent answer fixture, observed ${created.length}`);
  const answerId = created[0].answer_id;
  const before = { updated_at: created[0].updated_at };
  const attempts = await Promise.all(["A", "B"].map((label) => a.authClient.rpc(
    "update_behavioral_answer_aggregate_if_revision",
    {
      target_answer_id: answerId,
      target_expected_updated_at: before.updated_at,
      ...behavioralAnswerArgs({
        target_curated_question_id: "beh-lead-02",
        target_story_id: requireFixture(fixture.storyId, "story"),
        target_title: `Phase 5A qualification concurrent answer ${label}`,
        target_answer_text: `Concurrent full answer ${label}.`,
        target_opening_framing: `Concurrent opening ${label}.`,
        target_details_to_emphasize: `Concurrent emphasis ${label}.`,
        target_details_to_avoid: `Concurrent avoid ${label}.`,
        target_notes: `Concurrent private note ${label}.`,
        target_status: "Needs Work",
        target_make_primary: true,
      }),
    },
  )));
  for (const attempt of attempts) expect(!attempt.error, attempt.error?.message ?? "concurrent answer update failed");
  const winners = attempts.filter((attempt) => attempt.data?.length === 1);
  const conflicts = attempts.filter((attempt) => attempt.data?.length === 0);
  expect(winners.length === 1 && conflicts.length === 1, `expected one winner and one conflict, observed ${winners.length}/${conflicts.length}`);
  const winner = winners[0].data[0];
  const saved = expectSuccess(
    await a.authClient.from("behavioral_answers").select("title,answer_text,opening_framing,details_to_emphasize,details_to_avoid,notes,status,is_primary,updated_at").eq("id", answerId).single(),
    "concurrent answer winner lookup failed",
  );
  const label = saved.title.endsWith(" A") ? "A" : "B";
  expect(saved.title === `Phase 5A qualification concurrent answer ${label}`, "answer title did not retain the winning snapshot");
  expect(saved.answer_text === `Concurrent full answer ${label}.`, "answer body mixed concurrent snapshots");
  expect(saved.opening_framing === `Concurrent opening ${label}.`, "opening framing mixed concurrent snapshots");
  expect(saved.details_to_emphasize === `Concurrent emphasis ${label}.`, "emphasis mixed concurrent snapshots");
  expect(saved.details_to_avoid === `Concurrent avoid ${label}.`, "avoidance notes mixed concurrent snapshots");
  expect(saved.notes === `Concurrent private note ${label}.` && saved.status === "Needs Work" && saved.is_primary, "winner fields or primary state were not coherent");
  expect(saved.updated_at === winner.updated_at && saved.updated_at > before.updated_at, "winning answer revision did not advance exactly");
  return `winner ${label}; one zero-row conflict; revision ${saved.updated_at}`;
});

await check("competing Behavioral primary saves serialize to one desired primary", async () => {
  const firstId = requireFixture(fixture.answerId, "answer");
  const secondCreated = expectSuccess(await a.authClient.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_story_id: requireFixture(fixture.storyId, "story"),
    target_title: "Phase 5A qualification competing primary",
    target_answer_text: "Competing primary answer.",
  })), "competing primary fixture failed");
  expect(secondCreated.length === 1, `expected one competing answer, observed ${secondCreated.length}`);
  const secondId = secondCreated[0].answer_id;
  const [firstBefore, secondBefore] = await Promise.all([
    a.authClient.from("behavioral_answers").select("updated_at,title,answer_text,story_id,application_id,company_slug,opening_framing,details_to_emphasize,details_to_avoid,notes,status").eq("id", firstId).single(),
    a.authClient.from("behavioral_answers").select("updated_at,title,answer_text,story_id,application_id,company_slug,opening_framing,details_to_emphasize,details_to_avoid,notes,status").eq("id", secondId).single(),
  ]);
  const first = expectSuccess(firstBefore, "first competing answer lookup failed");
  const second = expectSuccess(secondBefore, "second competing answer lookup failed");
  const [firstSave, secondSave] = await Promise.all([
    a.authClient.rpc("update_behavioral_answer_aggregate_if_revision", {
      target_answer_id: firstId,
      target_expected_updated_at: first.updated_at,
      ...behavioralAnswerArgs({
        target_story_id: first.story_id,
        target_application_id: first.application_id,
        target_company_slug: first.company_slug,
        target_title: first.title,
        target_answer_text: first.answer_text,
        target_opening_framing: first.opening_framing,
        target_details_to_emphasize: first.details_to_emphasize,
        target_details_to_avoid: first.details_to_avoid,
        target_notes: first.notes,
        target_status: first.status,
        target_make_primary: true,
      }),
    }),
    a.authClient.rpc("update_behavioral_answer_aggregate_if_revision", {
      target_answer_id: secondId,
      target_expected_updated_at: second.updated_at,
      ...behavioralAnswerArgs({
        target_story_id: second.story_id,
        target_application_id: second.application_id,
        target_company_slug: second.company_slug,
        target_title: second.title,
        target_answer_text: second.answer_text,
        target_opening_framing: second.opening_framing,
        target_details_to_emphasize: second.details_to_emphasize,
        target_details_to_avoid: second.details_to_avoid,
        target_notes: second.notes,
        target_status: second.status,
        target_make_primary: true,
      }),
    }),
  ]);
  expect(!firstSave.error && !secondSave.error, firstSave.error?.message ?? secondSave.error?.message ?? "competing primary save failed");
  expect(secondSave.data?.length === 1, "the serialized second primary intent did not save");
  const primaries = expectSuccess(
    await a.authClient.from("behavioral_answers").select("id").eq("curated_question_id", "beh-lead-01").eq("is_primary", true),
    "primary uniqueness lookup failed",
  );
  expect(primaries.length === 1 && primaries[0].id === secondId, "competing primary saves did not end with one serialized desired primary");
  return `${firstSave.data?.length ?? 0}/${secondSave.data.length} rows; final primary ${secondId}`;
});

await check("invalid Behavioral aggregate input rolls back before changing the primary", async () => {
  const primaryBefore = expectSuccess(
    await a.authClient.from("behavioral_answers").select("id,updated_at").eq("curated_question_id", "beh-lead-01").eq("is_primary", true).single(),
    "primary rollback baseline failed",
  );
  const rejected = await a.authClient.rpc("create_behavioral_answer_aggregate", behavioralAnswerArgs({
    target_story_id: requireFixture(fixture.storyId, "story"),
    target_title: "x".repeat(201),
    target_make_primary: true,
  }));
  expectSqlError(rejected, "23514");
  const primaryAfter = expectSuccess(
    await a.authClient.from("behavioral_answers").select("id,updated_at").eq("curated_question_id", "beh-lead-01").eq("is_primary", true).single(),
    "primary rollback verification failed",
  );
  expect(JSON.stringify(primaryAfter) === JSON.stringify(primaryBefore), "rejected aggregate input changed the primary answer");
  return "SQLSTATE 23514; primary id and revision unchanged";
});

await check("preparation-backed story mapping cannot be unlinked", async () => {
  const deletion = await a.authClient
    .from("behavioral_story_question_links")
    .delete()
    .eq("story_id", requireFixture(fixture.storyId, "story"))
    .eq("curated_question_id", "beh-lead-01")
    .select("id");
  return expectSqlError(deletion, "23503");
});

await check("User A saves curated and custom behavioral questions", async () => {
  const insertion = await a.authClient
    .from("behavioral_saved_questions")
    .insert([
      { user_id: a.user.id, curated_question_id: "beh-conflict-01" },
      { user_id: a.user.id, custom_question_id: requireFixture(fixture.customQuestionId, "custom question") },
    ])
    .select("id,custom_question_id,curated_question_id");
  const rows = expectSuccess(insertion, "saved-question insertion failed");
  expect(rows.length === 2, `expected 2 saved questions, observed ${rows.length}`);
  fixture.curatedSavedQuestionId = rows.find((row) => row.curated_question_id)?.id ?? null;
  fixture.customSavedQuestionId = rows.find((row) => row.custom_question_id)?.id ?? null;
  expect(fixture.curatedSavedQuestionId && fixture.customSavedQuestionId, "saved-question variants did not round-trip");
});

await check("User A reads and updates their custom behavioral question", async () => {
  const customQuestionId = requireFixture(fixture.customQuestionId, "custom question");
  const update = await a.authClient
    .from("behavioral_custom_questions")
    .update({ notes: "Owner-edited qualification note." })
    .eq("id", customQuestionId)
    .select("id,notes")
    .single();
  const row = expectSuccess(update, "custom question update failed");
  expect(row.notes === "Owner-edited qualification note.", "custom question update did not persist");

  const savedRead = await a.authClient.from("behavioral_saved_questions").select("id");
  const savedRows = expectSuccess(savedRead, "saved-question read failed");
  expect(savedRows.length === 2, `expected 2 owned saved questions, observed ${savedRows.length}`);
});

await check("User B cannot read User A behavioral records", async () => {
  const customRead = await b.authClient.from("behavioral_custom_questions").select("id").eq("id", requireFixture(fixture.customQuestionId, "custom question"));
  expectInvisible(customRead, "custom question");
  const storyRead = await b.authClient.from("behavioral_stories").select("id").eq("id", requireFixture(fixture.storyId, "story"));
  expectInvisible(storyRead, "story");
  const themeRead = await b.authClient
    .from("behavioral_story_themes")
    .select("id")
    .eq("story_id", fixture.storyId);
  expectInvisible(themeRead, "story themes");
  const savedRead = await b.authClient.from("behavioral_saved_questions").select("id").eq("user_id", a.user.id);
  expectInvisible(savedRead, "saved question");
  const linkRead = await b.authClient.from("behavioral_story_question_links").select("id").eq("story_id", fixture.storyId);
  expectInvisible(linkRead, "story links");
  const answerRead = await b.authClient.from("behavioral_answers").select("id,notes").eq("id", requireFixture(fixture.answerId, "answer"));
  expectInvisible(answerRead, "answer notes");
  return "0 custom, story, theme, mapping, answer, or saved-question rows";
});

await check("User B cannot update or delete User A behavioral records", async () => {
  const customQuestionId = requireFixture(fixture.customQuestionId, "custom question");
  const storyId = requireFixture(fixture.storyId, "story");
  const savedId = requireFixture(fixture.curatedSavedQuestionId, "curated saved question");
  expectInvisible(
    await b.authClient.from("behavioral_custom_questions").update({ notes: "Intrusion" }).eq("id", customQuestionId).select("id"),
    "custom-question update",
  );
  expectInvisible(
    await b.authClient.from("behavioral_custom_questions").delete().eq("id", customQuestionId).select("id"),
    "custom-question deletion",
  );
  expectSqlError(
    await b.authClient.from("behavioral_stories").update({ title: "Cross-user mutation" }).eq("id", storyId).select("id"),
    "42501",
  );
  expectInvisible(
    await b.authClient.from("behavioral_stories").delete().eq("id", storyId).select("id"),
    "story deletion",
  );
  const savedUpdate = await b.authClient
    .from("behavioral_saved_questions")
    .update({ curated_question_id: "beh-phase5a-qualification-intrusion" })
    .eq("id", savedId);
  expectSqlError(savedUpdate, "42501");
  expectInvisible(
    await b.authClient.from("behavioral_saved_questions").delete().eq("id", savedId).select("id"),
    "saved-question deletion",
  );
  return "all mutations affected 0 rows";
});

await check("User B cannot map User A story or use the retired primary-only mutation", async () => {
  const mapping = await b.authClient.from("behavioral_story_question_links").insert({
    user_id: b.user.id,
    story_id: requireFixture(fixture.storyId, "story"),
    curated_question_id: "beh-own-01",
  });
  expectSqlError(mapping, ["23503", "42501"]);
  const primary = await b.authClient.rpc("set_behavioral_primary_answer", {
    target_answer_id: requireFixture(fixture.answerId, "answer"),
    make_primary: true,
  });
  expectSqlError(primary, "0A000");
  return "mapping rejected; legacy primary RPC returned SQLSTATE 0A000";
});

await check("User B cannot attach preparation to User A application", async () => {
  const insertion = await b.authClient.from("behavioral_answers").insert({
    user_id: b.user.id,
    curated_question_id: "beh-own-01",
    application_id: requireFixture(fixture.applicationId, "application"),
    title: "Phase 5A qualification forged application preparation",
  });
  return expectSqlError(insertion, ["23503", "42501"]);
});

await check("User B cannot save User A custom question", async () => {
  const insertion = await b.authClient.from("behavioral_saved_questions").insert({
    user_id: b.user.id,
    custom_question_id: requireFixture(fixture.customQuestionId, "custom question"),
  });
  return expectSqlError(insertion, ["23503", "42501"]);
});

await check("User B cannot attach a theme to User A story", async () => {
  const insertion = await b.authClient.from("behavioral_story_themes").insert({
    user_id: b.user.id,
    story_id: requireFixture(fixture.storyId, "story"),
    theme: "Collaboration",
  });
  return expectSqlError(insertion, ["23503", "42501"]);
});

await check("authenticated legacy theme replacement fails without mutation", async () => {
  const replacement = await b.authClient.rpc("replace_behavioral_story_themes", {
    target_story_id: requireFixture(fixture.storyId, "story"),
    theme_values: ["Collaboration"],
  });
  return expectSqlError(replacement, "0A000");
});

await check("foreign and missing story duplicates are indistinguishable", async () => {
  const foreign = await b.authClient.rpc("duplicate_behavioral_story_with_themes", {
    target_story_id: requireFixture(fixture.storyId, "story"),
  });
  const missing = await b.authClient.rpc("duplicate_behavioral_story_with_themes", {
    target_story_id: crypto.randomUUID(),
  });
  expect(!foreign.error && !missing.error, foreign.error?.message ?? missing.error?.message ?? "duplicate lookup failed");
  expect(JSON.stringify(foreign.data) === JSON.stringify([]), "foreign story duplicate exposed a result");
  expect(JSON.stringify(missing.data) === JSON.stringify([]), "missing story duplicate exposed a result");
  return "both returned zero rows";
});

await check("behavioral story insert rejects client-assigned generated IDs", async () => {
  const insertion = await a.authClient.from("behavioral_stories").insert({
    id: crypto.randomUUID(),
    user_id: a.user.id,
    title: "Phase 5A qualification mass assignment",
  });
  return expectSqlError(insertion, "42501");
});

await check("invalid behavioral status is rejected", async () => {
  const update = await a.authClient
    .from("behavioral_stories")
    .update({ status: "Published" })
    .eq("id", requireFixture(fixture.storyId, "story"));
  return expectSqlError(update, "42501");
});

await check("saved question requires exactly one supported question kind", async () => {
  const insertion = await a.authClient.from("behavioral_saved_questions").insert({
    user_id: a.user.id,
    custom_question_id: requireFixture(fixture.customQuestionId, "custom question"),
    curated_question_id: "beh-phase5a-qualification-invalid-pair",
  });
  return expectSqlError(insertion, "23514");
});

await check("saved question rejects invalid curated identifiers", async () => {
  const insertion = await a.authClient.from("behavioral_saved_questions").insert({
    user_id: a.user.id,
    curated_question_id: "invalid key",
  });
  return expectSqlError(insertion, "23514");
});

await check("User A creates and reads preparation preferences", async () => {
  const insertion = await a.authClient
    .from("user_preparation_preferences")
    .insert({
      user_id: a.user.id,
      dsa_level: "sde2",
      dsa_plan_id: "60d",
      dsa_company_slug: fixturePrefix,
      dsa_preferred_language_slug: "python",
      dsa_interview_date: "2026-09-15",
      system_design_level: "sde2",
      system_design_preparation_window: "2-weeks",
      system_design_role: "backend",
      system_design_minutes_per_day: 60,
    })
    .select("user_id,dsa_level,dsa_plan_id,system_design_level,system_design_preparation_window")
    .single();
  const row = expectSuccess(insertion, "preference insertion failed");
  expect(row.user_id === a.user.id && row.dsa_level === "sde2" && row.system_design_level === "sde2", "preferences did not round-trip");
});

await check("User A updates their preparation preferences", async () => {
  const update = await a.authClient
    .from("user_preparation_preferences")
    .update({ dsa_plan_id: "30d", system_design_preparation_window: "1-week" })
    .eq("user_id", a.user.id)
    .select("dsa_plan_id,system_design_preparation_window")
    .single();
  const row = expectSuccess(update, "preference update failed");
  expect(row.dsa_plan_id === "30d" && row.system_design_preparation_window === "1-week", "preference update did not persist");
});

await check("User B cannot read, update, or delete User A preferences", async () => {
  expectInvisible(
    await b.authClient.from("user_preparation_preferences").select("user_id").eq("user_id", a.user.id),
    "preference read",
  );
  expectInvisible(
    await b.authClient.from("user_preparation_preferences").update({ dsa_level: "sde1" }).eq("user_id", a.user.id).select("user_id"),
    "preference update",
  );
  expectInvisible(
    await b.authClient.from("user_preparation_preferences").delete().eq("user_id", a.user.id).select("user_id"),
    "preference deletion",
  );
  return "all operations exposed or affected 0 rows";
});

await check("User B cannot forge User A preference ownership", async () => {
  const insertion = await b.authClient.from("user_preparation_preferences").insert({
    user_id: a.user.id,
    dsa_level: "sde1",
  });
  return expectSqlError(insertion, "42501");
});

await check("preference insert rejects timestamp mass assignment", async () => {
  const insertion = await b.authClient.from("user_preparation_preferences").insert({
    user_id: b.user.id,
    dsa_level: "sde1",
    dsa_company_slug: fixturePrefix,
    created_at: new Date().toISOString(),
  });
  return expectSqlError(insertion, "42501");
});

await check("invalid preparation preference enum is rejected", async () => {
  const update = await a.authClient
    .from("user_preparation_preferences")
    .update({ dsa_level: "principal" })
    .eq("user_id", a.user.id);
  return expectSqlError(update, "23514");
});

await check("local-import marker rejects direct mass assignment", async () => {
  const update = await a.authClient
    .from("user_preparation_preferences")
    .update({ local_system_design_import_version: 1 })
    .eq("user_id", a.user.id);
  return expectSqlError(update, "42501");
});

await check("record_local_system_design_import writes a paired owner marker", async () => {
  const recording = await a.authClient.rpc("record_local_system_design_import", { import_version: 2 });
  expect(!recording.error && recording.data === true, recording.error?.message ?? "local import recording returned false");
  const read = await a.authClient
    .from("user_preparation_preferences")
    .select("local_system_design_import_version,local_system_design_imported_at")
    .eq("user_id", a.user.id)
    .single();
  const row = expectSuccess(read, "local import marker lookup failed");
  expect(row.local_system_design_import_version === 2 && row.local_system_design_imported_at, "RPC did not write a consistent version/timestamp pair");
  return "version 2 with server timestamp";
});

await check("local-import RPC is idempotent and rejects version downgrade", async () => {
  const before = await a.authClient
    .from("user_preparation_preferences")
    .select("local_system_design_imported_at")
    .eq("user_id", a.user.id)
    .single();
  const beforeRow = expectSuccess(before, "import marker lookup failed");

  const repeat = await a.authClient.rpc("record_local_system_design_import", { import_version: 2 });
  expect(!repeat.error && repeat.data === true, repeat.error?.message ?? "equal-version replay returned false");
  const downgrade = await a.authClient.rpc("record_local_system_design_import", { import_version: 1 });
  expect(!downgrade.error && downgrade.data === false, downgrade.error?.message ?? "version downgrade unexpectedly succeeded");

  const after = await a.authClient
    .from("user_preparation_preferences")
    .select("local_system_design_import_version,local_system_design_imported_at")
    .eq("user_id", a.user.id)
    .single();
  const afterRow = expectSuccess(after, "post-replay import marker lookup failed");
  expect(afterRow.local_system_design_import_version === 2, "downgrade changed the import version");
  expect(afterRow.local_system_design_imported_at === beforeRow.local_system_design_imported_at, "idempotent replay rewrote the server timestamp");
  return "equal replay preserved timestamp; downgrade returned false";
});

await check("User A creates each representative DSA progress kind", async () => {
  const insertion = await a.authClient
    .from("dsa_progress")
    .insert([
      { user_id: a.user.id, item_kind: "problem", item_id: `${fixturePrefix}:two-sum`, status: "attempted" },
      { user_id: a.user.id, item_kind: "roadmap-task", item_id: `${fixturePrefix}:arrays`, status: "in-progress" },
      { user_id: a.user.id, item_kind: "mixed-set", item_id: `${fixturePrefix}:mixed-1`, status: "attempted" },
      { user_id: a.user.id, item_kind: "timed-practice", item_id: `${fixturePrefix}:timed-1`, status: "attempted" },
    ])
    .select("item_kind,item_id,status");
  const rows = expectSuccess(insertion, "DSA progress insertion failed");
  expect(rows.length === 4, `expected 4 DSA rows, observed ${rows.length}`);
});

await check("User A updates and reads DSA progress", async () => {
  const itemId = `${fixturePrefix}:two-sum`;
  const update = await a.authClient
    .from("dsa_progress")
    .update({ status: "solved" })
    .eq("item_kind", "problem")
    .eq("item_id", itemId)
    .select("status")
    .single();
  const row = expectSuccess(update, "DSA progress update failed");
  expect(row.status === "solved", "DSA status did not persist");
});

await check("User B cannot read, update, or delete User A DSA progress", async () => {
  expectInvisible(
    await b.authClient.from("dsa_progress").select("item_id").like("item_id", `${fixturePrefix}:%`),
    "DSA progress read",
  );
  expectInvisible(
    await b.authClient.from("dsa_progress").update({ status: "comfortable" }).eq("item_kind", "problem").eq("item_id", `${fixturePrefix}:two-sum`).select("item_id"),
    "DSA progress update",
  );
  expectInvisible(
    await b.authClient.from("dsa_progress").delete().eq("item_kind", "roadmap-task").eq("item_id", `${fixturePrefix}:arrays`).select("item_id"),
    "DSA progress deletion",
  );
  return "all operations exposed or affected 0 rows";
});

await check("User B cannot forge User A DSA progress ownership", async () => {
  const insertion = await b.authClient.from("dsa_progress").insert({
    user_id: a.user.id,
    item_kind: "problem",
    item_id: `${fixturePrefix}:forged`,
    status: "attempted",
  });
  return expectSqlError(insertion, "42501");
});

await check("DSA progress rejects invalid item kinds", async () => {
  const insertion = await a.authClient.from("dsa_progress").insert({
    user_id: a.user.id,
    item_kind: "quiz",
    item_id: `${fixturePrefix}:bad-kind`,
    status: "attempted",
  });
  return expectSqlError(insertion, "23514");
});

await check("DSA progress rejects invalid kind/status pairs", async () => {
  const insertion = await a.authClient.from("dsa_progress").insert({
    user_id: a.user.id,
    item_kind: "problem",
    item_id: `${fixturePrefix}:bad-status`,
    status: "completed",
  });
  return expectSqlError(insertion, "23514");
});

await check("DSA progress rejects oversized item identifiers", async () => {
  const oversizedItemId = `${fixturePrefix}:${"a".repeat(201 - fixturePrefix.length - 1)}`;
  const insertion = await a.authClient.from("dsa_progress").insert({
    user_id: a.user.id,
    item_kind: "problem",
    item_id: oversizedItemId,
    status: "attempted",
  });
  return expectSqlError(insertion, "23514");
});

await check("DSA progress insert rejects timestamp mass assignment", async () => {
  const insertion = await a.authClient.from("dsa_progress").insert({
    user_id: a.user.id,
    item_kind: "problem",
    item_id: `${fixturePrefix}:mass-assignment`,
    status: "attempted",
    created_at: new Date().toISOString(),
  });
  return expectSqlError(insertion, "42501");
});

await check("User A saves canonical question progress through the authoritative RPC", async () => {
  const saved = await saveDsaProgress(a.authClient, {
    questionId: "two-sum",
    status: "attempted",
    confidence: "medium",
    bookmarked: true,
    notes: "Used a hash map; explain the complement invariant.",
  });
  const rows = expectSuccess(saved, "canonical DSA progress RPC failed");
  expect(rows.length === 1 && rows[0].question_id === "two-sum" && rows[0].updated_at, "canonical DSA save did not return its bounded revision result");
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,bookmarked,first_attempted_at,last_practiced_at,solved_at").eq("question_id", "two-sum").single(), "canonical DSA state lookup failed");
  expect(row.status === "attempted" && row.bookmarked, "canonical DSA state did not persist");
  expect(row.first_attempted_at && row.last_practiced_at && !row.solved_at, "attempt timestamps are inconsistent");
});

await check("bookmark-only DSA updates do not move last practiced", async () => {
  const before = expectSuccess(await a.authClient.from("dsa_question_progress").select("last_practiced_at").eq("question_id", "two-sum").single(), "pre-update DSA lookup failed");
  const saved = await saveDsaProgress(a.authClient, {
    questionId: "two-sum",
    status: "attempted",
    confidence: "medium",
    bookmarked: false,
    notes: "Used a hash map; explain the complement invariant.",
  });
  expect(expectSuccess(saved, "bookmark update failed").length === 1, "bookmark update did not return one revision result");
  const after = expectSuccess(await a.authClient.from("dsa_question_progress").select("last_practiced_at").eq("question_id", "two-sum").single(), "post-update DSA lookup failed");
  expect(after.last_practiced_at === before.last_practiced_at, "bookmark-only update changed last practiced");
});

await check("fake canonical DSA question IDs are rejected", async () => {
  const saved = await saveDsaProgress(a.authClient, {
    questionId: `${fixturePrefix}-fake`, status: "attempted", confidence: "low", bookmarked: false, notes: null,
  }, null);
  return expectSqlError(saved, "23503");
});

await check("User B cannot see or delete User A canonical DSA progress", async () => {
  expectInvisible(await b.authClient.from("dsa_question_progress").select("question_id").eq("question_id", "two-sum"), "canonical DSA progress read");
  expectInvisible(await b.authClient.from("dsa_question_progress").delete().eq("question_id", "two-sum").select("question_id"), "canonical DSA progress deletion");
  return "read and delete exposed 0 rows";
});

await check("User B keeps an independent canonical DSA record", async () => {
  const saved = await saveDsaProgress(b.authClient, {
    questionId: "longest-substring-without-repeating-characters",
    status: "attempted",
    confidence: "low",
    bookmarked: true,
    notes: "Track the left boundary carefully.",
  });
  const rows = expectSuccess(saved, "User B canonical DSA progress failed");
  expect(rows.length === 1 && rows[0].question_id === "longest-substring-without-repeating-characters", "User B progress did not stay independent");
});

await check("concurrent atomic DSA status and bookmark updates commute on an absent row", async () => {
  const [statusResult, bookmarkResult] = await Promise.all([
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: "course-schedule",
      target_status: "solved",
      target_bookmarked: null,
    }),
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: "course-schedule",
      target_status: null,
      target_bookmarked: true,
    }),
  ]);
  expect(expectSuccess(statusResult, "atomic DSA status update failed") === "course-schedule", "atomic DSA status update returned the wrong question");
  expect(expectSuccess(bookmarkResult, "atomic DSA bookmark update failed") === "course-schedule", "atomic DSA bookmark update returned the wrong question");
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,confidence,bookmarked,notes,first_attempted_at,last_practiced_at,solved_at").eq("question_id", "course-schedule").single(), "concurrent absent-row DSA read failed");
  expect(row.status === "solved" && row.bookmarked === true, "concurrent absent-row updates did not preserve both desired states");
  expect(row.confidence === null && row.notes === null, "quick updates populated unrelated progress fields");
  expect(row.first_attempted_at && row.last_practiced_at && row.solved_at, "solved quick progress has inconsistent timestamps");
  return "solved and bookmarked; unrelated fields untouched";
});

await check("concurrent atomic DSA updates preserve an existing full-editor snapshot", async () => {
  expectSuccess(await saveDsaProgress(a.authClient, {
    questionId: "group-anagrams",
    status: "attempted",
    confidence: "high",
    bookmarked: false,
    notes: "Fresh private note from the full editor.",
  }), "existing DSA snapshot setup failed");
  const [statusResult, bookmarkResult] = await Promise.all([
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: "group-anagrams",
      target_status: "review",
      target_bookmarked: null,
    }),
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: "group-anagrams",
      target_status: null,
      target_bookmarked: true,
    }),
  ]);
  expect(expectSuccess(statusResult, "existing-row atomic status update failed") === "group-anagrams", "existing-row status update returned the wrong question");
  expect(expectSuccess(bookmarkResult, "existing-row atomic bookmark update failed") === "group-anagrams", "existing-row bookmark update returned the wrong question");
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("question_id", "group-anagrams").single(), "existing-row atomic DSA read failed");
  expect(row.status === "review" && row.bookmarked === true, "concurrent existing-row updates lost a desired state");
  expect(row.confidence === "high" && row.notes === "Fresh private note from the full editor.", "a quick update overwrote the full-editor confidence or private note");
  return "review and bookmarked; confidence and private note preserved";
});

await check("concurrent revision-checked DSA full saves accept exactly one coherent snapshot", async () => {
  const questionId = "subarray-sum-equals-k";
  expectSuccess(await saveDsaProgress(a.authClient, {
    questionId, status: "attempted", confidence: "low", bookmarked: false, notes: "Original full-editor snapshot.",
  }), "concurrent full-save setup failed");
  const revision = await currentDsaProgressRevision(a.authClient, questionId);
  expect(revision, "concurrent full-save setup did not expose a revision");
  const outcomes = await Promise.all([
    saveDsaProgress(a.authClient, {
      questionId, status: "solved", confidence: "high", bookmarked: true, notes: "First coherent full-editor snapshot.",
    }, revision),
    saveDsaProgress(a.authClient, {
      questionId, status: "review", confidence: "medium", bookmarked: false, notes: "Second coherent full-editor snapshot.",
    }, revision),
  ]);
  const savedCounts = outcomes.map((result) => expectSuccess(result, "concurrent full save failed").length).sort();
  expect(JSON.stringify(savedCounts) === JSON.stringify([0, 1]), `expected one full save and one conflict, observed ${JSON.stringify(savedCounts)}`);
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("question_id", questionId).single(), "concurrent full-save result read failed");
  const firstWon = row.status === "solved" && row.confidence === "high" && row.bookmarked === true && row.notes === "First coherent full-editor snapshot.";
  const secondWon = row.status === "review" && row.confidence === "medium" && row.bookmarked === false && row.notes === "Second coherent full-editor snapshot.";
  expect(firstWon || secondWon, "concurrent full saves produced a mixed snapshot");
  return "one saved; one conflict; no mixed fields";
});

await check("concurrent full and quick DSA status writes preserve the quick desired state", async () => {
  const questionId = "product-of-array-except-self";
  expectSuccess(await saveDsaProgress(a.authClient, {
    questionId, status: "attempted", confidence: "low", bookmarked: false, notes: "Original status-race note.",
  }), "full/quick status setup failed");
  const revision = await currentDsaProgressRevision(a.authClient, questionId);
  const [fullResult, quickResult] = await Promise.all([
    saveDsaProgress(a.authClient, {
      questionId, status: "solved", confidence: "high", bookmarked: false, notes: "Fresh full status-race note.",
    }, revision),
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: questionId, target_status: "review", target_bookmarked: null,
    }),
  ]);
  const fullRows = expectSuccess(fullResult, "full side of status race failed");
  expect([0, 1].includes(fullRows.length), "full side of status race returned an invalid cardinality");
  expect(expectSuccess(quickResult, "quick side of status race failed") === questionId, "quick status race returned the wrong question");
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("question_id", questionId).single(), "full/quick status result read failed");
  expect(row.status === "review" && row.bookmarked === false, "a full save displaced the quick desired status");
  const originalRich = row.confidence === "low" && row.notes === "Original status-race note.";
  const fullRich = row.confidence === "high" && row.notes === "Fresh full status-race note.";
  expect(originalRich || fullRich, "full/quick status race produced mixed rich fields");
  return `full returned ${fullRows.length} row(s); quick status preserved`;
});

await check("concurrent full and quick DSA bookmark writes preserve the quick desired state", async () => {
  const questionId = "binary-tree-maximum-path-sum";
  expectSuccess(await saveDsaProgress(a.authClient, {
    questionId, status: "attempted", confidence: "low", bookmarked: false, notes: "Original bookmark-race note.",
  }), "full/quick bookmark setup failed");
  const revision = await currentDsaProgressRevision(a.authClient, questionId);
  const [fullResult, quickResult] = await Promise.all([
    saveDsaProgress(a.authClient, {
      questionId, status: "solved", confidence: "high", bookmarked: false, notes: "Fresh full bookmark-race note.",
    }, revision),
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: questionId, target_status: null, target_bookmarked: true,
    }),
  ]);
  const fullRows = expectSuccess(fullResult, "full side of bookmark race failed");
  expect([0, 1].includes(fullRows.length), "full side of bookmark race returned an invalid cardinality");
  expect(expectSuccess(quickResult, "quick side of bookmark race failed") === questionId, "quick bookmark race returned the wrong question");
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,confidence,bookmarked,notes").eq("question_id", questionId).single(), "full/quick bookmark result read failed");
  expect(row.bookmarked === true, "a full save displaced the quick desired bookmark");
  const originalRich = row.status === "attempted" && row.confidence === "low" && row.notes === "Original bookmark-race note.";
  const fullRich = row.status === "solved" && row.confidence === "high" && row.notes === "Fresh full bookmark-race note.";
  expect(originalRich || fullRich, "full/quick bookmark race produced mixed rich fields");
  return `full returned ${fullRows.length} row(s); quick bookmark preserved`;
});

await check("atomic DSA desired states are idempotent and bookmark false avoids an empty row", async () => {
  const before = expectSuccess(await a.authClient.from("dsa_question_progress").select("updated_at").eq("question_id", "group-anagrams").single(), "atomic idempotence setup read failed");
  const repeated = await Promise.all([
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: "group-anagrams",
      target_status: "review",
      target_bookmarked: null,
    }),
    a.authClient.rpc("set_dsa_question_quick_progress", {
      target_question_id: "group-anagrams",
      target_status: null,
      target_bookmarked: true,
    }),
  ]);
  for (const result of repeated) expectSuccess(result, "repeated atomic DSA update failed");
  const after = expectSuccess(await a.authClient.from("dsa_question_progress").select("updated_at").eq("question_id", "group-anagrams").single(), "atomic idempotence result read failed");
  expect(after.updated_at === before.updated_at, "repeated desired states churned the progress row");
  const removal = await a.authClient.rpc("set_dsa_question_quick_progress", {
    target_question_id: "binary-search",
    target_status: null,
    target_bookmarked: false,
  });
  expect(expectSuccess(removal, "absent bookmark removal failed") === "binary-search", "absent bookmark removal returned the wrong question");
  const absent = expectSuccess(await a.authClient.from("dsa_question_progress").select("question_id").eq("question_id", "binary-search"), "absent bookmark read failed");
  expect(absent.length === 0, "bookmark false created an empty progress row");
  return "no timestamp churn; no empty row";
});

await check("atomic DSA quick progress rejects incomplete, ambiguous, invalid, and fabricated inputs", async () => {
  expectSqlError(await a.authClient.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum", target_status: null, target_bookmarked: null,
  }), "23514");
  expectSqlError(await a.authClient.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum", target_status: "solved", target_bookmarked: true,
  }), "23514");
  expectSqlError(await a.authClient.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum", target_status: "comfortable", target_bookmarked: null,
  }), "23514");
  expectSqlError(await a.authClient.rpc("set_dsa_question_quick_progress", {
    target_question_id: `${fixturePrefix}-fake`, target_status: "solved", target_bookmarked: null,
  }), "23503");
  return "exact-one-field and canonical constraints enforced";
});

await check("atomic DSA quick progress remains owner-scoped", async () => {
  const result = await b.authClient.rpc("set_dsa_question_quick_progress", {
    target_question_id: "group-anagrams",
    target_status: null,
    target_bookmarked: false,
  });
  expect(expectSuccess(result, "User B idempotent quick update failed") === "group-anagrams", "User B quick update returned the wrong question");
  const bRows = expectSuccess(await b.authClient.from("dsa_question_progress").select("question_id").eq("question_id", "group-anagrams"), "User B quick-progress isolation read failed");
  expect(bRows.length === 0, "User B created or observed an owner A row");
  const aRow = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,bookmarked,notes").eq("question_id", "group-anagrams").single(), "User A quick-progress isolation read failed");
  expect(aRow.status === "review" && aRow.bookmarked === true && aRow.notes === "Fresh private note from the full editor.", "User B changed User A quick progress");
  return "User B 0 rows; User A state unchanged";
});

await check("User A creates System Design progress states", async () => {
  const completedAt = new Date().toISOString();
  const insertion = await a.authClient
    .from("system_design_progress")
    .insert([
      { user_id: a.user.id, item_kind: "topic", item_id: `${fixturePrefix}:caching`, status: "in-progress" },
      {
        user_id: a.user.id,
        item_kind: "practice",
        item_id: `${fixturePrefix}:url-shortener`,
        status: "completed",
        completed_at: completedAt,
      },
    ])
    .select("item_kind,item_id,status,completed_at");
  const rows = expectSuccess(insertion, "System Design progress insertion failed");
  expect(rows.length === 2, `expected 2 System Design rows, observed ${rows.length}`);
});

await check("User A updates and reads System Design progress", async () => {
  const completion = new Date().toISOString();
  const update = await a.authClient
    .from("system_design_progress")
    .update({ status: "completed", completed_at: completion, last_interacted_at: completion })
    .eq("item_kind", "topic")
    .eq("item_id", `${fixturePrefix}:caching`)
    .select("status,completed_at,last_interacted_at")
    .single();
  const row = expectSuccess(update, "System Design progress update failed");
  expect(row.status === "completed" && row.completed_at && row.last_interacted_at, "System Design completion did not persist");
});

await check("User B cannot read, update, or delete User A System Design progress", async () => {
  expectInvisible(
    await b.authClient.from("system_design_progress").select("item_id").like("item_id", `${fixturePrefix}:%`),
    "System Design progress read",
  );
  expectInvisible(
    await b.authClient.from("system_design_progress").update({ last_interacted_at: new Date().toISOString() }).eq("item_kind", "topic").eq("item_id", `${fixturePrefix}:caching`).select("item_id"),
    "System Design progress update",
  );
  expectInvisible(
    await b.authClient.from("system_design_progress").delete().eq("item_kind", "practice").eq("item_id", `${fixturePrefix}:url-shortener`).select("item_id"),
    "System Design progress deletion",
  );
  return "all operations exposed or affected 0 rows";
});

await check("User B cannot forge User A System Design progress ownership", async () => {
  const insertion = await b.authClient.from("system_design_progress").insert({
    user_id: a.user.id,
    item_kind: "topic",
    item_id: `${fixturePrefix}:forged-topic`,
    status: "in-progress",
  });
  return expectSqlError(insertion, "42501");
});

await check("System Design progress rejects invalid item kinds", async () => {
  const insertion = await a.authClient.from("system_design_progress").insert({
    user_id: a.user.id,
    item_kind: "video",
    item_id: `${fixturePrefix}:bad-kind`,
    status: "in-progress",
  });
  return expectSqlError(insertion, "23514");
});

await check("System Design progress requires completion metadata to match status", async () => {
  const insertion = await a.authClient.from("system_design_progress").insert({
    user_id: a.user.id,
    item_kind: "topic",
    item_id: `${fixturePrefix}:missing-completion`,
    status: "completed",
    completed_at: null,
  });
  return expectSqlError(insertion, "23514");
});

await check("System Design progress rejects invalid statuses", async () => {
  const insertion = await a.authClient.from("system_design_progress").insert({
    user_id: a.user.id,
    item_kind: "topic",
    item_id: `${fixturePrefix}:bad-status`,
    status: "skipped",
  });
  return expectSqlError(insertion, "23514");
});

await check("System Design progress rejects oversized item identifiers", async () => {
  const oversizedItemId = `${fixturePrefix}:${"a".repeat(201 - fixturePrefix.length - 1)}`;
  const insertion = await a.authClient.from("system_design_progress").insert({
    user_id: a.user.id,
    item_kind: "topic",
    item_id: oversizedItemId,
    status: "in-progress",
  });
  return expectSqlError(insertion, "23514");
});

const systemDesignDocument = {
  functional_requirements: ["Create a short URL", "Resolve a short URL"],
  non_functional_requirements: ["p99 redirects under 100 ms"],
  capacity: {
    assumptions: [{ label: "Daily active users", value: "10M", unit: "users/day" }],
    calculations: [{ label: "Average redirect RPS", formula: "10M × 20 ÷ 86,400", result: "2,315 RPS" }],
  },
  apis: [{ method: "POST", path: "/v1/links", purpose: "Create a short link" }],
  data_models: [{ entity: "Link", fields: "id, destination", notes: "Lookup by id" }],
  high_level_design: "Client to redirect service, cache, and durable link store.",
  deep_dives: ["Key generation"], bottlenecks: ["Hot links"],
  failure_modes: [{ failure: "Cache outage", impact: "Higher database load", mitigation: "Rate-limit cache bypass" }],
  tradeoffs: [{ choice: "Random keys", benefit: "No central sequence", cost: "Collision checks" }],
  follow_ups: ["How would analytics change the design?"], final_review_notes: "State assumptions before arithmetic.",
};

await check("User A saves canonical System Design concept progress through the authoritative RPC", async () => {
  const saved = await saveSystemDesignProgress(a.authClient, {
    itemId: "estimation", itemType: "concept", status: "reviewed",
    confidence: "medium", bookmarked: true, notes: "State assumptions before arithmetic.",
  });
  const rows = expectSuccess(saved, "System Design concept progress save failed");
  expect(rows.length === 1 && rows[0].item_type === "concept" && rows[0].updated_at, "concept progress did not return its canonical identity and revision");
  const row = expectSuccess(await a.authClient.from("system_design_item_progress").select("first_reviewed_at").eq("item_id", "estimation").eq("item_type", "concept").single(), "concept progress read failed");
  expect(row.first_reviewed_at, "concept progress did not persist its first-review timestamp");
});

await check("shared System Design concept and problem IDs remain independent", async () => {
  const concept = expectSuccess(await saveSystemDesignProgress(a.authClient, {
    itemId: "vector-search", itemType: "concept", status: "review",
    confidence: "low", bookmarked: false, notes: "Review ANN index choices.",
  }), "shared concept progress failed");
  const problem = expectSuccess(await saveSystemDesignProgress(a.authClient, {
    itemId: "vector-search", itemType: "design_problem", status: "reviewed",
    confidence: "medium", bookmarked: false, notes: "Completed one design pass.",
  }), "shared problem progress failed");
  expect(concept[0].item_type !== problem[0].item_type, "shared IDs collapsed into one progress item");
});

await check("fake canonical System Design IDs are rejected", async () => {
  return expectSqlError(await a.authClient.rpc("save_system_design_item_progress_if_revision", {
    target_item_id: `${fixturePrefix}-fake`, target_item_type: "concept",
    target_expect_absent: true, target_expected_updated_at: null, target_status: "reviewed",
    target_confidence: "low", target_bookmarked: false, target_notes: null,
  }), "23503");
});

await check("legacy System Design whole-row saves fail safely", async () => {
  const before = expectSuccess(await a.authClient.from("system_design_item_progress").select("*").eq("item_id", "estimation").eq("item_type", "concept").single(), "legacy fail-safe setup read failed");
  const saved = await a.authClient.rpc("save_system_design_item_progress", {
    target_item_id: "estimation", target_item_type: "concept", target_status: "not_started",
    target_confidence: null, target_bookmarked: false, target_notes: null,
  });
  expectSqlError(saved, "0A000");
  const after = expectSuccess(await a.authClient.from("system_design_item_progress").select("*").eq("item_id", "estimation").eq("item_type", "concept").single(), "legacy fail-safe result read failed");
  expect(JSON.stringify(after) === JSON.stringify(before), "legacy failure mutated System Design progress");
  return "SQLSTATE 0A000; complete row unchanged";
});

await check("desired System Design status updates preserve rich fields and no-op revisions", async () => {
  const before = expectSuccess(await a.authClient.from("system_design_item_progress").select("*").eq("item_id", "estimation").eq("item_type", "concept").single(), "quick-progress setup read failed");
  const changed = expectSuccess(await a.authClient.rpc("set_system_design_item_quick_progress", {
    target_item_id: "estimation", target_item_type: "concept", target_status: "comfortable",
  }), "quick status update failed");
  expect(changed === "estimation", `quick status returned ${JSON.stringify(changed)}`);
  const afterChange = expectSuccess(await a.authClient.from("system_design_item_progress").select("*").eq("item_id", "estimation").eq("item_type", "concept").single(), "quick-progress result read failed");
  expect(afterChange.status === "comfortable", "desired status did not persist");
  for (const field of ["confidence", "bookmarked", "notes"]) expect(afterChange[field] === before[field], `quick status changed ${field}`);
  const repeated = expectSuccess(await a.authClient.rpc("set_system_design_item_quick_progress", {
    target_item_id: "estimation", target_item_type: "concept", target_status: "comfortable",
  }), "idempotent quick status failed");
  expect(repeated === "estimation", "idempotent quick status returned the wrong canonical id");
  const afterNoop = expectSuccess(await a.authClient.from("system_design_item_progress").select("updated_at").eq("item_id", "estimation").eq("item_type", "concept").single(), "quick no-op result read failed");
  expect(afterNoop.updated_at === afterChange.updated_at, "idempotent status replay advanced the edit revision");
  return "confidence, bookmark, and notes preserved; repeated status timestamp-stable";
});

await check("concurrent stale System Design full saves commit exactly one winner", async () => {
  const revision = await currentSystemDesignProgressRevision(a.authClient, "estimation", "concept");
  const [first, second] = await Promise.all([
    saveSystemDesignProgress(a.authClient, { itemId: "estimation", itemType: "concept", status: "review", confidence: "high", bookmarked: true, notes: "Concurrent full winner A." }, revision),
    saveSystemDesignProgress(a.authClient, { itemId: "estimation", itemType: "concept", status: "reviewed", confidence: "low", bookmarked: false, notes: "Concurrent full winner B." }, revision),
  ]);
  const outcomes = [expectSuccess(first, "first concurrent full save failed"), expectSuccess(second, "second concurrent full save failed")];
  expect(outcomes.map((rows) => rows.length).sort().join(",") === "0,1", `expected one full-save winner, observed ${outcomes.map((rows) => rows.length)}`);
  const row = expectSuccess(await a.authClient.from("system_design_item_progress").select("status,confidence,bookmarked,notes").eq("item_id", "estimation").eq("item_type", "concept").single(), "concurrent full-save read failed");
  const coherentA = row.status === "review" && row.confidence === "high" && row.bookmarked === true && row.notes === "Concurrent full winner A.";
  const coherentB = row.status === "reviewed" && row.confidence === "low" && row.bookmarked === false && row.notes === "Concurrent full winner B.";
  expect(coherentA || coherentB, `concurrent save produced a torn row: ${JSON.stringify(row)}`);
  return `one winner; coherent ${coherentA ? "A" : "B"} snapshot`;
});

await check("concurrent System Design full and desired-status saves preserve a coherent rich snapshot", async () => {
  const seeded = expectSuccess(await a.authClient.rpc("set_system_design_item_quick_progress", {
    target_item_id: "estimation",
    target_item_type: "concept",
    target_status: "reviewed",
  }), "full/status seed failed");
  expect(seeded === "estimation", "full/status seed returned the wrong canonical id");
  const setup = expectSuccess(await a.authClient.from("system_design_item_progress").select("status,confidence,bookmarked,notes,updated_at").eq("item_id", "estimation").eq("item_type", "concept").single(), "full/status setup read failed");
  expect(setup.status === "reviewed", `full/status seed did not establish the distinct initial status: ${setup.status}`);
  const [full, quick] = await Promise.all([
    saveSystemDesignProgress(a.authClient, { itemId: "estimation", itemType: "concept", status: "comfortable", confidence: "medium", bookmarked: true, notes: "Concurrent full rich snapshot." }, setup.updated_at),
    a.authClient.rpc("set_system_design_item_quick_progress", { target_item_id: "estimation", target_item_type: "concept", target_status: "review" }),
  ]);
  const fullRows = expectSuccess(full, "concurrent full save failed");
  expect(expectSuccess(quick, "concurrent quick status failed") === "estimation", "quick status returned the wrong canonical id");
  expect(fullRows.length === 0 || fullRows.length === 1, `full/status race returned ${fullRows.length} full rows`);
  const row = expectSuccess(await a.authClient.from("system_design_item_progress").select("status,confidence,bookmarked,notes").eq("item_id", "estimation").eq("item_type", "concept").single(), "full/status race read failed");
  expect(row.status === "review", "desired quick status was not the final status");
  const oldRich = row.confidence === setup.confidence && row.bookmarked === setup.bookmarked && row.notes === setup.notes;
  const newRich = row.confidence === "medium" && row.bookmarked === true && row.notes === "Concurrent full rich snapshot.";
  expect(oldRich || newRich, `full/status race produced torn rich fields: ${JSON.stringify(row)}`);
  expect((fullRows.length === 0 && oldRich) || (fullRows.length === 1 && newRich), "full/status outcome did not match its revision winner");
  return `quick status won; full ${fullRows.length ? "committed before it" : "reported conflict"}`;
});

await check("insert-only browser import preserves rich existing progress across every storage family", async () => {
  expectSuccess(await saveDsaProgress(a.authClient, {
    questionId: "valid-parentheses", status: "solved", confidence: "high",
    bookmarked: true, notes: "Keep this DSA note and every timestamp.",
  }), "DSA import-preservation setup failed");
  expectSuccess(await saveSystemDesignProgress(a.authClient, {
    itemId: "rate-limiter", itemType: "design_problem", status: "comfortable",
    confidence: "high", bookmarked: true, notes: "Keep this design note and every timestamp.",
  }), "System Design import-preservation setup failed");
  expectSuccess(await a.authClient.rpc("save_preparation_track_progress", {
    target_track: "ml-design", target_item_id: "ml-problem-recommendation", target_status: "completed",
  }), "track import-preservation setup failed");

  const before = await Promise.all([
    a.authClient.from("dsa_question_progress").select("*").eq("question_id", "valid-parentheses").single(),
    a.authClient.from("system_design_item_progress").select("*").eq("item_id", "rate-limiter").eq("item_type", "design_problem").single(),
    a.authClient.from("preparation_track_progress").select("*").eq("track", "ml-design").eq("item_id", "ml-problem-recommendation").single(),
  ]).then((responses) => responses.map((response) => expectSuccess(response, "import-preservation setup read failed")));

  const imports = await Promise.all([
    a.authClient.rpc("import_dsa_question_progress_if_absent", { target_question_id: "valid-parentheses", target_status: "review" }),
    a.authClient.rpc("import_system_design_item_progress_if_absent", { target_item_id: "rate-limiter", target_item_type: "design_problem" }),
    a.authClient.rpc("import_preparation_track_progress_if_absent", { target_track: "ml-design", target_item_id: "ml-problem-recommendation", target_status: "in-progress" }),
  ]);
  for (const result of imports) expect(expectSuccess(result, "existing browser import failed") === false, "an existing owner row was misreported as inserted");

  const after = await Promise.all([
    a.authClient.from("dsa_question_progress").select("*").eq("question_id", "valid-parentheses").single(),
    a.authClient.from("system_design_item_progress").select("*").eq("item_id", "rate-limiter").eq("item_type", "design_problem").single(),
    a.authClient.from("preparation_track_progress").select("*").eq("track", "ml-design").eq("item_id", "ml-problem-recommendation").single(),
  ]).then((responses) => responses.map((response) => expectSuccess(response, "import-preservation result read failed")));
  expect(JSON.stringify(after) === JSON.stringify(before), "an insert-only import changed an existing rich progress row");
  return "all three RPCs returned existing; complete rows unchanged";
});

await check("concurrent same-key browser imports insert exactly once", async () => {
  const races = await Promise.all([
    Promise.all([
      a.authClient.rpc("import_dsa_question_progress_if_absent", { target_question_id: "valid-anagram", target_status: "attempted" }),
      a.authClient.rpc("import_dsa_question_progress_if_absent", { target_question_id: "valid-anagram", target_status: "attempted" }),
    ]),
    Promise.all([
      a.authClient.rpc("import_system_design_item_progress_if_absent", { target_item_id: "notification-service", target_item_type: "design_problem" }),
      a.authClient.rpc("import_system_design_item_progress_if_absent", { target_item_id: "notification-service", target_item_type: "design_problem" }),
    ]),
    Promise.all([
      a.authClient.rpc("import_preparation_track_progress_if_absent", { target_track: "behavioral", target_item_id: "beh-lead-01", target_status: "completed" }),
      a.authClient.rpc("import_preparation_track_progress_if_absent", { target_track: "behavioral", target_item_id: "beh-lead-01", target_status: "completed" }),
    ]),
  ]);
  for (const pair of races) {
    const outcomes = pair.map((result) => expectSuccess(result, "same-key concurrent import failed")).sort();
    expect(JSON.stringify(outcomes) === JSON.stringify([false, true]), `expected one inserted and one existing result, observed ${JSON.stringify(outcomes)}`);
  }
  return "DSA, System Design, and Behavioral races each returned one true and one false";
});

await check("concurrent browser import and absent-revision DSA save never overwrite either winner", async () => {
  const [imported, saved] = await Promise.all([
    a.authClient.rpc("import_dsa_question_progress_if_absent", {
      target_question_id: "merge-intervals",
      target_status: "attempted",
    }),
    a.authClient.rpc("save_dsa_question_progress_if_revision", {
      target_question_id: "merge-intervals",
      target_expect_absent: true,
      target_expected_updated_at: null,
      target_status: "solved",
      target_confidence: "high",
      target_bookmarked: true,
      target_notes: "The full editor owns this final rich snapshot.",
    }),
  ]);
  const importOutcome = expectSuccess(imported, "concurrent browser import failed");
  const savedRows = expectSuccess(saved, "concurrent full DSA save failed");
  expect(typeof importOutcome === "boolean", "concurrent import did not return a deterministic boolean outcome");
  expect(savedRows.length === 0 || savedRows.length === 1, "concurrent full save returned an invalid cardinality");
  expect((importOutcome && savedRows.length === 0) || (!importOutcome && savedRows.length === 1), "import/full race did not produce exactly one insert winner");
  const row = expectSuccess(await a.authClient.from("dsa_question_progress").select("status,confidence,bookmarked,notes,first_attempted_at,last_practiced_at,solved_at").eq("question_id", "merge-intervals").single(), "concurrent import/full-save read failed");
  if (savedRows.length === 1) {
    expect(row.status === "solved" && row.confidence === "high" && row.bookmarked === true, "winning full save did not preserve its coherent rich snapshot");
    expect(row.notes === "The full editor owns this final rich snapshot." && row.solved_at, "winning full save lost its private note or solved timestamp");
  } else {
    expect(row.status === "attempted" && row.confidence === null && row.bookmarked === false && row.notes === null, "winning import was overwritten by the stale absent-revision full save");
  }
  expect(row.first_attempted_at && row.last_practiced_at, "the winning insert produced inconsistent practice timestamps");
  return `import returned ${importOutcome}; full returned ${savedRows.length} row(s); one coherent winner`;
});

await check("concurrent browser import and absent-revision System Design save commit one coherent winner", async () => {
  const [imported, saved] = await Promise.all([
    a.authClient.rpc("import_system_design_item_progress_if_absent", {
      target_item_id: "search-autocomplete",
      target_item_type: "design_problem",
    }),
    saveSystemDesignProgress(a.authClient, {
      itemId: "search-autocomplete",
      itemType: "design_problem",
      status: "comfortable",
      confidence: "high",
      bookmarked: true,
      notes: "The full editor owns this System Design snapshot.",
    }, null),
  ]);
  const importOutcome = expectSuccess(imported, "concurrent System Design browser import failed");
  const savedRows = expectSuccess(saved, "concurrent absent-revision System Design save failed");
  expect(typeof importOutcome === "boolean", "System Design import did not return a boolean outcome");
  expect(savedRows.length === 0 || savedRows.length === 1, "System Design full save returned invalid cardinality");
  expect((importOutcome && savedRows.length === 0) || (!importOutcome && savedRows.length === 1), "System Design import/full race did not produce exactly one insert winner");
  const row = expectSuccess(await a.authClient.from("system_design_item_progress").select("status,confidence,bookmarked,notes,first_reviewed_at,last_practiced_at").eq("item_id", "search-autocomplete").eq("item_type", "design_problem").single(), "System Design import/full result read failed");
  if (savedRows.length === 1) {
    expect(row.status === "comfortable" && row.confidence === "high" && row.bookmarked === true, "winning System Design full save lost rich fields");
    expect(row.notes === "The full editor owns this System Design snapshot.", "winning System Design full save lost private notes");
  } else {
    expect(row.status === "reviewed" && row.confidence === null && row.bookmarked === false && row.notes === null, "winning System Design import was overwritten");
  }
  expect(row.first_reviewed_at && row.last_practiced_at, "System Design insert winner produced inconsistent timestamps");
  return `import returned ${importOutcome}; full returned ${savedRows.length} row(s); one coherent winner`;
});

await check("concurrent absent System Design import and desired status settle on the desired status", async () => {
  const [imported, quick] = await Promise.all([
    a.authClient.rpc("import_system_design_item_progress_if_absent", {
      target_item_id: "job-scheduler",
      target_item_type: "design_problem",
    }),
    a.authClient.rpc("set_system_design_item_quick_progress", {
      target_item_id: "job-scheduler",
      target_item_type: "design_problem",
      target_status: "comfortable",
    }),
  ]);
  const importOutcome = expectSuccess(imported, "concurrent System Design status/import failed");
  expect(typeof importOutcome === "boolean", "System Design status/import returned an invalid import outcome");
  expect(expectSuccess(quick, "concurrent System Design quick status failed") === "job-scheduler", "quick status returned the wrong canonical id");
  const row = expectSuccess(await a.authClient.from("system_design_item_progress").select("status,confidence,bookmarked,notes").eq("item_id", "job-scheduler").eq("item_type", "design_problem").single(), "System Design status/import result read failed");
  expect(row.status === "comfortable", "concurrent import replaced the desired System Design status");
  expect(row.confidence === null && row.bookmarked === false && row.notes === null, "status/import race forged rich fields");
  return `import returned ${importOutcome}; final status comfortable`;
});

await check("concurrent absent System Design full and desired status preserve either coherent rich outcome", async () => {
  const [full, quick] = await Promise.all([
    saveSystemDesignProgress(a.authClient, {
      itemId: "leaderboard",
      itemType: "design_problem",
      status: "comfortable",
      confidence: "medium",
      bookmarked: true,
      notes: "Absent full-save rich snapshot.",
    }, null),
    a.authClient.rpc("set_system_design_item_quick_progress", {
      target_item_id: "leaderboard",
      target_item_type: "design_problem",
      target_status: "review",
    }),
  ]);
  const fullRows = expectSuccess(full, "concurrent absent System Design full save failed");
  expect(expectSuccess(quick, "concurrent absent System Design quick status failed") === "leaderboard", "quick status returned the wrong canonical id");
  expect(fullRows.length === 0 || fullRows.length === 1, "absent full/status race returned invalid cardinality");
  const row = expectSuccess(await a.authClient.from("system_design_item_progress").select("status,confidence,bookmarked,notes").eq("item_id", "leaderboard").eq("item_type", "design_problem").single(), "absent full/status result read failed");
  expect(row.status === "review", "desired quick status did not win the absent full/status race");
  const defaultRich = row.confidence === null && row.bookmarked === false && row.notes === null;
  const fullRich = row.confidence === "medium" && row.bookmarked === true && row.notes === "Absent full-save rich snapshot.";
  expect(defaultRich || fullRich, `absent full/status race produced torn rich fields: ${JSON.stringify(row)}`);
  expect((fullRows.length === 0 && defaultRich) || (fullRows.length === 1 && fullRich), "absent full/status outcome did not match the insert winner");
  return `full returned ${fullRows.length} row(s); quick status won without rich-field tearing`;
});

await check("concurrent different-key browser imports commute", async () => {
  const [first, second] = await Promise.all([
    a.authClient.rpc("import_dsa_question_progress_if_absent", { target_question_id: "climbing-stairs", target_status: "attempted" }),
    a.authClient.rpc("import_dsa_question_progress_if_absent", { target_question_id: "coin-change", target_status: "review" }),
  ]);
  expect(expectSuccess(first, "first different-key import failed") === true, "first different key was not inserted");
  expect(expectSuccess(second, "second different-key import failed") === true, "second different key was not inserted");
  const rows = expectSuccess(await a.authClient.from("dsa_question_progress").select("question_id,status").in("question_id", ["climbing-stairs", "coin-change"]), "different-key import read failed");
  expect(rows.length === 2, `different-key imports produced ${rows.length} rows`);
  return "both owner keys inserted without interference";
});

await check("User A creates an application-linked structured design attempt", async () => {
  const created = await a.authClient.rpc("create_system_design_attempt", {
    target_problem_id: "url-shortener", target_application_id: requireFixture(fixture.applicationId, "application"),
    target_title: "Phase 5B qualification URL shortener", target_document: systemDesignDocument,
  });
  fixture.systemDesignAttemptId = expectSuccess(created, "System Design attempt creation failed");
  expect(fixture.systemDesignAttemptId, "attempt ID was not returned");
  const row = expectSuccess(await a.authClient.from("system_design_attempts").select("problem_id,application_id,status,document").eq("id", fixture.systemDesignAttemptId).single(), "attempt read failed");
  expect(row.problem_id === "url-shortener" && row.application_id === fixture.applicationId && row.status === "draft", "attempt metadata did not round-trip");
  expect(row.document.capacity.calculations[0].result === "2,315 RPS", "structured calculation did not round-trip");
});

await check("attempt save uses optimistic concurrency and records practice", async () => {
  const attemptId = requireFixture(fixture.systemDesignAttemptId, "System Design attempt");
  const before = expectSuccess(await a.authClient.from("system_design_attempts").select("revision").eq("id", attemptId).single(), "attempt revision lookup failed");
  const saved = expectSuccess(await a.authClient.rpc("save_system_design_attempt", {
    target_attempt_id: attemptId, target_expected_revision: before.revision,
    target_title: "Phase 5B qualification URL shortener", target_status: "practiced", target_confidence: "high",
    target_application_id: fixture.applicationId, target_document: systemDesignDocument,
  }), "attempt save failed");
  expect(saved.length === 1 && saved[0].first_practiced_at, "practice timestamp was not recorded");
  const stale = expectSuccess(await a.authClient.rpc("save_system_design_attempt", {
    target_attempt_id: attemptId, target_expected_revision: before.revision,
    target_title: "Phase 5B qualification stale overwrite", target_status: "review", target_confidence: "low",
    target_application_id: fixture.applicationId, target_document: systemDesignDocument,
  }), "stale attempt call failed unexpectedly");
  expect(stale.length === 0, "stale attempt overwrote newer work");
});

await check("User B cannot read or delete User A System Design workspace state", async () => {
  expectInvisible(await b.authClient.from("system_design_item_progress").select("item_id").eq("item_id", "estimation"), "System Design item progress read");
  expectInvisible(await b.authClient.from("system_design_attempts").select("id").eq("id", requireFixture(fixture.systemDesignAttemptId, "System Design attempt")), "System Design attempt read");
  const deleted = expectSuccess(await b.authClient.rpc("delete_system_design_attempt", { target_attempt_id: fixture.systemDesignAttemptId }), "foreign attempt deletion call failed");
  expect(deleted === false, "User B deleted User A attempt");
  return "progress and attempt remain private";
});

await check("User B cannot attach an attempt to User A application", async () => {
  return expectSqlError(await b.authClient.rpc("create_system_design_attempt", {
    target_problem_id: "url-shortener", target_application_id: requireFixture(fixture.applicationId, "application"),
    target_title: "Phase 5B qualification forged application", target_document: systemDesignDocument,
  }), "23503");
});

await check("attempt RPC rejects unvalidated JSONB documents", async () => {
  return expectSqlError(await a.authClient.rpc("create_system_design_attempt", {
    target_problem_id: "url-shortener", target_application_id: null,
    target_title: "Phase 5B qualification invalid document", target_document: {},
  }), "23514");
});

await check("Phase 7 saves an owner-derived IANA timezone and sparse reminder preferences", async () => {
  const saved = expectSuccess(
    await saveReminderPreferences(a.authClient, enabledReminderPreferences),
    "Phase 7 preference save failed",
  );
  expect(saved.length === 1 && saved[0].updated_at, "preference save did not return one new revision");
  const stored = await currentReminderPreferences(a.authClient);
  expect(
    stored.preferred_timezone === "America/Chicago" && stored.updated_at === saved[0].updated_at,
    "preferences were not stored for the authenticated actor at the returned revision",
  );
});

await check("Phase 7 rejects an invalid timezone", async () => {
  const result = await saveReminderPreferences(a.authClient, {
    ...enabledReminderPreferences,
    preferredTimezone: "Central Time",
  });
  expect(result.error, "invalid timezone unexpectedly saved");
  expect(result.error.code === "23514", `expected 23514, observed ${result.error.code ?? "no SQLSTATE"}`);
  return `SQLSTATE ${result.error.code}`;
});

await check("legacy reminder snapshot saves fail safely without mutation", async () => {
  const before = await currentReminderPreferences(a.authClient);
  const result = await a.authClient.rpc("save_interview_reminder_preferences", {
    preferred_timezone_value: "UTC",
    in_app_enabled_value: false,
    prep_3_days_enabled_value: false,
    interview_1_day_enabled_value: false,
    interview_1_hour_enabled_value: false,
    email_enabled_value: false,
  });
  expectSqlError(result, "0A000");
  const after = await currentReminderPreferences(a.authClient);
  expect(JSON.stringify(after) === JSON.stringify(before), "legacy reminder save mutated the stored snapshot");
  return "SQLSTATE 0A000; snapshot unchanged";
});

await check("scheduling a future interview creates exactly three in-app reminders", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  const update = expectSuccess(await a.authClient.from("interview_rounds").update({
    scheduled_at: "2099-08-19T19:00:00.000Z", timezone: "America/Chicago", status: "Scheduled",
  }).eq("id", roundId).select("reminder_schedule_revision,calendar_revision").single(), "future interview schedule failed");
  expect(update.reminder_schedule_revision > 1 && update.calendar_revision > 1, "round revisions did not advance");
  const rows = expectSuccess(await a.authClient.from("interview_reminders").select("id,status,channel,reminder_type,schedule_revision,scheduled_for").eq("round_id", roundId).order("reminder_type"), "reminder schedule read failed");
  expect(rows.length === 3 && rows.every((row) => row.status === "pending" && row.channel === "in_app" && row.schedule_revision === update.reminder_schedule_revision), `expected 3 current in-app reminders, observed ${rows.length}`);
  const scheduledByType = Object.fromEntries(rows.map((row) => [row.reminder_type, row.scheduled_for]));
  expect(scheduledByType.prep_3_days === "2099-08-16T19:00:00+00:00", `3-day reminder was ${scheduledByType.prep_3_days}`);
  expect(scheduledByType.interview_1_day === "2099-08-18T19:00:00+00:00", `1-day reminder was ${scheduledByType.interview_1_day}`);
  expect(scheduledByType.interview_1_hour === "2099-08-19T18:00:00+00:00", `1-hour reminder was ${scheduledByType.interview_1_hour}`);
  return "3 deterministic reminder times";
});

await check("concurrent reminder snapshots accept exactly one desired state without torn reminders", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  const before = await currentReminderPreferences(a.authClient);
  const desiredStates = [
    { ...enabledReminderPreferences, prep3DaysEnabled: false },
    { ...enabledReminderPreferences, interview1DayEnabled: false },
  ];
  const results = await Promise.all(
    desiredStates.map((values) => saveReminderPreferences(a.authClient, values, before.updated_at)),
  );
  for (const result of results) expect(!result.error, result.error?.message ?? "concurrent reminder save failed");
  const winnerIndex = results.findIndex((result) => result.data?.length === 1);
  expect(winnerIndex !== -1, "neither concurrent reminder save committed");
  expect(results.filter((result) => result.data?.length === 1).length === 1, "both stale reminder snapshots committed");
  expect(results.filter((result) => result.data?.length === 0).length === 1, "losing reminder snapshot did not return a conflict");

  const winner = desiredStates[winnerIndex];
  const stored = await currentReminderPreferences(a.authClient);
  expect(
    stored.prep_3_days_enabled === winner.prep3DaysEnabled
      && stored.interview_1_day_enabled === winner.interview1DayEnabled
      && stored.interview_1_hour_enabled === winner.interview1HourEnabled
      && stored.updated_at === results[winnerIndex].data[0].updated_at,
    "stored reminder preferences do not match the single winning snapshot",
  );
  const pending = expectSuccess(
    await a.authClient
      .from("interview_reminders")
      .select("reminder_type,status")
      .eq("round_id", roundId)
      .eq("status", "pending"),
    "concurrent reminder resync lookup failed",
  );
  const expectedPending = ["prep_3_days", "interview_1_day", "interview_1_hour"]
    .filter((type) => type !== (winner.prep3DaysEnabled ? "interview_1_day" : "prep_3_days"))
    .sort();
  expect(
    JSON.stringify(pending.map((row) => row.reminder_type).sort()) === JSON.stringify(expectedPending),
    `reminders did not match the winning snapshot: ${pending.map((row) => row.reminder_type).sort().join(",")}`,
  );

  const restored = expectSuccess(
    await saveReminderPreferences(a.authClient, enabledReminderPreferences, stored.updated_at),
    "restoring reminder preferences after the concurrency probe failed",
  );
  expect(restored.length === 1, "restoring reminder preferences returned a conflict");
  return "one committed snapshot, one conflict, matching reminder rows";
});

await check("disabling and re-enabling a reminder preference suppresses and revives one logical row", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  const disabled = expectSuccess(await saveReminderPreferences(a.authClient, {
    ...enabledReminderPreferences,
    interview1HourEnabled: false,
  }), "disabling the one-hour reminder failed");
  expect(disabled.length === 1, "disabling the one-hour reminder returned a conflict");
  let rows = expectSuccess(await a.authClient.from("interview_reminders").select("id,status,reminder_type").eq("round_id", roundId), "disabled reminder read failed");
  expect(rows.length === 3, `preference disable created or removed rows; observed ${rows.length}`);
  expect(rows.find((row) => row.reminder_type === "interview_1_hour")?.status === "cancelled", "one-hour reminder remained active");

  const reenabled = expectSuccess(
    await saveReminderPreferences(a.authClient, enabledReminderPreferences),
    "re-enabling the one-hour reminder failed",
  );
  expect(reenabled.length === 1, "re-enabling the one-hour reminder returned a conflict");
  rows = expectSuccess(await a.authClient.from("interview_reminders").select("id,status,reminder_type").eq("round_id", roundId), "re-enabled reminder read failed");
  expect(rows.length === 3 && rows.every((row) => row.status === "pending"), "re-enable did not restore exactly three pending logical rows");
  return "3 rows; no duplicate logical reminder";
});

await check("rescheduling cancels the old revision and creates one duplicate-free new revision", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  const update = expectSuccess(await a.authClient.from("interview_rounds").update({ scheduled_at: "2099-08-21T20:00:00.000Z", status: "Rescheduled" }).eq("id", roundId).select("reminder_schedule_revision").single(), "reschedule failed");
  const rows = expectSuccess(await a.authClient.from("interview_reminders").select("status,schedule_revision,reminder_type,channel").eq("round_id", roundId), "rescheduled reminder read failed");
  const current = rows.filter((row) => row.schedule_revision === update.reminder_schedule_revision);
  const stale = rows.filter((row) => row.schedule_revision !== update.reminder_schedule_revision);
  expect(current.length === 3 && current.every((row) => row.status === "pending"), "current revision does not have exactly three pending rows");
  expect(stale.length === 3 && stale.every((row) => row.status === "cancelled"), "stale revision was not cancelled");
  expect(new Set(current.map((row) => `${row.reminder_type}:${row.channel}`)).size === 3, "current revision contains duplicates");
});

await check("User B cannot read User A reminder preferences, reminders, or exports", async () => {
  expectInvisible(await b.authClient.from("interview_reminder_preferences").select("user_id").eq("user_id", a.user.id), "reminder preferences");
  expectInvisible(await b.authClient.from("interview_reminders").select("id").eq("round_id", requireFixture(fixture.firstRoundId, "first round")), "reminders");
  const forged = expectSuccess(await b.authClient.rpc("record_interview_calendar_export", { target_round_id: fixture.firstRoundId, provider_value: "ics" }), "foreign export call errored");
  expect(forged === false, "User B recorded an export for User A");
  return "0 private rows; foreign export false";
});

await check("calendar export audit is owner-derived and idempotently counted", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  expect(expectSuccess(await a.authClient.rpc("record_interview_calendar_export", { target_round_id: roundId, provider_value: "ics" }), "first export audit failed") === true, "first export returned false");
  expect(expectSuccess(await a.authClient.rpc("record_interview_calendar_export", { target_round_id: roundId, provider_value: "ics" }), "second export audit failed") === true, "second export returned false");
  const row = expectSuccess(await a.authClient.from("interview_calendar_exports").select("export_count,provider").eq("round_id", roundId).eq("provider", "ics").single(), "export audit read failed");
  expect(row.export_count === 2, `expected export_count 2, observed ${row.export_count}`);
});

await check("completing an interview suppresses future reminders without deleting history", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  expectSuccess(await a.authClient.from("interview_rounds").update({ status: "Completed" }).eq("id", roundId).select("id").single(), "round completion failed");
  let rows = expectSuccess(await a.authClient.from("interview_reminders").select("status").eq("round_id", roundId), "completed reminder read failed");
  expect(rows.length === 6 && rows.every((row) => row.status === "cancelled"), "completed round retained claimable reminders or lost history");

  expectSuccess(await a.authClient.from("interview_rounds").update({ status: "Rescheduled" }).eq("id", roundId).select("id").single(), "round reactivation failed");
  rows = expectSuccess(await a.authClient.from("interview_reminders").select("status,schedule_revision").eq("round_id", roundId), "reactivated reminder read failed");
  const activeRevision = Math.max(...rows.map((row) => row.schedule_revision));
  expect(rows.filter((row) => row.schedule_revision === activeRevision).every((row) => row.status === "pending"), "reactivation did not restore the current revision");
  return "history retained; current revision revived";
});

await check("cancelling an interview suppresses every undelivered reminder", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  expectSuccess(await a.authClient.from("interview_rounds").update({ status: "Cancelled" }).eq("id", roundId).select("id").single(), "round cancellation failed");
  const rows = expectSuccess(await a.authClient.from("interview_reminders").select("status").eq("round_id", roundId), "cancelled reminder read failed");
  expect(rows.length === 6 && rows.every((row) => row.status === "cancelled"), "cancelled round retained claimable reminders");
});

for (const table of [
  "applications",
  "interview_rounds",
  "behavioral_custom_questions",
  "behavioral_stories",
  "behavioral_saved_questions",
  "user_preparation_preferences",
  "dsa_progress",
  "dsa_question_progress",
  "system_design_progress",
  "system_design_item_progress",
  "system_design_attempts",
  "interview_preparations",
  "interview_preparation_custom_tasks",
  "interview_reminder_preferences",
  "interview_reminders",
  "interview_calendar_exports",
]) {
  await check(`anonymous client cannot read ${table}`, async () => {
    const read = await anonymous.from(table).select("*").limit(1);
    return expectSqlError(read, "42501");
  });
}

await check("anonymous client cannot create private progress", async () => {
  const insertion = await anonymous.from("dsa_progress").insert({
    user_id: a.user.id,
    item_kind: "problem",
    item_id: `${fixturePrefix}:anonymous-write`,
    status: "attempted",
  });
  return expectSqlError(insertion, "42501");
});

await check("anonymous client cannot invoke revision-checked canonical DSA progress RPC", async () => {
  const saved = await anonymous.rpc("save_dsa_question_progress_if_revision", {
    target_question_id: "two-sum",
    target_expect_absent: true,
    target_expected_updated_at: null,
    target_status: "attempted",
    target_confidence: "low",
    target_bookmarked: false,
    target_notes: null,
  });
  return expectSqlError(saved, "42501");
});

await check("anonymous client cannot invoke Behavioral story aggregate RPCs", async () => {
  const attempts = await Promise.all([
    anonymous.rpc("create_behavioral_story_with_themes", behavioralStoryArgs()),
    anonymous.rpc("update_behavioral_story_with_themes_if_revision", {
      target_story_id: crypto.randomUUID(),
      target_expected_updated_at: new Date().toISOString(),
      ...behavioralStoryArgs(),
    }),
    anonymous.rpc("duplicate_behavioral_story_with_themes", { target_story_id: crypto.randomUUID() }),
  ]);
  for (const attempt of attempts) expectSqlError(attempt, "42501");
  return "create, update, and duplicate returned SQLSTATE 42501";
});

await check("authenticated legacy DSA full saves fail safely", async () => {
  const saved = await a.authClient.rpc("save_dsa_question_progress", {
    target_question_id: "two-sum",
    target_status: "attempted",
    target_confidence: "low",
    target_bookmarked: false,
    target_notes: null,
  });
  return expectSqlError(saved, "0A000");
});

await check("anonymous client cannot invoke atomic DSA quick-progress RPC", async () => {
  const saved = await anonymous.rpc("set_dsa_question_quick_progress", {
    target_question_id: "two-sum",
    target_status: "solved",
    target_bookmarked: null,
  });
  return expectSqlError(saved, "42501");
});

await check("anonymous client cannot invoke System Design workspace RPCs", async () => {
  const attempts = await Promise.all([
    anonymous.rpc("save_system_design_item_progress_if_revision", {
      target_item_id: "estimation", target_item_type: "concept",
      target_expect_absent: true, target_expected_updated_at: null, target_status: "reviewed",
      target_confidence: "low", target_bookmarked: false, target_notes: null,
    }),
    anonymous.rpc("set_system_design_item_quick_progress", {
      target_item_id: "estimation", target_item_type: "concept", target_status: "reviewed",
    }),
    anonymous.rpc("save_system_design_item_progress", {
      target_item_id: "estimation", target_item_type: "concept", target_status: "reviewed",
      target_confidence: "low", target_bookmarked: false, target_notes: null,
    }),
  ]);
  for (const attempt of attempts) expectSqlError(attempt, "42501");
  return "revision, quick, and legacy RPCs returned SQLSTATE 42501";
});

await check("anonymous client cannot invoke interview preparation RPCs", async () => {
  const saved = await anonymous.rpc("save_interview_preparation", {
    target_round_id: requireFixture(fixture.secondRoundId, "second round"), notes_value: "anonymous",
  });
  expectSqlError(saved, "42501");
  const checklist = await anonymous.rpc("set_interview_preparation_checklist_item", {
    target_round_id: requireFixture(fixture.secondRoundId, "second round"),
    target_item_id: "dsa-review-queue",
    target_completed: true,
  });
  expectSqlError(checklist, "42501");
  return "both RPCs returned SQLSTATE 42501";
});

await check("deleting a custom question cascades its saved-question reference", async () => {
  const customQuestionId = requireFixture(fixture.customQuestionId, "custom question");
  const deletion = await a.authClient.from("behavioral_custom_questions").delete().eq("id", customQuestionId).select("id").single();
  expectSuccess(deletion, "custom question deletion failed");
  const savedRead = await a.authClient
    .from("behavioral_saved_questions")
    .select("id")
    .eq("id", requireFixture(fixture.customSavedQuestionId, "custom saved question"));
  const rows = expectSuccess(savedRead, "saved-question cascade lookup failed");
  expect(rows.length === 0, "custom saved-question reference survived parent deletion");
  fixture.customQuestionId = null;
  return "0 child rows";
});

await check("deleting a story cascades its themes", async () => {
  const storyId = requireFixture(fixture.storyId, "story");
  const directMutations = await Promise.all([
    a.authClient.from("behavioral_stories").insert({ user_id: a.user.id, title: "Phase 5A qualification direct bypass" }),
    a.authClient.from("behavioral_stories").update({ title: "Phase 5A qualification direct overwrite" }).eq("id", storyId),
    a.authClient.from("behavioral_story_themes").insert({ user_id: a.user.id, story_id: storyId, theme: "Ownership" }),
    a.authClient.from("behavioral_story_themes").delete().eq("story_id", storyId),
  ]);
  for (const mutation of directMutations) expectSqlError(mutation, "42501");
  const deletion = await a.authClient.from("behavioral_stories").delete().eq("id", storyId).select("id").single();
  expectSuccess(deletion, "story deletion failed");
  const themeRead = await a.authClient.from("behavioral_story_themes").select("id").eq("story_id", storyId);
  const rows = expectSuccess(themeRead, "theme cascade lookup failed");
  expect(rows.length === 0, "story themes survived parent deletion");
  const answerRead = await a.authClient.from("behavioral_answers").select("story_id,is_primary,notes").eq("id", requireFixture(fixture.answerId, "answer")).single();
  const answer = expectSuccess(answerRead, "answer deletion-semantics lookup failed");
  expect(answer.story_id === null && answer.is_primary === false && answer.notes === "Private preparation note.", "deleting a primary story did not preserve notes while clearing story and primary state");
  fixture.storyId = null;
  return "0 theme rows; answer notes preserved with story and primary cleared";
});

await check("User A explicitly deletes their curated saved question", async () => {
  const savedId = requireFixture(fixture.curatedSavedQuestionId, "curated saved question");
  const deletion = await a.authClient.from("behavioral_saved_questions").delete().eq("id", savedId).select("id").single();
  expectSuccess(deletion, "saved-question deletion failed");
  fixture.curatedSavedQuestionId = null;
});

await check("deleting an application cascades rounds and round preparation while detaching private design attempts", async () => {
  const applicationId = requireFixture(fixture.applicationId, "application");
  const deletion = await a.authClient.from("applications").delete().eq("id", applicationId).select("id").single();
  expectSuccess(deletion, "application deletion failed");
  const roundRead = await a.authClient.from("interview_rounds").select("id").eq("application_id", applicationId);
  const rows = expectSuccess(roundRead, "round cascade lookup failed");
  expect(rows.length === 0, "interview rounds survived application deletion");
  const preparationRows = expectSuccess(await a.authClient.from("interview_preparations").select("id").eq("id", requireFixture(fixture.preparationId, "preparation")), "preparation cascade lookup failed");
  const taskRows = expectSuccess(await a.authClient.from("interview_preparation_custom_tasks").select("id").eq("id", requireFixture(fixture.preparationTaskId, "preparation task")), "preparation task cascade lookup failed");
  expect(preparationRows.length === 0 && taskRows.length === 0, "round preparation survived application deletion");
  const reminderRows = expectSuccess(await a.authClient.from("interview_reminders").select("id").eq("round_id", requireFixture(fixture.firstRoundId, "first round")), "reminder cascade lookup failed");
  const exportRows = expectSuccess(await a.authClient.from("interview_calendar_exports").select("round_id").eq("round_id", fixture.firstRoundId), "export cascade lookup failed");
  expect(reminderRows.length === 0 && exportRows.length === 0, "calendar reminder or export state survived round deletion");
  const attempt = expectSuccess(await a.authClient.from("system_design_attempts").select("application_id").eq("id", requireFixture(fixture.systemDesignAttemptId, "System Design attempt")).single(), "attempt detach lookup failed");
  expect(attempt.application_id === null, "design attempt retained a deleted application reference");
  fixture.applicationId = null;
  return "0 child rounds, preparation, reminders, or exports; design attempt preserved without application context";
});

await check("User A can delete preparation preferences and progress", async () => {
  const preferenceDelete = await a.authClient
    .from("user_preparation_preferences")
    .delete()
    .eq("user_id", a.user.id)
    .select("user_id");
  expect(expectSuccess(preferenceDelete, "preference deletion failed").length === 1, "expected one deleted preference row");

  const dsaDelete = await a.authClient.from("dsa_progress").delete().like("item_id", `${fixturePrefix}:%`).select("item_id");
  expect(expectSuccess(dsaDelete, "DSA cleanup failed").length === 4, "expected four deleted DSA rows");

  const systemDesignDelete = await a.authClient
    .from("system_design_progress")
    .delete()
    .like("item_id", `${fixturePrefix}:%`)
    .select("item_id");
  expect(expectSuccess(systemDesignDelete, "System Design cleanup failed").length === 2, "expected two deleted System Design rows");
  return "1 preference, 4 DSA, and 2 System Design rows deleted";
});

await cleanOwnedFixtures(a);
await cleanOwnedFixtures(b);
cleanPublicExperienceFixtures();

const failed = results.filter((result) => result.result === "FAIL");
console.log(`SUMMARY ${results.length - failed.length}/${results.length} passed; ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
