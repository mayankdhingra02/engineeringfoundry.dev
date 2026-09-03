export type ProfileLinkPlatform = "github" | "linkedin";

export const PROFILE_LINK_MAX_LENGTH = 500;

const platformConfig = {
  github: {
    canonicalHostname: "github.com",
    error: "GitHub URL must use https://github.com.",
    hostnames: new Set(["github.com", "www.github.com"]),
  },
  linkedin: {
    canonicalHostname: "www.linkedin.com",
    error: "LinkedIn URL must use https://www.linkedin.com.",
    hostnames: new Set(["linkedin.com", "www.linkedin.com"]),
  },
} as const satisfies Record<ProfileLinkPlatform, {
  canonicalHostname: string;
  error: string;
  hostnames: ReadonlySet<string>;
}>;

type InspectedProfileLink =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "valid"; value: string };

function containsControlCharacter(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 31 || (codePoint >= 127 && codePoint <= 159))) return true;
  }
  return false;
}

function inspectProfileLinkUrl(platform: ProfileLinkPlatform, value: unknown): InspectedProfileLink {
  if (value === null || value === undefined) return { status: "empty" };
  if (typeof value !== "string") return { status: "invalid" };
  if (value.length > PROFILE_LINK_MAX_LENGTH || containsControlCharacter(value)) return { status: "invalid" };

  const normalized = value.trim();
  if (!normalized) return { status: "empty" };
  if (!/^https:\/\//i.test(normalized) || normalized.includes("\\")) return { status: "invalid" };

  try {
    const parsed = new URL(normalized);
    const config = platformConfig[platform];
    if (
      parsed.protocol !== "https:"
      || parsed.username !== ""
      || parsed.password !== ""
      || parsed.port !== ""
      || !config.hostnames.has(parsed.hostname)
    ) {
      return { status: "invalid" };
    }

    parsed.hostname = config.canonicalHostname;
    parsed.search = "";
    parsed.hash = "";
    const canonical = parsed.toString();
    return canonical.length <= PROFILE_LINK_MAX_LENGTH
      ? { status: "valid", value: canonical }
      : { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

export function canonicalizeProfileLinkUrl(platform: ProfileLinkPlatform, value: unknown): string | null {
  const inspected = inspectProfileLinkUrl(platform, value);
  return inspected.status === "valid" ? inspected.value : null;
}

export function parseOptionalProfileLink(platform: ProfileLinkPlatform, value: unknown): { value: string | null; error?: string } {
  const inspected = inspectProfileLinkUrl(platform, value);
  if (inspected.status === "empty") return { value: null };
  if (inspected.status === "invalid") return { value: null, error: platformConfig[platform].error };
  return { value: inspected.value };
}

export function sanitizePublicProfileLinks<T extends { github_url: string | null; linkedin_url: string | null }>(profile: T): T {
  return {
    ...profile,
    github_url: canonicalizeProfileLinkUrl("github", profile.github_url),
    linkedin_url: canonicalizeProfileLinkUrl("linkedin", profile.linkedin_url),
  };
}
