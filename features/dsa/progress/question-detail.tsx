import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { QuestionProgressEditor } from "./question-progress-editor";
import { PreparationActivityControl } from "@/components/preparation-activity-control";
import { TrackedLink } from "@/components/tracked-action";
import { emptyProgress, type DsaProgressMap } from "@/lib/dsa/progress";
import type { CanonicalDsaQuestion } from "@/lib/dsa/catalog";

type DsaQuestionDetailProps = {
  question: CanonicalDsaQuestion;
  accountPlatformAvailable: boolean;
  signedIn: boolean;
  progress: DsaProgressMap;
  applicationId?: string;
  companySlug?: string;
};

export function DsaQuestionDetail({ question, accountPlatformAvailable, signedIn, progress, applicationId, companySlug }: DsaQuestionDetailProps) {
  const params = new URLSearchParams();
  if (companySlug) params.set("company", companySlug);
  if (applicationId) params.set("application", applicationId);
  const query = params.toString();
  const backHref = `/dsa/questions${query ? `?${query}` : ""}`;
  const row = progress[question.id] ?? emptyProgress(question.id);
  const practiceGuidance = signedIn
    ? "Use status for workflow and confidence for your own judgment. Review counts as completed while keeping the question in your review queue."
    : accountPlatformAvailable
      ? "Use the browser-local completion control below. Sign in to add account status, confidence, bookmarks, and private notes."
      : "Use the completion control below for browser-local practice. Account status, confidence, bookmarks, and private notes are unavailable in this configuration.";

  return <div className="dsa-question-detail"><div className="page-width">
    <Link className="tracker-back-link" href={backHref}><ArrowLeft size={15} />Back to question library</Link>
    <header><div><span>Canonical question · {question.id}</span><h1>{question.title}</h1><p>{question.difficulty} · {[...question.topics, ...question.patterns].slice(0, 5).join(" · ")}</p></div>{question.sourceUrl && <TrackedLink className="button button-secondary" href={question.sourceUrl} target="_blank" event="dsa_practice_started" properties={{ track: "dsa", problem_id: question.id, source: question.sourceType }}>Open on {question.sourceLabel}<ExternalLink size={14} /></TrackedLink>}</header>
    <div className="dsa-question-detail-grid"><main><section><h2>Practice record</h2><p>{practiceGuidance}</p>{signedIn ? <QuestionProgressEditor questionId={question.id} progress={row} /> : <>
      <PreparationActivityControl track="dsa" itemId={question.id} noun="practice" accountPlatformAvailable={accountPlatformAvailable} />
      {accountPlatformAvailable ? <aside className="dsa-practice-signin"><ShieldCheck size={20} /><div><strong>Sign in to keep private notes</strong><p>The source and public metadata remain available without an account.</p></div><Link className="button button-secondary button-sm" href={`/signin?next=${encodeURIComponent(`/dsa/questions/${question.id}${query ? `?${query}` : ""}`)}`}>Sign in</Link></aside> : <aside className="dsa-practice-signin"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Private notes are unavailable in this configuration</strong><p>You can still record completion in this browser and use the public source and metadata.</p></div></aside>}
    </>}</section></main><aside><section>{signedIn ? <><h2>Current state</h2><dl><div><dt>Status</dt><dd>{row.status.replace("_", " ")}</dd></div><div><dt>Confidence</dt><dd>{row.confidence ?? "Not set"}</dd></div><div><dt>Bookmarked</dt><dd>{row.bookmarked ? "Yes" : "No"}</dd></div><div><dt>First attempted</dt><dd>{row.first_attempted_at ? new Date(row.first_attempted_at).toLocaleDateString() : "Not yet"}</dd></div><div><dt>Last practiced</dt><dd>{row.last_practiced_at ? new Date(row.last_practiced_at).toLocaleDateString() : "Not yet"}</dd></div></dl></> : accountPlatformAvailable ? <><h2>Account progress</h2><p>Sign in to view account status, confidence, bookmarks, and notes. Browser-local completion is recorded separately.</p></> : <><h2>Browser-local practice</h2><p>Use the completion control on this page for local practice. Account status, confidence, bookmarks, and notes are not shown while account features are unavailable.</p></>}</section></aside></div>
  </div></div>;
}
