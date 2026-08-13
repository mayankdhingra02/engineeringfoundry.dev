"use client";

import { Check, Circle, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { companies } from "@/data/fixtures/companies";
import { dsaTopics, questions } from "@/data/fixtures/questions";
import { track } from "@/lib/analytics";
import { StatusPill } from "@/components/page-shell";

export function DsaExplorer() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All difficulties");
  const [topic, setTopic] = useState("All topics");
  const [company, setCompany] = useState("All companies");
  const filtered = useMemo(() => questions.filter((question) => {
    const matchesSearch = `${question.title} ${question.topic} ${question.companies.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (difficulty === "All difficulties" || question.difficulty === difficulty) && (topic === "All topics" || question.topic === topic) && (company === "All companies" || question.companies.includes(company));
  }), [search, difficulty, topic, company]);

  return <>
    <div className="progress-card"><div className="progress-ring"><span>33%</span></div><div><h2>Demo progress</h2><p>2 of 6 sample questions marked complete. Sign in will persist this later.</p></div><span>Foundation track</span></div>
    <div className="filter-bar"><label><Search size={16} /><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or topics…" /></label>
      <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty"><option>All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
      <select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Filter by topic">{dsaTopics.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={company} onChange={(event) => setCompany(event.target.value)} aria-label="Filter by company"><option>All companies</option>{companies.map((item) => <option key={item.slug}>{item.name}</option>)}</select>
      <span className="filter-count">{filtered.length} demo questions</span>
    </div>
    <div className="data-table"><div className="table-head"><span /><span>Question</span><span>Difficulty</span><span>Topic</span><span>Companies</span><span /></div>
      {filtered.map((question) => <div className="question-row" key={question.id}><span className={`check-state ${question.completed ? "done" : ""}`}>{question.completed ? <Check size={12} /> : <Circle size={8} />}</span><span className="question-title">{question.title}</span><span data-col="difficulty"><StatusPill tone={question.difficulty === "Easy" ? "success" : question.difficulty === "Hard" ? "danger" : "warning"}>{question.difficulty}</StatusPill></span><span data-col="topic" className="muted">{question.topic}</span><span data-col="companies" className="tag-list">{question.companies.map((item) => <span className="tag" key={item}>{item}</span>)}</span><a className="icon-button" href={question.externalUrl} target="_blank" rel="noreferrer" aria-label={`Open ${question.title} externally`} onClick={() => track("dsa_question_clicked", { question_id: question.id, topic: question.topic })}><ExternalLink size={15} /></a></div>)}
      {!filtered.length && <div className="empty-inline"><strong>No matching demo questions</strong><span>Clear a filter or try another search.</span></div>}
    </div>
  </>;
}
