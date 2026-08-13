export interface ProfileInput {
  username: string;
  displayName: string;
  bio: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  isPublic: boolean;
}

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

function cleanOptional(value: FormDataEntryValue | null, max: number) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized ? normalized.slice(0, max) : null;
}

function safeWebUrl(value: FormDataEntryValue | null, label: string) {
  const normalized = cleanOptional(value, 500);
  if (!normalized) return { value: null };
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    return { value: parsed.toString() };
  } catch {
    return { value: null, error: `${label} must be a valid http:// or https:// URL.` };
  }
}

export function parseProfileForm(formData: FormData): { data?: ProfileInput; error?: string } {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!USERNAME_PATTERN.test(username)) return { error: "Use 3–30 lowercase letters, numbers, underscores, or hyphens. Start with a letter or number." };
  if (displayName.length < 1 || displayName.length > 80) return { error: "Display name must be between 1 and 80 characters." };

  const bio = cleanOptional(formData.get("bio"), 280);
  const currentCompany = cleanOptional(formData.get("current_company"), 100);
  const currentRole = cleanOptional(formData.get("current_role"), 100);
  const rawYears = String(formData.get("years_experience") ?? "").trim();
  const yearsExperience = rawYears === "" ? null : Number(rawYears);
  if (yearsExperience !== null && (!Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 80)) return { error: "Years of experience must be a whole number between 0 and 80." };

  const linkedin = safeWebUrl(formData.get("linkedin_url"), "LinkedIn URL");
  const github = safeWebUrl(formData.get("github_url"), "GitHub URL");
  if (linkedin.error || github.error) return { error: linkedin.error ?? github.error };

  return { data: { username, displayName, bio, currentCompany, currentRole, yearsExperience, linkedinUrl: linkedin.value, githubUrl: github.value, isPublic: formData.get("is_public") === "public" } };
}
