import "server-only";

import { isAccountPlatformAvailable, isProductionSiteUrlConfigured, isSupabaseConfigured } from "@/lib/account-platform";
import { isReminderEmailDeliveryAvailable } from "@/lib/interview-reminders/provider";

/**
 * Server-side capability matrix.
 *
 * Engineering Foundry has several independent capabilities whose requirements
 * genuinely differ. A single "accounts are on, therefore everything works"
 * rule would be wrong in both directions: it would block the account platform
 * on a credential only deletion needs, and it would promise email delivery
 * that no adapter can perform.
 *
 * Each capability answers one question — can the product honestly offer this
 * right now? — so a partially configured environment degrades to a truthful UI
 * instead of a control that fails after the user commits to it.
 *
 * Browser-safe checks live in `lib/account-platform.ts`. This module reads
 * server-only variables and must never be imported by a Client Component.
 */

export type CapabilityName =
  | "accountPlatform"
  | "accountDeletion"
  | "reminderWorker"
  | "emailReminders";

export type CapabilityStatus = {
  available: boolean;
  /** Names only. Never a value. */
  missing: string[];
};

const has = (name: string) => Boolean(process.env[name]);

/** Public preparation content works with no configuration at all. */
export function accountPlatformStatus(): CapabilityStatus {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!isProductionSiteUrlConfigured()) missing.push("NEXT_PUBLIC_SITE_URL=https://<production-domain>");
  if (process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED !== "true") missing.push("NEXT_PUBLIC_ACCOUNTS_ENABLED=true");
  return { available: isAccountPlatformAvailable(), missing };
}

/**
 * Permanent deletion needs the privileged Auth admin credential. Without it the
 * Server Action cannot delete anything, so the UI must not present a delete
 * control that looks operational.
 */
export function accountDeletionStatus(): CapabilityStatus {
  const platform = accountPlatformStatus();
  const missing = [...platform.missing];
  if (!has("SUPABASE_SERVICE_ROLE_KEY")) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { available: platform.available && has("SUPABASE_SERVICE_ROLE_KEY"), missing };
}

/**
 * The reminder worker needs both the privileged client and its shared secret.
 * A missing secret must fail closed rather than leave an anonymously callable
 * endpoint, which is why the route rejects before it inspects configuration.
 */
export function reminderWorkerStatus(): CapabilityStatus {
  const missing: string[] = [];
  if (!has("SUPABASE_SERVICE_ROLE_KEY")) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!has("REMINDER_WORKER_SECRET")) missing.push("REMINDER_WORKER_SECRET");
  return { available: missing.length === 0, missing };
}

/**
 * Email reminders additionally require a real provider adapter. This is not a
 * configuration gap: Phase 7 deliberately shipped no adapter, so the honest
 * answer today is that the capability does not exist. See
 * `lib/interview-reminders/provider.ts`.
 */
export function emailReminderStatus(): CapabilityStatus {
  const worker = reminderWorkerStatus();
  const providerReady = isReminderEmailDeliveryAvailable();
  const missing = [...worker.missing];
  if (!providerReady) missing.push("REMINDER_EMAIL_PROVIDER adapter implementation");
  return { available: worker.available && providerReady, missing };
}

export function capabilityStatus(name: CapabilityName): CapabilityStatus {
  switch (name) {
    case "accountPlatform": return accountPlatformStatus();
    case "accountDeletion": return accountDeletionStatus();
    case "reminderWorker": return reminderWorkerStatus();
    case "emailReminders": return emailReminderStatus();
  }
}

/**
 * Diagnostic summary for launch qualification. Reports capability names and
 * missing variable names only — never a configured value.
 */
export function describeCapabilities(): Record<CapabilityName, CapabilityStatus> {
  return {
    accountPlatform: accountPlatformStatus(),
    accountDeletion: accountDeletionStatus(),
    reminderWorker: reminderWorkerStatus(),
    emailReminders: emailReminderStatus(),
  };
}

/**
 * Supabase configured but accounts intentionally disabled is a valid, supported
 * production state: the public product keeps working and every private control
 * stays out of the UI.
 */
export function isPublicOnlyDeployment() {
  return !isAccountPlatformAvailable() && isSupabaseConfigured();
}
