"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DesignRoadmapStage, MlDesignConcept, MlDesignProblem } from "@/types";
import { mlDesignFramework, mlLearningBranches, mlPrerequisiteChecks } from "@/data/ml-design/reference";
import { readLocalPreparationProgress } from "@/lib/preparation-progress/local";
import {
  ML_DESIGN_CONCEPTS_ROOT,
  ML_DESIGN_GLOSSARY,
  ML_DESIGN_PRACTICE_ROOT,
  ML_DESIGN_PROBLEMS_ROOT,
  ML_DESIGN_RUBRIC,
  mlDesignConceptHref,
  mlDesignProblemHref,
} from "@/lib/ml-design-routes";
import { AnalyticsEventOnMount } from "./analytics-event";
import { MlDesignDirectionContract } from "./ml-design-document";

type Props = {
  roadmap: DesignRoadmapStage[];
  concepts: MlDesignConcept[];
  problems: MlDesignProblem[];
  domains: readonly string[];
};

export function MlDesignTrackPage({ roadmap, concepts, problems, domains }: Props) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [checked, setChecked] = useState<boolean[]>(() => mlPrerequisiteChecks.map(() => false));
  const [recentId, setRecentId] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const progress = readLocalPreparationProgress(window.localStorage);
      const recent = progress.items.find((item) => item.track === "ml-design");
      if (recent) setRecentId(recent.itemId);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const recentProblem = problems.find((problem) => problem.id === recentId || problem.slug === recentId);
  const filteredProblems = useMemo(() => problems.filter((problem) => {
    const haystack = `${problem.title} ${problem.summary} ${problem.family} ${problem.domains.join(" ")}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (domain === "All" || problem.domains.includes(domain));
  }), [domain, problems, query]);
  const readyCount = checked.filter(Boolean).length;

  return <div className="ml-track">
    <MlDesignDirectionContract />
    <AnalyticsEventOnMount event="roadmap_viewed" properties={{ roadmap: "ml-design" }} />
    <section className="ml-track-opening">
      <div className="page-width ml-track-opening-grid">
        <div className="ml-track-title">
          <h1>ML System Design</h1>
          <p>Learn to connect a product decision to data, labels, evaluation, training, serving, rollout, monitoring, and risk.</p>
          <div className="ml-track-actions">
            <Link className="button" href={mlDesignConceptHref(concepts[0].slug)}>Start the default path<ArrowRight size={16} /></Link>
            <Link className="button button-secondary" href={ML_DESIGN_PROBLEMS_ROOT}>Choose a design problem</Link>
          </div>
          {recentProblem ? <aside className="ml-continue"><div><strong>Continue recent practice</strong><p>{recentProblem.title}</p></div><Link href={mlDesignProblemHref(recentProblem.slug)}>Resume<ArrowRight size={14} /></Link></aside> : <p className="ml-no-history">No recent ML practice in this browser yet. Start with framing or choose a role-focused path.</p>}
        </div>
        <div className="ml-decide" aria-labelledby="decide-title">
          <div><h2 id="decide-title">DECIDE</h2><p>One repeatable sequence. Return to an earlier decision whenever later evidence changes it.</p></div>
          <ol>{mlDesignFramework.map((stage) => <li key={`${stage.letter}-${stage.title}`}><span>{stage.letter}</span><div><strong>{stage.title}</strong><p>{stage.summary}</p></div></li>)}</ol>
        </div>
      </div>
    </section>

    <nav className="ml-track-nav" aria-label="ML System Design sections"><div className="page-width">
      <Link href={ML_DESIGN_CONCEPTS_ROOT}>20 concepts</Link><Link href={ML_DESIGN_PROBLEMS_ROOT}>13 dossiers</Link><Link href={ML_DESIGN_PRACTICE_ROOT}>Practice modes</Link><Link href={ML_DESIGN_RUBRIC}>Rubric</Link><Link href={ML_DESIGN_GLOSSARY}>Glossary</Link>
    </div></nav>

    <section className="section"><div className="page-width ml-start-grid">
      <div className="ml-prerequisite-check"><h2>Check the starting assumptions</h2><p>This check stays in this tab and does not determine access. If two or more feel unfamiliar, review the linked System Design foundations as you go.</p><fieldset><legend className="sr-only">ML System Design prerequisites</legend>{mlPrerequisiteChecks.map((item, index) => <label key={item}><input type="checkbox" checked={checked[index]} onChange={(event) => setChecked((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))} /><span><Check size={15} aria-hidden="true" />{item}</span></label>)}</fieldset><p role="status" aria-live="polite">{readyCount} of {mlPrerequisiteChecks.length} checked. This is orientation, not a readiness score.</p></div>
      <div className="ml-default-path"><h2>The default path</h2><ol>{roadmap.map((stage) => <li key={stage.id}><span>{stage.order}</span><div><strong>{stage.title}</strong><p>{stage.summary}</p><small>{stage.conceptIds?.length ?? 0} concepts · {stage.problemIds?.length ?? 0} connected problems</small></div></li>)}</ol></div>
    </div></section>

    <section className="section section-alt"><div className="page-width"><div className="ml-section-heading"><h2>Fast paths by interview emphasis</h2><p>These branches reorder the same core material. They do not skip formulation, evaluation, reliability, or risk.</p></div><div className="ml-branches">{mlLearningBranches.map((branch) => {
        const first = concepts.find((concept) => concept.slug === branch.conceptSlugs[0]);
        return <article key={branch.id}><h3>{branch.title}</h3><p>{branch.roles}</p><ol>{branch.conceptSlugs.slice(0, 5).map((slug) => { const concept = concepts.find((item) => item.slug === slug); return concept ? <li key={slug}><Link href={mlDesignConceptHref(slug)}>{concept.title}</Link></li> : null; })}</ol>{first ? <Link href={mlDesignConceptHref(first.slug)}>Start this path<ArrowRight size={14} /></Link> : null}</article>;
      })}</div></div></section>

    <section className="section" id="problems"><div className="page-width"><div className="ml-section-heading"><h2>Choose a concrete design problem</h2><p>Each dossier changes the dominant trade-off, label plan, system shape, rollout, and failure modes.</p></div><div className="ml-directory-controls"><label><Search size={16} aria-hidden="true" /><span className="sr-only">Search problems</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search problems or domains" /></label><label><SlidersHorizontal size={16} aria-hidden="true" /><span className="sr-only">Filter by domain</span><select value={domain} onChange={(event) => setDomain(event.target.value)}><option>All</option>{domains.map((item) => <option key={item}>{item}</option>)}</select></label></div><p className="ml-result-count" role="status" aria-live="polite">{filteredProblems.length} {filteredProblems.length === 1 ? "dossier" : "dossiers"}</p><div className="ml-problem-register">{filteredProblems.map((problem) => <Link href={mlDesignProblemHref(problem.slug)} key={problem.id}><div><strong>{problem.title}</strong><small>{problem.family} · {problem.domains.slice(0, 3).join(" · ")}</small></div><p>{problem.summary}</p><span>{problem.difficulty}<ArrowRight size={14} /></span></Link>)}</div>{!filteredProblems.length ? <div className="ml-empty"><BookOpen size={18} /><p>No dossiers match. Clear the search or choose another domain.</p></div> : null}</div></section>

    <section className="section section-alt"><div className="page-width ml-concept-shortlist"><div><h2>Browse all twenty concepts</h2><p>Every lesson includes a scenario, mechanism, alternatives, consequences, failure modes, worked example, exercise, level overlays, System Design prerequisites, and reviewed sources.</p><Link className="button button-secondary" href={ML_DESIGN_CONCEPTS_ROOT}>Open the concept directory<ArrowRight size={15} /></Link></div><ol>{concepts.slice(0, 8).map((concept, index) => <li key={concept.id}><Link href={mlDesignConceptHref(concept.slug)}><span>{String(index + 1).padStart(2, "0")}</span>{concept.title}</Link></li>)}</ol></div></section>
  </div>;
}
