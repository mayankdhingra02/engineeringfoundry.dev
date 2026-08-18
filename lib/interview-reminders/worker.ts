import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { buildReminderEmail, type ReminderDeliveryClaim } from "./email";
import type { ReminderEmailProvider } from "./provider";

type ReminderWorkerLog = {
  reminderId: string;
  roundId: string;
  reminderType: string;
  outcome: "suppressed" | "delivered" | "failed";
  elapsedMs: number;
};

export async function processDueInterviewReminders(input: {
  admin: SupabaseClient<Database, "public">;
  provider: ReminderEmailProvider;
  siteUrl: string;
  batchSize?: number;
  now?: Date;
  logger?: (event: ReminderWorkerLog) => void;
}) {
  const startedAt = Date.now();
  const log = input.logger ?? ((event: ReminderWorkerLog) => console.info("interview_reminder_delivery", event));
  const { data, error } = await input.admin.rpc("claim_due_interview_reminders", { batch_size: input.batchSize ?? 50, worker_time: (input.now ?? new Date()).toISOString() });
  if (error) throw new Error("reminder_claim_failed");
  const claims = (data ?? []) as ReminderDeliveryClaim[];
  const summary = { claimed: claims.length, delivered: 0, failed: 0, suppressed: 0 };
  for (const claim of claims) {
    const validation = await input.admin.rpc("validate_interview_reminder_claim", { target_reminder_id: claim.reminder_id, target_claim_token: claim.claim_token });
    if (validation.error || !validation.data) {
      summary.suppressed += 1;
      log({ reminderId: claim.reminder_id, roundId: claim.round_id, reminderType: claim.reminder_type, outcome: "suppressed", elapsedMs: Date.now() - startedAt });
      continue;
    }
    try {
      const message = buildReminderEmail(claim, input.siteUrl);
      const delivered = await input.provider.send({ to: claim.recipient_email, ...message, idempotencyKey: claim.reminder_id });
      const marked = await input.admin.rpc("mark_interview_reminder_delivered", { target_reminder_id: claim.reminder_id, target_claim_token: claim.claim_token, provider_message_id_value: delivered.messageId });
      if (marked.error || !marked.data) throw Object.assign(new Error("delivery_mark_failed"), { retryable: true });
      summary.delivered += 1;
      log({ reminderId: claim.reminder_id, roundId: claim.round_id, reminderType: claim.reminder_type, outcome: "delivered", elapsedMs: Date.now() - startedAt });
    } catch (cause) {
      const errorCode = cause instanceof Error ? cause.message.slice(0, 120) : "provider_error";
      const retryable = typeof cause === "object" && cause !== null && "retryable" in cause ? Boolean(cause.retryable) : true;
      await input.admin.rpc("fail_interview_reminder_delivery", { target_reminder_id: claim.reminder_id, target_claim_token: claim.claim_token, error_code_value: errorCode, retryable_value: retryable });
      summary.failed += 1;
      log({ reminderId: claim.reminder_id, roundId: claim.round_id, reminderType: claim.reminder_type, outcome: "failed", elapsedMs: Date.now() - startedAt });
    }
  }
  return summary;
}
