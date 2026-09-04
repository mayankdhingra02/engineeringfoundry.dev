import { createClient } from "@supabase/supabase-js";
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
    owned.from("system_design_item_progress").delete().in("item_id", ["estimation", "url-shortener", "vector-search", "rate-limiter", "notification-service"]),
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

await check("public interview experience uses the exact anonymous nested projection", async () => {
  const saved = expectSuccess(await a.authClient.rpc("save_interview_experience_draft", {
    target_id: null,
    payload: {
      company_name: fixtureCompany,
      role_title: "Software Engineer",
      role_level: "Mid",
      summary: "A bounded local qualification report that verifies the public nested projection without exposing private moderation fields.",
      publication_consent: true,
      public_identity: "anonymous",
      rounds: [{
        round_type: "Technical",
        topic_labels: ["Algorithms"],
        process_notes: "Private qualification process notes.",
      }],
    },
  }), "experience draft creation failed");
  fixture.publicExperienceId = saved;
  expectSuccess(await a.authClient.rpc("submit_interview_experience", { target_id: saved }), "experience submission failed");
  queryLocalDatabase(
    "update public.interview_experiences set status = 'approved', reviewed_at = transaction_timestamp(), review_note = 'Private qualification moderation note.' where id = :'experience_id'::uuid",
    { experience_id: saved },
  );

  const publicRead = expectSuccess(await anonymous
    .from("interview_experiences")
    .select("id,company_name,role_title,summary,public_identity,interview_experience_rounds(round_type,topic_labels)")
    .eq("id", saved)
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

  expectSqlError(await anonymous.from("interview_experiences").select("author_id,review_note").eq("id", saved), "42501");
  expectSqlError(await anonymous.from("interview_experiences").select("id,interview_experience_rounds(process_notes)").eq("id", saved), "42501");
  expectInvisible(await b.authClient.from("interview_experiences").select("id,author_id,review_note").eq("id", saved), "approved report base row for a non-owner");
  const ownerRead = expectSuccess(await a.authClient.from("interview_experiences").select("author_id,review_note,created_at").eq("id", saved).single(), "owner internal read failed");
  expect(ownerRead.author_id === a.user.id && ownerRead.review_note === "Private qualification moderation note.", "owner internal fields did not round-trip");
  return "safe nested fields only; anon hidden columns denied; non-owner base row invisible";
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
  const answer = await a.authClient.from("behavioral_answers").insert({
    user_id: a.user.id,
    curated_question_id: "beh-tech-01",
    story_id: storyId,
    title: "Phase 5A qualification automatic mapping",
  }).select("id").single();
  const row = expectSuccess(answer, "automatic mapping preparation failed");
  const mapping = await a.authClient.from("behavioral_story_question_links").select("id").eq("story_id", storyId).eq("curated_question_id", "beh-tech-01").single();
  expectSuccess(mapping, "answer preparation did not create the canonical story mapping");
  const cleanup = await a.authClient.from("behavioral_answers").delete().eq("id", row.id);
  expectSuccess(cleanup, "automatic mapping answer cleanup failed");
});

await check("User A saves application-specific question notes without a full draft", async () => {
  const insertion = await a.authClient
    .from("behavioral_answers")
    .insert({
      user_id: a.user.id,
      curated_question_id: "beh-lead-01",
      story_id: requireFixture(fixture.storyId, "story"),
      application_id: requireFixture(fixture.applicationId, "application"),
      company_slug: "amazon",
      title: "Phase 5A qualification primary preparation",
      opening_framing: "Frame the ambiguous decision.",
      details_to_emphasize: "Emphasize the reversible scope decision.",
      details_to_avoid: "Avoid confidential launch details.",
      notes: "Private preparation note.",
    })
    .select("id,answer_text,notes")
    .single();
  const row = expectSuccess(insertion, "question preparation insertion failed");
  expect(row.answer_text === "" && row.notes === "Private preparation note.", "optional full draft or notes did not round-trip");
  fixture.answerId = row.id;
  return row.id;
});

await check("owner-derived primary story selection works", async () => {
  const result = await a.authClient.rpc("set_behavioral_primary_answer", {
    target_answer_id: requireFixture(fixture.answerId, "answer"),
    make_primary: true,
  });
  expect(!result.error && result.data === true, result.error?.message ?? "primary selection returned false");
  const read = await a.authClient.from("behavioral_answers").select("is_primary").eq("id", fixture.answerId).single();
  const row = expectSuccess(read, "primary answer lookup failed");
  expect(row.is_primary === true, "primary designation did not persist");
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

await check("User B cannot map User A story or change User A primary preparation", async () => {
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
  expect(!primary.error && primary.data === false, primary.error?.message ?? "cross-user primary change unexpectedly succeeded");
  return "mapping rejected; primary RPC returned false";
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
  const saved = await a.authClient.rpc("save_system_design_item_progress", {
    target_item_id: "estimation", target_item_type: "concept", target_status: "reviewed",
    target_confidence: "medium", target_bookmarked: true, target_notes: "State assumptions before arithmetic.",
  });
  const rows = expectSuccess(saved, "System Design concept progress save failed");
  expect(rows.length === 1 && rows[0].item_type === "concept" && rows[0].first_reviewed_at, "concept progress did not persist correctly");
});

await check("shared System Design concept and problem IDs remain independent", async () => {
  const concept = expectSuccess(await a.authClient.rpc("save_system_design_item_progress", {
    target_item_id: "vector-search", target_item_type: "concept", target_status: "review",
    target_confidence: "low", target_bookmarked: false, target_notes: "Review ANN index choices.",
  }), "shared concept progress failed");
  const problem = expectSuccess(await a.authClient.rpc("save_system_design_item_progress", {
    target_item_id: "vector-search", target_item_type: "design_problem", target_status: "reviewed",
    target_confidence: "medium", target_bookmarked: false, target_notes: "Completed one design pass.",
  }), "shared problem progress failed");
  expect(concept[0].item_type !== problem[0].item_type, "shared IDs collapsed into one progress item");
});

await check("fake canonical System Design IDs are rejected", async () => {
  return expectSqlError(await a.authClient.rpc("save_system_design_item_progress", {
    target_item_id: `${fixturePrefix}-fake`, target_item_type: "concept", target_status: "reviewed",
    target_confidence: "low", target_bookmarked: false, target_notes: null,
  }), "23503");
});

await check("insert-only browser import preserves rich existing progress across every storage family", async () => {
  expectSuccess(await saveDsaProgress(a.authClient, {
    questionId: "valid-parentheses", status: "solved", confidence: "high",
    bookmarked: true, notes: "Keep this DSA note and every timestamp.",
  }), "DSA import-preservation setup failed");
  expectSuccess(await a.authClient.rpc("save_system_design_item_progress", {
    target_item_id: "rate-limiter", target_item_type: "design_problem", target_status: "comfortable",
    target_confidence: "high", target_bookmarked: true, target_notes: "Keep this design note and every timestamp.",
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
  const saved = expectSuccess(await a.authClient.rpc("save_interview_reminder_preferences", {
    preferred_timezone_value: "America/Chicago", in_app_enabled_value: true,
    prep_3_days_enabled_value: true, interview_1_day_enabled_value: true,
    interview_1_hour_enabled_value: true, email_enabled_value: false,
  }), "Phase 7 preference save failed");
  expect(saved.user_id === a.user.id && saved.preferred_timezone === "America/Chicago", "preferences were not owned by the authenticated actor");
});

await check("Phase 7 rejects an invalid timezone", async () => {
  const result = await a.authClient.rpc("save_interview_reminder_preferences", {
    preferred_timezone_value: "Central Time", in_app_enabled_value: true,
    prep_3_days_enabled_value: true, interview_1_day_enabled_value: true,
    interview_1_hour_enabled_value: true, email_enabled_value: false,
  });
  expect(result.error, "invalid timezone unexpectedly saved");
  return result.error.message;
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

await check("disabling and re-enabling a reminder preference suppresses and revives one logical row", async () => {
  const roundId = requireFixture(fixture.firstRoundId, "first round");
  expectSuccess(await a.authClient.rpc("save_interview_reminder_preferences", {
    preferred_timezone_value: "America/Chicago", in_app_enabled_value: true,
    prep_3_days_enabled_value: true, interview_1_day_enabled_value: true,
    interview_1_hour_enabled_value: false, email_enabled_value: false,
  }), "disabling the one-hour reminder failed");
  let rows = expectSuccess(await a.authClient.from("interview_reminders").select("id,status,reminder_type").eq("round_id", roundId), "disabled reminder read failed");
  expect(rows.length === 3, `preference disable created or removed rows; observed ${rows.length}`);
  expect(rows.find((row) => row.reminder_type === "interview_1_hour")?.status === "cancelled", "one-hour reminder remained active");

  expectSuccess(await a.authClient.rpc("save_interview_reminder_preferences", {
    preferred_timezone_value: "America/Chicago", in_app_enabled_value: true,
    prep_3_days_enabled_value: true, interview_1_day_enabled_value: true,
    interview_1_hour_enabled_value: true, email_enabled_value: false,
  }), "re-enabling the one-hour reminder failed");
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
  const saved = await anonymous.rpc("save_system_design_item_progress", {
    target_item_id: "estimation", target_item_type: "concept", target_status: "reviewed",
    target_confidence: "low", target_bookmarked: false, target_notes: null,
  });
  return expectSqlError(saved, "42501");
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
