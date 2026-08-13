import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { companies } from "@/data/fixtures/companies";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Company Interview Guides", description: "Company-specific engineering interview guide architecture and preparation paths.", path: "/companies" });
export default function CompaniesPage() { return <><PageHero eyebrow="Company guides" title="Understand the shape of the interview." description="Company-specific preparation shells for interview stages, question categories, experiences, resources, and community referral activity." /><section className="section"><div className="page-width"><SectionHeading eyebrow="Demo companies" title="Six guide foundations." description="These pages contain structural placeholders only and do not imply partnerships or inside information." /><div className="company-grid">{companies.map((company) => <Link className="company-card" href={`/companies/${company.slug}`} key={company.slug}><span className="company-initial">{company.name[0]}</span><h2>{company.name}</h2><p>{company.description}</p><span className="card-link">Open guide <ArrowRight size={15} /></span></Link>)}</div></div></section></>; }
