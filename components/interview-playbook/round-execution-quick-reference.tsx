import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/page-shell";
import {
  ROUND_EXECUTION_FRAMEWORK_STEPS,
  TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES,
  getRoundExecutionGuide,
  roundExecutionGuideHref,
  roundExecutionRelatedLinkLabel,
  roundExecutionTreatmentLabel,
} from "@/lib/interview-playbook/round-execution-presentation";
import type { RoundExecutionGuideSummary } from "@/lib/interview-playbook/round-execution";

/**
 * Public, presentation-only quick reference for one v1 execution guide.
 * Renders only what the canonical guide summary already contains — no
 * personalization, no data query, no state. The deeper canonical dossiers
 * (evaluation evidence, seniority/modality modifiers, annotated flows) are a
 * later slice; this is deliberately compact.
 */
export function RoundExecutionQuickReference({ guide }: { guide: RoundExecutionGuideSummary }) {
  return <>
    <PageHero eyebrow="Round execution quick reference" title={guide.title} description={guide.description}>
      <Link className="button button-secondary" href="/interview-tips/rounds">All round guides</Link>
      <Link className="button button-secondary" href="/mock-interviews">Open the mock interview lab</Link>
    </PageHero>

    <section className="section"><div className="page-width">
      <h2>Round at a glance</h2>
      <div className="feature-grid">
        <article className="feature-card">
          <div className="feature-card-top"><span className="demo-label">{roundExecutionTreatmentLabel(guide.treatment)}</span></div>
          <h3>What this guide covers</h3>
          <p>{guide.description}</p>
        </article>
        <article className="feature-card">
          <h3>What this page owns</h3>
          <p>{guide.ownerBoundary}</p>
        </article>
      </div>
      <p className="prep-privacy">This quick reference focuses on execution. The underlying technical or behavioral curriculum remains in its owning Engineering Foundry section.</p>
    </div></section>

    <section className="section section-alt"><div className="page-width">
      <h2>Quick reference</h2>
      <div className="feature-grid">
        <article className="feature-card">
          <h3>First move</h3>
          <p>{guide.quickReference.firstMove}</p>
        </article>
        <article className="feature-card">
          <h3>Before you finish</h3>
          <p>{guide.quickReference.beforeDone}</p>
        </article>
        <article className="feature-card">
          <h3>Biggest trap</h3>
          <p>{guide.quickReference.biggestTrap}</p>
        </article>
      </div>
    </div></section>

    <section className="section"><div className="page-width">
      <h2>Universal execution sequence</h2>
      <p>Orient → Clarify → Structure → Execute → Validate → Close</p>
      <div className="feature-grid">
        {ROUND_EXECUTION_FRAMEWORK_STEPS.map((step, index) => <article className="feature-card" key={step.id}>
          <div className="feature-card-top"><span className="demo-label">{index + 1}</span></div>
          <h3>{step.label}</h3>
          <p>{step.description}</p>
        </article>)}
      </div>
      <p className="prep-privacy">Use this as a flexible sequence, not a mandatory script or universal timer.</p>
    </div></section>

    {guide.slug === "technical-screen" && <section className="section section-alt"><div className="page-width">
      <h2>Resolve the signal before choosing a script</h2>
      <p>Technical screen describes a stage and often a remote modality. It does not reliably identify whether the round will evaluate algorithmic coding, practical coding, debugging, design, behavioral evidence, or project depth.</p>
      <p>Use the recruiter invitation or the interviewer’s opening agenda as the immediate source of truth. When the signal remains unknown, ask once which areas the screen will cover.</p>
      <ul>
        {TECHNICAL_SCREEN_COMMON_SIGNAL_GUIDES.map((slug) => {
          const signalGuide = getRoundExecutionGuide(slug);
          if (!signalGuide) return null;
          return <li key={slug}><Link href={roundExecutionGuideHref(slug)}>{signalGuide.shortTitle}<ArrowRight size={14} aria-hidden="true" /></Link></li>;
        })}
      </ul>
    </div></section>}

    <section className="section"><div className="page-width">
      <h2>Continue preparing</h2>
      <ul>
        {guide.relatedHrefs.map((href) => <li key={href}><Link href={href}>{roundExecutionRelatedLinkLabel(href)}<ArrowRight size={14} aria-hidden="true" /></Link></li>)}
      </ul>
    </div></section>

    <section className="section section-alt"><div className="page-width">
      <p className="prep-privacy">Strong execution behavior makes relevant evidence easier to observe; it is not a pass/fail rubric.</p>
      <p className="prep-privacy">Company-specific differences belong in verified Company Guides and the candidate’s recruiter-provided instructions.</p>
      <p className="prep-privacy">These pages do not reproduce proprietary questions or provide live-assessment assistance.</p>
    </div></section>
  </>;
}
