import type { CompanyGuideV1 } from "@/data/company-guides/v1";

/** Retained as the default for periodic sources; each claim carries its own review-by date. */
export const COMPANY_GUIDE_REVIEW_AFTER_DAYS = 180;

export type CompanyGuideFreshness = {
  slug: string;
  company: string;
  claimId: string;
  claimText: string;
  section: string;
  sourceTitle: string;
  sourceUrl: string;
  verifiedAt: string;
  reviewBy: string;
  confidence: string;
  applicability: string;
  status: "current" | "review_soon" | "review_due" | "needs_review" | "conflicting";
};

function utcDay(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Read-only claim queue; it never mutates or silently unpublishes source-backed guide data. */
export function companyGuideFreshness(guides: readonly CompanyGuideV1[], now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return guides.flatMap((guide): CompanyGuideFreshness[] => {
    const sources = new Map(guide.sources.map((source) => [source.id, source]));
    return guide.claims.map((claim) => {
      const source = sources.get(claim.sourceId);
      const reviewBy = utcDay(claim.reviewBy) ?? today;
      const daysUntilReview = Math.floor((reviewBy - today) / 86_400_000);
      const status = claim.editorialStatus === "conflicting"
        ? "conflicting"
        : claim.editorialStatus === "needs-review" || !source
          ? "needs_review"
          : daysUntilReview <= 0
            ? "review_due"
            : daysUntilReview <= 30
              ? "review_soon"
              : "current";
      return {
        slug: guide.slug,
        company: guide.company,
        claimId: claim.id,
        claimText: claim.text,
        section: claim.section,
        sourceTitle: source?.title ?? "Missing source",
        sourceUrl: source?.url ?? "",
        verifiedAt: claim.verifiedAt,
        reviewBy: claim.reviewBy,
        confidence: claim.confidence,
        applicability: claim.applicability,
        status,
      };
    });
  });
}
