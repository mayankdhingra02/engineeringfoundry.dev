import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Binary, BrainCircuit, Building2, MessagesSquare, Network, ShieldCheck } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { getCompany } from "@/data/companies";
import { ExperienceBuilder } from "@/features/interview-experiences/experience-builder";
import { ExperienceDirectory, type PublicExperience } from "@/features/interview-experiences/experience-directory";
import { createPageMetadata } from "@/lib/metadata";
import { buildInterviewExperienceStaticParams } from "@/lib/public-route-inventory";
import { listPublicInterviewExperiences } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export function generateStaticParams() { return buildInterviewExperienceStaticParams(); }
export async function generateMetadata({ params }: { params: Promise<{ company: string }> }): Promise<Metadata> { const { company } = await params; const item = getCompany(company); if (!item) notFound(); return createPageMetadata({ title: `${item.name} Interview Experiences`, description: `Browse reviewed ${item.name} interview reports and create a private browser-only reflection.`, path: `/interview-experiences/${item.slug}` }); }

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
  const publicResult = await listPublicInterviewExperiences({ companyName: item.name });
  const experiences = publicResult.data as unknown as PublicExperience[];
  return <>
    <AnalyticsEventOnMount event="experience_company_workspace_viewed" properties={{ company_slug: item.slug, source_route: "company_experience_workspace" }} />
    <PageHero eyebrow="Interview experiences" title={`${item.name} reports and private reflection.`} description="Browse reviewed high-level reports, then use the browser-only builder for personal reflection. The builder does not submit or publish your notes." />
    <section className="section section-compact"><div className="page-width"><div className="company-disclaimer"><ShieldCheck size={17} /><p>Engineering Foundry is not affiliated with or endorsed by {item.name}. Each contributor report reflects the contributor&apos;s own account and may become outdated.</p></div></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="Current reviewed experiences" title={`Reviewed ${item.name} contributor reports.`} description="Only approved reports with publication consent appear here. No fabricated entries, counts, exact questions, interviewer identities, or private candidate identities are shown; a contributor may explicitly choose to show their public Engineering Foundry username." /><ExperienceDirectory availability={publicResult.availability} experiences={experiences} fixedCompany initialCompany={item.name} key={item.slug} /></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Private reflection" title={`Document your ${item.name} experience safely.`} description="This browser-only builder is separate from public reports. Nothing you write here is submitted or published." /><ExperienceBuilder initialCompany={item.name} sourceRoute={`company_${item.slug}`} /></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="General preparation" title="Build skills that transfer across interviews." description={`These public tracks are general preparation resources, not claims about ${item.name}'s process or requirements.`} /><div className="experience-prep-grid"><Link href={`/companies/${item.slug}`}><Building2 size={20} /><h2>{item.name} guide</h2><p>Open the neutral company preparation and provenance workspace.</p><span>Open company guide <ArrowRight size={14} /></span></Link>{generalPreparation.map(({ icon: Icon, ...track }) => <Link href={track.href} key={track.title}><Icon size={20} /><h2>{track.title}</h2><p>{track.text}</p><span>Open general track <ArrowRight size={14} /></span></Link>)}</div></div></section>
  </>;
}
