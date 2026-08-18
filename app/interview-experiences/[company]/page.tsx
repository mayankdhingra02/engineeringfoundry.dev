import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Binary, BrainCircuit, Building2, MessagesSquare, Network, SearchCheck, ShieldCheck } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { companies, getCompany } from "@/data/companies";
import { ExperienceBuilder } from "@/features/interview-experiences/experience-builder";
import { createPageMetadata } from "@/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() { return companies.map((company) => ({ company: company.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ company: string }> }): Promise<Metadata> { const { company } = await params; const item = getCompany(company); if (!item) notFound(); return createPageMetadata({ title: `${item.name} Interview Experience Workspace`, description: `Create a private, browser-only ${item.name} interview reflection. No experiences are published or collected today.`, path: `/interview-experiences/${item.slug}` }); }

const generalPreparation = [
  { icon: Binary, title: "DSA", href: "/dsa", text: "Practice general coding patterns and problem-solving communication." },
  { icon: Network, title: "System Design", href: "/system-design/start-here/introduction", text: "Practice requirements, architecture, tradeoffs, and reliability." },
  { icon: MessagesSquare, title: "Behavioral", href: "/behavioral", text: "Prepare evidence-based stories about decisions and collaboration." },
  { icon: BrainCircuit, title: "ML Design", href: "/ml-design", text: "Practice general data, modeling, serving, and monitoring tradeoffs." },
];

export default async function ExperienceCompanyPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const item = getCompany(company);
  if (!item) notFound();
  return <>
    <AnalyticsEventOnMount event="experience_company_workspace_viewed" properties={{ company_slug: item.slug, source_route: "company_experience_workspace" }} />
    <PageHero eyebrow="Interview experience workspace" title={`Document your ${item.name} experience safely.`} description="Use a private, browser-only builder for process-level context and personal reflection. Nothing is submitted or published." />
    <section className="section section-compact"><div className="page-width"><div className="company-disclaimer"><ShieldCheck size={17} /><p>Engineering Foundry is not affiliated with or endorsed by {item.name}. Any future community experience reflects the contributor&apos;s own account and may become outdated.</p></div></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="Current reviewed experiences" title="No reviewed public interview experiences are published yet." description={`No fabricated ${item.name} entries, counts, question claims, or candidate identities are shown.`} /><div className="experience-company-empty" role="status"><SearchCheck size={23} /><div><strong>Honest empty state</strong><span>A future entry would require authenticated submission, moderation, privacy review, and provenance/status handling.</span></div></div></div></section>
    <section className="section section-alt"><div className="page-width"><ExperienceBuilder initialCompany={item.name} sourceRoute={`company_${item.slug}`} /></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="General preparation" title="Build skills that transfer across interviews." description={`These public tracks are general preparation resources, not claims about ${item.name}'s process or requirements.`} /><div className="experience-prep-grid"><Link href={`/companies/${item.slug}`}><Building2 size={20} /><h2>{item.name} guide</h2><p>Open the neutral company preparation and provenance workspace.</p><span>Open company guide <ArrowRight size={14} /></span></Link>{generalPreparation.map(({ icon: Icon, ...track }) => <Link href={track.href} key={track.title}><Icon size={20} /><h2>{track.title}</h2><p>{track.text}</p><span>Open general track <ArrowRight size={14} /></span></Link>)}</div></div></section>
  </>;
}
