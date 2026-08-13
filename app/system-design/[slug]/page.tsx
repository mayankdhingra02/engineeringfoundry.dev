import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { EmptyState, PageHero, StatusPill } from "@/components/page-shell";
import { getSystemDesignProblem, systemDesignProblems } from "@/data/fixtures/system-design";
import { createPageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return systemDesignProblems.map((problem) => ({ slug: problem.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = getSystemDesignProblem(slug);
  if (!problem) notFound();
  return createPageMetadata({ title: `${problem.title} System Design`, description: problem.description, path: `/system-design/${problem.slug}` });
}

export default async function SystemPromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = getSystemDesignProblem(slug);
  if (!problem) notFound();

  return <>
    <AnalyticsEventOnMount event="system_design_problem_viewed" properties={{ problem_slug: problem.slug, problem_title: problem.title, status: problem.status }} />
    <PageHero eyebrow="System Design practice" title={problem.title} description={problem.description}><StatusPill tone="accent">Placeholder</StatusPill></PageHero>
    <section className="section"><div className="page-width"><EmptyState title="Practice content coming in the next phase" description="This route is intentionally structural and contains no copied interview content." /><div className="hero-actions"><Link className="button button-secondary" href="/system-design">Back to roadmap</Link></div></div></section>
  </>;
}
