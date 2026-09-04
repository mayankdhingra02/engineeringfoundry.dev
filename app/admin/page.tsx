import Link from "next/link";
import { Activity, ClipboardCheck, MessageSquare, Settings2 } from "lucide-react";
import { operationalHealth, priorityCompanyGuideFreshness } from "@/lib/admin/operations";
import { requireAdminActor } from "@/lib/admin/auth";
import { resolveAdminCountResult } from "@/lib/admin/query-results";

export default async function AdminHomePage() {
  const actor = await requireAdminActor("/admin");
  const [feedback, experiences] = await Promise.all([
    actor.supabase.from("feedback_submissions").select("id", { count: "exact", head: true }).in("status", ["new", "triaged"]),
    actor.supabase.from("interview_experiences").select("id", { count: "exact", head: true }).in("status", ["submitted", "needs_changes"]),
  ]);
  const freshness = priorityCompanyGuideFreshness();
  const health = operationalHealth();
  const feedbackCount = resolveAdminCountResult({
    count: feedback.count,
    error: feedback.error,
  });
  const experienceCount = resolveAdminCountResult({
    count: experiences.count,
    error: experiences.error,
  });
  const cards = [
    { href: "/admin/feedback", title: "Feedback requiring triage", value: feedbackCount, detail: "New and triaged private reports.", Icon: MessageSquare },
    { href: "/admin/interview-experiences", title: "Experiences requiring moderation", value: experienceCount, detail: "Submitted or changes-requested contributor reports.", Icon: ClipboardCheck },
    { href: "/admin/company-freshness", title: "Company guides requiring review", value: freshness.filter((item) => item.status === "review_due").length, detail: "A review reminder; it does not change public guidance.", Icon: Activity },
    { href: "/admin/operational-health", title: "Operational configuration", value: `${health.filter((item) => item.configured).length}/${health.length}`, detail: "Configured signals only—not external health probes.", Icon: Settings2 },
  ];
  return <><header className="admin-page-header"><h2>Launch operations</h2><p>Work the smallest queues needed to keep launch feedback, moderation, source review, and configuration visible.</p></header><div className="admin-queue-grid">{cards.map(({ href, title, value, detail, Icon }) => <Link className="admin-queue-card" href={href} key={href}><Icon size={19} aria-hidden="true" /><strong>{value}</strong><h3>{title}</h3><p>{detail}</p></Link>)}</div></>;
}
