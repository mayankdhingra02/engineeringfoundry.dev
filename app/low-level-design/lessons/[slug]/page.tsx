import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lowLevelDesignLessons, lowLevelDesignLessonsBySlug } from "@/data/low-level-design";
import { LowLevelDesignLessonView } from "@/features/low-level-design/lesson-view";
import { createPageMetadata } from "@/lib/metadata";
import { buildLowLevelDesignLessonStaticParams } from "@/lib/public-route-inventory";

export const dynamicParams = false;
export function generateStaticParams() { return buildLowLevelDesignLessonStaticParams(); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const lesson = lowLevelDesignLessonsBySlug.get(slug); if (!lesson) notFound(); return createPageMetadata({ title: `${lesson.title} — Low-Level Design`, description: lesson.summary, path: `/low-level-design/lessons/${lesson.slug}` }); }
export default async function LowLevelDesignLessonPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const lesson = lowLevelDesignLessonsBySlug.get(slug); if (!lesson || lesson.status !== "published") notFound(); const index = lowLevelDesignLessons.findIndex((item) => item.slug === slug); return <LowLevelDesignLessonView lesson={lesson} previousSlug={lowLevelDesignLessons[index - 1]?.slug} nextSlug={lowLevelDesignLessons[index + 1]?.slug} />; }
