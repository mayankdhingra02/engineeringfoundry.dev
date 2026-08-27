import { spawn } from "node:child_process";
import { DATABASE_STEPS, PINNED_SUPABASE_CLI_VERSION, PRODUCTION_STEPS, STATIC_STEPS } from "./release-verification-manifest.mjs";
import { assertLocalSupabaseUrl, parseSupabaseStatusEnv } from "./lib/local-supabase.mjs";

const requestedLane = process.argv[2] ?? "all";
const allowedLanes = new Set(["static", "database", "production", "all"]);
if (!allowedLanes.has(requestedLane)) {
  console.error(`Unknown lane "${requestedLane}". Use static, database, production, or all.`);
  process.exit(2);
}
if (process.env.NEXT_PUBLIC_SUPABASE_URL) assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

const releaseEnvironment = {
  ...process.env,
  NEXT_PUBLIC_ACCOUNTS_ENABLED: "false",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://engineeringfoundry.dev",
  NEXT_PUBLIC_DISCORD_URL: process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/cNgNq3AFGX",
  SUPABASE_TELEMETRY_DISABLED: "1",
};
const selectedLanes = requestedLane === "all" ? ["static", "database", "production"] : [requestedLane];
const results = [];
let activeChild;
let localSupabaseMayBeRunning = false;

function runProcess(name, command, args, { capture = false, env = releaseEnvironment } = {}) {
  const actualCommand = command === "supabase" ? "node_modules/.bin/supabase" : command;
  const startedAt = Date.now();
  process.stdout.write(`\n▸ ${name}\n  ${[actualCommand, ...args].join(" ")}\n`);
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(actualCommand, args, { env, stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
    activeChild = child;
    if (capture) {
      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    }
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      activeChild = undefined;
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      if (code === 0) {
        results.push({ name, status: "PASS", seconds });
        console.log(`  PASS (${seconds}s)`);
        resolve({ stdout, stderr });
      } else {
        results.push({ name, status: "FAIL", seconds });
        reject(new Error(`${name} failed with ${signal ? `signal ${signal}` : `exit ${code}`}.${stderr ? `\n${stderr.trim()}` : ""}`));
      }
    });
  });
}

async function stopLocalSupabase() {
  if (!localSupabaseMayBeRunning) return;
  try {
    await runProcess("Stop local Supabase", "supabase", ["stop"]);
  } finally {
    localSupabaseMayBeRunning = false;
  }
}

async function runStaticLane() {
  for (const step of STATIC_STEPS) await runProcess(step.name, step.command, step.args);
}

async function runDatabaseLane() {
  const version = await runProcess("Verify pinned Supabase CLI", "supabase", ["--version"], { capture: true });
  if (version.stdout.trim() !== PINNED_SUPABASE_CLI_VERSION) {
    throw new Error(`Expected Supabase CLI ${PINNED_SUPABASE_CLI_VERSION}, received ${version.stdout.trim() || "no version"}.`);
  }
  localSupabaseMayBeRunning = true;
  await runProcess("Start local Supabase", "supabase", ["start"], { capture: true });
  const statusResult = await runProcess("Read local Supabase environment", "supabase", ["status", "-o", "env"], { capture: true });
  const status = parseSupabaseStatusEnv(statusResult.stdout);
  const databaseEnvironment = {
    ...releaseEnvironment,
    NEXT_PUBLIC_SUPABASE_URL: assertLocalSupabaseUrl(status.API_URL, "local Supabase API URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  };
  if (!databaseEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY || !databaseEnvironment.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Local Supabase status did not provide the required public and service-role keys.");
  }
  for (const step of DATABASE_STEPS) await runProcess(step.name, step.command, step.args, { env: databaseEnvironment });
}

async function runProductionLane() {
  for (const step of PRODUCTION_STEPS) await runProcess(step.name, step.command, step.args);
}

function handleSignal(signal) {
  console.error(`\nReceived ${signal}; stopping the active qualification step.`);
  activeChild?.kill(signal);
}
process.once("SIGINT", () => handleSignal("SIGINT"));
process.once("SIGTERM", () => handleSignal("SIGTERM"));

const startedAt = Date.now();
let failure;
try {
  console.log(`Engineering Foundry release verification — ${requestedLane}`);
  await runProcess("Clean dependency install", "npm", ["ci"]);
  for (const lane of selectedLanes) {
    console.log(`\n══ ${lane.toUpperCase()} LANE ══`);
    if (lane === "static") await runStaticLane();
    if (lane === "database") await runDatabaseLane();
    if (lane === "production") await runProductionLane();
  }
} catch (error) {
  failure = error;
} finally {
  try {
    await stopLocalSupabase();
  } catch (cleanupError) {
    console.error(`\nCleanup failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    failure ??= cleanupError;
  }
}

const passed = results.filter((result) => result.status === "PASS").length;
const duration = ((Date.now() - startedAt) / 1000).toFixed(0);
if (failure) {
  console.error(`\nRELEASE VERIFICATION: FAIL — ${passed}/${results.length} recorded steps passed in ${duration}s.`);
  console.error(failure instanceof Error ? failure.message : String(failure));
  process.exit(1);
}
console.log(`\nRELEASE VERIFICATION: PASS — ${passed}/${results.length} steps passed in ${duration}s.`);
console.log("Local qualification is not hosted qualification; hosted owner gates remain incomplete.");
