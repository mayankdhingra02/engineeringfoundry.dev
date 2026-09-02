import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activeBehavioralQuestions,
  behavioralCategories,
  behavioralScopes,
  behavioralStoryTypes,
} from "../data/behavioral/index.ts";
import { plansForMockTrack } from "../data/mock-interviews/index.ts";
import {
  behavioralPracticeHref,
  parseBehavioralPracticeUrlState,
  serializeBehavioralPracticeUrlState,
} from "../lib/behavioral/practice-url-state.ts";
import {
  canonicalMockInterviewPageHref,
  hasMockInterviewUrlConfiguration,
  mockInterviewConfigurationKey,
  mockInterviewPageHref,
  mockInterviewShareHref,
  parseMockInterviewUrlState,
  serializeMockInterviewUrlState,
} from "../lib/mock-interviews/url-state.ts";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const read = (path) => readFileSync(path, "utf8");
const queryFromHref = (href) => href.split("?")[1]?.split("#")[0] ?? "";

const defaultBehavioral = parseBehavioralPracticeUrlState("");
assert.equal(defaultBehavioral.questionSlug, activeBehavioralQuestions[0].slug);
assert.equal(defaultBehavioral.category, "All");
assert.equal(defaultBehavioral.storyType, "All");
assert.equal(defaultBehavioral.scope, "All");

const behavioralTarget = {
  query: "ownership impact",
  category: behavioralCategories[0].name,
  storyType: behavioralStoryTypes[0].id,
  scope: behavioralScopes[0],
  questionSlug: activeBehavioralQuestions[1].slug,
};
const behavioralHref = behavioralPracticeHref("/behavioral", behavioralTarget, "utm_source=review&category=invalid", "#explorer");
assert.ok(behavioralHref.endsWith("#explorer"), "Behavioral navigation must preserve the current hash.");
assert.equal(new URLSearchParams(queryFromHref(behavioralHref)).get("utm_source"), "review", "Behavioral navigation must preserve unrelated public parameters.");
assert.deepEqual(parseBehavioralPracticeUrlState(queryFromHref(behavioralHref)), behavioralTarget, "Behavioral state must round-trip through its production serializer.");
const invalidBehavioral = parseBehavioralPracticeUrlState("category=unknown&story=unknown&scope=unknown&question=unknown");
assert.deepEqual(invalidBehavioral, defaultBehavioral, "Invalid Behavioral taxonomy and question values must fail closed to canonical defaults.");
assert.equal(parseBehavioralPracticeUrlState(`search=${"x".repeat(220)}`).query.length, 160, "Behavioral public search state must remain bounded.");
assert.equal(serializeBehavioralPracticeUrlState(defaultBehavioral, "utm_source=review&question=unknown").toString(), "utm_source=review", "Default Behavioral state must remove invalid owned values without deleting unrelated parameters.");
const behavioralA = parseBehavioralPracticeUrlState(queryFromHref(behavioralPracticeHref("/behavioral", defaultBehavioral)));
const behavioralB = parseBehavioralPracticeUrlState(queryFromHref(behavioralHref));
assert.deepEqual(parseBehavioralPracticeUrlState(queryFromHref(behavioralPracticeHref("/behavioral", behavioralA))), behavioralA, "Behavioral A→B→A history snapshots must be deterministic.");
assert.notDeepEqual(behavioralA, behavioralB);

const defaultMock = parseMockInterviewUrlState("");
assert.equal(defaultMock.track, "dsa");
assert.equal(defaultMock.problem, plansForMockTrack("dsa")[0].slug);
assert.equal(defaultMock.mode, "solo");
const mockTarget = { track: "behavioral", problem: plansForMockTrack("behavioral")[1].slug, mode: "peer" };
const mockHref = mockInterviewPageHref("/mock-interviews", mockTarget, "#session-builder");
assert.ok(mockHref.endsWith("#session-builder"), "Mock page navigation must preserve the current hash.");
assert.deepEqual(parseMockInterviewUrlState(queryFromHref(mockHref)), mockTarget, "Mock public configuration must round-trip through its production serializer.");
for (const privateKey of ["notes", "strength", "improvement", "followUp", "rating", "elapsedSeconds", "sessionId", "startedAt"]) {
  const adversarialHref = canonicalMockInterviewPageHref("/mock-interviews", mockTarget, `track=${mockTarget.track}&${privateKey}=private`, "#session-builder");
  assert.ok(!adversarialHref.includes(privateKey), `Mock page/history links must remove foreign ${privateKey} parameters.`);
}
assert.equal(canonicalMockInterviewPageHref("/mock-interviews", defaultMock, "notes=private", "#session-builder"), "/mock-interviews#session-builder", "A foreign-only Mock query must be removed without adding a configuration tuple.");
const crossTrackProblem = plansForMockTrack("behavioral")[0].slug;
assert.equal(parseMockInterviewUrlState(`track=dsa&problem=${crossTrackProblem}&mode=peer`).problem, plansForMockTrack("dsa")[0].slug, "A problem outside the selected Mock track must fail closed.");
assert.deepEqual(parseMockInterviewUrlState("track=unknown&problem=unknown&mode=unknown"), defaultMock, "Invalid Mock configuration must fail closed to canonical defaults.");
assert.equal(hasMockInterviewUrlConfiguration("utm_source=review"), false);
assert.equal(hasMockInterviewUrlConfiguration("utm_source=review&track=dsa"), true);
assert.equal(mockInterviewConfigurationKey(mockTarget), `${mockTarget.track}:${mockTarget.problem}:${mockTarget.mode}`);
const shareHref = mockInterviewShareHref("https://engineeringfoundry.dev", "/mock-interviews", mockTarget);
assert.equal(shareHref, `https://engineeringfoundry.dev/mock-interviews?${serializeMockInterviewUrlState(mockTarget)}`, "Copied Mock links must contain the exact canonical public tuple.");
for (const privateKey of ["notes", "strength", "improvement", "followUp", "rating", "elapsedSeconds", "sessionId", "startedAt"]) assert.ok(!shareHref.includes(privateKey), `Copied Mock links must exclude ${privateKey}.`);
const mockA = parseMockInterviewUrlState(queryFromHref(mockInterviewPageHref("/mock-interviews", defaultMock)));
const mockB = parseMockInterviewUrlState(queryFromHref(mockHref));
assert.deepEqual(parseMockInterviewUrlState(queryFromHref(mockInterviewPageHref("/mock-interviews", mockA))), mockA, "Mock A→B→A history snapshots must be deterministic.");
assert.notDeepEqual(mockA, mockB);

const behavioralComponent = read("components/behavioral-practice.tsx");
for (const marker of ["parseBehavioralPracticeUrlState", "behavioralPracticeHref", 'window.history.pushState(null, "", href)', 'window.history.replaceState(null, "", href)', 'window.addEventListener("popstate"', 'role="status" aria-live="polite" aria-atomic="true"']) assert.ok(behavioralComponent.includes(marker), `Behavioral history integration is missing ${marker}.`);
assert.ok(!/useState\(searchParams|get\("(?:search|category|story|scope|question)"\)/.test(behavioralComponent), "Behavioral URL-owned controls must not snapshot useSearchParams into local state.");
assert.ok(!behavioralComponent.includes("key={queryString}"), "Behavioral history reconciliation must not remount the interactive subtree.");
assert.ok(!/<PreparationActivityControl[^>]+key=/.test(behavioralComponent), "Behavioral prompt changes must not remount the activity control to reconcile identity.");
const activityControl = read("components/preparation-activity-control.tsx");
for (const marker of ["preparationActivityKey(track, itemId)", "requestedActivityKey", "current?.requestId === requestId && current.activityKey === requestedActivityKey", "Finishing previous activity save…", "aria-disabled={pending}", 'role="status" aria-live="polite" aria-atomic="true"']) assert.ok(activityControl.includes(marker), `Behavioral activity identity/focus/status integration is missing ${marker}.`);

const mockComponent = read("components/mock-interview-lab.tsx");
for (const marker of ["parseMockInterviewUrlState", "canonicalMockInterviewPageHref", "mockInterviewConfigurationKey", 'window.history.pushState(null, "", href)', 'window.addEventListener("popstate"', "mockHistoryTraversalVersion += 1", "activeSessionTraversalVersion === mockHistoryTraversalVersion", "mockPrivateSessionActive = true", "restoreMockBuilderFocusAfterHistory", 'new MutationObserver(() => focusStartControl())', "window.location.pathname === labPathname", "startControl.getClientRects().length", "pendingHistoryFocusCleanup.current?.()", "resetPrivateSession", "setActiveSessionConfigurationKey(null)", "setActiveSessionTraversalVersion(null)", 'setTimerState("idle")', "setElapsedSeconds(0)", "setMarks({})", 'setNotes({ strength: "", improvement: "", followUp: "" })', "sessionId.current = null", "startedAt.current = null", "sessionGeneration.current", "mockInterviewShareHref", "Private saving is unavailable in this public configuration"]) assert.ok(mockComponent.includes(marker), `Mock history/privacy integration is missing ${marker}.`);
assert.ok(!/useState\([^)]*searchParams|get\("(?:track|problem|mode)"\)/.test(mockComponent), "Mock URL-owned controls must not snapshot useSearchParams into local state.");
assert.ok(!mockComponent.includes("key={queryString}"), "Mock history reconciliation must not remount the interactive subtree.");
assert.ok(read("app/mock-interviews/page.tsx").includes("isAccountPlatformAvailable()"), "Mock private-save controls must receive the account-platform boundary.");
const mockAction = read("app/mock-interviews/actions.ts");
assert.ok(mockAction.includes("if (!isAccountPlatformAvailable())") && mockAction.indexOf("if (!isAccountPlatformAvailable())") < mockAction.indexOf("getAuthenticatedActor()"), "The Mock save action must enforce account availability before reading an actor or writing a review.");
const model = read("docs/mock-interview-model.md");
assert.ok(model.includes("Nothing is saved automatically") && model.includes("owner-scoped Supabase tables"), "Mock privacy documentation must distinguish unsaved browser state from explicit private persistence.");
assert.ok(!model.includes("No migrations, tables, saved sessions"), "Mock documentation must not deny implemented owner-scoped persistence.");

assert.equal(STATIC_STEPS.filter((step) => step.args?.includes("test:practice-url-state")).length, 1, "The canonical static lane must run the focused URL-state regression exactly once.");

console.log("Public practice URL-state regression passed: canonical direct links, invalid-value fallbacks, history snapshots, private-state exclusion, and reset wiring hold.");
