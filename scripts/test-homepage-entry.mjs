import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSystemDesignContinuation } from "../lib/home-continuation.ts";
import { homeCoreTracks, homeSupportingTracks } from "../lib/home-track-catalog.ts";

const lessons = [
  { id: "introduction", title: "Introduction", href: "/system-design/start-here/introduction", kind: "lesson" },
  { id: "requirements", title: "Requirements", href: "/system-design/start-here/requirements", kind: "lesson" },
  { id: "problem-url-shortener", title: "URL Shortener", href: "/system-design/url-shortener", kind: "practice" },
];

assert.equal(getSystemDesignContinuation({}, lessons), null, "empty progress must not create a fake continuation");
assert.deepEqual(
  getSystemDesignContinuation({ "topic:introduction": "completed" }, lessons),
  { title: "Requirements", href: "/system-design/start-here/requirements", context: "1 lesson complete in this browser.", completedCount: 1 },
  "completed lessons should lead to the next available lesson",
);
assert.deepEqual(
  getSystemDesignContinuation({ "practice:url-shortener": "in-progress" }, lessons),
  { title: "URL Shortener", href: "/system-design/url-shortener", context: "A saved practice session is in progress in this browser.", completedCount: 0 },
  "in-progress practice should be the primary continuation",
);
assert.equal(getSystemDesignContinuation({ "topic:introduction": "unexpected" }, lessons), null, "unknown statuses must be ignored");

const homepage = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const entryExperience = readFileSync(new URL("../components/home-entry-experience.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
assert.match(homepage, /What should you prepare next\?/);
assert.match(homepage, /Search topics, questions, or companies/);
assert.match(homepage, /import \{ cookies \} from "next\/headers"/, "homepage must read the deletion proof from the server request");
assert.match(homepage, /accountDeletionProofCookieName, isAccountDeletionProof/, "homepage must use the shared deletion-proof contract");
assert.match(homepage, /isAccountDeletionProof\([\s\S]*\(await cookies\(\)\)\.get\(accountDeletionProofCookieName\)\?\.value,[\s\S]*process\.env\.SUPABASE_SERVICE_ROLE_KEY \?\? ""[\s\S]*\)/, "homepage must validate the exact signed, expiring proof cookie with the server-only secret");
assert.doesNotMatch(homepage, /searchParams|\.account\s*===\s*["']deleted["']/, "query parameters alone must never prove account deletion");
assert.match(homepage, /accountDeleted && <div className="account-deleted-notice" role="status">/, "verified account deletion must retain its accessible status notice");
assert.match(homepage, /Your authentication identity and account-owned records were removed\. Previously submitted feedback remains private operational data with its account link removed\./, "account deletion notice must distinguish deleted owner data from retained de-linked feedback");
assert.deepEqual(homeCoreTracks.map((track) => track.href), ["/dsa", "/system-design/start-here/introduction", "/ml-design", "/behavioral"], "homepage core tracks must match the master blueprint");
assert.deepEqual(homeSupportingTracks.map((track) => track.href), ["/low-level-design", "/companies", "/interview-tips"], "supporting preparation tracks must remain directly discoverable");
assert.match(entryExperience, /homeCoreTracks\.map[\s\S]*className="home-track-link"/, "core track data must render as direct links");
assert.match(entryExperience, /homeSupportingTracks\.map[\s\S]*<Link href=\{track\.href\}/, "supporting track data must render as direct links");
assert.ok(!homepage.includes("1,000+ community members"), "homepage must not use community-size marketing proof in its entry hierarchy");
assert.match(entryExperience, /More interview tracks/, "specialized interview tracks should remain visible without disclosure");
assert.doesNotMatch(`${homepage}\n${entryExperience}`, /<details|Show two more preparation tools/, "preparation tracks must not be hidden behind a disclosure");

for (const marker of [
  "AccountPreparationContinuationState",
  "normalizeAccountPreparationContinuationResponse",
  "createUnavailableAccountPreparationContinuationState",
  "accountState",
  "accountRequestPending",
  "mountedRef",
  "accountRequestIdRef",
  "accountRequestPendingRef",
  "retryButtonRef",
  "recoverFocusAfterRetryRef",
  "focusFrameRef",
  "continuationHeadingRef",
  "trackHeadingRef",
  "loadAccountProgress",
]) {
  assert.ok(entryExperience.includes(marker), `account continuation client contract is missing ${marker}`);
}
assert.match(
  entryExperience,
  /const parsed = normalizeAccountPreparationContinuationResponse\(payload\);[\s\S]*const nextState = response\.ok && parsed[\s\S]*createUnavailableAccountPreparationContinuationState\(\)/,
  "non-OK or malformed continuation responses must resolve unavailable rather than signed-out/empty",
);
assert.match(
  entryExperience,
  /catch \{[\s\S]*requestId !== accountRequestIdRef\.current[\s\S]*setAccountState\(createUnavailableAccountPreparationContinuationState\(\)\)/,
  "continuation network failures must settle as unavailable only for the current mounted request",
);
assert.match(entryExperience, /if \(!mountedRef\.current \|\| accountRequestPendingRef\.current\) return;/, "account continuation loading must reject unmounted or duplicate requests");
assert.ok((entryExperience.match(/requestId !== accountRequestIdRef\.current/g) ?? []).length >= 2, "success and failure settlement must both reject stale account requests");
assert.match(entryExperience, /return \(\) => \{[\s\S]*mountedRef\.current = false;[\s\S]*accountRequestIdRef\.current \+= 1;[\s\S]*cancelAnimationFrame\(focusFrameRef\.current\)/, "unmount must invalidate account requests and cancel pending focus recovery");

assert.match(entryExperience, /const accountCandidates = accountState\?\.status === "ready" \? accountState\.candidates : \[\];[\s\S]*choosePreparationContinuation\(accountCandidates, localCandidates\)/, "account failure must preserve independently verified browser-local continuation candidates");
assert.match(entryExperience, /accountState\?\.status === "ready" && localCandidates\.length > 0[\s\S]*Import activity/, "browser activity import must be offered only after an explicit ready account response");
assert.match(entryExperience, /if \(!accountState \|\| accountState\.status === "unavailable"[\s\S]*track\("continuation_presented"/, "continuation presentation analytics must not label an unknown/unavailable account state as anonymous");
assert.match(entryExperience, /onClick=\{\(\) => \{ if \(!accountState \|\| accountState\.status === "unavailable"\) return; track\("continuation_selected"/, "continuation selection analytics must not label an unknown/unavailable account state as anonymous");

for (const copy of [
  "Account progress couldn’t load.",
  "Public preparation remains available. Retry before relying on account-based continuation or weekly activity.",
  "Retry account progress",
  "Retrying account progress…",
]) {
  assert.ok(entryExperience.includes(copy), `account continuation recovery UI is missing exact copy: ${copy}`);
}
for (const marker of [
  'id="home-account-progress-status"',
  'role="status"',
  'aria-live="polite"',
  'aria-atomic="true"',
  "aria-busy={accountRequestPending}",
  "aria-disabled={accountRequestPending}",
  'aria-describedby="home-account-progress-status"',
]) {
  assert.ok(entryExperience.includes(marker), `account continuation recovery semantics are missing ${marker}`);
}
const retryButtonStart = entryExperience.indexOf("ref={retryButtonRef}");
const retryButtonEnd = entryExperience.indexOf("</button>", retryButtonStart);
const retryButtonSource = retryButtonStart === -1 || retryButtonEnd === -1 ? "" : entryExperience.slice(retryButtonStart, retryButtonEnd);
assert.ok(retryButtonSource.includes("aria-disabled={accountRequestPending}") && !/[\s\n]disabled=/.test(retryButtonSource), "retry must retain focus while its duplicate-activation guard is active");
assert.match(retryButtonSource, /if \(accountRequestPendingRef\.current\) return;[\s\S]*loadAccountProgress\(true\)/, "only an explicit, nonpending retry may request focus recovery");
assert.match(
  globalStyles,
  /\.home-local-import \.button\[aria-disabled="true"\]\s*\{[^}]*cursor:\s*wait;[^}]*opacity:\s*\.7;[^}]*transform:\s*none;[^}]*\}/,
  "the focused account-progress retry must expose a scoped pending treatment without native disabling",
);
assert.match(
  globalStyles,
  /\.home-local-import \.button-secondary\[aria-disabled="true"\]:hover\s*\{[^}]*background:\s*var\(--surface\);[^}]*border-color:\s*var\(--control-border,\s*var\(--line-strong\)\);[^}]*\}/,
  "hover must remain visually neutral while the account-progress retry is aria-disabled",
);

assert.match(
  entryExperience,
  /recoverFocusAfterRetryRef\.current = requestedByRetry[\s\S]*nextState\.status !== "unavailable"[\s\S]*document\.activeElement === retryButtonRef\.current/,
  "focus recovery must be armed only after an explicit successful retry removes the focused retry control",
);
assert.match(
  entryExperience,
  /if \(!recoverFocusAfterRetryRef\.current \|\| accountState\?\.status === "unavailable"\) return;[\s\S]*requestAnimationFrame[\s\S]*document\.activeElement !== document\.body[\s\S]*continuationHeadingRef\.current \?\? trackHeadingRef\.current\)\?\.focus\(\)/,
  "retry focus recovery must yield to a newer focus claim and target a persistent continuation/track heading",
);
assert.match(entryExperience, /ref=\{continuationHeadingRef\} tabIndex=\{-1\}/, "the continuation heading must be a programmatic focus target");
assert.match(entryExperience, /ref=\{trackHeadingRef\} tabIndex=\{-1\}/, "the track heading must be a persistent programmatic focus target");

console.log("Homepage entry experience tests passed.");
