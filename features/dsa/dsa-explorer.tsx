"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionList } from "@/components/question-list";
import { companies } from "@/data/companies";
import { activeQuestions, dsaPatterns, dsaTopics, roadmapStages } from "@/data/dsa";
import { track } from "@/lib/analytics";

type Filters = { search: string; difficulty: string; topic: string; pattern: string; company: string; source: string; availability: string; verification: string; sort: string };
const defaults: Filters = { search: "", difficulty: "", topic: "", pattern: "", company: "", source: "", availability: "", verification: "", sort: "roadmap" };
const filterKeys = Object.keys(defaults) as Array<keyof Filters>;
const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 } as const;
const roadmapOrder = new Map(roadmapStages.map((stage) => [stage.slug, stage.order]));

export function DsaExplorer() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => Object.fromEntries(filterKeys.map((key) => [key, searchParams.get(key) ?? defaults[key]])) as unknown as Filters);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) { hydrated.current = true; return; }
    const params = new URLSearchParams();
    filterKeys.forEach((key) => { if (filters[key] && filters[key] !== defaults[key]) params.set(key, filters[key]); });
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [filters]);

  const companyOptions = useMemo(() => companies.filter((company) => activeQuestions.some((question) => question.companyAssociations.some((association) => association.companySlug === company.slug))), []);
  const sourceOptions = useMemo(() => [...new Set(activeQuestions.map((question) => question.source.platform))].sort(), []);
  const filtered = useMemo(() => activeQuestions.filter((question) => {
    const titleMatches = question.title.toLowerCase().includes(filters.search.trim().toLowerCase());
    return titleMatches
      && (!filters.difficulty || question.difficulty.toLowerCase() === filters.difficulty)
      && (!filters.topic || question.topics.includes(filters.topic))
      && (!filters.pattern || question.patterns.includes(filters.pattern))
      && (!filters.company || question.companyAssociations.some((association) => association.companySlug === filters.company))
      && (!filters.source || question.source.platform === filters.source)
      && (!filters.verification || question.verification === filters.verification)
      && (!filters.availability || (filters.availability === "free" ? question.isFree : filters.availability === "external" ? Boolean(question.externalUrl) : question.isOriginal));
  }).sort((left, right) => {
    if (filters.sort === "difficulty") return difficultyOrder[left.difficulty] - difficultyOrder[right.difficulty] || left.title.localeCompare(right.title);
    if (filters.sort === "alphabetical") return left.title.localeCompare(right.title);
    if (filters.sort === "verified") return (right.lastVerifiedAt ?? "").localeCompare(left.lastVerifiedAt ?? "") || left.title.localeCompare(right.title);
    return (roadmapOrder.get(left.roadmapStage) ?? 99) - (roadmapOrder.get(right.roadmapStage) ?? 99) || left.priority - right.priority || left.title.localeCompare(right.title);
  }), [filters]);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    track("dsa_filter_changed", { filter: key, value: key === "search" ? (value ? "used" : "cleared") : value || "all" });
  }

  const activeCount = filterKeys.filter((key) => key !== "sort" && filters[key]).length;
  return <div className="explorer-shell">
    <div className="persistence-note"><SlidersHorizontal size={18} aria-hidden="true" /><span><strong>Build a focused practice queue.</strong> Filters are reflected in the URL so this view can be shared.</span><span>Progress tracking will become available when account persistence is enabled.</span></div>
    <div className="dsa-filters" aria-label="Question filters">
      <label className="search-filter"><span>Search by title</span><span className="field-with-icon"><Search size={15} aria-hidden="true" /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onBlur={() => filters.search && track("dsa_filter_changed", { filter: "search", value: "used" })} placeholder="Try Two Sum…" /></span></label>
      <Filter label="Difficulty" value={filters.difficulty} onChange={(value) => update("difficulty", value)} options={[["", "All difficulties"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]]} />
      <Filter label="Topic" value={filters.topic} onChange={(value) => update("topic", value)} options={[["", "All topics"], ...dsaTopics.map((item) => [item.slug, item.name] as [string, string])]} />
      <Filter label="Pattern" value={filters.pattern} onChange={(value) => update("pattern", value)} options={[["", "All patterns"], ...dsaPatterns.map((item) => [item.slug, item.name] as [string, string])]} />
      {companyOptions.length > 0 && <Filter label="Company" value={filters.company} onChange={(value) => update("company", value)} options={[["", "All sourced companies"], ...companyOptions.map((item) => [item.slug, item.name] as [string, string])]} />}
      <Filter label="Source" value={filters.source} onChange={(value) => update("source", value)} options={[["", "All sources"], ...sourceOptions.map((item) => [item, item === "original" ? "Engineering Foundry" : item[0].toUpperCase() + item.slice(1)] as [string, string])]} />
      <Filter label="Availability" value={filters.availability} onChange={(value) => update("availability", value)} options={[["", "All availability"], ["free", "Free / public"], ["external", "External links"], ["original", "Original prompts"]]} />
      <Filter label="Verification" value={filters.verification} onChange={(value) => update("verification", value)} options={[["", "All verification"], ["verified", "Verified"], ["community-reported", "Community reported"], ["unverified", "Unverified"]]} />
      <Filter label="Sort" value={filters.sort} onChange={(value) => update("sort", value)} options={[["roadmap", "Roadmap order"], ["difficulty", "Difficulty"], ["alphabetical", "Alphabetical"], ["verified", "Recently verified"]]} />
    </div>
    <div className="explorer-summary"><span><strong>{filtered.length}</strong> of {activeQuestions.length} questions</span>{activeCount > 0 && <button type="button" onClick={() => setFilters(defaults)}><RotateCcw size={13} aria-hidden="true" />Clear {activeCount} {activeCount === 1 ? "filter" : "filters"}</button>}</div>
    <QuestionList questions={filtered} />
  </div>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  const id = `filter-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <label htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option value={optionValue} key={optionValue || "all"}>{optionLabel}</option>)}</select></label>;
}
