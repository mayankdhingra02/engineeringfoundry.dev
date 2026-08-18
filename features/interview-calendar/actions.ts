"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { validIanaTimeZone } from "@/lib/interview-calendar/model";
import { isReminderEmailDeliveryAvailable } from "@/lib/interview-reminders/provider";

export type ReminderPreferenceActionState = { status: "idle" | "error" | "success"; message: string };

const checked = (form: FormData, name: string) => form.get(name) === "on";

export async function saveReminderPreferencesAction(_: ReminderPreferenceActionState, form: FormData): Promise<ReminderPreferenceActionState> {
  const current = await getAuthenticatedActor();
  if (!current) return { status: "error", message: "Your session expired. Sign in and try again." };
  const rawTimezone = String(form.get("preferredTimezone") ?? "").trim();
  const preferredTimezone = rawTimezone || null;
  if (preferredTimezone && !validIanaTimeZone(preferredTimezone)) return { status: "error", message: "Enter a valid IANA timezone, such as America/Chicago." };
  const emailEnabled = checked(form, "emailEnabled");
  if (emailEnabled && !isReminderEmailDeliveryAvailable()) {
    return { status: "error", message: "Email delivery is not configured yet. Keep email reminders off or ask the site operator to connect a provider." };
  }
  const { error } = await current.supabase.rpc("save_interview_reminder_preferences", {
    preferred_timezone_value: preferredTimezone,
    in_app_enabled_value: checked(form, "inAppEnabled"),
    prep_3_days_enabled_value: checked(form, "prep3DaysEnabled"),
    interview_1_day_enabled_value: checked(form, "interview1DayEnabled"),
    interview_1_hour_enabled_value: checked(form, "interview1HourEnabled"),
    email_enabled_value: emailEnabled,
  });
  if (error) return { status: "error", message: "We couldn't save reminder settings. Review the values and try again." };
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/applications");
  revalidatePath("/settings/interviews");
  return { status: "success", message: "Interview reminder settings saved." };
}
