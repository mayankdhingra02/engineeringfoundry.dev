import { notFound } from "next/navigation";
import { FeedbackTriageForm } from "@/features/admin/mutation-forms";
import { requireAdminActor } from "@/lib/admin/auth";
import { isCanonicalAdminFeedbackId, resolveAdminFeedbackDetailResult } from "@/lib/admin/query-results";
import { feedbackCategoryLabel, feedbackStatusLabel } from "@/lib/feedback/model";

export default async function AdminFeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireAdminActor(`/admin/feedback/${id}`);
  if (!isCanonicalAdminFeedbackId(id)) notFound();
  const result = await actor.supabase.from("feedback_submissions").select("id,reference_id,category,status,message,page_context,contact_email,contact_consent,submitted_as_authenticated,created_at,admin_note,updated_at").eq("id", id).maybeSingle();
  const data = resolveAdminFeedbackDetailResult({ data: result.data, error: result.error });
  if (!data) notFound();
  return <><header className="admin-page-header"><p><span className="status-pill accent">{feedbackCategoryLabel(data.category)}</span> <span className="status-pill">{feedbackStatusLabel(data.status)}</span></p><h2>{data.reference_id}</h2><p>Received {new Date(data.created_at).toLocaleString()} · {data.submitted_as_authenticated ? "signed-in sender" : "anonymous sender"} · {data.page_context ?? "no page context"}</p></header><article className="admin-original-content"><h3>Original report</h3><p>{data.message}</p></article>{data.contact_email && data.contact_consent && <section className="admin-contact"><h3>Follow-up contact</h3><p>{data.contact_email}</p><small>The sender explicitly consented to follow-up for this report only.</small></section>}<section className="admin-triage"><h3>Private triage</h3><FeedbackTriageForm feedbackId={data.id} currentStatus={data.status} note={data.admin_note} revision={data.updated_at} /></section></>;
}
