import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Lightbulb } from "lucide-react";
import type { LowLevelDesignPractice } from "@/data/low-level-design";
import { LowLevelDesignProgressControl } from "./progress-control";

function List({ items }: { items: readonly string[] }) { return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>; }

export function LowLevelDesignPracticeView({ problem }: { problem: LowLevelDesignPractice }) {
  return <div className="lld-reading page-width">
    <nav className="lld-breadcrumbs" aria-label="Breadcrumb"><Link href="/low-level-design"><ArrowLeft size={14} />Low-Level Design</Link><span>/ <Link href="/low-level-design/practice">Practice</Link> / {problem.title}</span></nav>
    <header className="lld-reading-header"><h1>{problem.title}</h1><p>{problem.summary}</p><div><span>Original practice design</span><LowLevelDesignProgressControl itemId={`practice:${problem.id}`} label="Record this practice attempt" /></div></header>
    <section className="lld-problem-prompt"><h2>The prompt</h2><p>{problem.prompt}</p></section>
    <div className="lld-problem-grid"><section><h2>Clarify before you model</h2><List items={problem.clarificationQuestions} /></section><section><h2>Requirements</h2><List items={problem.requirements} /></section><section><h2>Non-goals</h2><List items={problem.nonGoals} /></section><section><h2>Entities or components to consider</h2><List items={problem.entities} /></section></div>
    <section className="lld-reasoning"><h2>What the exercise is testing</h2><List items={problem.reasoningAreas} /></section>
    <section className="lld-guidance"><h2>Progressive guidance</h2><p>Reveal only the next prompt you need. The solution remains closed until you have sketched a first approach.</p>{problem.guidance.map((step, index) => <details className="lld-details" key={step.label}><summary>{`Hint ${index + 1}: ${step.label}`}</summary><p>{step.content}</p></details>)}</section>
    <div className="lld-problem-grid"><section><h2>Interviewer follow-ups</h2><List items={problem.followUps} /></section><section><h2>Common mistakes</h2><List items={problem.commonMistakes} /></section><section><h2>Extensions</h2><List items={problem.extensibilityPrompts} /></section><section><h2>Concurrency and testability</h2><List items={problem.concurrencyAndTestability} /></section></div>
    <details className="lld-solution"><summary><span><Lightbulb size={18} aria-hidden="true" />Reveal an example solution approach</span><span>After a first sketch</span></summary><div>{problem.solutionApproach.map((part) => <section key={part.title}><h2>{part.title}</h2><p>{part.content}</p></section>)}<p className="lld-not-overbuild"><CircleAlert size={16} aria-hidden="true" /><span>This is one defensible approach, not the only correct implementation. Explain the requirement and trade-off behind any different boundary.</span></p></div></details>
    <section className="lld-related"><h2>Review before another attempt</h2><div>{problem.relatedLessonSlugs.map((slug) => <Link href={`/low-level-design/lessons/${slug}`} key={slug}>Open related lesson <ArrowRight size={14} /></Link>)}</div></section>
    <Link className="lld-return" href="/low-level-design/practice"><CheckCircle2 size={16} />Browse all LLD practice designs</Link>
  </div>;
}
