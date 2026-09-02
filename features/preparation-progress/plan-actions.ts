"use server";

import { revalidatePath } from "next/cache";
import { updateCurrentPreparationPreferences } from "@/lib/preparation-state/repository";
import type { SaveStudyPlanAccountResult, SaveStudyPlanInput } from "@/lib/preparation-progress/plan-save";

export type { SaveStudyPlanInput } from "@/lib/preparation-progress/plan-save";

export async function saveActiveStudyPlanAction(input: SaveStudyPlanInput): Promise<SaveStudyPlanAccountResult> {
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
  if (!result.ok) return { saved: false, reason: result.error.code };
  revalidatePath("/");
  revalidatePath(input.track === "dsa" ? "/dsa" : "/system-design/plan");
  return { saved: true, reason: "saved" };
}
