import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { getRoundExecutionGuide, roundExecutionGuideHref } from "@/lib/interview-playbook/round-execution-presentation";
import { buildInterviewRoundStaticParams } from "@/lib/public-route-inventory";
import { RoundExecutionQuickReference } from "@/components/interview-playbook/round-execution-quick-reference";
import { getRoundExecutionDossier } from "@/lib/interview-playbook/round-execution-dossiers";
import { RoundExecutionDossierView } from "@/components/interview-playbook/round-execution-dossier";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return buildInterviewRoundStaticParams();
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getRoundExecutionGuide(slug);
  if (!guide || !guide.v1) return { title: "Interview round execution guide" };
  return createPageMetadata({
    title: `${guide.title} Execution Guide`,
    description: guide.description,
    // roundExecutionGuideHref always returns `/interview-tips/rounds/${slug}`,
    // which is a `/${string}` shape; its own return type stays a plain string
    // per the presentation module's contract.
    path: roundExecutionGuideHref(guide.slug) as `/${string}`,
  });
}

export default async function RoundExecutionGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getRoundExecutionGuide(slug);
  if (!guide || !guide.v1) notFound();
  const dossier = getRoundExecutionDossier(guide.slug);
  return <>
    <RoundExecutionQuickReference guide={guide} />
    {dossier ? <RoundExecutionDossierView guide={guide} dossier={dossier} /> : null}
  </>;
}
