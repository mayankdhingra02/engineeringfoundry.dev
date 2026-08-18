import { companies } from "@/data/companies";

export const APPLICATION_STATUSES = ["Wishlist", "Interested", "Applied", "Recruiter Screen", "Interviewing", "Offer", "Accepted", "Rejected", "Withdrawn", "Ghosted", "On Hold"] as const;
export const ROLE_LEVELS = ["Intern", "New Grad", "SDE I / SWE I", "SDE II / SWE II", "Senior / SDE III+", "Staff+", "Other"] as const;
export const APPLICATION_SOURCES = ["Company Website", "LinkedIn", "Referral", "Recruiter", "Indeed", "University", "Other"] as const;
export const ROUND_TYPES = ["Recruiter Screen", "Hiring Manager", "Coding / DSA", "System Design", "Behavioral", "Machine Coding", "Debugging", "Domain / Technical", "Bar Raiser", "Take-home", "Onsite / Virtual Onsite", "Other"] as const;
export const ROUND_STATUSES = ["Planned", "Scheduled", "Completed", "Rescheduled", "Cancelled"] as const;
export const ROUND_RESULTS = ["Pending", "Passed", "Failed", "No Decision", "Unknown"] as const;

export const TERMINAL_APPLICATION_STATUSES = new Set<string>(["Offer", "Accepted", "Rejected", "Withdrawn", "Ghosted"]);
export const UPCOMING_ROUND_STATUSES = ["Planned", "Scheduled", "Rescheduled"] as const;

const additionalCompanies = ["NVIDIA", "OpenAI", "Anthropic", "Uber", "Netflix", "Walmart", "JPMorgan Chase", "Salesforce", "IBM", "Stripe", "Atlassian", "Adobe"];
export const TRACKER_COMPANIES = Array.from(new Set([...companies.map((company) => company.name), ...additionalCompanies])).sort();

export function normalizeCompanySlug(value: string) {
  const slug = value.trim().toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return slug || null;
}

export function hasCompanyGuide(slug: string | null) {
  return Boolean(slug && companies.some((company) => company.slug === slug));
}
