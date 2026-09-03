import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero, StatusPill } from "@/components/page-shell";
import { ChallengeWorkspace } from "@/features/challenges/challenge-workspace";
import { getChallenge, getChallengeRubric } from "@/data/challenges";
import { createPageMetadata } from "@/lib/metadata";
import { buildChallengeStaticParams } from "@/lib/public-route-inventory";

export const dynamicParams = false;

export function generateStaticParams() {
  return buildChallengeStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return {};
  return createPageMetadata({ title: `${challenge.title} Engineering Challenge`, description: `${challenge.summary} Original, self-guided ${challenge.category} practice with qualitative review and a session-only worksheet.`, path: `/challenges/${challenge.slug}` });
}

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();
  const rubric = getChallengeRubric(challenge.rubric_id);
  if (!rubric) notFound();

  return <>
    <PageHero eyebrow={`${challenge.category} · Engineering Foundry challenge level: ${challenge.level}`} title={challenge.title} description={challenge.summary}>
      <Link className="button button-secondary" href="/challenges"><ArrowLeft size={15} />All challenges</Link>
      <span className="hero-inline-note"><Clock3 size={15} />Suggested practice time: {challenge.suggested_minutes} minutes</span>
    </PageHero>
    <section className="section"><div className="page-width"><div className="challenge-brief-grid">
      <article className="challenge-prompt"><span className="section-kicker">Original prompt</span><h2>What you are building</h2><p>{challenge.prompt}</p><div><StatusPill tone="accent">Engineering Foundry original</StatusPill><span>No company association</span></div></article>
      <aside><span className="section-kicker">Scenario context</span><ul>{challenge.context.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul></aside>
    </div>
    <div className="challenge-spec-grid">
      <article><span>01</span><h2>Deliverables</h2><ul>{challenge.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article><span>02</span><h2>Constraints</h2><ul>{challenge.constraints.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article><span>03</span><h2>Success criteria</h2><ul>{challenge.success_criteria.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article><span>04</span><h2>Suggested workflow</h2><ol>{challenge.workflow.map((item) => <li key={item}>{item}</li>)}</ol></article>
    </div></div></section>
    <ChallengeWorkspace challenge={challenge} rubric={rubric} />
  </>;
}
