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
  "features/auth/auth-page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/onboarding/page.tsx",
  "app/dashboard/page.tsx",
  "app/settings/profile/page.tsx",
  "app/applications/page.tsx",
  "app/applications/new/page.tsx",
  "app/applications/[id]/page.tsx",
  "app/applications/[id]/edit/page.tsx",
  "app/applications/[id]/rounds/new/page.tsx",
  "app/applications/[id]/rounds/[roundId]/edit/page.tsx",
  "app/behavioral/workspace/page.tsx",
  "app/behavioral/questions/page.tsx",
  "app/behavioral/questions/new/page.tsx",
  "app/behavioral/questions/[questionId]/page.tsx",
  "app/behavioral/questions/[questionId]/edit/page.tsx",
  "app/behavioral/questions/[questionId]/answers/new/page.tsx",
  "app/behavioral/questions/[questionId]/answers/[answerId]/edit/page.tsx",
  "app/behavioral/stories/page.tsx",
  "app/behavioral/stories/new/page.tsx",
  "app/behavioral/stories/[id]/page.tsx",
  "app/behavioral/stories/[id]/edit/page.tsx",
]) {
  const source = read(file);
  requireText(source, "isAccountPlatformAvailable()", `${file} lacks the account availability guard.`);
  requireText(source, "<AccountUnavailable", `${file} lacks the intentional account-unavailable state.`);
}
for (const file of ["app/signin/page.tsx", "app/signup/page.tsx"]) {
  requireText(read(file), "AuthPage", `${file} does not use the shared guarded authentication surface.`);
}

const profile = read("app/u/[username]/page.tsx");
requireText(profile, "if (!isAccountPlatformAvailable()) return <AccountUnavailable", "Public profiles do not fail closed with an intentional unavailable state.");

for (const file of [
  "app/dsa/[...segments]/page.tsx",
  "app/system-design/[...segments]/page.tsx",
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
const header = read("components/header.tsx");
requireText(header, 'href="/prepare" aria-current=', "The desktop Prepare navigation item does not link to the preparation hub.");
prohibit(header, /<NavDropdown label="Prepare"/, "Prepare still opens a dropdown instead of navigating to the preparation hub.");
requireText(header, "mobileTriggerRef.current?.focus()", "The global mobile menu does not restore focus after Escape.");
requireText(header, 'aria-current={pathname.startsWith(item.href) ? "page" : undefined}', "Mobile navigation does not expose the current route.");
requireText(header, 'prepareActive ? "location" : undefined', "Primary preparation navigation does not expose the current region.");
const globalSearch = read("components/global-search.tsx");
const globalSearchIndex = read("lib/global-search.ts");
requireText(globalSearchIndex, "systemDesignLessons", "Global search is not using the current System Design curriculum index.");
prohibit(globalSearchIndex, /activeSystemDesignProblems|systemDesignConcepts/, "Global search still mixes legacy System Design routes into the current curriculum.");
requireText(globalSearch, "invokerRef.current", "Global search does not retain the actual opening control for focus restoration.");
requireText(globalSearch, 'if (open && event.key === "Escape") closeSearch();', "Global search must ignore Escape while closed so it cannot steal focus from the page.");
requireText(globalSearch, 'role="status" aria-live="polite"', "Global search result changes are not announced.");
requireText(globalSearch, 'document.body.style.overflow = "hidden"', "Global search does not lock background scrolling while modal.");
for (const [label, href] of [
  ["Interview Execution Guide", "/interview-tips"], ["Mock Interviews", "/mock-interviews"], ["Challenges", "/challenges"],
  ["Referrals", "/referrals"], ["Interview Experiences", "/interview-experiences"], ["Resources", "/resources"],
  ["Companies", "/companies"], ["Community", "/community"],
]) {
  if (!config.includes(`label: "${label}", href: "${href}"`)) failures.push(`Navigation lacks ${label} → ${href}.`);
}
if (config.indexOf('{ label: "Companies", href: "/companies" }') > config.indexOf("careerCommunityNav:")) failures.push("Company Guides are still categorized as a career/community surface instead of preparation.");

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
for (const route of ["/dashboard", "/applications", "/behavioral/workspace", "/behavioral/questions", "/behavioral/stories", "/onboarding", "/settings", "/signin", "/signup", "/forgot-password", "/reset-password"]) {
  if (sitemap.includes(`"${route}"`)) failures.push(`Sitemap includes private/auth route ${route}.`);
}
for (const route of ["/prepare", "/dsa", "/system-design/start-here/introduction", "/ml-design", "/behavioral", "/interview-tips", "/resources", "/mock-interviews", "/referrals", "/challenges", "/community", "/leaderboard", "/interview-experiences", "/companies", "/contact"]) {
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
prohibit(envExample, /NEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET_KEY|ACCESS_TOKEN)/i, ".env.example exposes a secret-only variable to browser code.");

// Phase 9 moved header definitions into lib/security/headers.ts and ended the
// deliberate Phase-8 deferral of HSTS and CSP. The full policy is asserted by
// scripts/test-production-hardening.mjs.
const nextConfig = read("next.config.ts");
const securityHeaders = read("lib/security/headers.ts");
requireText(nextConfig, "buildSecurityHeaders()", "next.config must apply the shared security header policy.");
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security", "Content-Security-Policy"]) {
  requireText(securityHeaders, header, `Missing baseline security header ${header}.`);
}

const analytics = read("lib/analytics.ts");
requireText(analytics, '"contact_channel_clicked"', "Contact analytics event is not registered.");
requireText(analytics, 'if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return false', "PostHog does not fail closed when unconfigured.");

for (const asset of ["public/og.png", "public/og-interview-prep.png", "public/favicon.svg"]) if (!existsSync(asset)) failures.push(`Referenced metadata asset is missing: ${asset}.`);

// Interview Playbook / Interview Execution Guide naming boundary. The private
// Playbook (/interview-playbook) and the public execution guide
// (/interview-tips) are permanently distinct products; only the guide belongs
// in public navigation, and only the Playbook belongs in the account menu.
requireText(config, 'label: "Interview Execution Guide", href: "/interview-tips"', "Public preparation navigation does not name the execution guide correctly.");
prohibit(config, /label: "Interview Playbook", href: "\/interview-tips"/, "Public preparation navigation still uses the old Playbook/execution-guide pairing.");
requireText(config, '"Interview Execution Guide", "/interview-tips"', "Public footer does not name the execution guide correctly.");
prohibit(config, /\/interview-playbook/, "Public navigation config links directly to the private Playbook route.");
for (const publicLabel of ["DSA", "System Design", "Companies", "ML Design", "Behavioral"]) {
  requireText(config, `label: "${publicLabel}"`, `Public preparation navigation lost its ${publicLabel} entry.`);
}

requireText(header, '"Interview Execution Guide":', "Header nav descriptions do not key off the execution-guide label.");
prohibit(header, /"Interview Playbook":/, "Header nav descriptions still key off the old Playbook label.");

const preparePage = read("app/prepare/page.tsx");
for (const expected of ["Interview Execution Guide", "Open the execution guide", "Round execution", "Recovery and validation", "Final-preparation checklists", '"/interview-tips"']) {
  requireText(preparePage, expected, `/prepare lacks expected execution-guide copy: ${expected}.`);
}
prohibit(preparePage, /href:\s*"\/interview-playbook"/, "/prepare links a card directly to the private Playbook route.");
if ((preparePage.match(/index:\s*"0[1-6]"/g) ?? []).length !== 6) failures.push("/prepare no longer has exactly six preparation-track indices.");

const interviewTipsPage = read("app/interview-tips/page.tsx");
requireText(interviewTipsPage, 'path: "/interview-tips"', "The public guide route changed.");
requireText(interviewTipsPage, "Software Engineering Interview Execution Guide", "The public guide page title was not renamed.");
requireText(interviewTipsPage, "<InterviewPlaybook />", "The public guide no longer renders the shared InterviewPlaybook component.");
prohibit(interviewTipsPage, /isAccountPlatformAvailable|requireMemberProfile|redirect\(/, "The public guide gained an authentication or redirect requirement.");
prohibit(interviewTipsPage, /interview-playbook\/queries/, "The public guide imports the private Playbook's query layer.");

const interviewPlaybookComponent = read("components/interview-playbook.tsx");
for (const expected of [
  "Software engineering interview execution guide",
  "Turn preparation into clear interview execution.",
  "Open the execution guide",
  "Open final-preparation checklists",
  "Round execution map",
  "Execution section",
  "Final-preparation checklists",
  'id="playbook"',
  'id="checklists"',
  "Session only — not saved",
  "useState",
  "interview_checklist_used",
  "interview_playbook_section_viewed",
]) requireText(interviewPlaybookComponent, expected, `Public execution-guide component lacks: ${expected}.`);
prohibit(interviewPlaybookComponent, /Run a readiness check/, "The public guide still frames its checklist as a readiness check.");
prohibit(interviewPlaybookComponent, /Interactive readiness checks/, "The public guide still labels its checklist section as readiness checks.");
prohibit(interviewPlaybookComponent, /readiness (score|assessment|evidence measured|level)/i, "The public guide implies its checklist measures readiness.");
prohibit(interviewPlaybookComponent, /^import.*supabase/im, "The public guide component imports a Supabase client.");
prohibit(interviewPlaybookComponent, /createSupabase|\.auth\.|\.from\(/i, "The public guide component calls a Supabase client.");
prohibit(interviewPlaybookComponent, /\.from\(\s*["']behavioral|checklist.*\.insert\(|checklist.*\.upsert\(/i, "The public guide component appears to persist checklist state.");

for (const expected of ['href="/interview-playbook"', "Interview Playbook"]) {
  requireText(accountControl, expected, `Signed-in account navigation lacks: ${expected}.`);
}
if ((accountControl.match(/href="\/interview-playbook"/g) ?? []).length < 2) {
  failures.push("The private Playbook link does not appear in both signed-in account-menu renderings.");
}
if (accountControl.indexOf('href="/dashboard" onClick={onNavigate}') === -1
  || accountControl.indexOf('href="/dashboard" onClick={onNavigate}') > accountControl.indexOf('href="/interview-playbook" onClick={onNavigate}')
  || accountControl.indexOf('href="/interview-playbook" onClick={onNavigate}') > accountControl.indexOf('href="/applications" onClick={onNavigate}')) {
  failures.push("The mobile account panel does not place Interview Playbook after Dashboard and before Applications.");
}
if (accountControl.indexOf("href=\"/dashboard\" onClick={() => setOpen(false)}") === -1
  || accountControl.indexOf('href="/dashboard" onClick={() => setOpen(false)}') > accountControl.indexOf('href="/interview-playbook" onClick={() => setOpen(false)}')
  || accountControl.indexOf('href="/interview-playbook" onClick={() => setOpen(false)}') > accountControl.indexOf('href="/applications" onClick={() => setOpen(false)}')) {
  failures.push("The desktop account menu does not place Interview Playbook after Dashboard and before Applications.");
}
for (const existingHref of ['href="/dashboard"', 'href="/applications"', 'href="/calendar"', 'href="/settings"']) {
  requireText(accountControl, existingHref, `Signed-in account navigation lost an existing link: ${existingHref}.`);
}
const signedOutBlockMatch = accountControl.match(/if \(!account\) \{[\s\S]*?\n {2}\}\n/);
if (signedOutBlockMatch && signedOutBlockMatch[0].includes("/interview-playbook")) {
  failures.push("The private Playbook link leaked into the signed-out account navigation.");
}

const privatePlaybookPage = read("app/interview-playbook/page.tsx");
for (const expected of ['requireMemberProfile("/interview-playbook")', "getInterviewPlaybookOverview(now)", "Your interview playbook", '"/interview-tips"']) {
  requireText(privatePlaybookPage, expected, `The private Playbook route unexpectedly lost: ${expected}.`);
}

if (failures.length) {
  console.error(`Public launch integrity regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Public launch integrity regression passed: account gating, contact truthfulness, navigation, sitemap, privacy, analytics, environment, metadata assets, and security invariants hold.");
