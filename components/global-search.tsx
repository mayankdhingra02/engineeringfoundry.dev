"use client";

import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { companies } from "@/data/companies";
import { activeChallenges } from "@/data/challenges";
import { behavioralCategories, behavioralSearchQuestions } from "@/data/behavioral";
import { activeQuestions, dsaPatterns, dsaTopics } from "@/data/dsa";
import { interviewPlaybookSections } from "@/data/interview-tips";
import { activeMlDesignProblems, mlDesignConcepts } from "@/data/ml-design";
import { activeResources } from "@/data/resources";
import { activeSystemDesignProblems, systemDesignConcepts } from "@/data/system-design";
import { track } from "@/lib/analytics";

const staticResults = [
  { title: "System Design roadmap", type: "Roadmap", href: "/system-design" },
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

export function GlobalSearch({ triggerClass = "icon-button" }: { triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const items = useMemo(() => [
    ...activeQuestions.map((question) => ({ title: question.title, type: `Question · ${question.source.name}`, href: `/dsa?search=${encodeURIComponent(question.title)}` })),
    ...dsaTopics.map((topic) => ({ title: topic.name, type: "Topic", href: `/dsa/${topic.slug}` })),
    ...dsaPatterns.map((pattern) => ({ title: pattern.name, type: "Pattern", href: `/dsa?pattern=${pattern.slug}` })),
    ...companies.map((company) => ({ title: company.name, type: "Company guide", href: `/companies/${company.slug}` })),
    ...companies.map((company) => ({ title: `${company.name} interview experience workspace`, type: "Private writing tool", href: `/interview-experiences/${company.slug}` })),
    ...activeChallenges.map((challenge) => ({ title: challenge.title, type: `${challenge.category} challenge`, href: `/challenges/${challenge.slug}` })),
    ...activeSystemDesignProblems.map((problem) => ({ title: problem.title, type: "System Design problem", href: `/system-design/${problem.slug}` })),
    ...systemDesignConcepts.map((concept) => ({ title: concept.title, type: "System Design concept", href: `/system-design#concepts` })),
    ...activeMlDesignProblems.map((problem) => ({ title: problem.title, type: "ML Design problem", href: `/ml-design/${problem.slug}` })),
    ...mlDesignConcepts.map((concept) => ({ title: concept.title, type: "ML Design concept", href: `/ml-design#concepts` })),
    ...behavioralCategories.map((category) => ({ title: category.name, type: "Behavioral category", href: `/behavioral?category=${encodeURIComponent(category.name)}` })),
    ...behavioralSearchQuestions.map((question) => ({ title: question.prompt, type: "Behavioral practice", href: `/behavioral?question=${question.slug}` })),
    ...interviewPlaybookSections.map((section) => ({ title: `${section.title} playbook`, type: "Interview playbook", href: `/interview-tips#${section.id}` })),
    ...activeResources.map((resource) => ({ title: resource.title, type: `Resource · ${resource.provider}`, href: `/resources?search=${encodeURIComponent(resource.title)}` })),
    ...staticResults,
  ], []);
  const results = query.trim() ? items.filter((item) => `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8) : items.slice(0, 6);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  return (
    <>
      <button className={triggerClass} onClick={() => setOpen(true)} aria-label="Search Engineering Foundry">
        <Search size={17} /><span className="search-label">Search</span>
      </button>
      {open && (
        <div className="search-backdrop">
          <button className="search-dismiss" onClick={() => setOpen(false)} aria-label="Close search" />
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Global search">
            <div className="search-input-wrap"><Search size={20} /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, playbooks, resources…" aria-label="Search query" /><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close search"><X size={17} /></button></div>
            <div className="search-meta"><span>{query ? `${results.length} results` : "Suggested"}</span><span className="kbd">ESC</span></div>
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
