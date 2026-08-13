import type { Metadata } from "next";
import { companies } from "@/data/fixtures/companies";
import { PageHero, EmptyState } from "@/components/page-shell";

export function generateStaticParams() { return companies.map((company) => ({ company: company.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ company: string }> }): Promise<Metadata> { const { company } = await params; const item = companies.find((c) => c.slug === company); return { title: `${item?.name ?? company} Interview Experiences`, description: `Community-submitted interview experiences for ${item?.name ?? company}.` }; }
export default async function ExperienceCompanyPage({ params }: { params: Promise<{ company: string }> }) { const { company } = await params; const item = companies.find((c) => c.slug === company); return <><PageHero eyebrow="Interview experiences" title={`${item?.name ?? company} experiences`} description="A future filtered landing page for community submissions with optional anonymous posting." /><section className="section"><div className="page-width"><EmptyState title="No community submissions yet" description="Submission, moderation, and verification flows are intentionally deferred." /></div></section></>; }
