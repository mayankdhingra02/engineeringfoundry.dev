import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import {
  PUBLIC_ROUTES,
  normalizeHostedOrigin,
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
assert.throws(() => normalizeHostedOrigin("https://engineeringfoundry.dev/preview"), /must be an origin without an application pathname/);

const requestedOrigins = [];
const redirects = new Map([
  ["/system-design", "/system-design/start-here/introduction"],
  ["/system-design/introduction", "/system-design/start-here/introduction"],
  ["/system-design/url-shortener", "/system-design/problems/url-shortener"],
]);
const accountRoutePattern = /^(?:\/signin|\/signup|\/forgot-password|\/reset-password|\/onboarding|\/dashboard|\/settings\/profile|\/applications(?:\/|$)|\/behavioral\/(?:workspace|questions|stories)(?:\/|$)|\/u\/not-a-qualified-profile$)/;
const notFoundRoutePattern = /not-a-(?:real-(?:topic|company|problem|lesson|challenge)|role)/;

const fixture = createServer((request, response) => {
  const url = new URL(request.url, "http://fixture.invalid");
  const pathname = url.pathname;
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

  const body = pathname === "/contact"
    ? "Open Discord Open GitHub Issues"
    : accountRoutePattern.test(pathname)
      ? "Account features are not available yet."
      : "public content";
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
  const commandOutput = await runHostedCommand(origin);
  assert.match(commandOutput, /Public route smoke passed \(hosted\)/, "the hosted package command must exercise the supplied fixture");
} finally {
  await new Promise((resolve, reject) => fixture.close((error) => error ? reject(error) : resolve()));
}

console.log("Public-route smoke configuration regression passed: local and hosted selection, hosted-origin validation, and fixture-backed hosted assertions are covered.");
