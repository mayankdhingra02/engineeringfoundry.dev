import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Binary, BookOpen, Building2, MessagesSquare, Network, Quote, ShieldCheck, Users } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading, StatusPill } from "@/components/page-shell";
import { QuestionList } from "@/components/question-list";
import { CompanyGuideV1Workspace, type CompanyGuidePublicExperience } from "@/features/company-guides/company-guide-v1";
import { companies, getCompany } from "@/data/companies";
import { priorityCompanyGuideBySlug } from "@/data/company-guides/v1";
import { questionsForCompany } from "@/data/dsa";
import { createPageMetadata } from "@/lib/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamicParams = false;
export function generateStaticParams() { return companies.map((company) => ({ slug: company.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const company = getCompany(slug); if (!company) notFound();
  if (slug === "amazon") return createPageMetadata({ title: "Amazon SDE Interview Guide 2026 — SDE I, II & III", description: "Prepare for Amazon SDE I, SDE II, and Senior SDE interviews with round breakdowns, coding topics, system design, Leadership Principles, reported questions, and preparation roadmaps.", path: "/companies/amazon" });
  if (slug === "google") return createPageMetadata({ title: "Google Software Engineer Interview Guide 2026 — L3, L4 & L5", description: "Prepare for Google L3, L4, and L5 software engineering interviews with coding patterns, interview-round breakdowns, system design, Googliness & Leadership, reported questions, and preparation roadmaps.", path: "/companies/google" });
  if (slug === "meta") return createPageMetadata({ title: "Meta Software Engineer Interview Guide 2026 — E3, E4 & E5", description: "Prepare for Meta E3, E4, and E5 software engineering interviews with coding questions, system design, behavioral preparation, recent interview experiences, and level-specific roadmaps.", path: "/companies/meta" });
  if (slug === "walmart") return createPageMetadata({ title: "Walmart Software Engineer Interview Guide 2026", description: "Prepare for Walmart Global Tech software engineering interviews with coding questions, LLD, system design, backend fundamentals, recent interview experiences, and level-specific preparation roadmaps.", path: "/companies/walmart" });
  return createPageMetadata({ title: `${company.name} Engineering Interview Preparation Guide`, description: `A neutral ${company.name} preparation hub with general DSA, System Design, behavioral, experience, and future attributed company-specific resources.`, path: `/companies/${company.slug}` });
}

const generalTracks = [
  { icon: Binary, title: "DSA roadmap", text: "Build pattern recognition with a staged public practice path.", href: "/dsa", cta: "Open DSA roadmap" },
  { icon: Network, title: "System Design", text: "Practice scope, architecture, tradeoffs, and operational reasoning.", href: "/system-design/start-here/introduction", cta: "Open System Design" },
  { icon: MessagesSquare, title: "Behavioral preparation", text: "Structure evidence-based stories around decisions, impact, and collaboration.", href: "/behavioral", cta: "Open Behavioral" },
];

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const company = getCompany(slug); if (!company) notFound();
  const interviewGuide = priorityCompanyGuideBySlug[company.slug];
  if (interviewGuide) {
    const supabase = await createSupabaseServerClient();
    const result = supabase ? await supabase.from("interview_experiences").select("id,role_title,role_level,region,interview_date,summary,interview_experience_rounds(round_type,topic_labels)").eq("status", "approved").eq("publication_consent", true).eq("company_name", company.name).order("interview_date", { ascending: false, nullsFirst: false }).limit(6) : { data: [] };
    return <><AnalyticsEventOnMount event="company_page_viewed" properties={{ company_slug: company.slug, company_name: company.name }} /><CompanyGuideV1Workspace guide={interviewGuide} experiences={(result.data ?? []) as unknown as CompanyGuidePublicExperience[]} /></>;
  }
  const associatedQuestions = questionsForCompany(company.slug);
  return <><AnalyticsEventOnMount event="company_page_viewed" properties={{ company_slug: company.slug, company_name: company.name }} />
    <PageHero eyebrow="Company preparation hub" title={`${company.name} engineering interview preparation`} description="A useful starting point for general preparation and a future home for company-specific material that has clear public or moderated community provenance."><StatusPill tone="accent">Curation in progress</StatusPill></PageHero>
    <section className="section section-compact"><div className="page-width"><div className="company-disclaimer"><ShieldCheck size={17} /><p>Engineering Foundry is not affiliated with or endorsed by {company.name}. Company-specific information is included only when it has an attributed public or moderated community source and may change over time.</p></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Overview" title="What this guide aggregates." description="General preparation remains separate from company-specific claims. That boundary keeps this page useful without implying access to private interview data." /><div className="guide-overview-grid"><article><Building2 size={19} /><h3>Neutral guide</h3><p>{company.description}</p></article><article><BookOpen size={19} /><h3>Attributed sources</h3><p>{company.claims.length ? `${company.claims.length} reviewed company claims are currently documented.` : "No company-specific claims are published yet."}</p></article><article><Users size={19} /><h3>Community context</h3><p>Interview-experience submission and moderation remain a later phase; no fabricated counts are shown.</p></article></div></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="DSA practice" title="Company-specific question links." description="A question appears here only when its company association has its own provenance record." />{associatedQuestions.length ? <QuestionList questions={associatedQuestions} /> : <div className="company-empty-state"><Binary size={22} /><div><h3>We haven&apos;t verified enough company-specific question data yet.</h3><p>Use the full DSA roadmap now. Associations will appear only after a public or moderated community source is recorded.</p></div><Link className="button" href="/dsa">Use the DSA roadmap<ArrowRight size={15} /></Link></div>}</div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="General preparation" title="Build the skills that travel across interviews." description="These routes are not presented as company-specific requirements. They are broadly useful engineering interview preparation paths." /><div className="general-track-grid">{generalTracks.map(({ icon: Icon, ...track }) => <Link href={track.href} key={track.title}><Icon size={20} /><h3>{track.title}</h3><p>{track.text}</p><span className="card-link">{track.cta}<ArrowRight size={14} /></span></Link>)}</div></div></section>
    <section className="section"><div className="page-width"><div className="company-path-grid"><article><Quote size={20} /><span className="section-kicker">Interview experiences</span><h2>Private reflection workspace.</h2><p>Document your own process-level context in a session-only builder. No experience is submitted or published.</p><Link className="card-link" href={`/interview-experiences/${company.slug}`}>Open {company.name} interview experience workspace<ArrowRight size={14} /></Link></article><article><Users size={20} /><span className="section-kicker">Referrals</span><h2>Referral request preparation.</h2><p>Use the public toolkit to draft a request locally. This does not indicate that any {company.name} employee participates or that a referral will occur.</p><Link className="card-link" href="/referrals?mode=request">Open the referral toolkit<ArrowRight size={14} /></Link></article></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Sources" title="Company-specific provenance." description="Public sources and reviewed community records used for factual company claims will be listed here." />{company.claims.length ? <ul>{company.claims.map((claim) => <li key={claim.claim}>{claim.claim}</li>)}</ul> : <div className="empty-inline source-empty"><strong>No company-specific sources published yet</strong><span>This page deliberately avoids unsupported process claims and question tags.</span></div>}</div></section>
  </>;
}
