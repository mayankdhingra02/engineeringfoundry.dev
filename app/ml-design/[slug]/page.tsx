import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignPracticePage, type PracticeSection } from "@/components/design-practice-page";
import { activeMlDesignProblems, getMlDesignProblem } from "@/data/ml-design";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";
import { mlDesignProblemHref } from "@/lib/ml-design-routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return activeMlDesignProblems.map((problem) => ({ slug: problem.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = getMlDesignProblem(slug);
  if (!problem) notFound();
  return createPageMetadata({
    title: `${problem.title} ML Design Practice`,
    description: `${problem.summary} Work through original product framing, data, modeling, serving, monitoring, and tradeoff guidance.`,
    path: mlDesignProblemHref(problem.slug),
  });
}

export default async function MlDesignProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = getMlDesignProblem(slug);
  if (!problem) notFound();
  const accountPlatformAvailable = isAccountPlatformAvailable();

  const sections: PracticeSection[] = [
    { id: "framing", title: "Reveal product framing guidance", intro: "Start with the decision and baseline, not a model family.", groups: [{ title: "Product goal and constraints", items: problem.productGoal }, { title: "Prediction target", items: problem.predictionTarget }, { title: "Non-ML baseline", items: problem.baseline }] },
    { id: "metrics", title: "Reveal metrics and evaluation guidance", groups: [{ title: "Success and guardrail metrics", items: problem.successMetrics }, { title: "Evaluation plan", items: problem.evaluation }] },
    { id: "data", title: "Reveal data, labels, and features", intro: "Check point-in-time correctness and what feedback is actually observable.", groups: [{ title: "Data sources", items: problem.dataSources }, { title: "Label design", items: problem.labeling }, { title: "Feature considerations", items: problem.features }] },
    { id: "model-training", title: "Reveal modeling and training guidance", intro: "These are design options, not one universally correct model.", groups: [{ title: "Model discussion", items: problem.modelDiscussion }, { title: "Training system", items: problem.training }] },
    { id: "serving-monitoring", title: "Reveal serving and monitoring design", groups: [{ title: "Serving path and fallback", items: problem.serving }, { title: "Production monitoring", items: problem.monitoring }, { title: "Feedback loop", items: problem.feedbackLoop }] },
    { id: "tradeoffs-failures", title: "Reveal tradeoffs and failure modes", intro: "Stress both the ML behavior and the surrounding production system.", tone: "warning", groups: [{ title: "Failure modes", items: problem.failureModes }, { title: "Tradeoffs", items: problem.tradeoffs }] },
    { id: "follow-ups", title: "Reveal interviewer follow-ups", groups: [{ title: "What to discuss next", items: problem.extensions }] },
  ];

  return <DesignPracticePage track="ml" id={problem.id} title={problem.title} summary={problem.summary} prompt={problem.prompt} difficulty={problem.difficulty} domains={problem.domains} sections={sections} checklist={problem.interviewChecklist} accountPlatformAvailable={accountPlatformAvailable} />;
}
