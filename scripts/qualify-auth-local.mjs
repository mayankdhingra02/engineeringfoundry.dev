import { createClient } from "@supabase/supabase-js";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mailpitUrl = "http://127.0.0.1:54324";
const password = "Qualification123!";

if (!apiUrl || !publishableKey) throw new Error("Local Supabase public environment is not configured.");
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl)) {
  throw new Error("Refusing to run qualification against a non-local Supabase project.");
}

function client() {
  return createClient(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
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

await check("profile trigger created one row for each auth user", async () => {
  for (const account of [a, b, c]) {
    const lookup = await account.authClient.from("profiles").select("id").eq("id", account.user.id).maybeSingle();
    expect(!lookup.error && lookup.data?.id === account.user.id, "an auth user was missing its owned profile row");
  }
  return "3/3 owned rows present";
});

await check("User B can complete their own profile", async () => {
  const update = await b.authClient.from("profiles").update({
    username: "qualification-b",
    display_name: "Qualification B",
    is_public: true,
  }).eq("id", b.user.id).select("username").maybeSingle();
  expect(!update.error && update.data?.username === "qualification-b", update.error?.message ?? "no row updated");
  const completion = await b.authClient.rpc("complete_account_onboarding", {
    preferred_role_level_value: null,
    primary_preparation_focus_value: null,
    preferred_timezone_value: null,
  });
  expect(!completion.error && completion.data?.onboarding_complete, completion.error?.message ?? "onboarding did not complete");
});

await check("User A can complete their own profile", async () => {
  const update = await a.authClient.from("profiles").update({
    username: "qualification-a",
    display_name: "Qualification A",
    is_public: true,
  }).eq("id", a.user.id).select("username").maybeSingle();
  expect(!update.error && update.data?.username === "qualification-a", update.error?.message ?? "no row updated");
  const completion = await a.authClient.rpc("complete_account_onboarding", {
    preferred_role_level_value: null,
    primary_preparation_focus_value: null,
    preferred_timezone_value: null,
  });
  expect(!completion.error && completion.data?.onboarding_complete, completion.error?.message ?? "onboarding did not complete");
});

await check("profile onboarding boolean and timestamp remain consistent", async () => {
  const update = await c.authClient.from("profiles").update({
    username: "qualification-incomplete",
    display_name: "Qualification Incomplete",
  }).eq("id", c.user.id).select("onboarding_complete,onboarding_completed_at").maybeSingle();
  expect(!update.error && update.data, update.error?.message ?? "unexpected onboarding state");
  expect(update.data.onboarding_complete === Boolean(update.data.onboarding_completed_at), "onboarding state is inconsistent");
});

await check("reserved username admin is rejected by the database", async () => {
  const update = await a.authClient.from("profiles").update({ username: "admin" }).eq("id", a.user.id);
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 23514";
});

await check("reserved brand username is rejected by the database", async () => {
  const update = await a.authClient.from("profiles").update({ username: "engineeringfoundry" }).eq("id", a.user.id);
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 23514";
});

await check("duplicate username is rejected", async () => {
  const update = await b.authClient.from("profiles").update({ username: "qualification-a" }).eq("id", b.user.id);
  expect(update.error?.code === "23505", `expected 23505, observed ${update.error?.code ?? "no error"}`);
  return "SQLSTATE 23505";
});

await check("uppercase direct username is rejected", async () => {
  const update = await b.authClient.from("profiles").update({ username: "Qualification-A" }).eq("id", b.user.id);
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  return "lowercase storage constraint enforced";
});

await check("User A reads their own base profile", async () => {
  const read = await a.authClient.from("profiles").select("id,username").eq("id", a.user.id).maybeSingle();
  expect(!read.error && read.data?.username === "qualification-a", read.error?.message ?? "own row absent");
});

await check("User A updates their own base profile and updated_at advances", async () => {
  const before = await a.authClient.from("profiles").select("updated_at").eq("id", a.user.id).single();
  expect(!before.error, before.error?.message);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const update = await a.authClient.from("profiles").update({ bio: "Direct API qualification update." }).eq("id", a.user.id).select("updated_at").maybeSingle();
  expect(!update.error && update.data, update.error?.message ?? "no row updated");
  expect(new Date(update.data.updated_at) > new Date(before.data.updated_at), "updated_at did not advance");
});

await check("User A stores canonical professional URLs", async () => {
  const update = await a.authClient.from("profiles").update({
    github_url: "https://github.com/qualification-a",
    linkedin_url: "https://www.linkedin.com/in/qualification-a",
  }).eq("id", a.user.id).select("github_url,linkedin_url").maybeSingle();
  expect(!update.error && update.data, update.error?.message ?? "no row updated");
  expect(update.data.github_url === "https://github.com/qualification-a", "canonical GitHub URL was not stored");
  expect(update.data.linkedin_url === "https://www.linkedin.com/in/qualification-a", "canonical LinkedIn URL was not stored");
});

await check("deceptive GitHub URL is rejected", async () => {
  const update = await a.authClient.from("profiles")
    .update({ github_url: "https://github.com.evil.example/qualification-a" })
    .eq("id", a.user.id);
  expect(update.error?.code === "23514", `expected 23514, observed ${update.error?.code ?? "no error"}`);
  expect(update.error.message.includes("Invalid GitHub URL"), `unexpected error: ${update.error.message}`);
  return "SQLSTATE 23514";
});

await check("deceptive LinkedIn URL is rejected", async () => {
  const update = await a.authClient.from("profiles")
    .update({ linkedin_url: "https://www.linkedin.com@evil.example/in/qualification-a" })
    .eq("id", a.user.id);
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
  expect(!update.error && update.data.length === 0, update.error?.message ?? "User B row was updated");
  return "0 rows";
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
  const update = await b.authClient.from("profiles").update({ is_public: false }).eq("id", b.user.id).select("is_public").maybeSingle();
  expect(!update.error && update.data?.is_public === false, update.error?.message ?? "private update failed");
});

for (const [actor, actorClient] of [["anonymous", anonymous], ["User A", a.authClient]]) {
  await check(`${actor} cannot retrieve private User B through the RPC`, async () => {
    const rpc = await actorClient.rpc("get_public_profile", { profile_username: "qualification-b" }).maybeSingle();
    expect(!rpc.error && rpc.data === null, rpc.error?.message ?? "private profile was returned");
    return "no row";
  });
}

await check("User B still reads and edits their private base profile", async () => {
  const update = await b.authClient.from("profiles").update({ bio: "Private owner update." }).eq("id", b.user.id).select("id,is_public").maybeSingle();
  expect(!update.error && update.data?.id === b.user.id && update.data.is_public === false, update.error?.message ?? "owner update failed");
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
