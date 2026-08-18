import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chooseRoundPreparationNextAction } from "../lib/interview-preparation/next-action.ts";
import { buildInterviewPlaybookOverview } from "../lib/interview-playbook/overview.ts";
import { resolveInterviewPlaybookTiming } from "../lib/interview-playbook/timing.ts";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const model = read("lib/interview-preparation/model.ts");
const query = read("lib/interview-preparation/queries.ts");
const actions = read("features/interview-preparation/actions.ts");
const mutationControls = read("features/interview-preparation/mutation-controls.tsx");
const page = read("app/interviews/[roundId]/prepare/page.tsx");
const migration = read("supabase/migrations/202608140011_create_interview_preparation_hub.sql");
const dashboard = read("app/dashboard/page.tsx");
const application = read("app/applications/[id]/page.tsx");
const behavioralLibrary = read("app/behavioral/questions/page.tsx");
const behavioralDetail = read("app/behavioral/questions/[questionId]/page.tsx");
const playbookQueries = read("lib/interview-playbook/queries.ts");
const playbookPage = read("app/interview-playbook/page.tsx");
const playbookTiming = read("lib/interview-playbook/timing.ts");
const finalPreparationComponent = read("components/interview-playbook/final-preparation-mode.tsx");
const design = read("DESIGN.md");
const globals = read("app/globals.css");
const prepCss = globals.split("/* Phase 6 — focused preparation flight plan */")[1].split(".page-hero")[0];

const nextActionApplicationId = "app-fixture-1";
const nextActionDsaQuestion = { id: "two-sum", title: "Two Sum" };
const nextActionSystemDesignAttempt = { id: "attempt-fixture-1", problemId: "url-shortener", title: "URL Shortener Attempt" };
const nextActionSystemDesignConcept = { href: "/system-design/caching", title: "Caching" };

const nextActionDsaWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: nextActionDsaQuestion,
  systemDesignAttempt: nextActionSystemDesignAttempt,
  behavioralAvailable: true,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionSystemDesignWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: nextActionSystemDesignAttempt,
  behavioralAvailable: true,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionBehavioralWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: null,
  behavioralAvailable: true,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionConceptWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: null,
  behavioralAvailable: false,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionFallback = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: null,
  behavioralAvailable: false,
  systemDesignConcept: null,
});

const overviewNow = new Date("2026-08-18T12:00:00.000Z");

function makeRound(overrides) {
  return {
    id: "round-default",
    applicationId: "app-default",
    roundNumber: 1,
    roundName: "Round",
    roundType: "Coding / DSA",
    scheduledAt: null,
    durationMinutes: null,
    timezone: null,
    status: "Planned",
    result: "Pending",
    active: true,
    modules: ["dsa", "company"],
    ...overrides,
  };
}

function makeApplication(overrides) {
  return {
    id: "app-default",
    companyName: "Default Co",
    companySlug: "default-co",
    roleTitle: "SDE",
    roleLevel: null,
    status: "Interviewing",
    updatedAt: "2026-08-01T00:00:00.000Z",
    active: true,
    rounds: [],
    ...overrides,
  };
}

function overviewOf(applications, preparationCounts = new Map()) {
  return buildInterviewPlaybookOverview({ applications, preparationCounts, now: overviewNow });
}

// Case 1: earliest scheduled round wins across companies.
const case1RoundA = makeRound({ id: "round-a", applicationId: "app-a", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-25T10:00:00.000Z" });
const case1RoundB = makeRound({ id: "round-b", applicationId: "app-b", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-20T10:00:00.000Z" });
const case1Overview = overviewOf([
  makeApplication({ id: "app-a", companyName: "Company A", rounds: [case1RoundA] }),
  makeApplication({ id: "app-b", companyName: "Company B", rounds: [case1RoundB] }),
]);

// Case 2: a completed round with an earlier timestamp is not primary.
const case2Completed = makeRound({ id: "round-completed", roundNumber: 1, status: "Completed", result: "Passed", scheduledAt: "2026-08-05T10:00:00.000Z" });
const case2Upcoming = makeRound({ id: "round-upcoming", roundNumber: 2, status: "Scheduled", scheduledAt: "2026-08-22T10:00:00.000Z" });
const case2Overview = overviewOf([makeApplication({ rounds: [case2Completed, case2Upcoming] })]);
const case2CompletedSummary = case2Overview.applications[0].rounds.find((round) => round.id === "round-completed");

// Case 3: a cancelled future round is not primary.
const case3Cancelled = makeRound({ id: "round-cancelled", status: "Cancelled", scheduledAt: "2026-08-25T10:00:00.000Z" });
const case3Overview = overviewOf([makeApplication({ rounds: [case3Cancelled] })]);
const case3CancelledSummary = case3Overview.applications[0].rounds[0];

// Case 4: an unscheduled active round becomes primary when nothing is scheduled.
const case4Unscheduled = makeRound({ id: "round-unscheduled", status: "Planned", scheduledAt: null });
const case4Overview = overviewOf([makeApplication({ rounds: [case4Unscheduled] })]);

// Case 5: an overdue active round is reported separately, never as primary or completed.
const case5Overdue = makeRound({ id: "round-overdue", status: "Scheduled", scheduledAt: "2026-08-01T00:00:00.000Z" });
const case5Overview = overviewOf([makeApplication({ rounds: [case5Overdue] })]);
const case5OverdueSummary = case5Overview.applications[0].rounds[0];

// Case 6: a terminal application's round cannot be active or primary.
const case6Round = makeRound({ id: "round-terminal", status: "Scheduled", scheduledAt: "2026-08-25T10:00:00.000Z" });
const case6Overview = overviewOf([makeApplication({ id: "app-terminal", status: "Rejected", active: false, rounds: [case6Round] })]);

// Case 7: preparation counts are batched checklist progress only, never a percentage.
const case7RoundWithCount = makeRound({ id: "round-with-count", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-22T10:00:00.000Z" });
const case7RoundWithoutCount = makeRound({ id: "round-without-count", roundNumber: 2, status: "Scheduled", scheduledAt: "2026-08-23T10:00:00.000Z" });
const case7Overview = overviewOf(
  [makeApplication({ rounds: [case7RoundWithCount, case7RoundWithoutCount] })],
  new Map([["round-with-count", { completed: 3, total: 5 }]]),
);
const case7WithCountSummary = case7Overview.applications[0].rounds.find((round) => round.id === "round-with-count");
const case7WithoutCountSummary = case7Overview.applications[0].rounds.find((round) => round.id === "round-without-count");

// Case 8: application rounds are sorted by roundNumber then id, without mutating the input array.
const case8OriginalRounds = [
  makeRound({ id: "r3", roundNumber: 3 }),
  makeRound({ id: "r1", roundNumber: 1 }),
  makeRound({ id: "r2", roundNumber: 2 }),
];
const case8OriginalOrderBefore = case8OriginalRounds.map((round) => round.id);
const case8Overview = overviewOf([makeApplication({ rounds: case8OriginalRounds })]);
const case8OriginalOrderAfter = case8OriginalRounds.map((round) => round.id);

// Case 9: identical scheduled timestamps fall back to roundNumber then id.
const case9RoundB = makeRound({ id: "r-b", roundNumber: 2, status: "Scheduled", scheduledAt: "2026-08-20T10:00:00.000Z" });
const case9RoundA = makeRound({ id: "r-a", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-20T10:00:00.000Z" });
const case9Overview = overviewOf([makeApplication({ rounds: [case9RoundB, case9RoundA] })]);

// Case 10: an account with no applications yields an entirely empty, primary-free overview.
const case10Overview = overviewOf([]);

// Case 11: a round scheduled exactly at `now` is upcoming, not overdue.
const case11Round = makeRound({ id: "round-now", status: "Scheduled", scheduledAt: overviewNow.toISOString() });
const case11Overview = overviewOf([makeApplication({ rounds: [case11Round] })]);
const case11Summary = case11Overview.applications[0].rounds[0];

// --- Playbook final-preparation timing model -------------------------------
const timingNow = new Date("2026-08-18T12:00:00.000Z"); // UTC calendar day 2026-08-18

function timingOf(scheduledAt, overrides = {}) {
  return resolveInterviewPlaybookTiming({ scheduledAt, timezone: "UTC", now: timingNow, ...overrides });
}

// Case 1 & 2: null and invalid dates behave identically and never throw.
const timingNullDate = timingOf(null);
let timingInvalidDate;
let timingInvalidDateThrew = false;
try {
  timingInvalidDate = timingOf("not-a-real-timestamp");
} catch {
  timingInvalidDateThrew = true;
}

// Case 3: more than seven local calendar days away.
const timingStandard = timingOf("2026-08-26T12:00:00.000Z"); // +8 calendar days

// Case 4: exactly seven local calendar days away.
const timingFinalWeekEdge = timingOf("2026-08-25T12:00:00.000Z"); // +7 calendar days

// Case 5: four local calendar days away.
const timingFinalWeekMid = timingOf("2026-08-22T12:00:00.000Z"); // +4 calendar days

// Case 6: exactly three local calendar days away.
const timingFinalThreeDaysEdge = timingOf("2026-08-21T12:00:00.000Z"); // +3 calendar days

// Case 7: two local calendar days away.
const timingFinalThreeDaysMid = timingOf("2026-08-20T12:00:00.000Z"); // +2 calendar days

// Case 8: one local calendar day away, using a non-24-hour absolute gap (14h).
const timingDayBefore = timingOf("2026-08-19T02:00:00.000Z");

// Case 9: same local calendar day, more than one hour away.
const timingInterviewDay = timingOf("2026-08-18T18:00:00.000Z"); // +6 hours

// Case 10: exactly 60 minutes away.
const timingPreRoundEdge = timingOf("2026-08-18T13:00:00.000Z");

// Case 11: less than 60 minutes away.
const timingPreRoundSoon = timingOf("2026-08-18T12:30:00.000Z");

// Case 12: exactly now.
const timingPreRoundNow = timingOf("2026-08-18T12:00:00.000Z");

// Case 13: a passed interview. Only timing is asserted — never an outcome.
const timingPassed = timingOf("2026-08-18T11:00:00.000Z"); // 1 hour before now

// Case 14: only a few absolute hours remain, but the interview's UTC calendar
// date is the next day relative to `now`'s UTC calendar date. Local-calendar
// classification must still win once the one-hour rule is cleared.
const timingBoundaryNow = new Date("2026-08-20T22:00:00.000Z");
const timingBoundary = resolveInterviewPlaybookTiming({
  scheduledAt: "2026-08-21T01:00:00.000Z", // 3 absolute hours later, next UTC day
  timezone: "UTC",
  now: timingBoundaryNow,
});

// Case 15: an invalid timezone must fall back to UTC deterministically, matching
// the explicit-UTC "day-before" fixture (case 8) exactly, and must not throw.
let timingInvalidTimezone;
let timingInvalidTimezoneThrew = false;
try {
  timingInvalidTimezone = resolveInterviewPlaybookTiming({ scheduledAt: "2026-08-19T02:00:00.000Z", timezone: "Not/AZone", now: timingNow });
} catch {
  timingInvalidTimezoneThrew = true;
}

// Case 16: guidance completeness across every final-preparation phase.
const finalPreparationResults = [timingFinalWeekEdge, timingFinalThreeDaysEdge, timingDayBefore, timingInterviewDay, timingPreRoundEdge];
const finalPreparationGuidanceComplete = finalPreparationResults.every((result) => {
  const guidance = result.guidance;
  return Boolean(guidance)
    && guidance.phase === result.phase
    && typeof guidance.label === "string" && guidance.label.length > 0
    && typeof guidance.title === "string" && guidance.title.length > 0
    && typeof guidance.description === "string" && guidance.description.length > 0
    && Array.isArray(guidance.actions) && guidance.actions.length === 4
    && guidance.actions.every((action) => typeof action === "string" && action.length > 0);
});

const cases = [
  ["private dynamic route", page.includes('export const dynamic = "force-dynamic"')],
  ["member guard", page.includes("requireMemberProfile")],
  ["owner-first query", query.indexOf('.eq("user_id", actor.user.id)') < query.indexOf("Promise.all")],
  ["guessed round returns null", query.includes("if (!roundData) return null")],
  ["central module type", model.includes("export type PreparationModule")],
  ["coding mapping", model.includes('coding: ["dsa", "company"]')],
  ["design mapping", model.includes('"system-design": ["system-design", "company"]')],
  ["behavioral mapping", model.includes('behavioral: ["behavioral", "company"]')],
  ["onsite balanced mapping", model.includes('onsite: ["dsa", "behavioral", "system-design", "company"]')],
  ["recruiter excludes DSA", model.includes('recruiter: ["behavioral", "company"]')],
  ["role normalization", model.includes("roadmapLevelForRole")],
  ["conservative alias map", model.includes("companyAliases")],
  ["no inferred AWS alias", !model.includes('aws: "amazon"') && !model.includes('"amazon-web-services": "amazon"')],
  ["stable checklist IDs", model.includes("ALL_CHECKLIST_IDS")],
  ["bounded DSA query", query.includes('.limit(100)')],
  ["bounded behavioral stories", query.includes('.limit(6)')],
  ["bounded design attempts", query.includes('.limit(4)')],
  ["conditional DSA", query.includes("includeDsa ?")],
  ["conditional behavioral", query.includes("includeBehavioral ?")],
  ["conditional design", query.includes("includeSystemDesign ?")],
  ["summary-only design columns", !query.includes('select("*").eq("user_id", actor.user.id).or')],
  ["application-linked behavioral answers", query.includes('.eq("application_id", round.application.id)')],
  ["application-linked stories prioritized", query.indexOf("applicationStoriesResult.data") < query.indexOf("storiesResult.data")],
  ["ready story count is complete", query.includes('{ count: "exact", head: true }') && query.includes("readyStoryCount")],
  ["company question composition", query.includes("questionsForInterviewCompany")],
  ["private preparation table", migration.includes("create table public.interview_preparations")],
  ["custom task table", migration.includes("create table public.interview_preparation_custom_tasks")],
  ["composite round ownership", migration.includes("interview_preparations_round_owner_fkey")],
  ["cascade round deletion", migration.includes("on delete cascade")],
  ["RLS preparation", migration.includes("alter table public.interview_preparations enable row level security")],
  ["RLS tasks", migration.includes("alter table public.interview_preparation_custom_tasks enable row level security")],
  ["server-derived actor", migration.includes("auth.uid()") && !actions.includes("user_id:")],
  ["reflection completion lock", migration.includes("round_status <> 'Completed'")],
  ["notes bounded", migration.includes("12000")],
  ["tasks bounded", migration.includes("Custom task limit reached")],
  ["known checklist values", migration.includes("interview_preparations_checklist_known")],
  ["mutation errors returned", actions.includes("Checklist change was not saved") && actions.includes("Task change was not saved") && actions.includes("Task was not removed")],
  ["mutation pending states announced", mutationControls.includes('aria-live="polite"') && mutationControls.includes("Saving checklist…") && mutationControls.includes("Adding task…")],
  ["dashboard Prepare", dashboard.includes(">Prepare<")],
  ["dashboard points to hub", dashboard.includes("/interviews/${round.id}/prepare")],
  ["application upcoming CTA", application.includes("Prepare for this round")],
  ["application completed reflection CTA", application.includes("View preparation & reflection")],
  ["cancelled excluded from CTA", application.includes('["Planned", "Scheduled", "Rescheduled"]')],
  ["lifecycle cancelled", page.includes('round.status === "Cancelled"')],
  ["lifecycle rescheduled", page.includes('round.status === "Rescheduled"')],
  ["lifecycle completed", page.includes('round.status === "Completed"')],
  ["no duplicate module records", !migration.includes("dsa_question") && !migration.includes("behavioral_stor") && !migration.includes("system_design_attempt")],
  ["application-aware module links", page.includes("application=${applicationId}")],
  ["filter preserves application", behavioralLibrary.includes('name="application"')],
  ["behavioral back preserves context", behavioralDetail.includes('href={`/behavioral/questions${answerSuffix}`}')],
  ["no pre-heading labels", !page.includes("prep-round-type") && !page.includes("Continue next")],
  ["private copy", page.includes("private to your account")],
  ["preparation type floor", !/(?<![\d.])(?:9\.5|10\.5|11|11\.5)px/.test(prepCss)],
  ["durable preparation design contract", design.includes("### Round-Specific Preparation Hubs") && design.includes("stable, code-owned item IDs") && design.includes("post-interview reflections")],
  ["no analytics grid copy", !page.includes("KPI") && !page.includes("analytics")],
  ["mobile breakpoint", globals.includes("@media (max-width: 620px)")],
  ["next-action DSA wins over every lower-priority candidate", nextActionDsaWins.href === `/dsa/questions/${nextActionDsaQuestion.id}?application=${nextActionApplicationId}` && nextActionDsaWins.label === `Review ${nextActionDsaQuestion.title}`],
  ["next-action System Design attempt wins without DSA", nextActionSystemDesignWins.href === `/system-design/problems/${nextActionSystemDesignAttempt.problemId}/practice/${nextActionSystemDesignAttempt.id}` && nextActionSystemDesignWins.label === `Review ${nextActionSystemDesignAttempt.title}`],
  ["next-action Behavioral wins without DSA or an attempt", nextActionBehavioralWins.href === `/behavioral/questions?application=${nextActionApplicationId}` && nextActionBehavioralWins.label === "Continue behavioral preparation"],
  ["next-action System Design concept selected as the only specialist action", nextActionConceptWins.href === nextActionSystemDesignConcept.href && nextActionConceptWins.label === `Review ${nextActionSystemDesignConcept.title}`],
  ["next-action application fallback", nextActionFallback.href === `/applications/${nextActionApplicationId}` && nextActionFallback.label === "Review application details"],
  ["page imports the next-action selector", page.includes('import { chooseRoundPreparationNextAction } from "@/lib/interview-preparation/next-action";')],
  ["page calls the next-action selector", page.includes("chooseRoundPreparationNextAction({")],
  ["page no longer inlines the old primary selection", !page.includes("const primary = firstDsa ?")],
  ["page still offers the most-useful-preparation heading", page.includes("Continue with the most useful preparation.")],
  ["page still renders primary.href", page.includes("href={primary.href}")],
  ["page still renders primary.label", page.includes("{primary.label}")],
  ["playbook overview: both applications' rounds appear as upcoming", case1Overview.upcomingRounds.length === 2],
  ["playbook overview: upcoming rounds are ordered by timestamp", case1Overview.upcomingRounds[0].id === "round-b" && case1Overview.upcomingRounds[1].id === "round-a"],
  ["playbook overview: the earliest-scheduled round across companies is primary", case1Overview.primaryRound?.id === "round-b"],
  ["playbook overview: primary reason is next-scheduled-round", case1Overview.primaryRoundReason === "next-scheduled-round"],
  ["playbook overview: a completed round is classified completed", case2CompletedSummary?.state === "completed"],
  ["playbook overview: a completed round is excluded from upcomingRounds", !case2Overview.upcomingRounds.some((round) => round.id === "round-completed")],
  ["playbook overview: a completed round is never primary", case2Overview.primaryRound?.id !== "round-completed"],
  ["playbook overview: the future active round is primary instead", case2Overview.primaryRound?.id === "round-upcoming"],
  ["playbook overview: a cancelled round is classified cancelled", case3CancelledSummary.state === "cancelled"],
  ["playbook overview: a cancelled round is excluded from upcomingRounds", case3Overview.upcomingRounds.length === 0],
  ["playbook overview: a cancelled-only application has no primary round", case3Overview.primaryRound === null],
  ["playbook overview: an unscheduled active round appears in unscheduledRounds", case4Overview.unscheduledRounds.some((round) => round.id === "round-unscheduled")],
  ["playbook overview: an unscheduled round becomes primary absent any scheduled round", case4Overview.primaryRound?.id === "round-unscheduled"],
  ["playbook overview: the reason is planned-round-without-date", case4Overview.primaryRoundReason === "planned-round-without-date"],
  ["playbook overview: a past scheduled active round is classified overdue", case5OverdueSummary.state === "overdue"],
  ["playbook overview: an overdue round is not silently completed", case5OverdueSummary.state !== "completed"],
  ["playbook overview: an overdue round appears in overdueRounds", case5Overview.overdueRounds.some((round) => round.id === "round-overdue")],
  ["playbook overview: an overdue round is never chosen as primary", case5Overview.primaryRound === null],
  ["playbook overview: a terminal application remains in the full applications list", case6Overview.applications.some((application) => application.id === "app-terminal")],
  ["playbook overview: a terminal application is excluded from activeApplications", !case6Overview.activeApplications.some((application) => application.id === "app-terminal")],
  ["playbook overview: a terminal application's round is excluded from global upcomingRounds", !case6Overview.upcomingRounds.some((round) => round.id === "round-terminal")],
  ["playbook overview: a terminal application's round cannot be primary", case6Overview.primaryRound === null],
  ["playbook overview: a supplied preparation count is passed through exactly", case7WithCountSummary?.preparation.completed === 3 && case7WithCountSummary?.preparation.total === 5],
  ["playbook overview: a missing preparation count normalizes to zero", case7WithoutCountSummary?.preparation.completed === 0 && case7WithoutCountSummary?.preparation.total === 0],
  ["playbook overview: round summaries expose no readiness or percentage field", !("readiness" in case7WithCountSummary) && !("percentage" in case7WithCountSummary) && !("readinessPercentage" in case7WithCountSummary)],
  ["playbook overview: application rounds are sorted by roundNumber then id", case8Overview.applications[0].rounds.map((round) => round.id).join(",") === "r1,r2,r3"],
  ["playbook overview: the original round input array is not mutated", case8OriginalOrderAfter.join(",") === case8OriginalOrderBefore.join(",") && case8OriginalOrderAfter.join(",") === "r3,r1,r2"],
  ["playbook overview: identical timestamps fall back to roundNumber then id", case9Overview.upcomingRounds.map((round) => round.id).join(",") === "r-a,r-b"],
  ["playbook overview: an empty account has no applications", case10Overview.applications.length === 0 && case10Overview.activeApplications.length === 0],
  ["playbook overview: an empty account has no rounds in any global queue", case10Overview.upcomingRounds.length === 0 && case10Overview.unscheduledRounds.length === 0 && case10Overview.overdueRounds.length === 0],
  ["playbook overview: an empty account has no primary round or reason", case10Overview.primaryRound === null && case10Overview.primaryRoundReason === null],
  ["playbook overview: a round scheduled exactly at now is upcoming", case11Summary.state === "upcoming"],
  ["playbook overview: a round scheduled exactly at now is not overdue", case11Summary.state !== "overdue"],
  ["playbook queries: exports getInterviewPlaybookOverview", playbookQueries.includes("export async function getInterviewPlaybookOverview")],
  ["playbook queries: calls getApplications", playbookQueries.includes("getApplications()")],
  ["playbook queries: calls getPreparationCounts", playbookQueries.includes("getPreparationCounts(roundIds)")],
  ["playbook queries: calls getInterviewPreparationHub", playbookQueries.includes("getInterviewPreparationHub(")],
  ["playbook queries: calls chooseRoundPreparationNextAction", playbookQueries.includes("chooseRoundPreparationNextAction(")],
  ["playbook queries: uses isActiveApplication", playbookQueries.includes("isActiveApplication(")],
  ["playbook queries: uses UPCOMING_ROUND_STATUSES", playbookQueries.includes("UPCOMING_ROUND_STATUSES")],
  ["playbook queries: uses modulesForRound", playbookQueries.includes("modulesForRound(")],
  ["playbook queries: accepts no userId parameter", !playbookQueries.includes("userId")],
  ["playbook queries: contains no direct table access", !playbookQueries.includes(".from(")],
  ["playbook queries: contains no service-role reference", !playbookQueries.includes("serviceRole") && !playbookQueries.includes("SERVICE_ROLE")],
  ["playbook queries: never reads the DSA interview-date preference", !playbookQueries.includes("dsa_interview_date")],
  ["playbook queries: does not duplicate the dashboard pipeline query", !playbookQueries.includes("getDashboardPipeline")],
  ["playbook queries: does not call the preparation hub once per round", !/rounds\s*\.\s*map\([^)]*getInterviewPreparationHub/.test(playbookQueries) && !playbookQueries.includes("Promise.all(rounds.map")],
  ["playbook queries: does not map an async query across applications", !playbookQueries.includes("Promise.all(applications.map")],
  ["playbook queries: calculates no readiness percentage", !playbookQueries.includes("readiness") && !playbookQueries.includes("Percentage") && !playbookQueries.includes("percentage")],
  ["playbook queries: contains no randomness", !playbookQueries.includes("Math.random")],
  ["playbook queries: performs no write operation", !playbookQueries.includes(".insert(") && !playbookQueries.includes(".update(") && !playbookQueries.includes(".delete(") && !playbookQueries.includes(".upsert(")],
  ["playbook queries: imports no React", !playbookQueries.includes('from "react"') && !playbookQueries.includes("from 'react'")],
  ["playbook queries: imports no Next.js module", !playbookQueries.includes('from "next') && !playbookQueries.includes("from 'next")],
  ["playbook queries: defines no route export", !playbookQueries.includes("export default")],
  ["playbook page: private dynamic route", playbookPage.includes('export const dynamic = "force-dynamic"')],
  ["playbook page: uses AccountUnavailable", playbookPage.includes("AccountUnavailable")],
  ["playbook page: calls isAccountPlatformAvailable", playbookPage.includes("isAccountPlatformAvailable()")],
  ["playbook page: calls requireMemberProfile with its own path", playbookPage.includes('requireMemberProfile("/interview-playbook")')],
  ["playbook page: calls getInterviewPlaybookOverview", playbookPage.includes("getInterviewPlaybookOverview(")],
  ["playbook page: is a Server Component", !playbookPage.includes("use client")],
  ["playbook page: imports no Supabase client", !playbookPage.includes("createSupabaseServerClient") && !playbookPage.includes("createSupabaseAdminClient") && !playbookPage.includes("@supabase/")],
  ["playbook page: contains no direct table access", !playbookPage.includes(".from(")],
  ["playbook page: does not import getDashboardPipeline", !playbookPage.includes("getDashboardPipeline")],
  ["playbook page: does not import getApplications", !playbookPage.includes("getApplications")],
  ["playbook page: does not import getPreparationCounts", !playbookPage.includes("getPreparationCounts")],
  ["playbook page: does not import getInterviewPreparationHub", !playbookPage.includes("getInterviewPreparationHub")],
  ["playbook page: does not import DSA, Behavioral, or System Design query modules", !playbookPage.includes("/dsa/queries") && !playbookPage.includes("/behavioral/queries") && !playbookPage.includes("/system-design/queries")],
  ["playbook page: contains no Server Action", !playbookPage.includes('"use server"')],
  ["playbook page: contains no API fetch", !playbookPage.includes("fetch(")],
  ["playbook page: uses primaryAction.href", playbookPage.includes("primaryAction.href")],
  ["playbook page: uses primaryAction.label", playbookPage.includes("primaryAction.label")],
  ["playbook page: uses primaryRound.preparationHref", playbookPage.includes("primaryRound.preparationHref")],
  ["playbook page: contains the full-round-plan link text", playbookPage.includes("Open the full round plan")],
  ["playbook page: contains the concurrent-change fallback text", playbookPage.includes("The round changed while this page was loading")],
  ["playbook page: links the concurrent-change fallback to the application", playbookPage.includes("The round changed while this page was loading") && playbookPage.includes("href={`/applications/${primaryRound.applicationId}`}")],
  ["playbook page: contains the overdue-status-update branch", playbookPage.includes("Needs a status update") && playbookPage.includes("Update interview status")],
  ["playbook page: does not route the overdue dominant action to preparationHref", !/Update interview status[\s\S]{0,40}preparationHref/.test(playbookPage)],
  ["playbook page: contains the active-application-without-round branch", playbookPage.includes("Add the next known interview round") && playbookPage.includes("firstActiveApplicationWithoutRound")],
  ["playbook page: contains the no-active-application branch", playbookPage.includes("No active interview process right now")],
  ["playbook page: contains the no-application first-use branch", playbookPage.includes("Start with the interview process you are pursuing.")],
  ["playbook page: builds its queue from upcomingRounds and unscheduledRounds", playbookPage.includes("overview.upcomingRounds") && playbookPage.includes("overview.unscheduledRounds")],
  ["playbook page: never sorts an overview array itself", !playbookPage.includes(".sort(")],
  ["playbook page: excludes the primary round from the queue by id", playbookPage.includes("round.id !== primaryRound?.id")],
  ["playbook page: caps the queue at six", playbookPage.includes(".slice(0, 6)")],
  ["playbook page: caps overdue records at three", playbookPage.includes(".slice(0, 3)")],
  ["playbook page: each queued round links through its own preparationHref", playbookPage.includes("round.preparationHref")],
  ["playbook page: does not call the detailed action selector per row", !playbookPage.includes("chooseRoundPreparationNextAction")],
  ["playbook page: never calls getInterviewPreparationHub directly", !playbookPage.includes("getInterviewPreparationHub(")],
  ["playbook page: states checklist completion is not readiness or a passing probability", playbookPage.includes("Checklist completion is planning progress, not interview readiness or a probability of passing.")],
  ["playbook page: contains no readinessScore field", !playbookPage.includes("readinessScore")],
  ["playbook page: contains no passProbability field", !playbookPage.includes("passProbability")],
  ["playbook page: calculates no percentage", !playbookPage.includes("Math.round") && !playbookPage.includes("* 100") && !playbookPage.includes("toFixed")],
  ["playbook page: contains no randomness", !playbookPage.includes("Math.random")],
  ["playbook page: does not reference private notes", !playbookPage.includes("private_notes") && !playbookPage.includes("private notes")],
  ["playbook page: does not reference behavioral story content", !playbookPage.includes("short_summary") && !playbookPage.includes("situation") && !playbookPage.includes("STAR")],
  ["playbook page: does not reference reflections", !playbookPage.includes("went_well") && !playbookPage.includes("needs_improvement") && !playbookPage.includes("reflection")],
  ["playbook page: does not reference interviewer names", !playbookPage.includes("interviewer_name") && !playbookPage.includes("interviewerName")],
  ["playbook page: does not reference meeting links", !playbookPage.includes("meeting_link") && !playbookPage.includes("meetingLink")],
  ["playbook page: does not reference custom task titles", !playbookPage.includes("interview_preparation_custom_tasks") && !playbookPage.includes("customTask")],
  ["playbook page: never displays durationMinutes", !playbookPage.includes("durationMinutes")],
  ["playbook page: links to /applications", playbookPage.includes('"/applications"')],
  ["playbook page: links to /applications/new", playbookPage.includes('"/applications/new"')],
  ["playbook page: links to /calendar", playbookPage.includes('"/calendar"')],
  ["playbook page: links to /interview-tips", playbookPage.includes('"/interview-tips"')],
  ["playbook page: links to /mock-interviews", playbookPage.includes('"/mock-interviews"')],
  ["playbook page: links to /prepare", playbookPage.includes('"/prepare"')],
  ["dashboard: links to the Playbook", dashboard.includes('href="/interview-playbook"')],
  ["dashboard: shows the Playbook label", dashboard.includes(">Playbook<")],
  ["dashboard: still links to Calendar", dashboard.includes('href="/calendar"')],
  ["dashboard: still links to All applications", dashboard.includes(">All applications<")],
  ["dashboard: still links to Add application", dashboard.includes(">Add application<")],
  ["dashboard: still uses getDashboardPipeline", dashboard.includes("getDashboardPipeline")],
  ["dashboard: does not call getInterviewPlaybookOverview", !dashboard.includes("getInterviewPlaybookOverview")],
  ["dashboard: adds no new database query for the link", !dashboard.includes("interview-playbook/queries")],
  // --- Timing functional cases ---------------------------------------------
  ["timing: null date is unscheduled and does not throw", timingNullDate.phase === "unscheduled" && timingNullDate.millisecondsUntil === null && timingNullDate.calendarDaysUntil === null && timingNullDate.guidance === null],
  ["timing: invalid date does not throw", timingInvalidDateThrew === false],
  ["timing: invalid date matches the unscheduled shape", timingInvalidDate?.phase === "unscheduled" && timingInvalidDate?.millisecondsUntil === null && timingInvalidDate?.calendarDaysUntil === null && timingInvalidDate?.guidance === null],
  ["timing: more than seven calendar days is standard with no guidance", timingStandard.phase === "standard" && timingStandard.guidance === null],
  ["timing: exactly seven calendar days is final-week", timingFinalWeekEdge.phase === "final-week" && timingFinalWeekEdge.guidance?.label === "Final week"],
  ["timing: four calendar days is final-week", timingFinalWeekMid.phase === "final-week"],
  ["timing: exactly three calendar days is final-three-days", timingFinalThreeDaysEdge.phase === "final-three-days"],
  ["timing: two calendar days is final-three-days", timingFinalThreeDaysMid.phase === "final-three-days"],
  ["timing: one calendar day away (non-24h gap) is day-before", timingDayBefore.phase === "day-before"],
  ["timing: same calendar day beyond one hour is interview-day", timingInterviewDay.phase === "interview-day"],
  ["timing: exactly 60 minutes away is pre-round", timingPreRoundEdge.phase === "pre-round"],
  ["timing: less than 60 minutes away is pre-round", timingPreRoundSoon.phase === "pre-round"],
  ["timing: exactly now is pre-round with zero milliseconds until", timingPreRoundNow.phase === "pre-round" && timingPreRoundNow.millisecondsUntil === 0],
  ["timing: a passed interview reports a negative millisecondsUntil", timingPassed.phase === "passed" && typeof timingPassed.millisecondsUntil === "number" && timingPassed.millisecondsUntil < 0],
  ["timing: a passed interview has no guidance and no inferred outcome", timingPassed.guidance === null && !("result" in timingPassed) && !("completed" in timingPassed)],
  ["timing: a nearby but next-calendar-day interview outranks the absolute-hour gap into day-before", timingBoundary.phase === "day-before"],
  ["timing: an invalid timezone does not throw", timingInvalidTimezoneThrew === false],
  ["timing: an invalid timezone falls back to the same result as explicit UTC", timingInvalidTimezone?.phase === timingDayBefore.phase],
  ["timing: guidance is complete for every final-preparation phase", finalPreparationGuidanceComplete],
  ["timing: unscheduled, standard, and passed all carry no guidance", timingNullDate.guidance === null && timingStandard.guidance === null && timingPassed.guidance === null],
  // --- Timing module architecture -------------------------------------------
  ["timing module: exports resolveInterviewPlaybookTiming", playbookTiming.includes("export function resolveInterviewPlaybookTiming")],
  ["timing module: exports InterviewPlaybookTimingPhase", playbookTiming.includes("export type InterviewPlaybookTimingPhase")],
  ["timing module: exports InterviewPlaybookFinalPreparationGuidance", playbookTiming.includes("export type InterviewPlaybookFinalPreparationGuidance")],
  ["timing module: imports no React", !playbookTiming.includes('from "react"')],
  ["timing module: imports no Next.js module", !playbookTiming.includes('from "next')],
  ["timing module: imports no Supabase client", !playbookTiming.includes("supabase") && !playbookTiming.includes("Supabase")],
  ["timing module: contains no direct table access", !playbookTiming.includes(".from(")],
  ["timing module: contains no authentication", !playbookTiming.includes("getAuthenticatedActor") && !playbookTiming.includes("auth.uid")],
  ["timing module: contains no randomness", !playbookTiming.includes("Math.random")],
  ["timing module: takes no default now clock", !/now\s*=\s*new Date\(\)/.test(playbookTiming)],
  ["timing module: reads no environment variables", !playbookTiming.includes("process.env")],
  ["timing module: does not use localStorage", !playbookTiming.includes("localStorage")],
  ["timing module: calculates no readiness score", !playbookTiming.includes("readinessScore") && !/readiness\s*[:=]/.test(playbookTiming)],
  ["timing module: calculates no passing probability", !playbookTiming.includes("passProbability") && !playbookTiming.includes("probability")],
  ["timing module: does not use application status to infer timing", !playbookTiming.includes("applicationStatus") && !playbookTiming.includes("round.status")],
  ["timing module: contains no numerical problem quotas", !/\d+\s*problems?\b/i.test(playbookTiming)],
  ["timing module: contains all five final-preparation phases", ["final-week", "final-three-days", "day-before", "interview-day", "pre-round"].every((phase) => playbookTiming.includes(`"${phase}"`))],
  // --- Final-preparation component -------------------------------------------
  ["final-prep component: exports InterviewPlaybookFinalPreparationMode", finalPreparationComponent.includes("export function InterviewPlaybookFinalPreparationMode")],
  ["final-prep component: is a Server Component", !finalPreparationComponent.includes("use client")],
  ["final-prep component: contains no useState", !finalPreparationComponent.includes("useState")],
  ["final-prep component: contains no useEffect", !finalPreparationComponent.includes("useEffect")],
  ["final-prep component: contains no input control", !finalPreparationComponent.includes("<input")],
  ["final-prep component: contains no form", !finalPreparationComponent.includes("<form")],
  ["final-prep component: imports or calls no Server Action", !finalPreparationComponent.includes('"use server"') && !finalPreparationComponent.includes("Action(")],
  ["final-prep component: uses StatusPill", finalPreparationComponent.includes("StatusPill")],
  ["final-prep component: uses formatInterviewDate", finalPreparationComponent.includes("formatInterviewDate(")],
  ["final-prep component: uses guidance.label", finalPreparationComponent.includes("guidance.label")],
  ["final-prep component: uses guidance.title", finalPreparationComponent.includes("guidance.title")],
  ["final-prep component: uses guidance.description", finalPreparationComponent.includes("guidance.description")],
  ["final-prep component: maps guidance.actions", finalPreparationComponent.includes("guidance.actions.map(")],
  ["final-prep component: links to round.preparationHref", finalPreparationComponent.includes("round.preparationHref")],
  ["final-prep component: links to /interview-tips#checklists", finalPreparationComponent.includes("/interview-tips#checklists")],
  ["final-prep component: links to /calendar", finalPreparationComponent.includes('"/calendar"')],
  ["final-prep component: contains the integrity note", finalPreparationComponent.includes("This mode is generated from the scheduled round time. It does not measure readiness or predict the interview outcome.")],
  ["final-prep component: never references durationMinutes", !finalPreparationComponent.includes("durationMinutes")],
  ["final-prep component: never references private notes", !finalPreparationComponent.includes("private_notes") && !finalPreparationComponent.includes("private notes")],
  ["final-prep component: never references meeting links", !finalPreparationComponent.includes("meeting_link") && !finalPreparationComponent.includes("meetingLink")],
  ["final-prep component: never references recruiter details", !finalPreparationComponent.includes("recruiter")],
  ["final-prep component: never references interviewer details", !finalPreparationComponent.includes("interviewer")],
  ["final-prep component: calls no query function", !finalPreparationComponent.includes("await ") && !finalPreparationComponent.includes("get" + "InterviewPlaybookOverview") && !finalPreparationComponent.includes("getInterviewPreparationHub")],
  ["final-prep component: calculates no percentage", !finalPreparationComponent.includes("* 100") && !finalPreparationComponent.includes("toFixed")],
  ["final-prep component: never uses a bare primary button without button-secondary", !/className="button"/.test(finalPreparationComponent)],
  // --- Page integration -------------------------------------------------------
  ["playbook page: creates one explicit now clock", playbookPage.includes("const now = new Date();")],
  ["playbook page: passes now to the overview query", playbookPage.includes("getInterviewPlaybookOverview(now)")],
  ["playbook page: calls resolveInterviewPlaybookTiming", playbookPage.includes("resolveInterviewPlaybookTiming({")],
  ["playbook page: passes primaryRound.scheduledAt to the timing resolver", playbookPage.includes("scheduledAt: primaryRound.scheduledAt")],
  ["playbook page: passes primaryRound.timezone to the timing resolver", playbookPage.includes("timezone: primaryRound.timezone")],
  ["playbook page: passes the shared now to the timing resolver", /resolveInterviewPlaybookTiming\(\{[^}]*\bnow\b/.test(playbookPage)],
  ["playbook page: imports InterviewPlaybookFinalPreparationMode", playbookPage.includes("InterviewPlaybookFinalPreparationMode")],
  ["playbook page: renders the panel only when primaryRound, primaryAction, and timing guidance all exist", playbookPage.includes("primaryRound && primaryAction && primaryTiming?.guidance")],
  ["playbook page: places the final-preparation panel after the dominant action and before the queue", playbookPage.indexOf("{renderDominantAction()}") < playbookPage.indexOf("<InterviewPlaybookFinalPreparationMode") && playbookPage.indexOf("<InterviewPlaybookFinalPreparationMode") < playbookPage.indexOf("Upcoming preparation queue")],
  ["playbook page: does not render the panel inside a map", !/\.map\([\s\S]{0,400}InterviewPlaybookFinalPreparationMode/.test(playbookPage)],
  ["playbook page: still calls no sort", !playbookPage.includes(".sort(")],
  ["playbook page: still calls only getInterviewPlaybookOverview as its data query", (playbookPage.match(/await get[A-Za-z]+\(/g) ?? []).every((call) => call.startsWith("await getInterviewPlaybookOverview("))],
  ["playbook page: adds no direct Supabase access", !playbookPage.includes(".from(") && !playbookPage.includes("createSupabaseServerClient") && !playbookPage.includes("createSupabaseAdminClient")],
  ["playbook page: adds no Server Action", !playbookPage.includes('"use server"')],
  ["playbook page: adds no API fetch", !playbookPage.includes("fetch(")],
  ["playbook page: never uses the DSA interview-date preference", !playbookPage.includes("dsa_interview_date")],
  ["playbook page: never displays durationMinutes", !playbookPage.includes("durationMinutes")],
  ["playbook page: calculates no readiness score", !playbookPage.includes("readinessScore") && !/readiness\s*[:=]/.test(playbookPage)],
  ["playbook page: calculates no probability", !playbookPage.includes("passProbability") && !/probability\s*[:=]/.test(playbookPage)],
  ["playbook page: calculates no checklist percentage", !playbookPage.includes("* 100") && !playbookPage.includes("toFixed")],
  ["playbook page: still contains all six dominant-action states", ["Branch A:", "Branch B:", "Branch C:", "Branch D:", "Branch E:", "Branch F:"].every((marker) => playbookPage.includes(marker))],
  ["playbook page: still caps the preparation queue at six", playbookPage.includes(".slice(0, 6)")],
  ["playbook page: still caps overdue records at three", playbookPage.includes(".slice(0, 3)")],
  // --- Content integrity -------------------------------------------------------
  ["content integrity: no unauthorized outcome claims or quotas", ![playbookTiming, finalPreparationComponent, playbookPage].some((source) => /you will pass|likely to pass|readiness score|percent ready|confidence score|guarantee|must solve|problems per day/i.test(source))],
  ["content integrity: no unauthorized-AI guidance", ![playbookTiming, finalPreparationComponent, playbookPage].some((source) => /use (chatgpt|an ai tool|an llm)/i.test(source))],
  ["content integrity: does not imply checklists are saved", ![playbookTiming, finalPreparationComponent].some((source) => /save(d)? (this )?checklist|checklist is saved/i.test(source))],
  ["content integrity: does not instruct revealing proprietary questions", ![playbookTiming, finalPreparationComponent, playbookPage].some((source) => /share (the )?(actual|real|exact) questions|leak.{0,15}questions/i.test(source))],
  ["content integrity: no medical or legal claim", ![playbookTiming, finalPreparationComponent].some((source) => /\b(diagnos|prescri|legal advice|medical advice)\w*/i.test(source))],
];

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview preparation hub qualification passed (${cases.length} cases).`);
