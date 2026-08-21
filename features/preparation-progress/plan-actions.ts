"use server";

import { revalidatePath } from "next/cache";
import { updateCurrentPreparationPreferences } from "@/lib/preparation-state/repository";
import type { SystemDesignLevel, SystemDesignPreparationWindow, SystemDesignTargetRole } from "@/data/system-design/recommendations";
import type { SystemDesignStudyMinutesPerDay } from "@/data/system-design/study-plan";

export type SaveStudyPlanInput =
  | { track: "dsa"; level: "sde1" | "sde2" | "senior"; duration: 30 | 60 | 90 }
  | { track: "system-design"; level: SystemDesignLevel; preparationWindow: SystemDesignPreparationWindow; role: SystemDesignTargetRole | undefined; minutesPerDay: SystemDesignStudyMinutesPerDay };

export async function saveActiveStudyPlanAction(input: SaveStudyPlanInput): Promise<{ saved: boolean; message: string }> {
  const result = input.track === "dsa"
    ? await updateCurrentPreparationPreferences({
      dsaLevel: input.level === "senior" ? "sde3plus" : input.level,
      dsaPlanId: `${input.duration}d`,
    })
    : await updateCurrentPreparationPreferences({
      systemDesignLevel: input.level,
      systemDesignPreparationWindow: input.preparationWindow,
      systemDesignRole: input.role ?? null,
      systemDesignMinutesPerDay: input.minutesPerDay,
    });
  if (!result.ok) return { saved: false, message: result.error.message };
  revalidatePath("/");
  revalidatePath(input.track === "dsa" ? "/dsa" : "/system-design/plan");
  return { saved: true, message: "Active study plan saved to your account." };
}
