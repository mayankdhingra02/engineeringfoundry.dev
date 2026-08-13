import type { Metadata } from "next";
import { companies } from "@/data/fixtures/companies";
import { PageHero, EmptyState } from "@/components/page-shell";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";

export function generateStaticParams() { return companies.map((company) => ({ company: company.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ company: string }> }): Promise<Metadata> { const { company } = await params; const item = companies.find((c) => c.slug === company); if (!item) notFound(); return createPageMetadata({ title: `${item.name} Interview Experiences`, description: `Community-submitted interview experiences for ${item.name}.`, path: `/interview-experiences/${item.slug}` }); }
export default async function ExperienceCompanyPage({ params }: { params: Promise<{ company: string }> }) { const { company } = await params; const item = companies.find((c) => c.slug === company); if (!item) notFound(); return <><PageHero eyebrow="Interview experiences" title={`${item.name} experiences`} description="A future filtered landing page for community submissions with optional anonymous posting." /><section className="section"><div className="page-width"><EmptyState title="No community submissions yet" description="Submission, moderation, and verification flows are intentionally deferred." /></div></section></>; }
