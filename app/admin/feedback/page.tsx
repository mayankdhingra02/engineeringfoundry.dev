import Link from "next/link";
import { requireAdminActor } from "@/lib/admin/auth";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, feedbackCategoryLabel, feedbackStatusLabel } from "@/lib/feedback/model";

type Search = { status?: string; category?: string };

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const actor = await requireAdminActor("/admin/feedback");
  const status = FEEDBACK_STATUSES.find((item) => item === search.status);
  const category = FEEDBACK_CATEGORIES.find((item) => item.id === search.category)?.id;
  let query = actor.supabase.from("feedback_submissions").select("id,reference_id,category,status,page_context,message,created_at").order("created_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  const { data } = await query;
  return <><header className="admin-page-header"><h2>Feedback queue</h2><p>Original reports are read-only. Status and private operator notes are the only triage changes.</p></header><form className="admin-filter-bar" method="get"><label>Status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{FEEDBACK_STATUSES.map((item) => <option key={item} value={item}>{feedbackStatusLabel(item)}</option>)}</select></label><label>Category<select name="category" defaultValue={category ?? ""}><option value="">All categories</option>{FEEDBACK_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button className="button button-secondary" type="submit">Filter</button></form><div className="admin-list" aria-label="Feedback submissions">{data?.length ? data.map((item) => <Link href={`/admin/feedback/${item.id}`} key={item.id} className="admin-list-row"><div><span className="status-pill accent">{feedbackCategoryLabel(item.category)}</span><h3>{item.message.slice(0, 150)}{item.message.length > 150 ? "…" : ""}</h3><p>{new Date(item.created_at).toLocaleString()} · {item.page_context ?? "No page context"}</p></div><span className={`status-pill ${item.status === "new" ? "warning" : ""}`}>{feedbackStatusLabel(item.status)}</span></Link>) : <div className="empty-state"><strong>No feedback matches these filters.</strong><p>New reports will appear here for authorized operators only.</p></div>}</div></>;
}
