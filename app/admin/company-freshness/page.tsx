import Link from "next/link";
import { COMPANY_GUIDE_REVIEW_AFTER_DAYS, priorityCompanyGuideFreshness } from "@/lib/admin/operations";

export default function AdminCompanyFreshnessPage() {
  const guides = priorityCompanyGuideFreshness();
  return <><header className="admin-page-header"><h2>Company guide freshness</h2><p>Every priority guide is shown from code-backed source metadata. A review flag is a reminder to inspect evidence—it never changes or hides public guidance automatically.</p></header><p className="admin-rule-note">Review reminder threshold: {COMPANY_GUIDE_REVIEW_AFTER_DAYS} days after verification.</p><div className="admin-freshness-list">{guides.map((guide) => <article key={guide.slug}><div><span className={`status-pill ${guide.status === "review_due" ? "warning" : guide.status === "review_soon" ? "accent" : "success"}`}>{guide.status.replaceAll("_", " ")}</span><h3>{guide.company}</h3><p>Verified {guide.verifiedAt} · {guide.ageDays} days ago · {guide.confidence} source confidence</p><small>{guide.applicability}</small></div><div><a href={guide.sourceUrl} target="_blank" rel="noreferrer">Open source</a><Link href={`/companies/${guide.slug}`}>View public guide</Link></div></article>)}</div></>;
}
