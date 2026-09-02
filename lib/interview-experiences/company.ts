import { companies } from "@/data/companies";

export function normalizeInterviewExperienceCompany(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function canonicalInterviewExperienceCompany(value: string) {
  const normalized = normalizeInterviewExperienceCompany(value);
  return companies.find((company) => normalizeInterviewExperienceCompany(company.name) === normalized)?.name ?? value.trim();
}
