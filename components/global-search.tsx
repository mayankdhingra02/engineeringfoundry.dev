"use client";

import Link from "next/link";
import { Search, X, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import {
  GLOBAL_SEARCH_INITIAL_RESULT_LIMIT,
  GLOBAL_SEARCH_RESULT_BATCH_SIZE,
  matchingGlobalSearchItems,
  nextGlobalSearchResultLimit,
  normalizeGlobalSearchQuery,
  visibleGlobalSearchResults,
} from "@/lib/global-search";

export const globalSearchOpenEvent = "engineering-foundry-open-search";

type GlobalSearchOpenDetail = {
  readonly invoker?: HTMLElement | null;
  readonly fallbackFocusId?: string;
};

export function requestGlobalSearch(detail: GlobalSearchOpenDetail = {}) {
  window.dispatchEvent(new CustomEvent<GlobalSearchOpenDetail>(globalSearchOpenEvent, { detail }));
}

export function GlobalSearch({ triggerClass = "icon-button" }: { triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleResultLimit, setVisibleResultLimit] = useState(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const fallbackFocusIdRef = useRef<string | null>(null);
  const closeSearch = useCallback(() => {
    setOpen(false);
    setVisibleResultLimit(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT);
    window.setTimeout(() => {
      const invoker = invokerRef.current;
      const fallbackInvoker = fallbackFocusIdRef.current ? document.getElementById(fallbackFocusIdRef.current) : null;
      if (invoker?.isConnected) invoker.focus();
      else if (fallbackInvoker?.isConnected) fallbackInvoker.focus();
      else triggerRef.current?.focus();
    }, 0);
  }, []);
  const hasQuery = Boolean(normalizeGlobalSearchQuery(query));
  const matches = matchingGlobalSearchItems(query);
  const results = visibleGlobalSearchResults(matches, visibleResultLimit);
  const remainingResults = Math.max(0, matches.length - results.length);
  const canRecoverResults = matches.length > GLOBAL_SEARCH_INITIAL_RESULT_LIMIT;
  const nextResultCount = Math.min(remainingResults, GLOBAL_SEARCH_RESULT_BATCH_SIZE);
  const resultNoun = hasQuery ? "result" : "suggestion";

  useEffect(() => {
    function openSearch(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail as GlobalSearchOpenDetail | undefined : undefined;
      invokerRef.current = detail?.invoker ?? (document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current);
      fallbackFocusIdRef.current = detail?.fallbackFocusId ?? null;
      setVisibleResultLimit(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT);
      setOpen(true);
    }
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        requestGlobalSearch({ invoker: document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current });
      }
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
      <button ref={triggerRef} className={triggerClass} onClick={(event) => requestGlobalSearch({ invoker: event.currentTarget })} aria-label="Search Engineering Foundry">
        <Search size={17} /><span className="search-label">Search</span>
      </button>
      {open && (
        <div className="search-backdrop">
          <button className="search-dismiss" onClick={closeSearch} aria-label="Close search" />
          <section ref={dialogRef} className="search-dialog" role="dialog" aria-modal="true" aria-label="Global search">
            <div className="search-input-wrap"><Search size={20} /><input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setVisibleResultLimit(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT); }} placeholder="Search questions, playbooks, resources…" aria-label="Search query" /><button className="icon-button" onClick={closeSearch} aria-label="Close search"><X size={17} /></button></div>
            <div className="search-meta"><span role="status" aria-live="polite" aria-atomic="true">{results.length < matches.length ? `${results.length} shown of ${matches.length} ${hasQuery ? "results" : "suggestions"}` : `${results.length} ${results.length === 1 ? resultNoun : `${resultNoun}s`}`}</span><span className="kbd">ESC</span></div>
            <div className="search-results-shell">
              {canRecoverResults && <button type="button" className="search-results-toggle" aria-controls="global-search-results" aria-expanded={results.length > GLOBAL_SEARCH_INITIAL_RESULT_LIMIT} onClick={() => setVisibleResultLimit((current) => nextGlobalSearchResultLimit(current, matches.length))}><span>{remainingResults ? `Show ${nextResultCount === 1 ? "1 more" : `next ${nextResultCount}`} ${nextResultCount === 1 ? resultNoun : `${resultNoun}s`}` : `Show first ${GLOBAL_SEARCH_INITIAL_RESULT_LIMIT} ${resultNoun}s`}</span>{remainingResults ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>}
              <div className="search-results" id="global-search-results">
                {results.map((item) => <Link href={item.href} key={`${item.type}-${item.title}`} onClick={() => { track("search_used", { result_type: item.type.split(" · ")[0].toLowerCase() }); setVisibleResultLimit(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT); setTimeout(() => setOpen(false), 0); }}><span><small>{item.type}</small>{item.title}</span><ArrowUpRight size={16} /></Link>)}
                {!results.length && <div className="empty-inline"><strong>No results yet</strong><span>Try a broader topic or company name.</span></div>}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
