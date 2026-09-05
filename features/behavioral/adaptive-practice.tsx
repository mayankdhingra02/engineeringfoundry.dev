"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { activeBehavioralQuestions } from "@/data/behavioral";
import {
  behavioralPracticeContexts,
  behavioralPracticeLevels,
  behavioralPracticeNextActions,
  behavioralRubricDimensions,
  behavioralSelfReviewQuestions,
  currentBehavioralProbe,
  defaultBehavioralAdaptivePracticeState,
  parseBehavioralAdaptivePracticeState,
  recordBehavioralProbeOutcome,
  serializeBehavioralAdaptivePracticeState,
  type BehavioralAdaptivePracticeState,
  type BehavioralEvidenceDimensionId,
} from "@/lib/behavioral/adaptive-practice";

function practiceHref(state: BehavioralAdaptivePracticeState) {
  const query = serializeBehavioralAdaptivePracticeState(state).toString();
  return `/behavioral/practice${query ? `?${query}` : ""}`;
}

function resetFor(state: BehavioralAdaptivePracticeState, change: Partial<BehavioralAdaptivePracticeState>) {
  return { ...defaultBehavioralAdaptivePracticeState, questionSlug: state.questionSlug, level: state.level, context: state.context, ...change };
}

export function BehavioralAdaptivePractice() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const state = useMemo(() => parseBehavioralAdaptivePracticeState(queryString), [queryString]);
  const question = activeBehavioralQuestions.find((item) => item.slug === state.questionSlug) ?? activeBehavioralQuestions[0];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const canonical = practiceHref(state);
    const current = `${window.location.pathname}${window.location.search}`;
    if (canonical !== current) window.history.replaceState(null, "", canonical);
  }, [state]);

  useEffect(() => {
    const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());
    window.addEventListener("popstate", focusHeading);
    return () => window.removeEventListener("popstate", focusHeading);
  }, []);

  function commit(next: BehavioralAdaptivePracticeState, mode: "push" | "replace" = "push") {
    const href = practiceHref(next);
    const current = `${window.location.pathname}${window.location.search}`;
    if (href === current) return;
    window.history[mode === "push" ? "pushState" : "replaceState"](null, "", href);
  }

  function toggleGap(id: BehavioralEvidenceDimensionId) {
    const gaps = state.gaps.includes(id) ? state.gaps.filter((item) => item !== id) : [...state.gaps, id];
    commit(resetFor(state, { gaps }), "replace");
  }

  const probe = currentBehavioralProbe(question, state);
  const nextActions = behavioralPracticeNextActions(state);
  const level = behavioralPracticeLevels.find((item) => item.id === state.level)!;
  const context = behavioralPracticeContexts.find((item) => item.id === state.context)!;

  return <main className="behavioral-drill" data-impeccable-seed="f31e86c0">
    <div className="page-width behavioral-drill-width">
      <nav className="behavioral-drill-back" aria-label="Breadcrumb"><Link href="/behavioral"><ArrowLeft size={14} />Behavioral</Link><span>/</span><span>Practice</span></nav>
      <header className="behavioral-drill-header">
        <div><h1 tabIndex={-1} ref={headingRef}>Follow the gap, not a script.</h1><p>Choose a truthful story, rehearse it somewhere private, then mark only the evidence dimensions that need a probe. The drill asks one highest-value question at a time.</p></div>
        <aside><LockKeyhole size={17} aria-hidden="true" /><p><strong>No answer text is collected.</strong> Your selections contain only public question IDs and rubric labels. Nothing here evaluates personality, honesty, accent, confidence, or hire probability.</p></aside>
      </header>

      <section className="behavioral-drill-config" aria-labelledby="practice-context-heading">
        <div><h2 id="practice-context-heading">Practice context</h2><p>Scope changes the follow-up lens, never the facts or expected verbosity.</p></div>
        <label><span>Question</span><select value={question.slug} onChange={(event) => commit(resetFor(state, { questionSlug: event.target.value }))}>{activeBehavioralQuestions.map((item) => <option key={item.id} value={item.slug}>{item.prompt}</option>)}</select></label>
        <label><span>Target level</span><select value={state.level} onChange={(event) => commit(resetFor(state, { level: event.target.value as BehavioralAdaptivePracticeState["level"] }))}>{behavioralPracticeLevels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>Context lens</span><select value={state.context} onChange={(event) => commit(resetFor(state, { context: event.target.value as BehavioralAdaptivePracticeState["context"] }))}>{behavioralPracticeContexts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div className="behavioral-drill-context"><p><strong>{level.label}:</strong> {level.guidance}</p><p><strong>{context.label}:</strong> {context.guidance}</p></div>
      </section>

      <section className="behavioral-drill-question" aria-labelledby="selected-question-heading">
        <div><span>{question.category}</span><span>{question.editorialReviewDate} review</span></div>
        <h2 id="selected-question-heading">{question.prompt}</h2>
        <p>Rehearse aloud or in a private document. Keep the event identity, personal role, consequential action, real outcome, adverse facts, measurement limits, and confidentiality boundary stable.</p>
        <small>{question.privacyWarning}</small>
      </section>

      {state.stage === "review" && <section className="behavioral-gap-review" aria-labelledby="gap-review-heading">
        <header><div><h2 id="gap-review-heading">Self-check before feedback</h2><p>Use the eight questions first. Then select the dimensions whose evidence was missing or brittle; do not select dimensions merely because you want a higher score.</p></div><Link href="/behavioral/review">Open the full descriptive rubric <ArrowRight size={14} /></Link></header>
        <ol className="behavioral-self-review">{behavioralSelfReviewQuestions.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
        <fieldset><legend>Evidence gaps to probe</legend><p>Selected dimensions are ordered by the question’s evidence target and the rubric priority.</p><div>{behavioralRubricDimensions.map((dimension) => <label key={dimension.id} htmlFor={`gap-${dimension.id}`}><input id={`gap-${dimension.id}`} type="checkbox" aria-label={`Probe ${dimension.label}`} checked={state.gaps.includes(dimension.id)} onChange={() => toggleGap(dimension.id)} /><span><strong>{dimension.label}</strong><small>{dimension.description}</small></span></label>)}</div></fieldset>
        <div className="behavioral-drill-actions"><button className="button" type="button" disabled={!state.gaps.length} onClick={() => commit({ ...state, stage: "drill", step: 0, depth: 0 })}>{state.gaps.length ? `Start ${state.gaps.length} ${state.gaps.length === 1 ? "probe" : "probes"}` : "Start probes"}<ArrowRight size={15} /></button><span role="status" aria-live="polite">{state.gaps.length ? `${state.gaps.length} evidence ${state.gaps.length === 1 ? "gap" : "gaps"} selected.` : "Select at least one evidence gap."}</span></div>
      </section>}

      {state.stage === "drill" && probe && <section className="behavioral-probe" aria-labelledby="probe-heading">
        <header><span>Probe {probe.position} of {probe.total}</span><div aria-label={`${Math.round((probe.position / probe.total) * 100)} percent through the selected probes`}><i style={{ transform: `scaleX(${probe.position / probe.total})` }} /></div></header>
        <div className="behavioral-probe-body"><aside><strong>Highest-value gap</strong><span>{probe.dimension.label}</span><p>{probe.dimension.description}</p></aside><article><h2 id="probe-heading">{probe.prompt}</h2>{state.depth === 1 && <p><strong>Question-specific angle:</strong> {probe.curatedProbe}</p>}<blockquote><strong>Keep this boundary:</strong> {probe.level.guidance} {probe.context.guidance}</blockquote></article></div>
        <p className="behavioral-probe-instruction">Answer outside this page. Then classify only what the answer now supports.</p>
        <div className="behavioral-probe-actions">
          {state.depth === 0 && <button type="button" className="button button-secondary" onClick={() => commit({ ...state, depth: 1 })}>Ask one deeper probe</button>}
          <button type="button" className="button" onClick={() => commit(recordBehavioralProbeOutcome(state, question, "resolved"))}>Evidence is clear</button>
          <button type="button" className="button button-secondary" onClick={() => commit(recordBehavioralProbeOutcome(state, question, "strengthen"))}>Needs strengthening</button>
          <button type="button" className="button button-secondary" onClick={() => commit(recordBehavioralProbeOutcome(state, question, "bounded"))}>I don’t know / can’t share</button>
        </div>
      </section>}

      {state.stage === "summary" && <section className="behavioral-drill-summary" aria-labelledby="drill-summary-heading">
        <header><Check size={19} aria-hidden="true" /><div><h2 id="drill-summary-heading">Consistency and evidence summary</h2><p>This is a record of your classifications, not a readiness score or hiring prediction.</p></div></header>
        <div className="behavioral-summary-groups">
          <section><h3>Supported after probing</h3>{state.resolved.length ? <ul>{state.resolved.map((id) => <li key={id}>{behavioralRubricDimensions.find((item) => item.id === id)?.label}</li>)}</ul> : <p>No dimension was marked supported.</p>}</section>
          <section><h3>Strengthen next</h3>{state.strengthen.length ? <ul>{state.strengthen.map((id) => <li key={id}>{behavioralRubricDimensions.find((item) => item.id === id)?.label}</li>)}</ul> : <p>No selected dimension was marked for strengthening.</p>}</section>
          <section><h3>Bounded or unavailable</h3>{state.bounded.length ? <ul>{state.bounded.map((id) => <li key={id}>{behavioralRubricDimensions.find((item) => item.id === id)?.label}</li>)}</ul> : <p>No selected dimension was marked unavailable.</p>}</section>
        </div>
        <aside className="behavioral-consistency-check"><ShieldAlert size={17} aria-hidden="true" /><p><strong>Before reuse:</strong> confirm that the event, role, decision, outcome, adverse facts, dates, metrics, team credit, and confidentiality boundary still match the canonical story.</p></aside>
        <section className="behavioral-next-actions"><h3>Your next one to three actions</h3><ol>{nextActions.map((action) => <li key={action.label}><div><strong>{action.label}</strong><p>{action.reason}</p></div><Link href={action.href}>Continue <ArrowRight size={14} /></Link></li>)}</ol></section>
        <div className="behavioral-drill-actions"><button type="button" className="button button-secondary" onClick={() => commit(resetFor(state, {}))}><RotateCcw size={15} />Start again</button><Link className="button" href="/interview-playbook">Return to Interview Playbook <ArrowRight size={15} /></Link></div>
      </section>}

      {state.stage === "drill" && !probe && <section className="behavioral-drill-summary"><p role="status">The selected probe state is complete.</p><button type="button" className="button" onClick={() => commit({ ...state, stage: "summary" })}>Open summary</button></section>}
    </div>
  </main>;
}
