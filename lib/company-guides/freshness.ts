import type { CompanyGuideV1 } from "@/data/company-guides/v1";

export const COMPANY_GUIDE_REVIEW_AFTER_DAYS = 180;

export type CompanyGuideFreshness = {
  slug: string;
  company: string;
  verifiedAt: string;
  sourceUrl: string;
  confidence: string;
  applicability: string;
  ageDays: number;
  status: "recent" | "review_soon" | "review_due";
};

function utcDay(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Read-only review reminder; it never mutates source-backed public guide data. */
export function companyGuideFreshness(guides: readonly CompanyGuideV1[], now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return guides.map((guide): CompanyGuideFreshness => {
    const verified = utcDay(guide.verifiedAt) ?? today;
    const ageDays = Math.max(0, Math.floor((today - verified) / 86_400_000));
    const status = ageDays >= COMPANY_GUIDE_REVIEW_AFTER_DAYS ? "review_due" : ageDays >= COMPANY_GUIDE_REVIEW_AFTER_DAYS - 30 ? "review_soon" : "recent";
    const source = guide.sources[0];
    return { slug: guide.slug, company: guide.company, verifiedAt: guide.verifiedAt, sourceUrl: source?.url ?? "", confidence: source?.confidence ?? "Limited", applicability: source?.applicability ?? "Not specified", ageDays, status };
  });
}
