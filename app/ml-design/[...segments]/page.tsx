import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  MlConceptDirectory,
  MlConceptPage,
  MlDesignDocument,
  MlGlossaryPage,
  MlProblemDirectory,
  MlRubricPage,
  MlSourceList,
} from "@/components/ml-design-document";
import { MlDesignPracticeWorkspace } from "@/components/ml-design-practice-workspace";
import { MlDesignProblemAttemptPanel } from "@/features/ml-design/problem-attempt-panel";
import { getMlDesignConcept, getMlDesignLegacyProblem, getMlDesignProblem } from "@/data/ml-design";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";
import {
  ML_DESIGN_CONCEPTS_ROOT,
  ML_DESIGN_GLOSSARY,
  ML_DESIGN_PRACTICE_ROOT,
  ML_DESIGN_PROBLEMS_ROOT,
  ML_DESIGN_RUBRIC,
  mlDesignConceptHref,
  mlDesignProblemHref,
} from "@/lib/ml-design-routes";
import { buildMlDesignStaticParams } from "@/lib/public-route-inventory";

export const dynamicParams = false;

export function generateStaticParams() {
  return buildMlDesignStaticParams();
}

function pageMetadata(title: string, description: string, path: `/${string}`) {
  return createPageMetadata({ title, description, path });
}

export async function generateMetadata({ params }: { params: Promise<{ segments: string[] }> }): Promise<Metadata> {
  const { segments } = await params;
  if (segments.length === 1) {
    if (segments[0] === "core-concepts") return pageMetadata("ML System Design Core Concepts", "Twenty deep lessons for ML system design interviews, from problem formulation through responsible production operation.", ML_DESIGN_CONCEPTS_ROOT);
    if (segments[0] === "problems") return pageMetadata("ML System Design Problems", "Thirteen canonical ML system design dossiers with task-specific data, architecture, rollout, monitoring, and risk decisions.", ML_DESIGN_PROBLEMS_ROOT);
    if (segments[0] === "practice") return pageMetadata("ML System Design Practice", "Choose guided, untimed, or timed practice across thirteen canonical ML system design dossiers.", ML_DESIGN_PRACTICE_ROOT);
    if (segments[0] === "rubric") return pageMetadata("ML System Design Rubric", "A descriptive, role-aware rubric for reviewing ML system design interview evidence without a readiness score.", ML_DESIGN_RUBRIC);
    if (segments[0] === "glossary") return pageMetadata("ML System Design Glossary", "Precise definitions for twenty commonly hand-waved ML system design terms.", ML_DESIGN_GLOSSARY);
    const legacy = getMlDesignLegacyProblem(segments[0]);
    if (legacy) return pageMetadata(`${legacy.title} ML Design Practice`, legacy.summary, mlDesignProblemHref(legacy.slug));
  }
  if (segments.length === 2 && segments[0] === "core-concepts") {
    const concept = getMlDesignConcept(segments[1]);
    if (!concept) notFound();
    return pageMetadata(`${concept.title} — ML System Design`, concept.learningObjective, mlDesignConceptHref(concept.slug));
  }
  if (segments.length === 2 && segments[0] === "problems") {
    const problem = getMlDesignProblem(segments[1]);
    if (!problem) notFound();
    return pageMetadata(`${problem.title} — ML Design Practice`, problem.summary, mlDesignProblemHref(problem.slug));
  }
  notFound();
}

export default async function MlDesignContentPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  if (segments.length === 1) {
    if (segments[0] === "core-concepts") return <MlConceptDirectory />;
    if (segments[0] === "problems") return <MlProblemDirectory />;
    if (segments[0] === "practice") return <MlProblemDirectory practice />;
    if (segments[0] === "rubric") return <MlRubricPage />;
    if (segments[0] === "glossary") return <MlGlossaryPage />;
    const legacy = getMlDesignLegacyProblem(segments[0]);
    if (legacy) redirect(mlDesignProblemHref(legacy.slug));
  }
  if (segments.length === 2 && segments[0] === "core-concepts") {
    const concept = getMlDesignConcept(segments[1]);
    if (!concept) notFound();
    return <MlConceptPage concept={concept} />;
  }
  if (segments.length === 2 && segments[0] === "problems") {
    const problem = getMlDesignProblem(segments[1]);
    if (!problem) notFound();
    return <MlDesignDocument title={problem.title} description={problem.summary} context={`${problem.family} · ${problem.difficulty}`} reviewed={problem.lastReviewed}><MlDesignPracticeWorkspace problem={problem} accountPlatformAvailable={isAccountPlatformAvailable()} privateAttempts={<Suspense fallback={<p className="ml-attempt-empty">Loading private attempts…</p>}><MlDesignProblemAttemptPanel problemId={problem.slug} problemTitle={problem.title} /></Suspense>} /><MlSourceList sourceIds={problem.sourceIds} /></MlDesignDocument>;
  }
  notFound();
}
