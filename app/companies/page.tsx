import Link from "next/link";
import { ArrowRight, BookOpenCheck, DatabaseZap, ShieldCheck } from "lucide-react";
import { PageHero, SectionHeading, StatusPill } from "@/components/page-shell";
import { companies } from "@/data/companies";
import { questionsForCompany } from "@/data/dsa";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Engineering Interview Company Guides", description: "Neutral company preparation hubs that separate general interview practice from attributed, reviewed company-specific material.", path: "/companies" });

export default function CompaniesPage() {
  return <><PageHero eyebrow="Company preparation" title="Prepare in context—without invented claims." description="Ten priority guides connect canonical preparation with source-aware company context, moderated interview experiences, and honest evidence limits." />
    <section className="section section-compact"><div className="page-width"><div className="company-principles"><span><ShieldCheck size={16} />No proprietary question banks</span><span><DatabaseZap size={16} />Every company association needs provenance</span><span><BookOpenCheck size={16} />General preparation stays useful while curation continues</span></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Available guides" title="Ten priority company preparation guides." description="Source-aware guides separate official material, contributor reports, and preparation recommendations. Question datasets remain curated rather than predicted." /><div className="company-grid">{companies.map((company) => {
      const associated = questionsForCompany(company.slug);
      return <Link className="company-card company-guide-card" href={`/companies/${company.slug}`} key={company.slug}><div className="company-card-top"><span className="company-initial">{company.name.slice(0, 2).toUpperCase()}</span><StatusPill tone="accent">Guide available</StatusPill></div><h2>{company.name}</h2><p>{company.description}</p><div className="company-dataset-state">{associated.length ? <><strong>{associated.length}</strong><span>sourced practice links</span></> : <><strong>Question dataset</strong><span>being curated</span></>}</div><span className="card-link">Open preparation hub <ArrowRight size={15} /></span></Link>;
    })}</div></div></section>
  </>;
}
