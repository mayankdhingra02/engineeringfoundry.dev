import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BellRing, CalendarDays, ShieldCheck } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { ReminderPreferencesForm } from "@/features/interview-calendar/preferences-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getInterviewCalendarData } from "@/lib/interview-calendar/queries";
import { isReminderEmailDeliveryAvailable } from "@/lib/interview-reminders/provider";

export const metadata: Metadata = { title: "Interview reminder settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InterviewSettingsPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile("/settings/interviews");
  const { preference, preferenceRevision } = await getInterviewCalendarData();
  return <main className="reminder-settings"><div className="page-width reminder-settings-shell"><Link className="tracker-back-link" href="/settings"><ArrowLeft size={15} />Back to settings</Link><header><div><h1>Interview reminders</h1><p>Choose a sparse set of cues for preparation and confirmed interview times.</p></div><BellRing size={28} aria-hidden="true" /></header><div className="reminder-settings-grid"><ReminderPreferencesForm preference={preference} preferenceRevision={preferenceRevision} emailAvailable={isReminderEmailDeliveryAvailable()} /><aside><section><CalendarDays size={19} /><div><h2>Schedule-aware</h2><p>Future reminder rows are rebuilt when the interview time changes and suppressed when a round is cancelled or completed.</p></div></section><section><ShieldCheck size={19} /><div><h2>Private by default</h2><p>Only your account can read reminder state. Calendar exports omit private notes.</p></div></section><p>All timing options can be turned off. Engineering Foundry will not create streaks or engagement notifications.</p></aside></div></div></main>;
}
