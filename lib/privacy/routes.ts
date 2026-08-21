/**
 * Canonical private-route classification.
 *
 * This module is the single source of truth for "is this route a private
 * authenticated surface?". Analytics suppression, robots exclusion, and the
 * Phase 9 privacy regressions all read from here so a future private route
 * cannot be added to one list and forgotten in another.
 *
 * Isomorphic on purpose: no server-only or browser-only imports.
 *
 * Classification rule
 * -------------------
 * A route is private when either is true:
 *
 *   1. The surface itself requires an account and has no public equivalent
 *      (dashboard, applications, settings, calendar, auth/recovery).
 *   2. Its URL path can contain a private identifier — an application, round,
 *      story, answer, or attempt UUID.
 *
 * A route stays public when its path only ever contains canonical public IDs
 * and it renders useful signed-out content, even if signed-in users see extra
 * private state layered onto it. The DSA library and the System Design problem
 * pages are the deliberate examples: `/dsa/questions/two-sum` is a public
 * canonical slug, so it stays indexable and measurable. Private context on
 * those routes travels in query strings, which the analytics layer strips.
 */

/** Static prefixes. A path matches when it equals the prefix or sits beneath it. */
export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/applications",
  "/auth",
  "/behavioral/questions",
  "/behavioral/stories",
  "/behavioral/workspace",
  "/calendar",
  "/dashboard",
  "/forgot-password",
  "/interview-playbook",
  "/interviews",
  "/onboarding",
  "/reset-password",
  "/settings",
  "/sign-in",
  "/sign-up",
  "/signin",
  "/signup",
  "/system-design/practice",
] as const;

/**
 * Private routes whose private segment sits below a public canonical segment.
 * `/system-design/problems/<public-slug>/practice/<private attempt UUID>` is
 * private even though `/system-design/problems/<public-slug>` is public.
 */
export const PRIVATE_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/system-design\/problems\/[^/]+\/practice(?:\/|$)/,
];

/**
 * Robots disallow entries. Static prefixes map directly; dynamic private
 * segments use the wildcard form major crawlers honor. Robots exclusion is
 * defense in depth and never a substitute for the auth guards.
 */
export const PRIVATE_ROBOTS_DISALLOW: readonly string[] = [
  ...PRIVATE_ROUTE_PREFIXES,
  "/system-design/problems/*/practice",
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True when the path is a private authenticated surface. */
export function isPrivateRoute(pathname: string) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return true;
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return (
    PRIVATE_ROUTE_PREFIXES.some((prefix) => matchesPrefix(path, prefix)) ||
    PRIVATE_ROUTE_PATTERNS.some((pattern) => pattern.test(path))
  );
}
