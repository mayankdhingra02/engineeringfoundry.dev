"use server";

import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { sanitizedFeedbackPageContext, type FeedbackCategory } from "@/lib/feedback/model";
import { logServerOperationalFailure } from "@/lib/observability/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { FeedbackActionState } from "./state";

const SUBJECT_COOKIE = "ef-feedback-subject";
const categories = new Set<FeedbackCategory>(["bug", "suggestion", "content_source", "accessibility", "privacy_safety", "other"]);

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

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

export async function submitFeedbackAction(_: FeedbackActionState, form: FormData): Promise<FeedbackActionState> {
  const category = String(form.get("category") ?? "").trim() as FeedbackCategory;
  const message = String(form.get("message") ?? "").trim();
  const contactEmail = String(form.get("contact_email") ?? "").trim().toLowerCase();
  const contactConsent = form.get("contact_consent") === "on";
  const fieldErrors: FeedbackActionState["fieldErrors"] = {};
  if (!categories.has(category)) fieldErrors.category = "Choose a feedback category.";
  if (!message) fieldErrors.message = "Describe the issue or suggestion.";
  else if (message.length > 5000) fieldErrors.message = "Feedback must be 5,000 characters or fewer.";
  if (contactEmail && !validEmail(contactEmail)) fieldErrors.contact_email = "Enter a valid email address or leave it blank.";
  if (contactEmail && !contactConsent) fieldErrors.contact_consent = "Confirm that we may use this address to follow up.";
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Check the marked fields and try again.", fieldErrors };

  const actor = await getAuthenticatedActor();
  const payload = {
    category,
    message,
    page_context: sanitizedFeedbackPageContext(String(form.get("page_context") ?? "/feedback")),
    contact_email: contactEmail || null,
    contact_consent: contactEmail ? contactConsent : false,
  } satisfies Record<string, Json>;
  const anonymousSubjectHash = actor ? null : await anonymousSubject();
  const supabase = actor?.supabase ?? await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Feedback is unavailable in this environment. Please try again later." };
  const { data, error } = await supabase.rpc("submit_feedback_submission", {
    payload,
    anonymous_subject: anonymousSubjectHash,
  });

  if (error || !data) {
    const rateLimited = error?.message.includes("Feedback submission limit reached");
    if (!rateLimited) logServerOperationalFailure("feedback_submission_failed", error, { authenticated: Boolean(actor) });
    return { status: "error", message: rateLimited ? "You’ve sent several reports recently. Please wait about 15 minutes before trying again." : "We couldn’t send your feedback. Nothing was published; try again." };
  }
  return { status: "success", message: "Feedback received. Keep this reference if you need to follow up.", referenceId: data };
}
