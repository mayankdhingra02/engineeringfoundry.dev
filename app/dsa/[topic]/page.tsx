import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert, Gauge, Network } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { QuestionList } from "@/components/question-list";
import { dsaPatterns, dsaTopics, questionsForTopic, roadmapStages, topicBySlug } from "@/data/dsa";
import { createPageMetadata } from "@/lib/metadata";

export function generateStaticParams() { return dsaTopics.map((topic) => ({ topic: topic.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic: slug } = await params; const topic = topicBySlug.get(slug); if (!topic) notFound();
  return createPageMetadata({ title: `${topic.name} Interview Questions & Roadmap`, description: `${topic.summary} Explore original guidance, common patterns, and public ${topic.name.toLowerCase()} practice links.`, path: `/dsa/${topic.slug}` });
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: slug } = await params; const topic = topicBySlug.get(slug); if (!topic) notFound();
  const topicQuestions = questionsForTopic(slug);
  const patternSlugs = [...new Set(topicQuestions.flatMap((question) => question.patterns))];
  const patterns = patternSlugs.map((patternSlug) => dsaPatterns.find((pattern) => pattern.slug === patternSlug)).filter(Boolean);
  const distribution = { Easy: 0, Medium: 0, Hard: 0 }; topicQuestions.forEach((question) => { distribution[question.difficulty] += 1; });
  const stageIndex = roadmapStages.findIndex((stage) => stage.topics.includes(slug));
  const stage = roadmapStages[stageIndex]; const nextStage = roadmapStages[stageIndex + 1];
  return <><AnalyticsEventOnMount event="dsa_topic_viewed" properties={{ topic_slug: topic.slug, question_count: topicQuestions.length }} />
    <PageHero eyebrow={`DSA topic${stage ? ` · Stage ${stage.order}` : ""}`} title={`${topic.name} interview preparation`} description={topic.summary}><Link className="button button-secondary" href="/dsa"><ArrowLeft size={15} />DSA roadmap</Link><a className="button" href="#practice">Practice {topicQuestions.length} questions</a></PageHero>
    <section className="section section-compact"><div className="page-width"><div className="topic-overview-grid">
      <article><Network size={18} /><span>Where it appears</span><p>{topic.interviewUse}</p></article>
      <article><Gauge size={18} /><span>Complexity focus</span><p>{topic.complexityFocus}</p></article>
      <article><CircleAlert size={18} /><span>Common mistakes</span><ul>{topic.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></article>
    </div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Recognition patterns" title={`Patterns connected to ${topic.name}.`} description="Patterns describe solution shapes; topics describe the underlying data or concept. A question can belong to several of each." /><div className="pattern-grid">{patterns.map((pattern) => pattern && <article key={pattern.id}><span>{pattern.name}</span><p>{pattern.summary}</p><ul>{pattern.recognitionSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul></article>)}</div></div></section>
    <section className="section" id="practice"><div className="page-width"><SectionHeading eyebrow="Practice set" title={`${topicQuestions.length} current ${topic.name} questions.`} description={`Difficulty distribution: ${distribution.Easy} easy, ${distribution.Medium} medium, ${distribution.Hard} hard. External records contain metadata and original notes only.`} /><QuestionList questions={topicQuestions} emptyTitle="No active questions for this topic yet" emptyText="The topic guide is live while its practice set is curated." /></div></section>
    <section className="section section-alt"><div className="page-width"><div className="topic-next-grid"><div><span className="section-kicker">Related topics</span><div className="tag-list">{topic.relatedTopics.map((relatedSlug) => <Link className="tag" href={`/dsa/${relatedSlug}`} key={relatedSlug}>{topicBySlug.get(relatedSlug)?.name ?? relatedSlug}</Link>)}</div></div><div><span className="section-kicker">Next roadmap step</span>{nextStage ? <><h2>{nextStage.title}</h2><p>{nextStage.description}</p><Link className="card-link" href={`/dsa#roadmap`}>View Stage {nextStage.order}<ArrowRight size={14} /></Link></> : <><h2>Revisit weak patterns</h2><p>Use the explorer filters to build a mixed practice queue across your weaker areas.</p><Link className="card-link" href="/dsa#questions">Open explorer<ArrowRight size={14} /></Link></>}</div></div></div></section>
  </>;
}
