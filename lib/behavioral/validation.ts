import { normalizeCompanySlug } from "@/lib/applications/options";
import { ANSWER_STATUSES } from "./options";

export type BehavioralFieldErrors = Record<string, string>;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optional = (formData: FormData, key: string) => text(formData, key) || null;

function limited(value: string | null, max: number, label: string, errors: BehavioralFieldErrors, key: string) {
  if (value && value.length > max) errors[key] = `${label} must be ${max.toLocaleString()} characters or fewer.`;
}

export function parseQuestionForm(formData: FormData) {
  const errors: BehavioralFieldErrors = {};
  const question_text = text(formData, "question_text"); const description = optional(formData, "description"); const category = text(formData, "category") || "Other";
  const company_slug = normalizeCompanySlug(text(formData, "company_slug")); const notes = optional(formData, "notes");
  if (question_text.length < 5 || question_text.length > 1000) errors.question_text = "Add a question between 5 and 1,000 characters.";
  if (category.length > 100) errors.category = "Category must be 100 characters or fewer.";
  limited(description, 5000, "Description", errors, "description"); limited(notes, 20000, "Notes", errors, "notes");
  return { data: Object.keys(errors).length ? null : { question_text, description, category, company_slug, notes }, errors };
}

export function parseAnswerForm(formData: FormData) {
  const errors: BehavioralFieldErrors = {};
  const title = text(formData, "title"); const answer_text = text(formData, "answer_text"); const notes = optional(formData, "notes");
  const opening_framing = optional(formData, "opening_framing"); const details_to_emphasize = optional(formData, "details_to_emphasize");
  const details_to_avoid = optional(formData, "details_to_avoid"); const is_primary = formData.get("is_primary") === "on";
  const factIntegrityConfirmed = formData.get("fact_integrity_confirmed") === "on";
  const status = text(formData, "status") || "Draft"; const company_slug = normalizeCompanySlug(text(formData, "company_slug"));
  const story_id = optional(formData, "story_id"); const application_id = optional(formData, "application_id");
  if (!title || title.length > 200) errors.title = "Add a title up to 200 characters.";
  if (answer_text.length > 50000) errors.answer_text = "Keep the full rehearsal draft to 50,000 characters or fewer.";
  if (!ANSWER_STATUSES.includes(status as (typeof ANSWER_STATUSES)[number])) errors.status = "Choose a valid answer status.";
  if (!story_id) errors.story_id = "Choose the source story for this answer variant.";
  if (story_id && !UUID_PATTERN.test(story_id)) errors.story_id = "Choose a valid story.";
  if (application_id && !UUID_PATTERN.test(application_id)) errors.application_id = "Choose a valid application.";
  limited(opening_framing, 10000, "Opening framing", errors, "opening_framing");
  limited(details_to_emphasize, 20000, "Details to emphasize", errors, "details_to_emphasize");
  limited(details_to_avoid, 20000, "Details to avoid", errors, "details_to_avoid");
  limited(notes, 50000, "Notes", errors, "notes");
  return { data: Object.keys(errors).length ? null : { title, answer_text, opening_framing, details_to_emphasize, details_to_avoid, notes, status, company_slug, story_id, application_id }, isPrimary: is_primary, factIntegrityConfirmed, errors };
}
