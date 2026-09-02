import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CircleAlert, Clock3, Factory, Lightbulb, Scale, ShieldAlert, TriangleAlert } from "lucide-react";
import type { SystemDesignCurriculumNode } from "@/data/system-design/curriculum";
import { getSystemDesignLessonPager, getSystemDesignLessonTrail, systemDesignCurriculum } from "@/data/system-design/curriculum";
import { siteConfig } from "@/config/site";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { ArticleTOC } from "./article-toc";
import { SystemDesignSidebar } from "./system-design-sidebar";
import { SystemDesignPrivateProgress } from "@/features/system-design/private-progress";

export type LessonCalloutVariant = "interview-tip" | "common-mistake" | "tradeoff" | "production-note" | "important";

const calloutConfig = {
  "interview-tip": { label: "Interview Tip", icon: Lightbulb },
  "common-mistake": { label: "Common Mistake", icon: TriangleAlert },
  tradeoff: { label: "Tradeoff", icon: Scale },
  "production-note": { label: "Production Note", icon: Factory },
  important: { label: "Important", icon: ShieldAlert },
} as const;

export function LessonCallout({ variant, title, children }: { variant: LessonCalloutVariant; title?: string; children: React.ReactNode }) {
  const config = calloutConfig[variant];
  const Icon = config.icon;
  return <aside className={`sd-callout ${variant}`}><Icon size={18} aria-hidden="true" /><div><strong>{title ?? config.label}</strong><div>{children}</div></div></aside>;
}

export function ArchitectureDiagram() {
  return <figure className="sd-architecture-diagram" aria-labelledby="cache-path-caption">
    <div className="sd-diagram-flow" role="img" aria-label="A client requests data from an application cache. Cache misses continue to the database, and the response populates the cache.">
      <span>Client</span><i aria-hidden="true">→</i><span className="accent">Application cache</span><i aria-hidden="true">→ miss →</i><span>Database</span>
    </div>
    <figcaption id="cache-path-caption"><b>Typical cache-aside read path.</b> A hit returns immediately; a miss reads the source of truth and populates the cache.</figcaption>
  </figure>;
}

export function LessonHeading({ level, id, children, includeInToc = false }: { level: 2 | 3 | 4; id: string; children: React.ReactNode; includeInToc?: boolean }) {
  const content = <>{children}<a className="sd-heading-anchor" href={`#${id}`} aria-label={`Link to ${typeof children === "string" ? children : "this section"}`}>#</a></>;
  if (level === 2) return <h2 id={id}>{content}</h2>;
  if (level === 3) return <h3 id={id} data-toc={includeInToc ? "true" : undefined}>{content}</h3>;
  return <h4 id={id}>{content}</h4>;
}

function LessonBreadcrumbs({ lesson }: { lesson: SystemDesignCurriculumNode }) {
  const trail = getSystemDesignLessonTrail(lesson.slug ?? "");
  return <nav className="sd-breadcrumbs" aria-label="Breadcrumb"><Link href="/system-design/start-here/introduction"><ArrowLeft size={13} />System Design</Link>{trail.slice(0, -1).map((item) => <span key={item.id}>/ {item.title}</span>)}</nav>;
}

function LessonHeader({ lesson }: { lesson: SystemDesignCurriculumNode }) {
  return <header className="sd-lesson-header">
    <LessonBreadcrumbs lesson={lesson} />
    <div className="sd-lesson-kicker">{lesson.category}</div>
    <h1>{lesson.title}</h1>
    {lesson.description && <p>{lesson.description}</p>}
    <div className="sd-lesson-meta" aria-label="Lesson details">
      {lesson.difficulty && <span className="sd-difficulty-badge">{lesson.difficulty}</span>}
      {lesson.estimatedReadTime && <span><Clock3 size={14} />~{lesson.estimatedReadTime} min read</span>}
      <span><BookOpen size={14} />{lesson.category.split(" · ")[0]}</span>
      <span><CalendarDays size={14} />Last reviewed: {lesson.lastReviewed ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(`${lesson.lastReviewed}T00:00:00`)) : "Editorial review pending"}</span>
      {lesson.status === "published" && lesson.slug && <Suspense fallback={<span className="sd-progress-loading">Progress</span>}><SystemDesignPrivateProgress itemId={lesson.id} /></Suspense>}
    </div>
  </header>;
}

function LessonPager({ lesson }: { lesson: SystemDesignCurriculumNode }) {
  const { previous, next } = getSystemDesignLessonPager(lesson.slug ?? "");
  return <nav className="sd-lesson-pager" aria-label="Lesson navigation">
    {previous?.slug ? <Link href={previous.slug}><span><ArrowLeft size={15} />Previous</span><strong>{previous.navigationTitle ?? previous.title}</strong></Link> : <span />}
    {next?.slug ? <Link href={next.slug} className="next"><span>Next<ArrowRight size={15} /></span><strong>{next.navigationTitle ?? next.title}</strong></Link> : <span />}
  </nav>;
}

function BreadcrumbStructuredData({ lesson }: { lesson: SystemDesignCurriculumNode }) {
  const trail = getSystemDesignLessonTrail(lesson.slug ?? "");
  const items = [{ name: "System Design", item: `${siteConfig.url}/system-design/start-here/introduction` }, ...trail.map((item) => ({ name: item.title, item: item.slug ? `${siteConfig.url}${item.slug}` : undefined })).filter((item) => item.item)];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.item })) }).replace(/</g, "\\u003c") }} />;
}

export function SystemDesignLessonLayout({ lesson, children }: { lesson: SystemDesignCurriculumNode; children: React.ReactNode }) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  return <>
    <BreadcrumbStructuredData lesson={lesson} />
    <div className="sd-doc-layout">
      <SystemDesignSidebar curriculum={systemDesignCurriculum} accountPlatformAvailable={accountPlatformAvailable} />
      <div className="sd-lesson-column" id="lesson-content">
        <LessonHeader lesson={lesson} />
        <ArticleTOC />
        <article className="sd-article" id="system-design-lesson">{children}</article>
        <LessonPager lesson={lesson} />
        <Link className="sd-back-link" href="/system-design/start-here/introduction"><ArrowLeft size={14} />Back to System Design introduction</Link>
      </div>
      <ArticleTOC />
    </div>
  </>;
}

export function ComingSoonLesson({ lesson }: { lesson: SystemDesignCurriculumNode }) {
  return <SystemDesignLessonLayout lesson={lesson}>
    <section className="sd-coming-soon" aria-labelledby="lesson-status">
      <span><CircleAlert size={18} />Curriculum route ready</span>
      <h2 id="lesson-status">This lesson is being prepared.</h2>
      <p>The navigation, metadata, breadcrumbs, and lesson sequence are in place. Engineering Foundry will publish the technical material after editorial review instead of filling this route with shallow or unverified guidance.</p>
      <LessonCallout variant="important"><p>This page is publicly readable and does not require an account. No completion state is implied until progress infrastructure is connected.</p></LessonCallout>
    </section>
  </SystemDesignLessonLayout>;
}
