import { AdminInterviewExperienceQueueUnavailable, ExperienceModerationForm } from "@/features/admin/mutation-forms";
import { requireAdminActor } from "@/lib/admin/auth";
import { getAdminInterviewExperienceQueue } from "@/lib/interview-experiences/queries";

export default async function AdminInterviewExperiencesPage() {
  const actor = await requireAdminActor("/admin/interview-experiences");
  const queue = await getAdminInterviewExperienceQueue(actor);

  return <>
    <header className="admin-page-header"><h2>Interview Experience moderation</h2><p>Only submitted and needs-changes reports appear here. Review the summary and every submitted round field before approving; request changes or reject anything unsafe.</p></header>
    <div className="admin-moderation-list">{queue.status === "unavailable" ? <AdminInterviewExperienceQueueUnavailable /> : queue.items.length ? queue.items.map((experience) => <article className="admin-moderation-card" key={experience.id}>
      <header><div><span className="status-pill warning">{experience.status.replaceAll("_", " ")}</span><h3>{experience.company_name} · {experience.role_title}</h3><p>{[experience.role_level, experience.region, experience.interview_date].filter(Boolean).join(" · ") || "No additional context"}</p></div><small>{experience.submitted_at ? new Date(experience.submitted_at).toLocaleString() : "Not submitted"}</small></header>
      <section><h4>Contributor summary</h4><p>{experience.summary}</p><small>Public attribution: {experience.public_identity === "anonymous" ? "anonymous" : "Engineering Foundry username"} · Publication consent: {experience.publication_consent ? "provided" : "not provided"}</small></section>
      {experience.preparation_lessons && <section><h4>Preparation lessons</h4><p>{experience.preparation_lessons}</p></section>}
      {experience.interview_experience_rounds?.length ? <section><h4>Submitted round context</h4><ol>{[...experience.interview_experience_rounds].sort((left, right) => left.position - right.position).map((round) => <li key={`${round.position}-${round.round_type}`}><strong>{round.round_type}</strong><span>{round.topic_labels.length ? round.topic_labels.join(" · ") : "No topic labels"}</span>{round.process_notes && <p>{round.process_notes}</p>}</li>)}</ol></section> : <section><h4>Submitted round context</h4><p>No round context was submitted.</p></section>}
      {experience.review_note && <section className="admin-previous-note"><h4>Current private note</h4><p>{experience.review_note}</p></section>}
      <ExperienceModerationForm experienceId={experience.id} revision={experience.updated_at} />
    </article>) : <div className="empty-state"><strong>No interview experiences need moderation.</strong><p>Submitted contributor reports will appear here once the existing P0.3 workflow receives them.</p></div>}</div>
    {queue.status === "ready" && queue.items.length === queue.limit && <p className="muted">Showing the first {queue.limit} reports awaiting moderation. Work these reports before relying on this view as the complete queue.</p>}
  </>;
}
