import Link from "next/link";
import { ArrowRight, ClipboardCheck, Code2, LayoutGrid, Users } from "lucide-react";
import { PageHero, SectionHeading, StatusPill } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";
import {
  LATER_ROUND_EXECUTION_GUIDES,
  ROUND_EXECUTION_GUIDE_GROUPS,
  getRoundExecutionGuide,
  roundExecutionGuideHref,
  roundExecutionTreatmentLabel,
} from "@/lib/interview-playbook/round-execution-presentation";
import type { RoundExecutionGuideGroupId } from "@/lib/interview-playbook/round-execution-presentation";
import type { RoundExecutionGuideSummary } from "@/lib/interview-playbook/round-execution";

export const metadata = createPageMetadata({
  title: "Software Engineering Interview Round Execution Guides",
  description: "Choose the execution guide for the signal being evaluated—coding, design, behavioral, practical engineering, or project depth—without treating stage labels as competencies.",
  path: "/interview-tips/rounds",
});

const GROUP_ICONS: Readonly<Record<RoundExecutionGuideGroupId, typeof ClipboardCheck>> = {
  "process-assessment": ClipboardCheck,
  "coding-practical": Code2,
  design: LayoutGrid,
  "people-collaboration": Users,
};

/** The catalog is exhaustively tested; a missing slug here is a development error, not a runtime fallback. */
function requireGuide(slug: string): RoundExecutionGuideSummary {
  const guide = getRoundExecutionGuide(slug);
  if (!guide) throw new Error(`Round execution guide catalog is missing an entry for "${slug}".`);
  return guide;
}

const laterGuide = LATER_ROUND_EXECUTION_GUIDES[0];

export default function RoundExecutionGuidesIndexPage() {
  return <>
    <PageHero eyebrow="Round execution guides" title="Prepare for the signal, not just the calendar label." description="A technical screen, onsite, or final stage can contain different evaluations. Start with what the round actually asks you to demonstrate.">
      <Link className="button button-secondary" href="/interview-tips">Back to the execution guide</Link>
      <Link className="button button-secondary" href="/mock-interviews">Open the mock interview lab</Link>
    </PageHero>

    <section className="section"><div className="page-width">
      <SectionHeading eyebrow="Before choosing a guide" title="Separate three questions before choosing a guide" />
      <div className="feature-grid">
        <article className="feature-card">
          <h3>Stage</h3>
          <p>Where the conversation sits in the process—for example, technical screen, loop, or final stage.</p>
        </article>
        <article className="feature-card">
          <h3>Modality</h3>
          <p>How the evaluation is delivered—for example, asynchronous assessment, take-home, live remote, or onsite.</p>
        </article>
        <article className="feature-card">
          <h3>Signal</h3>
          <p>What the candidate must make observable—for example, coding, design, debugging, behavioral evidence, or project depth.</p>
        </article>
      </div>
      <p className="prep-privacy">Execution guides are selected by signal. A stage or modality label alone may still require recruiter clarification.</p>
    </div></section>

    {ROUND_EXECUTION_GUIDE_GROUPS.map((group) => {
      const Icon = GROUP_ICONS[group.id];
      return <section className="section section-alt" key={group.id}><div className="page-width">
        <SectionHeading eyebrow={group.title} title={group.description} />
        <div className="feature-grid">
          {group.slugs.map((slug) => {
            const guide = requireGuide(slug);
            return <Link className="feature-card" href={roundExecutionGuideHref(guide.slug)} key={guide.slug}>
              <div className="feature-card-top"><span className="icon-well"><Icon size={21} aria-hidden="true" /></span><span className="demo-label">{roundExecutionTreatmentLabel(guide.treatment)}</span></div>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <p><small>{guide.quickReference.firstMove}</small></p>
              <span className="card-link">Open quick reference<ArrowRight size={15} aria-hidden="true" /></span>
            </Link>;
          })}
        </div>
      </div></section>;
    })}

    {laterGuide && <section className="section"><div className="page-width">
      <SectionHeading eyebrow="Not yet in v1" title="Role-specific later guide" description="Technical presentations appear in some specialized hiring processes but are not part of the default general-software-engineering v1." />
      <div className="feature-grid">
        <article className="feature-card">
          <div className="feature-card-top"><StatusPill tone="neutral">Later</StatusPill></div>
          <h3>{laterGuide.title}</h3>
          <p>{laterGuide.description}</p>
        </article>
      </div>
    </div></section>}

    <section className="section section-alt"><div className="page-width">
      <p className="prep-privacy">When the signal is unknown, confirm the format with the recruiter instead of guessing from labels such as technical screen, onsite, final, or Bar Raiser.</p>
    </div></section>
  </>;
}
