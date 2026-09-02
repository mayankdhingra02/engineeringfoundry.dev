"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, FilterX, Search, SlidersHorizontal, X } from "lucide-react";
import type { DSACompany, DSAInterviewQuestion, DSAQuestionSourceType } from "@/data/dsa/interview-prep";
import type { DsaProgressMap } from "@/lib/dsa/progress";
import { matchesDsaQuestionSearch } from "@/lib/dsa/question-search";
import { QuestionTable } from "./question-table";

export interface QuestionBrowserFilters {
  search: string;
  company: string;
  difficulty: string;
  topics: string[];
  source: string;
  progress: string;
  page: number;
  pageSize: number;
}

const defaultFilters: QuestionBrowserFilters = { search: "", company: "all", difficulty: "all", topics: [], source: "all", progress: "all", page: 1, pageSize: 25 };

function filterSlug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sourceLabel(type: DSAQuestionSourceType) {
  if (type === "leetcode") return "LeetCode";
  if (type === "leetcode-ca") return "LeetCode.ca";
  return "Other / original";
}

function parseFilters(params: URLSearchParams): QuestionBrowserFilters {
  const pageSize = Number(params.get("pageSize"));
  return {
    search: params.get("q") ?? "",
    company: params.get("company") ?? "all",
    difficulty: params.get("difficulty") ?? "all",
    topics: (params.get("topic") ?? "").split(",").filter(Boolean),
    source: params.get("source") ?? "all",
    progress: params.get("progress") ?? "all",
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize: [25, 50, 100].includes(pageSize) ? pageSize : 25,
  };
}

function filtersToParams(filters: QuestionBrowserFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.company !== "all") params.set("company", filters.company);
  if (filters.difficulty !== "all") params.set("difficulty", filters.difficulty.toLowerCase());
  if (filters.topics.length) params.set("topic", filters.topics.join(","));
  if (filters.source !== "all") params.set("source", filters.source);
  if (filters.progress !== "all") params.set("progress", filters.progress);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 25) params.set("pageSize", String(filters.pageSize));
  return params;
}

function QuestionStats({ questions }: { questions: DSAInterviewQuestion[] }) {
  const counts = questions.reduce((result, question) => ({ ...result, [question.difficulty]: result[question.difficulty] + 1 }), { Easy: 0, Medium: 0, Hard: 0 });
  return <div className="dsa-browser-stats" aria-label="Dataset composition"><article><span>All Questions</span><strong>{questions.length}</strong></article>{(["Easy", "Medium", "Hard"] as const).map((difficulty) => <article className={difficulty.toLowerCase()} key={difficulty}><span>{difficulty}</span><strong>{counts[difficulty]}</strong></article>)}</div>;
}

function TopicQuickFilters({ topics, selected, onToggle }: { topics: Array<{ title: string; slug: string; count: number }>; selected: string[]; onToggle: (slug: string) => void }) {
  const primary = topics.slice(0, 6); const remaining = topics.slice(6);
  return <div className="dsa-topic-quick-filters" aria-label="Quick topic filters"><div>{primary.map((topic) => <button type="button" className={selected.includes(topic.slug) ? "active" : undefined} aria-pressed={selected.includes(topic.slug)} onClick={() => onToggle(topic.slug)} key={topic.slug}>{topic.title}<span>{topic.count}</span></button>)}{remaining.length > 0 && <details><summary>More</summary><div>{remaining.map((topic) => <button type="button" className={selected.includes(topic.slug) ? "active" : undefined} aria-pressed={selected.includes(topic.slug)} onClick={() => onToggle(topic.slug)} key={topic.slug}>{topic.title}<span>{topic.count}</span></button>)}</div></details>}</div></div>;
}

function BrowserCore({ questions, companies, mode, fixedCompanySlug, initialFilters = defaultFilters, filters: controlledFilters, onFiltersChange, progress = {}, signedIn = false, applicationId }: {
  questions: DSAInterviewQuestion[]; companies: DSACompany[]; mode: "preview" | "full"; fixedCompanySlug?: string;
  initialFilters?: QuestionBrowserFilters; filters?: QuestionBrowserFilters; onFiltersChange?: (filters: QuestionBrowserFilters) => void; progress?: DsaProgressMap; signedIn?: boolean; applicationId?: string;
}) {
  const [localFilters, setLocalFilters] = useState<QuestionBrowserFilters>({ ...initialFilters, company: fixedCompanySlug ?? initialFilters.company });
  const filters = controlledFilters === undefined
    ? localFilters
    : { ...controlledFilters, company: fixedCompanySlug ?? controlledFilters.company };
  const [advancedOpen, setAdvancedOpen] = useState((controlledFilters ?? initialFilters).source !== "all");
  const deferredSearch = useDeferredValue(filters.search);

  const companyMap = useMemo(() => new Map(companies.map((company) => [company.slug, company])), [companies]);
  const scopedQuestions = useMemo(() => fixedCompanySlug ? questions.filter((question) => question.companies.some((association) => association.companySlug === fixedCompanySlug)) : questions, [fixedCompanySlug, questions]);
  const topicMetadata = useMemo(() => {
    const counts = new Map<string, { title: string; count: number }>();
    scopedQuestions.forEach((question) => question.topics.forEach((title) => { const slug = filterSlug(title); const current = counts.get(slug); counts.set(slug, { title, count: (current?.count ?? 0) + 1 }); }));
    return [...counts.entries()].map(([slug, value]) => ({ slug, ...value })).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  }, [scopedQuestions]);
  const sourceTypes = useMemo(() => [...new Set(scopedQuestions.flatMap((question) => question.sources.map((source) => source.type)))], [scopedQuestions]);
  const availableCompanies = useMemo(() => [...companies].sort((a, b) => a.name.localeCompare(b.name)), [companies]);

  const filtered = useMemo(() => scopedQuestions.filter((question) => {
    const companyNames = question.companies.map((association) => companyMap.get(association.companySlug)?.name ?? association.companySlug);
    return matchesDsaQuestionSearch(question, deferredSearch, companyNames)
      && (fixedCompanySlug || filters.company === "all" || question.companies.some((association) => association.companySlug === filters.company))
      && (filters.difficulty === "all" || question.difficulty.toLowerCase() === filters.difficulty.toLowerCase())
      && (!filters.topics.length || filters.topics.every((topic) => question.topics.some((title) => filterSlug(title) === topic)))
      && (filters.source === "all" || question.sources.some((source) => source.type === filters.source))
      && (filters.progress === "all"
        || (filters.progress === "bookmarked" ? Boolean(progress[question.id]?.bookmarked) : (progress[question.id]?.status ?? "not_started") === filters.progress));
  }), [companyMap, deferredSearch, filters.company, filters.difficulty, filters.progress, filters.source, filters.topics, fixedCompanySlug, progress, scopedQuestions]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const shown = mode === "preview" ? filtered.slice(0, 4) : filtered.slice((currentPage - 1) * filters.pageSize, currentPage * filters.pageSize);
  const hasFilters = Boolean(filters.search || (!fixedCompanySlug && filters.company !== "all") || filters.difficulty !== "all" || filters.topics.length || filters.source !== "all" || filters.progress !== "all");

  function commit(patch: Partial<QuestionBrowserFilters>, resetPage = true) {
    const next = { ...filters, ...patch, page: resetPage ? 1 : (patch.page ?? filters.page) };
    if (controlledFilters === undefined) setLocalFilters(next);
    onFiltersChange?.(next);
  }
  function toggleTopic(slugOrTitle: string) {
    const slug = filterSlug(slugOrTitle);
    commit({ topics: filters.topics.includes(slug) ? filters.topics.filter((item) => item !== slug) : [...filters.topics, slug] });
  }
  function reset() {
    const next = { ...defaultFilters, company: fixedCompanySlug ?? "all" };
    if (controlledFilters === undefined) setLocalFilters(next);
    onFiltersChange?.(next);
  }

  const resultDescription = [filters.search ? `“${filters.search}”` : undefined, !fixedCompanySlug && filters.company !== "all" ? companyMap.get(filters.company)?.name : undefined, filters.difficulty !== "all" ? filters.difficulty : undefined, ...filters.topics.map((slug) => topicMetadata.find((topic) => topic.slug === slug)?.title), filters.source !== "all" ? sourceLabel(filters.source as DSAQuestionSourceType) : undefined].filter(Boolean).join(" + ");
  const activeFilterCount = Number(!fixedCompanySlug && filters.company !== "all") + Number(filters.difficulty !== "all") + filters.topics.length + Number(filters.source !== "all");
  return <section className={`dsa-question-database ${mode}`} aria-label={mode === "full" ? "Question browser" : "Practice question preview"}>
    {mode === "full" && <header className="dsa-browser-section-heading"><h2>Question library</h2><p>Keep search and core filters close; open source filtering only when you need it.</p></header>}
    {mode === "full" && <QuestionStats questions={scopedQuestions} />}
    {scopedQuestions.some((question) => question.isSample) && <div className="dsa-database-integrity"><strong>Demo company tags</strong><span>Company associations demonstrate the browser and are not verified interview history.</span></div>}
    <div className="dsa-database-filters">
      <label className="search"><span>Search</span><span className="field-with-icon"><Search size={15} aria-hidden="true" /><input type="search" value={filters.search} onChange={(event) => commit({ search: event.target.value })} placeholder="Search title, company, or topic…" /></span></label>
      {!fixedCompanySlug && <label><span>Company</span><select value={filters.company} onChange={(event) => commit({ company: event.target.value })}><option value="all">All companies</option>{availableCompanies.map((company) => <option value={company.slug} key={company.slug}>{company.name}</option>)}</select></label>}
      <label><span>Difficulty</span><select value={filters.difficulty} onChange={(event) => commit({ difficulty: event.target.value })}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label><span>Topics</span><select value="" onChange={(event) => event.target.value && toggleTopic(event.target.value)}><option value="">Add topic</option>{topicMetadata.filter((topic) => !filters.topics.includes(topic.slug)).map((topic) => <option value={topic.slug} key={topic.slug}>{topic.title}</option>)}</select></label>
      {signedIn && <label><span>Progress</span><select value={filters.progress} onChange={(event) => commit({ progress: event.target.value })}><option value="all">Any status</option><option value="not_started">Not started</option><option value="attempted">Attempted</option><option value="solved">Solved</option><option value="review">Review</option><option value="bookmarked">Bookmarked</option></select></label>}
      <details className="dsa-filter-more" open={advancedOpen || filters.source !== "all"} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}><summary><SlidersHorizontal size={14} aria-hidden="true" />More filters{filters.source !== "all" && <span>1</span>}</summary><div><label><span>Source</span><select value={filters.source} onChange={(event) => commit({ source: event.target.value })}><option value="all">All sources</option>{sourceTypes.map((source) => <option value={source} key={source}>{sourceLabel(source)}</option>)}</select></label></div></details>
      <button type="button" className="dsa-filter-reset" onClick={reset} disabled={!hasFilters}><FilterX size={14} />Reset</button>
    </div>
    <div className="dsa-database-results"><span aria-live="polite"><strong>{filtered.length}</strong> question{filtered.length === 1 ? "" : "s"}{resultDescription ? ` matching ${resultDescription}` : ""}</span>{activeFilterCount > 0 && <div className="dsa-active-filters" aria-label="Active filters"><span>Active</span>{!fixedCompanySlug && filters.company !== "all" && <button type="button" onClick={() => commit({ company: "all" })}>{companyMap.get(filters.company)?.name ?? filters.company}<X size={12} aria-hidden="true" /></button>}{filters.difficulty !== "all" && <button type="button" onClick={() => commit({ difficulty: "all" })}>{filters.difficulty}<X size={12} aria-hidden="true" /></button>}{filters.topics.map((slug) => <button type="button" onClick={() => toggleTopic(slug)} key={slug}>{topicMetadata.find((topic) => topic.slug === slug)?.title ?? slug}<X size={12} aria-hidden="true" /></button>)}{filters.source !== "all" && <button type="button" onClick={() => commit({ source: "all" })}>{sourceLabel(filters.source as DSAQuestionSourceType)}<X size={12} aria-hidden="true" /></button>}</div>}</div>
    {mode === "full" && <TopicQuickFilters topics={topicMetadata} selected={filters.topics} onToggle={toggleTopic} />}
    {shown.length > 0 ? <QuestionTable questions={shown} companies={companies} fixedCompanySlug={fixedCompanySlug} selectedCompanySlug={!fixedCompanySlug && filters.company !== "all" ? filters.company : undefined} onToggleTopic={toggleTopic} progress={progress} signedIn={signedIn} applicationId={applicationId} /> : <div className="dsa-database-empty"><FilterX size={20} /><strong>No questions match these filters.</strong><p>Try removing a company, topic, source, progress, or difficulty filter.</p><button type="button" className="button button-secondary" onClick={reset}>Clear filters</button></div>}
    {mode === "full" && pageCount > 1 && <nav className="dsa-database-pagination" aria-label="Question results pages"><label><span>Rows per page</span><select value={filters.pageSize} onChange={(event) => commit({ pageSize: Number(event.target.value) })}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><div><button type="button" disabled={currentPage <= 1} onClick={() => commit({ page: currentPage - 1 }, false)}><ChevronLeft size={14} />Previous</button><span>{currentPage} / {pageCount}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => commit({ page: currentPage + 1 }, false)}>Next<ChevronRight size={14} /></button></div></nav>}
  </section>;
}

export function QuestionBrowser({ questions, companies, fixedCompanySlug, progress = {}, signedIn = false, applicationId }: { questions: DSAInterviewQuestion[]; companies: DSACompany[]; fixedCompanySlug?: string; progress?: DsaProgressMap; signedIn?: boolean; applicationId?: string }) {
  const pathname = usePathname(); const searchParams = useSearchParams(); const queryString = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(queryString)), [queryString]);
  function updateUrl(filters: QuestionBrowserFilters) {
    const params = filtersToParams(filters); const retainedApplication = searchParams.get("application"); if (retainedApplication) params.set("application", retainedApplication); const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }
  return <BrowserCore questions={questions} companies={companies} mode="full" fixedCompanySlug={fixedCompanySlug} filters={filters} onFiltersChange={updateUrl} progress={progress} signedIn={signedIn} applicationId={applicationId} />;
}

export function QuestionBrowserPreviewCore({ questions, companies }: { questions: DSAInterviewQuestion[]; companies: DSACompany[] }) {
  return <BrowserCore questions={questions} companies={companies} mode="preview" />;
}
