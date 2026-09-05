import Link from "next/link";
/*
THESIS: A topic page connects one data-model concept to recognition, implementation choices, practice, and honest review state.
OWN-WORLD: Existing Foundry paper, ink, hairline rules, rust actions, and green evidence states.
STORY: Establish the model, choose an implementation, rehearse interview behavior, practice, then review errors.
FIRST VIEWPORT: The topic concept and exact practice count precede secondary roadmap context.
FORM: Operate-mode extension of the established DSA topic page, with a compact field-guide register. Surface seed: f31e86c0.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Gauge, Network, RotateCcw } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { QuestionList } from "@/components/question-list";
import type { DsaTopicLesson } from "@/data/dsa/topic-lessons";
import type { DsaPatternLesson } from "@/data/dsa/pattern-lessons";
import type { Foundry75Question } from "@/data/dsa/foundry-75";
import type { RoadmapStage } from "@/types";
import { isQuestionComplete, type DsaProgressMap } from "@/lib/dsa/progress";

export function TopicLesson({ topic, questions, patterns, stage, nextStage, progress, signedIn, accountPlatformAvailable }: {
  topic: DsaTopicLesson;
  questions: readonly Foundry75Question[];
  patterns: readonly DsaPatternLesson[];
  stage?: RoadmapStage;
  nextStage?: RoadmapStage;
  progress: DsaProgressMap;
  signedIn: boolean;
  accountPlatformAvailable: boolean;
}) {
  const distribution = { Easy: 0, Medium: 0, Hard: 0 };
  questions.forEach((question) => { distribution[question.difficulty] += 1; });
  const practiced = questions.filter((question) => progress[question.id]?.status && progress[question.id]?.status !== "not_started").length;
  const complete = questions.filter((question) => isQuestionComplete(progress[question.id]?.status ?? "not_started")).length;
  const review = questions.filter((question) => {
    const row = progress[question.id];
    return row?.status === "attempted" || row?.status === "review" || (row?.status === "solved" && row.confidence === "low");
  }).length;

  return <div data-impeccable-seed="f31e86c0"><AnalyticsEventOnMount event="dsa_topic_viewed" properties={{ topic_slug: topic.slug, question_count: questions.length }} />
    <PageHero eyebrow={`DSA topic${stage ? ` · Stage ${stage.order}` : ""}`} title={`${topic.name} interview preparation`} description={topic.summary}>
      <Link className="button button-secondary" href="/dsa"><ArrowLeft size={15} />DSA prep</Link>
      <a className="button" href="#practice">Practice {questions.length} question{questions.length === 1 ? "" : "s"}</a>
    </PageHero>

    <section className="section section-compact"><div className="page-width">
      <div className="dsa-topic-contract-grid">
        <article><Network size={18} aria-hidden="true" /><span>Concept</span><p>{topic.interviewUse}</p></article>
        <article><Gauge size={18} aria-hidden="true" /><span>Complexity lens</span><p>{topic.complexityFocus}</p></article>
        <article><CircleAlert size={18} aria-hidden="true" /><span>Common mistakes</span><ul>{topic.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></article>
      </div>
    </div></section>

    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Recognition" title="Decide from constraints, not labels." description="These clues narrow the model. They do not replace an invariant or complexity check." />
      <div className="dsa-topic-field-guide"><section><h3>Recognition clues</h3><ul>{topic.recognitionClues.map((clue) => <li key={clue}>{clue}</li>)}</ul></section><section><h3>Implementation options</h3><ol>{topic.implementationOptions.map((option) => <li key={option}>{option}</li>)}</ol></section><section><h3>Interview behavior</h3><ul>{topic.interviewBehavior.map((behavior) => <li key={behavior}>{behavior}</li>)}</ul></section></div>
      {patterns.length ? <div className="dsa-topic-pattern-register"><h3>Patterns that operate on this topic</h3><div>{patterns.map((pattern) => <Link href={`/dsa/patterns/${pattern.slug}`} key={pattern.slug}><strong>{pattern.name}</strong><span>{pattern.invariant}</span><ArrowRight size={13} aria-hidden="true" /></Link>)}</div></div> : null}
    </div></section>

    <section className="section" id="practice"><div className="page-width"><SectionHeading eyebrow="Representative problems" title={`${questions.length} current ${topic.name} question${questions.length === 1 ? "" : "s"}.`} description={`Exact active distribution: ${distribution.Easy} easy, ${distribution.Medium} medium, ${distribution.Hard} hard. External records contain metadata and original guidance only.`} /><QuestionList questions={questions} emptyTitle="No active questions for this topic yet" emptyText="The topic guide is published, but no Foundry 75 question is currently assigned. Choose a connected pattern instead." /></div></section>

    <section className="section section-alt"><div className="page-width"><div className="dsa-topic-review-grid">
      <section><span className="section-kicker">Review state</span>{signedIn ? <><h2>{practiced} practiced · {complete} completed</h2><p><RotateCcw size={15} aria-hidden="true" />{review} question{review === 1 ? "" : "s"} currently need review. Completion is activity, not mastery.</p><Link className="card-link" href="/dsa/practice#review-queue">Open private review queue<ArrowRight size={14} /></Link></> : <><h2>{accountPlatformAvailable ? "Sign in for private topic progress" : "Browser-local practice remains available"}</h2><p>Question pages let you record local completion. Account status, confidence, notes, and a topic roll-up are shown only when private account persistence is available.</p><Link className="card-link" href="/dsa/practice">Open practice workspace<ArrowRight size={14} /></Link></>}</section>
      <section><span className="section-kicker">Review prompts</span><ul>{topic.reviewPrompts.map((prompt) => <li key={prompt}><CheckCircle2 size={14} aria-hidden="true" />{prompt}</li>)}</ul></section>
      <section><span className="section-kicker">Prerequisites and next step</span><div className="tag-list">{topic.prerequisites.length ? topic.prerequisites.map((slug) => <Link className="tag" href={`/dsa/${slug}`} key={slug}>{slug.replaceAll("-", " ")}</Link>) : <span className="tag">Start here</span>}</div>{nextStage ? <><h2>{nextStage.title}</h2><p>{nextStage.description}</p><Link className="card-link" href="/dsa/roadmap">Open the roadmap<ArrowRight size={14} /></Link></> : <><h2>Mix the patterns</h2><p>Use an unlabeled set to test transfer after the topic-specific set.</p><Link className="card-link" href="/dsa/questions">Build a mixed set<ArrowRight size={14} /></Link></>}</section>
    </div></div></section>
  </div>;
}
