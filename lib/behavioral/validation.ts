import { normalizeCompanySlug } from "@/lib/applications/options";
import { ANSWER_STATUSES, STORY_THEMES } from "./options";

export type BehavioralFieldErrors = Record<string, string>;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optional = (formData: FormData, key: string) => text(formData, key) || null;

function limited(value: string | null, max: number, label: string, errors: BehavioralFieldErrors, key: string) {
  if (value && value.length > max) errors[key] = `${label} must be ${max.toLocaleString()} characters or fewer.`;
}

export function parseStoryForm(formData: FormData) {
  const errors: BehavioralFieldErrors = {};
  const data = {
    title: text(formData, "title"), company_or_context: optional(formData, "company_or_context"), role: optional(formData, "role"),
    approximate_period: optional(formData, "approximate_period"), project: optional(formData, "project"), situation: optional(formData, "situation"),
    task: optional(formData, "task"), action: optional(formData, "action"), result: optional(formData, "result"), reflection: optional(formData, "reflection"),
    short_summary: optional(formData, "short_summary"), notes: optional(formData, "notes"),
  };
  if (data.title.length < 2 || data.title.length > 200) errors.title = "Add a title between 2 and 200 characters.";
  limited(data.company_or_context, 200, "Company or context", errors, "company_or_context");
  limited(data.role, 160, "Role", errors, "role");
  limited(data.approximate_period, 100, "Approximate period", errors, "approximate_period");
  limited(data.project, 200, "Project", errors, "project");
  (["situation", "task", "action", "result", "reflection", "notes"] as const).forEach((key) => limited(data[key], 50000, key[0].toUpperCase() + key.slice(1), errors, key));
  limited(data.short_summary, 5000, "Summary", errors, "short_summary");
  const themes = Array.from(new Set(formData.getAll("themes").map(String).map((value) => value.trim()).filter(Boolean)));
  if (themes.length > 20) errors.themes = "Choose no more than 20 themes.";
  if (themes.some((theme) => theme.length > 80)) errors.themes = "Each theme must be 80 characters or fewer.";
  if (themes.some((theme) => !STORY_THEMES.includes(theme as (typeof STORY_THEMES)[number]))) errors.themes = "Choose themes from the supported list.";
  return { data: Object.keys(errors).length ? null : data, themes, errors };
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
  const status = text(formData, "status") || "Draft"; const company_slug = normalizeCompanySlug(text(formData, "company_slug"));
  const story_id = optional(formData, "story_id"); const application_id = optional(formData, "application_id");
  if (!title || title.length > 200) errors.title = "Add a title up to 200 characters.";
  if (answer_text.length > 50000) errors.answer_text = "Keep the full rehearsal draft to 50,000 characters or fewer.";
  if (!ANSWER_STATUSES.includes(status as (typeof ANSWER_STATUSES)[number])) errors.status = "Choose a valid answer status.";
  if (story_id && !UUID_PATTERN.test(story_id)) errors.story_id = "Choose a valid story.";
  if (is_primary && !story_id) errors.story_id = "Choose a story before making this the primary preparation.";
  if (application_id && !UUID_PATTERN.test(application_id)) errors.application_id = "Choose a valid application.";
  limited(opening_framing, 10000, "Opening framing", errors, "opening_framing");
  limited(details_to_emphasize, 20000, "Details to emphasize", errors, "details_to_emphasize");
  limited(details_to_avoid, 20000, "Details to avoid", errors, "details_to_avoid");
  limited(notes, 50000, "Notes", errors, "notes");
  return { data: Object.keys(errors).length ? null : { title, answer_text, opening_framing, details_to_emphasize, details_to_avoid, notes, status, company_slug, story_id, application_id }, isPrimary: is_primary, errors };
}
