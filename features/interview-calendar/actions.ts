"use server";

import { revalidatePath } from "next/cache";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  REMINDER_PREFERENCE_CONFLICT_ERROR,
  REMINDER_PREFERENCE_INVALID_INPUT_ERROR,
  REMINDER_PREFERENCE_PERSISTENCE_ERROR,
  REMINDER_PREFERENCE_SAVED_MESSAGE,
  REMINDER_PREFERENCE_TIMEZONE_ERROR,
  parseReminderPreferenceActionInput,
  parseReminderPreferenceSaveResult,
} from "@/lib/interview-calendar/reminder-preference-action-input";
import { isReminderEmailDeliveryAvailable } from "@/lib/interview-reminders/provider";

export type ReminderPreferenceActionState = {
  status: "idle" | "error" | "success";
  message: string;
  conflict?: boolean;
  revision?: string;
};

export async function saveReminderPreferencesAction(
  previousState: ReminderPreferenceActionState,
  form: unknown,
): Promise<ReminderPreferenceActionState> {
  const parsed = parseReminderPreferenceActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message:
        parsed.reason === "invalid-timezone"
          ? REMINDER_PREFERENCE_TIMEZONE_ERROR
          : REMINDER_PREFERENCE_INVALID_INPUT_ERROR,
      revision: previousState.revision,
    };
  }

  const input = parsed.value;
  const failed = (message: string, conflict = false) => ({
    status: "error" as const,
    message,
    conflict,
    revision: input.revision,
  });
  if (!isAccountPlatformAvailable()) {
    return failed("Account persistence is not available in this configuration.");
  }
  const current = await getAuthenticatedActor();
  if (!current) {
    return failed("Your session expired. Sign in and try again.");
  }
  if (input.emailEnabled && !isReminderEmailDeliveryAvailable()) {
    return failed(
      "Email delivery is not configured yet. Keep email reminders off or ask the site operator to connect a provider.",
    );
  }

  const { data, error } = await current.supabase.rpc(
    "save_interview_reminder_preferences_if_revision",
    {
      target_expect_absent: input.expectAbsent,
      target_expected_updated_at: input.expectedUpdatedAt,
      preferred_timezone_value: input.preferredTimezone,
      in_app_enabled_value: input.inAppEnabled,
      prep_3_days_enabled_value: input.prep3DaysEnabled,
      interview_1_day_enabled_value: input.interview1DayEnabled,
      interview_1_hour_enabled_value: input.interview1HourEnabled,
      email_enabled_value: input.emailEnabled,
    },
  );
  if (error) return failed(REMINDER_PREFERENCE_PERSISTENCE_ERROR);

  const outcome = parseReminderPreferenceSaveResult(data);
  if (outcome.status === "conflict") {
    return failed(REMINDER_PREFERENCE_CONFLICT_ERROR, true);
  }
  if (outcome.status === "invalid") {
    return failed(REMINDER_PREFERENCE_PERSISTENCE_ERROR);
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/applications");
  revalidatePath("/settings/interviews");
  return {
    status: "success",
    message: REMINDER_PREFERENCE_SAVED_MESSAGE,
    revision: outcome.updatedAt,
  };
}
