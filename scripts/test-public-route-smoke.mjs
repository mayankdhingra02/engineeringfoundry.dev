import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import {
  DISABLED_ACCOUNT_DSA_EXPECTATIONS,
  DISABLED_ACCOUNT_PREPARATION_EXPECTATIONS,
  DISABLED_ACCOUNT_SYSTEM_DESIGN_EXPECTATIONS,
  PUBLIC_ROUTES,
  UNCONFIGURED_FEEDBACK_EXPECTATION,
  normalizeHostedOrigin,
  runPublicRouteAssertions,
  runPublicRouteSmoke,
  selectSmokeConfiguration,
} from "./smoke-public-routes.mjs";

assert.deepEqual(
  selectSmokeConfiguration({ args: [], env: { PUBLIC_SMOKE_PORT: "4123" } }),
  { mode: "local", origin: "http://127.0.0.1:4123", port: 4123, startsServer: true },
  "no arguments must preserve local smoke mode",
);
assert.deepEqual(
  selectSmokeConfiguration({ args: ["--hosted"], env: { PUBLIC_SMOKE_ORIGIN: "https://engineeringfoundry.dev/" } }),
  { mode: "hosted", origin: "https://engineeringfoundry.dev", startsServer: false },
  "hosted mode must normalize a valid trailing-slash HTTPS origin",
);
assert.throws(() => selectSmokeConfiguration({ args: ["--hosted"], env: {} }), /PUBLIC_SMOKE_ORIGIN is required/);
assert.throws(() => normalizeHostedOrigin("not a URL"), /valid absolute HTTP or HTTPS URL/);
assert.throws(() => normalizeHostedOrigin("ftp://engineeringfoundry.dev"), /must use HTTP or HTTPS/);
assert.throws(() => normalizeHostedOrigin("https://user:password@engineeringfoundry.dev"), /must not contain credentials/);
assert.throws(() => normalizeHostedOrigin("https://engineeringfoundry.dev/?source=test"), /must not contain a query string/);
assert.throws(() => normalizeHostedOrigin("https://engineeringfoundry.dev/#section"), /must not contain a fragment/);
await assert.rejects(runPublicRouteAssertions("https://engineeringfoundry.dev", { feedbackExpectation: "unknown" }), /feedbackExpectation must be configured, unconfigured, or either/);
assert.throws(() => normalizeHostedOrigin("https://engineeringfoundry.dev/preview"), /must be an origin without an application pathname/);

const requestedOrigins = [];
const redirects = new Map([
  ["/system-design", "/system-design/start-here/introduction"],
  ["/system-design/introduction", "/system-design/start-here/introduction"],
  ["/system-design/url-shortener", "/system-design/problems/url-shortener"],
]);
const accountRoutePattern = /^(?:\/signin|\/signup|\/forgot-password|\/reset-password|\/onboarding|\/dashboard|\/settings\/profile|\/applications(?:\/|$)|\/behavioral\/(?:workspace|questions|stories)(?:\/|$)|\/u\/not-a-qualified-profile$)/;
const notFoundRoutePattern = /not-a-(?:real-(?:topic|company|problem|lesson|challenge)|role)/;
let omittedSystemDesignMarkerRoute = null;
let leakedSystemDesignHandoffRoute = null;
let omittedPreparationMarkerRoute = null;
let leakedPreparationHandoffRoute = null;
let leakUnprovenAccountDeletionClaim = false;
let leakForgedAccountDeletionCookieClaim = false;
let omitFeedbackUnavailableMarker = false;
let leakFeedbackForm = false;
let leakFeedbackSubmitControl = false;
let leakFeedbackAccountFreePromise = false;
let configuredFeedback = false;

const fixture = createServer((request, response) => {
  const url = new URL(request.url, "http://fixture.invalid");
  const pathname = url.pathname;
  const route = `${pathname}${url.search}`;
  if (redirects.has(pathname)) {
    response.writeHead(308, { location: redirects.get(pathname) });
    response.end("redirect");
    return;
  }
  if (notFoundRoutePattern.test(pathname)) {
    response.writeHead(404);
    response.end("not found");
    return;
  }

  const disabledDsaMarker = DISABLED_ACCOUNT_DSA_EXPECTATIONS.find((expectation) => expectation.route === route)?.marker;
  const disabledSystemDesignMarker = route === omittedSystemDesignMarkerRoute ? undefined : DISABLED_ACCOUNT_SYSTEM_DESIGN_EXPECTATIONS.find((expectation) => expectation.route === route)?.marker;
  const disabledPreparationMarker = route === omittedPreparationMarkerRoute ? undefined : DISABLED_ACCOUNT_PREPARATION_EXPECTATIONS.find((expectation) => expectation.route === route)?.marker;
  const leakedSystemDesignHandoff = route === leakedSystemDesignHandoffRoute ? ' href="/signin?next=/system-design/practice" Sign in to practice' : "";
  const leakedPreparationHandoff = route === leakedPreparationHandoffRoute ? ' href="/behavioral/workspace" Sign in to save' : "";
  const unprovenAccountDeletionClaim = route === "/?account=deleted" && leakUnprovenAccountDeletionClaim ? " Your account was deleted. Your private Engineering Foundry data and authentication identity have been removed." : "";
  const forgedAccountDeletionCookieClaim = route === "/"
    && request.headers.cookie?.split(/;\s*/).includes("ef-account-deletion-proof=account-deleted")
    && leakForgedAccountDeletionCookieClaim
    ? " Your account was deleted. Your private Engineering Foundry data and authentication identity have been removed."
    : "";
  const feedbackUnavailableState = pathname === UNCONFIGURED_FEEDBACK_EXPECTATION.route && !configuredFeedback
    ? `${omitFeedbackUnavailableMarker ? "" : ` ${UNCONFIGURED_FEEDBACK_EXPECTATION.marker}`} ${UNCONFIGURED_FEEDBACK_EXPECTATION.publicWarning} ${UNCONFIGURED_FEEDBACK_EXPECTATION.recovery}`
    : "";
  const configuredFeedbackState = pathname === UNCONFIGURED_FEEDBACK_EXPECTATION.route && configuredFeedback
    ? ' <form action="feedback"><button type="submit">Send feedback </button></form> You do not need an account, and feedback is never published.'
    : "";
  const leakedFeedbackForm = pathname === UNCONFIGURED_FEEDBACK_EXPECTATION.route && leakFeedbackForm ? ' <form action="feedback"></form>' : "";
  const leakedFeedbackSubmitControl = pathname === UNCONFIGURED_FEEDBACK_EXPECTATION.route && leakFeedbackSubmitControl ? ' <button type="submit">Send feedback </button>' : "";
  const leakedFeedbackAccountFreePromise = pathname === UNCONFIGURED_FEEDBACK_EXPECTATION.route && leakFeedbackAccountFreePromise ? " You do not need an account, and feedback is never published." : "";
  const body = pathname === "/contact"
    ? `${configuredFeedback ? '<a href="/feedback">Send private feedback</a> ' : "Private website feedback is unavailable "}Open Discord Open GitHub Issues`
    : accountRoutePattern.test(pathname)
      ? "Account features are not available yet."
      : `public content${disabledDsaMarker ? ` ${disabledDsaMarker}` : ""}${disabledSystemDesignMarker ? ` ${disabledSystemDesignMarker}` : ""}${disabledPreparationMarker ? ` ${disabledPreparationMarker}` : ""}${leakedSystemDesignHandoff}${leakedPreparationHandoff}${unprovenAccountDeletionClaim}${forgedAccountDeletionCookieClaim}${feedbackUnavailableState}${configuredFeedbackState}${leakedFeedbackForm}${leakedFeedbackSubmitControl}${leakedFeedbackAccountFreePromise}`;
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=()",
  });
  response.end(body);
});

function runHostedCommand(origin) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "test:public-routes:hosted"], {
      env: { ...process.env, PUBLIC_SMOKE_ORIGIN: origin },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output = [];
    child.stdout.on("data", (chunk) => output.push(chunk.toString()));
    child.stderr.on("data", (chunk) => output.push(chunk.toString()));
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve(output.join(""));
      else reject(new Error(`Hosted smoke command failed with exit code ${code}.\n${output.join("")}`));
    });
  });
}

await new Promise((resolve, reject) => {
  fixture.once("error", reject);
  fixture.listen(0, "127.0.0.1", resolve);
});

try {
  const address = fixture.address();
  assert.ok(address && typeof address === "object", "fixture must expose a TCP address");
  const origin = `http://127.0.0.1:${address.port}`;
  let spawnCalled = false;
  const fixtureFetch = async (input, options) => {
    requestedOrigins.push(new URL(input).origin);
    return fetch(input, options);
  };
  const result = await runPublicRouteSmoke({
    args: ["--hosted"],
    env: { PUBLIC_SMOKE_ORIGIN: `${origin}/` },
    fetchImpl: fixtureFetch,
    spawnImpl: () => {
      spawnCalled = true;
      throw new Error("Hosted mode must not start an application server.");
    },
  });
  assert.equal(result.mode, "hosted");
  assert.equal(result.origin, origin);
  assert.equal(spawnCalled, false, "hosted mode must not spawn the local application server");
  assert.ok(requestedOrigins.length > PUBLIC_ROUTES.length, "hosted fixture must exercise the complete smoke assertion set");
  assert.ok(requestedOrigins.every((requestedOrigin) => requestedOrigin === origin), "hosted mode must request only the supplied origin");
  assert.ok(PUBLIC_ROUTES.includes("/dsa/roadmap/topic-map?topic=trees"), "public smoke must exercise the canonical DSA topic-map query route");
  assert.ok(!PUBLIC_ROUTES.includes("/dsa/roadmap?topic=trees"), "the obsolete DSA roadmap query must not return to the public smoke inventory");
  assert.ok(DISABLED_ACCOUNT_DSA_EXPECTATIONS.every(({ route }) => PUBLIC_ROUTES.includes(route)), "every disabled-account DSA assertion must exercise a declared public route");
  assert.ok(DISABLED_ACCOUNT_SYSTEM_DESIGN_EXPECTATIONS.every(({ route }) => PUBLIC_ROUTES.includes(route)), "every disabled-account System Design assertion must exercise a declared public route");
  assert.ok(DISABLED_ACCOUNT_PREPARATION_EXPECTATIONS.every(({ route }) => PUBLIC_ROUTES.includes(route)), "every disabled-account preparation assertion must exercise a declared public route");
  assert.ok(PUBLIC_ROUTES.includes(UNCONFIGURED_FEEDBACK_EXPECTATION.route), "the unconfigured feedback assertion must exercise a declared public route");
  await runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch, feedbackExpectation: "unconfigured" });
  omittedSystemDesignMarkerRoute = "/system-design/practice";
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/system-design\/practice lacks the disabled-account System Design state/, "hosted smoke must reject a missing server-rendered System Design disabled marker");
  omittedSystemDesignMarkerRoute = null;
  leakedSystemDesignHandoffRoute = "/system-design/start-here/introduction";
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /exposes disabled System Design account handoff/, "hosted smoke must reject a disabled-account sign-in handoff");
  leakedSystemDesignHandoffRoute = null;
  omittedPreparationMarkerRoute = "/ml-design/recommendation-system";
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/ml-design\/recommendation-system lacks the disabled-account preparation state/, "hosted smoke must reject a missing server-rendered preparation disabled marker");
  omittedPreparationMarkerRoute = null;
  leakedPreparationHandoffRoute = "/behavioral";
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/behavioral exposes disabled preparation account handoff/, "hosted smoke must reject disabled Behavioral workspace and sign-in handoffs");
  leakedPreparationHandoffRoute = null;
  leakUnprovenAccountDeletionClaim = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/\?account=deleted exposes an unproven account-deletion success claim/, "hosted smoke must reject a deletion-success claim driven only by a public query parameter");
  leakUnprovenAccountDeletionClaim = false;
  leakForgedAccountDeletionCookieClaim = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /forged fixed account-deletion Cookie exposes an unproven success claim/, "hosted smoke must reject a deletion-success claim driven by the former fixed proof cookie");
  leakForgedAccountDeletionCookieClaim = false;
  omitFeedbackUnavailableMarker = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/feedback renders neither a complete configured intake nor the explicit unconfigured state/, "hosted smoke must reject a missing server-rendered feedback unavailable marker");
  omitFeedbackUnavailableMarker = false;
  leakFeedbackForm = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/feedback renders a live form while feedback intake is unconfigured/, "hosted smoke must reject a feedback form in the unconfigured state");
  leakFeedbackForm = false;
  leakFeedbackSubmitControl = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch }), /\/feedback renders a live Send feedback control while feedback intake is unconfigured/, "hosted smoke must reject a submit control in the unconfigured state");
  leakFeedbackSubmitControl = false;
  leakFeedbackAccountFreePromise = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch, feedbackExpectation: "unconfigured" }), /unsupported account-free intake promise/, "hosted smoke must reject a stale account-free intake promise in the unconfigured state");
  leakFeedbackAccountFreePromise = false;
  configuredFeedback = true;
  await assert.rejects(runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch, feedbackExpectation: "unconfigured" }), /must render the explicit unconfigured state/, "the local blank-configuration contract must reject a complete-looking feedback form");
  await runPublicRouteAssertions(origin, { fetchImpl: fixtureFetch, feedbackExpectation: "configured" });
  configuredFeedback = false;
  const commandOutput = await runHostedCommand(origin);
  assert.match(commandOutput, /Public route smoke passed \(hosted\)/, "the hosted package command must exercise the supplied fixture");
} finally {
  await new Promise((resolve, reject) => fixture.close((error) => error ? reject(error) : resolve()));
}

console.log("Public-route smoke configuration regression passed: local and hosted selection, hosted-origin validation, and fixture-backed hosted assertions are covered.");
