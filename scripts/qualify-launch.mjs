/**
 * Launch qualification orchestrator.
 *
 * Runs the deterministic checks that must pass before Engineering Foundry is
 * considered ready for hosted qualification. It orchestrates existing scripts
 * and never reimplements a test.
 *
 *   npm run qualify:static     lint, typecheck, and every static regression
 *   npm run qualify:database   local-Supabase database and two-user checks
 *   npm run qualify:launch     both, static first
 *
 * The database lane assumes a local Supabase stack is already running
 * (`npx supabase start`). It never starts or stops production infrastructure
 * and refuses to run against anything but a local project.
 */
import { spawnSync } from "node:child_process";

const lane = process.argv[2] ?? "all";
if (!["static", "database", "all"].includes(lane)) {
  console.error(`Unknown lane "${lane}". Use static, database, or all.`);
  process.exit(2);
}

const STATIC_STEPS = [
  ["ESLint", "npm", ["run", "lint"]],
  ["TypeScript", "npm", ["run", "typecheck"]],

  // Phase 9 launch-safety guards.
  ["Production hardening", "npm", ["run", "test:production-hardening"]],
  ["Production baseline", "npm", ["run", "test:production-baseline"]],
  ["Private-route privacy", "npm", ["run", "test:private-route-privacy"]],
  ["Canonical catalog integrity", "npm", ["run", "test:canonical-catalog-integrity"]],

  // Account and workspace regressions.
  ["Authentication foundation", "npm", ["run", "test:auth-foundation"]],
  ["Account lifecycle", "npm", ["run", "test:account-lifecycle"]],
  ["Applications workspace", "npm", ["run", "test:application-tracker"]],
  ["Behavioral workspace", "npm", ["run", "test:behavioral-workspace"]],
  ["Persistence foundation", "npm", ["run", "test:persistence-foundation"]],
  ["DSA persistent progress", "npm", ["run", "test:dsa-progress"]],
  ["System Design workspace", "npm", ["run", "test:system-design-workspace"]],
  ["Interview Experiences v1", "npm", ["run", "test:interview-experiences-v1"]],
  ["Interview preparation hub", "npm", ["run", "test:interview-preparation-hub"]],
  ["Interview Playbook diagnostic inputs", "npm", ["run", "test:interview-playbook-diagnostic-inputs"]],
  ["Interview Playbook mock evidence", "npm", ["run", "test:interview-playbook-mock-evidence"]],
  ["Interview Playbook DSA evidence boundary", "npm", ["run", "test:interview-playbook-dsa-evidence"]],
  ["Interview Playbook System Design evidence boundary", "npm", ["run", "test:interview-playbook-system-design-evidence"]],
  ["Interview calendar and reminders", "npm", ["run", "test:interview-calendar-reminders"]],
  ["Reminder worker outcomes", "npm", ["run", "test:interview-reminder-worker"]],

  // Public product and finish guards.
  ["Public launch integrity", "npm", ["run", "test:public-launch-integrity"]],
  ["Typography readability", "npm", ["run", "test:typography-readability"]],
  ["UI density", "npm", ["run", "test:ui-density"]],
];

const DATABASE_STEPS = [
  ["Database schema lint", "npx", ["--yes", "supabase", "db", "lint", "--local", "--schema", "public", "--level", "warning", "--fail-on", "error"]],
  ["pgTAP policy and integrity suite", "npx", ["--yes", "supabase", "test", "db"]],
  ["Two-user persistence isolation", "npm", ["run", "qualify:persistence-local"]],
  ["Account lifecycle export and deletion", "npm", ["run", "qualify:account-lifecycle-local"]],
  ["Phase 9 security qualification", "npm", ["run", "qualify:security-local"]],
];

const steps = lane === "static" ? STATIC_STEPS : lane === "database" ? DATABASE_STEPS : [...STATIC_STEPS, ...DATABASE_STEPS];
const results = [];
const startedAt = Date.now();

console.log(`Engineering Foundry launch qualification — ${lane} lane (${steps.length} steps)\n`);

for (const [name, command, args] of steps) {
  process.stdout.write(`▸ ${name}… `);
  const began = Date.now();
  const run = spawnSync(command, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  const seconds = ((Date.now() - began) / 1000).toFixed(1);
  const ok = run.status === 0;
  results.push({ name, ok, output: `${run.stdout ?? ""}${run.stderr ?? ""}` });
  console.log(ok ? `pass (${seconds}s)` : `FAIL (${seconds}s)`);
}

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} steps passed in ${((Date.now() - startedAt) / 1000).toFixed(0)}s.`);

if (failed.length) {
  for (const entry of failed) {
    console.error(`\n──── ${entry.name} ────\n${entry.output.trim().split("\n").slice(-25).join("\n")}`);
  }
  console.error(`\nLaunch qualification FAILED: ${failed.map((entry) => entry.name).join(", ")}`);
  process.exit(1);
}

console.log(
  lane === "static"
    ? "\nStatic lane clean. Run `npm run qualify:database` with local Supabase running to finish."
    : "\nLaunch qualification clean. Local qualification is not hosted qualification — continue with docs/production-launch-checklist.md.",
);
