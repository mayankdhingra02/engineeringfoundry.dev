"use client";

import type { StudyPlanDuration, StudyPlanLevel } from "@/data/dsa/study-plans";
import { studyPlanDurations, studyPlanLevels } from "@/data/dsa/study-plans";

export function StudyPlanSelector({ level, duration, onLevelChange, onDurationChange }: {
  level?: StudyPlanLevel;
  duration?: StudyPlanDuration;
  onLevelChange: (level: StudyPlanLevel) => void;
  onDurationChange: (duration: StudyPlanDuration) => void;
}) {
  return <section className="dsa-plan-selector" aria-label="Study plan configuration">
    <header><h2>Build your study plan</h2><p>Choose the role first. Your 30-, 60-, or 90-day window then changes the pace and breadth of that roadmap.</p></header>
    <fieldset><legend>Target level</legend><div className="dsa-plan-segments role">{studyPlanLevels.map((option) => <button type="button" key={option.value} className={level === option.value ? "selected" : undefined} aria-pressed={level === option.value} onClick={() => onLevelChange(option.value)}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div></fieldset>
    <fieldset><legend>Preparation time</legend><div className="dsa-plan-segments duration">{studyPlanDurations.map((option) => <button type="button" key={option.value} className={duration === option.value ? "selected" : undefined} aria-pressed={duration === option.value} onClick={() => onDurationChange(option.value)}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div></fieldset>
  </section>;
}
