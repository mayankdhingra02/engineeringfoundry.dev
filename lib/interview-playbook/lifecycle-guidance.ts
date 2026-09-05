/**
 * Public, non-personalized lifecycle guidance for the Interview Playbook.
 *
 * These records deliberately contain no clock, scoring, persistence, or
 * company-process inference. The private Playbook applies real application
 * and round context; this module gives the public execution guide a compact,
 * inspectable contract for final preparation, disruption, and debrief.
 */

export type InterviewLifecyclePhase = Readonly<{
  id: "final-week" | "day-before" | "interview-day" | "between-rounds";
  label: string;
  title: string;
  intent: string;
  actions: readonly string[];
  avoid: string;
}>;

export const INTERVIEW_LIFECYCLE_PHASES: readonly InterviewLifecyclePhase[] = [
  {
    id: "final-week",
    label: "Seven to three days",
    title: "Narrow the plan",
    intent: "Confirm the real loop, repair only material gaps, and reduce novelty as the interview approaches.",
    actions: [
      "Verify the schedule, time zone, modality, round labels, permitted tools, and recruiter contact.",
      "Choose at most the few gaps that could change execution in a confirmed round.",
      "Use a representative rehearsal only when its evidence will change the next action.",
      "Prepare equipment, travel, access, and a practical backup path.",
    ],
    avoid: "Do not expand into a new broad curriculum or turn missed work into a punishment backlog.",
  },
  {
    id: "day-before",
    label: "Day before",
    title: "Close open loops",
    intent: "Finish logistics and use only familiar, compact review material.",
    actions: [
      "Recheck the invitation, exact start time, time zone, location or link, and contact path.",
      "Review a short error log, story map, and the execution framework for the confirmed signal.",
      "Test the actual device, network, editor, presentation, or travel setup named in the instructions.",
      "Stop heavy novel practice after the useful review is complete.",
    ],
    avoid: "Do not prescribe a universal sleep, food, hydration, breathing, or medical routine.",
  },
  {
    id: "interview-day",
    label: "Interview day",
    title: "Protect execution",
    intent: "Keep the next round and its verified logistics visible while hiding low-value preparation noise.",
    actions: [
      "Open only the invitation, permitted materials, required environment, and backup contact.",
      "Use the one-page guide for the signal being evaluated; clarify the format when it is still unknown.",
      "Treat each round as a separate task and record technical disruption as disruption, not capability.",
      "Follow the interviewer or assessment instructions when they differ from general guidance.",
    ],
    avoid: "Do not run a last-minute readiness diagnostic, predict the outcome, or use an unpermitted assistant.",
  },
  {
    id: "between-rounds",
    label: "Between rounds",
    title: "Reset, then orient",
    intent: "Prepare for the next confirmed round without replaying or scoring the previous one.",
    actions: [
      "Verify the next start time, modality, interviewer or contact, and required environment.",
      "Capture only urgent facts: a schedule change, technical issue, promised follow-up, or access need.",
      "Close material from the previous round and open only what the next round permits.",
      "Defer detailed reflection until the loop or a suitable break is complete.",
    ],
    avoid: "Do not reconstruct the prompt, diagnose the interviewer, or let one round determine expectations for the next.",
  },
];

export type InterviewContingency = Readonly<{
  event: string;
  response: string;
}>;

export const INTERVIEW_CONTINGENCIES: readonly InterviewContingency[] = [
  { event: "Internet, device, or platform failure", response: "Tell the interviewer, use the prepared backup when available, contact the stored recruiting channel, and preserve the facts separately from performance." },
  { event: "Missing invite or time-zone conflict", response: "Stop guessing. Check the recruiter or application record and ask the recruiting contact to confirm the correct time and access path." },
  { event: "Unexpected round or interviewer", response: "Clarify the format and desired output, then use the nearest signal-specific execution guide without claiming the invitation was wrong." },
  { event: "Illness, emergency, or travel disruption", response: "Contact recruiting as early as practical and ask for the available next step; this guide does not decide whether a reason is medically or legally sufficient." },
  { event: "Hostile or concerning interaction", response: "Stay task-focused where possible, record factual private notes afterward, and use the recruiter, accommodation, or candidate-support channel." },
  { event: "Rule or tool conflict", response: "Ask once for clarification and follow the current assessment instruction. Preparation use never implies live-interview permission." },
];

export const INTERVIEW_DEBRIEF_GROUPS = [
  {
    title: "Facts",
    prompts: [
      "Round type, context, and scheduled next step",
      "Broad problem or competency category",
      "What was completed, tested, or left partial",
      "Hints, redirections, and technical failures",
    ],
  },
  {
    title: "Interpretation",
    prompts: [
      "What felt strong or weak, labeled as your interpretation",
      "Where your confidence is high or uncertain",
      "What you would change in the same situation",
      "Whether the conditions were representative",
    ],
  },
  {
    title: "Learning",
    prompts: [
      "One error-log or story-bank update",
      "The exact specialist practice link, if useful",
      "Whether this changes evidence for a dimension",
      "One next action—or an explicit decision that none is needed",
    ],
  },
] as const;

export const RECRUITER_FOLLOW_UP_TEMPLATES = [
  {
    title: "Clarify the format or tools",
    body: "Hello [name] — I’m looking forward to the [role] interview on [date]. Could you confirm [specific round, format, or permitted-tool question]? I’ll follow the instructions you provide. Thank you, [name].",
  },
  {
    title: "Report a technical disruption",
    body: "Hello [name] — During [round] at [time], [brief factual issue] affected the session. [Interviewer/platform response, if known]. Please let me know whether you need any other details or whether there is a next step. Thank you, [name].",
  },
  {
    title: "Check in after the stated timeline",
    body: "Hello [name] — I’m following up on the [role] process because the timeline shared for [date or milestone] has passed. I remain interested and would appreciate any update on next steps when available. Thank you, [name].",
  },
] as const;

