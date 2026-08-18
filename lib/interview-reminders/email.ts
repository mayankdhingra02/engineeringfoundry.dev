import "server-only";

import { formatInTimeZone, type ReminderType } from "@/lib/interview-calendar/model";

export type ReminderDeliveryClaim = {
  reminder_id: string;
  claim_token: string;
  reminder_type: ReminderType;
  recipient_email: string;
  round_id: string;
  company_name: string;
  role_title: string;
  round_type: string;
  round_name: string;
  scheduled_at: string;
  timezone: string | null;
  meeting_link: string | null;
};

const lead: Record<ReminderType, string> = {
  prep_3_days: "Your interview is in 3 days",
  interview_1_day: "Your interview is tomorrow",
  interview_1_hour: "Your interview starts in 1 hour",
};

export function buildReminderEmail(claim: ReminderDeliveryClaim, siteUrl: string) {
  const zone = claim.timezone || "UTC";
  const schedule = formatInTimeZone(claim.scheduled_at, zone);
  const prepareUrl = `${siteUrl.replace(/\/$/, "")}/interviews/${claim.round_id}/prepare`;
  const settingsUrl = `${siteUrl.replace(/\/$/, "")}/settings/interviews`;
  const subject = `${lead[claim.reminder_type]} · ${claim.company_name}`;
  const lines = [lead[claim.reminder_type], `${claim.company_name} — ${claim.role_title}`, `${claim.round_type} · ${claim.round_name}`, schedule, `Interview timezone: ${zone}`, `Prepare: ${prepareUrl}`, claim.meeting_link ? `Meeting: ${claim.meeting_link}` : null, `Reminder settings: ${settingsUrl}`].filter(Boolean);
  const text = lines.join("\n\n");
  const escaped = lines.map((line) => String(line).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"));
  return { subject, text, html: `<div style="font-family:system-ui,sans-serif;line-height:1.55">${escaped.map((line) => `<p>${line}</p>`).join("")}</div>` };
}
