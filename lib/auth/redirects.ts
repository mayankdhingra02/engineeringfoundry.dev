const DEFAULT_DESTINATION = "/dashboard";

export function safeInternalPath(value: string | null | undefined, fallback = DEFAULT_DESTINATION) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, "https://engineeringfoundry.dev");
    if (parsed.origin !== "https://engineeringfoundry.dev") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function appendAuthEvent(path: string, method: string) {
  const safe = safeInternalPath(path);
  const url = new URL(safe, "https://engineeringfoundry.dev");
  url.searchParams.set("auth_event", "sign_in");
  url.searchParams.set("auth_method", method);
  return `${url.pathname}${url.search}${url.hash}`;
}
