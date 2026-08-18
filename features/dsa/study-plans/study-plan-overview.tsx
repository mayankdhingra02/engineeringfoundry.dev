import Link from "next/link";
import { Braces, CalendarDays, Layers3, Route } from "lucide-react";
import type { StudyPlan } from "@/data/dsa/study-plans";
import { PhaseTimeline } from "./phase-timeline";

export function StudyPlanOverview({ plan }: { plan: StudyPlan }) {
  const topicCount = new Set(plan.weeks.flatMap((week) => week.topics.map((topic) => topic.topicId))).size;
  return <section className="dsa-plan-overview" aria-labelledby="selected-plan-title">
    <div className="dsa-plan-overview-heading"><div><span>Selected preparation plan</span><h2 id="selected-plan-title">{plan.title}</h2><p>{plan.objective}</p></div><div className="dsa-plan-facts" aria-label="Plan structure"><span><CalendarDays size={14} /><strong>{plan.weeks.length}</strong> weeks</span><span><Route size={14} /><strong>{topicCount}</strong> core topics</span><span><Layers3 size={14} /><strong>{plan.phases.length}</strong> phases</span></div></div>
    <div className="dsa-plan-goal"><strong>Goal</strong><p>{plan.goal}</p><div><small>This timeline describes plan structure, not saved progress.</small><Link href="/dsa/languages"><Braces size={12} />Need a syntax refresh?</Link><Link href="/dsa/strategy#interview-flow"><Route size={12} />Review the interview flow</Link></div></div>
    <PhaseTimeline phases={plan.phases} />
  </section>;
}
