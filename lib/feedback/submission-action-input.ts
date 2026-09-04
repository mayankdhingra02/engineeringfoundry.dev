import {
  FEEDBACK_CATEGORIES,
  sanitizedFeedbackPageContext,
  type FeedbackCategory,
} from "./model.ts";

export const FEEDBACK_CONTACT_CONSENT_PRESENT_FIELD =
  "contact_consent_present";
export const FEEDBACK_SUBMISSION_INVALID_INPUT_ERROR =
  "Check the marked fields and try again.";
export const FEEDBACK_SUBMISSION_PERSISTENCE_ERROR =
  "We couldn’t send your feedback. Nothing was published; try again.";
export const FEEDBACK_SUBMISSION_SAVED_MESSAGE =
  "Feedback received. Keep this reference if you need to follow up.";
export const FEEDBACK_SUBMISSION_PENDING_MESSAGE = "Sending feedback…";
export const FEEDBACK_SUBMISSION_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier feedback was received. Your current edits have not been sent; review them and send again.";

const allowedFields = new Set([
  "category",
  "message",
  "contact_email",
  "contact_consent",
  FEEDBACK_CONTACT_CONSENT_PRESENT_FIELD,
  "page_context",
]);
const categories = new Set<unknown>(
  FEEDBACK_CATEGORIES.map((category) => category.id),
);
const referencePattern = /^EF-FB-[0-9A-F]{32}$/;

export type FeedbackSubmissionFieldErrors = Partial<
  Record<
    "category" | "message" | "contact_email" | "contact_consent",
    string
  >
>;

export type FeedbackSubmissionActionInput = Readonly<{
  category: FeedbackCategory;
  message: string;
  contactEmail: string | null;
  contactConsent: boolean;
  pageContext: string;
}>;

export type FeedbackSubmissionActionInputResult =
  | Readonly<{ ok: true; value: FeedbackSubmissionActionInput }>
  | Readonly<{
      ok: false;
      fieldErrors: FeedbackSubmissionFieldErrors;
    }>;

export type FeedbackSubmissionDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message?: string;
  referenceId?: string;
  fieldErrors?: FeedbackSubmissionFieldErrors;
}>;

function singletonText(form: FormData, name: string): string | null {
  const values = form.getAll(name);
  return values.length === 1 && typeof values[0] === "string"
    ? values[0]
    : null;
}

function containsUnsafeControl(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return (
      (codePoint < 32 && codePoint !== 9 && codePoint !== 10 && codePoint !== 13) ||
      codePoint === 127
    );
  });
}

function validEmail(value: string) {
  return (
    Array.from(value).length <= 254 &&
    !containsUnsafeControl(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function parseFeedbackSubmissionActionInput(
  input: unknown,
): FeedbackSubmissionActionInputResult {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return { ok: false, fieldErrors: {} };
  }
  for (const name of input.keys()) {
    if (!name.startsWith("$ACTION_") && !allowedFields.has(name)) {
      return { ok: false, fieldErrors: {} };
    }
  }

  const category = singletonText(input, "category");
  const rawMessage = singletonText(input, "message");
  const rawContactEmail = singletonText(input, "contact_email");
  const pageContext = singletonText(input, "page_context");
  const consentPresent = singletonText(
    input,
    FEEDBACK_CONTACT_CONSENT_PRESENT_FIELD,
  );
  const consentValues = input.getAll("contact_consent");
  const validConsent =
    consentValues.length === 0 ||
    (consentValues.length === 1 && consentValues[0] === "true");

  const fieldErrors: FeedbackSubmissionFieldErrors = {};
  if (category === null || !categories.has(category)) {
    fieldErrors.category = "Choose a feedback category.";
  }

  const message = rawMessage?.trim() ?? "";
  if (!message) {
    fieldErrors.message = "Describe the issue or suggestion.";
  } else if (
    Array.from(message).length > 5_000 ||
    containsUnsafeControl(message)
  ) {
    fieldErrors.message = "Feedback must be 5,000 characters or fewer.";
  }

  const contactEmail = rawContactEmail?.trim().toLowerCase() ?? "";
  if (contactEmail && !validEmail(contactEmail)) {
    fieldErrors.contact_email =
      "Enter a valid email address or leave it blank.";
  }
  const contactConsent = consentValues.length === 1;
  if (contactEmail && validConsent && !contactConsent) {
    fieldErrors.contact_consent =
      "Confirm that we may use this address to follow up.";
  }

  const validHiddenFields =
    rawMessage !== null &&
    rawContactEmail !== null &&
    pageContext !== null &&
    Array.from(pageContext).length <= 2_000 &&
    !containsUnsafeControl(pageContext) &&
    consentPresent === "true" &&
    validConsent;
  if (!validHiddenFields || Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: {
      category: category as FeedbackCategory,
      message,
      contactEmail: contactEmail || null,
      contactConsent: Boolean(contactEmail && contactConsent),
      pageContext: sanitizedFeedbackPageContext(pageContext),
    },
  };
}

export function parseFeedbackSubmissionResult(value: unknown): string | null {
  return typeof value === "string" && referencePattern.test(value)
    ? value
    : null;
}

export function feedbackSubmissionDraftSignature(formData: FormData) {
  return JSON.stringify([
    formData.get("category"),
    formData.get("message"),
    formData.get("contact_email"),
    formData.get("contact_consent"),
    formData.get("page_context"),
  ]);
}

export function resolveFeedbackSubmissionDisplayState(
  actionState: FeedbackSubmissionDisplayState,
  pending: boolean,
  changedSinceSubmit: boolean,
): FeedbackSubmissionDisplayState {
  if (pending) {
    return { status: "pending", message: FEEDBACK_SUBMISSION_PENDING_MESSAGE };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      ...actionState,
      message: FEEDBACK_SUBMISSION_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
