"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { BookOpenCheck, Building2, MousePointerClick } from "lucide-react";
import { getDsaStudyPlan, type StudyPlanDuration, type StudyPlanLevel } from "@/data/dsa/study-plans";
import { ReadinessChecklist } from "./readiness-checklist";
import { StudyPlanOverview } from "./study-plan-overview";
import { StudyPlanSelector } from "./study-plan-selector";
import { StudyPlanWeekList } from "./study-plan-week";
import { SaveStudyPlanControl } from "@/components/save-study-plan-control";

const validLevels = new Set<StudyPlanLevel>(["sde1", "sde2", "senior"]);
const validDurations = new Set<StudyPlanDuration>([30, 60, 90]);

export function StudyPlanPage({ accountPlatformAvailable }: { accountPlatformAvailable: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const requestedLevel = searchParams.get("level") as StudyPlanLevel | null;
  const requestedDuration = Number(searchParams.get("duration"));
  const level = requestedLevel && validLevels.has(requestedLevel) ? requestedLevel : undefined;
  const duration = validDurations.has(requestedDuration as StudyPlanDuration) ? requestedDuration as StudyPlanDuration : undefined;
  const plan = getDsaStudyPlan(level ?? null, duration ?? null);
  const company = searchParams.get("company");

  function updateSelection(key: "level" | "duration", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  return <div className="dsa-study-plan-page">
    <StudyPlanSelector level={level} duration={duration} onLevelChange={(value) => updateSelection("level", value)} onDurationChange={(value) => updateSelection("duration", String(value))} />
    {company && <div className="dsa-plan-company-context"><Building2 size={14} /><span>Company context <strong>{company}</strong> is preserved in this link. Scheduling remains role- and duration-based until verified company-specific plan data is available.</span></div>}
    {plan ? <div className="dsa-plan-result"><StudyPlanOverview plan={plan} /><SaveStudyPlanControl input={{ track: "dsa", level: plan.level, duration: plan.duration }} href={`/dsa/study-plans?level=${plan.level}&duration=${plan.duration}`} label={`${plan.duration}-day DSA study plan`} accountPlatformAvailable={accountPlatformAvailable} /><StudyPlanWeekList key={`${plan.level}-${plan.duration}`} plan={plan} /><ReadinessChecklist plan={plan} /></div> : <section className="dsa-plan-empty" aria-live="polite"><MousePointerClick size={20} /><div><strong>{level || duration ? "Choose the remaining option" : "Choose a target level and preparation time"}</strong><p>Your complete weekly plan will appear here immediately. No account or saved progress is required.</p></div><span><BookOpenCheck size={14} />Guidance only · nothing is marked complete</span></section>}
  </div>;
}
