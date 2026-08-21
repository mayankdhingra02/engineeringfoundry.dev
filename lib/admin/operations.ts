import "server-only";

import { priorityCompanyGuides } from "@/data/company-guides/v1";
import { COMPANY_GUIDE_REVIEW_AFTER_DAYS, companyGuideFreshness } from "@/lib/company-guides/freshness";
import { accountPlatformStatus, emailReminderStatus, reminderWorkerStatus } from "@/lib/config/capabilities";
import { isProductionSiteUrlConfigured, isSupabaseConfigured } from "@/lib/account-platform";

export { COMPANY_GUIDE_REVIEW_AFTER_DAYS, companyGuideFreshness };

export function priorityCompanyGuideFreshness(now = new Date()) {
  return companyGuideFreshness(priorityCompanyGuides, now);
}

export type OperationalHealthItem = { id: string; label: string; configured: boolean; detail: string };

/** Configuration presence is not an external health probe. No values leave this module. */
export function operationalHealth(): OperationalHealthItem[] {
  const account = accountPlatformStatus();
  const reminderWorker = reminderWorkerStatus();
  const email = emailReminderStatus();
  return [
    { id: "production-origin", label: "Production origin", configured: isProductionSiteUrlConfigured(), detail: "Configured only; this does not verify DNS, HTTPS, or a live deployment." },
    { id: "supabase", label: "Supabase account platform", configured: isSupabaseConfigured(), detail: "Configured only; this does not probe the external service." },
    { id: "accounts", label: "Member accounts", configured: account.available, detail: "Enabled only when the account capability is configured." },
    { id: "reminder-worker", label: "Reminder worker", configured: reminderWorker.available, detail: "Configured only; delivery outcomes are tracked separately." },
    { id: "reminder-email", label: "Reminder email provider", configured: email.available, detail: "Configured only; an environment value is not proof of delivery health." },
    { id: "analytics", label: "Product analytics", configured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY), detail: "Configured only. Feedback and admin activity are excluded from analytics." },
  ];
}
