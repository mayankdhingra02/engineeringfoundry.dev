/**
 * Phase 9 production-hardening regression.
 *
 * Covers the launch-safety properties that are not visible to the feature
 * suites: the capability model, security headers, API route boundaries,
 * privacy-safe logging, email truthfulness, and the server-authoritative
 * export throttle.
 */
import { readFileSync } from "node:fs";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "../lib/security/headers.ts";
import { redactErrorSummary } from "../lib/observability/log.ts";
import { ACCOUNT_EXPORT_RATE_LIMIT, describeRetryAfter } from "../lib/account/rate-limit.ts";

const checks = [];
const check = (name, ok) => checks.push({ name, ok: Boolean(ok) });
const read = (path) => readFileSync(path, "utf8");

// --- Security headers ------------------------------------------------------
const productionHeaders = buildSecurityHeaders(false);
const developmentHeaders = buildSecurityHeaders(true);
const header = (headers, key) => headers.find((entry) => entry.key === key)?.value ?? "";
const productionCsp = header(productionHeaders, "Content-Security-Policy");

check("next.config delegates headers to the shared policy module", read("next.config.ts").includes("buildSecurityHeaders()"));
check("a Content-Security-Policy is enforced, not report-only", Boolean(productionCsp) && !productionHeaders.some((entry) => entry.key.includes("Report-Only")));
for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "frame-src 'none'"]) {
  check(`CSP enforces ${directive}`, productionCsp.includes(directive));
}
check("CSP upgrades insecure requests in production", productionCsp.includes("upgrade-insecure-requests"));
check("CSP does not upgrade insecure requests in development", !header(developmentHeaders, "Content-Security-Policy").includes("upgrade-insecure-requests"));
check("CSP allows eval only in development", !productionCsp.includes("'unsafe-eval'") && header(developmentHeaders, "Content-Security-Policy").includes("'unsafe-eval'"));
check("CSP restricts images to first-party and inline data", productionCsp.includes("img-src 'self' data: blob:"));
check("HSTS is sent in production only", header(productionHeaders, "Strict-Transport-Security").includes("max-age=63072000") && !header(developmentHeaders, "Strict-Transport-Security"));
check("clickjacking protection is present for legacy agents", header(productionHeaders, "X-Frame-Options") === "DENY");
check("MIME sniffing stays disabled", header(productionHeaders, "X-Content-Type-Options") === "nosniff");
check("referrer policy is retained", header(productionHeaders, "Referrer-Policy") === "strict-origin-when-cross-origin");
check("permissions policy retains the existing denials", ["camera=()", "microphone=()", "geolocation=()", "browsing-topics=()"].every((value) => header(productionHeaders, "Permissions-Policy").includes(value)));
check("cross-origin opener policy isolates the browsing context", header(productionHeaders, "Cross-Origin-Opener-Policy") === "same-origin");

// connect-src must be an allowlist so a script cannot exfiltrate private data
// to an arbitrary origin.
const cspWithServices = buildContentSecurityPolicy(false);
check("connect-src is an allowlist rather than a wildcard", cspWithServices.includes("connect-src 'self'") && !cspWithServices.includes("connect-src *"));

// --- Capability model ------------------------------------------------------
const capabilities = read("lib/config/capabilities.ts");
check("capabilities are server-only", capabilities.includes('import "server-only"'));
for (const capability of ["accountPlatformStatus", "accountDeletionStatus", "reminderWorkerStatus", "emailReminderStatus"]) {
  check(`capability model separates ${capability}`, capabilities.includes(`export function ${capability}`));
}
check("account deletion requires the service-role credential", capabilities.includes('missing.push("SUPABASE_SERVICE_ROLE_KEY")'));
check("reminder worker requires its own secret", capabilities.includes('missing.push("REMINDER_WORKER_SECRET")'));
check("email reminders additionally require a provider implementation", capabilities.includes("isReminderEmailDeliveryAvailable()"));
check("capability reporting exposes names, never values", !/process\.env\[[^\]]+\]\s*\)?\s*;?\s*\/\/.*value/.test(capabilities) && capabilities.includes("Names only. Never a value."));

// A missing credential must disable the control, not present a broken one.
check("privacy settings resolve deletion availability on the server", read("app/settings/privacy/page.tsx").includes("accountDeletionStatus().available"));
check("the delete form refuses to render an inoperable control", read("features/account/account-forms.tsx").includes("Permanent deletion is unavailable in this environment"));

// --- Email reminder truthfulness -------------------------------------------
const provider = read("lib/interview-reminders/provider.ts");
check("no email provider adapter is fabricated", provider.includes("return null") && !/resend|sendgrid|postmark|nodemailer|@aws-sdk/i.test(provider));
check("email delivery availability is derived from the adapter", provider.includes("getReminderEmailProvider() !== null"));
const preferencesForm = read("features/interview-calendar/preferences-form.tsx");
check("the email toggle is disabled when no provider exists", preferencesForm.includes("disabled={!emailAvailable}"));
check("the email toggle explains its unavailability", preferencesForm.includes("Unavailable until the site operator connects an email provider"));
check("the server rejects enabling email without a provider", read("features/interview-calendar/actions.ts").includes("isReminderEmailDeliveryAvailable()"));
check("in-app reminders remain available independently", preferencesForm.includes('name="inAppEnabled"'));

// --- API route boundaries --------------------------------------------------
const routes = {
  export: read("app/api/account/export/route.ts"),
  account: read("app/api/auth/account/route.ts"),
  ics: read("app/api/calendar/interviews/[roundId]/ics/route.ts"),
  google: read("app/api/calendar/interviews/[roundId]/google/route.ts"),
  worker: read("app/api/internal/reminders/process/route.ts"),
};

for (const [name, source] of Object.entries(routes)) {
  check(`${name} route is request-time only`, source.includes('export const dynamic = "force-dynamic"'));
  check(`${name} route sets a private cache boundary`, /no-store/.test(source));
  check(`${name} route leaks no stack trace`, !source.includes("error.stack") && !source.includes("String(cause)"));
}
for (const name of ["export", "ics", "google"]) {
  check(`${name} route derives identity from the authenticated actor`, routes[name].includes("getAuthenticatedActor()"));
  check(`${name} route accepts no user selector`, !/searchParams\.get\(["'](user|user_id|userId|account)["']\)/.test(routes[name]));
}
check("export sends the attachment disposition", routes.export.includes('Content-Disposition'));
check("export stays out of search indexes", routes.export.includes('"X-Robots-Tag": "noindex, nofollow"'));
// Compare positions in the handler body, not the import block.
const icsBody = routes.ics.slice(routes.ics.indexOf("export async function GET"));
check("ICS refuses an unowned round before building the payload", icsBody.indexOf("if (!round) return") < icsBody.indexOf("buildInterviewIcs("));
check("ICS requires authentication before building the payload", icsBody.indexOf("if (!current) return") < icsBody.indexOf("buildInterviewIcs("));
check("Google export resolves ownership before redirecting", routes.google.includes("getOwnedCalendarInterview"));
check("Google export redirects to a fixed provider host", read("lib/interview-calendar/model.ts").includes("https://calendar.google.com/calendar/render?"));
check("calendar exports link to the canonical site origin", read("lib/interview-calendar/origin.ts").includes("siteConfig.url"));

// The worker must reject before it inspects configuration, so an unconfigured
// deployment cannot be probed anonymously.
check("worker authenticates with a constant-time comparison", routes.worker.includes("timingSafeEqual"));
check("worker rejects a missing secret as unauthorized", routes.worker.includes("if (!authorized(") && routes.worker.indexOf("authorized(") < routes.worker.indexOf("reminderWorkerStatus()"));
check("worker fails closed when unconfigured", routes.worker.includes("status: 503"));
check("worker never returns provider detail to the caller", !routes.worker.includes("cause") || routes.worker.includes("logServerOperationalFailure"));

// --- Export rate limiting --------------------------------------------------
check("the export throttle no longer depends on a cookie", !routes.export.includes("ef-account-export"));
check("the export throttle consumes a server-side budget", routes.export.includes("consumeAccountActionRateLimit"));
check("a throttled export answers 429 with Retry-After", routes.export.includes("status: 429") && routes.export.includes('"Retry-After"'));
check("the throttle policy is modest", ACCOUNT_EXPORT_RATE_LIMIT.maxRequests >= 3 && ACCOUNT_EXPORT_RATE_LIMIT.maxRequests <= 20);
check("the throttle window is bounded", ACCOUNT_EXPORT_RATE_LIMIT.windowSeconds > 0 && ACCOUNT_EXPORT_RATE_LIMIT.windowSeconds <= 3600);
check("throttle wait time reads naturally", describeRetryAfter(900).includes("15 minutes") && describeRetryAfter(30).includes("less than a minute"));

const rateLimitLibrary = read("lib/account/rate-limit.ts");
check("the throttle fails closed when the limiter errors", rateLimitLibrary.includes("allowed: false"));
check("the throttle accepts no caller-supplied identity", !/user_?id/i.test(rateLimitLibrary));

const rateLimitMigration = read("supabase/migrations/202608150002_create_account_action_rate_limits.sql");
check("throttle ownership derives from auth.uid()", rateLimitMigration.includes("auth.uid()"));
check("throttle state is owner-scoped and cascades on deletion", rateLimitMigration.includes("references auth.users(id) on delete cascade"));
check("throttle rows are protected by RLS", rateLimitMigration.includes("enable row level security"));
check("clients cannot write throttle state directly", rateLimitMigration.includes("revoke all on table public.account_action_rate_limits from anon, authenticated") && rateLimitMigration.includes("grant select on table public.account_action_rate_limits to authenticated"));
check("concurrent requests are serialized by a row lock", rateLimitMigration.includes("for update"));
check("the throttle function is narrowly scoped", rateLimitMigration.includes("security definer") && rateLimitMigration.includes("set search_path = ''"));
check("only authenticated users may consume a budget", rateLimitMigration.includes("grant execute on function public.consume_account_action_rate_limit(text, integer, integer) to authenticated"));

// --- Reauthentication ------------------------------------------------------
const reauth = read("lib/auth/reauthentication.ts");
const accountActions = read("features/account/actions.ts");
check("reauthentication uses an isolated, cookie-free client", reauth.includes("persistSession: false") && reauth.includes("createClient"));
check("reauthentication discards its throwaway session", reauth.includes('signOut({ scope: "local" })'));
check("reauthentication confirms the same account", reauth.includes("data.user.id !== user.id"));
check("OAuth-only accounts are not given a fake password prompt", reauth.includes('status: "unsupported"') && accountActions.includes("supportsPasswordReauthentication(actor.user)"));
check("deletion reauthenticates password-capable accounts", accountActions.includes("verifyPasswordForSensitiveAction(actor.user, String(form.get(\"currentPassword\") ?? \"\"))"));
check("deletion still requires the explicit confirmation", accountActions.includes('!== "DELETE"'));
check("deletion accepts no user identifier", accountActions.includes("admin.auth.admin.deleteUser(actor.user.id, false)"));
check("password change no longer rotates the caller's session", !accountActions.includes("actor.supabase.auth.signInWithPassword"));
check("password change verifies through the isolated client", accountActions.includes("verifyPasswordForSensitiveAction(actor.user, currentPassword)"));

// --- Privacy-safe operational logging --------------------------------------
const logger = read("lib/observability/log.ts");
check("logging is server-only", logger.includes('import "server-only"'));
check("logging accepts scalar context only", logger.includes("Record<string, string | number | boolean>"));
check("JWT-shaped secrets are redacted", redactErrorSummary(new Error("failed with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmno")).includes("[redacted]"));
check("Supabase key shapes are redacted", redactErrorSummary("sb_secret_N7UND0UgjKTVKuodkm0Hg").includes("[redacted]"));
check("bearer tokens are redacted", redactErrorSummary("Authorization Bearer abc.def.ghi failed").includes("[redacted]"));
check("connection strings are redacted", redactErrorSummary("postgresql://postgres:pw@host/db unreachable").includes("[redacted]"));
check("log summaries are bounded", redactErrorSummary("x".repeat(5000)).length <= 200);
check("no private content field is logged anywhere", !/console\.(log|info|warn|error)\([^)]*\b(notes|answer_text|situation|document|private_notes)\b/.test([logger, accountActions, routes.export, routes.worker, read("lib/interview-reminders/worker.ts")].join("\n")));
check("operational failures are recorded for export", routes.export.includes("logServerOperationalFailure"));
check("operational failures are recorded for deletion", accountActions.includes('logServerOperationalFailure("account_deletion_failed"'));
check("operational failures are recorded for the reminder worker", routes.worker.includes('logServerOperationalFailure("reminder_worker_failed"'));

// --- Account feature gate --------------------------------------------------
check("the account platform stays opt-in", read(".env.example").includes("NEXT_PUBLIC_ACCOUNTS_ENABLED=false"));
check("server-only secrets are never NEXT_PUBLIC", !/NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|WORKER_SECRET)/.test(read(".env.example")));
check("the admin client is server-only", read("lib/supabase/admin.ts").includes('import "server-only"'));
check("the service-role key is read only on the server", !/SUPABASE_SERVICE_ROLE_KEY/.test(read("lib/account-platform.ts")));

const failed = checks.filter((entry) => !entry.ok);
if (failed.length) {
  console.error(`Production hardening regression failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
console.log(`Production hardening regression passed: ${checks.length}/${checks.length} header, capability, API, throttle, reauthentication, and logging checks.`);
