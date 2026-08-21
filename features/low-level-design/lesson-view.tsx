import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, Lightbulb, Scale, TriangleAlert } from "lucide-react";
import type { LowLevelDesignLesson } from "@/data/low-level-design";
import { LowLevelDesignProgressControl } from "./progress-control";
import { AnalyticsEventOnMount } from "@/components/analytics-event";

export function LowLevelDesignLessonView({ lesson, previousSlug, nextSlug }: { lesson: LowLevelDesignLesson; previousSlug?: string; nextSlug?: string }) {
  return <div className="lld-reading page-width"><AnalyticsEventOnMount event="low_level_design_lesson_opened" properties={{ track: "low-level-design", lesson_id: lesson.id }} />
    <nav className="lld-breadcrumbs" aria-label="Breadcrumb"><Link href="/low-level-design"><ArrowLeft size={14} />Low-Level Design</Link><span>/ {lesson.title}</span></nav>
    <header className="lld-reading-header"><h1>{lesson.title}</h1><p>{lesson.summary}</p><div><span>~{lesson.estimatedMinutes} min read</span><span>Published curriculum</span><LowLevelDesignProgressControl itemId={`lesson:${lesson.id}`} /></div></header>
    <aside className="lld-objectives"><h2>What you will practice</h2><ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></aside>
    <article className="lld-article">
      {lesson.sections.map((section) => <section key={section.title}>
        <h2>{section.title}</h2><p>{section.explanation}</p>
        <div className="lld-example"><Lightbulb size={17} aria-hidden="true" /><div><strong>Concrete example</strong><p>{section.example}</p></div></div>
        <div className="lld-reading-two-up"><aside className="lld-callout mistake"><TriangleAlert size={17} aria-hidden="true" /><div><strong>Common mistake</strong><p>{section.commonMistake}</p></div></aside><aside className="lld-callout tradeoff"><Scale size={17} aria-hidden="true" /><div><strong>Trade-off</strong><p>{section.tradeoff}</p></div></aside></div>
        <details className="lld-details"><summary>Interviewer follow-ups</summary><ul>{section.followUps.map((question) => <li key={question}>{question}</li>)}</ul></details>
        <p className="lld-not-overbuild"><CircleAlert size={16} aria-hidden="true" /><span><strong>Do not over-engineer:</strong> {section.avoidOverengineering}</span></p>
      </section>)}
    </article>
    <section className="lld-related"><h2>Continue the curriculum</h2><div>{lesson.relatedLessonSlugs.map((slug) => <Link href={`/low-level-design/lessons/${slug}`} key={slug}>Related lesson <ArrowRight size={14} /></Link>)}</div></section>
    <nav className="lld-pager" aria-label="Lesson navigation">{previousSlug ? <Link href={`/low-level-design/lessons/${previousSlug}`}><span><ArrowLeft size={14} />Previous</span></Link> : <span />}{nextSlug ? <Link href={`/low-level-design/lessons/${nextSlug}`}>Next<ArrowRight size={14} /></Link> : <Link href="/low-level-design/practice">Start practice<ArrowRight size={14} /></Link>}</nav>
  </div>;
}
