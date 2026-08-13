import { spawn } from "node:child_process";

const port = Number(process.env.PUBLIC_SMOKE_PORT || 3417);
const origin = `http://127.0.0.1:${port}`;
const output = [];
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  env: {
    ...process.env,
    NEXT_PUBLIC_ACCOUNTS_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    NEXT_PUBLIC_POSTHOG_KEY: "",
    NEXT_PUBLIC_POSTHOG_HOST: "",
    NEXT_PUBLIC_CONTACT_EMAIL: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => output.push(chunk.toString()));
server.stderr.on("data", (chunk) => output.push(chunk.toString()));

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before smoke testing.\n${output.join("")}`);
    try {
      const response = await fetch(origin, { redirect: "manual" });
      if (response.ok) return;
    } catch {
      // The production server has not started accepting connections yet.
    }
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${origin}.\n${output.join("")}`);
}

async function request(route, expectedStatus = 200) {
  const response = await fetch(`${origin}${route}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== expectedStatus) throw new Error(`${route} returned ${response.status}; expected ${expectedStatus}.`);
  return { response, body };
}

try {
  await waitForServer();
  const publicRoutes = [
    "/", "/dsa", "/system-design", "/ml-design", "/behavioral", "/interview-tips", "/resources",
    "/mock-interviews", "/referrals", "/challenges", "/community", "/leaderboard", "/interview-experiences",
    "/companies", "/faq", "/contact", "/dsa/arrays", "/system-design/url-shortener",
    "/ml-design/recommendation-system", "/companies/google", "/interview-experiences/google",
    "/challenges/bounded-stream-frequency-index", "/robots.txt", "/sitemap.xml",
  ];
  for (const route of publicRoutes) {
    const { body } = await request(route);
    if (!body.trim()) throw new Error(`${route} returned an empty body.`);
  }

  const home = await request("/");
  for (const unavailableCta of [">Sign in<", ">Create account<", ">Get started<", ">Dashboard<"]) {
    if (home.body.includes(unavailableCta)) throw new Error(`Homepage/header exposes disabled account CTA ${unavailableCta}.`);
  }

  const contact = await request("/contact");
  if (/<form\b/i.test(contact.body)) throw new Error("Contact renders a disconnected form.");
  if (contact.body.includes("hello@engineeringfoundry.dev")) throw new Error("Contact renders an unconfigured mailbox.");
  for (const marker of ["Open Discord", "Open GitHub Issues"]) if (!contact.body.includes(marker)) throw new Error(`Contact lacks ${marker}.`);

  const accountRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/onboarding", "/dashboard", "/settings/profile"];
  for (const route of accountRoutes) {
    const { body } = await request(route);
    if (!body.includes("Account features are not available yet.")) throw new Error(`${route} does not render the intentional disabled state.`);
    if (/<form\b/i.test(body)) throw new Error(`${route} renders an active account form while accounts are disabled.`);
  }
  const unavailableProfile = await request("/u/not-a-qualified-profile");
  if (!unavailableProfile.body.includes("Account features are not available yet.")) throw new Error("Public profile route does not fail safely while accounts are disabled.");

  for (const route of [
    "/dsa/not-a-real-topic", "/system-design/not-a-real-problem", "/ml-design/not-a-real-problem",
    "/companies/not-a-real-company", "/interview-experiences/not-a-real-company",
    "/challenges/not-a-real-challenge",
  ]) await request(route, 404);

  const headers = home.response.headers;
  if (headers.get("x-content-type-options") !== "nosniff") throw new Error("Missing X-Content-Type-Options response header.");
  if (headers.get("referrer-policy") !== "strict-origin-when-cross-origin") throw new Error("Missing Referrer-Policy response header.");
  if (!headers.get("permissions-policy")?.includes("camera=()")) throw new Error("Missing Permissions-Policy response header.");

  console.log(`Public route smoke passed: ${publicRoutes.length} public routes, ${accountRoutes.length} disabled account routes, the unavailable profile route, 6 unknown dynamic routes, contact integrity, and security headers.`);
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), wait(3000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
}
