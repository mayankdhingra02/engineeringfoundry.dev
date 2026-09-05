import Link from "next/link";
import { ArrowRight, BookOpenCheck, FileSearch, ShieldCheck } from "lucide-react";
import { PageHero, SectionHeading, StatusPill } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";
import { INTERVIEW_PLAYBOOK_SOURCES } from "@/lib/interview-playbook/source-methodology";

export const metadata = createPageMetadata({
  title: "Interview Playbook Source Methodology",
  description: "How Engineering Foundry separates official facts, employer examples, editorial execution guidance, user-confirmed context, and uncertainty.",
  path: "/interview-tips/methodology",
});

const EVIDENCE_LAYERS = [
  { title: "User or recruiter confirmed", body: "The private application record governs the candidate's real schedule, format, tool rules, and process changes." },
  { title: "Official employer", body: "Current employer material may describe an applicable process or preparation expectation. It stays company, role, region, and date scoped." },
  { title: "Candidate reported", body: "Reports can show variation but never become policy, a guaranteed loop, or a hidden rubric." },
  { title: "General source", body: "Assessment, accessibility, and communication sources anchor bounded claims outside any one employer." },
  { title: "Engineering Foundry synthesis", body: "Execution sequences, recovery moves, and examples are labeled coaching frameworks—not universal rules or hiring predictions." },
  { title: "Unknown", body: "Missing or conflicting facts remain visible with a recruiter question and a transferable fallback plan." },
] as const;

export default function InterviewPlaybookMethodologyPage() {
  return <>
    <PageHero eyebrow="Interview Playbook methodology" title="Know which guidance is sourced, scoped, or still unknown." description="Every round guide separates general assessment evidence, employer examples, Engineering Foundry synthesis, and the instructions that govern your actual interview.">
      <Link className="button" href="/interview-tips/rounds">Browse round guides <ArrowRight size={15} aria-hidden="true" /></Link>
      <Link className="button button-secondary" href="/interview-tips">Back to the execution guide</Link>
    </PageHero>

    <section className="section"><div className="page-width">
      <SectionHeading eyebrow="Evidence hierarchy" title="Application truth stays closest to the candidate." description="A general guide cannot override the current invitation, recruiter instruction, accommodation channel, or assessment rule." />
      <div className="feature-grid">
        {EVIDENCE_LAYERS.map((layer, index) => <article className="feature-card" key={layer.title}>
          <div className="feature-card-top"><span className="icon-well">{index === 0 ? <ShieldCheck size={18} aria-hidden="true" /> : index === EVIDENCE_LAYERS.length - 1 ? <FileSearch size={18} aria-hidden="true" /> : <BookOpenCheck size={18} aria-hidden="true" />}</span><StatusPill tone={index === 0 ? "accent" : "neutral"}>{index + 1}</StatusPill></div>
          <h3>{layer.title}</h3>
          <p>{layer.body}</p>
        </article>)}
      </div>
    </div></section>

    <section className="section section-alt"><div className="page-width">
      <SectionHeading eyebrow="Reviewed source set" title="The public ledger behind the Playbook." description="Review dates establish when each page was checked. They do not imply that a source controls every dossier claim." />
      <div className="feature-grid">
        {INTERVIEW_PLAYBOOK_SOURCES.map((source) => <article className="feature-card" key={source.id}>
          <div className="feature-card-top"><StatusPill tone="neutral">Verified {source.verifiedAt}</StatusPill></div>
          <h3>{source.title}</h3>
          <p>{source.publisher} · {source.sourceClass}</p>
          <p>{source.use}</p>
          <a className="card-link" href={source.href} rel="noopener noreferrer" target="_blank">Open source <ArrowRight size={14} aria-hidden="true" /></a>
        </article>)}
      </div>
    </div></section>

    <section className="section"><div className="page-width">
      <SectionHeading eyebrow="Editorial contract" title="What these sources cannot prove." />
      <div className="feature-grid">
        <article className="feature-card"><h3>No hidden bar</h3><p>The Playbook does not infer an employer&apos;s undisclosed scoring rubric, pass threshold, level decision, or offer probability.</p></article>
        <article className="feature-card"><h3>No universal loop</h3><p>Employer examples show that formats vary. Only the candidate&apos;s current confirmed process governs the private plan.</p></article>
        <article className="feature-card"><h3>No live assistance</h3><p>Preparation guidance never grants permission for AI, outside help, repositories, devices, or references during an assessment.</p></article>
      </div>
    </div></section>
  </>;
}
