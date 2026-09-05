"use client";

/*
THESIS: Practice mode is a rehearsal contract, not a decorative filter.
OWN-WORLD: The established DSA paper workspace, rust action, green evidence language, and hairline dividers.
STORY: Choose constraints, disclose exposure, rehearse, then record evidence without a readiness score.
FIRST VIEWPORT: Mode, permitted help, timer controls, and the primary start action.
FORM: Operate-mode extension of the question brief. Surface seed: f31e86c0.
*/
import Link from "next/link";
import { Clock3, LockKeyhole, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { dsaPracticeModeDefinitions, type DsaPracticeMode, type DsaPriorExposure } from "@/lib/dsa/practice-attempt";
import { createDsaPracticeAttemptAction } from "./actions";

function formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

function AccessibleTimer({ initialMinutes = 45 }: { initialMinutes?: number }) {
  const [minutes, setMinutes] = useState(initialMinutes); const [remaining, setRemaining] = useState(initialMinutes * 60); const [running, setRunning] = useState(false); const [enabled, setEnabled] = useState(true);
  useEffect(() => { if (!running || !enabled || remaining <= 0) return; const id = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(id); }, [running, enabled, remaining]);
  if (!enabled) return <div className="dsa-mode-timer disabled"><Clock3 size={16} /><p><strong>Timer disabled</strong><span>Continue without a countdown. This accessibility choice does not invalidate practice.</span></p><button type="button" onClick={() => setEnabled(true)}>Enable</button></div>;
  return <div className="dsa-mode-timer"><Clock3 size={16} /><p><strong aria-live="off">{formatTime(remaining)}</strong><span>{running ? "Timer running" : "Timer paused"}</span></p><label>Minutes<input aria-label="Timer duration in minutes" type="number" min={10} max={120} value={minutes} onChange={(event) => { const next = Math.min(120, Math.max(10, Number(event.target.value) || 10)); setMinutes(next); setRemaining(next * 60); }} /></label><button type="button" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={14} /> : <Play size={14} />}{running ? "Pause" : "Start"}</button><button type="button" onClick={() => setRemaining((value) => Math.min(7200, value + 300))}>Extend 5 min</button><button type="button" onClick={() => { setRunning(false); setRemaining(minutes * 60); }}><RotateCcw size={14} />Reset</button><button type="button" onClick={() => { setRunning(false); setEnabled(false); }}>Disable</button></div>;
}

export function PracticeModePanel({ questionId, questionTitle, mode, signedIn, accountPlatformAvailable, defaultExposure }: { questionId: string; questionTitle: string; mode: DsaPracticeMode; signedIn: boolean; accountPlatformAvailable: boolean; defaultExposure: DsaPriorExposure }) {
  const definition = dsaPracticeModeDefinitions.find((item) => item.id === mode) ?? dsaPracticeModeDefinitions[2];
  const action = createDsaPracticeAttemptAction.bind(null, questionId);
  const formId = `dsa-attempt-start-${questionId}`;
  return <section className="dsa-mode-panel" aria-labelledby="dsa-mode-heading"><header><span>Practice mode</span><h2 id="dsa-mode-heading">{definition.label}</h2><p>{definition.description}</p></header><dl><div><dt>Labels</dt><dd>{definition.labelsHidden ? "Hidden until review" : "Visible while learning"}</dd></div><div><dt>Permitted help</dt><dd>{definition.allowedHints}</dd></div><div><dt>Evidence</dt><dd>{definition.evidence}</dd></div></dl>{mode === "timed" && !signedIn && <AccessibleTimer initialMinutes={definition.defaultDuration ?? 45} />}
    {signedIn ? <form id={formId} action={action} className="dsa-attempt-start"><input type="hidden" name="title" value={`${questionTitle} rehearsal`} /><input type="hidden" name="mode" value={mode} />{mode === "timed" ? <label>Duration<input aria-label="Private attempt duration in minutes" name="duration_minutes" type="number" min={10} max={120} defaultValue={definition.defaultDuration ?? 45} /><span>minutes</span></label> : <input type="hidden" name="duration_minutes" value="" />}<label>Prior exposure<select name="prior_exposure" defaultValue={defaultExposure}><option value="unseen">Unseen prompt</option><option value="prompt_seen">Prompt seen</option><option value="solution_seen">Solution reviewed</option><option value="solved_before">Solved before</option></select></label><Link className="dsa-attempt-mode-link" href="/dsa/practice#practice-modes-heading">Choose another mode</Link><button className="button"><LockKeyhole size={15} />Start private attempt</button></form> : <aside className="dsa-mode-local-note"><p><strong>Browser-session rehearsal</strong>Your timer and checklist remain on this page only. Nothing is sent to analytics or stored as performance evidence.</p>{accountPlatformAvailable && <Link href={`/signin?next=${encodeURIComponent(`/dsa/questions/${questionId}?mode=${mode}`)}`}>Sign in for a private durable attempt</Link>}</aside>}
  </section>;
}
