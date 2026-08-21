import { readFileSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (file) => readFileSync(file, "utf8");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const accountPlatform = read("lib/account-platform.ts");
const capabilities = read("lib/config/capabilities.ts");
const site = read("config/site.ts");
const env = read(".env.example");
const callback = read("app/auth/callback/route.ts");
const runbook = read("docs/production-operations-runbook.md");
const checklist = read("docs/production-launch-checklist.md");
const ci = read(".github/workflows/ci.yml");
const migrations = readdirSync("supabase/migrations").filter((filename) => filename.endsWith(".sql")).sort();
const latestMigration = migrations.at(-1);

for (const marker of ["isProductionSiteUrlConfigured", 'url.protocol === "https:"', "localHostnames", "isAccountPlatformAvailable", "isProductionSiteUrlConfigured()"]) expect(accountPlatform.includes(marker), `Account platform is missing production-origin guard: ${marker}.`);
expect(capabilities.includes("NEXT_PUBLIC_SITE_URL=https://<production-domain>"), "Capability status must name the missing production origin without revealing a value.");
expect(site.includes('"http://invalid.local"') && !site.includes('url: process.env.NEXT_PUBLIC_SITE_URL || "https://engineeringfoundry.dev"'), "Production metadata must not silently use a guessed public domain.");
expect(env.includes("NEXT_PUBLIC_SITE_URL=") && env.includes("never substitute localhost or a guessed domain"), ".env.example must require an owner-supplied production origin.");
expect(callback.includes("safeInternalPath") && callback.includes("redirectOrigin") && callback.includes("/auth/error?reason=callback"), "Auth callback must retain a safe, explicit error path and internal return validation.");
for (const marker of ["SUPABASE_SERVICE_ROLE_KEY", "REMINDER_WORKER_SECRET", "supabase migration list", latestMigration, `all **${migrations.length}** migrations`, "https://<production-domain>/auth/callback", "point-in-time recovery", "owner/hosting-provider actions", "Interview Experience draft isolation", "preparation activity and active-plan isolation", "anonymous browser-import no-overwrite boundary", "NEXT_PUBLIC_ACCOUNTS_ENABLED=false"]) expect(runbook.includes(marker), `Production runbook is missing ${marker}.`);
expect(migrations.length === 25 && latestMigration === "202608230002_add_feedback_export_rpc.sql", "Production baseline must include the verified P0.1–P0.8 migration history.");
for (const marker of [`all ${migrations.length} migrations`, latestMigration.replace(/\.sql$/, ""), "preparation_track_progress", "export_version` `1.5", "mock reviews, Interview Experience drafts", "active-plan preferences", "browser-progress import boundary", "feedback/admin operations"]) expect(checklist.includes(marker), `Hosted checklist must cover combined P0.1–P0.8 production qualification: ${marker}.`);
expect(ci.includes("test:production-baseline"), "P0.1 production-baseline regression must run in GitHub Actions.");

const originalEnv = { NODE_ENV: process.env.NODE_ENV, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_ACCOUNTS_ENABLED: process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED, NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
try {
  process.env.NODE_ENV = "production"; process.env.NEXT_PUBLIC_SITE_URL = "";
  const { isProductionSiteUrlConfigured } = await import(`../lib/account-platform.ts?missing=${Date.now()}`);
  assert.equal(isProductionSiteUrlConfigured(), false);
  process.env.NEXT_PUBLIC_SITE_URL = "https://localhost:3000";
  assert.equal(isProductionSiteUrlConfigured(), false);
} catch (error) { failures.push(`Production URL guard did not fail closed: ${error instanceof Error ? error.message : String(error)}`); }
finally { Object.assign(process.env, originalEnv); }

if (failures.length) { console.error(`Production baseline regression failed:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log("Production baseline regression passed: explicit origin gating, owner runbook, hosted migration readiness, callback safety, and CI parity hold.");
