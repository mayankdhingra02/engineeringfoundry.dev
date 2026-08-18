import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CircleAlert, Clock3, ExternalLink, Lightbulb } from "lucide-react";
import { ArticleTOC } from "@/components/article-toc";
import { DSASidebar } from "@/components/dsa-sidebar";
import type { DSACurriculumNode } from "@/data/dsa/curriculum";
import { dsaCurriculum, getDsaCurriculumPager, getDsaCurriculumTrail } from "@/data/dsa/curriculum";
import { siteConfig } from "@/config/site";

export function DSAHeading({ level, id, children, includeInToc = false }: { level: 2 | 3 | 4; id: string; children: React.ReactNode; includeInToc?: boolean }) {
  const content = <>{children}<a className="sd-heading-anchor" href={`#${id}`} aria-label={`Link to ${typeof children === "string" ? children : "this section"}`}>#</a></>;
  if (level === 2) return <h2 id={id}>{content}</h2>;
  if (level === 3) return <h3 id={id} data-toc={includeInToc ? "true" : undefined}>{content}</h3>;
  return <h4 id={id}>{content}</h4>;
}

export function DSANote({ title = "Interview note", children, tone = "tip" }: { title?: string; children: React.ReactNode; tone?: "tip" | "important" }) {
  return <aside className={`dsa-note ${tone}`}><Lightbulb size={18} aria-hidden="true" /><div><strong>{title}</strong><div>{children}</div></div></aside>;
}

export function CodeTemplate({ title, language = "python", children }: { title: string; language?: string; children: string }) {
  return <figure className="dsa-code-template"><figcaption><span>{title}</span><small>{language}</small></figcaption><pre aria-label={`${title} code template`}><code>{children}</code></pre></figure>;
}

function Breadcrumbs({ page }: { page: DSACurriculumNode }) {
  const trail = getDsaCurriculumTrail(page.slug ?? "");
  return <nav className="sd-breadcrumbs" aria-label="Breadcrumb"><Link href="/dsa"><ArrowLeft size={13} />DSA</Link>{trail.slice(0, -1).map((item) => <span key={item.id}>/ {item.title}</span>)}</nav>;
}

function StructuredData({ page }: { page: DSACurriculumNode }) {
  const trail = getDsaCurriculumTrail(page.slug ?? "");
  const items = [{ name: "DSA", item: `${siteConfig.url}/dsa` }, ...trail.map((item) => ({ name: item.title, item: item.slug ? `${siteConfig.url}${item.slug}` : undefined })).filter((item) => item.item)];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.item })) }).replace(/</g, "\\u003c") }} />;
}

export function DSAArticleLayout({ page, children, showPager = true, variant = "default" }: { page: DSACurriculumNode; children: React.ReactNode; showPager?: boolean; variant?: "default" | "language" | "strategy" }) {
  const { previous, next } = getDsaCurriculumPager(page.slug ?? "");
  return <><StructuredData page={page} /><div className={`sd-doc-layout dsa-doc-layout${variant === "language" ? " dsa-language-doc-layout" : variant === "strategy" ? " dsa-strategy-doc-layout" : ""}`}><DSASidebar curriculum={dsaCurriculum} /><div className="sd-lesson-column" id="dsa-content">
    <header className="sd-lesson-header"><Breadcrumbs page={page} /><div className="sd-lesson-kicker">{page.category}</div><h1>{page.title}</h1>{page.description && <p>{page.description}</p>}<div className="sd-lesson-meta" aria-label="Page details"><span><BookOpen size={14} />Interview prep</span>{page.estimatedReadTime && <span><Clock3 size={14} />~{page.estimatedReadTime} min read</span>}<span>{page.status === "published" ? "Reviewed guide" : "Curriculum route ready"}</span></div></header>
    <ArticleTOC articleId="dsa-article" /><article className="sd-article" id="dsa-article">{children}</article>
    {showPager && <nav className="sd-lesson-pager" aria-label="DSA page navigation">{previous?.slug ? <Link href={previous.slug}><span><ArrowLeft size={15} />Previous</span><strong>{previous.navigationTitle ?? previous.title}</strong></Link> : <span />}{next?.slug ? <Link href={next.slug} className="next"><span>Next<ArrowRight size={15} /></span><strong>{next.navigationTitle ?? next.title}</strong></Link> : <span />}</nav>}
    <Link className="sd-back-link" href="/dsa"><ArrowLeft size={14} />Back to DSA Interview Prep</Link>
  </div><ArticleTOC articleId="dsa-article" /></div></>;
}

export function DSADataLayout({ page, children }: { page: DSACurriculumNode; children: React.ReactNode }) {
  return <><StructuredData page={page} /><div className="sd-doc-layout dsa-doc-layout dsa-data-layout"><DSASidebar curriculum={dsaCurriculum} /><article className="sd-lesson-column" id="dsa-content"><header className="sd-lesson-header"><Breadcrumbs page={page} /><div className="sd-lesson-kicker">{page.category}</div><h1>{page.title}</h1>{page.description && <p>{page.description}</p>}</header>{children}<Link className="sd-back-link" href="/dsa"><ArrowLeft size={14} />Back to DSA Interview Prep</Link></article></div></>;
}

export function DSAComingSoon({ page }: { page: DSACurriculumNode }) {
  return <DSAArticleLayout page={page}><section className="sd-coming-soon" aria-labelledby="dsa-page-status"><span><CircleAlert size={18} />Curriculum route ready</span><h2 id="dsa-page-status">This guide is being prepared.</h2><p>The route, navigation, metadata, and content model are in place. The full material will be published after editorial review instead of being padded with generic advice.</p><DSANote tone="important" title="Open access"><p>This page is publicly readable. No completion state or preparation outcome is implied.</p></DSANote></section></DSAArticleLayout>;
}

export function ExternalPracticeLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">Practice on {label}<ExternalLink size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>;
}
