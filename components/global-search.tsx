"use client";

import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { companies } from "@/data/companies";
import { activeChallenges } from "@/data/challenges";
import { behavioralCategories, behavioralSearchQuestions } from "@/data/behavioral";
import { activeQuestions, dsaPatterns, dsaTopics } from "@/data/dsa";
import { dsaCurriculumPages } from "@/data/dsa/curriculum";
import { dsaCompanies } from "@/data/dsa/interview-prep";
import { dsaLanguages } from "@/data/dsa/languages";
import { dsaRoadmaps } from "@/data/dsa/roadmaps";
import { interviewPlaybookSections } from "@/data/interview-tips";
import { activeMlDesignProblems, mlDesignConcepts } from "@/data/ml-design";
import { activeResources } from "@/data/resources";
import { systemDesignLessons } from "@/data/system-design/curriculum";
import { lowLevelDesignLessons, lowLevelDesignPractice } from "@/data/low-level-design";
import { salaryNegotiationModules } from "@/data/salary-negotiation";
import { track } from "@/lib/analytics";

export const globalSearchOpenEvent = "engineering-foundry-open-search";

const staticResults = [
  { title: "Preparation hub", type: "Start here", href: "/prepare" },
  { title: "Interactive DSA interview roadmap", type: "Roadmap", href: "/dsa/roadmap" },
  { title: "System Design study planner", type: "Planner", href: "/system-design/plan" },
  { title: "Low-Level Design curriculum", type: "Curriculum", href: "/low-level-design" },
  { title: "Salary Negotiation toolkit", type: "Career tool", href: "/salary-negotiation" },
  { title: "ML system design", type: "Roadmap", href: "/ml-design" },
  { title: "Mock Interview Practice Lab", type: "Practice", href: "/mock-interviews" },
  { title: "Referral Request Builder", type: "Career tool", href: "/referrals?mode=request" },
  { title: "Referrer Toolkit", type: "Career tool", href: "/referrals?mode=referrer" },
  { title: "Engineering Challenge Lab", type: "Practice", href: "/challenges" },
  { title: "Community Hub", type: "Community", href: "/community" },
  { title: "Community Recognition Preview", type: "Community", href: "/leaderboard" },
  { title: "Interview Experience Write-up Builder", type: "Private writing tool", href: "/interview-experiences" },
  { title: "Interview Experiences", type: "Future reviewed directory", href: "/interview-experiences" },
];

const suggestedResults = [
  { title: "Preparation hub", type: "Start here", href: "/prepare" },
  { title: "Coding interview questions", type: "DSA practice", href: "/dsa/questions" },
  { title: "Interactive DSA interview roadmap", type: "DSA roadmap", href: "/dsa/roadmap" },
  { title: "Introduction to System Design", type: "System Design lesson", href: "/system-design/start-here/introduction" },
  { title: "System Design practice library", type: "System Design practice", href: "/system-design/problems" },
  { title: "Low-Level Design curriculum", type: "Low-Level Design", href: "/low-level-design" },
  { title: "Low-Level Design practice library", type: "Low-Level Design practice", href: "/low-level-design/practice" },
  { title: "Salary Negotiation toolkit", type: "Career tool", href: "/salary-negotiation" },
  { title: "Company interview guides", type: "Company preparation", href: "/companies" },
] as const;

export function GlobalSearch({ triggerClass = "icon-button" }: { triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const closeSearch = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => {
      const invoker = invokerRef.current;
      if (invoker?.isConnected) invoker.focus();
      else triggerRef.current?.focus();
    }, 0);
  }, []);
  const items = useMemo(() => [
    ...activeQuestions.map((question) => ({ title: question.title, type: `Question · ${question.source.name}`, href: `/dsa/questions?q=${encodeURIComponent(question.title)}` })),
    ...dsaTopics.map((topic) => ({ title: topic.name, type: "Topic", href: `/dsa/${topic.slug}` })),
    ...dsaPatterns.map((pattern) => ({ title: pattern.name, type: "Pattern", href: `/dsa/questions?q=${encodeURIComponent(pattern.slug)}` })),
    ...dsaCurriculumPages.map((page) => ({ title: page.navigationTitle ?? page.title, type: `DSA guide · ${page.category}`, href: page.slug! })),
    ...dsaCompanies.map((company) => ({ title: `${company.name} coding interview questions`, type: "DSA company index · demo tags", href: `/dsa/companies/${company.slug}` })),
    ...dsaLanguages.map((language) => ({ title: `DSA in ${language.name}`, type: "DSA language guide", href: `/dsa/languages/${language.slug}` })),
    ...dsaRoadmaps.map((roadmap) => ({ title: `${roadmap.role} ${roadmap.durationDays}-day DSA roadmap`, type: "DSA roadmap", href: `/dsa/roadmaps/${roadmap.roleSlug}/${roadmap.durationDays}-day` })),
    ...companies.map((company) => ({ title: company.name, type: "Company guide", href: `/companies/${company.slug}` })),
    ...companies.map((company) => ({ title: `${company.name} interview experience workspace`, type: "Private writing tool", href: `/interview-experiences/${company.slug}` })),
    ...activeChallenges.map((challenge) => ({ title: challenge.title, type: `${challenge.category} challenge`, href: `/challenges/${challenge.slug}` })),
    ...systemDesignLessons.map((lesson) => ({ title: lesson.navigationTitle ?? lesson.title, type: `System Design lesson · ${lesson.category}`, href: lesson.slug! })),
    ...lowLevelDesignLessons.filter((lesson) => lesson.status === "published").map((lesson) => ({ title: lesson.title, type: "Low-Level Design lesson", href: `/low-level-design/lessons/${lesson.slug}` })),
    ...lowLevelDesignPractice.filter((problem) => problem.status === "published").map((problem) => ({ title: problem.title, type: "Low-Level Design practice", href: `/low-level-design/practice/${problem.slug}` })),
    ...salaryNegotiationModules.filter((module) => module.status === "published").map((module) => ({ title: module.title, type: "Salary Negotiation module", href: `/salary-negotiation/${module.slug}` })),
    ...activeMlDesignProblems.map((problem) => ({ title: problem.title, type: "ML Design problem", href: `/ml-design/${problem.slug}` })),
    ...mlDesignConcepts.map((concept) => ({ title: concept.title, type: "ML Design concept", href: `/ml-design#concepts` })),
    ...behavioralCategories.map((category) => ({ title: category.name, type: "Behavioral category", href: `/behavioral?category=${encodeURIComponent(category.name)}` })),
    ...behavioralSearchQuestions.map((question) => ({ title: question.prompt, type: "Behavioral practice", href: `/behavioral?question=${question.slug}` })),
    ...interviewPlaybookSections.map((section) => ({ title: `${section.title} playbook`, type: "Interview playbook", href: `/interview-tips#${section.id}` })),
    ...activeResources.map((resource) => ({ title: resource.title, type: `Resource · ${resource.provider}`, href: `/resources?search=${encodeURIComponent(resource.title)}` })),
    ...staticResults,
  ], []);
  const matches = query.trim() ? items.filter((item) => `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase())) : suggestedResults;
  const results = matches.slice(0, 8);

  useEffect(() => {
    function openSearch() {
      invokerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
      setOpen(true);
    }
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
      if (open && event.key === "Escape") closeSearch();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(globalSearchOpenEvent, openSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(globalSearchOpenEvent, openSearch);
    };
  }, [closeSearch, open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keepFocusInDialog(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keepFocusInDialog);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keepFocusInDialog);
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className={triggerClass} onClick={(event) => { invokerRef.current = event.currentTarget; setOpen(true); }} aria-label="Search Engineering Foundry">
        <Search size={17} /><span className="search-label">Search</span>
      </button>
      {open && (
        <div className="search-backdrop">
          <button className="search-dismiss" onClick={closeSearch} aria-label="Close search" />
          <section ref={dialogRef} className="search-dialog" role="dialog" aria-modal="true" aria-label="Global search">
            <div className="search-input-wrap"><Search size={20} /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, playbooks, resources…" aria-label="Search query" /><button className="icon-button" onClick={closeSearch} aria-label="Close search"><X size={17} /></button></div>
            <div className="search-meta"><span role="status" aria-live="polite" aria-atomic="true">{query ? matches.length > results.length ? `${results.length} shown of ${matches.length}` : `${results.length} ${results.length === 1 ? "result" : "results"}` : "Suggested across Engineering Foundry"}</span><span className="kbd">ESC</span></div>
            <div className="search-results">
              {results.map((item) => <Link href={item.href} key={`${item.type}-${item.title}`} onClick={() => { track("search_used", { result_type: item.type.split(" · ")[0].toLowerCase() }); setTimeout(() => setOpen(false), 0); }}><span><small>{item.type}</small>{item.title}</span><ArrowUpRight size={16} /></Link>)}
              {!results.length && <div className="empty-inline"><strong>No results yet</strong><span>Try a broader topic or company name.</span></div>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
