export const FEEDBACK_CATEGORIES = [
  { id: "bug", label: "Bug" },
  { id: "suggestion", label: "Suggestion" },
  { id: "content_source", label: "Content / source issue" },
  { id: "accessibility", label: "Accessibility" },
  { id: "privacy_safety", label: "Privacy / safety" },
  { id: "other", label: "Other" },
] as const;

export const FEEDBACK_STATUSES = ["new", "triaged", "planned", "resolved", "closed", "spam"] as const;
export const EXPERIENCE_MODERATION_STATUSES = ["needs_changes", "approved", "rejected"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["id"];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export function feedbackCategoryLabel(category: string) {
  return FEEDBACK_CATEGORIES.find((item) => item.id === category)?.label ?? "Other";
}

export function feedbackStatusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Client-safe first pass; the database performs the authoritative collapse. */
export function sanitizedFeedbackPageContext(value: string | null | undefined) {
  const clean = String(value ?? "").split(/[?#]/, 1)[0]?.trim() ?? "";
  if (!clean.startsWith("/")) return "/feedback";
  if (/^\/(applications|behavioral\/questions|behavioral\/stories|interviews)(?:\/|$)/.test(clean)) {
    const prefix = clean.startsWith("/behavioral/questions") ? "/behavioral/questions" : clean.startsWith("/behavioral/stories") ? "/behavioral/stories" : clean.startsWith("/applications") ? "/applications" : "/interviews";
    return clean === prefix ? prefix : `${prefix}/...`;
  }
  if (/^\/(behavioral\/workspace|calendar|dashboard|interview-playbook|admin)(?:\/|$)/.test(clean)) return clean.startsWith("/behavioral/workspace") ? "/behavioral/workspace" : clean.startsWith("/calendar") ? "/calendar" : clean.startsWith("/dashboard") ? "/dashboard" : clean.startsWith("/interview-playbook") ? "/interview-playbook" : "/admin";
  if (/^\/system-design\/problems\/[^/]+\/practice(?:\/|$)/.test(clean)) return "/system-design/problems/.../practice/...";
  return clean.slice(0, 180);
}
