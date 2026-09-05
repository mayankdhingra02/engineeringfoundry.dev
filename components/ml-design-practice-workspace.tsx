"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Eye, Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MlDesignProblem } from "@/types";
import { mlDesignFramework, mlRubric, mlRubricBands } from "@/data/ml-design/reference";
import { ML_DESIGN_PROBLEMS_ROOT } from "@/lib/ml-design-routes";
import { track } from "@/lib/analytics";
import { MlDesignFlow } from "./ml-design-document";
import { PreparationActivityControl } from "./preparation-activity-control";

type Mode = "guided" | "untimed" | "timed";

const guideSections = [
  { key: "define", title: "Define the product decision", fields: ["clarifyingQuestions", "productGoal", "predictionTarget", "scaleAndConstraints", "baseline"] },
  { key: "establish", title: "Establish success criteria", fields: ["successMetrics", "evaluation", "rubricEmphasis"] },
  { key: "construct", title: "Construct the learning signal", fields: ["dataSources", "labeling", "datasetPlan", "features"] },
  { key: "integrate", title: "Integrate learning into the system", fields: ["offlineArchitecture", "training", "modelDiscussion", "onlineArchitecture", "serving", "capacityReliability"] },
  { key: "derisk", title: "De-risk the launch", fields: ["rollout", "responsibleMl", "alternatives", "tradeoffs"] },
  { key: "evolve", title: "Evolve the production system", fields: ["monitoring", "feedbackLoop", "failureModes", "extensions", "seniorExtensions", "variants"] },
] as const;

const fieldLabels: Record<string, string> = {
  clarifyingQuestions: "Clarifying questions", productGoal: "Product goal", predictionTarget: "Decision and prediction target", scaleAndConstraints: "Scale and constraints", baseline: "Non-ML baseline",
  successMetrics: "Success metrics and guardrails", evaluation: "Offline evaluation", rubricEmphasis: "Rubric emphasis",
  dataSources: "Data sources", labeling: "Labels and ground truth", datasetPlan: "Dataset and split plan", features: "Features and representations",
  offlineArchitecture: "Offline architecture", training: "Training", modelDiscussion: "Model discussion", onlineArchitecture: "Online architecture", serving: "Serving", capacityReliability: "Capacity and reliability",
  rollout: "Rollout and rollback", responsibleMl: "Responsible ML", alternatives: "Alternatives", tradeoffs: "Trade-offs",
  monitoring: "Monitoring", feedbackLoop: "Feedback and retraining", failureModes: "Failure modes", extensions: "Interviewer follow-ups", seniorExtensions: "Senior / Staff+ extensions", variants: "Variants",
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function MlDesignPracticeWorkspace({ problem, accountPlatformAvailable, privateAttempts }: { problem: MlDesignProblem; accountPlatformAvailable: boolean; privateAttempts?: ReactNode }) {
  const [mode, setMode] = useState<Mode>("guided");
  const [revealed, setRevealed] = useState(0);
  const [duration, setDuration] = useState(45);
  const [remaining, setRemaining] = useState(45 * 60);
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "ended">("idle");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [assumptions, setAssumptions] = useState("");
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState<Record<string, string>>({});
  const startedRef = useRef(false);

  useEffect(() => {
    if (timerState !== "running") return;
    const interval = window.setInterval(() => setRemaining((current) => {
      if (current <= 1) {
        window.clearInterval(interval);
        setTimerState("ended");
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [timerState]);

  const allGuidanceVisible = mode === "untimed" || timerState === "ended" || revealed >= guideSections.length;
  const reviewCount = useMemo(() => Object.keys(review).length, [review]);

  function chooseMode(next: Mode) {
    recordPracticeStart();
    setMode(next);
    setRevealed(next === "guided" ? 0 : guideSections.length);
    if (next !== "timed") setTimerState("idle");
  }

  function resetTimer(minutes = duration) {
    setDuration(minutes);
    setRemaining(minutes * 60);
    setTimerState("idle");
    setRevealed(0);
    setHintsUsed(0);
  }

  function revealNext() {
    recordPracticeStart();
    setRevealed((current) => Math.min(guideSections.length, current + 1));
    if (mode === "timed") setHintsUsed((current) => current + 1);
  }

  function recordPracticeStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("ml_design_practice_started", { track: "ml-design", problem_id: problem.id });
  }

  return <>
    <section className="ml-problem-brief" aria-labelledby="problem-brief-title"><h2 id="problem-brief-title">Interview prompt</h2><blockquote>{problem.prompt}</blockquote><dl><div><dt>Decision unit</dt><dd>{problem.decisionUnit}</dd></div><div><dt>Level</dt><dd>{problem.difficulty}</dd></div><div><dt>Family</dt><dd>{problem.family}</dd></div><div><dt>Domains</dt><dd>{problem.domains.join(" · ")}</dd></div></dl></section>
    <MlDesignFlow visual={problem.visual} />
    {privateAttempts}

    <section className="ml-practice-workspace" aria-labelledby="practice-title">
      <div className="ml-practice-heading"><div><h2 id="practice-title">Work the problem</h2><p>Choose the amount of structure you want. This draft stays only in this tab; refreshing discards it.</p></div><PreparationActivityControl track="ml-design" itemId={problem.id} noun="practice" accountPlatformAvailable={accountPlatformAvailable} /></div>
      <div className="ml-mode-tabs" role="group" aria-label="Practice mode">{(["guided", "untimed", "timed"] as const).map((item) => <button type="button" key={item} aria-pressed={mode === item} onClick={() => chooseMode(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
      <div className="ml-mode-explanation"><strong>{mode === "guided" ? "Guided learning" : mode === "untimed" ? "Untimed rehearsal" : "Timed interview rehearsal"}</strong><p>{mode === "guided" ? "Reveal one DECIDE stage at a time. Guided completion is useful learning evidence, but not strong readiness evidence." : mode === "untimed" ? "All guidance is available. Capture assumptions, build a full answer, then self-review by dimension." : "Guidance stays hidden until you request a hint or the timer ends. Hints are recorded in this tab for honest self-review."}</p></div>

      {mode === "timed" ? <div className="ml-timer"><div><Clock3 size={20} aria-hidden="true" /><span role="timer" aria-label={`${formatTime(remaining)} remaining`}>{formatTime(remaining)}</span></div><label>Duration<select value={duration} onChange={(event) => { recordPracticeStart(); resetTimer(Number(event.target.value)); }} disabled={timerState === "running"}><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label><div>{timerState !== "running" ? <button className="button" type="button" onClick={() => { recordPracticeStart(); setTimerState("running"); }}><Play size={14} />{timerState === "paused" ? "Resume" : "Start"}</button> : <button className="button" type="button" onClick={() => setTimerState("paused")}><Pause size={14} />Pause</button>}<button className="button button-secondary" type="button" onClick={() => resetTimer()}><RotateCcw size={14} />Reset</button></div><p>{hintsUsed} {hintsUsed === 1 ? "hint" : "hints"} used.</p></div> : null}

      <div className="ml-writing-fields"><label>Assumptions and clarifications<textarea value={assumptions} onChange={(event) => { recordPracticeStart(); setAssumptions(event.target.value); }} rows={7} maxLength={8000} placeholder="Users, decision, scale, latency, freshness, harm, and success constraints…" /></label><label>Design notes<textarea value={notes} onChange={(event) => { recordPracticeStart(); setNotes(event.target.value); }} rows={14} maxLength={20000} placeholder="Walk through DECIDE. Keep alternatives and accepted downsides visible…" /></label></div>

      <div className="ml-guidance-toolbar"><div><strong>DECIDE guidance</strong><p>{mode === "timed" && !allGuidanceVisible ? "Hidden during the timed attempt." : `${revealed} of ${guideSections.length} stages visible.`}</p></div>{!allGuidanceVisible ? <button className="button button-secondary" type="button" onClick={revealNext}><Eye size={15} />{mode === "timed" ? "Use one hint" : "Reveal next stage"}</button> : null}</div>

      <div className="ml-guidance-sections">{guideSections.map((section, index) => {
        const visible = index < revealed || allGuidanceVisible;
        const state = !visible ? "hidden" : revealed > 0 && index === revealed - 1 ? "active" : "revealed";
        return <section key={section.key} aria-labelledby={`guide-${section.key}`} data-hidden={!visible || undefined} data-state={state}><header><span>{mlDesignFramework[index].letter}</span><h3 id={`guide-${section.key}`}>{section.title}</h3></header>{visible ? <div>{section.fields.map((field) => {
          const value = problem[field as keyof MlDesignProblem];
          const items = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
          return <section key={field}><h4>{fieldLabels[field]}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
        })}</div> : <p>Complete your own answer before revealing this stage.</p>}</section>;
      })}</div>
    </section>

    <section className="ml-self-review" aria-labelledby="self-review-title"><div><h2 id="self-review-title">Dimension-level self-review</h2><p>Select the description that best matches the evidence in this attempt. No total score is calculated.</p></div><p role="status" aria-live="polite">{reviewCount} of {mlRubric.length} dimensions reviewed.</p><div>{mlRubric.map(([dimension, ...bands]) => <fieldset key={dimension}><legend>{dimension}</legend>{bands.map((copy, index) => <label key={copy}><input type="radio" name={`review-${dimension}`} checked={review[dimension] === mlRubricBands[index]} onChange={() => { recordPracticeStart(); setReview((current) => ({ ...current, [dimension]: mlRubricBands[index] })); }} /><span><strong>{mlRubricBands[index]}</strong>{copy}</span></label>)}</fieldset>)}</div><aside><ShieldCheck size={18} /><p>Attempt text and self-review selections are private working material. This page does not send them to analytics. Refreshing discards them.</p></aside></section>

    <section className="ml-problem-close"><div><h2>Before you call it complete</h2><ul>{problem.interviewChecklist.map((item) => <li key={item}><CheckCircle2 size={16} aria-hidden="true" />{item}</li>)}</ul></div><Link className="button button-secondary" href={ML_DESIGN_PROBLEMS_ROOT}>Choose another dossier</Link></section>
  </>;
}
