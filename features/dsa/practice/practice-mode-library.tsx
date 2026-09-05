import Link from "next/link";
import { ArrowRight, Braces, Clock3, EyeOff, Layers3, RotateCcw, Wrench } from "lucide-react";
import type { DsaProgressMap } from "@/lib/dsa/progress";
import { buildMixedPracticeSet, dsaPracticeModeDefinitions, dsaRubricGroups, dsaRubricDimensions, type DsaPriorExposure } from "@/lib/dsa/practice-attempt";
import type { DsaPracticeAttemptSummary } from "@/lib/dsa/practice-attempt-query";

const icons = { learn: Braces, recognition: EyeOff, untimed: Wrench, timed: Clock3, mixed: Layers3, review: RotateCcw } as const;

export function PracticeModeLibrary({ progress, attempts, signedIn }: { progress: DsaProgressMap; attempts: readonly DsaPracticeAttemptSummary[]; signedIn: boolean }) {
  const exposure: Record<string, DsaPriorExposure> = {};
  for (const row of Object.values(progress)) if (row.status !== "not_started") exposure[row.question_id] = row.status === "solved" ? "solved_before" : "prompt_seen";
  for (const attempt of attempts) exposure[attempt.question_id] = attempt.prior_exposure === "unseen" ? "prompt_seen" : attempt.prior_exposure;
  const mixed = buildMixedPracticeSet(exposure);
  const next = mixed[0];
  return <>
    <section className="dsa-mode-library" aria-labelledby="practice-modes-heading"><header><span>Choose the evidence you need</span><h2 id="practice-modes-heading">Six ways to practice</h2><p>Modes change what is visible, what help is allowed, and what the resulting self-report can honestly support.</p></header><div>{dsaPracticeModeDefinitions.map((mode) => { const Icon = icons[mode.id]; const anonymousReview = mode.id === "review" && !signedIn; const href = mode.id === "learn" ? "/dsa/patterns" : mode.id === "review" ? signedIn ? "/dsa/questions?progress=review&mode=review" : "/dsa/questions?mode=review" : mode.id === "mixed" && next ? `/dsa/questions/${next.id}?mode=mixed` : `/dsa/questions?mode=${mode.id}`; return <article key={mode.id}><Icon size={17} /><span>{mode.id === "timed" ? "Adjustable timer" : mode.labelsHidden ? "Labels hidden" : "Guidance visible"}</span><h3>{anonymousReview ? "Review practice" : mode.label}</h3><p>{anonymousReview ? "Choose a question you have worked before. Sign in to build a queue from errors, time, confidence, and retrieval history." : mode.description}</p><small>{anonymousReview ? "Browser-session review — no saved queue" : mode.evidence}</small><Link href={href}>{anonymousReview ? "Choose a question" : "Open mode"}<ArrowRight size={14} /></Link></article>; })}</div></section>
    <section className="dsa-mixed-set" aria-labelledby="mixed-set-heading"><header><div><span>Deterministic transfer set</span><h2 id="mixed-set-heading">Three different pattern families</h2></div><p>Unseen questions are selected first; familiar questions remain labeled by your recorded exposure. Refreshing does not reshuffle the set.</p></header><ol>{mixed.map((question, index) => <li key={question.id}><span>0{index + 1}</span><div><strong>Problem {index + 1}</strong><small>{exposure[question.id] ?? "unseen"} · pattern hidden</small></div><Link href={`/dsa/questions/${question.id}?mode=mixed`}>Begin<ArrowRight size={13} /></Link></li>)}</ol></section>
    <section className="dsa-rubric-overview" aria-labelledby="dsa-rubric-heading"><header><span>Self-review, not a score</span><h2 id="dsa-rubric-heading">12 dimensions · 4 review groups</h2><p>Rate each dimension independently as needs evidence, developing, or strong. There is no total, percentage, or pass probability.</p></header><div>{dsaRubricGroups.map((group) => <article key={group.id}><h3>{group.label}</h3><ul>{group.dimensionIds.map((id) => { const dimension = dsaRubricDimensions.find(([candidate]) => candidate === id); return <li key={id}><strong>{dimension?.[1]}</strong><span>{dimension?.[2]}</span></li>; })}</ul></article>)}</div></section>
  </>;
}
