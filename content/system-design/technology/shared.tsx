import { FurtherReading, PracticeConnections, RememberThis } from "@/components/system-design-article";
import { LessonCallout } from "@/components/system-design-lesson";
import { technologySources } from "./sources";

export function ConceptFirst({ need, technology }: { need: string; technology: string }) {
  return <LessonCallout variant="interview-tip" title="Concept first, technology second"><p>Lead with “I need {need}.” Then introduce <strong>{technology}</strong> as one implementation worth evaluating. The requirement—not the product name—is the design decision.</p></LessonCallout>;
}

export function TechnologyLessonEnd({ id, practice, children }: { id: string; practice: readonly string[]; children: React.ReactNode }) {
  return <><PracticeConnections ids={practice} /><FurtherReading items={technologySources[id] ?? []} /><RememberThis><p>{children}</p></RememberThis></>;
}
