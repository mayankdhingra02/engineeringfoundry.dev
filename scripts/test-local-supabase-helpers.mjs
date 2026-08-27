import assert from "node:assert/strict";
import { assertLocalSupabaseUrl, buildLocalPsqlArgs, parseSupabaseStatusEnv, readSupabaseProjectId, removeTrackedId, selectLocalDatabaseContainer } from "./lib/local-supabase.mjs";

assert.equal(assertLocalSupabaseUrl("http://127.0.0.1:54321/"), "http://127.0.0.1:54321");
assert.equal(assertLocalSupabaseUrl("http://localhost:54321"), "http://localhost:54321");
for (const unsafe of ["https://project.supabase.co", "http://localhost:54322", "http://127.0.0.1.evil:54321"]) {
  assert.throws(() => assertLocalSupabaseUrl(unsafe), /Refusing to run against non-local/);
}
assert.deepEqual(
  parseSupabaseStatusEnv('API_URL="http://127.0.0.1:54321"\nANON_KEY="anon-value"\nSERVICE_ROLE_KEY="service-value"\n'),
  { API_URL: "http://127.0.0.1:54321", ANON_KEY: "anon-value", SERVICE_ROLE_KEY: "service-value" },
);
const tracked = ["a", "b"];
assert.equal(removeTrackedId(tracked, "missing"), false);
assert.deepEqual(tracked, ["a", "b"], "a missing ID must not remove the final tracked account");
assert.equal(removeTrackedId(tracked, "a"), true);
assert.deepEqual(tracked, ["b"]);
assert.equal(readSupabaseProjectId('project_id = "Engineeringfoundry"\n'), "Engineeringfoundry");
assert.throws(() => readSupabaseProjectId('project_id = "unsafe value"\n'), /safe project_id/);
assert.equal(selectLocalDatabaseContainer("supabase_auth_Test|example/auth:v1\nsupabase_db_Test|public.ecr.aws/supabase/postgres:17\n"), "supabase_db_Test");
assert.throws(() => selectLocalDatabaseContainer(""), /found 0/);
const psqlArgs = buildLocalPsqlArgs("supabase_db_Test", { user_id: "value'; drop table example; --" });
assert.ok(psqlArgs.includes("user_id=value'; drop table example; --"), "psql values must remain a single non-shell argument");
assert.throws(() => buildLocalPsqlArgs("unsafe name"), /Unsafe local database container/);
assert.throws(() => buildLocalPsqlArgs("safe", { "bad-name": "x" }), /Unsafe psql variable name/);
console.log("Local Supabase helper regression passed: URL refusal, status parsing, guarded ID removal, container discovery, and parameterized psql arguments are safe.");
