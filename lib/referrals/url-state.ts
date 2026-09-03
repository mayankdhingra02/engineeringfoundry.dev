export const referralModes = ["request", "referrer"] as const;

export type ReferralMode = (typeof referralModes)[number];

export const defaultReferralMode: ReferralMode = "request";

type SearchParamsSource = string | { toString(): string };

const referralModeValues = new Set<string>(referralModes);

function paramsFrom(source: SearchParamsSource) {
  return new URLSearchParams(typeof source === "string" ? source : source.toString());
}

export function parseReferralMode(source: SearchParamsSource): ReferralMode {
  const mode = paramsFrom(source).get("mode");
  return mode && referralModeValues.has(mode) ? mode as ReferralMode : defaultReferralMode;
}

export function serializeReferralMode(mode: ReferralMode) {
  const params = new URLSearchParams();
  params.set("mode", referralModeValues.has(mode) ? mode : defaultReferralMode);
  return params;
}

export function referralModeHref(pathname: string, mode: ReferralMode, hash = "") {
  return `${pathname}?${serializeReferralMode(mode).toString()}${hash.startsWith("#") ? hash : ""}`;
}
