import "server-only";

export type ReminderEmailMessage = { to: string; subject: string; text: string; html: string; idempotencyKey: string };
export type ReminderEmailResult = { messageId: string };

export interface ReminderEmailProvider {
  send(message: ReminderEmailMessage): Promise<ReminderEmailResult>;
}

/** Phase 7 deliberately ships no pretend adapter. Connect a real provider here after deployment selection. */
export function getReminderEmailProvider(): ReminderEmailProvider | null {
  return null;
}

export function isReminderEmailDeliveryAvailable() {
  return getReminderEmailProvider() !== null;
}
