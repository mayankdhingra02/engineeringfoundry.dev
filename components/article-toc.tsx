"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TocHeading = { id: string; label: string; level: 2 | 3 };

function TocLinks({ headings, activeId }: { headings: TocHeading[]; activeId: string }) {
  return <ol>{headings.map((heading) => <li key={heading.id} className={cn(heading.level === 3 && "nested", activeId === heading.id && "active")}>
    <a href={`#${heading.id}`} aria-current={activeId === heading.id ? "location" : undefined}>{heading.label}</a>
  </li>)}</ol>;
}

export function ArticleTOC({ articleId = "system-design-lesson" }: { articleId?: string }) {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    const elements = [...article.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id][data-toc]")];
    const nextHeadings = elements.map((heading) => ({ id: heading.id, label: heading.textContent?.replace("#", "").trim() ?? heading.id, level: heading.tagName === "H2" ? 2 as const : 3 as const }));
    const animationFrame = window.requestAnimationFrame(() => {
      setHeadings(nextHeadings);
      setActiveId(window.location.hash.slice(1) || nextHeadings[0]?.id || "");
    });

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target.id) setActiveId(visible[0].target.id);
    }, { rootMargin: "-72px 0px -75%", threshold: [0, 1] });
    elements.forEach((heading) => observer.observe(heading));
    const onHashChange = () => setActiveId(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHashChange);
    return () => { window.cancelAnimationFrame(animationFrame); observer.disconnect(); window.removeEventListener("hashchange", onHashChange); };
  }, [articleId]);

  if (!headings.length) return null;
  return <>
    <aside className="sd-article-toc" aria-label="On this page"><strong>On this page</strong><TocLinks headings={headings} activeId={activeId} /></aside>
    <details className="sd-mobile-toc"><summary>On this page <ChevronDown size={16} /></summary><TocLinks headings={headings} activeId={activeId} /></details>
  </>;
}
