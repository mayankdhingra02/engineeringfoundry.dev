"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Clock3,
  ExternalLink,
  MessageSquareText,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMockPreparationHref,
  getMockRubric,
  mockTrackLabels,
  plansForMockTrack,
  resolveMockContent,
} from "@/data/mock-interviews";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import {
  canonicalMockInterviewPageHref,
  mockInterviewConfigurationKey,
  mockInterviewPageHref,
  mockInterviewShareHref,
  mockInterviewTracks,
  parseMockInterviewUrlState,
  type MockInterviewUrlState,
} from "@/lib/mock-interviews/url-state";
import type {
  BehavioralQuestion,
  DsaQuestion,
  MlDesignProblem,
  MockPracticeMode,
  MockSessionPlan,
  MockTrack,
  SystemDesignProblem,
} from "@/types";
import { PageHero, SectionHeading, StatusPill } from "./page-shell";
import { saveMockInterviewReview } from "@/app/mock-interviews/actions";

const ratings = ["Strong", "Developing", "Needs attention"] as const;
type Rating = (typeof ratings)[number];
type TimerState = "idle" | "running" | "paused";

// Next can retain client-state snapshots for native history entries. Keep the
// privacy epoch outside those snapshots so a traversed entry cannot revive an
// earlier session's timer, ratings, or notes.
let mockHistoryTraversalVersion = 0;
let mockPrivateSessionActive = false;

function restoreMockBuilderFocusAfterHistory(expectedPathname: string) {
  let observer: MutationObserver | null = null;
  let focusTimer: number | null = null;
  let disconnectTimer: number | null = null;
  const cleanup = () => {
    observer?.disconnect();
    if (focusTimer !== null) window.clearTimeout(focusTimer);
    if (disconnectTimer !== null) window.clearTimeout(disconnectTimer);
  };
  const focusStartControl = () => {
    const startControl = document.getElementById("mock-start-practice") as HTMLButtonElement | null;
    const activeElement = document.activeElement;
    const focusIsUnclaimed = activeElement === document.body
      || !(activeElement instanceof HTMLElement)
      || !activeElement.isConnected;
    if (window.location.pathname !== expectedPathname) {
      cleanup();
      return true;
    }
    if (!startControl?.isConnected || startControl.disabled || !startControl.getClientRects().length || !focusIsUnclaimed) return false;
    observer?.disconnect();
    focusTimer = window.setTimeout(() => {
      const currentFocus = document.activeElement;
      const focusRemainsUnclaimed = currentFocus === document.body
        || !(currentFocus instanceof HTMLElement)
        || !currentFocus.isConnected;
      if (window.location.pathname === expectedPathname && startControl.isConnected && !startControl.disabled && startControl.getClientRects().length && focusRemainsUnclaimed) startControl.focus();
      cleanup();
    }, 0);
    return true;
  };
  if (focusStartControl()) return cleanup;
  observer = new MutationObserver(() => focusStartControl());
  observer.observe(document.body, { attributes: true, attributeFilter: ["disabled"], childList: true, subtree: true });
  disconnectTimer = window.setTimeout(cleanup, 1000);
  return cleanup;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function promptText(plan: MockSessionPlan) {
  const content = resolveMockContent(plan);
  if (!content) return "This prompt is currently unavailable.";
  if (plan.track === "dsa") return (content as DsaQuestion).originalPrompt ?? "This original prompt is currently unavailable.";
  if (plan.track === "behavioral") return (content as BehavioralQuestion).prompt;
  return (content as SystemDesignProblem | MlDesignProblem).prompt;
}

function promptContext(plan: MockSessionPlan) {
  const content = resolveMockContent(plan);
  if (!content) return { label: "Unavailable", summary: "Choose another prompt.", tags: [] as string[] };
  if (plan.track === "dsa") {
    const question = content as DsaQuestion;
    return { label: `${question.difficulty} · Original Engineering Foundry prompt`, summary: question.note, tags: [...question.topics, ...question.patterns].slice(0, 5) };
  }
  if (plan.track === "behavioral") {
    const question = content as BehavioralQuestion;
    return { label: `${question.category} · Original Engineering Foundry prompt`, summary: "Use a truthful experience and keep confidential details out of the answer.", tags: question.scope };
  }
  const problem = content as SystemDesignProblem | MlDesignProblem;
  return { label: `${problem.difficulty} · Original Engineering Foundry prompt`, summary: problem.summary, tags: problem.domains };
}

function revealGuidance(plan: MockSessionPlan) {
  const content = resolveMockContent(plan);
  if (!content) return [];
  if (plan.track === "dsa") return [
    (content as DsaQuestion).note,
    "State the invariant and complexity before committing to implementation details.",
    "Use the full preparation page after the session; this packet intentionally does not reveal a complete solution.",
  ];
  if (plan.track === "system-design") {
    const problem = content as SystemDesignProblem;
    return [...problem.clarifyingQuestions.slice(0, 3), ...problem.keyTradeoffs.slice(0, 2)];
  }
  if (plan.track === "ml-design") {
    const problem = content as MlDesignProblem;
    return [...problem.productGoal.slice(0, 2), ...problem.tradeoffs.slice(0, 3)];
  }
  const question = content as BehavioralQuestion;
  return [...question.answerGuidance, ...question.followUps];
}

function analyticsProperties(plan: MockSessionPlan, mode: MockPracticeMode) {
  return { track: plan.track, mode, prompt_id: plan.content_reference.id, rubric_id: plan.rubric_id };
}

export function MockInterviewLab({ accountPlatformAvailable }: { accountPlatformAvailable: boolean }) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const urlState = useMemo(() => parseMockInterviewUrlState(queryString), [queryString]);
  const { track: selectedTrack, problem: selectedSlug, mode } = urlState;
  const configurationKey = mockInterviewConfigurationKey(urlState);
  const [activeSessionConfigurationKey, setActiveSessionConfigurationKey] = useState<string | null>(null);
  const [activeSessionTraversalVersion, setActiveSessionTraversalVersion] = useState<number | null>(null);
  const sessionActive = activeSessionConfigurationKey === configurationKey
    && activeSessionTraversalVersion === mockHistoryTraversalVersion;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [marks, setMarks] = useState<Record<string, Rating>>({});
  const [notes, setNotes] = useState({ strength: "", improvement: "", followUp: "" });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const sessionId = useRef<string | null>(null);
  const startedAt = useRef<string | null>(null);
  const sessionGeneration = useRef(0);
  const trackedGuidance = useRef(new Set<string>());
  const pendingHistoryFocusCleanup = useRef<(() => void) | null>(null);

  const availablePlans = useMemo(() => plansForMockTrack(selectedTrack), [selectedTrack]);
  const selectedPlan = availablePlans.find((plan) => plan.slug === selectedSlug) ?? availablePlans[0];
  const rubric = getMockRubric(selectedPlan.rubric_id)!;
  const context = promptContext(selectedPlan);

  const resetPrivateSession = useCallback(() => {
    mockPrivateSessionActive = false;
    sessionGeneration.current += 1;
    setActiveSessionConfigurationKey(null);
    setActiveSessionTraversalVersion(null);
    setElapsedSeconds(0);
    setTimerState("idle");
    setMarks({});
    setNotes({ strength: "", improvement: "", followUp: "" });
    setCopyState("idle");
    setLinkCopyState("idle");
    setSaveState("idle");
    sessionId.current = null;
    startedAt.current = null;
  }, []);

  useEffect(() => {
    if (!queryString) return;
    const canonicalHref = canonicalMockInterviewPageHref(window.location.pathname, urlState, queryString, window.location.hash);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (canonicalHref !== currentHref) window.history.replaceState(null, "", canonicalHref);
  }, [queryString, urlState]);

  useEffect(() => {
    const labPathname = window.location.pathname;
    const resetAfterHistoryTraversal = () => {
      mockHistoryTraversalVersion += 1;
      const activeElement = document.activeElement;
      const restoreBuilderFocus = mockPrivateSessionActive && (
        activeElement === document.body
        || (activeElement instanceof HTMLElement && Boolean(activeElement.closest("#session-workspace")))
      );
      pendingHistoryFocusCleanup.current?.();
      pendingHistoryFocusCleanup.current = null;
      if (restoreBuilderFocus && window.location.pathname === labPathname) pendingHistoryFocusCleanup.current = restoreMockBuilderFocusAfterHistory(labPathname);
      resetPrivateSession();
    };
    window.addEventListener("popstate", resetAfterHistoryTraversal);
    return () => {
      pendingHistoryFocusCleanup.current?.();
      pendingHistoryFocusCleanup.current = null;
      mockPrivateSessionActive = false;
      window.removeEventListener("popstate", resetAfterHistoryTraversal);
    };
  }, [resetPrivateSession]);

  useEffect(() => {
    if (timerState !== "running") return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [timerState]);

  function commitUrlState(nextState: MockInterviewUrlState) {
    const href = mockInterviewPageHref(window.location.pathname, nextState, window.location.hash);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (href === currentHref) return;
    if (mockInterviewConfigurationKey(nextState) !== configurationKey) resetPrivateSession();
    window.history.pushState(null, "", href);
  }

  function chooseTrack(nextTrack: MockTrack) {
    const nextPlan = plansForMockTrack(nextTrack)[0];
    commitUrlState({ track: nextTrack, problem: nextPlan.slug, mode });
  }

  function choosePlan(slug: string) {
    commitUrlState({ ...urlState, problem: slug });
  }

  function chooseMode(nextMode: MockPracticeMode) {
    commitUrlState({ ...urlState, mode: nextMode });
  }

  function randomize() {
    const pool = availablePlans.filter((plan) => plan.slug !== selectedPlan.slug);
    const next = (pool.length ? pool : availablePlans)[Math.floor(Math.random() * (pool.length || availablePlans.length))];
    choosePlan(next.slug);
    track("mock_prompt_randomized", analyticsProperties(next, mode));
  }

  function startSession() {
    resetPrivateSession();
    mockPrivateSessionActive = true;
    setActiveSessionConfigurationKey(configurationKey);
    setActiveSessionTraversalVersion(mockHistoryTraversalVersion);
    setTimerState("running");
    sessionId.current = crypto.randomUUID();
    startedAt.current = new Date().toISOString();
    const properties = analyticsProperties(selectedPlan, mode);
    track("mock_session_configured", properties);
    track("mock_session_started", properties);
    requestAnimationFrame(() => document.querySelector("#session-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function savePracticeReview() {
    const ratingsForSave = Object.entries(marks).map(([dimension_id, rating]) => ({ dimension_id, rating }));
    if (!accountPlatformAvailable || !ratingsForSave.length || !sessionId.current || !startedAt.current) { setSaveState("failed"); return; }
    const savingGeneration = sessionGeneration.current;
    const savingSessionId = sessionId.current;
    const savingStartedAt = startedAt.current;
    setSaveState("saving");
    const result = await saveMockInterviewReview({ sessionId: savingSessionId, track: selectedPlan.track, mode, planId: selectedPlan.id, promptId: selectedPlan.content_reference.id, rubricId: selectedPlan.rubric_id, startedAt: savingStartedAt, elapsedSeconds, strength: notes.strength, improvement: notes.improvement, followUp: notes.followUp, ratings: ratingsForSave });
    if (result.ok) track("mock_review_saved", analyticsProperties(selectedPlan, mode));
    if (savingGeneration !== sessionGeneration.current || savingSessionId !== sessionId.current) return;
    setSaveState(result.ok ? "saved" : "failed");
  }

  function trackGuidance(section: string, open: boolean) {
    const key = `${selectedPlan.id}:${section}`;
    if (!open || trackedGuidance.current.has(key)) return;
    trackedGuidance.current.add(key);
    track("mock_guidance_opened", { ...analyticsProperties(selectedPlan, mode), section });
  }

  async function copySessionLink() {
    try {
      await navigator.clipboard.writeText(mockInterviewShareHref(window.location.origin, window.location.pathname, urlState));
      setLinkCopyState("copied");
    } catch {
      setLinkCopyState("failed");
    }
  }

  async function copyFeedback() {
    const rubricLines = rubric.dimensions.map((dimension) => `- ${dimension.label}: ${marks[dimension.id] ?? "Not marked"}`);
    const feedback = [
      `Engineering Foundry practice feedback — ${selectedPlan.title}`,
      `${mockTrackLabels[selectedTrack]} · ${mode === "solo" ? "Solo practice" : "Peer practice"}`,
      "",
      ...rubricLines,
      "",
      `Strength: ${notes.strength || "—"}`,
      `One improvement: ${notes.improvement || "—"}`,
      `Follow-up practice: ${notes.followUp || "—"}`,
      "",
      "Personal practice notes only—not an employer score or hiring prediction.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(feedback);
      setCopyState("copied");
      track("mock_feedback_copied", analyticsProperties(selectedPlan, mode));
    } catch {
      setCopyState("failed");
    }
  }

  return <>
    <PageHero eyebrow="Mock Interview Practice Lab" title="Run a realistic practice session—solo or with your own peer." description="Choose an original prompt, use a suggested structure and session timer, then reflect with a qualitative rubric. No account, matching service, or saved feedback required.">
      <a className="button" href="#session-builder">Build a session <ArrowRight size={16} /></a>
      <span className="hero-inline-note"><ShieldCheck size={15} /> Private by default</span>
    </PageHero>

    <section className="section" id="session-builder"><div className="page-width">
      <SectionHeading eyebrow="Session builder" title="Choose the practice you need today." description="All durations are a suggested practice format, not official employer interview lengths. Random selection uses only active, original Engineering Foundry content." />
      <div className="mock-builder">
        <fieldset className="mock-track-picker"><legend>1. Track</legend>{mockInterviewTracks.map((item) => <button type="button" key={item} className={selectedTrack === item ? "selected" : ""} aria-pressed={selectedTrack === item} onClick={() => chooseTrack(item)} disabled={sessionActive}><span>{mockTrackLabels[item]}</span><small>{plansForMockTrack(item).length} prompts</small></button>)}</fieldset>
        <fieldset className="mock-mode-picker"><legend>2. Practice mode</legend>
          <button type="button" className={mode === "solo" ? "selected" : ""} aria-pressed={mode === "solo"} onClick={() => chooseMode("solo")} disabled={sessionActive}><UserRound size={19} /><span><strong>Solo practice</strong><small>Prompt, timer, revealable guidance, and self-review.</small></span></button>
          <button type="button" className={mode === "peer" ? "selected" : ""} aria-pressed={mode === "peer"} onClick={() => chooseMode("peer")} disabled={sessionActive}><Users size={19} /><span><strong>Practice with a peer</strong><small>Candidate packet, interviewer packet, timing, and feedback.</small></span></button>
        </fieldset>
        <div className="mock-prompt-picker"><label htmlFor="mock-prompt">3. Prompt</label><div><select id="mock-prompt" value={selectedPlan.slug} onChange={(event) => choosePlan(event.target.value)} disabled={sessionActive} aria-describedby="selected-prompt-description">{availablePlans.map((plan) => <option value={plan.slug} key={plan.id}>{plan.title}</option>)}</select><button type="button" className="button button-secondary" onClick={randomize} disabled={sessionActive} aria-label={`Choose a random ${mockTrackLabels[selectedTrack]} prompt`}><RefreshCw size={15} />Random prompt</button></div><p id="selected-prompt-description" aria-live="polite"><strong>Selected:</strong> {selectedPlan.title} · {selectedPlan.recommended_minutes.min}–{selectedPlan.recommended_minutes.max} suggested minutes</p></div>
        <div className="mock-builder-actions"><button id="mock-start-practice" type="button" className="button" onClick={startSession} disabled={sessionActive}><Play size={15} />Start practice</button><button type="button" className="button button-secondary" onClick={copySessionLink}><Clipboard size={15} />Copy session link</button><span role="status">{linkCopyState === "copied" ? "Link copied." : linkCopyState === "failed" ? "Could not copy the link." : "Only track, prompt, and mode are included."}</span></div>
      </div>
    </div></section>

    {sessionActive && <section className="section section-alt mock-workspace-section" id="session-workspace"><div className="page-width">
      <div className="mock-session-heading"><div><span className="section-kicker">Active session · {mode === "solo" ? "Solo" : "Peer"}</span><h2>{selectedPlan.title}</h2><p>{mockTrackLabels[selectedTrack]} · Suggested practice format: {selectedPlan.recommended_minutes.min}–{selectedPlan.recommended_minutes.max} minutes</p></div><button type="button" className="button button-secondary" onClick={resetPrivateSession}><RotateCcw size={15} />Start another session</button></div>

      <div className="mock-timer" role="timer" aria-label={`Session timer, ${formatTime(elapsedSeconds)} elapsed`}><div><Clock3 size={20} /><span><small>Elapsed time</small><strong aria-live="off">{formatTime(elapsedSeconds)}</strong></span></div><p>Use the clock as a guide; exact timing is not mandatory.</p><div className="mock-timer-controls">{timerState !== "running" && <button type="button" className="button" onClick={() => setTimerState("running")} aria-label={timerState === "paused" ? "Resume session timer" : "Start session timer"}><Play size={14} />{timerState === "paused" ? "Resume" : "Start"}</button>}{timerState === "running" && <button type="button" className="button" onClick={() => setTimerState("paused")} aria-label="Pause session timer"><Pause size={14} />Pause</button>}<button type="button" className="button button-secondary" onClick={() => { setElapsedSeconds(0); setTimerState("idle"); }} aria-label="Reset session timer"><RotateCcw size={14} />Reset</button></div></div>

      <div className="mock-packet-grid">
        <article className="mock-candidate-packet"><header><span className="icon-well"><UserRound size={20} /></span><div><small>Candidate packet</small><h2>Start here—guidance stays hidden.</h2></div></header><div className="mock-prompt-meta"><span>{context.label}</span>{context.tags.map((tag) => <b key={tag}>{tag}</b>)}</div><h3>{promptText(selectedPlan)}</h3><p>{context.summary}</p><div className="mock-expectations"><strong>Interview expectations</strong><ul>{selectedPlan.candidate_instructions.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul></div></article>
        <aside className="mock-timing-card"><small>Suggested session structure</small><ol>{selectedPlan.sections.map((section, index) => <li key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{section.title}</strong><small>About {section.minutes} min</small></div></li>)}</ol><p>This is an Engineering Foundry practice format, not an official employer standard.</p></aside>
      </div>

      {mode === "solo" ? <details className="mock-guidance" onToggle={(event) => trackGuidance("solo_guidance", event.currentTarget.open)}><summary><span><Sparkles size={18} /></span><div><strong>Reveal solo practice guidance</strong><small>Open only after you have made an initial attempt.</small></div></summary><ul>{revealGuidance(selectedPlan).map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul><Link href={getMockPreparationHref(selectedPlan)}>Open the full practice page after this session <ArrowRight size={14} /></Link></details> : <details className="mock-guidance mock-interviewer-packet" onToggle={(event) => trackGuidance("interviewer_packet", event.currentTarget.open)}><summary><span><MessageSquareText size={18} /></span><div><strong>Open interviewer packet</strong><small>Candidate: hand the screen to your peer before opening.</small></div></summary><div className="mock-interviewer-body"><section><h3>Follow-ups and facilitation</h3><ul>{selectedPlan.interviewer_instructions.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul></section><section><h3>Observe these dimensions</h3><ul>{rubric.dimensions.map((dimension) => <li key={dimension.id}><strong>{dimension.label}</strong><span>{dimension.description}</span></li>)}</ul></section><Link href={getMockPreparationHref(selectedPlan)}>Open the full practice page after this session <ArrowRight size={14} /></Link></div></details>}

      <section className="mock-feedback"><SectionHeading eyebrow="Qualitative reflection" title={mode === "solo" ? "Review your reasoning, not a predicted outcome." : "Give specific feedback without pretending to make a hiring decision."} description={rubric.disclaimer} />
        <p className="session-only-banner"><ShieldCheck size={17} /><span><strong>Private until you save.</strong> Ratings and notes stay in browser memory until you explicitly save this review. Saved ratings are self-report evidence; saved reflections remain private and never determine evidence.</span></p>
        <div className="mock-rubric">{rubric.dimensions.map((dimension) => <fieldset key={dimension.id}><legend><strong>{dimension.label}</strong><span>{dimension.description}</span></legend><div>{ratings.map((rating) => <label key={rating}><input type="radio" name={`rubric-${dimension.id}`} value={rating} checked={marks[dimension.id] === rating} onChange={() => setMarks((current) => ({ ...current, [dimension.id]: rating }))} /><span><i aria-hidden="true" />{rating}</span></label>)}</div></fieldset>)}</div>
        <div className="mock-notes"><label><span>Strength</span><textarea value={notes.strength} onChange={(event) => setNotes((current) => ({ ...current, strength: event.target.value }))} placeholder="What worked well?" /></label><label><span>One improvement</span><textarea value={notes.improvement} onChange={(event) => setNotes((current) => ({ ...current, improvement: event.target.value }))} placeholder="What is one concrete adjustment?" /></label><label><span>Follow-up practice</span><textarea value={notes.followUp} onChange={(event) => setNotes((current) => ({ ...current, followUp: event.target.value }))} placeholder="What should the next session focus on?" /></label></div>
        <div className="mock-feedback-actions"><button type="button" className="button" onClick={copyFeedback}><Clipboard size={15} />Copy feedback</button>{accountPlatformAvailable && <button type="button" className="button button-secondary" onClick={savePracticeReview} disabled={saveState === "saving"}><ShieldCheck size={15} />{saveState === "saving" ? "Saving review…" : "Save practice review"}</button>}<span role="status">{!accountPlatformAvailable ? "Private saving is unavailable in this public configuration. Copy feedback to keep it yourself." : saveState === "saved" ? "Saved privately. Your review remains self-reported." : saveState === "failed" ? "Add at least one rating and sign in to save this private review." : "Not saved automatically."}</span><span role="status">{copyState === "copied" ? "Feedback copied to your clipboard." : copyState === "failed" ? "Clipboard access failed; your review is still available here." : "Notes are private and never used to determine evidence."}</span></div>
      </section>
    </div></section>}

    <section className="section"><div className="page-width mock-peer-boundary"><div><SectionHeading eyebrow="Peer practice boundary" title="Bring a peer you already have—or ask the community." description="Engineering Foundry supplies the packets and structure in this phase. It does not automatically match users, schedule sessions, guarantee availability, or verify interviewers." /><a className="button" href={siteConfig.discordUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("mock_community_clicked", { placement: "mock_interview_lab" })}>Find peers in the community <ExternalLink size={15} /></a></div><aside><StatusPill tone="accent">Coming later</StatusPill><h3>Experienced interviewer practice</h3><p>Matching, verified interviewer profiles, bookings, payments, and a marketplace are intentionally not part of this release.</p></aside></div></section>
  </>;
}
