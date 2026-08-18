"use client";

import { ArrowDown, ArrowRight, Circle, Compass, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDsaLevelRoadmap, getRoadmapPriorityCounts, type ProblemClassification, type RoadmapLevel, type RoadmapStage, type TopicPriority } from "@/data/dsa/level-roadmaps";
import { getRoadmapCompany, type RoadmapCompanyId } from "@/data/dsa/roadmap-companies";
import { getRoadmapProblemIds, resolveRoadmapProblems } from "@/data/dsa/roadmap-problem-registry";
import { emptyRoadmapProgress, getRecommendedRoadmapItems, isRoadmapCompanyId, isRoadmapLevel, isRoadmapPlanId, type RoadmapPlanId, type RoadmapProgressSnapshot } from "@/data/dsa/roadmap-planning";
import { track } from "@/lib/analytics";
import { LevelRoadmapModule } from "./level-roadmap-module";
import { LevelRoadmapSelector } from "./level-roadmap-selector";
import { CompanyRoadmapOverlay, defaultRoadmapFilters, PersonalizedRoadmapSummary, RoadmapFilters, RoadmapNextUp, RoadmapPlanningControls, RoadmapRecommendationGroups, RoadmapReviewReadiness, RoadmapUsageGuide, type RoadmapFilterState } from "./roadmap-personalization";
import { OptionalRoadmapTopics, RoadmapDiagnostic, RoadmapFailureModes, RoadmapPracticeSections } from "./sde1-practice-sections";
import { savePreferredDsaRoadmapAction } from "@/features/dsa/progress/actions";
import type { DsaProgressMap } from "@/lib/dsa/progress";

const priorityGuidance: { priority: TopicPriority; label: string; description: string }[] = [
  { priority: "core", label: "Core", description: "Learn first" },
  { priority: "high-value", label: "High Value", description: "Cover after the core" },
  { priority: "advanced", label: "Advanced", description: "Defer when time is limited" },
];

function replaceQuery(params: URLSearchParams, pathname: string) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function LevelRoadmapExperience({ accountProgress = {}, signedIn = false, preferredRoadmap = "sde2" }: { accountProgress?: DsaProgressMap; signedIn?: boolean; preferredRoadmap?: RoadmapLevel }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [preferencePending, startPreferenceTransition] = useTransition();
  const [preferenceError, setPreferenceError] = useState("");
  const levelParam = searchParams.get("level");
  const planParam = searchParams.get("plan");
  const companyParam = searchParams.get("company");
  const selectedLevel: RoadmapLevel | null = isRoadmapLevel(levelParam) ? levelParam : (signedIn ? preferredRoadmap : null);
  const selectedPlan: RoadmapPlanId = isRoadmapPlanId(planParam) ? planParam : "no-deadline";
  const selectedCompany: RoadmapCompanyId | undefined = isRoadmapCompanyId(companyParam) ? companyParam : undefined;
  const roadmap = selectedLevel ? getDsaLevelRoadmap(selectedLevel) : null;
  const [expandedModule, setExpandedModule] = useState<RoadmapStage | null>(() => roadmap?.modules[0].id ?? null);
  const [filters, setFilters] = useState<RoadmapFilterState>(defaultRoadmapFilters);
  const deferredSearch = useDeferredValue(filters.search.trim().toLowerCase());
  const [showAllCurriculum, setShowAllCurriculum] = useState(false);
  const [skippedTopicIds, setSkippedTopicIds] = useState<Set<string>>(new Set());
  const [diagnosticReviewIds, setDiagnosticReviewIds] = useState<Set<string>>(new Set());

  const progress = useMemo<RoadmapProgressSnapshot>(() => ({
    ...emptyRoadmapProgress,
    statusByProblemId: Object.fromEntries(Object.values(accountProgress).map((row) => [row.question_id, row.status === "not_started" ? "not-started" : row.status])),
    confidenceByProblemId: Object.fromEntries(Object.values(accountProgress).flatMap((row) => row.confidence ? [[row.question_id, row.confidence] as const] : [])),
    lastProblemId: Object.values(accountProgress).find((row) => row.last_practiced_at)?.question_id,
    source: signedIn ? "account" : "none",
    diagnosticReviewProblemIds: [...diagnosticReviewIds],
  }), [accountProgress, diagnosticReviewIds, signedIn]);
  const recommendation = useMemo(() => selectedLevel ? getRecommendedRoadmapItems({ level: selectedLevel, plan: selectedPlan, company: selectedCompany, progress }) : null, [progress, selectedCompany, selectedLevel, selectedPlan]);

  function commitQuery(patch: { level?: RoadmapLevel | null; plan?: RoadmapPlanId | null; company?: RoadmapCompanyId | null }) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value); else next.delete(key);
    }
    startTransition(() => router.replace(replaceQuery(next, pathname), { scroll: false }));
  }

  function selectLevel(level: RoadmapLevel) {
    const nextRoadmap = getDsaLevelRoadmap(level);
    setExpandedModule(nextRoadmap.modules[0].id);
    setFilters(defaultRoadmapFilters);
    setShowAllCurriculum(false);
    setSkippedTopicIds(new Set());
    setDiagnosticReviewIds(new Set());
    commitQuery({ level });
    if (signedIn) startPreferenceTransition(async () => {
      const result = await savePreferredDsaRoadmapAction(level);
      setPreferenceError(result.status === "error" ? result.message : "");
    });
    track("roadmap_level_selected", { level });
  }

  function selectPlan(plan: RoadmapPlanId) {
    setShowAllCurriculum(false);
    commitQuery({ plan });
    track("roadmap_plan_selected", { plan, level: selectedLevel ?? "unselected" });
  }

  function selectCompany(company?: RoadmapCompanyId) {
    commitQuery({ company: company ?? null });
    track("company_overlay_selected", { company: company ?? "none", level: selectedLevel ?? "unselected" });
  }

  function updateFilters(patch: Partial<RoadmapFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
    track("roadmap_filter_changed", { filters: Object.keys(patch).join(","), level: selectedLevel ?? "unselected" });
  }

  const filteredCurriculum = useMemo(() => {
    if (!roadmap || !recommendation) return { modules: [], visibleProblemIds: new Set<string>(), totalProblems: 0 };
    const allRoadmapIds = getRoadmapProblemIds(roadmap);
    const baseIds = new Set(showAllCurriculum ? allRoadmapIds : recommendation.selectedProblemIds);
    const companyIds = new Set(recommendation.companyProblemIds);
    const resolved = new Map(resolveRoadmapProblems(allRoadmapIds, roadmap.problemAssignments).map((problem) => [problem.id, problem]));
    const visibleProblemIds = new Set<string>();
    const modules = roadmap.modules
      .filter((module) => filters.stageId === "all" || filters.stageId === module.id)
      .map((module) => ({
        ...module,
        topics: module.topics.filter((topic) => {
          if (filters.priority !== "all" && filters.priority !== topic.priority) return false;
          if (filters.topicId !== "all" && filters.topicId !== topic.id) return false;
          const topicHaystack = [topic.title, topic.description, ...(topic.concepts ?? []), ...(topic.recognitionSignals ?? [])].join(" ").toLowerCase();
          const topicMatchesSearch = !deferredSearch || topicHaystack.includes(deferredSearch);
          const problemIds = topic.problemIds ?? topic.problems?.map((problem) => problem.id) ?? [];
          const matchingProblemIds = problemIds.filter((id) => {
            if (!baseIds.has(id)) return false;
            if (filters.companyOnly && !companyIds.has(id)) return false;
            const problem = resolved.get(id);
            if (!problem) return false;
            if (filters.status !== "all" && (progress.statusByProblemId[id] ?? "not-started") !== filters.status) return false;
            if (filters.difficulty !== "all" && problem.difficulty?.toLowerCase() !== filters.difficulty) return false;
            const problemHaystack = [problem.title, problem.pattern, ...(problem.topicTags ?? []), ...(problem.skills ?? [])].join(" ").toLowerCase();
            return topicMatchesSearch || !deferredSearch || problemHaystack.includes(deferredSearch);
          });
          matchingProblemIds.forEach((id) => visibleProblemIds.add(id));
          if (problemIds.length) return matchingProblemIds.length > 0;
          return topicMatchesSearch && filters.status === "all" && filters.difficulty === "all" && !filters.companyOnly;
        }),
      }))
      .filter((module) => module.topics.length > 0);
    return { modules, visibleProblemIds, totalProblems: visibleProblemIds.size };
  }, [deferredSearch, filters.companyOnly, filters.difficulty, filters.priority, filters.stageId, filters.status, filters.topicId, progress.statusByProblemId, recommendation, roadmap, showAllCurriculum]);

  const priorityCounts = roadmap ? getRoadmapPriorityCounts(roadmap) : null;
  const activeExpandedModule = filters.stageId !== "all"
    ? filters.stageId
    : expandedModule === null
      ? null
      : filteredCurriculum.modules.some((module) => module.id === expandedModule)
        ? expandedModule
        : filteredCurriculum.modules[0]?.id ?? null;
  const visibleClassifications: readonly ProblemClassification[] = showAllCurriculum ? ["learn", "core", "practice", "stretch"] : recommendation?.plan.allowedClassifications ?? ["learn", "core", "practice"];
  const filterActive = Boolean(filters.search || filters.priority !== "all" || filters.status !== "all" || filters.difficulty !== "all" || filters.topicId !== "all" || filters.stageId !== "all" || filters.companyOnly);

  return <div className="dsa-level-roadmap-experience">
    <section className="dsa-level-roadmap-intro" aria-labelledby="choose-roadmap-level">
      <div className="dsa-level-roadmap-section-heading"><span>01 · Choose your level</span><h2 id="choose-roadmap-level">Start with the interview you are preparing for.</h2><p>Levels change the skills and judgment being assessed—not just the difficulty label.</p></div>
      <LevelRoadmapSelector selectedLevel={selectedLevel} onSelect={selectLevel} disabled={preferencePending} />
      {signedIn && (preferencePending || preferenceError) && <p className={`dsa-roadmap-preference-message${preferenceError ? " error" : ""}`} role={preferenceError ? "alert" : "status"} aria-live="polite">{preferencePending ? "Saving preferred roadmap…" : preferenceError}</p>}
    </section>

    {!roadmap || !recommendation ? <section className="dsa-roadmap-neutral-state"><Compass size={22} aria-hidden="true" /><div><span>No level assumed</span><h2>Which level are you preparing for?</h2><p>Choose SDE I, SDE II, or SDE III+ to derive a plan. Every curriculum remains open and switchable.</p></div></section> : <>
      <RoadmapPlanningControls plan={selectedPlan} companyId={selectedCompany} onPlanChange={selectPlan} onCompanyChange={selectCompany} />
      <PersonalizedRoadmapSummary roadmap={roadmap} recommendation={recommendation} companyId={selectedCompany} />
      <RoadmapNextUp recommendation={recommendation} roadmap={roadmap} onOpenStage={(stage) => { setExpandedModule(stage); document.getElementById("roadmap-stages")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />

      <section className="dsa-level-roadmap-guide" aria-labelledby="roadmap-priorities"><div><span>03 · Prioritize</span><h2 id="roadmap-priorities">Know what to learn first.</h2></div><div className="dsa-level-roadmap-legend">{priorityGuidance.map((item) => <div key={item.priority}><span className={`dsa-level-priority ${item.priority}`}><Circle size={8} fill="currentColor" aria-hidden="true" />{item.label}</span><p>{item.description} · {priorityCounts?.[item.priority]} topics</p></div>)}</div></section>

      <RoadmapFilters roadmap={roadmap} filters={filters} companySelected={Boolean(selectedCompany && getRoadmapCompany(selectedCompany)?.researchStatus === "available")} onChange={updateFilters} onReset={() => setFilters(defaultRoadmapFilters)} />

      <section className="dsa-level-roadmap-curriculum" id="roadmap-stages" aria-labelledby="roadmap-stage-heading">
        <div className="dsa-level-roadmap-section-heading"><span>04 · Follow the roadmap</span><h2 id="roadmap-stage-heading">Six stages, revealed when you need them.</h2><p>{showAllCurriculum ? "Showing the complete curriculum." : `${recommendation.plan.label} selects ${recommendation.selectedProblemIds.length} high-signal problems.`} Topic details stay collapsed until opened.</p></div>
        <div className="dsa-roadmap-curriculum-toolbar"><span aria-live="polite">{filteredCurriculum.totalProblems} matching problems · {filteredCurriculum.modules.length} stages</span><button type="button" aria-pressed={showAllCurriculum} onClick={() => setShowAllCurriculum((current) => !current)}>{showAllCurriculum ? `Return to ${recommendation.plan.label}` : `Show all ${roadmap.estimatedProblems} problems`}</button></div>
        {filteredCurriculum.modules.length ? <div className="dsa-level-roadmap-modules">{filteredCurriculum.modules.map((roadmapModule) => {
          const originalIndex = roadmap.modules.findIndex((module) => module.id === roadmapModule.id);
          return <LevelRoadmapModule key={`${roadmap.level}-${roadmapModule.id}`} module={roadmapModule} level={roadmap.level} index={originalIndex} expanded={activeExpandedModule === roadmapModule.id} onToggle={() => { setExpandedModule((current) => current === roadmapModule.id ? null : roadmapModule.id); track("roadmap_topic_opened", { level: roadmap.level, stage_id: roadmapModule.id }); }} visibleClassifications={visibleClassifications} visibleProblemIds={filteredCurriculum.visibleProblemIds} assignments={roadmap.problemAssignments} progress={progress} signedIn={signedIn} skippedTopicIds={skippedTopicIds} onToggleSkipped={(topicId) => setSkippedTopicIds((current) => { const next = new Set(current); if (next.has(topicId)) next.delete(topicId); else next.add(topicId); return next; })} />;
        })}</div> : <div className="dsa-roadmap-no-results"><strong>No roadmap items match these filters.</strong><p>Reset the filters or show the full curriculum. Nothing has been removed from the roadmap.</p><button type="button" onClick={() => setFilters(defaultRoadmapFilters)}>Clear filters</button></div>}
        {filterActive && <p className="dsa-roadmap-filter-note">Filters affect only this view. They do not change the active plan or completion state.</p>}
      </section>

      <details className="dsa-roadmap-supporting-details"><summary><span><strong>Plan rationale, recommendation groups, and diagnostic</strong><small>Open when you want the deeper reasoning behind this plan</small></span><ArrowDown size={15} aria-hidden="true" /></summary><div>
        <section className="dsa-level-roadmap-summary" aria-live="polite">
          <div className="dsa-level-roadmap-summary-copy"><span>Selected roadmap</span><h2>{roadmap.title}</h2><strong>{roadmap.subtitle}</strong><p>{roadmap.objective}</p></div>
          <div className="dsa-level-roadmap-progression" aria-label={`${roadmap.shortTitle} skill progression`}>{roadmap.progression.map((step, index) => <span key={step}><strong>{step}</strong>{index < roadmap.progression.length - 1 && <ArrowRight size={14} aria-hidden="true" />}</span>)}</div>
          <p className="dsa-roadmap-planning-note">Seniority changes expected reasoning depth, not a simple Easy → Medium → Hard progression.</p>
        </section>
        <RoadmapRecommendationGroups recommendation={recommendation} />
        <CompanyRoadmapOverlay level={roadmap.level} companyId={selectedCompany} progress={progress} />
        <RoadmapUsageGuide />
        {roadmap.diagnostic && <details className="dsa-roadmap-diagnostic-shell" open={selectedPlan === "two-week" || undefined}><summary><span><strong>Coding diagnostic</strong><small>{selectedPlan === "two-week" ? "Start here for the short-horizon plan" : "Open when you need a refresh check"}</small></span><ArrowDown size={15} aria-hidden="true" /></summary><RoadmapDiagnostic roadmap={roadmap} reviewIds={diagnosticReviewIds} onToggleReview={(problemId) => setDiagnosticReviewIds((current) => { const next = new Set(current); if (next.has(problemId)) next.delete(problemId); else next.add(problemId); return next; })} /></details>}
      </div></details>

      <details className="dsa-roadmap-practice-shell"><summary><span><strong>Mixed and timed practice</strong><small>{recommendation.mixedSetCount} mixed sets · {recommendation.timedSessionCount} timed formats in this plan</small></span><ArrowDown size={15} aria-hidden="true" /></summary><RoadmapPracticeSections roadmap={roadmap} mixedSetCount={recommendation.mixedSetCount} timedSessionCount={recommendation.timedSessionCount} /></details>

      <RoadmapReviewReadiness recommendation={recommendation} />
      <RoadmapFailureModes roadmap={roadmap} />
      <OptionalRoadmapTopics roadmap={roadmap} />
      <aside className="dsa-level-roadmap-map-link"><MapIcon size={20} aria-hidden="true" /><div><strong>Prefer a dependency view?</strong><p>The 18-topic map remains available for exploring prerequisite relationships.</p></div><Link href="/dsa/roadmap/topic-map">Open topic map <ArrowRight size={15} aria-hidden="true" /></Link></aside>
    </>}
  </div>;
}
