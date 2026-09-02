"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Filter, Layers3, Search, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";
import type { DesignConcept, DesignDifficulty, DesignRoadmapStage } from "@/types";
import { AnalyticsEventOnMount } from "./analytics-event";
import { PageHero, SectionHeading, StatusPill } from "./page-shell";

type ProblemSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: DesignDifficulty;
  domains: string[];
  patterns?: string[];
};

const framework = [
  ["Clarify", "Define users, scope, constraints, and success before drawing boxes."],
  ["Estimate", "Use explicit assumptions to find the dominant workloads and limits."],
  ["Define", "Name interfaces, core data, and the invariants that must remain true."],
  ["Sketch", "Build one reasonable high-level path before optimizing details."],
  ["Deep dive", "Choose the highest-risk component and explain its behavior."],
  ["Stress", "Find bottlenecks, partial failures, overload, and recovery paths."],
  ["Trade off", "Compare alternatives against the requirements you clarified."],
] as const;

export function DesignTrackPage({
  track,
  eyebrow,
  title,
  description,
  roadmap,
  concepts,
  problems,
  domains,
}: {
  track: "system-design" | "ml-design";
  eyebrow: string;
  title: string;
  description: string;
  roadmap: DesignRoadmapStage[];
  concepts: DesignConcept[];
  problems: ProblemSummary[];
  domains: readonly string[];
}) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [domain, setDomain] = useState("All");
  const basePath = track === "system-design" ? "/system-design/start-here/introduction" : "/ml-design";
  const filtered = useMemo(() => problems.filter((problem) => {
    const matchesQuery = `${problem.title} ${problem.summary} ${problem.domains.join(" ")} ${(problem.patterns ?? []).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (difficulty === "All" || problem.difficulty === difficulty) && (domain === "All" || problem.domains.includes(domain));
  }), [difficulty, domain, problems, query]);

  return <>
    <AnalyticsEventOnMount event="roadmap_viewed" properties={{ roadmap: track }} />
    <PageHero eyebrow={eyebrow} title={title} description={description}>
      <a className="button" href="#practice">Choose a practice <ArrowRight size={16} /></a>
      <a className="button button-secondary" href="#roadmap">Follow the roadmap</a>
    </PageHero>

    <section className="section design-framework-section"><div className="page-width">
      <SectionHeading eyebrow="Reusable interview framework" title="Keep the conversation structured, not scripted." description="Move forward when the assumptions are clear enough; return when a later tradeoff changes them." />
      <ol className="design-framework">{framework.map(([name, copy], index) => <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{name}</strong><p>{copy}</p></div></li>)}</ol>
    </div></section>

    <section className="section section-alt" id="roadmap"><div className="page-width">
      <SectionHeading eyebrow="Engineering Foundry roadmap" title={`${roadmap.length} stages from framing to interview execution.`} description="These are preparation stages, not personal progress or a claim about any employer's process." />
      <div className="design-roadmap-grid">{roadmap.map((stage) => <article className="design-roadmap-card" key={stage.id}><span className="roadmap-index">{String(stage.order).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.summary}</p><ul>{stage.topics.map((topic) => <li key={topic}><CheckCircle2 size={14} />{topic}</li>)}</ul></article>)}</div>
    </div></section>

    <section className="section" id="concepts"><div className="page-width">
      <SectionHeading eyebrow="Concept directory" title="Know what each building block earns—and costs." description="Open a concept for its use case, primary tradeoff, and the mistake candidates often make." />
      <div className="design-concept-grid">{concepts.map((concept) => <details className="design-concept" key={concept.id}><summary><span className="icon-well"><Layers3 size={18} /></span><span><strong>{concept.title}</strong><small>{concept.summary}</small></span></summary><div className="concept-body"><p><b>What it solves</b>{concept.solves}</p><p><b>Use it when</b>{concept.useWhen}</p><p><b>Primary tradeoff</b>{concept.tradeoff}</p><p><b>Common mistake</b>{concept.commonMistake}</p></div></details>)}</div>
    </div></section>

    <section className="section section-alt" id="practice"><div className="page-width">
      <SectionHeading eyebrow="Original practice library" title={`${problems.length} complete prompts for deliberate practice.`} description="Difficulty is an Engineering Foundry preparation level—not a claim about company interview difficulty." />
      <div className="design-filters" aria-label="Practice filters">
        <label className="design-search"><Search size={17} /><span className="sr-only">Search practices</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, domain, or pattern" /></label>
        <label><Filter size={15} /><span className="sr-only">Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All</option><option>Foundation</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label><Waypoints size={15} /><span className="sr-only">Domain</span><select value={domain} onChange={(event) => setDomain(event.target.value)}><option>All</option>{domains.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="design-result-meta" role="status" aria-live="polite" aria-atomic="true">{filtered.length} {filtered.length === 1 ? "practice" : "practices"}</div>
      <div className="design-problem-grid">{filtered.map((problem) => <Link className="design-problem-card" href={`${basePath}/${problem.slug}`} key={problem.id}><div className="design-card-meta"><StatusPill>{problem.difficulty}</StatusPill><span>{problem.domains.slice(0, 2).join(" · ")}</span></div><h3>{problem.title}</h3><p>{problem.summary}</p>{problem.patterns?.length ? <div className="design-tags">{problem.patterns.slice(0, 3).map((pattern) => <span key={pattern}>{pattern}</span>)}</div> : null}<span className="card-link">Start practice <ArrowRight size={15} /></span></Link>)}</div>
      {!filtered.length && <div className="empty-inline"><BookOpen size={18} /><strong>No practices match these filters.</strong><span>Try a broader title, difficulty, or domain.</span></div>}
    </div></section>
  </>;
}
