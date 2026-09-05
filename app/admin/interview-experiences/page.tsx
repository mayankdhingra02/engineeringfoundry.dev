import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdminInterviewExperienceQueueUnavailable,
  ExperienceModerationForm,
} from "@/features/admin/mutation-forms";
import { requireAdminActor } from "@/lib/admin/auth";
import { getAdminInterviewExperienceQueue } from "@/lib/interview-experiences/queries";
import {
  INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT,
  resolveAdminInterviewExperienceView,
  resolveInterviewExperiencePage,
  type AdminInterviewExperienceView,
} from "@/lib/interview-experiences/private-state";

type Search = {
  page?: string | string[];
  view?: string | string[];
};

function moderationQueueHref(
  page: number,
  view: AdminInterviewExperienceView,
) {
  const params = new URLSearchParams();
  if (view === "published") params.set("view", "published");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/interview-experiences${query ? `?${query}` : ""}`;
}

export default async function AdminInterviewExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const page = resolveInterviewExperiencePage(search.page);
  const view = resolveAdminInterviewExperienceView(search.view);
  const publishedView = view === "published";
  const actor = await requireAdminActor("/admin/interview-experiences");
  const queue = await getAdminInterviewExperienceQueue(actor, page, view);
  if (queue.status === "ready" && page > queue.totalPages) {
    redirect(moderationQueueHref(queue.totalPages, view));
  }
  const from = (page - 1) * INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT;

  return (
    <>
      <header className="admin-page-header">
        <h2>
          {publishedView
            ? "Published interview experiences"
            : "Interview Experience moderation"}
        </h2>
        <p>
          {publishedView
            ? "Review the current public directory and archive a report when a correction, removal, freshness, privacy, or safety concern makes continued publication inappropriate."
            : "Only submitted and needs-changes reports appear here. Review the summary and every submitted round field before approving; request changes or reject anything unsafe."}
        </p>
      </header>
      <nav
        className="admin-experience-views"
        aria-label="Interview Experience administration views"
      >
        <Link
          href={moderationQueueHref(1, "review")}
          aria-current={!publishedView ? "page" : undefined}
        >
          Review queue
        </Link>
        <Link
          href={moderationQueueHref(1, "published")}
          aria-current={publishedView ? "page" : undefined}
        >
          Published reports
        </Link>
      </nav>
      <div className="admin-moderation-list">
        {queue.status === "unavailable" ? (
          <AdminInterviewExperienceQueueUnavailable view={view} />
        ) : queue.items.length ? (
          queue.items.map((experience) => (
            <article className="admin-moderation-card" key={experience.id}>
              <header>
                <div>
                  <span
                    className={`status-pill ${publishedView ? "success" : "warning"}`}
                  >
                    {publishedView
                      ? "published"
                      : experience.status.replaceAll("_", " ")}
                  </span>
                  <h3>
                    {experience.company_name} · {experience.role_title}
                  </h3>
                  <p>
                    {[
                      experience.role_level,
                      experience.region,
                      experience.interview_date,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No additional context"}
                  </p>
                </div>
                <small>
                  {publishedView
                    ? `Last changed ${new Date(experience.updated_at).toLocaleString()}`
                    : experience.submitted_at
                      ? new Date(experience.submitted_at).toLocaleString()
                      : "Not submitted"}
                </small>
              </header>
              <section>
                <h4>Contributor summary</h4>
                <p>{experience.summary}</p>
                <small>
                  Public attribution:{" "}
                  {experience.public_identity === "anonymous"
                    ? "anonymous"
                    : "Engineering Foundry username"}{" "}
                  · Publication consent:{" "}
                  {experience.publication_consent ? "provided" : "not provided"}
                </small>
              </section>
              {experience.preparation_lessons && (
                <section>
                  <h4>Preparation lessons</h4>
                  <p>{experience.preparation_lessons}</p>
                </section>
              )}
              {experience.interview_experience_rounds?.length ? (
                <section>
                  <h4>Submitted round context</h4>
                  <ol>
                    {[...experience.interview_experience_rounds]
                      .sort((left, right) => left.position - right.position)
                      .map((round) => (
                        <li key={`${round.position}-${round.round_type}`}>
                          <strong>{round.round_type}</strong>
                          <span>
                            {round.topic_labels.length
                              ? round.topic_labels.join(" · ")
                              : "No topic labels"}
                          </span>
                          {round.process_notes && <p>{round.process_notes}</p>}
                        </li>
                      ))}
                  </ol>
                </section>
              ) : (
                <section>
                  <h4>Submitted round context</h4>
                  <p>No round context was submitted.</p>
                </section>
              )}
              {experience.review_note && (
                <section className="admin-previous-note">
                  <h4>Current private note</h4>
                  <p>{experience.review_note}</p>
                </section>
              )}
              <ExperienceModerationForm
                experienceId={experience.id}
                revision={experience.updated_at}
                mode={publishedView ? "archive" : "review"}
              />
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>
              {publishedView
                ? "No approved, consented reports are currently public."
                : "No interview experiences need moderation."}
            </strong>
            <p>
              {publishedView
                ? "This is a genuine empty state; archived, withdrawn, rejected, and unconsented reports are not substituted."
                : "Submitted contributor reports will appear here after a contributor sends them for review."}
            </p>
          </div>
        )}
      </div>
      {queue.status === "ready" && queue.items.length > 0 && (
        <nav
          className="admin-pagination"
          aria-label={publishedView
            ? "Published Interview Experience pages"
            : "Interview Experience moderation pages"}
        >
          <p>
            Showing {from + 1}–{from + queue.items.length} of {queue.totalCount}{" "}
            {publishedView ? "published reports" : "reports awaiting moderation"}.
          </p>
          <div>
            {page > 1 && (
              <Link
                className="button button-secondary"
                href={moderationQueueHref(page - 1, view)}
              >
                Previous
              </Link>
            )}
            <span aria-current="page">
              Page {page} of {queue.totalPages}
            </span>
            {page < queue.totalPages && (
              <Link
                className="button button-secondary"
                href={moderationQueueHref(page + 1, view)}
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
