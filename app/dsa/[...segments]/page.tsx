import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Braces, CircleAlert, Gauge, Network } from "lucide-react";
import { Suspense } from "react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { DSAArticleLayout, DSAComingSoon, DSAHeading, DSANote } from "@/components/dsa-learning";
import { RoadmapComingSoon, RoadmapTimeline } from "@/components/dsa-roadmap-timeline";
import { RoadmapSelector } from "@/components/dsa-roadmaps";
import { DSAWorkspacePageLayout } from "@/components/dsa-workspace";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { QuestionList } from "@/components/question-list";
import { DSAOverviewGuide, LanguageComparisonGuide, ProblemSolvingFrameworkGuide } from "@/content/dsa/guides";
import { PythonDSAGuide } from "@/content/dsa/python";
import { JavaDSAGuide } from "@/content/dsa/java";
import { getDsaCurriculumPage } from "@/data/dsa/curriculum";
import { dsaPatterns, questionsForTopic, roadmapStages, topicBySlug } from "@/data/dsa";
import { dsaCompanies, getDsaCompany } from "@/data/dsa/interview-prep";
import { dsaLanguages, getDsaLanguage } from "@/data/dsa/languages";
import { dsaInterviewQuestionDatabase, questionsForInterviewCompany } from "@/data/dsa/question-database";
import { getCanonicalDsaQuestion } from "@/lib/dsa/catalog";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getDsaWorkspaceState } from "@/lib/dsa/queries";
import { filterDsaQuestionsBySearch } from "@/lib/dsa/question-search";
import { PracticeWorkspace } from "@/features/dsa/progress/practice-workspace";
import { DsaQuestionDetail } from "@/features/dsa/progress/question-detail";
import { getCoreRoadmapQuestionCounts } from "@/data/dsa/core-roadmap";
import { dsaRoadmapDurations, dsaRoadmapRoles, getDsaRoadmap } from "@/data/dsa/roadmaps";
import { CompanyDirectory } from "@/features/dsa/questions/company-directory";
import { QuestionBrowser } from "@/features/dsa/questions/question-browser";
import { LevelRoadmapExperience } from "@/features/dsa/roadmap/level-roadmap-experience";
import { RoadmapExperience } from "@/features/dsa/roadmap/roadmap-experience";
import { StudyPlanPage } from "@/features/dsa/study-plans/study-plan-page";
import { CodingInterviewStrategyPage } from "@/features/dsa/strategy/strategy-page";
import { createPageMetadata } from "@/lib/metadata";
import { buildDsaStaticParams } from "@/lib/public-route-inventory";

type PageProps = { params: Promise<{ segments: string[] }>; searchParams: Promise<{ application?: string; company?: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return buildDsaStaticParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segments } = await params;
  const path = `/dsa/${segments.join("/")}` as `/${string}`;
  if (segments.length === 2 && (segments[0] === "companies" || segments[0] === "company-questions")) {
    const company = getDsaCompany(segments[1]);
    if (!company) notFound();
    return createPageMetadata({ title: `${company.name} Coding Interview Questions`, description: `Browse the current ${company.name} coding interview question metadata. Demo company associations are clearly labeled until a verified dataset is supplied.`, path: `/dsa/companies/${company.slug}` });
  }
  if (segments.length === 3 && segments[0] === "roadmaps") {
    const roadmap = getDsaRoadmap(segments[1], segments[2]);
    if (!roadmap) notFound();
    return createPageMetadata({ title: `${roadmap.role} — ${roadmap.durationDays} Day DSA Roadmap`, description: roadmap.description, path });
  }
  if (segments.length === 1 && segments[0] === "study-plans") return createPageMetadata({ title: "30, 60 & 90 Day Coding Interview Study Plans", description: "Choose an SDE I, SDE II, or Senior role-aware coding interview plan and a 30, 60, or 90-day preparation timeline.", path: "/dsa/study-plans" });
  if (segments.length === 1 && segments[0] === "interview-strategy") return createPageMetadata({ title: "Coding Interview Strategy", description: "A practical playbook for clarifying, solving, coding, testing, debugging, and communicating during coding interviews.", path: "/dsa/strategy" });
  if (segments.length === 1 && segments[0] === "roadmap") return createPageMetadata({ title: "Level-Specific DSA Interview Roadmaps", description: "Choose an SDE I, SDE II, or SDE III+ roadmap with distinct priorities, stages, and interview expectations.", path: "/dsa/roadmap" });
  if (segments.length === 2 && segments[0] === "roadmap" && segments[1] === "topic-map") return createPageMetadata({ title: "DSA Topic Dependency Map", description: "Explore the visual prerequisite order for 18 connected coding-interview topics.", path: "/dsa/roadmap/topic-map" });
  const curriculumPage = getDsaCurriculumPage(path);
  if (curriculumPage) return createPageMetadata({ title: curriculumPage.title, description: curriculumPage.description ?? `${curriculumPage.title} for coding interview preparation.`, path });
  if (segments.length === 1 && (segments[0] === "questions" || segments[0] === "practice")) return createPageMetadata({ title: "DSA Practice Questions", description: "Search and filter Engineering Foundry's public DSA question metadata by company, difficulty, topic, and source.", path: "/dsa/questions" });
  if (segments.length === 2 && segments[0] === "questions") {
    const question = getCanonicalDsaQuestion(segments[1]); if (!question?.inQuestionBrowser) notFound();
    return createPageMetadata({ title: `${question.title} Practice`, description: `Open public source metadata and record practice for ${question.title}. Account-backed notes are available only when account features are enabled.`, path });
  }
  if (segments.length === 1 && (segments[0] === "companies" || segments[0] === "company-questions")) return createPageMetadata({ title: "Company Tagged Coding Questions", description: "Browse company-specific coding interview preparation pages. Current company associations are clearly labeled demonstration data.", path: "/dsa/companies" });
  if (segments.length === 1 && segments[0] === "patterns") return createPageMetadata({ title: "Coding Interview Pattern Index", description: "A concise index of common coding interview patterns and recognition signals.", path });
  if (segments.length === 1) {
    const topic = topicBySlug.get(segments[0]);
    if (topic) return createPageMetadata({ title: `${topic.name} Interview Questions & Roadmap`, description: `${topic.summary} Explore original guidance, common patterns, and public ${topic.name.toLowerCase()} practice links.`, path });
  }
  notFound();
}

function CompanyQuestionsIndex() {
  const representedCompanies = new Set(dsaInterviewQuestionDatabase.flatMap((question) => question.companies.map((association) => association.companySlug))).size;
  return <DSAWorkspacePageLayout eyebrow="Company question index" title="Company Tagged Questions" description="Choose a company to open a focused question browser. Current company associations are demonstration data, not claims about interview history." badge="Demo company tags" meta={`${dsaCompanies.length} company routes · ${representedCompanies} represented in the current sample`}><CompanyDirectory companies={dsaCompanies} questions={dsaInterviewQuestionDatabase} /></DSAWorkspacePageLayout>;
}

async function CompanyPage({ companySlug }: { companySlug: string }) {
  const company = getDsaCompany(companySlug); if (!company) notFound();
  const questions = questionsForInterviewCompany(companySlug);
  const topicCount = new Set(questions.flatMap((question) => question.topics)).size;
  const state = await getDsaWorkspaceState();
  const badge = state.signedIn ? "Private progress · demo associations" : state.accountPlatformAvailable ? "Demo associations" : "Account progress unavailable · demo associations";
  return <DSAWorkspacePageLayout eyebrow="Company question browser" title={`${company.name} Coding Interview Questions`} description={`Filter the current ${company.name} demonstration associations by difficulty, topic, source, or title. No frequency claims are shown.`} badge={badge} meta={`${questions.length} sample question${questions.length === 1 ? "" : "s"} · ${topicCount} topic${topicCount === 1 ? "" : "s"}`}><QuestionBrowser companies={dsaCompanies} questions={dsaInterviewQuestionDatabase} fixedCompanySlug={companySlug} progress={state.progress} signedIn={state.signedIn} accountPlatformAvailable={state.accountPlatformAvailable} /></DSAWorkspacePageLayout>;
}

function LanguageIndex() {
  const page = getDsaCurriculumPage("/dsa/languages")!;
  const published = dsaLanguages.filter((language) => language.status === "published");
  return <DSAArticleLayout page={page} showPager={false} variant="language"><p className="dsa-language-index-intro">Assumes you already know how to program. Choose the language you will use and jump straight to interview syntax, collections, and templates.</p><div className="dsa-language-choice-list">{published.map((language) => <Link href={`/dsa/languages/${language.slug}`} key={language.slug}><span><Braces size={16} />Reference</span><div><h2>{language.name}</h2><p>{language.description}</p></div><ArrowRight size={15} /></Link>)}</div><DSAHeading level={2} id="which-language">Which language should I use for interviews?</DSAHeading><div className="dsa-language-comparison"><article><strong>Python</strong><ul><li>Less boilerplate and fast implementation</li><li>Excellent built-in collections</li><li>Dynamic typing can hide mistakes</li></ul></article><article><strong>Java</strong><ul><li>Explicit types and strong collections</li><li>Implementation details stay visible</li><li>More ceremony under time pressure</li></ul></article></div><blockquote>Use the language in which you can implement correct solutions fastest while comfortably explaining its data structures and complexity.</blockquote></DSAArticleLayout>;
}

function LanguagePage({ slug }: { slug: string }) {
  const language = getDsaLanguage(slug); if (!language) notFound();
  const page = getDsaCurriculumPage(`/dsa/languages/${slug}`)!;
  if (slug === "python") return <DSAArticleLayout page={page} variant="language"><PythonDSAGuide /></DSAArticleLayout>;
  if (slug === "java") return <DSAArticleLayout page={page} variant="language"><JavaDSAGuide /></DSAArticleLayout>;
  return <DSAComingSoon page={page} />;
}

function RoadmapIndex() {
  const page = getDsaCurriculumPage("/dsa/roadmaps")!;
  return <DSAArticleLayout page={page} showPager={false}><p>Choose a target level and available preparation window. Roadmaps distinguish emphasis by role while leaving room for your baseline, interview date, and company-specific process.</p><DSANote title="Need the prerequisite order?"><p>Open the <Link href="/dsa/roadmap/topic-map">interactive topic map</Link> to explore core dependencies before choosing a time-boxed study plan.</p></DSANote><RoadmapSelector /><DSAHeading level={2} id="roadmap-matrix">Roadmap matrix</DSAHeading><div className="dsa-roadmap-matrix">{dsaRoadmapRoles.map((role) => <article key={role.slug}><span>{role.name}</span><p>{role.focus}</p><div>{dsaRoadmapDurations.map((days) => <Link href={`/dsa/roadmaps/${role.slug}/${days}-day`} key={days}>{days} days{role.slug === "sde-2" && days === 60 && <small>Full example</small>}</Link>)}</div></article>)}</div><DSAHeading level={2} id="how-role-focus-differs">How role focus differs</DSAHeading><p>Earlier-career plans emphasize core structures and common medium patterns. Mid-level plans add stronger graph, interval, dynamic-programming, company-targeted, and simulation work. Senior plans should still respect coding fluency while placing more attention on decomposition, tradeoffs, communication, edge cases, and testing.</p><DSANote title="Treat the plan as editable"><p>These routes are planning frameworks, not claims about every company’s process or guarantees about preparation outcomes.</p></DSANote></DSAArticleLayout>;
}

async function LevelRoadmapPage() {
  const state = await getDsaWorkspaceState();
  const badge = state.signedIn ? "Account-backed progress" : state.accountPlatformAvailable ? "SDE I · SDE II · SDE III+" : "Account progress unavailable · public roadmap";
  return <DSAWorkspacePageLayout eyebrow="Level-specific interview preparation" title="DSA Roadmaps" description="Choose your level, preparation window, and optional target company to get a focused plan from the shared curriculum." badge={badge} meta="Linkable plans · researched company overlays · no fake readiness"><LevelRoadmapExperience accountProgress={state.progress} signedIn={state.signedIn} preferredRoadmap={state.preferredRoadmap} accountPlatformAvailable={state.accountPlatformAvailable} /></DSAWorkspacePageLayout>;
}

function TopicDependencyMapPage() {
  const questionCounts = getCoreRoadmapQuestionCounts(dsaInterviewQuestionDatabase);
  return <DSAWorkspacePageLayout eyebrow="Topic dependency view" title="DSA Topic Map" description="Follow the prerequisite order for core data structures and patterns, then open focused practice sets from the map." badge="18 connected topics" meta="Question counts derived from the current database"><Suspense fallback={<div className="empty-inline" role="status" aria-live="polite">Loading interactive roadmap…</div>}><RoadmapExperience questionCounts={questionCounts} /></Suspense></DSAWorkspacePageLayout>;
}

function StudyPlansPage() {
  return <DSAWorkspacePageLayout eyebrow="Role-aware interview preparation" title="Study Plans" description="Choose your target level and interview timeline. We'll show you what to prioritize and when." badge="30 / 60 / 90 days" meta="Guidance only · no account or progress tracking required"><Suspense fallback={<div className="empty-inline" role="status" aria-live="polite">Loading study plan controls…</div>}><StudyPlanPage accountPlatformAvailable={isAccountPlatformAvailable()} /></Suspense></DSAWorkspacePageLayout>;
}

function RoadmapPage({ roleSlug, durationSegment }: { roleSlug: string; durationSegment: string }) {
  const roadmap = getDsaRoadmap(roleSlug, durationSegment); if (!roadmap) notFound();
  const page = getDsaCurriculumPage(`/dsa/roadmaps/${roleSlug}/${durationSegment}`)!;
  return <DSAArticleLayout page={{ ...page, title: `${roadmap.role} — ${roadmap.durationDays} Day DSA Roadmap`, description: roadmap.description }} showPager={false}>{roadmap.status === "published" ? <RoadmapTimeline roadmap={roadmap} /> : <RoadmapComingSoon roadmap={roadmap} />}</DSAArticleLayout>;
}

function PatternIndex() {
  const page = { id: "dsa-patterns", title: "Coding Interview Pattern Index", slug: "/dsa/patterns", type: "page" as const, category: "Patterns", status: "published" as const, description: "A compact map of reusable solution shapes, recognition signals, and common mistakes.", estimatedReadTime: 5 };
  return <DSAArticleLayout page={page} showPager={false}><p>Patterns help compress search space, but they are useful only when connected to recognition signals and an invariant. Use this index to name weak areas, then practice deriving the approach.</p><div className="pattern-grid">{dsaPatterns.map((pattern) => { const questionCount = filterDsaQuestionsBySearch(dsaInterviewQuestionDatabase, pattern.slug).length; return <article key={pattern.id}><h2>{pattern.name}</h2><p>{pattern.summary}</p><h3>Recognition signals</h3><ul>{pattern.recognitionSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul><h3>Common mistakes</h3><ul>{pattern.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>{questionCount > 0 ? <Link className="card-link" href={`/dsa/questions?q=${encodeURIComponent(pattern.slug)}`}>Practice {questionCount} matching question{questionCount === 1 ? "" : "s"}<ArrowRight size={14} /></Link> : <span className="pattern-grid-empty">No matching questions cataloged yet.</span>}</article>; })}</div><DSAHeading level={2} id="use-patterns-well">Use patterns without memorizing answers</DSAHeading><p>For each attempt, record the clue that suggested a pattern, the invariant that makes it correct, and the condition that would make you choose something else.</p></DSAArticleLayout>;
}

async function PracticeRoute({ searchParams, libraryOnly }: { searchParams: PageProps["searchParams"]; libraryOnly: boolean }) {
  const query = await searchParams;
  const state = await getDsaWorkspaceState(query.application);
  return <PracticeWorkspace {...state} libraryOnly={libraryOnly} />;
}

async function QuestionDetailRoute({ questionId, searchParams }: { questionId: string; searchParams: PageProps["searchParams"] }) {
  const question = getCanonicalDsaQuestion(questionId); if (!question?.inQuestionBrowser) notFound();
  const query = await searchParams;
  const state = await getDsaWorkspaceState(query.application);
  return <DsaQuestionDetail question={question} signedIn={state.signedIn} progress={state.progress} applicationId={state.application?.id} companySlug={state.application?.company_slug ?? query.company} accountPlatformAvailable={state.accountPlatformAvailable} />;
}

function TopicPage({ slug }: { slug: string }) {
  const topic = topicBySlug.get(slug); if (!topic) notFound();
  const topicQuestions = questionsForTopic(slug);
  const patternSlugs = [...new Set(topicQuestions.flatMap((question) => question.patterns))];
  const patterns = patternSlugs.map((patternSlug) => dsaPatterns.find((pattern) => pattern.slug === patternSlug)).filter(Boolean);
  const distribution = { Easy: 0, Medium: 0, Hard: 0 }; topicQuestions.forEach((question) => { distribution[question.difficulty] += 1; });
  const stageIndex = roadmapStages.findIndex((stage) => stage.topics.includes(slug)); const stage = roadmapStages[stageIndex]; const nextStage = roadmapStages[stageIndex + 1];
  return <><AnalyticsEventOnMount event="dsa_topic_viewed" properties={{ topic_slug: topic.slug, question_count: topicQuestions.length }} /><PageHero eyebrow={`DSA topic${stage ? ` · Stage ${stage.order}` : ""}`} title={`${topic.name} interview preparation`} description={topic.summary}><Link className="button button-secondary" href="/dsa"><ArrowLeft size={15} />DSA prep</Link><a className="button" href="#practice">Practice {topicQuestions.length} questions</a></PageHero><section className="section section-compact"><div className="page-width"><div className="topic-overview-grid"><article><Network size={18} /><span>Where it appears</span><p>{topic.interviewUse}</p></article><article><Gauge size={18} /><span>Complexity focus</span><p>{topic.complexityFocus}</p></article><article><CircleAlert size={18} /><span>Common mistakes</span><ul>{topic.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></article></div></div></section><section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Recognition patterns" title={`Patterns connected to ${topic.name}.`} description="Patterns describe solution shapes; topics describe the underlying data or concept." /><div className="pattern-grid">{patterns.map((pattern) => pattern && <article key={pattern.id}><h3 className="pattern-grid-title">{pattern.name}</h3><p>{pattern.summary}</p><ul>{pattern.recognitionSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul></article>)}</div></div></section><section className="section" id="practice"><div className="page-width"><SectionHeading eyebrow="Practice set" title={`${topicQuestions.length} current ${topic.name} questions.`} description={`Difficulty distribution: ${distribution.Easy} easy, ${distribution.Medium} medium, ${distribution.Hard} hard. External records contain metadata and original notes only.`} /><QuestionList questions={topicQuestions} emptyTitle="No active questions for this topic yet" emptyText="The topic guide is live while its practice set is curated." /></div></section><section className="section section-alt"><div className="page-width"><div className="topic-next-grid"><div><span className="section-kicker">Related topics</span><div className="tag-list">{topic.relatedTopics.map((relatedSlug) => <Link className="tag" href={`/dsa/${relatedSlug}`} key={relatedSlug}>{topicBySlug.get(relatedSlug)?.name ?? relatedSlug}</Link>)}</div></div><div><span className="section-kicker">Next roadmap step</span>{nextStage ? <><h2>{nextStage.title}</h2><p>{nextStage.description}</p><Link className="card-link" href="/dsa/roadmaps">Choose an interview roadmap<ArrowRight size={14} /></Link></> : <><h2>Revisit weak patterns</h2><p>Use the explorer filters to build a mixed practice queue.</p><Link className="card-link" href="/dsa/questions">Open explorer<ArrowRight size={14} /></Link></>}</div></div></div></section></>;
}

export default async function DsaCatchAllPage({ params, searchParams }: PageProps) {
  const { segments } = await params;
  if (segments.length === 1 && (segments[0] === "questions" || segments[0] === "practice")) return <Suspense fallback={<div className="empty-inline" role="status" aria-live="polite">Loading practice workspace…</div>}><PracticeRoute searchParams={searchParams} libraryOnly={segments[0] === "questions"} /></Suspense>;
  if (segments.length === 2 && segments[0] === "questions") return <Suspense fallback={<div className="empty-inline" role="status" aria-live="polite">Loading practice record…</div>}><QuestionDetailRoute questionId={segments[1]} searchParams={searchParams} /></Suspense>;
  if (segments.length === 1 && segments[0] === "patterns") return <PatternIndex />;
  if (segments.length === 1 && (segments[0] === "companies" || segments[0] === "company-questions")) return <CompanyQuestionsIndex />;
  if (segments.length === 2 && (segments[0] === "companies" || segments[0] === "company-questions")) return <Suspense fallback={<div className="empty-inline" role="status" aria-live="polite">Loading company questions…</div>}><CompanyPage companySlug={segments[1]} /></Suspense>;
  if (segments.length === 1 && segments[0] === "languages") return <LanguageIndex />;
  if (segments.length === 2 && segments[0] === "languages" && segments[1] === "choose-a-language") { const page = getDsaCurriculumPage("/dsa/languages/choose-a-language")!; return <DSAArticleLayout page={page}><LanguageComparisonGuide /></DSAArticleLayout>; }
  if (segments.length === 2 && segments[0] === "languages") return <LanguagePage slug={segments[1]} />;
  if (segments.length === 1 && segments[0] === "roadmap") return <Suspense fallback={<div className="empty-inline" role="status" aria-live="polite">Loading roadmap planner…</div>}><LevelRoadmapPage /></Suspense>;
  if (segments.length === 2 && segments[0] === "roadmap" && segments[1] === "topic-map") return <TopicDependencyMapPage />;
  if (segments.length === 1 && segments[0] === "study-plans") return <StudyPlansPage />;
  if (segments.length === 1 && segments[0] === "roadmaps") return <RoadmapIndex />;
  if (segments.length === 3 && segments[0] === "roadmaps") return <RoadmapPage roleSlug={segments[1]} durationSegment={segments[2]} />;
  if (segments.length === 1 && segments[0] === "strategy") { const page = getDsaCurriculumPage("/dsa/strategy")!; return <DSAArticleLayout page={page} variant="strategy"><CodingInterviewStrategyPage /></DSAArticleLayout>; }
  if (segments.length === 1 && segments[0] === "interview-strategy") permanentRedirect("/dsa/strategy");
  if (segments.length === 2 && segments[0] === "interview-strategy") { const page = getDsaCurriculumPage(`/dsa/${segments.join("/")}`); if (!page) notFound(); return segments[1] === "problem-solving-framework" ? <DSAArticleLayout page={page}><ProblemSolvingFrameworkGuide /></DSAArticleLayout> : <DSAComingSoon page={page} />; }
  if (segments.length === 2 && segments[0] === "start-here") { const page = getDsaCurriculumPage(`/dsa/${segments.join("/")}`); if (!page) notFound(); return segments[1] === "overview" ? <DSAArticleLayout page={page}><DSAOverviewGuide /></DSAArticleLayout> : <DSAComingSoon page={page} />; }
  if (segments.length === 1 && topicBySlug.has(segments[0])) return <TopicPage slug={segments[0]} />;
  notFound();
}
