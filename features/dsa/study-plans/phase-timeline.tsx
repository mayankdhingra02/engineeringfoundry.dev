import { ArrowRight } from "lucide-react";
import type { StudyPlanPhase } from "@/data/dsa/study-plans";

export function PhaseTimeline({ phases }: { phases: StudyPlanPhase[] }) {
  return <nav className="dsa-plan-timeline" aria-label="Preparation phases"><span>Plan structure</span><ol>{phases.map((phase, index) => <li key={phase.id}><a href={`#phase-${phase.id}`}><small>{String(index + 1).padStart(2, "0")}</small><strong>{phase.title}</strong><span>Week {phase.firstWeek}{phase.lastWeek !== phase.firstWeek ? `–${phase.lastWeek}` : ""}</span></a>{index < phases.length - 1 && <ArrowRight size={13} aria-hidden="true" />}</li>)}</ol></nav>;
}
