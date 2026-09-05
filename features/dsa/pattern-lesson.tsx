import Link from "next/link";
/*
THESIS: A pattern lesson teaches a discard or state invariant before it names a reusable template.
OWN-WORLD: Existing Foundry paper, ink, hairline rules, rust actions, and green evidence states.
STORY: Recognize the shape, derive the invariant, rehearse the implementation, then test transfer.
FIRST VIEWPORT: Problem shape and decision boundary lead; practice count remains a precise secondary action.
FORM: Operate-mode extension of the established DSA learning document, with one vertical derivation spine. Surface seed: f31e86c0.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import { ArrowRight, Braces, CheckCircle2, CircleAlert, Languages, Route } from "lucide-react";
import { CodeTemplate, DSAArticleLayout, DSAHeading, DSANote } from "@/components/dsa-learning";
import type { DsaPatternLesson } from "@/data/dsa/pattern-lessons";
import type { Foundry75Question } from "@/data/dsa/foundry-75";

export function PatternLesson({ lesson, questions, workedProblem }: { lesson: DsaPatternLesson; questions: readonly Foundry75Question[]; workedProblem: Foundry75Question }) {
  const page = {
    id: lesson.id,
    title: lesson.name,
    slug: `/dsa/patterns/${lesson.slug}`,
    type: "page" as const,
    category: "Pattern lesson",
    status: "published" as const,
    description: lesson.problemShape,
    estimatedReadTime: 14,
  };

  return <div data-impeccable-seed="f31e86c0"><DSAArticleLayout page={page} showPager={false}>
    <nav className="dsa-pattern-lesson-actions" aria-label={`${lesson.name} lesson actions`}>
      <Link href={`/dsa/questions?q=${encodeURIComponent(lesson.slug)}`}><Route size={14} aria-hidden="true" />Practice {questions.length} matching question{questions.length === 1 ? "" : "s"}</Link>
      <Link href="/dsa/patterns">All 20 patterns<ArrowRight size={13} aria-hidden="true" /></Link>
    </nav>

    <DSAHeading level={2} id="recognize-the-shape">Recognize the shape before the name</DSAHeading>
    <p>{lesson.problemShape}</p>
    <div className="dsa-pattern-signal-grid"><section><h3>Signals</h3><ul>{lesson.recognitionSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul></section><section><h3>Anti-clues</h3><ul>{lesson.antiClues.map((clue) => <li key={clue}>{clue}</li>)}</ul></section></div>
    <DSANote title="Decision boundary"><p>Keyword matching is not enough. Choose this pattern only when you can defend its invariant against the input constraints.</p></DSANote>

    <DSAHeading level={2} id="derive-the-approach">Derive the approach</DSAHeading>
    <section className="dsa-pattern-baseline"><span>Brute-force baseline</span><p>{lesson.bruteForce}</p></section>
    <ol className="dsa-pattern-derivation">{lesson.derivation.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
    <blockquote><strong>Invariant</strong>{lesson.invariant}</blockquote>
    <CodeTemplate title={`${lesson.name} language-neutral pseudocode`} language="pseudocode">{lesson.pseudocode}</CodeTemplate>
    <div className="dsa-pattern-complexity"><article><span>Time</span><strong>{lesson.complexity.time}</strong></article><article><span>Space</span><strong>{lesson.complexity.space}</strong></article><p><strong>Assumptions:</strong> {lesson.complexity.assumptions}</p></div>
    <nav className="dsa-pattern-language-links" aria-label={`${lesson.name} language templates`}><Languages size={17} aria-hidden="true" /><span>Implementation templates</span><Link href="/dsa/languages/python#common-templates">Python</Link><Link href="/dsa/languages/java#common-templates">Java</Link></nav>

    <DSAHeading level={2} id="trace-the-state">Trace the state</DSAHeading>
    <figure className="dsa-pattern-trace"><figcaption>Deterministic state trace</figcaption><ol>{lesson.trace.map((step) => <li key={`${step.label}-${step.state}`}><span>{step.label}</span><code>{step.state}</code><p>{step.explanation}</p></li>)}</ol></figure>

    <DSAHeading level={2} id="implementation-review">Implementation review</DSAHeading>
    <div className="dsa-pattern-review-grid"><section><h3><CircleAlert size={16} aria-hidden="true" />Common wrong approaches</h3>{lesson.wrongApproaches.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.explanation}</p></article>)}</section><section><h3><CheckCircle2 size={16} aria-hidden="true" />Edge cases</h3><ul>{lesson.edgeCases.map((edge) => <li key={edge}>{edge}</li>)}</ul></section></div>
    <h3>Interview narration</h3><ol>{lesson.narration.map((line) => <li key={line}>“{line}”</li>)}</ol>

    <DSAHeading level={2} id="practice-transfer">Practice and transfer</DSAHeading>
    <section className="dsa-pattern-worked"><span>Labeled worked problem</span><h3>{workedProblem.title}</h3><p>{workedProblem.whyItBelongs}</p><Link href={`/dsa/questions/${workedProblem.slug}`}>Open the rehearsal brief<ArrowRight size={13} /></Link></section>
    <div className="dsa-pattern-exercises"><details><summary>Unlabeled recognition exercise</summary><p>{lesson.recognitionExercise.prompt}</p><details><summary>Reveal the decision</summary><p>{lesson.recognitionExercise.decision}</p></details></details><section><span>Transfer problem</span><p>{lesson.transferExercise.prompt}</p><strong>Checkpoint</strong><p>{lesson.transferExercise.checkpoint}</p></section></div>
    <div className="dsa-pattern-review-grid"><section><h3>Follow-up variations</h3><ul>{lesson.followUps.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>Error-log prompts</h3><ul>{lesson.errorLogPrompts.map((item) => <li key={item}>{item}</li>)}</ul></section></div>

    <DSAHeading level={2} id="related-patterns">Related patterns and boundaries</DSAHeading>
    <div className="dsa-pattern-related">{lesson.relatedPatterns.map((related) => <Link href={`/dsa/patterns/${related.slug}`} key={related.slug}><Braces size={15} aria-hidden="true" /><span><strong>{related.slug.replaceAll("-", " ")}</strong><small>{related.boundary}</small></span><ArrowRight size={13} aria-hidden="true" /></Link>)}</div>
  </DSAArticleLayout></div>;
}
