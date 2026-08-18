"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, RotateCcw } from "lucide-react";
import type { SystemDesignStudyItemStatus, SystemDesignStudyPlan } from "@/data/system-design/study-plan";
import { cn } from "@/lib/utils";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

const statusLabels: Record<SystemDesignStudyItemStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
};

export function SystemDesignStudyPlanView({
  plan,
  planContext,
  isDefaultPlan,
  onStatusChange,
  onMissedDay,
  onAdjustPlan,
}: {
  plan: SystemDesignStudyPlan;
  planContext: string;
  isDefaultPlan: boolean;
  onStatusChange: (itemId: string, status: SystemDesignStudyItemStatus) => void;
  onMissedDay: (day: number) => void;
  onAdjustPlan: () => void;
}) {
  const continueTarget = plan.nextItem?.href;
  const continueAction = <>{plan.nextItem?.type === "review" ? "Review" : "Continue"}<ArrowRight size={14} /></>;

  return <div className="sd-study-plan">
    <section className="sd-study-overview" aria-label="Study plan progress">
      <div><span>{plan.title}</span><h3>{planContext}</h3><p>Day {plan.currentDay} of {plan.dayCount} · {plan.completedItems} / {plan.totalItems} tasks completed · {plan.percentComplete}% complete</p></div>
      <div className="sd-study-overview-time"><Clock3 size={15} /><span><strong>{formatDuration(plan.remainingMinutes)}</strong> remaining</span></div>
      <div className="sd-study-progress" aria-label={`${plan.percentComplete}% complete`}><span style={{ width: `${plan.percentComplete}%` }} /></div>
      <button type="button" onClick={onAdjustPlan}>Adjust plan</button>
      {isDefaultPlan && <button type="button" className="button button-secondary" onClick={onAdjustPlan}>Personalize plan</button>}
    </section>

    {plan.nextItem && <section className="sd-study-continue">
      <div><span>Continue studying</span><h3>Next: {plan.nextItem.title}</h3><p>{plan.nextItem.estimatedMinutes} min · Day {plan.nextItem.day}</p></div>
      {continueTarget ? <Link className="button" href={continueTarget}>{continueAction}</Link> : <a className="button" href={`#sd-study-day-${plan.nextItem.day}`}>{continueAction}</a>}
    </section>}

    <div className="sd-study-toolbar">
      <p>Tasks stay in their original order when you update progress. Completed work is preserved when you adjust the plan.</p>
      {plan.currentDay < plan.dayCount && !plan.days[plan.currentDay - 1]?.missed && <button type="button" onClick={() => onMissedDay(plan.currentDay)}><RotateCcw size={13} />I missed a day</button>}
    </div>

    <div className="sd-study-days">
      {plan.days.map((day) => <section className={cn("sd-study-day", day.day === plan.currentDay && "current", day.missed && "missed")} id={`sd-study-day-${day.day}`} key={day.day}>
        <header><div><span>Day {day.day}</span><h3>{day.title}</h3></div><small>{formatDuration(day.totalMinutes)} / {formatDuration(plan.minutesPerDay)}{day.missed ? " · Rescheduled where possible" : ""}</small></header>
        {day.items.length ? <ul>{day.items.map((item) => <li className={cn(item.status, item.type)} key={item.id}>
          <span className="sd-study-item-mark" aria-hidden="true">{item.status === "completed" ? <Check size={12} /> : item.phase.slice(0, 1)}</span>
          <div>{item.href ? <Link href={item.href}>{item.title}</Link> : <strong>{item.title}</strong>}<small>{item.phase} · {item.estimatedMinutes} min · {item.reason}</small></div>
          <label><span className="sr-only">Status for {item.title}</span><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value as SystemDesignStudyItemStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </li>)}</ul> : <p className="sd-study-rest">No unfinished work needs to be carried on this day.</p>}
      </section>)}
    </div>

    <section className="sd-study-checklist">
      <div><span>Final refresher</span><h3>System Design interview checklist</h3><p>Use this before any practice simulation or real interview.</p></div>
      <ul>{plan.checklist.map((item) => <li key={item}><Check size={13} />{item}</li>)}</ul>
    </section>
  </div>;
}
