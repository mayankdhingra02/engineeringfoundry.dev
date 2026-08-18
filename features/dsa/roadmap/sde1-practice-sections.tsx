"use client";

import { AlertTriangle, CheckCircle2, ChevronDown, Circle, Clock3, CodeXml, Eye, EyeOff, MessageSquareText, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { DSARoadmap, RoadmapScopePath } from "@/data/dsa/level-roadmaps";
import { resolveRoadmapProblems } from "@/data/dsa/roadmap-problem-registry";
import { track } from "@/lib/analytics";
import { RoadmapProblemRow } from "./roadmap-problem-row";

function MixedPractice({ roadmap, scope, count }: { roadmap: DSARoadmap; scope?: RoadmapScopePath["id"]; count?: number }) {
  const [revealedSets, setRevealedSets] = useState<Set<string>>(new Set());
  function toggleReveal(setId: string) {
    setRevealedSets((current) => {
      const next = new Set(current);
      if (next.has(setId)) next.delete(setId); else next.add(setId);
      return next;
    });
  }
  return <section className="dsa-sde1-practice-block" aria-labelledby="mixed-practice-heading">
    <div className="dsa-level-roadmap-section-heading"><span>Mixed practice</span><h2 id="mixed-practice-heading">Remove the pattern label.</h2><p>Real interviews do not announce the technique. Attempt each set before revealing the recognition cue.</p></div>
    <div className="dsa-sde1-mixed-grid">{roadmap.mixedPracticeSets?.slice(0, count ?? (scope === "short" ? 1 : scope === "standard" ? 3 : undefined)).map((set) => {
      const revealed = revealedSets.has(set.id);
      return <article key={set.id}><div><strong>{set.title}</strong><p>{set.description}</p></div><button type="button" aria-pressed={revealed} onClick={() => { toggleReveal(set.id); if (!revealed) track("mixed_set_started", { level: roadmap.level, set_id: set.id }); }}>{revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}{revealed ? "Hide patterns" : "Reveal patterns"}</button><div className="dsa-sde1-mixed-problems">{resolveRoadmapProblems(set.problemIds, roadmap.problemAssignments).map((problem) => <RoadmapProblemRow key={problem.id} problem={problem} hidePattern={!revealed} />)}</div></article>;
    })}</div>
  </section>;
}

function TimedPractice({ roadmap, count }: { roadmap: DSARoadmap; count?: number }) {
  return <section className="dsa-sde1-practice-block" aria-labelledby="timed-practice-heading">
    <div className="dsa-level-roadmap-section-heading"><span>Timed progression</span><h2 id="timed-practice-heading">Rehearse the whole interview.</h2><p>The timer is not the skill. Practice the sequence from clarification through manual testing and follow-ups.</p></div>
    <div className="dsa-sde1-timed-grid">{roadmap.timedPracticeModes?.slice(0, count).map((mode) => <article key={mode.id}><span><Clock3 size={16} aria-hidden="true" />{mode.duration}</span><h3>{mode.title}</h3><p>{mode.description}</p><ul>{mode.expectations.map((expectation) => <li key={expectation}>{expectation}</li>)}</ul><button type="button" onClick={() => track("timed_practice_started", { level: roadmap.level, mode_id: mode.id })}>Start this format</button></article>)}</div>
  </section>;
}

function ReviewAndReadiness({ roadmap }: { roadmap: DSARoadmap }) {
  const reviewStates = roadmap.level === "sde3plus" ? ["Solved", "Explained invariant", "Discussed alternative", "Completed follow-up", "Review needed"] : ["New", "Learning", "Review", "Comfortable"];
  return <div className="dsa-sde1-review-grid">
    <section aria-labelledby="review-system-heading"><RefreshCw size={20} aria-hidden="true" /><span>Review system</span><h2 id="review-system-heading">Retrieve it again.</h2><div className="dsa-sde1-review-states">{reviewStates.map((state) => <span key={state}>{state}</span>)}</div><ul>{roadmap.reviewGuidance?.map((item) => <li key={item}>{item}</li>)}</ul><p>These states are progress-ready UI only. Account-backed persistence is intentionally deferred.</p></section>
    <section aria-labelledby="readiness-heading"><ShieldCheck size={20} aria-hidden="true" /><span>Competency checkpoint</span><h2 id="readiness-heading">Interview Readiness Check</h2><ul>{roadmap.readinessCriteria?.map((criterion) => <li key={criterion}><CheckCircle2 size={15} aria-hidden="true" />{criterion}</li>)}</ul><p>No pass probability is calculated. Use inconsistent criteria to choose the next rehearsal.</p></section>
  </div>;
}

function SeniorPracticeModes({ roadmap }: { roadmap: DSARoadmap }) {
  if (!roadmap.ambiguousExercises?.length && !roadmap.codeReviewExercises?.length) return null;
  return <section className="dsa-senior-practice" aria-labelledby="senior-practice-heading">
    <div className="dsa-level-roadmap-section-heading"><span>Senior practice modes</span><h2 id="senior-practice-heading">Clarify first. Review before rewriting.</h2><p>These original Foundry exercises test requirement discovery and code judgment without pretending that every interview begins from a polished problem statement.</p></div>
    {!!roadmap.ambiguousExercises?.length && <div className="dsa-senior-practice-group"><div><MessageSquareText size={19} aria-hidden="true" /><span>Ambiguous interview mode</span><h3>Ask before you implement.</h3></div><div>{roadmap.ambiguousExercises.map((exercise) => <article key={exercise.id}><strong>{exercise.title}</strong><p>{exercise.prompt}</p><section><h4>Questions to ask</h4><ul>{exercise.clarifyingQuestions.map((question) => <li key={question}>{question}</li>)}</ul></section><details><summary>Reveal constraints <ChevronDown size={14} aria-hidden="true" /></summary><ul>{exercise.revealedConstraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></details></article>)}</div></div>}
    {!!roadmap.codeReviewExercises?.length && <div className="dsa-senior-practice-group"><div><CodeXml size={19} aria-hidden="true" /><span>Code review mode</span><h3>Find the broken invariant.</h3></div><div>{roadmap.codeReviewExercises.map((exercise) => <article key={exercise.id}><strong>{exercise.title}</strong><p>{exercise.description}</p><pre><code>{exercise.code}</code></pre><section><h4>Review prompts</h4><ul>{exercise.reviewPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul></section><details><summary>Reveal findings <ChevronDown size={14} aria-hidden="true" /></summary><ul>{exercise.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul></details></article>)}</div></div>}
  </section>;
}

export function Sde1PracticeSections({ roadmap, scope, mixedSetCount, timedSessionCount, showLegacyReadiness = false }: { roadmap: DSARoadmap; scope?: RoadmapScopePath["id"]; mixedSetCount?: number; timedSessionCount?: number; showLegacyReadiness?: boolean }) {
  return <div className="dsa-sde1-practice-sections"><MixedPractice roadmap={roadmap} scope={scope} count={mixedSetCount} /><SeniorPracticeModes roadmap={roadmap} /><TimedPractice roadmap={roadmap} count={timedSessionCount} />{showLegacyReadiness && <ReviewAndReadiness roadmap={roadmap} />}</div>;
}

export function OptionalSde1Topics({ roadmap }: { roadmap: DSARoadmap }) {
  return <section className="dsa-sde1-optional" aria-labelledby={`optional-${roadmap.level}-heading`}><div><span>Optional before an {roadmap.shortTitle} interview</span><h2 id={`optional-${roadmap.level}-heading`}>Stretch only when the core is comfortable.</h2><p>These topics do not block roadmap completion. Deferring them does not mean you are behind.</p></div><div>{roadmap.optionalTopics?.map((topic) => <details key={topic.id}><summary><span><strong>{topic.title}</strong><small>{topic.description}</small></span><ChevronDown size={16} aria-hidden="true" /></summary><div>{topic.problemIds?.length ? resolveRoadmapProblems(topic.problemIds, roadmap.problemAssignments).map((problem) => <RoadmapProblemRow key={problem.id} problem={problem} />) : <p>This advanced topic is intentionally nonblocking and has no required problem set.</p>}</div></details>)}</div></section>;
}

export function RoadmapDiagnostic({ roadmap, reviewIds, onToggleReview }: { roadmap: DSARoadmap; reviewIds?: ReadonlySet<string>; onToggleReview?: (problemId: string) => void }) {
  const [internalReview, setInternalReview] = useState<Set<string>>(new Set());
  const activeReview = reviewIds ?? internalReview;
  if (!roadmap.diagnostic) return null;
  return <section className="dsa-roadmap-diagnostic" aria-labelledby="roadmap-diagnostic-heading">
    <div className="dsa-level-roadmap-section-heading"><span>Diagnostic refresh</span><h2 id="roadmap-diagnostic-heading">{roadmap.diagnostic.title}</h2><p>{roadmap.diagnostic.description}</p></div>
    <div className="dsa-roadmap-diagnostic-criteria"><strong>Use these checks</strong>{roadmap.diagnostic.masteryCriteria.map((criterion) => <span key={criterion}><CheckCircle2 size={14} aria-hidden="true" />{criterion}</span>)}</div>
    <div className="dsa-roadmap-diagnostic-list">{resolveRoadmapProblems(roadmap.diagnostic.problemIds, roadmap.problemAssignments).map((problem) => {
      const queued = activeReview.has(problem.id);
      return <div key={problem.id}><RoadmapProblemRow problem={problem} hidePattern status={queued ? "review" : "not-started"} /><button type="button" aria-pressed={queued} onClick={() => { if (onToggleReview) onToggleReview(problem.id); else setInternalReview((current) => { const next = new Set(current); if (next.has(problem.id)) next.delete(problem.id); else next.add(problem.id); return next; }); track("roadmap_problem_marked_review", { level: roadmap.level, problem_id: problem.id, marked: !queued }); }}>{queued ? <CheckCircle2 size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}{queued ? "Review queued" : "Add to review"}</button></div>;
    })}</div>
    <p className="dsa-roadmap-session-note">Diagnostic review marks last only in the current roadmap view and are not saved to an account.</p>
  </section>;
}

export function RoadmapFailureModes({ roadmap }: { roadmap: DSARoadmap }) {
  if (!roadmap.failureModes?.length) return null;
  return <section className="dsa-roadmap-failure-modes" aria-labelledby="failure-modes-heading"><div><AlertTriangle size={20} aria-hidden="true" /><span>SDE II failure modes</span><h2 id="failure-modes-heading">Correct the decision process.</h2></div><div>{roadmap.failureModes.map((failure) => <article key={failure.title}><strong>{failure.title}</strong><p>{failure.description}</p></article>)}</div></section>;
}

export const RoadmapPracticeSections = Sde1PracticeSections;
export const OptionalRoadmapTopics = OptionalSde1Topics;
