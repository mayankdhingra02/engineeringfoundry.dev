import { normalizeCompanySlug } from "@/lib/applications/options";

export type BehavioralFieldErrors = Record<string, string>;
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
