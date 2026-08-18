"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { systemDesignPracticeContents, systemDesignPracticeContentIds } from "@/content/system-design/problems/data";
import { systemDesignPracticeProblemManifest } from "@/data/system-design/manifest";
import {
  getPracticeProblemRecommendations,
  type SystemDesignLevel,
  type SystemDesignPreparationWindow,
  type SystemDesignRecommendationGroup,
  type SystemDesignTargetRole,
} from "@/data/system-design/recommendations";
import type { SystemDesignItemProgressRow } from "@/lib/supabase/database.types";

type LibraryFilter = "all" | "foundation" | "intermediate" | "advanced" | "infrastructure" | "data" | "ml" | "focus-now" | "learn-next";
type Preferences = { level?: SystemDesignLevel; preparationWindow?: SystemDesignPreparationWindow; role?: SystemDesignTargetRole };
const preferencesStorageKey = "engineering-foundry-system-design-recommendations-v1";
const labels: Record<LibraryFilter, string> = { all: "All", foundation: "Foundation", intermediate: "Intermediate", advanced: "Advanced", infrastructure: "Infrastructure", data: "Data", ml: "ML", "focus-now": "Focus Now", "learn-next": "Learn Next" };
const filterGroups: Array<{ label: string; values: LibraryFilter[] }> = [
  { label: "Difficulty", values: ["all", "foundation", "intermediate", "advanced"] },
  { label: "Role", values: ["infrastructure", "data", "ml"] },
];
const groupLabels: Record<SystemDesignRecommendationGroup, string> = { "focus-now": "Focus Now", "learn-next": "Learn Next", "skip-for-now": "Skip for Now" };

export function SystemDesignPracticeLibrary({ progress = {}, attemptCounts = {}, signedIn = false, applicationId }: { progress?: Record<string, SystemDesignItemProgressRow>; attemptCounts?: Record<string, number>; signedIn?: boolean; applicationId?: string }) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [preferences, setPreferences] = useState<Preferences>({});

  useEffect(() => {
    function read() {
      try { setPreferences(JSON.parse(window.localStorage.getItem(preferencesStorageKey) ?? "{}") as Preferences); } catch { setPreferences({}); }
    }
    read();
    window.addEventListener("storage", read);
    return () => { window.removeEventListener("storage", read); };
  }, []);

  const recommendations = useMemo(() => getPracticeProblemRecommendations(preferences), [preferences]);
  const recommendationById = useMemo(() => new Map(recommendations?.map((item) => [item.problem.id, item]) ?? []), [recommendations]);
  const contentById = useMemo(() => new Map(systemDesignPracticeContents.map((item) => [item.id, item])), []);
  const published = systemDesignPracticeProblemManifest.filter((item) => systemDesignPracticeContentIds.has(item.id));
  const upcoming = systemDesignPracticeProblemManifest.filter((item) => !systemDesignPracticeContentIds.has(item.id));
  const completedTopics = new Set(Object.entries(progress).filter(([id, item]) => id.startsWith("concept:") && (item.status === "comfortable" || item.status === "reviewed")).map(([id]) => id.slice("concept:".length)));

  const visible = published.filter((item) => {
    const content = contentById.get(item.id)!;
    const recommendation = recommendationById.get(item.id);
    if (filter === "all") return true;
    if (filter === "focus-now" || filter === "learn-next") return recommendation?.group === filter;
    if (filter === "infrastructure" || filter === "data" || filter === "ml") return content.category.toLowerCase() === filter || content.roleRelevance.includes(filter as SystemDesignTargetRole);
    return item.difficulty === filter;
  });

  const recommendedNext = (recommendations ?? [])
    .filter((item) => systemDesignPracticeContentIds.has(item.problem.id) && progress[`design_problem:${item.problem.id}`]?.status !== "comfortable")
    .sort((a, b) => {
      const readyA = a.problem.concepts.filter((id) => completedTopics.has(id)).length;
      const readyB = b.problem.concepts.filter((id) => completedTopics.has(id)).length;
      return readyB - readyA || a.rank - b.rank;
    })[0];

  const withApplication = (href: string) => applicationId ? `${href}?application=${encodeURIComponent(applicationId)}` : href;

  return <div className="sd-practice-library">
    {recommendedNext && <section className="sd-practice-next"><span>Recommended next</span><div><h2>{recommendedNext.problem.title}</h2><p>{recommendedNext.reason}</p></div><Link href={withApplication(recommendedNext.problem.href)}>Start problem<ArrowRight size={14} /></Link></section>}

    <p className="sd-practice-filter-hint">Choose one way to narrow the library. Current view: <strong>{labels[filter]}</strong>.</p>
    <div className="sd-practice-filter-groups">
      {filterGroups.map((group) => <div key={group.label}><span>{group.label}</span><div className="sd-practice-library-tabs" role="group" aria-label={`${group.label} browse options; choosing one replaces the current filter`}>{group.values.map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{labels[value]}</button>)}</div></div>)}
      {recommendations && <div><span>Your plan</span><div className="sd-practice-library-tabs" role="group" aria-label="Personalized practice filters">{(["focus-now", "learn-next"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{labels[value]}</button>)}</div></div>}
    </div>
    {(filter === "focus-now" || filter === "learn-next") && <div className="sd-focus-filter-note"><span>Showing your {labels[filter]} practice set. Every published problem remains available.</span><button type="button" onClick={() => setFilter("all")}>Show all {published.length} problems</button></div>}
    {!recommendations && <p className="sd-practice-personalization-note"><Link href="/system-design/plan">Personalize practice in the study planner</Link> to enable Focus Now and Learn Next filters.</p>}

    <section className="sd-practice-published" aria-labelledby="published-practice"><header><div><span>End-to-end practice</span><h2 id="published-practice" role="status" aria-live="polite" aria-atomic="true">{visible.length} published walkthroughs</h2></div>{filter !== "all" && <button type="button" onClick={() => setFilter("all")}><RotateCcw size={13} />Clear filter</button>}</header>
      <ul>{visible.map((item) => {
        const content = contentById.get(item.id)!;
        const recommendation = recommendationById.get(item.id);
        const status = progress[`design_problem:${item.id}`]?.status;
        return <li key={item.id}><Link href={withApplication(item.slug)}>
          <span className="sd-practice-row-copy"><strong>{item.title}</strong><small>{content.summary}</small><em>{content.concepts.slice(0, 4).map((id) => systemDesignTopicManifestTitle(id)).join(" · ")}</em></span>
          <span className="sd-practice-row-meta"><i>{item.difficulty}</i>{recommendation && <i className={recommendation.group}>{groupLabels[recommendation.group]}</i>}<i><Clock3 size={12} />{content.estimatedMinutes} min</i>{status === "comfortable" ? <i className="complete"><CheckCircle2 size={12} />Comfortable</i> : status === "review" ? <i>Needs review</i> : status === "reviewed" ? <i>Reviewed</i> : null}{attemptCounts[item.id] ? <i>{attemptCounts[item.id]} attempt{attemptCounts[item.id] === 1 ? "" : "s"}</i> : null}</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link></li>;
      })}</ul>
      {visible.length === 0 && <p className="sd-practice-empty">No published walkthrough matches this filter yet. Choose All to keep browsing.</p>}
    </section>

    {!signedIn && <p className="sd-practice-personalization-note"><Link href="/signin?next=/system-design/practice">Sign in</Link> to keep private notes, confidence, bookmarks, and independent design attempts.</p>}

    <details className="sd-practice-upcoming"><summary>Also in the 60-problem catalog <span>{upcoming.length} upcoming</span></summary><div>{upcoming.map((item) => <span key={item.id}>{item.title}<small>{item.group}</small></span>)}</div></details>
  </div>;
}

function systemDesignTopicManifestTitle(id: string) {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
