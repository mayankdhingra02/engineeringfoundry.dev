import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { QuestionProgressEditor } from "./question-progress-editor";
import { PreparationActivityControl } from "@/components/preparation-activity-control";
import { emptyProgress, type DsaProgressMap } from "@/lib/dsa/progress";
import type { CanonicalDsaQuestion } from "@/lib/dsa/catalog";

export function DsaQuestionDetail({ question, signedIn, progress, applicationId, companySlug }: { question: CanonicalDsaQuestion; signedIn: boolean; progress: DsaProgressMap; applicationId?: string; companySlug?: string }) {
  const params = new URLSearchParams();
  if (companySlug) params.set("company", companySlug);
  if (applicationId) params.set("application", applicationId);
  const query = params.toString();
  const backHref = `/dsa/questions${query ? `?${query}` : ""}`;
  const row = progress[question.id] ?? emptyProgress(question.id);
  return <div className="dsa-question-detail"><div className="page-width"><Link className="tracker-back-link" href={backHref}><ArrowLeft size={15} />Back to question library</Link><header><div><span>Canonical question · {question.id}</span><h1>{question.title}</h1><p>{question.difficulty} · {[...question.topics, ...question.patterns].slice(0, 5).join(" · ")}</p></div>{question.sourceUrl && <a className="button button-secondary" href={question.sourceUrl} target="_blank" rel="noopener noreferrer">Open on {question.sourceLabel}<ExternalLink size={14} /></a>}</header><div className="dsa-question-detail-grid"><main><section><h2>Practice record</h2><p>Use status for workflow and confidence for your own judgment. “Review” counts as completed while keeping the question in your review queue.</p>{signedIn ? <QuestionProgressEditor questionId={question.id} progress={row} /> : <><PreparationActivityControl track="dsa" itemId={question.id} noun="practice" /><aside className="dsa-practice-signin"><ShieldCheck size={20} /><div><strong>Sign in to keep private notes</strong><p>The source and public metadata remain available without an account.</p></div><Link className="button button-secondary button-sm" href={`/signin?next=${encodeURIComponent(`/dsa/questions/${question.id}${query ? `?${query}` : ""}`)}`}>Sign in</Link></aside></>}</section></main><aside><section><h2>Current state</h2><dl><div><dt>Status</dt><dd>{row.status.replace("_", " ")}</dd></div><div><dt>Confidence</dt><dd>{row.confidence ?? "Not set"}</dd></div><div><dt>Bookmarked</dt><dd>{row.bookmarked ? "Yes" : "No"}</dd></div><div><dt>First attempted</dt><dd>{row.first_attempted_at ? new Date(row.first_attempted_at).toLocaleDateString() : "Not yet"}</dd></div><div><dt>Last practiced</dt><dd>{row.last_practiced_at ? new Date(row.last_practiced_at).toLocaleDateString() : "Not yet"}</dd></div></dl></section></aside></div></div></div>;
}
