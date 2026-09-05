import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, Lightbulb, Scale, TriangleAlert } from "lucide-react";
import type { LowLevelDesignLesson } from "@/data/low-level-design";
import { LowLevelDesignProgressControl } from "./progress-control";
import { AnalyticsEventOnMount } from "@/components/analytics-event";

function List({ items }: { items: readonly string[] }) {
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export function LowLevelDesignLessonView({ lesson, previousSlug, nextSlug }: { lesson: LowLevelDesignLesson; previousSlug?: string; nextSlug?: string }) {
  const { contract } = lesson;
  return <div className="lld-reading page-width"><AnalyticsEventOnMount event="low_level_design_lesson_opened" properties={{ track: "low-level-design", lesson_id: lesson.id }} />
    <nav className="lld-breadcrumbs" aria-label="Breadcrumb"><Link href="/low-level-design"><ArrowLeft size={14} />Low-Level Design</Link><span>/ {lesson.title}</span></nav>
    <header className="lld-reading-header"><h1>{lesson.title}</h1><p>{lesson.summary}</p><div><span>~{lesson.estimatedMinutes} min read</span><span>Published curriculum</span><LowLevelDesignProgressControl itemId={`lesson:${lesson.id}`} analyticsItemId={lesson.id} analyticsItemType="lesson" /></div><small className="lld-local-note">Completion is a private browser marker for this device, not a mastery score.</small></header>
    <aside className="lld-objectives"><h2>What you will practice</h2><List items={lesson.objectives} /></aside>
    <article className="lld-article">
      <section className="lld-contract-opening">
        <p className="lld-eyebrow">Interview decision</p><h2>{contract.interviewDecision}</h2>
        <p className="lld-mental-model"><strong>Mental model</strong>{contract.mentalModel}</p>
        <div className="lld-reading-two-up lld-contract-lists"><div><h3>Use it to</h3><List items={contract.useCases} /></div><div><h3>Keep out of scope</h3><List items={contract.nonGoals} /></div></div>
      </section>
      <section>
        <h2>See the responsibility boundary</h2><p>{contract.domainExample}</p>
        <div className="lld-reading-two-up"><aside className="lld-callout mistake"><TriangleAlert size={17} aria-hidden="true" /><div><strong>Weak boundary</strong><p>{contract.badDesign}</p></div></aside><aside className="lld-callout tradeoff"><Scale size={17} aria-hidden="true" /><div><strong>Better boundary</strong><p>{contract.betterDesign}</p></div></aside></div>
        <div className="lld-interface-sketch"><div><span>Interface sketch</span><small>{contract.interfaceSketch.language}</small></div><pre aria-label={`${contract.interfaceSketch.language} interface sketch`}><code>{contract.interfaceSketch.code}</code></pre></div>
      </section>
      {lesson.sections.map((section) => <section key={section.title}>
        <h2>{section.title}</h2><p>{section.explanation}</p>
        <div className="lld-example"><Lightbulb size={17} aria-hidden="true" /><div><strong>Concrete example</strong><p>{section.example}</p></div></div>
        <div className="lld-reading-two-up"><aside className="lld-callout mistake"><TriangleAlert size={17} aria-hidden="true" /><div><strong>Common mistake</strong><p>{section.commonMistake}</p></div></aside><aside className="lld-callout tradeoff"><Scale size={17} aria-hidden="true" /><div><strong>Trade-off</strong><p>{section.tradeoff}</p></div></aside></div>
        <details className="lld-details"><summary>Interviewer follow-ups</summary><List items={section.followUps} /></details>
        <p className="lld-not-overbuild"><CircleAlert size={16} aria-hidden="true" /><span><strong>Do not over-engineer:</strong> {section.avoidOverengineering}</span></p>
      </section>)}
      <section className="lld-validation-section"><h2>Validate the design, not the diagram</h2><div className="lld-reading-two-up lld-contract-lists"><div><h3>Walk one representative flow</h3><ol>{contract.representativeFlow.map((step) => <li key={step}>{step}</li>)}</ol></div><div><h3>Tests that protect the reasoning</h3><List items={contract.testCases} /></div></div></section>
      <section><h2>Evolve it without losing the boundary</h2><dl className="lld-contract-definition"><div><dt>Follow-up change</dt><dd>{contract.evolutionFollowUp}</dd></div><div><dt>Concurrency, when relevant</dt><dd>{contract.concurrencyNote}</dd></div><div><dt>System Design boundary</dt><dd>{contract.systemDesignBoundary}</dd></div></dl></section>
      <section><h2>What depth looks like by level</h2><dl className="lld-level-expectations">{Object.entries(contract.levelExpectations).map(([level, expectation]) => <div key={level}><dt>{level}</dt><dd>{expectation}</dd></div>)}</dl></section>
    </article>
    <section className="lld-practice-handoff"><p className="lld-eyebrow">Apply this lesson</p><h2>Use the idea in a complete design.</h2><p>The exercise keeps its example approach closed until you have made a first pass.</p><Link className="button" href={`/low-level-design/practice/${contract.practiceSlug}?mode=guided`}>Open the matched practice <ArrowRight size={15} /></Link><Link href="/low-level-design/rubric">Review the 12-dimension rubric</Link></section>
    <section className="lld-related"><h2>Continue the curriculum</h2><div>{lesson.relatedLessonSlugs.map((slug) => <Link href={`/low-level-design/lessons/${slug}`} key={slug}>Related lesson <ArrowRight size={14} /></Link>)}</div></section>
    <nav className="lld-pager" aria-label="Lesson navigation">{previousSlug ? <Link href={`/low-level-design/lessons/${previousSlug}`}><span><ArrowLeft size={14} />Previous</span></Link> : <span />}{nextSlug ? <Link href={`/low-level-design/lessons/${nextSlug}`}>Next<ArrowRight size={14} /></Link> : <Link href="/low-level-design/practice">Start practice<ArrowRight size={14} /></Link>}</nav>
  </div>;
}
