import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/admin/auth";
import { ADMIN_FEEDBACK_QUEUE_LIMIT, resolveAdminFeedbackPage, resolveAdminFeedbackQueueResult } from "@/lib/admin/query-results";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, feedbackCategoryLabel, feedbackStatusLabel } from "@/lib/feedback/model";

type Search = { status?: string; category?: string; page?: string };

function feedbackQueueHref(page: number, status?: string, category?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/feedback?${query}` : "/admin/feedback";
}

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const actor = await requireAdminActor("/admin/feedback");
  const status = FEEDBACK_STATUSES.find((item) => item === search.status);
  const category = FEEDBACK_CATEGORIES.find((item) => item.id === search.category)?.id;
  const page = resolveAdminFeedbackPage(search.page);
  const from = (page - 1) * ADMIN_FEEDBACK_QUEUE_LIMIT;
  let query = actor.supabase.from("feedback_submissions").select("id,reference_id,category,status,page_context,message,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("id", { ascending: true }).range(from, from + ADMIN_FEEDBACK_QUEUE_LIMIT - 1);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  const result = await query;
  const queue = resolveAdminFeedbackQueueResult({ data: result.data, error: result.error, count: result.count }, page);
  if (page > queue.totalPages) redirect(feedbackQueueHref(queue.totalPages, status, category));
  const firstVisible = from + 1;
  const lastVisible = from + queue.items.length;
  return <><header className="admin-page-header"><h2>Feedback queue</h2><p>Original reports are read-only. Status and private operator notes are the only triage changes.</p></header><form className="admin-filter-bar" method="get"><label>Status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{FEEDBACK_STATUSES.map((item) => <option key={item} value={item}>{feedbackStatusLabel(item)}</option>)}</select></label><label>Category<select name="category" defaultValue={category ?? ""}><option value="">All categories</option>{FEEDBACK_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button className="button button-secondary" type="submit">Filter</button></form><div className="admin-list" aria-label="Feedback submissions">{queue.items.length ? queue.items.map((item) => <Link href={`/admin/feedback/${item.id}`} key={item.id} className="admin-list-row"><div><span className="status-pill accent">{feedbackCategoryLabel(item.category)}</span><h3>{item.message.slice(0, 150)}{item.message.length > 150 ? "…" : ""}</h3><p>{new Date(item.created_at).toLocaleString()} · {item.page_context ?? "No page context"}</p></div><span className={`status-pill ${item.status === "new" ? "warning" : ""}`}>{feedbackStatusLabel(item.status)}</span></Link>) : <div className="empty-state"><strong>No feedback matches these filters.</strong><p>New reports will appear here for authorized operators only.</p></div>}</div>{queue.items.length > 0 && <nav className="admin-pagination" aria-label="Feedback queue pages"><p>Showing {firstVisible}–{lastVisible} of {queue.totalCount} matching reports.</p><div>{page > 1 && <Link className="button button-secondary" href={feedbackQueueHref(page - 1, status, category)}>Previous</Link>}<span>Page {page} of {queue.totalPages}</span>{page < queue.totalPages && <Link className="button button-secondary" href={feedbackQueueHref(page + 1, status, category)}>Next</Link>}</div></nav>}</>;
}
