"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Clock3, Lightbulb, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { lowLevelDesignRubric, type LowLevelDesignPractice, type LowLevelDesignRubricId } from "@/data/low-level-design";
import { getLowLevelDesignMockPlanSlug } from "@/data/mock-interviews/low-level-design-handoffs";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import {
  buildLowLevelDesignPracticeHref,
  lowLevelDesignPracticeModes,
  type LowLevelDesignPracticeContext,
  type LowLevelDesignPracticeMode,
} from "@/lib/low-level-design/practice-url-state";
import { LowLevelDesignProgressControl } from "./progress-control";

type Reflection = "revisit" | "developing" | "evident";
const modeCopy: Readonly<Record<LowLevelDesignPracticeMode, { title: string; description: string }>> = {
  guided: { title: "Guided", description: "Progressive prompts stay available while you build the first model." },
  independent: { title: "Independent", description: "Try the full prompt before deliberately revealing a hint." },
  timed: { title: "Timed", description: "Use a visible, session-only clock and defer guidance until you ask." },
};

function List({ items }: { items: readonly string[] }) { return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>; }
function formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function displayCompany(slug: string) { return slug.split("-").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" "); }

function DesignDossier({ problem }: { problem: LowLevelDesignPractice }) {
  return <section className="lld-dossier" aria-labelledby="design-dossier-title"><p className="lld-eyebrow">Example design dossier</p><h2 id="design-dossier-title">Compare each boundary with your first pass.</h2>
    <div className="lld-dossier-grid"><section><h3>Domain model</h3><List items={problem.contract.domainModel} /></section><section><h3>Responsibilities</h3><List items={problem.contract.responsibilities} /></section></div>
    <section className="lld-interface-list"><h3>Interfaces</h3>{problem.contract.interfaces.map((item) => <div key={item.signature}><code>{item.signature}</code><p>{item.purpose}</p></div>)}</section>
    <div className="lld-dossier-grid"><section><h3>State and invariants</h3><List items={problem.contract.stateAndInvariants} /></section><section><h3>Error and idempotency behavior</h3><List items={problem.contract.errorHandling} /></section></div>
    <section className="lld-flow"><h3>Representative flow</h3><ol>{problem.contract.representativeFlow.map((step) => <li key={step}><span>{step}</span></li>)}</ol></section>
    <div className="lld-dossier-grid"><section><h3>Testing strategy</h3><List items={problem.contract.testingStrategy} /></section><section><h3>Concurrency judgment</h3><p><strong>{problem.contract.concurrency.relevant ? "A natural race exists." : "No natural race in the bounded core."}</strong> {problem.contract.concurrency.note}</p></section></div>
    <section className="lld-alternatives"><h3>Alternatives worth comparing</h3>{problem.contract.alternatives.map((alternative) => <article key={alternative.title}><h4>{alternative.title}</h4><p><strong>Use when:</strong> {alternative.useWhen}</p><p><strong>Trade-off:</strong> {alternative.tradeoff}</p></article>)}</section>
  </section>;
}

export function LowLevelDesignPracticeView({ problem, context }: { problem: LowLevelDesignPractice; context: LowLevelDesignPracticeContext }) {
  const router = useRouter();
  const [mode, setMode] = useState<LowLevelDesignPracticeMode>(context.mode);
  const [elapsed, setElapsed] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [running, setRunning] = useState(false);
  const [revealedHints, setRevealedHints] = useState(mode === "guided" ? problem.guidance.length : 0);
  const [ratings, setRatings] = useState<Partial<Record<LowLevelDesignRubricId, Reflection>>>({});
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const mockPlanSlug = getLowLevelDesignMockPlanSlug(problem.slug);
  const reviewComplete = lowLevelDesignRubric.every((dimension) => Boolean(ratings[dimension.id]));

  useEffect(() => {
    if (!running) return;
    const limit = durationMinutes * 60;
    const id = window.setTimeout(() => {
      const next = Math.min(elapsed + 1, limit);
      setElapsed(next);
      if (next >= limit) setRunning(false);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [durationMinutes, elapsed, running]);

  function chooseMode(nextMode: LowLevelDesignPracticeMode) {
    setMode(nextMode);
    setRunning(false);
    setElapsed(0);
    setRevealedHints(nextMode === "guided" ? problem.guidance.length : 0);
    setSolutionRevealed(false);
    router.replace(buildLowLevelDesignPracticeHref(problem.slug, { ...context, mode: nextMode }), { scroll: false });
  }

  return <div className="lld-reading page-width"><AnalyticsEventOnMount event="low_level_design_practice_started" properties={{ track: "low-level-design", practice_id: problem.id, practice_mode: context.mode }} />
    <nav className="lld-breadcrumbs" aria-label="Breadcrumb"><Link href="/low-level-design"><ArrowLeft size={14} />Low-Level Design</Link><span>/ <Link href={buildLowLevelDesignPracticeHref(null, context)}>Practice</Link> / {problem.title}</span></nav>
    {context.source === "playbook" && <aside className="lld-playbook-context"><div><span>Configured from your Playbook</span><strong>{[context.company ? displayCompany(context.company) : null, context.level, "Low-Level Design", modeCopy[mode].title].filter(Boolean).join(" · ")}</strong></div><Link href="/interview-tips/rounds/low-level-design">Review round execution</Link></aside>}
    <header className="lld-reading-header"><h1>{problem.title}</h1><p>{problem.summary}</p><div><span>Original practice design</span><LowLevelDesignProgressControl itemId={`practice:${problem.id}`} analyticsItemId={problem.id} analyticsItemType="practice" label="Record this practice attempt" /></div><small className="lld-local-note">The activity marker stays in this browser. Your timer and self-review are session-only and are not sent to analytics.</small></header>

    <section className="lld-mode-panel" aria-labelledby="practice-mode-title"><div><p className="lld-eyebrow">Practice conditions</p><h2 id="practice-mode-title">Choose how much structure you want.</h2></div><div className="lld-mode-options">{lowLevelDesignPracticeModes.map((option) => <button type="button" key={option} className={mode === option ? "active" : ""} aria-pressed={mode === option} onClick={() => chooseMode(option)}><strong>{modeCopy[option].title}</strong><span>{modeCopy[option].description}</span></button>)}</div></section>

    {mode === "timed" && <section className="lld-practice-timer" aria-label="Practice timer"><Clock3 aria-hidden="true" /><div><span>Session-only timer</span><strong aria-live="polite">{formatTime(Math.min(elapsed, durationMinutes * 60))}</strong><small>of {durationMinutes} minutes</small></div><label><span>Duration</span><select value={durationMinutes} onChange={(event) => { setDurationMinutes(Number(event.target.value)); setRunning(false); setElapsed(0); }}><option value={35}>35 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label><div className="lld-timer-actions"><button type="button" onClick={() => setRunning((value) => !value)} disabled={elapsed >= durationMinutes * 60}>{running ? <Pause size={15} /> : <Play size={15} />}{running ? "Pause" : "Start"}</button><button type="button" onClick={() => { setRunning(false); setElapsed(0); }}><RotateCcw size={15} />Reset</button></div></section>}

    <section className="lld-problem-prompt"><h2>The prompt</h2><p>{problem.prompt}</p></section>
    <div className="lld-problem-grid"><section><h2>Clarify before you model</h2><List items={problem.clarificationQuestions} /></section><section><h2>Functional behavior</h2><List items={problem.requirements} /></section><section><h2>Constraints and non-goals</h2><List items={problem.nonGoals} /></section><section><h2>What the exercise is testing</h2><List items={problem.reasoningAreas} /></section></div>

    <section className="lld-design-checkpoint"><p className="lld-eyebrow">Your first pass</p><h2>Draft these decisions before self-review.</h2><ol><li>Name only the entities and values the primary flow needs.</li><li>Assign each decision, mutation, lifecycle, and invariant one owner.</li><li>Sketch caller-shaped interfaces and explicit failure results.</li><li>Walk one successful flow and one failure without skipping state changes.</li><li>Choose a testing seam, decide whether a natural race exists, and compare two defensible alternatives.</li></ol><p>The authored dossier remains hidden until all 12 qualitative dimensions are reflected on.</p></section>

    <section className="lld-guidance"><h2>Progressive guidance</h2><p>{mode === "guided" ? "The prompts are open in Guided mode. Use only the next one you need." : "Guidance stays closed in this mode until you deliberately reveal the next prompt."}</p>{problem.guidance.map((step, index) => index < revealedHints ? <details className="lld-details" key={step.label} open={mode === "guided" ? true : undefined}><summary>{`Hint ${index + 1}: ${step.label}`}</summary><p>{step.content}</p></details> : null)}{revealedHints < problem.guidance.length && <button className="lld-reveal-button" type="button" onClick={() => setRevealedHints((count) => count + 1)}>Reveal hint {revealedHints + 1}</button>}</section>
    <div className="lld-problem-grid"><section><h2>Interviewer follow-ups</h2><List items={problem.followUps} /></section><section><h2>Common mistakes</h2><List items={problem.commonMistakes} /></section><section><h2>Evolution prompts</h2><List items={problem.extensibilityPrompts} /></section><section><h2>Questions to say aloud</h2><List items={problem.concurrencyAndTestability} /></section></div>

    <section className="lld-self-review" aria-labelledby="lld-self-review-title"><header><div><p className="lld-eyebrow">Before the example approach</p><h2 id="lld-self-review-title">Review your own reasoning.</h2></div><Link href="/low-level-design/rubric">Open rubric guidance <ArrowRight size={14} /></Link></header><p>Choose the description that best matches this attempt. This creates no score, readiness claim, or saved evaluation.</p><div>{lowLevelDesignRubric.map((dimension) => <fieldset key={dimension.id} className={problem.contract.rubricEmphasis.includes(dimension.id) ? "emphasis" : ""}><legend>{dimension.title}{problem.contract.rubricEmphasis.includes(dimension.id) && <span>Exercise emphasis</span>}</legend><p>{dimension.prompt}</p><div>{(["revisit", "developing", "evident"] as const).map((rating) => <label key={rating}><input type="radio" name={`${problem.id}-${dimension.id}`} value={rating} checked={ratings[dimension.id] === rating} onChange={() => setRatings((current) => ({ ...current, [dimension.id]: rating }))} /><span>{rating === "revisit" ? "Revisit" : rating === "developing" ? "Developing" : "Evident"}</span></label>)}</div></fieldset>)}</div><p className="lld-review-status" aria-live="polite">{reviewComplete ? <><CheckCircle2 size={16} />Reflection complete for this session. You can now compare one defensible approach.</> : `${Object.keys(ratings).length} of ${lowLevelDesignRubric.length} dimensions reflected on.`}</p></section>

    <section className="lld-solution"><header><span><Lightbulb size={18} aria-hidden="true" />One defensible approach</span><small>Not a golden diagram</small></header>{!solutionRevealed ? <div className="lld-solution-gate"><p>Complete the qualitative self-review first. The goal is to compare reasoning, not copy a canonical class diagram.</p><button className="button" type="button" disabled={!reviewComplete} onClick={() => setSolutionRevealed(true)}>Compare the example approach</button></div> : <div><DesignDossier problem={problem} />{problem.solutionApproach.map((part) => <section key={part.title}><h2>{part.title}</h2><p>{part.content}</p></section>)}<p className="lld-not-overbuild"><CircleAlert size={16} aria-hidden="true" /><span>This is one defensible approach, not the only correct implementation. Explain the requirement and trade-off behind any different boundary.</span></p></div>}</section>

    {mockPlanSlug && <section className="lld-rehearsal-handoff"><div><p className="lld-eyebrow">Need a live rehearsal?</p><h2>Use the Mock Lab for the same exercise.</h2><p>The Mock Lab adds durable review for signed-in users. It remains self-reported practice evidence, not an employer-correctness judgment.</p></div><Link className="button button-secondary" href={`/mock-interviews?track=low-level-design&problem=${mockPlanSlug}&mode=solo`}>Configure exact mock <ArrowRight size={15} /></Link></section>}
    <section className="lld-related"><h2>Review before another attempt</h2><div>{problem.relatedLessonSlugs.map((slug) => <Link href={`/low-level-design/lessons/${slug}`} key={slug}>Open related lesson <ArrowRight size={14} /></Link>)}</div></section>
    <Link className="lld-return" href={buildLowLevelDesignPracticeHref(null, context)}><CheckCircle2 size={16} />Browse all LLD practice designs</Link>
  </div>;
}
