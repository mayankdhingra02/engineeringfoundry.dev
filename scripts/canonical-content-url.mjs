const hasForbiddenUrlCharacter = (value) => Array.from(value).some((character) => {
  const codePoint = character.codePointAt(0);
  return character === "\\" || /\s/u.test(character) || codePoint <= 0x1f || codePoint >= 0x7f && codePoint <= 0x9f;
});

const failure = (reason) => ({ ok: false, reason });

/**
 * Validate a deterministic, network-free external content URL.
 *
 * `allowedHostnames`, when supplied, must be an iterable of exact lowercase
 * hostnames. Subdomains and suffix matches are intentionally not inferred.
 */
export function validateCanonicalHttpsUrl(value, { allowedHostnames } = {}) {
  if (typeof value !== "string") return failure("must be a string");
  if (!value.startsWith("https://")) return failure("must use exact https:// form");
  if (hasForbiddenUrlCharacter(value)) return failure("must not contain whitespace, control characters, or backslashes");

  let url;
  try {
    url = new URL(value);
  } catch {
    return failure("must be a valid URL");
  }

  if (url.protocol !== "https:") return failure("must use exact https:// form");
  if (url.username || url.password) return failure("must not contain URL credentials");
  if (url.port) return failure("must not contain a port");
  if (url.hostname.endsWith(".")) return failure("must not use a trailing-dot hostname");
  if (url.href !== value) return failure("must use its canonical serialized form");

  if (allowedHostnames !== undefined) {
    const approvedHostnames = new Set(allowedHostnames);
    if (!approvedHostnames.has(url.hostname)) return failure("must use an approved exact source hostname");
  }

  return { ok: true, url };
}
