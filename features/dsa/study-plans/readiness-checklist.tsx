import Link from "next/link";
import { ArrowRight, Check, FastForward, MinusCircle } from "lucide-react";
import type { StudyPlan } from "@/data/dsa/study-plans";

const readinessItems = ["Recognize common patterns without being told the category", "Explain brute force before optimization", "Derive time and space complexity", "Write clean code without excessive debugging", "Test edge cases verbally", "Communicate while solving", "Recover when the first approach fails"];

export function ReadinessChecklist({ plan }: { plan: StudyPlan }) {
  const interviewPhase = plan.phases.find((phase) => phase.id === "company") ?? plan.phases.find((phase) => phase.id === "simulation")!;
  return <>
    <section className="dsa-plan-alternative"><FastForward size={18} /><div><strong>Already comfortable with the fundamentals?</strong><p>Skip the foundation phase and start with mixed, targeted interview practice.</p></div><a href={`#phase-${interviewPhase.id}`}>Jump to interview practice <ArrowRight size={13} /></a></section>
    <section className="dsa-plan-deprioritized" aria-labelledby="deprioritized-title"><div><MinusCircle size={16} /><h2 id="deprioritized-title">Low priority for this plan</h2></div><ul>{plan.deprioritized.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section className="dsa-plan-readiness" aria-labelledby="readiness-title"><div><span>Interview mode</span><h2 id="readiness-title">Before interviewing, you should be able to:</h2><p>This is an informational readiness check, not saved progress.</p></div><ul>{readinessItems.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul><Link href="/dsa/strategy#communication">Learn how to communicate while coding <ArrowRight size={13} /></Link></section>
  </>;
}
