"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPersonalizedTopicRecommendations,
  getPracticeProblemRecommendations,
  getRecommendationCounts,
  systemDesignLevelOptions,
  systemDesignPreparationWindowOptions,
  systemDesignRoleOptions,
  systemDesignTopics,
  type SystemDesignLevel,
  type SystemDesignPreparationWindow,
  type SystemDesignRecommendationGroup,
  type SystemDesignTargetRole,
  type SystemDesignTopic,
  type SystemDesignTopicPriority,
  type SystemDesignTopicRecommendation,
} from "@/data/system-design/recommendations";
import {
  generateSystemDesignStudyPlan,
  getSystemDesignStudyPlanDays,
  systemDesignStudyTimeOptions,
  type SystemDesignStudyItemStatus,
  type SystemDesignStudyMinutesPerDay,
} from "@/data/system-design/study-plan";
import { cn } from "@/lib/utils";
import { SystemDesignStudyPlanView } from "./system-design-study-plan";
import { SaveStudyPlanControl } from "./save-study-plan-control";

type TopicFilter = "all" | SystemDesignRecommendationGroup;
type PlannerView = "curriculum" | "study-plan";
type StoredPreferences = {
  level?: SystemDesignLevel;
  preparationWindow?: SystemDesignPreparationWindow;
  role?: SystemDesignTargetRole;
  minutesPerDay?: SystemDesignStudyMinutesPerDay;
  view?: PlannerView;
  missedDays?: number[];
};

const preferencesStorageKey = "engineering-foundry-system-design-recommendations-v1";
const progressStorageKey = "engineering-foundry-system-design-study-progress-v1";
const groupLabels: Record<SystemDesignRecommendationGroup, string> = { "focus-now": "Focus Now", "learn-next": "Learn Next", "skip-for-now": "Skip for Now" };
const groupDescriptions: Record<SystemDesignRecommendationGroup, string> = {
  "focus-now": "Prioritize these topics before your interview.",
  "learn-next": "Cover these once the essential material feels secure.",
  "skip-for-now": "Useful depth that can safely wait for a later study pass.",
};
const priorityLabels: Record<SystemDesignTopicPriority, string> = { "must-know": "Must Know", important: "Important", advanced: "Advanced" };
const validLevels = new Set(systemDesignLevelOptions.map((option) => option.value));
const validWindows = new Set(systemDesignPreparationWindowOptions.map((option) => option.value));
const validRoles = new Set(systemDesignRoleOptions.flatMap((option) => option.value === "general" ? [] : [option.value]));
const validStudyTimes = new Set(systemDesignStudyTimeOptions.map((option) => option.value));

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function savePreferences(preferences: StoredPreferences) {
  try { window.localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences)); } catch { /* Storage is optional. */ }
}

function TopicRow({ topic, recommendation }: { topic: SystemDesignTopic; recommendation?: SystemDesignTopicRecommendation }) {
  const priority = recommendation?.priority ?? topic.defaultPriority;
  const label = recommendation ? groupLabels[recommendation.group] : priorityLabels[priority];
  const className = recommendation?.group ?? priority;
  return <li className="sd-focus-topic">
    <Link href={topic.href} title={recommendation?.reason}>
      <span className="sd-focus-topic-copy"><strong>{topic.title}</strong><small>{topic.category}{topic.published ? "" : " · Coming soon"}</small></span>
      <span className={cn("sd-focus-topic-badge", className)} data-reason={recommendation?.reason} aria-label={recommendation ? `${label}: ${recommendation.reason}` : label}>{label}</span>
      <span className="sd-focus-topic-time"><Clock3 size={12} />{formatDuration(topic.estimatedMinutes)}</span>
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  </li>;
}

function TopicGroup({ title, description, topics }: {
  title: string;
  description: string;
  topics: Array<{ topic: SystemDesignTopic; recommendation?: SystemDesignTopicRecommendation }>;
}) {
  const minutes = topics.reduce((total, item) => total + item.topic.estimatedMinutes, 0);
  return <section className="sd-focus-result-group">
    <header><div><h3>{title}</h3><p>{description}</p></div><span>{topics.length} topics · ~{formatDuration(minutes)}</span></header>
    <ul>{topics.map((item) => <TopicRow key={item.topic.id} {...item} />)}</ul>
  </section>;
}

export function SystemDesignFocusPlanner({ accountPlatformAvailable }: { accountPlatformAvailable: boolean }) {
  const [level, setLevel] = useState<SystemDesignLevel>();
  const [preparationWindow, setPreparationWindow] = useState<SystemDesignPreparationWindow>();
  const [role, setRole] = useState<SystemDesignTargetRole>();
  const [minutesPerDay, setMinutesPerDay] = useState<SystemDesignStudyMinutesPerDay>(60);
  const [view, setView] = useState<PlannerView>("curriculum");
  const [progress, setProgress] = useState<Record<string, SystemDesignStudyItemStatus>>({});
  const [missedDays, setMissedDays] = useState<number[]>([]);
  const [filter, setFilter] = useState<TopicFilter>("all");
  const [showAllDefaultTopics, setShowAllDefaultTopics] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(preferencesStorageKey) ?? "{}") as StoredPreferences;
      window.requestAnimationFrame(() => {
        if (stored.level && validLevels.has(stored.level)) setLevel(stored.level);
        if (stored.preparationWindow && validWindows.has(stored.preparationWindow)) setPreparationWindow(stored.preparationWindow);
        if (stored.role && validRoles.has(stored.role)) setRole(stored.role);
        if (stored.minutesPerDay && validStudyTimes.has(stored.minutesPerDay)) setMinutesPerDay(stored.minutesPerDay);
        if (stored.view === "study-plan") setView("study-plan");
        if (Array.isArray(stored.missedDays)) setMissedDays(stored.missedDays.filter((day) => Number.isInteger(day) && day > 0));
        try {
          const storedProgress = JSON.parse(window.localStorage.getItem(progressStorageKey) ?? "{}") as Record<string, SystemDesignStudyItemStatus>;
          setProgress(Object.fromEntries(Object.entries(storedProgress).filter(([, status]) => status === "not-started" || status === "in-progress" || status === "completed")));
        } catch { /* Ignore malformed progress and preserve curriculum access. */ }
      });
    } catch { /* Ignore malformed or unavailable storage. */ }
  }, []);

  const context = useMemo(() => ({ level, preparationWindow, role }), [level, preparationWindow, role]);
  const recommendations = useMemo(() => getPersonalizedTopicRecommendations(context), [context]);
  const practiceRecommendations = useMemo(() => getPracticeProblemRecommendations(context), [context]);
  const counts = useMemo(() => recommendations ? getRecommendationCounts(recommendations) : null, [recommendations]);
  const selectedLevel = systemDesignLevelOptions.find((option) => option.value === level);
  const selectedWindow = systemDesignPreparationWindowOptions.find((option) => option.value === preparationWindow);
  const selectedRole = systemDesignRoleOptions.find((option) => option.value === (role ?? "general"));
  const personalized = recommendations !== null && counts !== null;
  const effectiveLevel = level ?? "sde2";
  const effectiveWindow = preparationWindow ?? "2-weeks";
  const isDefaultPlan = !level && !preparationWindow && !role;
  const studyPlan = useMemo(() => generateSystemDesignStudyPlan({ level: effectiveLevel, role, preparationWindow: effectiveWindow, minutesPerDay, progress, missedDays }), [effectiveLevel, role, effectiveWindow, minutesPerDay, progress, missedDays]);
  const studyPlanContext = `${isDefaultPlan ? "General SWE" : `${systemDesignLevelOptions.find((option) => option.value === effectiveLevel)?.label} · ${selectedRole?.label}`} · ${getSystemDesignStudyPlanDays(effectiveWindow)} days · ${systemDesignStudyTimeOptions.find((option) => option.value === minutesPerDay)?.label}/day`;

  function updatePreferences(next: StoredPreferences) {
    savePreferences({ level, preparationWindow, role, minutesPerDay, view, ...next, missedDays: [] });
    setMissedDays([]);
    const nextLevel = next.level ?? level;
    const nextWindow = next.preparationWindow ?? preparationWindow;
    setFilter(nextLevel && nextWindow ? "focus-now" : "all");
  }
  function reset() {
    setLevel(undefined); setPreparationWindow(undefined); setRole(undefined); setMinutesPerDay(60); setView("curriculum"); setMissedDays([]); setFilter("all"); setShowAllDefaultTopics(false);
    try { window.localStorage.removeItem(preferencesStorageKey); } catch { /* State reset still succeeds. */ }
  }
  function showFocusNow() {
    setView("curriculum");
    savePreferences({ level, preparationWindow, role, minutesPerDay, view: "curriculum", missedDays });
    setFilter("focus-now");
    window.requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function buildStudyPlan() {
    setView("study-plan");
    savePreferences({ level, preparationWindow, role, minutesPerDay, view: "study-plan", missedDays });
  }
  function adjustPlan() {
    setView("curriculum");
    savePreferences({ level, preparationWindow, role, minutesPerDay, view: "curriculum", missedDays });
    window.requestAnimationFrame(() => controlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function updateStudyStatus(itemId: string, status: SystemDesignStudyItemStatus) {
    const next = { ...progress, [itemId]: status };
    setProgress(next);
    try { window.localStorage.setItem(progressStorageKey, JSON.stringify(next)); } catch { /* Progress remains available for this session. */ }
  }
  function markMissedDay(day: number) {
    const next = missedDays.includes(day) ? missedDays : [...missedDays, day];
    setMissedDays(next);
    savePreferences({ level, preparationWindow, role, minutesPerDay, view: "study-plan", missedDays: next });
  }

  const personalizedGroups = personalized
    ? (["focus-now", "learn-next", "skip-for-now"] as const).filter((group) => filter === "all" || filter === group).map((group) => ({
      id: group,
      title: groupLabels[group],
      description: groupDescriptions[group],
      topics: recommendations.filter((recommendation) => recommendation.group === group).map((recommendation) => ({ topic: recommendation.topic, recommendation })),
    }))
    : [];
  const defaultGroups = (["must-know", "important", "advanced"] as const).map((priority) => ({
    id: priority,
    title: priorityLabels[priority],
    description: priority === "must-know" ? "The default Engineering Foundry foundation for System Design interviews." : priority === "important" ? "Valuable breadth after the foundations are secure." : "Deeper material for longer preparation windows and advanced interviews.",
    topics: systemDesignTopics.filter((topic) => topic.defaultPriority === priority).map((topic) => ({ topic })),
  }));
  const defaultPreviewGroups = [{
    id: "start-here",
    title: "Start here",
    description: "A short preview of the core sequence. Personalize the curriculum above for a focused interview plan.",
    topics: systemDesignTopics.filter((topic) => topic.defaultPriority === "must-know").slice(0, 5).map((topic) => ({ topic })),
  }];
  const focusedPractice = practiceRecommendations?.filter((item) => item.group === "focus-now") ?? [];

  return <div className="sd-focus-planner">
    <section className="sd-focus-controls" aria-labelledby="sd-focus-controls-title" ref={controlsRef}>
      <div className="sd-focus-controls-heading"><div><span><SlidersHorizontal size={14} />Lightweight prep controls</span><h2 id="sd-focus-controls-title">What are you preparing for?</h2></div>{(level || preparationWindow || role || minutesPerDay !== 60) && <button type="button" onClick={reset}><RotateCcw size={13} />Reset recommendations</button>}</div>
      <fieldset><legend>Target level</legend><div className="sd-focus-choice-grid level">{systemDesignLevelOptions.map((option) => <button key={option.value} type="button" aria-pressed={level === option.value} onClick={() => { setLevel(option.value); updatePreferences({ level: option.value, preparationWindow, role }); }}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div></fieldset>
      <fieldset><legend>Target role</legend><div className="sd-focus-choice-grid role">{systemDesignRoleOptions.map((option) => <button key={option.value} type="button" aria-pressed={(role ?? "general") === option.value} onClick={() => { const nextRole = option.value === "general" ? undefined : option.value; setRole(nextRole); updatePreferences({ level, preparationWindow, role: nextRole }); }}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div></fieldset>
      <fieldset><legend>Interview in</legend><div className="sd-focus-choice-grid window">{systemDesignPreparationWindowOptions.map((option) => <button key={option.value} type="button" aria-pressed={preparationWindow === option.value} onClick={() => { setPreparationWindow(option.value); updatePreferences({ level, preparationWindow: option.value, role }); }}>{option.label}</button>)}</div></fieldset>
      <fieldset><legend>Time available per day</legend><div className="sd-focus-choice-grid time">{systemDesignStudyTimeOptions.map((option) => <button key={option.value} type="button" aria-pressed={minutesPerDay === option.value} onClick={() => { setMinutesPerDay(option.value); updatePreferences({ minutesPerDay: option.value }); }}>{option.label}</button>)}</div></fieldset>
    </section>

    <section className={cn("sd-focus-summary", personalized && "personalized")} aria-live="polite">
      <div><span>Your System Design plan</span>{personalized ? <><h2>{selectedLevel?.label} · {selectedRole?.label} · Interview in {selectedWindow?.shortLabel}</h2><p>Start with the first group, then expand only when the essential material feels reliable.</p></> : <><h2>Default Engineering Foundry curriculum</h2><p>Select a level and interview window to answer: “What should I study next?” Role is optional.</p></>}</div>
      {personalized ? <div className="sd-focus-counts"><span className="focus-now"><strong>{counts["focus-now"]}</strong>Focus Now</span><span className="learn-next"><strong>{counts["learn-next"]}</strong>Learn Next</span><span className="skip-for-now"><strong>{counts["skip-for-now"]}</strong>Skip for Now</span></div> : <div className="sd-focus-default-count"><strong>{systemDesignTopics.length}</strong><span>topics remain available</span></div>}
      <div className="sd-focus-summary-actions">{view === "curriculum" && <button className="button" type="button" onClick={buildStudyPlan}><CalendarDays size={15} />Build my study plan</button>}{personalized && <SaveStudyPlanControl input={{ track: "system-design", level: effectiveLevel, preparationWindow: effectiveWindow, role, minutesPerDay }} href="/system-design/plan" label="System Design study plan" accountPlatformAvailable={accountPlatformAvailable} />}{personalized && view === "curriculum" && <button className="button button-secondary" type="button" onClick={showFocusNow}>Start with Focus Now<ArrowRight size={15} /></button>}<Link className="button button-secondary" href="/system-design/problems">Browse practice problems<ArrowRight size={15} /></Link></div>
    </section>

    <div className="sd-focus-mode-tabs" role="group" aria-label="System Design preparation view"><button type="button" aria-pressed={view === "curriculum"} onClick={() => { setView("curriculum"); savePreferences({ level, preparationWindow, role, minutesPerDay, view: "curriculum", missedDays }); }}>Curriculum</button><button type="button" aria-pressed={view === "study-plan"} onClick={buildStudyPlan}>Study Plan</button></div>

    {view === "curriculum" ? <><div className="sd-focus-tabs" role="group" aria-label="Filter personalized System Design topics">{(["all", "focus-now", "learn-next", "skip-for-now"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} disabled={!personalized && value !== "all"} onClick={() => setFilter(value)}>{value === "all" ? "All Topics" : groupLabels[value]}</button>)}</div>
    {personalized && filter !== "all" && <div className="sd-focus-filter-note"><span>Showing {counts[filter]} recommended topics. The rest of the curriculum is still available.</span><button type="button" onClick={() => setFilter("all")}>Show all {systemDesignTopics.length} topics</button></div>}
    {!personalized && !showAllDefaultTopics && <div className="sd-focus-default-preview"><span>Previewing 5 of {systemDesignTopics.length} topics.</span><button type="button" onClick={() => setShowAllDefaultTopics(true)}>Browse all {systemDesignTopics.length} topics</button></div>}
    <div className="sd-focus-topic-library" id="personalized-topic-list" ref={listRef}>{(personalized ? personalizedGroups : showAllDefaultTopics ? defaultGroups : defaultPreviewGroups).map((group) => <TopicGroup key={group.id} title={group.title} description={group.description} topics={group.topics} />)}</div>

    {personalized && focusedPractice.length > 0 && <section className="sd-focus-practice">
      <header><div><span>Practice recommendations</span><h3>Recommended practice for {selectedRole?.label}</h3><p>These prompts reinforce the architecture decisions emphasized by your current plan.</p></div><small>{focusedPractice.length} Focus Now</small></header>
      <div className="sd-focus-practice-grid">{focusedPractice.map(({ problem, group, reason }) => <Link key={problem.id} href={problem.href} title={reason}><span><strong>{problem.title}</strong><small>{reason}</small></span><span className={cn("sd-focus-topic-badge", group)}>{groupLabels[group]}</span><ArrowRight size={14} aria-hidden="true" /></Link>)}</div>
      <p>All classic System Design problems remain available in the course navigation.</p>
    </section>}</> : <SystemDesignStudyPlanView plan={studyPlan} planContext={studyPlanContext} isDefaultPlan={isDefaultPlan} onStatusChange={updateStudyStatus} onMissedDay={markMissedDay} onAdjustPlan={adjustPlan} />}
  </div>;
}
