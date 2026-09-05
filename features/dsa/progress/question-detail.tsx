import Link from "next/link";
/*
THESIS: A question page is an interview rehearsal brief, not an outbound-link launcher.
OWN-WORLD: Existing Foundry paper, ink, hairline rules, rust actions, and green evidence states.
STORY: Establish provenance, attempt recognition, clarify, baseline, plan, test, then record private reflection.
FIRST VIEWPORT: Identity and source lead directly into the practice brief; the external destination remains visible but secondary.
FORM: Operate-mode extension of the established DSA workspace, with one sequential checkpoint spine. Surface seed: f31e86c0.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import { ArrowLeft, Check, ExternalLink, Eye, ShieldCheck } from "lucide-react";
import { QuestionProgressEditor } from "./question-progress-editor";
import { PreparationActivityControl } from "@/components/preparation-activity-control";
import { TrackedLink } from "@/components/tracked-action";
import { emptyProgress, type DsaProgressMap } from "@/lib/dsa/progress";
import type { CanonicalDsaQuestion } from "@/lib/dsa/catalog";
import { PracticeModePanel } from "@/features/dsa/practice/practice-mode-panel";
import { dsaPracticeModeDefinitions, type DsaPracticeMode } from "@/lib/dsa/practice-attempt";

type DsaQuestionDetailProps = {
  question: CanonicalDsaQuestion;
  accountPlatformAvailable: boolean;
  signedIn: boolean;
  progress: DsaProgressMap;
  applicationId?: string;
  companySlug?: string;
  practiceMode: DsaPracticeMode;
};

export function DsaQuestionDetail({ question, accountPlatformAvailable, signedIn, progress, applicationId, companySlug, practiceMode }: DsaQuestionDetailProps) {
  const params = new URLSearchParams();
  if (companySlug) params.set("company", companySlug);
  if (applicationId) params.set("application", applicationId);
  params.set("mode", practiceMode);
  const query = params.toString();
  const backHref = `/dsa/questions${query ? `?${query}` : ""}`;
  const row = progress[question.id] ?? emptyProgress(question.id);
  const mode = dsaPracticeModeDefinitions.find((item) => item.id === practiceMode) ?? dsaPracticeModeDefinitions[2];
  const defaultExposure = row.status === "solved" ? "solved_before" : row.status === "not_started" ? "unseen" : "prompt_seen";
  const practiceGuidance = signedIn
    ? "Use status for workflow and confidence for your own judgment. Review counts as completed while keeping the question in your review queue."
    : accountPlatformAvailable
      ? "Use the browser-local completion control below. Sign in to add account status, confidence, bookmarks, and private notes."
      : "Use the completion control below for browser-local practice. Account status, confidence, bookmarks, and private notes are unavailable right now.";

  const provenance = question.sourceClass === "engineering-foundry-original"
    ? "Original Engineering Foundry prompt"
    : `External reference · ${question.sourceLabel}`;
  const guidedDebrief = <>
    <p>{question.whyItBelongs}</p>
    <details className="dsa-recognition-reveal"><summary><Eye size={15} aria-hidden="true" />Reveal recognition prompt</summary><p>{question.recognitionPrompt}</p></details>
    <ol className="dsa-question-sequence">
      <li><span>1</span><div><h3>Clarify the contract</h3><ul>{question.clarifyingQuestions?.map((item) => <li key={item}>{item}</li>)}</ul></div></li>
      <li><span>2</span><div><h3>Anchor with brute force</h3><p>{question.bruteForceCheckpoint}</p></div></li>
      <li><span>3</span><div><h3>Commit to a target</h3><p>{question.complexityTarget}</p><strong>{question.interviewBehaviorFocus}</strong></div></li>
      <li><span>4</span><div><h3>Test before declaring done</h3><ul>{question.testCasePrompts?.map((item) => <li key={item}>{item}</li>)}</ul></div></li>
    </ol>
    <details className="dsa-followup-reveal"><summary>Follow-up variants</summary><ul>{question.followUpVariants?.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul></details>
  </>;
  return <div className="dsa-question-detail" data-impeccable-seed="f31e86c0"><div className="page-width">
    <Link className="tracker-back-link" href={backHref}><ArrowLeft size={15} />Back to question library</Link>
    <header><div><span>Foundry 75 · v{question.catalogVersion}</span><h1>{question.title}</h1><p>{question.difficulty}{mode.labelsHidden ? " · topic and pattern hidden for this mode" : ` · ${[...question.topics, ...question.patterns].slice(0, 5).join(" · ")}`}</p></div>{question.sourceUrl && <TrackedLink className="button button-secondary" href={question.sourceUrl} target="_blank" event="dsa_practice_started" properties={{ track: "dsa", problem_id: question.id, source: question.sourceType }}>Open full prompt<ExternalLink size={14} /></TrackedLink>}</header>
    <div className="dsa-question-detail-grid"><div className="dsa-question-detail-content">
      <PracticeModePanel questionId={question.id} questionTitle={question.title} mode={practiceMode} signedIn={signedIn} accountPlatformAvailable={accountPlatformAvailable} defaultExposure={defaultExposure} />
      <section className="dsa-question-brief" aria-labelledby="practice-brief-heading">
        <h2 id="practice-brief-heading">{mode.labelsHidden ? "Blind practice brief" : "Practice brief"}</h2>
        {question.originalPrompt ? <blockquote>{question.originalPrompt}</blockquote> : <div className="dsa-source-boundary"><ExternalLink size={16} aria-hidden="true" /><p>The full problem statement is hosted by {question.sourceLabel}. Engineering Foundry provides original interview-preparation guidance and does not reproduce the statement or editorial.</p></div>}
        {mode.labelsHidden ? <><p className="dsa-hidden-mode-instruction">Work from the full prompt first. State the clues, anti-clues, invariant, and a concrete example before opening Engineering Foundry guidance.</p><details className="dsa-guided-debrief"><summary><Eye size={15} aria-hidden="true" />Reveal guided debrief and pattern clues</summary><div className="dsa-guided-debrief-content">{guidedDebrief}</div></details></> : guidedDebrief}
      </section>
      <section><h2>Practice record</h2><p>{practiceGuidance}</p>{signedIn ? <QuestionProgressEditor questionId={question.id} progress={row} /> : <>
      <PreparationActivityControl track="dsa" itemId={question.id} noun="practice" accountPlatformAvailable={accountPlatformAvailable} />
      {accountPlatformAvailable ? <aside className="dsa-practice-signin"><ShieldCheck size={20} /><div><strong>Sign in to keep private notes</strong><p>The source and public metadata remain available without an account.</p></div><Link className="button button-secondary button-sm" href={`/signin?next=${encodeURIComponent(`/dsa/questions/${question.id}${query ? `?${query}` : ""}`)}`}>Sign in</Link></aside> : <aside className="dsa-practice-signin"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Private notes are unavailable right now</strong><p>You can still record completion in this browser and use the public source and metadata.</p></div></aside>}
    </>}</section></div><aside><section className="dsa-question-provenance"><h2>Question provenance</h2><dl><div><dt>Source</dt><dd>{provenance}</dd></div><div><dt>Catalog</dt><dd>Foundry 75 v{question.catalogVersion}</dd></div><div><dt>Roles</dt><dd>{question.roleRelevance?.join(" · ")}</dd></div><div><dt>Prompt</dt><dd>{question.originalPrompt ? "Hosted here" : "Hosted externally"}</dd></div></dl></section><section>{signedIn ? <><h2>Current state</h2><dl><div><dt>Status</dt><dd>{row.status.replace("_", " ")}</dd></div><div><dt>Confidence</dt><dd>{row.confidence ?? "Not set"}</dd></div><div><dt>Bookmarked</dt><dd>{row.bookmarked ? "Yes" : "No"}</dd></div><div><dt>First attempted</dt><dd>{row.first_attempted_at ? new Date(row.first_attempted_at).toLocaleDateString() : "Not yet"}</dd></div><div><dt>Last practiced</dt><dd>{row.last_practiced_at ? new Date(row.last_practiced_at).toLocaleDateString() : "Not yet"}</dd></div></dl></> : accountPlatformAvailable ? <><h2>Account progress</h2><p>Sign in to view account status, confidence, bookmarks, and notes. Browser-local completion is recorded separately.</p></> : <><h2>Browser-local practice</h2><p>Use the completion control on this page for local practice. Account status, confidence, bookmarks, and notes are not shown while account features are unavailable.</p></>}</section></aside></div>
    </div></div>;
}
