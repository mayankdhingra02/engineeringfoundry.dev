import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const accountGate = read("lib/account-platform.ts");
requireText(accountGate, 'process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "true"', "Accounts must require an explicit true feature flag.");
requireText(accountGate, "areAccountsEnabled() && isSupabaseConfigured()", "Account availability must require both explicit enablement and Supabase configuration.");

for (const file of ["lib/supabase/client.ts", "lib/supabase/server.ts", "lib/supabase/proxy.ts"]) {
  requireText(read(file), "isAccountPlatformAvailable()", `${file} does not enforce the centralized account gate.`);
}

const accountControl = read("components/account-control.tsx");
requireText(accountControl, "if (!isAccountPlatformAvailable()) return null", "Header account controls are not hidden in public launch mode.");
requireText(read("app/layout.tsx"), "accountPlatformAvailable &&", "The global auth state bridge is not gated.");

for (const file of [
  "app/sign-in/page.tsx",
  "app/sign-up/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/onboarding/page.tsx",
  "app/dashboard/page.tsx",
  "app/settings/profile/page.tsx",
]) {
  const source = read(file);
  requireText(source, "isAccountPlatformAvailable()", `${file} lacks the account availability guard.`);
  requireText(source, "<AccountUnavailable", `${file} lacks the intentional account-unavailable state.`);
}

const profile = read("app/u/[username]/page.tsx");
requireText(profile, "if (!isAccountPlatformAvailable()) return <AccountUnavailable", "Public profiles do not fail closed with an intentional unavailable state.");

for (const file of [
  "app/dsa/[topic]/page.tsx",
  "app/system-design/[slug]/page.tsx",
  "app/ml-design/[slug]/page.tsx",
  "app/companies/[slug]/page.tsx",
  "app/interview-experiences/[company]/page.tsx",
  "app/challenges/[slug]/page.tsx",
]) requireText(read(file), "export const dynamicParams = false", `${file} can produce a soft 404 for an unknown finite-content slug.`);

const contact = read("app/contact/page.tsx");
prohibit(contact, /<form\b/i, "Contact still contains a disconnected form.");
prohibit(contact, /hello@engineeringfoundry\.dev/i, "Contact hard-codes an unverified mailbox.");
for (const expected of ["siteConfig.discordUrl", "siteConfig.githubIssuesUrl", 'event="contact_channel_clicked"']) requireText(contact, expected, `Contact lacks ${expected}.`);
for (const privateProperty of ["name:", "email:", "message:", "subject:"]) prohibit(contact, new RegExp(`properties=\\{\\{[^}]*${privateProperty}`, "i"), `Contact analytics includes private property ${privateProperty}`);

const config = read("config/site.ts");
requireText(config, "NEXT_PUBLIC_CONTACT_EMAIL", "Contact email is not optional environment configuration.");
requireText(config, "githubIssuesUrl", "GitHub Issues is not centrally configured.");
for (const [label, href] of [
  ["Interview Playbook", "/interview-tips"], ["Mock Interviews", "/mock-interviews"], ["Challenges", "/challenges"],
  ["Referrals", "/referrals"], ["Interview Experiences", "/interview-experiences"], ["Resources", "/resources"],
  ["Companies", "/companies"], ["Community", "/community"],
]) {
  if (!config.includes(`label: "${label}", href: "${href}"`)) failures.push(`Navigation lacks ${label} → ${href}.`);
}

const productionFiles = [];
for (const directory of ["app", "components", "config"]) {
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const item = path.join(current, entry.name);
      if (entry.isDirectory()) visit(item);
      else if (/\.(?:ts|tsx)$/.test(entry.name)) productionFiles.push(item);
    }
  };
  visit(directory);
}
const productionSource = productionFiles.map(read).join("\n");
for (const artifact of ["Demo User", "Founder story placeholder", "Contributors placeholder", "Demo resource", "Placeholder description"]) prohibit(productionSource, new RegExp(artifact, "i"), `Launch-facing artifact remains: ${artifact}.`);
prohibit(productionSource, /hello@engineeringfoundry\.dev/i, "Production UI contains the unverified hello@ mailbox.");
prohibit(productionSource, /lastModified\s*:\s*new Date\s*\(/, "Metadata contains fake request-time freshness.");

const sitemap = read("app/sitemap.ts");
for (const route of ["/dashboard", "/onboarding", "/settings", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"]) {
  if (sitemap.includes(`"${route}"`)) failures.push(`Sitemap includes private/auth route ${route}.`);
}
for (const route of ["/dsa", "/system-design", "/ml-design", "/behavioral", "/interview-tips", "/resources", "/mock-interviews", "/referrals", "/challenges", "/community", "/leaderboard", "/interview-experiences", "/companies", "/contact"]) {
  if (!sitemap.includes(`"${route}"`)) failures.push(`Sitemap omits substantive public route ${route}.`);
}

for (const file of [
  "components/mock-interview-lab.tsx",
  "features/referrals/referral-workspace.tsx",
  "features/challenges/challenge-workspace.tsx",
  "features/interview-experiences/experience-builder.tsx",
]) {
  const source = read(file);
  prohibit(source, /(?:localStorage|sessionStorage)\s*\.(?:getItem|setItem|removeItem|clear)|(?:indexedDB|IndexedDB)\s*\.|createSupabase|supabase\s*\./, `${file} violates its browser-memory-only draft boundary.`);
}

const envExample = read(".env.example");
requireText(envExample, "NEXT_PUBLIC_ACCOUNTS_ENABLED=false", ".env.example does not default accounts to disabled.");
requireText(envExample, "NEXT_PUBLIC_CONTACT_EMAIL=", ".env.example does not document optional contact email.");
prohibit(envExample, /SERVICE_ROLE|SECRET_KEY|ACCESS_TOKEN/i, ".env.example contains a secret-only variable.");

const nextConfig = read("next.config.ts");
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) requireText(nextConfig, header, `Missing baseline security header ${header}.`);
prohibit(nextConfig, /Strict-Transport-Security|Content-Security-Policy/, "Deferred deployment-sensitive security policy was added prematurely.");

const analytics = read("lib/analytics.ts");
requireText(analytics, '"contact_channel_clicked"', "Contact analytics event is not registered.");
requireText(analytics, 'if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return false', "PostHog does not fail closed when unconfigured.");

for (const asset of ["public/og.png", "public/og-interview-prep.png", "public/favicon.svg"]) if (!existsSync(asset)) failures.push(`Referenced metadata asset is missing: ${asset}.`);

if (failures.length) {
  console.error(`Public launch integrity regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Public launch integrity regression passed: account gating, contact truthfulness, navigation, sitemap, privacy, analytics, environment, metadata assets, and security invariants hold.");
