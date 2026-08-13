import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspacePath = path.join(projectRoot, "features/referrals/referral-workspace.tsx");
const source = await readFile(workspacePath, "utf8");
const errors = [];

for (const forbidden of ["localStorage", "sessionStorage", "indexedDB", "supabase"]) {
  if (source.toLowerCase().includes(forbidden.toLowerCase())) errors.push(`Referral UI must not reference ${forbidden}.`);
}

const allowedEvents = new Set([
  "referral_builder_opened",
  "referral_packet_copied",
  "referral_draft_cleared",
  "referrer_toolkit_opened",
  "referrer_card_copied",
  "referral_community_clicked",
]);
const allowedProperties = new Set(["mode", "packet_type", "availability", "placement"]);
const trackCalls = [...source.matchAll(/track\(\s*"([^"]+)"\s*,\s*\{([^}]*)\}\s*\)/g)];

if (trackCalls.length < 6) errors.push("Expected all referral analytics calls to be present and statically inspectable.");
for (const call of trackCalls) {
  const [, event, properties] = call;
  if (!allowedEvents.has(event)) errors.push(`Unexpected referral analytics event '${event}'.`);
  const keys = [...properties.matchAll(/(?:^|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((match) => match[1]);
  for (const key of keys) if (!allowedProperties.has(key)) errors.push(`Analytics property '${key}' is not allowed.`);
  if (/requestDraft|company|jobTitle|jobUrl|jobId|location|introduction|roleFit|experience|linkedinUrl|portfolioUrl|resumeUrl|preferences|bio/.test(properties)) {
    errors.push(`Analytics event '${event}' appears to include a form value.`);
  }
}

if (!source.includes("`/referrals?mode=${nextMode}`")) errors.push("Referral mode URL must use the fixed mode-only query shape.");
if (/URLSearchParams|searchParams\.set|history\.(?:pushState|replaceState)[^\n]*(?:company|job|intro|resume|bio)/.test(source)) errors.push("Personal draft values must not be written to the URL.");
if (/\b(?:send referral|submit request|create referrer profile)\b/i.test(source)) errors.push("Referral UI must not imply that it sends or submits requests or creates profiles.");

if (errors.length) {
  console.error(`Referral privacy regression failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Referral privacy regression passed: ${trackCalls.length} analytics calls use safe properties and no draft persistence was found.`);
}
