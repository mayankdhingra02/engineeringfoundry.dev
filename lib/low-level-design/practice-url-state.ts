import { priorityCompanySlugs } from "@/data/company-guides/v1";
import { lowLevelDesignLevels, type LowLevelDesignLevel } from "@/data/low-level-design";

export const lowLevelDesignPracticeModes = ["guided", "independent", "timed"] as const;
export type LowLevelDesignPracticeMode = (typeof lowLevelDesignPracticeModes)[number];

export type LowLevelDesignPracticeContext = Readonly<{
  source: "playbook" | null;
  round: "low-level-design" | null;
  level: LowLevelDesignLevel | null;
  company: string | null;
  mode: LowLevelDesignPracticeMode;
}>;

type SearchValue = string | readonly string[] | undefined;
export type LowLevelDesignPracticeSearchParams = Readonly<Record<string, SearchValue>>;

const companySlugs = new Set<string>(priorityCompanySlugs);
const levels = new Set<string>(lowLevelDesignLevels);
const modes = new Set<string>(lowLevelDesignPracticeModes);

function one(value: SearchValue): string | null {
  return typeof value === "string" ? value : null;
}

export function normalizeLowLevelDesignLevel(value: string | null | undefined): LowLevelDesignLevel | null {
  if (!value) return null;
  if (levels.has(value)) return value as LowLevelDesignLevel;
  const normalized = value.trim().toLowerCase();
  if (/^(entry|junior|new grad|new-grad|l1|l2|sde i|sde 1)$/.test(normalized)) return "Entry";
  if (/^(mid|mid-level|intermediate|l3|sde ii|sde 2)$/.test(normalized)) return "Mid";
  if (/^(senior|senior-level|l4|l5|sde iii|sde 3)$/.test(normalized)) return "Senior";
  if (/^(staff|staff\+|principal|lead|l6|l7)$/.test(normalized)) return "Staff+";
  return null;
}

export function parseLowLevelDesignPracticeContext(
  searchParams: LowLevelDesignPracticeSearchParams,
): LowLevelDesignPracticeContext {
  const source = one(searchParams.source) === "playbook" ? "playbook" : null;
  const round = source && one(searchParams.round) === "low-level-design" ? "low-level-design" : null;
  const rawMode = one(searchParams.mode);
  const mode = rawMode && modes.has(rawMode) ? rawMode as LowLevelDesignPracticeMode : "guided";
  const rawCompany = one(searchParams.company);
  return {
    source,
    round,
    level: source ? normalizeLowLevelDesignLevel(one(searchParams.level)) : null,
    company: source && rawCompany && companySlugs.has(rawCompany) ? rawCompany : null,
    mode,
  };
}

export function buildLowLevelDesignPracticeHref(
  slug: string | null,
  context: Partial<LowLevelDesignPracticeContext>,
): string {
  const path = slug ? `/low-level-design/practice/${encodeURIComponent(slug)}` : "/low-level-design/practice";
  const params = new URLSearchParams();
  if (context.source === "playbook") params.set("source", "playbook");
  if (context.round === "low-level-design") params.set("round", "low-level-design");
  if (context.level && levels.has(context.level)) params.set("level", context.level);
  if (context.company && companySlugs.has(context.company)) params.set("company", context.company);
  if (context.mode && modes.has(context.mode)) params.set("mode", context.mode);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function buildLowLevelDesignPlaybookHref(input: Readonly<{
  companySlug: string | null;
  roleLevel: string | null;
  mode: LowLevelDesignPracticeMode;
}>): string {
  return buildLowLevelDesignPracticeHref(null, {
    source: "playbook",
    round: "low-level-design",
    level: normalizeLowLevelDesignLevel(input.roleLevel),
    company: input.companySlug && companySlugs.has(input.companySlug) ? input.companySlug : null,
    mode: input.mode,
  });
}
