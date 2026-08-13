import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Binary, BookOpen, Building2, MessagesSquare, Network, Quote, ShieldCheck, Users } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading, StatusPill } from "@/components/page-shell";
import { QuestionList } from "@/components/question-list";
import { companies, getCompany } from "@/data/companies";
import { questionsForCompany } from "@/data/dsa";
import { createPageMetadata } from "@/lib/metadata";

export function generateStaticParams() { return companies.map((company) => ({ slug: company.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const company = getCompany(slug); if (!company) notFound(); return createPageMetadata({ title: `${company.name} Engineering Interview Preparation Guide`, description: `A neutral ${company.name} preparation hub with general DSA, System Design, behavioral, experience, and future attributed company-specific resources.`, path: `/companies/${company.slug}` }); }

const generalTracks = [
  { icon: Binary, title: "DSA roadmap", text: "Build pattern recognition with a staged public practice path.", href: "/dsa", cta: "Open DSA roadmap" },
  { icon: Network, title: "System Design", text: "Practice scope, architecture, tradeoffs, and operational reasoning.", href: "/system-design", cta: "Open System Design" },
  { icon: MessagesSquare, title: "Behavioral preparation", text: "Structure evidence-based stories around decisions, impact, and collaboration.", href: "/behavioral", cta: "Open Behavioral" },
];

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const company = getCompany(slug); if (!company) notFound();
  const associatedQuestions = questionsForCompany(company.slug);
  return <><AnalyticsEventOnMount event="company_page_viewed" properties={{ company_slug: company.slug, company_name: company.name }} />
    <PageHero eyebrow="Company preparation hub" title={`${company.name} engineering interview preparation`} description="A useful starting point for general preparation and a future home for company-specific material that has clear public or moderated community provenance."><StatusPill tone="accent">Curation in progress</StatusPill></PageHero>
    <section className="section section-compact"><div className="page-width"><div className="company-disclaimer"><ShieldCheck size={17} /><p>Engineering Foundry is not affiliated with or endorsed by {company.name}. Company-specific information is included only when it has an attributed public or moderated community source and may change over time.</p></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Overview" title="What this guide aggregates." description="General preparation remains separate from company-specific claims. That boundary keeps this page useful without implying access to private interview data." /><div className="guide-overview-grid"><article><Building2 size={19} /><h3>Neutral guide</h3><p>{company.description}</p></article><article><BookOpen size={19} /><h3>Attributed sources</h3><p>{company.claims.length ? `${company.claims.length} reviewed company claims are currently documented.` : "No company-specific claims are published yet."}</p></article><article><Users size={19} /><h3>Community context</h3><p>Interview-experience submission and moderation remain a later phase; no fabricated counts are shown.</p></article></div></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="DSA practice" title="Company-specific question links." description="A question appears here only when its company association has its own provenance record." />{associatedQuestions.length ? <QuestionList questions={associatedQuestions} /> : <div className="company-empty-state"><Binary size={22} /><div><h3>We haven&apos;t verified enough company-specific question data yet.</h3><p>Use the full DSA roadmap now. Associations will appear only after a public or moderated community source is recorded.</p></div><Link className="button" href="/dsa">Use the DSA roadmap<ArrowRight size={15} /></Link></div>}</div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="General preparation" title="Build the skills that travel across interviews." description="These routes are not presented as company-specific requirements. They are broadly useful engineering interview preparation paths." /><div className="general-track-grid">{generalTracks.map(({ icon: Icon, ...track }) => <Link href={track.href} key={track.title}><Icon size={20} /><h3>{track.title}</h3><p>{track.text}</p><span className="card-link">{track.cta}<ArrowRight size={14} /></span></Link>)}</div></div></section>
    <section className="section"><div className="page-width"><div className="company-path-grid"><article><Quote size={20} /><span className="section-kicker">Interview experiences</span><h2>Community context, once moderated.</h2><p>No submissions are claimed yet. The existing architecture is ready for a future reviewed experience flow.</p><Link className="card-link" href={`/interview-experiences/${company.slug}`}>View {company.name} experience state<ArrowRight size={14} /></Link></article><article><Users size={20} /><span className="section-kicker">Referrals</span><h2>Voluntary community connections.</h2><p>Referral workflows remain non-production and never imply endorsement, guarantee, or payment for a referral.</p><Link className="card-link" href="/referrals">Understand the referral model<ArrowRight size={14} /></Link></article></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Sources" title="Company-specific provenance." description="Public sources and reviewed community records used for factual company claims will be listed here." />{company.claims.length ? <ul>{company.claims.map((claim) => <li key={claim.claim}>{claim.claim}</li>)}</ul> : <div className="empty-inline source-empty"><strong>No company-specific sources published yet</strong><span>This page deliberately avoids unsupported process claims and question tags.</span></div>}</div></section>
  </>;
}
