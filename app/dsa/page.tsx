import Link from "next/link";
import { ArrowRight, BarChart3, Compass, Database, Route } from "lucide-react";
import { Suspense } from "react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading, StatusPill } from "@/components/page-shell";
import { activeQuestions, dsaPatterns, dsaTopics, getRoadmapQuestionCount, roadmapStages } from "@/data/dsa";
import { DsaExplorer } from "@/features/dsa/dsa-explorer";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "DSA Interview Roadmap & Questions", description: "A structured data structures and algorithms roadmap with public practice links, original prompts, pattern navigation, and provenance-aware question metadata.", path: "/dsa" });

export default function DsaPage() {
  const difficulty = { Easy: 0, Medium: 0, Hard: 0 };
  activeQuestions.forEach((question) => { difficulty[question.difficulty] += 1; });
  return <><AnalyticsEventOnMount event="roadmap_viewed" properties={{ roadmap: "dsa" }} />
    <PageHero eyebrow="Data Structures & Algorithms" title="DSA Interview Roadmap" description="A structured progression from foundations to advanced interview patterns—with a focused public question library you can use without an account."><a className="button" href="#roadmap">Start with Stage 1 <ArrowRight size={16} /></a><a className="button button-secondary" href="#questions">Explore questions</a></PageHero>

    <section className="section section-compact"><div className="page-width"><div className="dsa-stat-grid">
      <article><Database size={18} /><span>Practice library</span><strong>{activeQuestions.length}</strong><small>curated metadata records</small></article>
      <article><Route size={18} /><span>Roadmap</span><strong>{roadmapStages.length}</strong><small>ordered learning stages</small></article>
      <article><Compass size={18} /><span>Taxonomy</span><strong>{dsaTopics.length} / {dsaPatterns.length}</strong><small>topics / patterns</small></article>
      <article><BarChart3 size={18} /><span>Difficulty</span><strong>{difficulty.Easy} · {difficulty.Medium} · {difficulty.Hard}</strong><small>easy · medium · hard</small></article>
    </div></div></section>

    <section className="section section-alt" id="roadmap"><div className="page-width"><SectionHeading eyebrow="Canonical roadmap" title="Learn in a deliberate order." description="Each stage groups concepts that reinforce one another. Counts reflect this repository's current dataset—not personal completion or popularity." /><ol className="roadmap-stage-grid">{roadmapStages.map((stage) => <li key={stage.id}>
      <div className="roadmap-stage-top"><span>{String(stage.order).padStart(2, "0")}</span>{stage.order === 1 && <StatusPill tone="accent">Start here</StatusPill>}</div>
      <h3>{stage.title}</h3><p>{stage.description}</p>
      <div className="roadmap-stage-count"><strong>{getRoadmapQuestionCount(stage.slug)}</strong><span>questions in this dataset</span></div>
      <div className="tag-list">{stage.topics.slice(0, 4).map((slug) => <Link className="tag" href={`/dsa/${slug}`} key={slug}>{dsaTopics.find((topic) => topic.slug === slug)?.name}</Link>)}</div>
    </li>)}</ol><p className="roadmap-persistence-note">Progress tracking will become available when account persistence is enabled.</p></div></section>

    <section className="section" id="topics"><div className="page-width"><SectionHeading eyebrow="Topic navigation" title="Choose the concept you need to strengthen." description="Topic pages explain the interview role, complexity focus, common patterns, current practice set, and a sensible next step." /><div className="topic-directory">{dsaTopics.map((topic) => {
      const count = activeQuestions.filter((question) => question.topics.includes(topic.slug)).length;
      return <Link href={`/dsa/${topic.slug}`} key={topic.id}><span>{String(count).padStart(2, "0")}</span><strong>{topic.name}</strong><small>{topic.summary}</small><ArrowRight size={14} /></Link>;
    })}</div></div></section>

    <section className="section section-alt" id="questions"><div className="page-width"><SectionHeading eyebrow="Question explorer" title="Build a focused practice queue." description="Filter public links and original prompts by title, difficulty, topic, pattern, source, availability, verification, or sourced company association. No third-party problem statements are reproduced." /><Suspense fallback={<div className="empty-inline">Loading question explorer…</div>}><DsaExplorer /></Suspense></div></section>
  </>;
}
