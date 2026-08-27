import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const LOCAL_SUPABASE_URL = /^http:\/\/(?:127\.0\.0\.1|localhost):54321\/?$/;

export function assertLocalSupabaseUrl(value, label = "Supabase URL") {
  if (!value) throw new Error(`${label} is not configured.`);
  if (!LOCAL_SUPABASE_URL.test(value)) throw new Error(`Refusing to run against non-local ${label}: ${value}`);
  return value.replace(/\/$/, "");
}

export function parseSupabaseStatusEnv(output) {
  const parsed = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    try {
      parsed[key] = rawValue.startsWith('"') ? JSON.parse(rawValue) : rawValue;
    } catch {
      throw new Error(`Could not parse ${key} from local Supabase status output.`);
    }
  }
  return parsed;
}

export function readLocalSupabaseEnvironment(currentEnv = process.env) {
  if (currentEnv.NEXT_PUBLIC_SUPABASE_URL) assertLocalSupabaseUrl(currentEnv.NEXT_PUBLIC_SUPABASE_URL);
  if (currentEnv.NEXT_PUBLIC_SUPABASE_URL && currentEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY && currentEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: assertLocalSupabaseUrl(currentEnv.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: currentEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: currentEnv.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
  const output = execFileSync("node_modules/.bin/supabase", ["status", "-o", "env"], {
    encoding: "utf8",
    env: { ...currentEnv, SUPABASE_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const status = parseSupabaseStatusEnv(output);
  return {
    NEXT_PUBLIC_SUPABASE_URL: assertLocalSupabaseUrl(status.API_URL, "local Supabase API URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  };
}

export function removeTrackedId(ids, id) {
  const index = ids.indexOf(id);
  if (index === -1) return false;
  ids.splice(index, 1);
  return true;
}

export function readSupabaseProjectId(config = readFileSync("supabase/config.toml", "utf8")) {
  const projectId = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
  if (!projectId || !/^[A-Za-z0-9_-]+$/.test(projectId)) throw new Error("supabase/config.toml has no safe project_id.");
  return projectId;
}

export function selectLocalDatabaseContainer(output) {
  const candidates = output.split(/\r?\n/).filter(Boolean).map((line) => line.split("|"))
    .filter(([, image]) => image?.includes("/supabase/postgres:"));
  if (candidates.length !== 1) throw new Error(`Expected one local Supabase database container, found ${candidates.length}.`);
  return candidates[0][0];
}

export function discoverLocalDatabaseContainer() {
  const projectId = readSupabaseProjectId();
  const output = execFileSync("docker", [
    "ps",
    "--filter", `label=com.supabase.cli.project=${projectId}`,
    "--format", "{{.Names}}|{{.Image}}",
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return selectLocalDatabaseContainer(output);
}

export function buildLocalPsqlArgs(container, variables = {}) {
  if (!/^[A-Za-z0-9_.-]+$/.test(container)) throw new Error("Unsafe local database container name.");
  const args = ["exec", "-i", container, "psql", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1"];
  for (const [name, value] of Object.entries(variables)) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error(`Unsafe psql variable name: ${name}`);
    args.push("-v", `${name}=${String(value)}`);
  }
  return [...args, "-U", "postgres", "-d", "postgres"];
}

export function queryLocalDatabase(sql, variables = {}) {
  const container = discoverLocalDatabaseContainer();
  return execFileSync("docker", buildLocalPsqlArgs(container, variables), {
    encoding: "utf8",
    input: `${sql}\n`,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}
