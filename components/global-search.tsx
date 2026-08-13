"use client";

import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { companies } from "@/data/fixtures/companies";
import { questions } from "@/data/fixtures/questions";
import { resources } from "@/data/fixtures/resources";

const staticResults = [
  { title: "System Design roadmap", type: "Roadmap", href: "/system-design" },
  { title: "ML system design", type: "Roadmap", href: "/ml-design" },
  { title: "Mock interview matching", type: "Practice", href: "/mock-interviews" },
  { title: "Referral community", type: "Career", href: "/referrals" },
];

export function GlobalSearch({ triggerClass = "icon-button" }: { triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const items = useMemo(() => [
    ...questions.map((q) => ({ title: q.title, type: "DSA question", href: "/dsa" })),
    ...companies.map((c) => ({ title: c.name, type: "Company guide", href: `/companies/${c.slug}` })),
    ...resources.map((r) => ({ title: r.title, type: "Resource", href: "/resources" })),
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
            <div className="search-input-wrap"><Search size={20} /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, companies, topics…" aria-label="Search query" /><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close search"><X size={17} /></button></div>
            <div className="search-meta"><span>{query ? `${results.length} demo results` : "Suggested"}</span><span className="kbd">ESC</span></div>
            <div className="search-results">
              {results.map((item) => <Link href={item.href} key={`${item.type}-${item.title}`} onClick={() => setOpen(false)}><span><small>{item.type}</small>{item.title}</span><ArrowUpRight size={16} /></Link>)}
              {!results.length && <div className="empty-inline"><strong>No results yet</strong><span>Try a broader topic or company name.</span></div>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
