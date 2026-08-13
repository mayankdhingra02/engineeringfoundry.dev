import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignPracticePage, type PracticeSection } from "@/components/design-practice-page";
import { activeSystemDesignProblems, getSystemDesignProblem } from "@/data/system-design";
import { createPageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return activeSystemDesignProblems.map((problem) => ({ slug: problem.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = getSystemDesignProblem(slug);
  if (!problem) notFound();
  return createPageMetadata({
    title: `${problem.title} System Design Practice`,
    description: `${problem.summary} Work through an original Engineering Foundry prompt, tradeoffs, failure modes, and checklist.`,
    path: `/system-design/${problem.slug}`,
  });
}

export default async function SystemDesignProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = getSystemDesignProblem(slug);
  if (!problem) notFound();

  const sections: PracticeSection[] = [
    { id: "clarification", title: "Reveal clarification guidance", intro: "Check whether your scope and invariants are explicit.", groups: [{ title: "Questions worth asking", items: problem.clarifyingQuestions }] },
    { id: "requirements", title: "Reveal requirement boundaries", intro: "Separate product behavior from system qualities.", groups: [{ title: "Functional requirements", items: problem.functionalRequirements }, { title: "Non-functional requirements", items: problem.nonFunctionalRequirements }] },
    { id: "scale", title: "Reveal scale and capacity reasoning", intro: "These are hypothetical interview assumptions, never production claims.", groups: [{ title: "Example interview assumptions", items: problem.scaleAssumptions }, { title: "How to reason from them", items: problem.capacityDiscussion }] },
    { id: "architecture", title: "Reveal one reasonable architecture starting point", intro: "Use these building blocks as options, not a mandatory answer.", groups: [{ title: "Core components", items: [], components: problem.coreComponents }] },
    { id: "data-interfaces", title: "Reveal data and interface considerations", groups: [{ title: "Data and storage notes", items: problem.dataModelNotes }, { title: "Interface notes", items: problem.apiNotes }] },
    { id: "tradeoffs-failures", title: "Reveal tradeoffs and failure modes", intro: "Challenge the design under partial failure and overload.", tone: "warning", groups: [{ title: "Key tradeoffs", items: problem.keyTradeoffs }, { title: "Failure modes", items: problem.failureModes }] },
    { id: "follow-ups", title: "Reveal interviewer follow-ups", groups: [{ title: "What to discuss next", items: problem.extensions }] },
  ];

  return <DesignPracticePage track="system" id={problem.id} title={problem.title} summary={problem.summary} prompt={problem.prompt} difficulty={problem.difficulty} domains={problem.domains} patterns={problem.patterns} sections={sections} checklist={problem.interviewChecklist} />;
}
