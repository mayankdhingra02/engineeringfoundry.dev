import Link from "next/link";
import { hasCompanyGuide } from "@/lib/applications/options";
import type { WorkspaceQuestion } from "@/lib/behavioral/catalog";

const LEVEL_OVERLAYS = [
  ["Entry", "Clear ownership, concrete actions, learning, teamwork, and basic reflection."],
  ["Mid", "Independent judgment, trade-offs, broader collaboration, and factual outcomes where available."],
  ["Senior", "Ambiguity, influence, cross-team work, sound judgment, recovery, and leadership beyond authority."],
  ["Staff+", "Organizational leverage, multi-team influence, strategic ambiguity, durable mechanisms, and second-order consequences."],
] as const;

export function BehavioralQuestionGuidance({ question, companySlug }: { question: WorkspaceQuestion; companySlug?: string | null }) {
  const companyGuideAvailable = hasCompanyGuide(companySlug ?? null);
  return <section className="behavioral-question-guidance" aria-label="Question preparation outline">
    <details open><summary>Suggested framing</summary><div className="behavioral-framework-lenses"><p>Choose the shortest structure that makes your evidence clear. Your source story stays factual regardless of the lens.</p><dl><div><dt>STAR</dt><dd>Situation, Task, Action, Result</dd></div><div><dt>CAR</dt><dd>Challenge, Action, Result</dd></div><div><dt>SOAR</dt><dd>Situation, Obstacle, Action, Result</dd></div></dl></div></details>
    <details><summary>Level context</summary><div className="behavioral-level-overlays">{LEVEL_OVERLAYS.map(([level, guidance]) => <div key={level}><strong>{level}</strong><span>{guidance}</span></div>)}</div></details>
    {companyGuideAvailable && companySlug && <details><summary>Company context</summary><p>Use company guidance to select truthful evidence—not to imitate a culture fit. <Link href={`/companies/${companySlug}`}>Open the source-aware company guide</Link>.</p></details>}
    {question.curated && <details><summary>Follow-up preparation</summary><p>Expect questions about ownership, alternatives, evidence, and what happened after the initial result.</p><ul>{question.curated.followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}</ul></details>}
  </section>;
}

export function AnswerPresentationGuidance() {
  return <details className="behavioral-presentation-guidance"><summary>Rehearsal presentations</summary><div><p><strong>Concise</strong> is roughly 45–90 seconds: context, your action, and outcome. <strong>Standard</strong> is roughly 90–180 seconds: add the key decision, trade-off, and reflection.</p><p>These are two ways to present the same saved story and framing—not two factual answers. There is no timer or generated script here.</p></div></details>;
}
