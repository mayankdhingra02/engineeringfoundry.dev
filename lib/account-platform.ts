export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function areAccountsEnabled() {
  return process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "true";
}

export function isAccountPlatformAvailable() {
  return areAccountsEnabled() && isSupabaseConfigured();
}

export function isGoogleAuthEnabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}

export function isGitHubAuthEnabled() {
  return process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === "true";
}
