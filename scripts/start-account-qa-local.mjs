import { createHmac } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";

process.loadEnvFile?.(".env.local");
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl ?? "")) {
  throw new Error("Refusing to start account QA against a non-local Supabase project.");
}

const secret = execFileSync("docker", ["exec", "supabase_auth_Engineeringfoundry", "printenv", "GOTRUE_JWT_SECRET"], { encoding: "utf8" }).trim();
if (!secret) throw new Error("Local Supabase JWT secret was unavailable.");
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const issuedAt = Math.floor(Date.now() / 1000);
const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ aud: "authenticated", sub: "00000000-0000-0000-0000-000000000000", role: "service_role", iss: "supabase", iat: issuedAt, exp: issuedAt + 86400 })}`;
const serviceToken = `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;

const child = spawn("npm", ["run", "dev", "--", "--webpack"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_ACCOUNTS_ENABLED: "true",
    SUPABASE_SERVICE_ROLE_KEY: serviceToken,
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
