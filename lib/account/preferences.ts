import type { UserPreparationPreferenceRow } from "@/lib/supabase/database.types";

export type PreferredRoleLevel = NonNullable<UserPreparationPreferenceRow["preferred_role_level"]>;
export type PrimaryPreparationFocus = NonNullable<UserPreparationPreferenceRow["primary_preparation_focus"]>;
export type PreferredDsaLevel = NonNullable<UserPreparationPreferenceRow["dsa_level"]>;

export const roleLevelOptions: ReadonlyArray<{ value: PreferredRoleLevel; label: string; description: string }> = [
  { value: "sde1", label: "SDE I / SWE I", description: "Entry-level and early-career interviews" },
  { value: "sde2", label: "SDE II / SWE II", description: "Mid-level engineering interviews" },
  { value: "senior", label: "Senior / SDE III+", description: "Senior ownership and technical depth" },
  { value: "staff", label: "Staff+", description: "Staff-level scope and influence" },
  { value: "unsure", label: "Not sure yet", description: "Keep every preparation path available" },
];

export const focusOptions: ReadonlyArray<{ value: PrimaryPreparationFocus; label: string; description: string }> = [
  { value: "dsa", label: "DSA", description: "Practice patterns, problems, and review" },
  { value: "system_design", label: "System Design", description: "Learn concepts and rehearse designs" },
  { value: "behavioral", label: "Behavioral", description: "Build stories and reusable answers" },
  { value: "applications", label: "Track my applications", description: "Organize roles and interview rounds" },
  { value: "unsure", label: "I’m not sure", description: "Start from the dashboard" },
];

export const dsaLevelOptions: ReadonlyArray<{ value: PreferredDsaLevel; label: string }> = [
  { value: "sde1", label: "SDE I / SWE I roadmap" },
  { value: "sde2", label: "SDE II / SWE II roadmap" },
  { value: "sde3plus", label: "Senior / SDE III+ roadmap" },
];

export function onboardingDestination(input: {
  hasUpcomingInterview: boolean;
  interviewScheduled: boolean;
  focus: PrimaryPreparationFocus | null;
  requestedPath: string;
}) {
  if (input.hasUpcomingInterview) return "/dashboard";
  if (input.interviewScheduled) return "/applications/new";
  if (input.requestedPath !== "/dashboard") return input.requestedPath;
  if (input.focus === "dsa") return "/dsa/roadmap";
  if (input.focus === "system_design") return "/system-design/practice";
  if (input.focus === "behavioral") return "/behavioral/workspace";
  if (input.focus === "applications") return "/applications/new";
  return "/dashboard";
}
