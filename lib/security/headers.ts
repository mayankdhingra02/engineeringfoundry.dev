/**
 * Production security headers.
 *
 * Imported by `next.config.ts` at build time and by the Phase 9 header
 * regression, so the policy has exactly one definition.
 *
 * ## Why this CSP allows `'unsafe-inline'` for scripts
 *
 * Engineering Foundry statically generates the great majority of its pages.
 * A nonce-based CSP requires generating a per-request nonce in the proxy, which
 * opts every page into dynamic rendering — it would convert a mostly-static
 * curriculum site into a fully dynamic one for a security control that is not
 * the real boundary here. Next.js also injects its own inline bootstrap and
 * streaming payload scripts, which have no stable hash.
 *
 * So this is a deliberately *enforced baseline* rather than a strict policy:
 *
 *   - `script-src` keeps `'unsafe-inline'`. It is not the XSS boundary. React's
 *     escaping and the absence of `dangerouslySetInnerHTML` on user content are.
 *   - The directives that do carry weight here are enforced strictly:
 *     `frame-ancestors 'none'` stops clickjacking of the authenticated
 *     workspace, `base-uri 'self'` stops base-tag injection, `form-action 'self'`
 *     stops a form posting credentials to another origin, `object-src 'none'`
 *     removes plugin surface, and `connect-src` restricts where a script could
 *     exfiltrate private preparation data to.
 *
 * Report-only was considered and rejected: with no error-monitoring vendor in
 * this project there is nowhere to send violation reports, so a report-only
 * policy would produce no signal and no protection.
 */

export type SecurityHeader = { key: string; value: string };

/** PostHog is only contacted when analytics is actually configured. */
function analyticsOrigin() {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  try {
    return new URL(host).origin;
  } catch {
    return null;
  }
}

/** The configured Supabase project is the only permitted API destination. */
function supabaseOrigin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(isDevelopment = process.env.NODE_ENV !== "production") {
  const analytics = analyticsOrigin();
  const supabase = supabaseOrigin();

  const connect = ["'self'", supabase, analytics].filter(Boolean) as string[];
  // Supabase realtime is not used today, but a cookie-session refresh uses the
  // same origin, so the websocket scheme is permitted for the project only.
  if (supabase) connect.push(supabase.replace(/^https:/, "wss:"));
  // Next.js dev uses eval for hot module replacement and a websocket for HMR.
  const script = ["'self'", "'unsafe-inline'", analytics, isDevelopment ? "'unsafe-eval'" : null].filter(Boolean) as string[];
  if (isDevelopment) connect.push("ws:", "http://localhost:*");

  const directives: Record<string, string[] | null> = {
    "default-src": ["'self'"],
    // Mermaid injects a style block into the SVG it renders, and Next.js emits
    // inline critical CSS, so inline styles are required.
    "style-src": ["'self'", "'unsafe-inline'"],
    "script-src": script,
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": isDevelopment ? null : [],
  };

  return Object.entries(directives)
    .filter(([, value]) => value !== null)
    .map(([name, value]) => (value!.length ? `${name} ${value!.join(" ")}` : name))
    .join("; ");
}

export function buildSecurityHeaders(isDevelopment = process.env.NODE_ENV !== "production"): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDevelopment) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Defense in depth for user agents that predate frame-ancestors.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=(), interest-cohort=()",
    },
  ];

  // Browsers ignore HSTS over plain HTTP, but omitting it in development keeps
  // localhost from being pinned to HTTPS on a shared machine.
  if (!isDevelopment) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }

  return headers;
}
