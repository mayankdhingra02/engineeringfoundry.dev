/*
THESIS: My Practice is a quiet return-to-work surface, not a gamified scorecard.
OWN-WORLD: It extends the existing DSA paper-and-ink workspace with the same rust action and green completion language.
STORY: Resume one deterministic next question, understand roadmap coverage, then inspect review and recent work.
FIRST VIEWPORT: Application context when present, one Continue decision, and a compact progress summary.
FORM: Operate-mode extension of the established question library; private state stays subordinate to public learning content.
FINISH: the route is complete only after responsive screenshots, detector output, independent review, and documentation.
*/
import Link from "next/link";
import { ArrowRight, Bookmark, Clock3, RotateCcw, Route, ShieldCheck } from "lucide-react";
import { DSAWorkspacePageLayout } from "@/components/dsa-workspace";
import { dsaCompanies } from "@/data/dsa/interview-prep";
import { dsaInterviewQuestionDatabase } from "@/data/dsa/question-database";
import { RoadmapPreferenceControls } from "@/features/dsa/progress/roadmap-preference-controls";
import { QuestionBrowser } from "@/features/dsa/questions/question-browser";
import { chooseContinueQuestion, getNeedsReview, getRoadmapProgress, getTopicProgress, type DsaProgressMap } from "@/lib/dsa/progress";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

type PracticeApplication = { id: string; company_name: string; company_slug: string | null; role_title: string } | null;

function questionHref(id: string, application: PracticeApplication) {
  const params = new URLSearchParams();
  if (application?.company_slug) params.set("company", application.company_slug);
  if (application?.id) params.set("application", application.id);
  const query = params.toString();
  return `/dsa/questions/${id}${query ? `?${query}` : ""}`;
}

function reviewLibraryHref(application: PracticeApplication) {
  const params = new URLSearchParams({ progress: "review" });
  if (application?.company_slug) params.set("company", application.company_slug);
  if (application?.id) params.set("application", application.id);
  return `/dsa/questions?${params.toString()}`;
}

export function PracticeWorkspace({ signedIn, progress, preferredRoadmap, application, libraryOnly = false }: { signedIn: boolean; progress: DsaProgressMap; preferredRoadmap: RoadmapLevel; application: PracticeApplication; libraryOnly?: boolean }) {
  const rows = Object.values(progress);
  const continueQuestion = chooseContinueQuestion(preferredRoadmap, progress);
  const needsReview = getNeedsReview(progress).slice(0, 6);
  const topics = getTopicProgress(progress).slice(0, 6);
  const recent = rows.filter((row) => row.last_practiced_at).slice(0, 6);
  const roadmap = getRoadmapProgress(preferredRoadmap, progress);
  const representedCompanies = new Set(dsaInterviewQuestionDatabase.flatMap((question) => question.companies.map((association) => association.companySlug))).size;
  const title = libraryOnly ? "Practice Questions" : "My Practice";
  return <DSAWorkspacePageLayout eyebrow={libraryOnly ? "Question database" : undefined} title={title} description={libraryOnly ? "Search public question metadata and, when signed in, update progress without leaving the library." : "Resume the highest-priority work, review weak questions, and keep one account-backed record across the library and roadmaps."} badge={signedIn ? "Private progress · public questions" : "Public metadata"} meta={`${dsaInterviewQuestionDatabase.length} questions · ${representedCompanies} companies represented`}>
    {application && <aside className="dsa-application-context"><div><span>Preparing for</span><strong>{application.company_name} · {application.role_title}</strong><p>Company context shapes this view. Progress remains global to your account.</p></div><Link href={libraryOnly ? "/dsa/questions" : "/dsa/practice"}>Clear context</Link></aside>}
    {!signedIn ? <aside className="dsa-practice-signin"><ShieldCheck size={20} /><div><strong>Keep progress between sessions</strong><p>The public library stays open. Sign in to save statuses, confidence, bookmarks, and private notes.</p></div><Link className="button button-secondary button-sm" href={`/signin?next=${encodeURIComponent(libraryOnly ? "/dsa/questions" : "/dsa/practice")}`}>Sign in</Link></aside> : !libraryOnly && <>
      <section className="dsa-practice-resume" aria-labelledby="dsa-continue-heading"><div><span>Continue</span><h2 id="dsa-continue-heading">{continueQuestion?.title ?? "Choose a question to begin"}</h2><p>{continueQuestion ? "Selected deterministically from review, attempts, roadmap gaps, then recent low-confidence work." : "Your current roadmap has no remaining questions."}</p></div>{continueQuestion && <Link className="button" href={questionHref(continueQuestion.id, application)}>Open question<ArrowRight size={14} /></Link>}</section>
      <section className="dsa-practice-summary" aria-label="Practice summary"><article><span><Route size={16} />{preferredRoadmap.toUpperCase()}</span><strong>{roadmap.completed} / {roadmap.total}</strong><p>Roadmap complete</p></article><article><span><RotateCcw size={16} />Needs review</span><strong>{getNeedsReview(progress).length}</strong><p>Attempts, review, and low confidence</p></article><article><span><Bookmark size={16} />Bookmarks</span><strong>{rows.filter((row) => row.bookmarked).length}</strong><p>Saved for later</p></article><article><span><Clock3 size={16} />Practiced</span><strong>{rows.filter((row) => row.status !== "not_started").length}</strong><p>Questions with activity</p></article></section>
      <section className="dsa-roadmap-preference"><div><span>Preferred roadmap</span><p>Use one level for Continue and completion. You can switch without losing progress.</p></div><RoadmapPreferenceControls preferredRoadmap={preferredRoadmap} /></section>
      <div className="dsa-practice-insights"><section><header><h2>Needs review</h2><Link href={reviewLibraryHref(application)}>Filter library</Link></header>{needsReview.length ? <ul>{needsReview.map(({ question, progress: item }) => <li key={question.id}><Link href={questionHref(question.id, application)}><strong>{question.title}</strong><span>{item.status.replace("_", " ")}{item.confidence ? ` · ${item.confidence} confidence` : ""}</span></Link></li>)}</ul> : <p>No review items yet. Attempted and low-confidence solved questions appear here.</p>}</section><section><header><h2>Recent practice</h2></header>{recent.length ? <ul>{recent.map((item) => <li key={item.question_id}><Link href={questionHref(item.question_id, application)}><strong>{dsaInterviewQuestionDatabase.find((question) => question.id === item.question_id)?.title ?? item.question_id}</strong><span>{item.last_practiced_at ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(item.last_practiced_at)) : ""} · {item.status.replace("_", " ")}</span></Link></li>)}</ul> : <p>Your last six meaningful practice updates will appear here. Page views do not change this list.</p>}</section></div>
      {!!topics.length && <section className="dsa-topic-progress"><header><h2>Topic progress</h2><p>Derived from question activity; one question can contribute to multiple topics.</p></header><div>{topics.map((topic) => <article key={topic.topic}><strong>{topic.topic}</strong><span>{topic.completed} complete · {topic.practiced} practiced · {topic.total} catalog</span></article>)}</div></section>}
    </>}
    <QuestionBrowser companies={dsaCompanies} questions={dsaInterviewQuestionDatabase} progress={progress} signedIn={signedIn} applicationId={application?.id} />
  </DSAWorkspacePageLayout>;
}
