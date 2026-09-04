import { createClient } from "@supabase/supabase-js";
import { resolveRecentPasswordRecoverySubject } from "../lib/auth/password-recovery-claims.ts";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mailpitUrl = "http://127.0.0.1:54324";
const password = "Qualification123!";

if (!apiUrl || !publishableKey) throw new Error("Local Supabase public environment is not configured.");
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl)) {
  throw new Error("Refusing to run qualification against a non-local Supabase project.");
}

function client(flowType = "implicit") {
  return createClient(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false, flowType },
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

async function confirmLatestEmail(email) {
  const list = await fetch(`${mailpitUrl}/api/v1/messages`).then((response) => response.json());
  const message = list.messages
    .filter((candidate) => candidate.To.some((recipient) => recipient.Address === email))
    .sort((left, right) => new Date(right.Created) - new Date(left.Created))[0];
  expect(message, "confirmation email was not captured by Mailpit");

  const detail = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`).then((response) => response.json());
  const verifyUrl = detail.Text.match(/https?:\/\/[^\s)]+\/auth\/v1\/verify\?[^\s)]+/)?.[0];
  expect(verifyUrl, "confirmation URL was absent from the captured email");

  const verification = await fetch(verifyUrl, { redirect: "manual" });
  expect([302, 303].includes(verification.status), `confirmation endpoint returned ${verification.status}`);
}

async function capturedMessageIds(email) {
  const list = await fetch(`${mailpitUrl}/api/v1/messages`).then((response) => response.json());
  return new Set(
    list.messages
      .filter((candidate) => candidate.To.some((recipient) => recipient.Address === email))
      .map((candidate) => candidate.ID),
  );
}

async function waitForNewVerificationUrl(email, previousMessageIds) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const list = await fetch(`${mailpitUrl}/api/v1/messages`).then((response) => response.json());
    const message = list.messages
      .filter((candidate) => candidate.To.some((recipient) => recipient.Address === email))
      .filter((candidate) => !previousMessageIds.has(candidate.ID))
      .sort((left, right) => new Date(right.Created) - new Date(left.Created))[0];
    if (message) {
      const detail = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`).then((response) => response.json());
      const verifyUrl = detail.Text.match(/https?:\/\/[^\s)]+\/auth\/v1\/verify\?[^\s)]+/)?.[0];
      expect(verifyUrl, "verification URL was absent from the new Mailpit message");
      return verifyUrl;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("new recovery email was not captured by Mailpit");
}

async function ensureConfirmedUser(email) {
  let authClient = client();
  let signedIn = await authClient.auth.signInWithPassword({ email, password });
  if (!signedIn.error && signedIn.data.user) return { authClient, user: signedIn.data.user };

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

const a = await ensureConfirmedUser("qualification-a@example.test");
const b = await ensureConfirmedUser("qualification-b@example.test");
const c = await ensureConfirmedUser("qualification-incomplete@example.test");
const anonymous = client();

const profileProjection = [
  "id",
  "username",
  "display_name",
  "bio",
  "current_company",
  "current_role",
  "years_experience",
  "linkedin_url",
  "github_url",
  "is_public",
  "onboarding_complete",
  "onboarding_completed_at",
  "updated_at",
].join(",");

async function profileSnapshot(authClient) {
  const result = await authClient.from("profiles").select(profileProjection).single();
  expect(!result.error && result.data, result.error?.message ?? "owned profile was absent");
  return result.data;
}

function profileSaveArgs(profile, overrides = {}) {
  return {
    target_expected_updated_at: profile.updated_at,
    target_username: profile.username,
    target_display_name: profile.display_name,
    target_bio: profile.bio,
    target_current_company: profile.current_company,
    target_current_role: profile.current_role,
    target_years_experience: profile.years_experience,
    target_update_linkedin_url: true,
    target_linkedin_url: profile.linkedin_url,
    target_update_github_url: true,
    target_github_url: profile.github_url,
    target_is_public: profile.is_public,
    ...overrides,
  };
}

async function saveProfile(authClient, overrides) {
  const profile = await profileSnapshot(authClient);
  return authClient.rpc("save_profile_if_revision", profileSaveArgs(profile, overrides));
}

await check("password recovery issues a recent user-bound recovery AMR while password sign-in cannot elevate", async () => {
  const email = "qualification-a@example.test";
  const previousMessageIds = await capturedMessageIds(email);
  const recoveryClient = client("pkce");
  const recoveryRequest = await recoveryClient.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:3000/auth/callback?next=%2Freset-password&flow=recovery",
  });
  expect(!recoveryRequest.error, `password recovery request failed: ${recoveryRequest.error?.message}`);

  const verifyUrl = await waitForNewVerificationUrl(email, previousMessageIds);
  const verification = await fetch(verifyUrl, { redirect: "manual" });
  expect([302, 303].includes(verification.status), `recovery verification endpoint returned ${verification.status}`);
  const location = verification.headers.get("location");
  expect(location, "recovery verification response omitted its callback location");
  const callback = new URL(location, verifyUrl);
  expect(callback.pathname === "/auth/callback", `unexpected recovery callback path ${callback.pathname}`);
  const code = callback.searchParams.get("code");
  expect(code, "recovery callback omitted its PKCE code");

  const exchanged = await recoveryClient.auth.exchangeCodeForSession(code);
  expect(!exchanged.error && exchanged.data.session && exchanged.data.user, `recovery code exchange failed: ${exchanged.error?.message}`);
  const recoveryClaims = await recoveryClient.auth.getClaims(exchanged.data.session.access_token);
  expect(!recoveryClaims.error && recoveryClaims.data?.claims, `recovery claims verification failed: ${recoveryClaims.error?.message}`);
  const recoverySubject = resolveRecentPasswordRecoverySubject(recoveryClaims.data.claims);
  expect(recoverySubject === exchanged.data.user.id.toLowerCase(), "verified recovery claims were absent, stale, or bound to another user");

  const passwordClaims = await a.authClient.auth.getClaims();
  expect(!passwordClaims.error && passwordClaims.data?.claims, `password-session claims verification failed: ${passwordClaims.error?.message}`);
  expect(resolveRecentPasswordRecoverySubject(passwordClaims.data.claims) === null, "an ordinary password session gained a recovery capability");
  return "recovery AMR accepted; password AMR rejected";
});

await check("profile trigger created one row for each auth user", async () => {
  for (const account of [a, b, c]) {
    const lookup = await account.authClient.from("profiles").select("id").eq("id", account.user.id).maybeSingle();
    expect(!lookup.error && lookup.data?.id === account.user.id, "an auth user was missing its owned profile row");
  }
  return "3/3 owned rows present";
});

await check("User B can complete their own profile", async () => {
  const update = await saveProfile(b.authClient, {
    target_username: "qualification-b",
    target_display_name: "Qualification B",
    target_is_public: true,
  });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "no row updated");
  const completion = await b.authClient.rpc("complete_account_onboarding", {
    preferred_role_level_value: null,
    primary_preparation_focus_value: null,
    preferred_timezone_value: null,
  });
  expect(!completion.error && completion.data?.onboarding_complete, completion.error?.message ?? "onboarding did not complete");
});

await check("User A can complete their own profile", async () => {
  const update = await saveProfile(a.authClient, {
    target_username: "qualification-a",
    target_display_name: "Qualification A",
    target_is_public: true,
  });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "no row updated");
  const completion = await a.authClient.rpc("complete_account_onboarding", {
    preferred_role_level_value: null,
    primary_preparation_focus_value: null,
    preferred_timezone_value: null,
  });
  expect(!completion.error && completion.data?.onboarding_complete, completion.error?.message ?? "onboarding did not complete");
});

await check("profile onboarding boolean and timestamp remain consistent", async () => {
  const update = await saveProfile(c.authClient, {
    target_username: "qualification-incomplete",
    target_display_name: "Qualification Incomplete",
  });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "unexpected onboarding state");
  const profile = await profileSnapshot(c.authClient);
  expect(profile.onboarding_complete === Boolean(profile.onboarding_completed_at), "onboarding state is inconsistent");
});

await check("reserved username admin is rejected by the database", async () => {
  const update = await saveProfile(a.authClient, { target_username: "admin" });
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 23514";
});

await check("reserved brand username is rejected by the database", async () => {
  const update = await saveProfile(a.authClient, { target_username: "engineeringfoundry" });
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 23514";
});

await check("duplicate username is rejected", async () => {
  const update = await saveProfile(b.authClient, { target_username: "qualification-a" });
  expect(update.error?.code === "23505", `expected 23505, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 23505";
});

await check("uppercase profile username is rejected", async () => {
  const update = await saveProfile(b.authClient, { target_username: "Qualification-A" });
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  return "lowercase storage constraint enforced";
});

await check("User A reads their own base profile", async () => {
  const read = await a.authClient.from("profiles").select("id,username").eq("id", a.user.id).maybeSingle();
  expect(!read.error && read.data?.username === "qualification-a", read.error?.message ?? "own row absent");
});

await check("User A updates their own profile through the revision boundary and updated_at advances", async () => {
  const before = await a.authClient.from("profiles").select("updated_at").eq("id", a.user.id).single();
  expect(!before.error, before.error?.message);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const update = await saveProfile(a.authClient, { target_bio: "Revision API qualification update." });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "no row updated");
  expect(new Date(update.data[0].updated_at) > new Date(before.data.updated_at), "updated_at did not advance");
});

await check("User A stores canonical professional URLs", async () => {
  const update = await saveProfile(a.authClient, {
    target_github_url: "https://github.com/qualification-a",
    target_linkedin_url: "https://www.linkedin.com/in/qualification-a",
  });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "no row updated");
  const profile = await profileSnapshot(a.authClient);
  expect(profile.github_url === "https://github.com/qualification-a", "canonical GitHub URL was not stored");
  expect(profile.linkedin_url === "https://www.linkedin.com/in/qualification-a", "canonical LinkedIn URL was not stored");
});

await check("deceptive GitHub URL is rejected", async () => {
  const update = await saveProfile(a.authClient, {
    target_github_url: "https://github.com.evil.example/qualification-a",
  });
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  expect(update.error.message.includes("Invalid GitHub URL"), `unexpected error: ${update.error.message}`);
  return "SQLSTATE 23514";
});

await check("deceptive LinkedIn URL is rejected", async () => {
  const update = await saveProfile(a.authClient, {
    target_linkedin_url: "https://www.linkedin.com@evil.example/in/qualification-a",
  });
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  expect(update.error.message.includes("Invalid LinkedIn URL"), `unexpected error: ${update.error.message}`);
  return "SQLSTATE 23514";
});

await check("User A cannot read User B base profile", async () => {
  const read = await a.authClient.from("profiles").select("id").eq("id", b.user.id);
  expect(!read.error && read.data.length === 0, read.error?.message ?? "User B row was visible");
  return "0 rows";
});

await check("User A cannot update User B base profile", async () => {
  const update = await a.authClient.from("profiles").update({ bio: "Unauthorized" }).eq("id", b.user.id).select("id");
  expect(update.error?.code === "42501", `expected 42501, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 42501";
});

await check("authenticated user cannot insert arbitrary profiles", async () => {
  const insertion = await a.authClient.from("profiles").insert({ id: crypto.randomUUID() });
  expect(insertion.error?.code === "42501", `expected 42501, observed ${insertion.error?.code ?? "no error"}`);
  return "SQLSTATE 42501";
});

await check("authenticated user cannot delete profiles", async () => {
  const deletion = await a.authClient.from("profiles").delete().eq("id", a.user.id);
  expect(deletion.error?.code === "42501", `expected 42501, observed ${deletion.error?.code ?? "no error"}`);
  return "SQLSTATE 42501";
});

await check("anonymous base-table select is denied", async () => {
  const read = await anonymous.from("profiles").select("*");
  expect(read.error?.code === "42501", `expected 42501, observed ${read.error?.code ?? "no error"}`);
  return "SQLSTATE 42501";
});

const expectedPublicKeys = [
  "avatar_url",
  "bio",
  "current_company",
  "current_role",
  "display_name",
  "github_url",
  "linkedin_url",
  "username",
  "years_experience",
];

for (const [actor, actorClient] of [["anonymous", anonymous], ["User A", a.authClient], ["User B", b.authClient]]) {
  await check(`${actor} public RPC returns exactly nine approved fields`, async () => {
    const rpc = await actorClient.rpc("get_public_profile", { profile_username: "qualification-a" }).maybeSingle();
    expect(!rpc.error && rpc.data, rpc.error?.message ?? "public profile absent");
    const keys = Object.keys(rpc.data).sort();
    expect(JSON.stringify(keys) === JSON.stringify(expectedPublicKeys), `observed fields: ${keys.join(", ")}`);
    return keys.join(", ");
  });
}

await check("public RPC preserves canonical professional URLs", async () => {
  const rpc = await anonymous.rpc("get_public_profile", { profile_username: "qualification-a" }).maybeSingle();
  expect(!rpc.error && rpc.data, rpc.error?.message ?? "public profile absent");
  expect(rpc.data.github_url === "https://github.com/qualification-a", "canonical GitHub URL was not returned");
  expect(rpc.data.linkedin_url === "https://www.linkedin.com/in/qualification-a", "canonical LinkedIn URL was not returned");
});

await check("User B can make their profile private", async () => {
  const update = await saveProfile(b.authClient, { target_is_public: false });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "private update failed");
  const profile = await profileSnapshot(b.authClient);
  expect(profile.is_public === false, "profile remained public");
});

for (const [actor, actorClient] of [["anonymous", anonymous], ["User A", a.authClient]]) {
  await check(`${actor} cannot retrieve private User B through the RPC`, async () => {
    const rpc = await actorClient.rpc("get_public_profile", { profile_username: "qualification-b" }).maybeSingle();
    expect(!rpc.error && rpc.data === null, rpc.error?.message ?? "private profile was returned");
    return "no row";
  });
}

await check("User B still reads and edits their private base profile", async () => {
  const update = await saveProfile(b.authClient, { target_bio: "Private owner update." });
  expect(!update.error && update.data?.length === 1, update.error?.message ?? "owner update failed");
  const profile = await profileSnapshot(b.authClient);
  expect(profile.id === b.user.id && profile.is_public === false && profile.bio === "Private owner update.", "owner update was not preserved");
});

await check("incomplete profile is absent from the public RPC", async () => {
  const rpc = await anonymous.rpc("get_public_profile", { profile_username: "qualification-incomplete" }).maybeSingle();
  expect(!rpc.error && rpc.data === null, rpc.error?.message ?? "incomplete profile was returned");
  return "no row";
});

for (const [actor, actorClient] of [["anonymous", anonymous], ["authenticated", a.authClient]]) {
  for (const functionName of ["set_updated_at", "handle_new_user"]) {
    await check(`${actor} cannot directly execute ${functionName}`, async () => {
      const rpc = await actorClient.rpc(functionName);
      expect(rpc.error, "trigger function unexpectedly executed");
      return `denied (${rpc.error.code})`;
    });
  }
}

const failed = results.filter((result) => result.result === "FAIL");
console.log(`SUMMARY ${results.length - failed.length}/${results.length} passed; ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
