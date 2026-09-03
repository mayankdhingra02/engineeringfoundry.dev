import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  defaultReferralMode,
  parseReferralMode,
  referralModeHref,
  serializeReferralMode,
} from "../lib/referrals/url-state.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspacePath = path.join(projectRoot, "features/referrals/referral-workspace.tsx");
const source = await readFile(workspacePath, "utf8");
const errors = [];

assertReferralMode("mode=request", "request");
assertReferralMode("mode=referrer", "referrer");
for (const sourceValue of ["", "mode=", "mode=other", "mode=Referrer", "mode=request%20", "mode=referrer&mode=request"]) {
  assertReferralMode(sourceValue, sourceValue === "mode=referrer&mode=request" ? "referrer" : defaultReferralMode);
}
assertReferralMode("mode=invalid&mode=referrer", defaultReferralMode);

if (serializeReferralMode("request").toString() !== "mode=request") errors.push("Request mode must serialize to the exact canonical query.");
if (serializeReferralMode("referrer").toString() !== "mode=referrer") errors.push("Referrer mode must serialize to the exact canonical query.");
if (serializeReferralMode("invalid").toString() !== "mode=request") errors.push("Runtime-invalid mode serialization must fail closed to request.");

const privateAndForeign = "mode=referrer&company=Private+Company&jobUrl=https%3A%2F%2Fprivate.test&resumeUrl=https%3A%2F%2Ffiles.test%2Fresume&token=secret&utm_source=private";
const canonicalPrivateInput = referralModeHref("/referrals", parseReferralMode(privateAndForeign));
if (canonicalPrivateInput !== "/referrals?mode=referrer") errors.push("Canonical referral URLs must exclude all private and foreign query fields.");
if (/[?&](?:company|jobUrl|resumeUrl|token|utm_source)=/.test(canonicalPrivateInput)) errors.push("Canonical referral URL retained a private or foreign query field.");
if (referralModeHref("/referrals", "request") !== "/referrals?mode=request") errors.push("Direct request canonicalization is not deterministic.");
if (referralModeHref("/referrals", "referrer", "#availability") !== "/referrals?mode=referrer#availability") errors.push("Referral mode href must preserve an existing hash fragment.");
if (referralModeHref("/referrals", "referrer", "availability") !== "/referrals?mode=referrer") errors.push("Referral mode href must not manufacture a fragment from arbitrary text.");

let deterministicMode = parseReferralMode("mode=request");
const referrerHref = referralModeHref("/referrals", "referrer", "#tool");
deterministicMode = parseReferralMode(new URL(referrerHref, "https://engineeringfoundry.test").search);
const requestHref = referralModeHref("/referrals", "request", new URL(referrerHref, "https://engineeringfoundry.test").hash);
deterministicMode = parseReferralMode(new URL(requestHref, "https://engineeringfoundry.test").search);
if (referrerHref !== "/referrals?mode=referrer#tool" || requestHref !== "/referrals?mode=request#tool" || deterministicMode !== "request") errors.push("Request to referrer to request history state is not deterministic.");

function assertReferralMode(sourceValue, expected) {
  const actual = parseReferralMode(sourceValue);
  if (actual !== expected) errors.push(`Referral mode '${sourceValue}' resolved to '${actual}' instead of '${expected}'.`);
}

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

for (const helper of ["parseReferralMode", "referralModeHref"]) if (!source.includes(helper)) errors.push(`Referral workspace must use the production ${helper} helper.`);
if (/searchParams\.get\(["']mode["']\)/.test(source)) errors.push("Referral workspace must not duplicate mode parsing outside the production helper.");
if (!source.includes("useMemo(() => parseReferralMode(queryString), [queryString])")) errors.push("Rendered referral mode must derive from the current URL query.");
const canonicalizationBlock = source.slice(source.indexOf("const canonicalHref = referralModeHref"), source.indexOf("}, [mode, pathname, queryString]);"));
if (!canonicalizationBlock.includes("canonicalHref !== currentHref") || !canonicalizationBlock.includes("window.history.replaceState")) errors.push("Invalid, missing, or foreign referral queries must be guarded and canonicalized with replaceState.");
const changeModeBlock = source.slice(source.indexOf("function changeMode"), source.indexOf("function updateRequest"));
if (!changeModeBlock.includes("nextHref === currentHref") || !changeModeBlock.includes("window.history.pushState")) errors.push("Explicit referral mode switches must use a guarded browser-history push.");
if (!source.includes('window.addEventListener("popstate"')) errors.push("Referral workspace must restore mode on Back and Forward navigation.");
if (!source.includes('window.removeEventListener("popstate"')) errors.push("Referral workspace must clean up its Back and Forward listener.");
const historyFocusBlock = source.slice(source.indexOf("function recoverModeFocusAfterHistory"), source.indexOf('window.addEventListener("popstate"'));
for (const marker of ["previousPanel?.contains(previousFocus)", "requestAnimationFrame", "focusIsUnclaimed", "selectedModeButton?.isConnected", "selectedModeButton.focus()", "cancelAnimationFrame"]) {
  if (!historyFocusBlock.includes(marker)) errors.push(`Referral Back and Forward focus recovery is missing its ${marker} guard.`);
}
if (/\btrack\(/.test(historyFocusBlock)) errors.push("Referral Back and Forward history recovery must not emit analytics.");
for (const draftSetter of ["setRequestDraft", "setReferrerDraft", "setRequestGenerated", "setCardGenerated", "setRequestChecks", "setReviewChecks"]) {
  if (changeModeBlock.includes(draftSetter) || historyFocusBlock.includes(draftSetter)) errors.push(`Referral history mode changes must preserve private draft state instead of calling ${draftSetter}.`);
}
for (const panelState of ['id="referral-request-panel"', 'hidden={mode !== "request"}', 'id="referral-referrer-panel"', 'hidden={mode !== "referrer"}']) {
  if (!source.includes(panelState)) errors.push(`Referral workspace must keep both private draft panels mounted: ${panelState}.`);
}
if (/key=\{(?:mode|initialMode)\}/.test(source)) errors.push("Referral mode changes must not remount the workspace and discard private drafts.");
if (/URLSearchParams|searchParams\.set|history\.(?:pushState|replaceState)[^\n]*(?:company|job|intro|resume|bio)/.test(source)) errors.push("Personal draft values must not be written to the URL.");
if (/\b(?:send referral|submit request|create referrer profile)\b/i.test(source)) errors.push("Referral UI must not imply that it sends or submits requests or creates profiles.");

if (errors.length) {
  console.error(`Referral privacy regression failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Referral privacy regression passed: ${trackCalls.length} analytics calls use safe properties and no draft persistence was found.`);
}
