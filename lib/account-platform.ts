export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Account callback, recovery, and calendar links need an explicit production
 * HTTPS origin. Development may use a local origin, but production must never
 * silently manufacture one from a guessed domain or localhost fallback.
 */
export function isProductionSiteUrlConfigured() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (process.env.NODE_ENV !== "production") return true;
  if (!value) return false;
  try {
    const url = new URL(value);
    const localHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !localHostnames.has(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function areAccountsEnabled() {
  return process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "true";
}

export function isAccountPlatformAvailable() {
  return areAccountsEnabled() && isSupabaseConfigured() && isProductionSiteUrlConfigured();
}

export function isGoogleAuthEnabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}

export function isGitHubAuthEnabled() {
  return process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === "true";
}
