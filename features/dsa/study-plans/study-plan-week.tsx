"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, CircleCheck, ListChecks, MessageSquareText } from "lucide-react";
import { useState } from "react";
import type { StudyPlan, StudyPlanPriority, StudyPlanWeek as StudyPlanWeekType } from "@/data/dsa/study-plans";
import { getStudyPlanPracticeHref, getStudyPlanTopic } from "@/data/dsa/study-plans";

const priorityLabels: Record<StudyPlanPriority, string> = { "must-know": "Must Know", important: "Important", optional: "Optional" };
const difficultyLabels = { "easy-medium": "Mostly Easy → Medium", "mostly-medium": "Mostly Medium", "medium-hard": "Medium + selected Hard" } as const;

function StudyPlanWeek({ week, open, onToggle }: { week: StudyPlanWeekType; open: boolean; onToggle: () => void }) {
  const panelId = `study-plan-week-${week.week}`;
  return <article className={`dsa-plan-week${open ? " open" : ""}`}>
    <h4><button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle}><span>Week {String(week.week).padStart(2, "0")}</span><strong>{week.title}</strong><small>{difficultyLabels[week.difficulty]}</small><ChevronDown size={16} aria-hidden="true" /></button></h4>
    {open && <div id={panelId} className="dsa-plan-week-detail">
      <p className="dsa-plan-week-focus"><strong>Focus</strong>{week.focus}</p>
      <div className="dsa-plan-week-grid">
        <section><h5><BookOpen size={14} />Topics</h5><ul className="dsa-plan-topic-list">{week.topics.map(({ topicId, priority }) => { const topic = getStudyPlanTopic(topicId); if (!topic) return null; const practiceHref = getStudyPlanPracticeHref(topicId, week.difficulty); return <li key={topicId}><div><Link href={`/dsa/roadmap?topic=${topic.id}`}>{topic.title}<ArrowRight size={11} /></Link><span className={`priority ${priority}`}>{priorityLabels[priority]}</span></div>{practiceHref && <Link className="practice" href={practiceHref}><ListChecks size={11} />Practice this topic</Link>}</li>; })}</ul></section>
        <section><h5><MessageSquareText size={14} />Interview focus</h5><ul className="dsa-plan-focus-list">{week.interviewFocus.map((focus) => <li key={focus}>{focus}</li>)}</ul><div className="dsa-plan-checkpoint"><CircleCheck size={14} /><p><strong>Checkpoint</strong>{week.checkpoint}</p></div></section>
      </div>
      <section className="dsa-plan-days"><h5>Suggested daily rhythm</h5><ol>{week.days.map((day) => <li key={day.day}><span>Day {day.day}</span><p>{day.guidance}</p></li>)}</ol></section>
    </div>}
  </article>;
}

export function StudyPlanWeekList({ plan }: { plan: StudyPlan }) {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([1]));
  function toggle(week: number) { setOpenWeeks((current) => { const next = new Set(current); if (next.has(week)) next.delete(week); else next.add(week); return next; }); }
  return <section className="dsa-plan-schedule" aria-labelledby="weekly-plan-title"><div className="dsa-plan-section-heading"><div><span>Week by week</span><h2 id="weekly-plan-title">Your preparation sequence</h2></div><small>Expand a week for topics, practice links, daily guidance, and its readiness checkpoint.</small></div>{plan.phases.map((phase) => <section className="dsa-plan-phase" id={`phase-${phase.id}`} key={phase.id} aria-labelledby={`phase-title-${phase.id}`}><header><span>Weeks {phase.firstWeek}{phase.lastWeek !== phase.firstWeek ? `–${phase.lastWeek}` : ""}</span><div><h3 id={`phase-title-${phase.id}`}>{phase.title}</h3><p>{phase.description}</p></div></header><div>{plan.weeks.filter((week) => week.phaseId === phase.id).map((week) => <StudyPlanWeek key={week.week} week={week} open={openWeeks.has(week.week)} onToggle={() => toggle(week.week)} />)}</div></section>)}</section>;
}
