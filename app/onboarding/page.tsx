/*
THESIS: Setup is one useful routing decision, not a profile questionnaire or tutorial.
OWN-WORLD: Warm paper, one white operating surface, quiet rules, rust action, and semantic radio controls.
STORY: Choose a level, timing, focus, and shared reminder timezone; arrive directly at useful preparation.
FIRST VIEWPORT: A compact welcome sits beside one continuous form; the preparation level leads and the action closes the same surface.
FORM: Direct code-led extension of the established authenticated workspace, phase8-account-extension.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { OnboardingForm } from "@/features/account/onboarding-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import {
  ONBOARDING_REMINDER_PREFERENCE_PRIVATE_DATA_DOMAIN,
  resolveOnboardingReminderPreferenceQuery,
} from "@/lib/account/onboarding-reminder-preference";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/queries";
import { safeInternalPath } from "@/lib/auth/redirects";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Start Your Preparation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/onboarding");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/error?reason=profile");
  const next = safeInternalPath((await searchParams).next);
  if (profile.onboarding_complete) redirect(next);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new PrivateDataUnavailableError(
      ONBOARDING_REMINDER_PREFERENCE_PRIVATE_DATA_DOMAIN,
    );
  }
  const reminderPreference = resolveOnboardingReminderPreferenceQuery(
    await supabase
      .from("interview_reminder_preferences")
      .select("preferred_timezone")
      .eq("user_id", user.id)
      .maybeSingle(),
  );

  return <section className="onboarding-page"><div className="page-width onboarding-shell">
    <header className="onboarding-intro"><h1>Start with the work that matters now.</h1><p>Three quick choices help Engineering Foundry point you to the right preparation. Every track stays available, and you can change these later.</p><ul><li>No resume or work-history questions</li><li>No permanent role lock-in</li><li>About one minute</li></ul></header>
    <OnboardingForm next={next} savedTimezone={reminderPreference} />
  </div></section>;
}
