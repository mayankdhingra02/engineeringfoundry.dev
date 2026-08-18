import { processDueInterviewReminders } from "../lib/interview-reminders/worker.ts";

const claims = [
  { reminder_id: "reminder-delivered", claim_token: "claim-a", reminder_type: "interview_1_day", recipient_email: "verified@example.test", round_id: "round-a", company_name: "Amazon", role_title: "SDE II", round_type: "Coding", round_name: "Technical screen", scheduled_at: "2099-08-19T19:00:00Z", timezone: "America/Chicago", meeting_link: "https://meet.example.test/a" },
  { reminder_id: "reminder-suppressed", claim_token: "claim-b", reminder_type: "prep_3_days", recipient_email: "verified@example.test", round_id: "round-b", company_name: "Amazon", role_title: "SDE II", round_type: "System Design", round_name: "Panel", scheduled_at: "2099-08-20T19:00:00Z", timezone: "America/Chicago", meeting_link: null },
  { reminder_id: "reminder-failed", claim_token: "claim-c", reminder_type: "interview_1_hour", recipient_email: "verified@example.test", round_id: "round-c", company_name: "Amazon", role_title: "SDE II", round_type: "Behavioral", round_name: "Hiring manager", scheduled_at: "2099-08-21T19:00:00Z", timezone: "America/Chicago", meeting_link: null },
];

const calls = [];
let claimed = false;
const admin = {
  async rpc(name, args) {
    calls.push({ name, args });
    if (name === "claim_due_interview_reminders") {
      if (claimed) return { data: [], error: null };
      claimed = true;
      return { data: claims, error: null };
    }
    if (name === "validate_interview_reminder_claim") return { data: args.target_reminder_id !== "reminder-suppressed", error: null };
    if (name === "mark_interview_reminder_delivered") return { data: true, error: null };
    if (name === "fail_interview_reminder_delivery") return { data: true, error: null };
    throw new Error(`Unexpected RPC ${name}`);
  },
};

const sent = [];
const provider = {
  async send(message) {
    sent.push(message);
    if (message.idempotencyKey === "reminder-failed") throw Object.assign(new Error("provider_unavailable"), { retryable: true });
    return { messageId: "provider-message-a" };
  },
};

const logs = [];
const first = await processDueInterviewReminders({ admin, provider, siteUrl: "https://engineeringfoundry.dev", now: new Date("2099-08-18T19:00:00Z"), logger: (event) => logs.push(event) });
const second = await processDueInterviewReminders({ admin, provider, siteUrl: "https://engineeringfoundry.dev", now: new Date("2099-08-18T19:01:00Z"), logger: (event) => logs.push(event) });

const assertions = [
  ["bounded summary", first.claimed === 3 && first.delivered === 1 && first.suppressed === 1 && first.failed === 1],
  ["second poll cannot redeliver claimed work", second.claimed === 0 && sent.length === 2],
  ["provider receives stable reminder idempotency keys", sent.map((message) => message.idempotencyKey).join(",") === "reminder-delivered,reminder-failed"],
  ["only successful provider delivery is marked delivered", calls.filter((call) => call.name === "mark_interview_reminder_delivered").length === 1 && calls.find((call) => call.name === "mark_interview_reminder_delivered")?.args.target_reminder_id === "reminder-delivered"],
  ["provider failure enters retry state", calls.filter((call) => call.name === "fail_interview_reminder_delivery").length === 1 && calls.find((call) => call.name === "fail_interview_reminder_delivery")?.args.retryable_value === true],
  ["failed reminder is not marked delivered", !calls.some((call) => call.name === "mark_interview_reminder_delivered" && call.args.target_reminder_id === "reminder-failed")],
  ["claim is revalidated before every send", calls.filter((call) => call.name === "validate_interview_reminder_claim").length === 3],
  ["email uses verified claim recipient and owned preparation link", sent[0]?.to === "verified@example.test" && sent[0]?.text.includes("/interviews/round-a/prepare")],
  ["email payload excludes private workspace content", sent.every((message) => !/private|answer_text|notes/i.test(message.text))],
  ["structured logs expose operational identifiers only", logs.length === 3 && logs.every((event) => Object.keys(event).sort().join(",") === "elapsedMs,outcome,reminderId,reminderType,roundId")],
  ["worker records each outcome", logs.map((event) => event.outcome).sort().join(",") === "delivered,failed,suppressed"],
];

let failed = 0;
for (const [name, pass] of assertions) {
  if (!pass) failed += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
}
console.log(`SUMMARY ${assertions.length - failed}/${assertions.length} passed; ${failed} failed`);
if (failed) process.exitCode = 1;
