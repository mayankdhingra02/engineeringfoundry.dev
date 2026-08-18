import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FlaskConical, Sigma, TriangleAlert } from "lucide-react";
import { systemDesignPracticeProblemManifest } from "@/data/system-design/manifest";

export function WorkedExample({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="sd-worked-example"><header><FlaskConical size={17} aria-hidden="true" /><span>Worked example</span><h3>{title}</h3></header><div>{children}</div></section>;
}

export function AssumptionBox({ children }: { children: React.ReactNode }) {
  return <aside className="sd-assumptions"><strong>Example assumptions</strong>{children}</aside>;
}

export function FormulaBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <figure className="sd-formula"><figcaption><Sigma size={16} aria-hidden="true" />{title}</figcaption><pre><code>{children}</code></pre></figure>;
}

export function TradeoffTable({ children }: { children: React.ReactNode }) {
  return <div className="sd-table-scroll" role="region" aria-label="Scrollable trade-off comparison">{children}</div>;
}

export function CommonMistakes({ children }: { children: React.ReactNode }) {
  return <section className="sd-mistakes"><header><TriangleAlert size={17} aria-hidden="true" /><strong>Common mistakes</strong></header>{children}</section>;
}

export function InterviewFollowUps({ children }: { children: React.ReactNode }) {
  return <section className="sd-followups"><span>Interviewer follow-ups</span><p>Use these prompts to extend the design. The useful answer is a reasoned change, not a memorized sentence.</p>{children}</section>;
}

export function FailureChecklist() {
  return <section className="sd-failure-checklist"><header><TriangleAlert size={17} aria-hidden="true" /><strong>Failure checklist</strong></header><ul><li>Can it fail or become slow?</li><li>Can requests be duplicated or responses be lost?</li><li>Can data become stale?</li><li>Can this dependency become overloaded?</li><li>What is the fallback?</li><li>What protects the rest of the system?</li><li>How does it recover?</li></ul></section>;
}

export function FailureDeepDive({ failure, impact, detection, mitigation, tradeoff }: { failure: string; impact: string; detection: string; mitigation: string; tradeoff: string }) {
  return <section className="sd-failure-deep-dive"><header><TriangleAlert size={17} aria-hidden="true" /><strong>Failure deep dive</strong></header><dl><div><dt>Failure</dt><dd>{failure}</dd></div><div><dt>Impact</dt><dd>{impact}</dd></div><div><dt>Detection</dt><dd>{detection}</dd></div><div><dt>Mitigation</dt><dd>{mitigation}</dd></div><div><dt>Trade-off</dt><dd>{tradeoff}</dd></div></dl></section>;
}

export function RememberThis({ children }: { children: React.ReactNode }) {
  return <aside className="sd-remember"><CheckCircle2 size={19} aria-hidden="true" /><div><strong>What to remember</strong>{children}</div></aside>;
}

export function PracticeConnections({ ids }: { ids: readonly string[] }) {
  const problems = ids.map((id) => systemDesignPracticeProblemManifest.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <section className="sd-practice-connections"><header><span>Apply the lesson</span><h2 id="practice-problems">Related practice problems</h2><p>Use the manifest-backed prompts below to apply this lesson in a complete design.</p></header><div>{problems.map((problem) => <Link key={problem.id} href={problem.slug}><span><strong>{problem.title}</strong><small>{problem.difficulty} · ~{problem.estimatedMinutes} min</small></span><ArrowRight size={15} aria-hidden="true" /></Link>)}</div></section>;
}

export interface FurtherReadingItem { title: string; publisher: string; url: string }

export function FurtherReading({ items }: { items: readonly FurtherReadingItem[] }) {
  return <section className="sd-further-reading"><header><BookOpen size={17} aria-hidden="true" /><strong>Further reading</strong></header><ul>{items.map((item) => <li key={item.url}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a><span>{item.publisher}</span></li>)}</ul></section>;
}
