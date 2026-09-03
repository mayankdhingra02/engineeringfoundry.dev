import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lowLevelDesignPracticeBySlug } from "@/data/low-level-design";
import { LowLevelDesignPracticeView } from "@/features/low-level-design/practice-view";
import { createPageMetadata } from "@/lib/metadata";
import { buildLowLevelDesignPracticeStaticParams } from "@/lib/public-route-inventory";

export const dynamicParams = false;
export function generateStaticParams() { return buildLowLevelDesignPracticeStaticParams(); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const problem = lowLevelDesignPracticeBySlug.get(slug); if (!problem) notFound(); return createPageMetadata({ title: `${problem.title} — LLD Practice`, description: problem.summary, path: `/low-level-design/practice/${problem.slug}` }); }
export default async function LowLevelDesignPracticePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const problem = lowLevelDesignPracticeBySlug.get(slug); if (!problem || problem.status !== "published") notFound(); return <LowLevelDesignPracticeView problem={problem} />; }
