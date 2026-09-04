"use server";

import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  FEEDBACK_SUBMISSION_INVALID_INPUT_ERROR,
  FEEDBACK_SUBMISSION_PERSISTENCE_ERROR,
  FEEDBACK_SUBMISSION_SAVED_MESSAGE,
  parseFeedbackSubmissionActionInput,
  parseFeedbackSubmissionResult,
} from "@/lib/feedback/submission-action-input";
import { logServerOperationalFailure } from "@/lib/observability/log";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { Json } from "@/lib/supabase/database.types";
import type { FeedbackActionState } from "./state";

const SUBJECT_COOKIE = "ef-feedback-subject";

async function anonymousSubject() {
  const cookieStore = await cookies();
  let token = cookieStore.get(SUBJECT_COOKIE)?.value;
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    token = randomUUID();
    cookieStore.set(SUBJECT_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return createHash("sha256").update(token).digest("hex");
}

export async function submitFeedbackAction(_: FeedbackActionState, form: unknown): Promise<FeedbackActionState> {
  const parsed = parseFeedbackSubmissionActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message: FEEDBACK_SUBMISSION_INVALID_INPUT_ERROR,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const actor = await getAuthenticatedActor();
  const input = parsed.value;
  const payload = {
    category: input.category,
    message: input.message,
    page_context: input.pageContext,
    contact_email: input.contactEmail,
    contact_consent: input.contactConsent,
  } satisfies Record<string, Json>;
  const supabase = actor?.supabase ?? createSupabasePublicClient();
  if (!supabase) return { status: "error", message: "Feedback is unavailable in this environment. Please try again later." };
  const anonymousSubjectHash = actor ? null : await anonymousSubject();
  const { data, error } = await supabase.rpc("submit_feedback_submission", {
    payload,
    anonymous_subject: anonymousSubjectHash,
  });

  const referenceId = parseFeedbackSubmissionResult(data);
  if (error || !referenceId) {
    const rateLimited = error?.message.includes("Feedback submission limit reached");
    if (!rateLimited) logServerOperationalFailure("feedback_submission_failed", error ?? new Error("Feedback submission returned an invalid reference."), { authenticated: Boolean(actor) });
    return { status: "error", message: rateLimited ? "You’ve sent several reports recently. Please wait about 15 minutes before trying again." : FEEDBACK_SUBMISSION_PERSISTENCE_ERROR };
  }
  return { status: "success", message: FEEDBACK_SUBMISSION_SAVED_MESSAGE, referenceId };
}
