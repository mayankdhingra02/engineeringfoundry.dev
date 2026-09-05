import { notFound } from "next/navigation";
import { getBehavioralLesson } from "@/data/behavioral/lessons";
import { BehavioralLessonPage } from "@/features/behavioral/lesson";
import { createPageMetadata } from "@/lib/metadata";
import { buildBehavioralLessonStaticParams } from "@/lib/public-route-inventory";

export const dynamicParams = false;

export function generateStaticParams() {
  return buildBehavioralLessonStaticParams();
}

type BehavioralLessonRouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BehavioralLessonRouteProps) {
  const { slug } = await params;
  const lesson = getBehavioralLesson(slug);
  if (!lesson) return {};
  return createPageMetadata({
    title: lesson.title,
    description: lesson.objective,
    path: `/behavioral/learn/${lesson.slug}`,
    image: "/og-interview-prep.png",
    imageAlt: `${lesson.title} behavioral interview lesson`,
    imageWidth: 1659,
    imageHeight: 948,
  });
}

export default async function BehavioralLearnLessonPage({ params }: BehavioralLessonRouteProps) {
  const { slug } = await params;
  const lesson = getBehavioralLesson(slug);
  if (!lesson) notFound();
  return <BehavioralLessonPage lesson={lesson} />;
}
