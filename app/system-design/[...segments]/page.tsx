import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SystemDesignPracticeLibrary } from "@/components/system-design-practice-library";
import { ComingSoonLesson, SystemDesignLessonLayout } from "@/components/system-design-lesson";
import { CachingLessonContent, cachingLessonIds } from "@/content/system-design/caching";
import { CoreSystemPropertiesLessonContent } from "@/content/system-design/foundations/core-system-properties";
import { EstimationLessonContent } from "@/content/system-design/foundations/estimation";
import { IntroductionLessonContent } from "@/content/system-design/foundations/introduction";
import { InterviewFrameworkLessonContent } from "@/content/system-design/foundations/interview-framework";
import { RequirementsLessonContent } from "@/content/system-design/foundations/requirements";
import { DataStorageLessonContent, dataStorageLessonIds } from "@/content/system-design/data-storage";
import { NetworkingLessonContent, networkingLessonIds } from "@/content/system-design/networking";
import { MessagingLessonContent, messagingLessonIds } from "@/content/system-design/messaging";
import { ReliabilityLessonContent, reliabilityLessonIds } from "@/content/system-design/reliability";
import { SpecializedLessonContent, specializedLessonIds } from "@/content/system-design/specialized";
import { TechnologyLessonContent, technologyLessonIds } from "@/content/system-design/technology";
import { getSystemDesignPracticeContent, SystemDesignPracticeProblemContent } from "@/content/system-design/problems";
import { getSystemDesignLesson, systemDesignLessons, type SystemDesignCurriculumNode } from "@/data/system-design/curriculum";
import { createPageMetadata } from "@/lib/metadata";
import { getSystemDesignWorkspaceState } from "@/lib/system-design/queries";
import { SystemDesignProblemPracticePanel } from "@/features/system-design/problem-practice-panel";

export const dynamicParams = false;

export function generateStaticParams() {
  const lessons = systemDesignLessons.map((lesson) => ({ segments: lesson.slug!.replace("/system-design/", "").split("/") }));
  return [{ segments: ["problems"] }, ...lessons];
}

export async function generateMetadata({ params }: { params: Promise<{ segments: string[] }> }): Promise<Metadata> {
  const { segments } = await params;
  if (segments.length === 1 && segments[0] === "problems") return createPageMetadata({
    title: "System Design Practice Problems",
    description: "Practice 27 end-to-end System Design interviews with progressive walkthroughs, APIs, data models, failures, and trade-offs.",
    path: "/system-design/problems",
  });
  const slug = `/system-design/${segments.join("/")}`;
  const lesson = getSystemDesignLesson(slug);
  if (!lesson) notFound();
  return {
    ...createPageMetadata({
    title: `${lesson.title} — System Design`,
    description: lesson.description ?? `Learn ${lesson.title} for System Design interviews.`,
    path: lesson.slug as `/${string}`,
    }),
    robots: lesson.status === "coming-soon" ? { index: false, follow: true } : undefined,
  };
}

const practiceLibraryLesson: SystemDesignCurriculumNode = {
  id: "practice-library",
  title: "Practice Problems",
  description: "Turn ambiguous prompts into scoped, defensible architectures. Start simple, find the bottleneck, and scale with a reason.",
  type: "lesson",
  category: "End-to-End System Design Practice",
  difficulty: "Intermediate",
  estimatedReadTime: 5,
  status: undefined,
  researchStatus: "published",
  lastReviewed: "2026-08-14",
};

async function PersonalizedPracticeLibrary({ applicationId }: { applicationId?: string }) {
  const state = await getSystemDesignWorkspaceState(applicationId);
  if (!state.signedIn) return <SystemDesignPracticeLibrary applicationId={applicationId} />;
  const attemptCounts = state.attempts.reduce<Record<string, number>>((counts, attempt) => ({ ...counts, [attempt.problem_id]: (counts[attempt.problem_id] ?? 0) + 1 }), {});
  return <SystemDesignPracticeLibrary signedIn progress={state.progress} attemptCounts={attemptCounts} applicationId={state.application?.id} />;
}

export default async function SystemDesignContentPage({ params, searchParams }: { params: Promise<{ segments: string[] }>; searchParams: Promise<{ application?: string }> }) {
  const { segments } = await params;
  const context = await searchParams;
  if (segments.length === 1 && segments[0] === "problems") return <SystemDesignLessonLayout lesson={practiceLibraryLesson}><Suspense fallback={<p className="sd-practice-loading">Loading practice progress…</p>}><PersonalizedPracticeLibrary applicationId={context.application} /></Suspense></SystemDesignLessonLayout>;

  const lesson = getSystemDesignLesson(`/system-design/${segments.join("/")}`);
  if (!lesson) notFound();
  if (segments.length === 2 && segments[0] === "problems") {
    const problem = getSystemDesignPracticeContent(segments[1]);
    if (problem) return <SystemDesignLessonLayout lesson={lesson}><Suspense fallback={<p className="sd-practice-loading">Loading your private attempts…</p>}><SystemDesignProblemPracticePanel problemId={problem.id} problemTitle={problem.title} applicationId={context.application} /></Suspense><SystemDesignPracticeProblemContent problem={problem} /></SystemDesignLessonLayout>;
  }
  if (cachingLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><CachingLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  if (lesson.id === "introduction") return <SystemDesignLessonLayout lesson={lesson}><IntroductionLessonContent /></SystemDesignLessonLayout>;
  if (lesson.id === "interview-framework") return <SystemDesignLessonLayout lesson={lesson}><InterviewFrameworkLessonContent /></SystemDesignLessonLayout>;
  if (lesson.id === "requirements") return <SystemDesignLessonLayout lesson={lesson}><RequirementsLessonContent /></SystemDesignLessonLayout>;
  if (lesson.id === "estimation") return <SystemDesignLessonLayout lesson={lesson}><EstimationLessonContent /></SystemDesignLessonLayout>;
  if (lesson.id === "core-system-properties") return <SystemDesignLessonLayout lesson={lesson}><CoreSystemPropertiesLessonContent /></SystemDesignLessonLayout>;
  if (networkingLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><NetworkingLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  if (dataStorageLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><DataStorageLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  if (messagingLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><MessagingLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  if (reliabilityLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><ReliabilityLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  if (specializedLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><SpecializedLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  if (technologyLessonIds.has(lesson.id)) return <SystemDesignLessonLayout lesson={lesson}><TechnologyLessonContent lessonId={lesson.id} /></SystemDesignLessonLayout>;
  return <ComingSoonLesson lesson={lesson} />;
}
