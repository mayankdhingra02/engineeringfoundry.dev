"use client";

import { ChevronDown, ExternalLink, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompanyGuideLevel, ReportedQuestion, RoleGuide } from "@/data/company-guides/types";
import { EvidenceBadge } from "./evidence-badge";

function unique(values: string[]) { return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)); }

export function CompanyQuestionBank({ questions, initialLevel, roles, company, levelFirst = false }: { questions: ReportedQuestion[]; initialLevel: CompanyGuideLevel; roles: RoleGuide[]; company: string; levelFirst?: boolean }) {
  const levelLabels = Object.fromEntries(roles.map((role) => [role.id, levelFirst ? `${role.level} · ${role.role}` : `${role.role} · ${role.level}`])) as Partial<Record<CompanyGuideLevel, string>>;
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<CompanyGuideLevel | "all">(initialLevel);
  const [seniority, setSeniority] = useState("all");
  const [topic, setTopic] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [questionType, setQuestionType] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const [year, setYear] = useState("all");

  const topics = unique(questions.map((item) => item.category));
  const patterns = unique(questions.map((item) => item.pattern));
  const seniorities = unique(questions.flatMap((item) => item.normalizedLevels ?? []));
  const confidences = unique(questions.map((item) => item.sourceConfidence ?? ""));
  const years = unique(questions.map((item) => String(item.year))).reverse();
  const visible = useMemo(() => questions.filter((item) => {
    const haystack = `${item.question} ${item.category} ${item.pattern} ${item.notes}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (level === "all" || item.levels.includes(level))
      && (seniority === "all" || item.normalizedLevels?.includes(seniority))
      && (topic === "all" || item.category === topic)
      && (pattern === "all" || item.pattern === pattern)
      && (difficulty === "all" || item.difficulty === difficulty)
      && (questionType === "all" || item.questionType === questionType)
      && (sourceType === "all" || item.sourceType === sourceType)
      && (confidence === "all" || item.sourceConfidence === confidence)
      && (year === "all" || String(item.year) === year);
  }), [confidence, difficulty, level, pattern, query, questionType, questions, seniority, sourceType, topic, year]);

  const reset = () => {
    setQuery(""); setLevel(initialLevel); setSeniority("all"); setTopic("all"); setPattern("all"); setDifficulty("all"); setQuestionType("all"); setSourceType("all"); setConfidence("all"); setYear("all");
  };
  const advancedActiveCount = [seniority, sourceType, confidence, year].filter((value) => value !== "all").length;
  const hasActiveFilters = Boolean(query) || level !== initialLevel || topic !== "all" || pattern !== "all" || difficulty !== "all" || questionType !== "all" || advancedActiveCount > 0;

  return (
    <div className="company-question-browser">
      <div className="company-question-filters" role="group" aria-label="Question bank filters">
        <label className="company-question-search"><span>Search</span><span><Search size={15} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Question, pattern, or note" /></span></label>
        <label><span>Level</span><select value={level} onChange={(event) => setLevel(event.target.value as CompanyGuideLevel | "all")}><option value="all">All levels</option>{roles.map((role) => <option value={role.id} key={role.id}>{levelLabels[role.id]}</option>)}</select></label>
        <label><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All topics</option>{topics.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Pattern</span><select value={pattern} onChange={(event) => setPattern(event.target.value)}><option value="all">All patterns</option>{patterns.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All difficulties</option>{["Easy", "Medium", "Hard", "Unknown"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Type</span><select value={questionType} onChange={(event) => setQuestionType(event.target.value)}><option value="all">All types</option>{["Coding", "HLD", "LLD / OOD", "Practical"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <details className="company-question-more-filters"><summary>More filters{advancedActiveCount > 0 && <span>{advancedActiveCount} active</span>}<ChevronDown size={14} aria-hidden="true" /></summary><div>
          {seniorities.length > 0 && <label><span>Seniority</span><select value={seniority} onChange={(event) => setSeniority(event.target.value)}><option value="all">All seniority</option>{seniorities.map((value) => <option key={value}>{value}</option>)}</select></label>}
          <label><span>Source</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="all">All sources</option><option>Candidate Report</option></select></label>
          {confidences.length > 0 && <label><span>Confidence</span><select value={confidence} onChange={(event) => setConfidence(event.target.value)}><option value="all">All confidence</option>{confidences.map((value) => <option key={value}>{value}</option>)}</select></label>}
          <label><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All years</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div></details>
      </div>
      <div className="company-question-summary"><p role="status" aria-live="polite" aria-atomic="true"><strong>{visible.length}</strong> of {questions.length} reports shown</p><button type="button" onClick={reset} disabled={!hasActiveFilters}><RotateCcw size={12} />Reset filters</button></div>
      {visible.length ? <div className="company-question-table-wrap"><table className="company-question-table"><thead><tr><th>Question</th><th>Level</th><th>Topic / pattern</th><th>Match</th><th>Difficulty</th><th>Reported</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.question}</strong><small>{item.notes}</small>{item.leetcodeId && <span className="company-question-lc">LC {item.leetcodeId}</span>}</td><td>{item.levels.map((itemLevel) => levelLabels[itemLevel] ?? itemLevel).join(", ")}{item.companyTitle && <small>{item.companyTitle}</small>}</td><td>{item.category}<small>{item.pattern}</small></td><td><span className="company-question-match">{item.matchType ?? "Unknown"}</span><small>{item.sourceConfidence ?? "Unrated"}</small></td><td><span className={`company-difficulty ${item.difficulty.toLowerCase()}`}>{item.difficulty}</span></td><td><EvidenceBadge kind="candidate" compact company={company} />{item.location && <small>{item.location}</small>}{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.year}<ExternalLink size={11} /><span className="sr-only">Open candidate report</span></a> : <span className="company-source-pending">{item.year} · Source URL pending</span>}</td></tr>)}</tbody></table></div> : <div className="company-question-empty"><strong>No matching reports</strong><span>Try broadening or resetting the filters.</span></div>}
    </div>
  );
}
