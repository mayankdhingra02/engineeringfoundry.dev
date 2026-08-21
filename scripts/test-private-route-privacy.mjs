/**
 * Phase 9 privacy regression.
 *
 * Discovers private routes from the filesystem rather than from a maintained
 * list, so adding an authenticated surface without classifying it fails here
 * instead of silently sending private identifiers to analytics.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  isPrivateAnalyticsPropertyName,
  isPrivateAnalyticsValue,
  sanitizeAnalyticsProperties,
} from "../lib/privacy/analytics-properties.ts";
import { PRIVATE_ROBOTS_DISALLOW, PRIVATE_ROUTE_PREFIXES, isPrivateRoute } from "../lib/privacy/routes.ts";

const checks = [];
const check = (name, ok) => checks.push({ name, ok: Boolean(ok) });
const read = (path) => readFileSync(path, "utf8");
const SAMPLE_UUID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

/** Walk app/ collecting page.tsx files. */
function collectPages(directory, found = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) collectPages(path, found);
    else if (entry === "page.tsx") found.push(path);
  }
  return found;
}

/** app/interviews/[roundId]/prepare/page.tsx -> /interviews/[roundId]/prepare */
function routeForPage(path) {
  const segments = relative("app", path).replace(/\/page\.tsx$/, "").split("/").filter((segment) => !/^\(.*\)$/.test(segment));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

/** Substitute a private-looking identifier for each dynamic segment. */
function concreteRoute(route) {
  return route.replace(/\[\[?\.\.\.[^\]]+\]\]?/g, SAMPLE_UUID).replace(/\[[^\]]+\]/g, SAMPLE_UUID);
}

const pages = collectPages("app");
const guarded = pages.filter((path) => {
  const source = read(path);
  return source.includes("requireMemberProfile(") || source.includes("requireAuthenticatedUser(");
});

check("private pages were discovered from the filesystem", guarded.length >= 25);

// 1. Every guarded page is classified private.
const unclassified = guarded.map(routeForPage).filter((route) => !isPrivateRoute(concreteRoute(route)));
check(
  `every guarded route is classified private${unclassified.length ? ` (missing: ${unclassified.join(", ")})` : ""}`,
  unclassified.length === 0,
);

// 2. Every guarded page is excluded from indexing.
const indexable = guarded.filter((path) => !read(path).includes("robots: { index: false, follow: false }"));
check(
  `every guarded page declares noindex metadata${indexable.length ? ` (missing: ${indexable.join(", ")})` : ""}`,
  indexable.length === 0,
);

// 3. Routes that carry a private identifier in the path are classified private.
for (const route of [
  "/interviews/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/prepare",
  "/applications/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "/applications/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/rounds/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/edit",
  "/behavioral/stories/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "/behavioral/questions/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/answers/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/edit",
  "/system-design/problems/url-shortener/practice/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "/calendar",
  "/dashboard",
  "/settings/privacy",
  "/onboarding",
  "/system-design/practice",
  "/interview-playbook",
]) {
  check(`private: ${route}`, isPrivateRoute(route));
}

// 4. Public learning content stays measurable and indexable.
for (const route of [
  "/",
  "/dsa",
  "/dsa/questions",
  "/dsa/questions/two-sum",
  "/dsa/practice",
  "/dsa/companies/google",
  "/system-design",
  "/system-design/problems",
  "/system-design/problems/url-shortener",
  "/system-design/start-here/introduction",
  "/behavioral",
  "/companies/amazon",
  "/prepare",
  "/interview-experiences/google",
  "/u/some-public-username",
  "/resources",
  "/interview-tips",
  "/interview-tips/rounds",
  "/interview-tips/rounds/algorithmic-coding",
]) {
  check(`public: ${route}`, !isPrivateRoute(route));
}

// 5. Robots exclusion matches the classification.
const robots = read("app/robots.ts");
check("robots.ts derives its disallow list from the canonical module", robots.includes("PRIVATE_ROBOTS_DISALLOW"));
check("robots.ts declares no inline private-route literals", !/disallow:\s*\[\s*"/.test(robots));
check(
  "robots disallow covers every static private prefix",
  PRIVATE_ROUTE_PREFIXES.every((prefix) => PRIVATE_ROBOTS_DISALLOW.includes(prefix)),
);
check(
  "robots disallow covers the System Design attempt editor",
  PRIVATE_ROBOTS_DISALLOW.includes("/system-design/problems/*/practice"),
);

// 6. One canonical classification: no second private-route array anywhere.
const analytics = read("lib/analytics.ts");
check("analytics delegates classification to the canonical module", analytics.includes('from "@/lib/privacy/routes"'));
check("analytics declares no private-route array of its own", !analytics.includes("PRIVATE_ANALYTICS_PATH_PREFIXES"));

// 7. The sitemap never lists a private route.
const sitemapRoutes = [...read("app/sitemap.ts").matchAll(/"(\/[^"]*)"/g)].map((match) => match[1]);
const leaked = sitemapRoutes.filter((route) => route && isPrivateRoute(route));
check(`sitemap lists no private route${leaked.length ? ` (found: ${leaked.join(", ")})` : ""}`, leaked.length === 0);

// 8. Private content must not reach analytics properties.
for (const name of ["notes", "private_notes", "answer_text", "situation", "task", "action", "result", "document", "went_well", "story_id", "round_id", "application_id", "attempt_id"]) {
  check(`analytics denies property "${name}"`, isPrivateAnalyticsPropertyName(name));
}
check("analytics denies case-insensitive private names", isPrivateAnalyticsPropertyName("Private_Notes"));
check("analytics denies a private row UUID value", isPrivateAnalyticsValue(SAMPLE_UUID));
check("analytics denies a UUID embedded in a longer value", isPrivateAnalyticsValue(`/interviews/${SAMPLE_UUID}/prepare`));
check("analytics denies prose-length values", isPrivateAnalyticsValue("x".repeat(257)));
check("analytics allows ordinary labels", !isPrivateAnalyticsValue("two-sum") && !isPrivateAnalyticsPropertyName("difficulty"));
check("analytics allows counts", !isPrivateAnalyticsValue(42));

const sanitized = sanitizeAnalyticsProperties({
  difficulty: "Medium",
  question_id: "two-sum",
  notes: "My private solution note",
  round_id: SAMPLE_UUID,
  answer_text: "Situation: at my last company...",
});
check("sanitizer keeps safe properties", sanitized?.difficulty === "Medium" && sanitized?.question_id === "two-sum");
check("sanitizer removes every private property", sanitized && !("notes" in sanitized) && !("round_id" in sanitized) && !("answer_text" in sanitized));
check("sanitizer returns undefined when nothing survives", sanitizeAnalyticsProperties({ notes: "private" }) === undefined);

// 9. The capture paths apply the guard.
check("track() sanitizes properties", analytics.includes("posthog.capture(event, sanitizeAnalyticsProperties(sanitizeP09AnalyticsProperties(event, properties)))"));
check("identify() sanitizes properties", analytics.includes("posthog.identify(id, sanitizeAnalyticsProperties(properties))"));
check("before_send applies the private-content guard", analytics.includes("isPrivateAnalyticsPropertyName(name)") && analytics.includes("isPrivateAnalyticsValue(value)"));
check("private pageviews are suppressed", analytics.includes('event.event === "$pageview" && privateContext'));
check("pageview capture rejects private paths", analytics.includes("isPrivateAnalyticsPath(safeUrl.pathname)"));

// 10. Classification fails closed on malformed input.
check("unknown/relative paths are treated as private", isPrivateRoute("not-a-path") && isPrivateRoute(""));
check("trailing slashes do not defeat classification", isPrivateRoute("/dashboard/"));

const failed = checks.filter((entry) => !entry.ok);
if (failed.length) {
  console.error(`Private-route privacy regression failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
console.log(`Private-route privacy regression passed: ${checks.length}/${checks.length} classification, indexing, and analytics-content checks across ${guarded.length} guarded routes.`);
