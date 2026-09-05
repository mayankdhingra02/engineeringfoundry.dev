import { plansForMockTrack } from "@/data/mock-interviews";
import type { MockPracticeMode, MockTrack } from "@/types";

export const mockInterviewTracks: readonly MockTrack[] = ["dsa", "system-design", "low-level-design", "ml-design", "behavioral"];
const mockInterviewModes: readonly MockPracticeMode[] = ["solo", "peer"];
const ownedKeys = ["track", "problem", "mode"] as const;

type SearchParamsSource = string | { toString(): string };

export type MockInterviewUrlState = {
  track: MockTrack;
  problem: string;
  mode: MockPracticeMode;
};

function paramsFrom(source: SearchParamsSource) {
  return new URLSearchParams(typeof source === "string" ? source : source.toString());
}

export function parseMockInterviewUrlState(source: SearchParamsSource): MockInterviewUrlState {
  const params = paramsFrom(source);
  const requestedTrack = params.get("track");
  const track = mockInterviewTracks.includes(requestedTrack as MockTrack) ? requestedTrack as MockTrack : "dsa";
  const plans = plansForMockTrack(track);
  const requestedProblem = params.get("problem");
  const problem = plans.some((plan) => plan.slug === requestedProblem) ? requestedProblem! : plans[0].slug;
  const requestedMode = params.get("mode");
  const mode = mockInterviewModes.includes(requestedMode as MockPracticeMode) ? requestedMode as MockPracticeMode : "solo";
  return { track, problem, mode };
}

export function mockInterviewConfigurationKey(state: MockInterviewUrlState) {
  return `${state.track}:${state.problem}:${state.mode}`;
}

export function hasMockInterviewUrlConfiguration(source: SearchParamsSource) {
  const params = paramsFrom(source);
  return ownedKeys.some((key) => params.has(key));
}

export function serializeMockInterviewUrlState(state: MockInterviewUrlState) {
  const params = new URLSearchParams();
  params.set("track", state.track);
  params.set("problem", state.problem);
  params.set("mode", state.mode);
  return params;
}

export function mockInterviewPageHref(pathname: string, state: MockInterviewUrlState, hash = "") {
  const query = serializeMockInterviewUrlState(state).toString();
  return `${pathname}?${query}${hash.startsWith("#") ? hash : ""}`;
}

export function canonicalMockInterviewPageHref(pathname: string, state: MockInterviewUrlState, source: SearchParamsSource, hash = "") {
  return hasMockInterviewUrlConfiguration(source)
    ? mockInterviewPageHref(pathname, state, hash)
    : `${pathname}${hash.startsWith("#") ? hash : ""}`;
}

export function mockInterviewShareHref(origin: string, pathname: string, state: MockInterviewUrlState) {
  return `${origin}${mockInterviewPageHref(pathname, state)}`;
}
