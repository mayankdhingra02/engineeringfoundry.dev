import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { salaryNegotiationModules, salaryNegotiationModulesBySlug } from "@/data/salary-negotiation";
import { SalaryNegotiationModuleView } from "@/features/salary-negotiation/module-view";
import { createPageMetadata } from "@/lib/metadata";
import { buildSalaryNegotiationStaticParams } from "@/lib/public-route-inventory";

export const dynamicParams = false;
export function generateStaticParams() { return buildSalaryNegotiationStaticParams(); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = salaryNegotiationModulesBySlug.get(slug); if (!item) notFound(); return createPageMetadata({ title: `${item.title} — Salary Negotiation`, description: item.summary, path: `/salary-negotiation/${item.slug}` }); }
export default async function SalaryNegotiationModulePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = salaryNegotiationModulesBySlug.get(slug); if (!item || item.status !== "published") notFound(); const index = salaryNegotiationModules.findIndex((candidate) => candidate.slug === slug); return <SalaryNegotiationModuleView module={item} previousSlug={salaryNegotiationModules[index - 1]?.slug} nextSlug={salaryNegotiationModules[index + 1]?.slug} />; }
