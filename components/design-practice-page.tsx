"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, Gauge, Lightbulb, Network, Scale, ShieldAlert } from "lucide-react";
import { useRef } from "react";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import type { DesignDifficulty } from "@/types";
import { AnalyticsEventOnMount } from "./analytics-event";
import { PageHero, StatusPill } from "./page-shell";

export type PracticeSection = {
  id: string;
  title: string;
  intro?: string;
  groups: Array<{ title: string; items: string[]; components?: Array<{ name: string; purpose: string }> }>;
  tone?: "default" | "warning";
};

function GuidanceSection({ section, event, properties }: { section: PracticeSection; event: AnalyticsEvent; properties: Record<string, string> }) {
  const tracked = useRef(false);
  return <details className={`practice-details ${section.tone === "warning" ? "practice-warning" : ""}`} onToggle={(eventObject) => {
    if (!eventObject.currentTarget.open || tracked.current) return;
    tracked.current = true;
    track(event, { ...properties, section: section.id });
  }}>
    <summary><span>{section.tone === "warning" ? <ShieldAlert size={19} /> : <Lightbulb size={19} />}</span><span><strong>{section.title}</strong>{section.intro && <small>{section.intro}</small>}</span></summary>
    <div className="practice-details-body">{section.groups.map((group) => <section key={group.title}><h3>{group.title}</h3>{group.components ? <div className="component-grid">{group.components.map((component) => <article key={component.name}><Network size={16} /><strong>{component.name}</strong><p>{component.purpose}</p></article>)}</div> : <ul>{group.items.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul>}</section>)}</div>
  </details>;
}

export function DesignPracticePage({
  track,
  id,
  title,
  summary,
  prompt,
  difficulty,
  domains,
  patterns = [],
  sections,
  checklist,
}: {
  track: "system" | "ml";
  id: string;
  title: string;
  summary: string;
  prompt: string;
  difficulty: DesignDifficulty;
  domains: string[];
  patterns?: string[];
  sections: PracticeSection[];
  checklist: string[];
}) {
  const basePath = track === "system" ? "/system-design/start-here/introduction" : "/ml-design";
  const viewEvent: AnalyticsEvent = track === "system" ? "system_design_problem_viewed" : "ml_design_problem_viewed";
  const guidanceEvent: AnalyticsEvent = track === "system" ? "system_design_guidance_opened" : "ml_design_guidance_opened";
  const properties = { problem_id: id, difficulty, domain: domains[0] ?? "unknown", track: track === "system" ? "system-design" : "ml-design" };

  return <>
    <AnalyticsEventOnMount event={viewEvent} properties={properties} />
    <AnalyticsEventOnMount event="design_problem_started" properties={properties} />
    <PageHero eyebrow={track === "system" ? "System Design practice" : "ML System Design practice"} title={title} description={summary}>
      <StatusPill>{difficulty}</StatusPill>
      <span className="difficulty-note">Engineering Foundry preparation level</span>
    </PageHero>
    <div className="section practice-page"><div className="page-width practice-layout">
      <aside className="practice-sidebar"><Link href={basePath}><ArrowLeft size={15} />Back to roadmap</Link><div><small>Domains</small>{domains.map((domain) => <span key={domain}>{domain}</span>)}</div>{patterns.length ? <div><small>Patterns</small>{patterns.map((pattern) => <span key={pattern}>{pattern}</span>)}</div> : null}</aside>
      <div className="practice-content">
        <section className="prompt-card"><div><span className="icon-well"><Gauge size={20} /></span><small>Original Engineering Foundry prompt</small></div><h2>{prompt}</h2><p>Spend 30–45 minutes outlining your assumptions and design before opening the guidance below. There is no single correct architecture.</p></section>
        <div className="practice-callout"><CircleAlert size={18} /><p><strong>Try this before revealing guidance.</strong> State the user goal, scope, scale assumptions, core path, and one likely failure. Then compare your reasoning—not just your boxes.</p></div>
        <div className="practice-sections">{sections.map((section) => <GuidanceSection key={section.id} section={section} event={guidanceEvent} properties={properties} />)}</div>
        <section className="final-checklist"><div className="section-kicker">Final review</div><h2>Can you defend the design?</h2><p>Use this checklist after the deep dive. A strong answer makes its assumptions and tradeoffs visible.</p><ul>{checklist.map((item) => <li key={item}><CheckCircle2 size={17} />{item}</li>)}</ul><Link className="button button-secondary" href={basePath}><Scale size={16} />Choose another practice</Link></section>
      </div>
    </div></div>
  </>;
}
