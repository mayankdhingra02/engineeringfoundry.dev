"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Building2, CalendarClock, CheckCircle2, CircleHelp, Compass, ExternalLink, Filter, ListRestart, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { DSARoadmap, RoadmapLevel, RoadmapStage, TopicPriority } from "@/data/dsa/level-roadmaps";
import { getCompanyProblemAssignments, getRoadmapCompany, roadmapCompanies, type CompanyRecommendationEvidence, type RoadmapCompanyId } from "@/data/dsa/roadmap-companies";
import { roadmapProblemById } from "@/data/dsa/roadmap-problem-registry";
import { roadmapPreparationPlans, type RecommendedRoadmapPlan, type RoadmapPlanId, type RoadmapProblemStatus, type RoadmapProgressSnapshot } from "@/data/dsa/roadmap-planning";

export type RoadmapFilterState = {
  search: string;
  priority: "all" | TopicPriority;
  status: "all" | RoadmapProblemStatus;
  difficulty: "all" | "easy" | "medium" | "hard";
  topicId: "all" | string;
  stageId: "all" | RoadmapStage;
  companyOnly: boolean;
};

export const defaultRoadmapFilters: RoadmapFilterState = {
  search: "",
  priority: "all",
  status: "all",
  difficulty: "all",
  topicId: "all",
  stageId: "all",
  companyOnly: false,
};

const evidenceLabels: Record<CompanyRecommendationEvidence, string> = {
  official: "Official",
  "interview-report": "Candidate Reports",
  community: "Community Signal",
  "editorial-synthesis": "Foundry Recommendation",
};

export function RoadmapPlanningControls({ plan, companyId, onPlanChange, onCompanyChange }: {
  plan: RoadmapPlanId;
  companyId?: RoadmapCompanyId;
  onPlanChange: (plan: RoadmapPlanId) => void;
  onCompanyChange: (company?: RoadmapCompanyId) => void;
}) {
  return <section className="dsa-roadmap-planner-controls" aria-labelledby="roadmap-planner-heading">
    <div className="dsa-roadmap-planner-heading"><span>02 · Build your plan</span><h2 id="roadmap-planner-heading">How soon is the interview?</h2><p>The timeline changes what counts toward this plan; it never removes access to the full curriculum.</p></div>
    <div className="dsa-roadmap-time-options" role="group" aria-label="Preparation time">
      {roadmapPreparationPlans.map((option) => <button key={option.id} type="button" aria-pressed={plan === option.id} className={plan === option.id ? "selected" : undefined} onClick={() => onPlanChange(option.id)}><strong>{option.label}</strong><small>{option.shortLabel}</small></button>)}
    </div>
    <div className="dsa-roadmap-company-control">
      <label htmlFor="roadmap-company"><span><Building2 size={15} aria-hidden="true" />Target company <small>Optional</small></span><select id="roadmap-company" value={companyId ?? ""} onChange={(event) => onCompanyChange(event.target.value ? event.target.value as RoadmapCompanyId : undefined)}><option value="">No company selected</option>{roadmapCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}{company.researchStatus === "coming-soon" ? " · add-on coming soon" : ""}</option>)}</select></label>
    </div>
  </section>;
}

export function PersonalizedRoadmapSummary({ roadmap, recommendation, companyId }: { roadmap: DSARoadmap; recommendation: RecommendedRoadmapPlan; companyId?: RoadmapCompanyId }) {
  const company = getRoadmapCompany(companyId);
  return <section className="dsa-roadmap-personal-summary" aria-live="polite">
    <div><span>Your plan</span><h2>{roadmap.shortTitle} · {recommendation.plan.label}{company ? ` · ${company.name}` : ""}</h2><p>{recommendation.plan.description}</p></div>
    <dl>
      <div><dt>Selected</dt><dd>{recommendation.selectedProblemIds.length} problems</dd></div>
      <div><dt>Required</dt><dd>{recommendation.requiredProblemIds.length} Core / Practice</dd></div>
      <div><dt>Mixed practice</dt><dd>{recommendation.mixedSetCount} set{recommendation.mixedSetCount === 1 ? "" : "s"}</dd></div>
      <div><dt>Timed formats</dt><dd>{recommendation.timedSessionCount}</dd></div>
    </dl>
    <p className="dsa-roadmap-mock-guidance"><CalendarClock size={15} aria-hidden="true" />{recommendation.plan.mockGuidance}</p>
  </section>;
}

export function RoadmapNextUp({ recommendation, roadmap, onOpenStage }: { recommendation: RecommendedRoadmapPlan; roadmap: DSARoadmap; onOpenStage: (stage: RoadmapStage) => void }) {
  const firstFocus = recommendation.focusNow[0];
  const stage = firstFocus?.stageId ?? roadmap.modules[0].id;
  return <section className="dsa-roadmap-next-up" aria-labelledby="roadmap-next-up-heading">
    <div><Compass size={19} aria-hidden="true" /><span>Recommended from this plan</span><h2 id="roadmap-next-up-heading">Next Up</h2></div>
    <ol><li className="stage"><span>Start with this stage</span><strong>{firstFocus?.stageTitle ?? roadmap.modules[0].title}</strong><p>{firstFocus?.reason ?? roadmap.modules[0].description}</p><button type="button" onClick={() => onOpenStage(stage)}>Open stage <ArrowRight size={13} aria-hidden="true" /></button></li>{recommendation.nextUp.map((item) => <li key={item.id}><span>{item.eyebrow}</span><strong>{item.title}</strong><p>{item.reason}</p>{item.href && (item.href.startsWith("/") ? <Link href={item.href}>Open <ArrowRight size={13} aria-hidden="true" /></Link> : <a href={item.href} target="_blank" rel="noopener noreferrer">Open problem <ExternalLink size={13} aria-hidden="true" /></a>)}</li>)}</ol>
    {!recommendation.nextUp.length && <div className="dsa-roadmap-empty-inline"><Sparkles size={17} aria-hidden="true" /><span><strong>Start with your first Core topic.</strong>No performance history is assumed.</span></div>}
  </section>;
}

export function RoadmapRecommendationGroups({ recommendation }: { recommendation: RecommendedRoadmapPlan }) {
  const groups = [
    { id: "focus", label: "Focus now", items: recommendation.focusNow.slice(0, 6), description: "Highest-return topics for the active plan." },
    { id: "later", label: "Learn next", items: recommendation.learnNext.slice(0, 5), description: "Add after the essential material is stable." },
    { id: "skip", label: "Skip for now", items: recommendation.skipForNow.slice(0, 5), description: "Lower-priority material that can safely wait." },
  ] as const;
  return <section className="dsa-roadmap-recommendation-groups" aria-labelledby="recommendation-groups-heading"><div><span>Prioritized curriculum</span><h2 id="recommendation-groups-heading">What to study—and what can wait.</h2></div><div>{groups.map((group) => <article key={group.id} className={group.id}><header><strong>{group.label}</strong><span>{group.items.length}</span></header><p>{group.description}</p>{group.items.length ? <ul>{group.items.map((topic) => <li key={topic.topicId}><span>{topic.title}</span><small>{topic.stageTitle}</small></li>)}</ul> : <div className="dsa-roadmap-group-empty">Nothing in this group for the current plan.</div>}{group.id === "skip" && recommendation.deferredProblemIds.length > 0 && <small>{recommendation.deferredProblemIds.length} problems remain available outside this plan.</small>}</article>)}</div></section>;
}

export function CompanyRoadmapOverlay({ level, companyId, progress }: { level: RoadmapLevel; companyId?: RoadmapCompanyId; progress: RoadmapProgressSnapshot }) {
  if (!companyId) return <section className="dsa-roadmap-company-overlay empty" aria-label="Company preparation overlay"><Building2 size={19} aria-hidden="true" /><div><strong>No company selected</strong><p>Add a target company to see optional, separately counted preparation.</p></div></section>;
  const company = getRoadmapCompany(companyId)!;
  if (company.researchStatus === "coming-soon") return <section className="dsa-roadmap-company-overlay empty" aria-label={`${company.name} preparation overlay`}><CircleHelp size={19} aria-hidden="true" /><div><strong>{company.name} add-on coming soon</strong><p>We do not have enough validated DSA evidence yet. Keep using the portable core roadmap.</p>{company.questionBrowserHref && <Link href={company.questionBrowserHref}>Explore broader tagged questions <ArrowRight size={13} aria-hidden="true" /></Link>}</div></section>;
  const assignments = getCompanyProblemAssignments(companyId, level);
  const completed = assignments.filter((assignment) => {
    const status = progress.statusByProblemId[assignment.problemId];
    return status === "solved" || status === "review";
  }).length;
  return <section className="dsa-roadmap-company-overlay" aria-labelledby="company-overlay-heading">
    <header><div><span>Company overlay</span><h2 id="company-overlay-heading">Preparing for {company.name} · {level === "sde3plus" ? "SDE III+" : level === "sde2" ? "SDE II" : "SDE I"}</h2><p>Your core roadmap stays portable. These additions are separate.</p></div><dl><div><dt>Company add-on</dt><dd>{completed} / {assignments.length}</dd></div><div><dt>Research reviewed</dt><dd>{company.reviewedAt}</dd></div></dl></header>
    <div className="dsa-roadmap-company-emphasis"><strong>{company.name} emphasis</strong>{company.emphasis?.[level]?.map((item) => <span key={item}>{item}</span>)}</div>
    {assignments.length ? <div className="dsa-roadmap-company-problems">{assignments.map((assignment) => {
      const problem = roadmapProblemById.get(assignment.problemId)!;
      return <article key={assignment.problemId}><div><strong>{problem.title}</strong><span>{problem.difficulty} · {assignment.relevance}</span></div><p>{assignment.note}</p><footer><span>{evidenceLabels[assignment.sourceType]}</span>{problem.url && <a href={problem.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${problem.title} on LeetCode`}>Practice <ExternalLink size={12} aria-hidden="true" /></a>}</footer></article>;
    })}</div> : <div className="dsa-roadmap-empty-inline"><CircleHelp size={17} aria-hidden="true" /><span><strong>No curated additions for this level yet.</strong>Use the researched emphasis and portable roadmap.</span></div>}
    <footer><p><ShieldCheck size={14} aria-hidden="true" />{company.evidenceNote}</p><nav aria-label={`${company.name} preparation links`}>{company.guideHref && <Link href={company.guideHref}>Interview guide <ArrowRight size={13} aria-hidden="true" /></Link>}{company.questionBrowserHref && <Link href={company.questionBrowserHref}>Explore all tagged questions <ArrowRight size={13} aria-hidden="true" /></Link>}</nav></footer>
  </section>;
}

export function RoadmapFilters({ roadmap, filters, companySelected, onChange, onReset }: { roadmap: DSARoadmap; filters: RoadmapFilterState; companySelected: boolean; onChange: (patch: Partial<RoadmapFilterState>) => void; onReset: () => void }) {
  const topics = roadmap.modules.flatMap((module) => module.topics.map((topic) => ({ id: topic.id, title: topic.title })));
  const active = filters.search || filters.priority !== "all" || filters.status !== "all" || filters.difficulty !== "all" || filters.topicId !== "all" || filters.stageId !== "all" || filters.companyOnly;
  return <section className="dsa-roadmap-filter-shell" aria-labelledby="roadmap-filter-heading"><details><summary><Filter size={16} aria-hidden="true" /><span><strong id="roadmap-filter-heading">Search and filters</strong><small>{active ? "Filters active" : "Curated view"}</small></span><ArrowRight size={14} aria-hidden="true" /></summary><div className="dsa-roadmap-filter-grid">
    <label className="search"><span>Search</span><span><Search size={14} aria-hidden="true" /><input type="search" value={filters.search} onChange={(event) => onChange({ search: event.target.value })} placeholder="Problem, topic, or pattern" /></span></label>
    <label><span>Priority</span><select value={filters.priority} onChange={(event) => onChange({ priority: event.target.value as RoadmapFilterState["priority"] })}><option value="all">All priorities</option><option value="core">Core</option><option value="high-value">High Value</option><option value="advanced">Advanced</option></select></label>
    <label><span>Status</span><select value={filters.status} onChange={(event) => onChange({ status: event.target.value as RoadmapFilterState["status"] })}><option value="all">All statuses</option><option value="not-started">Not Started</option><option value="attempted">Attempted</option><option value="solved">Solved</option><option value="review">Review</option></select></label>
    <label><span>Difficulty</span><select value={filters.difficulty} onChange={(event) => onChange({ difficulty: event.target.value as RoadmapFilterState["difficulty"] })}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
    <label><span>Topic</span><select value={filters.topicId} onChange={(event) => onChange({ topicId: event.target.value })}><option value="all">All topics</option>{topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.title}</option>)}</select></label>
    <label><span>Stage</span><select value={filters.stageId} onChange={(event) => onChange({ stageId: event.target.value as RoadmapFilterState["stageId"] })}><option value="all">All stages</option>{roadmap.modules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label>
    <label className={`company-check${!companySelected ? " disabled" : ""}`}><input type="checkbox" checked={filters.companyOnly} disabled={!companySelected} onChange={(event) => onChange({ companyOnly: event.target.checked })} /><span>Company add-on only</span></label>
    <button type="button" onClick={onReset} disabled={!active}><ListRestart size={14} aria-hidden="true" />Reset filters</button>
  </div></details></section>;
}

export function RoadmapReviewReadiness({ recommendation }: { recommendation: RecommendedRoadmapPlan }) {
  return <section className="dsa-roadmap-review-readiness" aria-labelledby="readiness-heading"><div className="dsa-roadmap-review-queue"><span>Review queue</span><h2>Review what actually needs another pass.</h2>{recommendation.reviewProblemIds.length ? <ul>{recommendation.reviewProblemIds.map((id) => <li key={id}>{roadmapProblemById.get(id)?.title ?? id}</li>)}</ul> : <div className="dsa-roadmap-empty-inline"><CheckCircle2 size={17} aria-hidden="true" /><span><strong>Nothing needs review right now.</strong>Diagnostic review marks will appear here for this view.</span></div>}<p>Includes account-backed Review status and temporary diagnostic marks for this view.</p></div><div className="dsa-roadmap-readiness"><span>Readiness</span><h2 id="readiness-heading">Use evidence, not a fake pass percentage.</h2><div>{recommendation.readiness.map((item) => <article key={item.id}><span className={item.status}>{item.status === "insufficient" ? "Not enough practice data" : item.status === "ready" ? "Ready" : "Needs work"}</span><strong>{item.label}</strong><p>{item.evidence}</p></article>)}</div></div></section>;
}

export function RoadmapUsageGuide() {
  return <section className="dsa-roadmap-usage-guide" aria-labelledby="roadmap-usage-heading"><div><BookOpenCheck size={19} aria-hidden="true" /><span>How to use this roadmap</span><h2 id="roadmap-usage-heading">Practice deliberately.</h2></div><ol><li>Start with Core.</li><li>Solve without revealing the pattern when possible.</li><li>Use hints progressively.</li><li>Mark substantial-help problems for review.</li><li>Use mixed sets before calling a topic mastered.</li><li>Add company practice near the interview.</li></ol><blockquote>More problems isn&apos;t automatically better. Once you can recognize, derive, implement, and explain a pattern consistently, move on and revisit it through mixed practice.</blockquote></section>;
}
