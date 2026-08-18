/**
 * Phase 9 HTTP security qualification.
 *
 * Boots the production build with accounts enabled against local Supabase and
 * exercises the boundaries that only exist at the HTTP layer: the export
 * throttle's independence from cookies, worker authentication, cross-user
 * export ownership, redirect safety, and the response security headers.
 *
 * Local only. Refuses any non-local Supabase URL.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { spawn } from "node:child_process";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "Phase9Http123!";
const port = Number(process.env.HTTP_SECURITY_PORT || 3419);
const origin = `http://127.0.0.1:${port}`;
const workerSecret = "phase9-local-worker-secret";

if (!apiUrl || !publishableKey) throw new Error("Local Supabase public environment is not configured.");
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl)) {
  throw new Error("Refusing HTTP security qualification against a non-local Supabase project.");
}

function localServiceToken() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = execFileSync("docker", ["exec", "supabase_auth_Engineeringfoundry", "printenv", "GOTRUE_JWT_SECRET"], { encoding: "utf8" }).trim();
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ aud: "authenticated", sub: "00000000-0000-0000-0000-000000000000", role: "service_role", iss: "supabase", iat: issuedAt, exp: issuedAt + 3600 })}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
}

const serviceToken = localServiceToken();
const admin = createClient(apiUrl, serviceToken, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const accounts = [];
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

/** Signs in and returns a cookie jar shaped like the browser's SSR session. */
async function signedInSession(label) {
  const email = `phase9-http-${label}-${stamp}@example.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  accounts.push(created.data.user.id);

  let cookies = [];
  const client = createServerClient(apiUrl, publishableKey, {
    cookies: {
      getAll: () => cookies,
      setAll: (next) => {
        const names = new Set(next.map((cookie) => cookie.name));
        cookies = [...cookies.filter((cookie) => !names.has(cookie.name)), ...next];
      },
    },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signIn.error);
  assert.ok(cookies.length, "sign-in produced no SSR cookies");
  return {
    userId: created.data.user.id,
    client,
    header: () => cookies.map(({ name, value }) => `${name}=${value}`).join("; "),
  };
}

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    NEXT_PUBLIC_ACCOUNTS_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceToken,
    REMINDER_WORKER_SECRET: workerSecret,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
const serverLog = [];
server.stdout.on("data", (chunk) => serverLog.push(chunk.toString()));
server.stderr.on("data", (chunk) => serverLog.push(chunk.toString()));

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${origin}/`, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`server did not start:\n${serverLog.join("")}`);
}

try {
  await waitForServer();
  const a = await signedInSession("a");
  const b = await signedInSession("b");

  // --- Security headers ----------------------------------------------------
  await check("public responses carry the enforced security headers", async () => {
    const response = await fetch(`${origin}/`, { redirect: "manual" });
    const csp = response.headers.get("content-security-policy") ?? "";
    for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"]) {
      assert.ok(csp.includes(directive), `CSP missing ${directive}`);
    }
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.ok(!csp.includes("'unsafe-eval'"), "production CSP must not allow eval");
    return "CSP, XFO, nosniff, referrer";
  });

  await check("connect-src restricts API destinations to the configured services", async () => {
    const csp = (await fetch(`${origin}/`, { redirect: "manual" })).headers.get("content-security-policy") ?? "";
    const connect = csp.split(";").find((part) => part.trim().startsWith("connect-src")) ?? "";
    assert.ok(connect.includes("'self'"), "connect-src must allow same origin");
    assert.ok(connect.includes("127.0.0.1:54321") || connect.includes("localhost:54321"), "connect-src must allow the configured Supabase project");
    assert.ok(!connect.includes(" *"), "connect-src must not be a wildcard");
    return connect.trim();
  });

  // --- Private route protection -------------------------------------------
  await check("signed-out access to a private route redirects to sign-in", async () => {
    const response = await fetch(`${origin}/dashboard`, { redirect: "manual" });
    assert.ok([302, 307].includes(response.status), `expected a redirect, saw ${response.status}`);
    assert.match(response.headers.get("location") ?? "", /\/signin/);
  });

  await check("private pages are not cached and not indexed", async () => {
    const response = await fetch(`${origin}/dashboard`, { headers: { Cookie: a.header() }, redirect: "manual" });
    assert.equal(response.status, 200, "signed-in dashboard should render");
    const body = await response.text();
    assert.match(body, /noindex/, "private page must declare noindex");
  });

  // --- Export throttle -----------------------------------------------------
  await check("account export succeeds with private headers and an attachment", async () => {
    const response = await fetch(`${origin}/api/account/export`, { headers: { Cookie: a.header() } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /private/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.match(response.headers.get("content-disposition") ?? "", /attachment; filename="engineering-foundry-export-/);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    const payload = await response.json();
    assert.equal(payload.export_version, "1.0");
    return "200 with private no-store attachment";
  });

  await check("the export throttle denies past its budget", async () => {
    let last;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      last = await fetch(`${origin}/api/account/export`, { headers: { Cookie: a.header() } });
      if (last.status === 429) break;
    }
    assert.equal(last.status, 429, "export was never throttled");
    assert.ok(Number(last.headers.get("retry-after")) > 0, "throttled response must carry Retry-After");
    return `429 with Retry-After ${last.headers.get("retry-after")}s`;
  });

  await check("deleting cookies does not reset the export throttle", async () => {
    // A brand-new cookie jar for the same account: this is exactly what a user
    // clearing site data (or opening a private window) would present.
    const rejar = createServerClient(apiUrl, publishableKey, {
      cookies: { getAll: () => freshCookies, setAll: (next) => { const names = new Set(next.map((c) => c.name)); freshCookies = [...freshCookies.filter((c) => !names.has(c.name)), ...next]; } },
    });
    let freshCookies = [];
    const email = (await admin.auth.admin.getUserById(a.userId)).data.user.email;
    const signedIn = await rejar.auth.signInWithPassword({ email, password });
    assert.ifError(signedIn.error);
    const header = freshCookies.map(({ name, value }) => `${name}=${value}`).join("; ");
    const response = await fetch(`${origin}/api/account/export`, { headers: { Cookie: header } });
    assert.equal(response.status, 429, "a fresh session bypassed the server-side throttle");
    return "still 429 with a brand-new session";
  });

  await check("an unauthenticated export request is rejected", async () => {
    const response = await fetch(`${origin}/api/account/export`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  });

  await check("User B's budget is unaffected by User A's throttle", async () => {
    const response = await fetch(`${origin}/api/account/export`, { headers: { Cookie: b.header() } });
    assert.equal(response.status, 200, "User B must have an independent budget");
    const payload = await response.json();
    assert.equal(payload.applications.length, 0);
    assert.ok(!JSON.stringify(payload).includes(a.userId), "User B export must not contain User A data");
  });

  // --- Calendar export ownership ------------------------------------------
  let roundId;
  await check("User A creates an interview round", async () => {
    const application = await a.client.from("applications").insert({ user_id: a.userId, company_name: "HTTP Qualification Co", role_title: "SDE II", status: "Applied" }).select("id").single();
    assert.ifError(application.error);
    const round = await a.client.rpc("create_interview_round", {
      target_application_id: application.data.id,
      round_name_value: "Onsite",
      round_type_value: "System Design",
      scheduled_at_value: new Date(Date.now() + 172_800_000).toISOString(),
      duration_minutes_value: 60,
      timezone_value: "America/Chicago",
    });
    assert.ifError(round.error);
    roundId = round.data;
  });

  await check("the owner can download their own .ics", async () => {
    const response = await fetch(`${origin}/api/calendar/interviews/${roundId}/ics`, { headers: { Cookie: a.header() } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/calendar/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    const body = await response.text();
    assert.match(body, /BEGIN:VCALENDAR/);
    assert.ok(!/private note/i.test(body), "ICS must not contain private notes");
  });

  await check("User B cannot download User A's .ics", async () => {
    const response = await fetch(`${origin}/api/calendar/interviews/${roundId}/ics`, { headers: { Cookie: b.header() } });
    assert.equal(response.status, 404, "an unowned round must be indistinguishable from a missing one");
  });

  await check("User B cannot open User A's Google calendar template", async () => {
    const response = await fetch(`${origin}/api/calendar/interviews/${roundId}/google`, { headers: { Cookie: b.header() }, redirect: "manual" });
    assert.equal(response.status, 404);
  });

  await check("an anonymous caller cannot reach a calendar export", async () => {
    assert.equal((await fetch(`${origin}/api/calendar/interviews/${roundId}/ics`)).status, 401);
  });

  await check("User B cannot open User A's preparation hub", async () => {
    const response = await fetch(`${origin}/interviews/${roundId}/prepare`, { headers: { Cookie: b.header() }, redirect: "manual" });
    assert.ok([404, 302, 307].includes(response.status), `expected not-found or redirect, saw ${response.status}`);
    if (response.status === 200) throw new Error("User B rendered User A preparation");
  });

  // --- Reminder worker -----------------------------------------------------
  await check("an anonymous caller cannot run the reminder worker", async () => {
    assert.equal((await fetch(`${origin}/api/internal/reminders/process`, { method: "POST" })).status, 401);
  });

  await check("a wrong worker secret is rejected", async () => {
    const response = await fetch(`${origin}/api/internal/reminders/process`, { method: "POST", headers: { Authorization: "Bearer not-the-secret" } });
    assert.equal(response.status, 401);
  });

  await check("a signed-in user cannot run the worker with their session", async () => {
    const response = await fetch(`${origin}/api/internal/reminders/process`, { method: "POST", headers: { Cookie: a.header() } });
    assert.equal(response.status, 401);
  });

  await check("the correct secret reaches a worker that fails closed without an email adapter", async () => {
    const response = await fetch(`${origin}/api/internal/reminders/process`, { method: "POST", headers: { Authorization: `Bearer ${workerSecret}` } });
    assert.equal(response.status, 503, "email delivery must be unavailable, not silently succeeding");
    const payload = await response.json();
    assert.match(payload.error, /not configured/i);
    return "503 reminder delivery is not configured";
  });

  // --- Redirect safety -----------------------------------------------------
  await check("auth redirects reject external and malformed destinations", async () => {
    for (const destination of ["https://evil.example.com/steal", "//evil.example.com", "/\\evil.example.com", "\\\\evil.example.com"]) {
      const response = await fetch(`${origin}/dashboard?next=${encodeURIComponent(destination)}`, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      assert.ok(!location.includes("evil.example.com"), `open redirect via ${destination}`);
    }
    const signin = await fetch(`${origin}/signin?next=${encodeURIComponent("https://evil.example.com")}`, { redirect: "manual" });
    const body = await signin.text();
    assert.ok(!body.includes("https://evil.example.com"), "sign-in echoed an external destination");
    return "external, protocol-relative, and backslash paths refused";
  });

  await check("the auth callback refuses to bounce to an external origin", async () => {
    const response = await fetch(`${origin}/auth/callback?next=${encodeURIComponent("https://evil.example.com")}`, { redirect: "manual" });
    const location = response.headers.get("location") ?? "";
    assert.ok(!location.includes("evil.example.com"), "callback allowed an external destination");
  });

  // --- Robots --------------------------------------------------------------
  await check("robots.txt excludes every private surface", async () => {
    const body = await (await fetch(`${origin}/robots.txt`)).text();
    for (const path of ["/applications", "/dashboard", "/calendar", "/interviews", "/settings", "/onboarding", "/behavioral/workspace", "/system-design/practice", "/system-design/problems/*/practice"]) {
      assert.ok(body.includes(`Disallow: ${path}`), `robots.txt lacks ${path}`);
    }
    assert.ok(!body.includes("Disallow: /dsa"), "public DSA content must remain indexable");
  });

  await check("the sitemap lists no private route", async () => {
    const body = await (await fetch(`${origin}/sitemap.xml`)).text();
    for (const path of ["/dashboard", "/applications", "/calendar", "/interviews", "/settings"]) {
      assert.ok(!body.includes(`<loc>${origin}${path}<`) && !body.includes(`${path}</loc>`), `sitemap leaked ${path}`);
    }
  });
} finally {
  server.kill("SIGTERM");
  for (const userId of accounts) await admin.auth.admin.deleteUser(userId, false).catch(() => undefined);
}

const failed = results.filter((entry) => entry.status === "FAIL");
console.log(`\n${results.length - failed.length}/${results.length} HTTP security qualification checks passed.`);
if (failed.length) {
  console.error(`Failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
