import { spawn as defaultSpawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const PUBLIC_ROUTES = [
  "/", "/prepare", "/dsa", "/system-design/start-here/introduction", "/ml-design", "/behavioral", "/interview-tips", "/resources",
  "/mock-interviews", "/referrals", "/challenges", "/community", "/leaderboard", "/interview-experiences",
  "/companies", "/faq", "/contact", "/feedback", "/dsa/arrays", "/dsa/questions", "/dsa/companies",
  "/dsa/companies/amazon", "/dsa/roadmap", "/dsa/roadmap/topic-map?topic=trees", "/dsa/practice", "/dsa/company-questions", "/dsa/company-questions/amazon", "/dsa/languages", "/dsa/languages/python",
  "/dsa/languages/choose-a-language", "/dsa/roadmaps", "/dsa/roadmaps/sde-2/60-day", "/dsa/questions/two-sum",
  "/dsa/strategy", "/dsa/interview-strategy", "/dsa/interview-strategy/problem-solving-framework", "/dsa/roadmap?level=sde2", "/system-design/plan",
  "/system-design/problems", "/system-design/problems/url-shortener", "/system-design/practice", "/system-design/fundamentals/caching", "/system-design/patterns/circuit-breaker",
  "/ml-design/recommendation-system", "/companies/google", "/companies/amazon", "/companies/meta", "/companies/walmart", "/interview-experiences/google",
  "/challenges/bounded-stream-frequency-index", "/robots.txt", "/sitemap.xml",
];

export const DISABLED_ACCOUNT_DSA_EXPECTATIONS = [
  { route: "/dsa", marker: "Account progress unavailable" },
  { route: "/dsa/questions", marker: "Public practice remains available" },
  { route: "/dsa/practice", marker: "Public practice remains available" },
  { route: "/dsa/companies/amazon", marker: "Account progress unavailable" },
  { route: "/dsa/roadmap?level=sde2", marker: "Account progress unavailable · public roadmap" },
  { route: "/dsa/questions/two-sum", marker: "Private notes are unavailable in this configuration" },
];

export const DISABLED_ACCOUNT_SYSTEM_DESIGN_EXPECTATIONS = [
  { route: "/system-design/start-here/introduction", marker: "Account progress unavailable" },
  { route: "/system-design/problems", marker: "Public practice remains available" },
  { route: "/system-design/problems/url-shortener", marker: "Private design attempts are unavailable in this configuration" },
  { route: "/system-design/plan", marker: "Account saving is unavailable" },
  { route: "/system-design/practice", marker: "Public System Design practice remains available" },
];

export const DISABLED_ACCOUNT_PREPARATION_EXPECTATIONS = [
  { route: "/behavioral", marker: "Account saving is unavailable. Public Behavioral practice and the on-page story worksheet remain available." },
  { route: "/ml-design/recommendation-system", marker: "Account saving is unavailable" },
];

export const UNCONFIGURED_FEEDBACK_EXPECTATION = {
  route: "/feedback",
  marker: "Private feedback is unavailable in this configuration.",
  publicWarning: "GitHub Issues are public. Do not include passwords, access tokens, personal data, confidential employer information, or private interview material.",
  recovery: "Open GitHub Issues",
};

const ACCOUNT_ROUTES = [
  "/signin", "/signup", "/forgot-password", "/reset-password", "/onboarding", "/dashboard", "/settings/profile", "/applications", "/applications/new", "/applications/11111111-1111-4111-8111-111111111111", "/behavioral/workspace", "/behavioral/questions", "/behavioral/questions/new", "/behavioral/questions/beh-lead-01", "/behavioral/questions/beh-lead-01/answers/new", "/behavioral/questions/beh-lead-01/answers/11111111-1111-4111-8111-111111111111/edit", "/behavioral/stories", "/behavioral/stories/new", "/behavioral/stories/11111111-1111-4111-8111-111111111111",
];

const NOT_FOUND_ROUTES = [
  "/dsa/not-a-real-topic", "/dsa/companies/not-a-real-company", "/dsa/company-questions/not-a-real-company", "/dsa/roadmaps/not-a-role/60-day", "/system-design/not-a-real-problem", "/system-design/fundamentals/not-a-real-lesson", "/ml-design/not-a-real-problem",
  "/companies/not-a-real-company", "/interview-experiences/not-a-real-company", "/challenges/not-a-real-challenge",
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function localOrigin(port) {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PUBLIC_SMOKE_PORT must be a valid TCP port number.");
  return `http://127.0.0.1:${port}`;
}

export function normalizeHostedOrigin(value) {
  if (!value?.trim()) throw new Error("PUBLIC_SMOKE_ORIGIN is required for hosted public-route smoke mode.");

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("PUBLIC_SMOKE_ORIGIN must be a valid absolute HTTP or HTTPS URL.");
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error("PUBLIC_SMOKE_ORIGIN must use HTTP or HTTPS.");
  if (url.username || url.password) throw new Error("PUBLIC_SMOKE_ORIGIN must not contain credentials.");
  if (url.search) throw new Error("PUBLIC_SMOKE_ORIGIN must not contain a query string.");
  if (url.hash) throw new Error("PUBLIC_SMOKE_ORIGIN must not contain a fragment.");
  if (url.pathname !== "/") throw new Error("PUBLIC_SMOKE_ORIGIN must be an origin without an application pathname.");
  return url.origin;
}

export function selectSmokeConfiguration({ args = process.argv.slice(2), env = process.env } = {}) {
  if (args.length === 0) {
    const port = Number(env.PUBLIC_SMOKE_PORT || 3417);
    return { mode: "local", origin: localOrigin(port), port, startsServer: true };
  }
  if (args.length === 1 && args[0] === "--hosted") {
    return { mode: "hosted", origin: normalizeHostedOrigin(env.PUBLIC_SMOKE_ORIGIN), startsServer: false };
  }
  throw new Error("Use no arguments for local smoke mode or --hosted with PUBLIC_SMOKE_ORIGIN.");
}

function requestUrl(origin, route) {
  return `${origin}${route}`;
}

export async function runPublicRouteAssertions(origin, { fetchImpl = fetch, feedbackExpectation = "either" } = {}) {
  if (!["configured", "unconfigured", "either"].includes(feedbackExpectation)) {
    throw new Error("feedbackExpectation must be configured, unconfigured, or either.");
  }
  const publicBodies = new Map();
  async function request(route, expectedStatus = 200, headers = undefined) {
    const response = await fetchImpl(requestUrl(origin, route), { redirect: "manual", headers });
    const body = await response.text();
    if (response.status !== expectedStatus) throw new Error(`${route} returned ${response.status}; expected ${expectedStatus}.`);
    return { response, body };
  }

  async function requestNotFound(route) {
    const response = await fetchImpl(requestUrl(origin, route), { redirect: "manual" });
    const body = await response.text();
    const streamedNotFound = response.status === 200
      && body.includes("NEXT_HTTP_ERROR_FALLBACK;404")
      && body.includes('<meta name="robots" content="noindex"');
    if (response.status !== 404 && !streamedNotFound) throw new Error(`${route} did not return a 404 or Next.js streamed, noindex not-found response.`);
  }

  for (const route of PUBLIC_ROUTES) {
    const { body } = await request(route);
    if (!body.trim()) throw new Error(`${route} returned an empty body.`);
    publicBodies.set(route, body);
  }

  const retiredSystemDesignLanding = await request("/system-design", 308);
  if (retiredSystemDesignLanding.response.headers.get("location") !== "/system-design/start-here/introduction") {
    throw new Error("/system-design does not permanently redirect to the System Design introduction.");
  }
  const shortIntroduction = await request("/system-design/introduction", 308);
  if (shortIntroduction.response.headers.get("location") !== "/system-design/start-here/introduction") {
    throw new Error("/system-design/introduction does not permanently redirect to the canonical introduction lesson.");
  }
  const legacyUrlShortener = await request("/system-design/url-shortener", 308);
  if (legacyUrlShortener.response.headers.get("location") !== "/system-design/problems/url-shortener") {
    throw new Error("/system-design/url-shortener does not permanently redirect to the canonical practice problem.");
  }

  const home = await request("/");
  for (const unavailableCta of [">Sign in<", ">Create account<", ">Get started<", ">Dashboard<"]) {
    if (home.body.includes(unavailableCta)) throw new Error(`Homepage/header exposes disabled account CTA ${unavailableCta}.`);
  }
  const unprovenAccountDeletion = await request("/?account=deleted");
  for (const unsupportedClaim of ["Your account was deleted.", "Your private Engineering Foundry data and authentication identity have been removed."]) {
    if (unprovenAccountDeletion.body.includes(unsupportedClaim)) throw new Error(`/?account=deleted exposes an unproven account-deletion success claim: ${unsupportedClaim}`);
  }
  const forgedAccountDeletionCookie = await request("/", 200, { cookie: "ef-account-deletion-proof=account-deleted" });
  for (const unsupportedClaim of ["Your account was deleted.", "Your private Engineering Foundry data and authentication identity have been removed."]) {
    if (forgedAccountDeletionCookie.body.includes(unsupportedClaim)) throw new Error(`/ with a forged fixed account-deletion Cookie exposes an unproven success claim: ${unsupportedClaim}`);
  }
  for (const { route, marker } of DISABLED_ACCOUNT_DSA_EXPECTATIONS) {
    const body = publicBodies.get(route) ?? (await request(route)).body;
    for (const unavailableHandoff of ['href="/signin', "Sign in to track", "Sign in to persist", "Sign in to keep private notes", "Keep progress between sessions"]) {
      if (body.includes(unavailableHandoff)) throw new Error(`${route} exposes disabled DSA account handoff ${unavailableHandoff}.`);
    }
    if (!body.includes(marker)) throw new Error(`${route} lacks the disabled-account DSA state: ${marker}.`);
  }
  for (const { route, marker } of DISABLED_ACCOUNT_SYSTEM_DESIGN_EXPECTATIONS) {
    const body = publicBodies.get(route) ?? (await request(route)).body;
    for (const unavailableHandoff of ['href="/signin', "Sign in to track", "Sign in to save", "Sign in to persist", "Sign in to keep private notes", "Sign in to practice", "Keep progress between sessions"]) {
      if (body.includes(unavailableHandoff)) throw new Error(`${route} exposes disabled System Design account handoff ${unavailableHandoff}.`);
    }
    if (!body.includes(marker)) throw new Error(`${route} lacks the disabled-account System Design state: ${marker}.`);
  }
  for (const { route, marker } of DISABLED_ACCOUNT_PREPARATION_EXPECTATIONS) {
    const body = publicBodies.get(route) ?? (await request(route)).body;
    const unavailableHandoffs = [
      'href="/signin',
      "Sign in to save",
      "Sign in to keep this activity with your account",
      "Sign in later to import it deliberately",
      "Preparation activity saved to your account",
      ...(route === "/behavioral" ? ['href="/behavioral/workspace"'] : []),
    ];
    for (const unavailableHandoff of unavailableHandoffs) {
      if (body.includes(unavailableHandoff)) throw new Error(`${route} exposes disabled preparation account handoff ${unavailableHandoff}.`);
    }
    if (!body.includes(marker)) throw new Error(`${route} lacks the disabled-account preparation state: ${marker}.`);
  }

  const feedback = publicBodies.get(UNCONFIGURED_FEEDBACK_EXPECTATION.route) ?? (await request(UNCONFIGURED_FEEDBACK_EXPECTATION.route)).body;
  const unsupportedFeedbackPromise = "You do not need an account, and feedback is never published.";
  const feedbackUnavailable = feedback.includes(UNCONFIGURED_FEEDBACK_EXPECTATION.marker);
  const feedbackHasForm = /<form\b/i.test(feedback);
  const feedbackHasSubmitControl = /type=["']submit["']/i.test(feedback) || feedback.includes(">Send feedback <");
  const feedbackHasAccountFreePromise = feedback.includes(unsupportedFeedbackPromise);
  if (feedbackExpectation === "unconfigured" && !feedbackUnavailable) {
    throw new Error("/feedback must render the explicit unconfigured state for this smoke configuration.");
  }
  if (feedbackExpectation === "configured" && feedbackUnavailable) {
    throw new Error("/feedback must render the configured anonymous intake for this smoke configuration.");
  }

  const contact = await request("/contact");
  if (/<form\b/i.test(contact.body)) throw new Error("Contact renders a disconnected form.");
  if (contact.body.includes("hello@engineeringfoundry.dev")) throw new Error("Contact renders an unconfigured mailbox.");
  for (const marker of ["Open Discord", "Open GitHub Issues"]) if (!contact.body.includes(marker)) throw new Error(`Contact lacks ${marker}.`);
  if (feedbackUnavailable) {
    for (const requiredMarker of [UNCONFIGURED_FEEDBACK_EXPECTATION.publicWarning, UNCONFIGURED_FEEDBACK_EXPECTATION.recovery]) {
      if (!feedback.includes(requiredMarker)) throw new Error(`/feedback lacks the unconfigured feedback state: ${requiredMarker}`);
    }
    if (feedbackHasForm) throw new Error("/feedback renders a live form while feedback intake is unconfigured.");
    if (feedbackHasSubmitControl) throw new Error("/feedback renders a live Send feedback control while feedback intake is unconfigured.");
    if (feedbackHasAccountFreePromise) throw new Error(`/feedback exposes an unsupported account-free intake promise while feedback is unconfigured: ${unsupportedFeedbackPromise}`);
    if (!contact.body.includes("Private website feedback is unavailable")) throw new Error("Contact lacks the unconfigured private-feedback state.");
    if (contact.body.includes("Send private feedback")) throw new Error("Contact exposes a private-feedback CTA while feedback intake is unconfigured.");
  } else {
    if (!feedbackHasForm || !feedbackHasSubmitControl || !feedbackHasAccountFreePromise) throw new Error("/feedback renders neither a complete configured intake nor the explicit unconfigured state.");
    if (contact.body.includes("Private website feedback is unavailable")) throw new Error("Contact exposes an unavailable-feedback claim while feedback intake is configured.");
    if (!contact.body.includes("Send private feedback") || !contact.body.includes('href="/feedback"')) throw new Error("Contact lacks its private-feedback CTA while feedback intake is configured.");
  }

  for (const route of ACCOUNT_ROUTES) {
    const { body } = await request(route);
    if (!body.includes("Account features are not available yet.")) throw new Error(`${route} does not render the intentional disabled state.`);
    if (/<form\b/i.test(body)) throw new Error(`${route} renders an active account form while accounts are disabled.`);
  }
  const unavailableProfile = await request("/u/not-a-qualified-profile");
  if (!unavailableProfile.body.includes("Account features are not available yet.")) throw new Error("Public profile route does not fail safely while accounts are disabled.");

  for (const route of NOT_FOUND_ROUTES) await requestNotFound(route);

  const headers = home.response.headers;
  if (headers.get("x-content-type-options") !== "nosniff") throw new Error("Missing X-Content-Type-Options response header.");
  if (headers.get("referrer-policy") !== "strict-origin-when-cross-origin") throw new Error("Missing Referrer-Policy response header.");
  if (!headers.get("permissions-policy")?.includes("camera=()")) throw new Error("Missing Permissions-Policy response header.");

  return { publicRouteCount: PUBLIC_ROUTES.length, accountRouteCount: ACCOUNT_ROUTES.length, notFoundRouteCount: NOT_FOUND_ROUTES.length };
}

function startLocalServer({ port, env, spawnImpl }) {
  const output = [];
  const server = spawnImpl(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    env: {
      ...env,
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
  return { server, output };
}

async function waitForServer({ server, output, origin, fetchImpl }) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before smoke testing.\n${output.join("")}`);
    try {
      const response = await fetchImpl(origin, { redirect: "manual" });
      if (response.ok) return;
    } catch {
      // The production server has not started accepting connections yet.
    }
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${origin}.\n${output.join("")}`);
}

async function stopLocalServer(server) {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => server.once("exit", resolve)), wait(3000)]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

export async function runPublicRouteSmoke({ args, env = process.env, fetchImpl = fetch, spawnImpl = defaultSpawn } = {}) {
  const configuration = selectSmokeConfiguration({ args, env });
  if (configuration.mode === "hosted") {
    const result = await runPublicRouteAssertions(configuration.origin, { fetchImpl });
    return { ...configuration, ...result };
  }

  const { server, output } = startLocalServer({ port: configuration.port, env, spawnImpl });
  try {
    await waitForServer({ server, output, origin: configuration.origin, fetchImpl });
    const result = await runPublicRouteAssertions(configuration.origin, { fetchImpl, feedbackExpectation: "unconfigured" });
    return { ...configuration, ...result };
  } finally {
    await stopLocalServer(server);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = await runPublicRouteSmoke();
    console.log(`Public route smoke passed (${result.mode}): ${result.publicRouteCount} public routes, ${result.accountRouteCount} disabled account routes, the unavailable profile route, ${result.notFoundRouteCount - 1} unknown dynamic routes, contact integrity, and security headers.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
