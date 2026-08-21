"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, ListFilter, MessageSquareQuote, RefreshCw, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  activeBehavioralQuestions,
  behavioralCategories,
  behavioralFrameworks,
  behavioralScopes,
  behavioralStoryTypes,
} from "@/data/behavioral";
import { track } from "@/lib/analytics";
import type { BehavioralQuestion } from "@/types";
import { PageHero, SectionHeading } from "./page-shell";
import { PreparationActivityControl } from "./preparation-activity-control";

function setUrlParam(key: string, value: string) {
  const params = new URLSearchParams(window.location.search);
  if (!value || value === "All") params.delete(key); else params.set(key, value);
  window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
}

export function BehavioralPractice() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "All");
  const [storyType, setStoryType] = useState(searchParams.get("story") ?? "All");
  const [scope, setScope] = useState(searchParams.get("scope") ?? "All");
  const initialSlug = searchParams.get("question");
  const [selectedId, setSelectedId] = useState(activeBehavioralQuestions.find((item) => item.slug === initialSlug)?.id ?? activeBehavioralQuestions[0].id);

  const filtered = useMemo(() => activeBehavioralQuestions.filter((question) => {
    const searchable = `${question.prompt} ${question.category} ${question.signals.join(" ")} ${question.storyTypes.join(" ")}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase())
      && (category === "All" || question.category === category)
      && (storyType === "All" || question.storyTypes.includes(storyType))
      && (scope === "All" || question.scope.includes(scope as BehavioralQuestion["scope"][number]));
  }), [category, query, scope, storyType]);

  const selected = activeBehavioralQuestions.find((question) => question.id === selectedId) ?? activeBehavioralQuestions[0];

  useEffect(() => {
    track("behavioral_question_viewed", { question_id: selected.id, category: selected.category, scope: selected.scope[0] });
  }, [selected]);

  function chooseQuestion(question: BehavioralQuestion) {
    setSelectedId(question.id);
    setUrlParam("question", question.slug);
    requestAnimationFrame(() => document.querySelector("#practice")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function randomize() {
    const pool = filtered.length ? filtered : activeBehavioralQuestions;
    const choices = pool.filter((question) => question.id !== selected.id);
    const next = (choices.length ? choices : pool)[Math.floor(Math.random() * (choices.length || pool.length))];
    chooseQuestion(next);
    track("behavioral_prompt_randomized", { question_id: next.id, category: next.category, pool_size: pool.length });
  }

  function trackReveal(section: string, open: boolean) {
    if (open) track("behavioral_guidance_opened", { question_id: selected.id, category: selected.category, section });
  }

  return <>
    <PageHero eyebrow="Behavioral interview practice" title="Build adaptable stories—not memorized scripts." description="Start with real stories, cover the question categories they can answer, tailor truthful framing, then rehearse the version you need.">
      <a className="button" href="#explorer">Explore 35 prompts <ArrowRight size={16} /></a>
      <Link className="button button-secondary" href="/behavioral/workspace">Open private story workspace</Link>
    </PageHero>

    <section className="section behavioral-framework-section"><div className="page-width">
      <SectionHeading eyebrow="Answer framework" title="STAR gives the answer shape; reflection shows growth." description="STAR is a widely used structure, not an Engineering Foundry invention and not a script. Keep the context short enough that your actions remain central." />
      <ol className="behavioral-framework">{behavioralFrameworks.answerFramework.map((step, index) => <li key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{step.plainLabel}</small><h3>{step.label}</h3><p>{step.guidance}</p></div>{index < behavioralFrameworks.answerFramework.length - 1 && <ChevronRight aria-hidden="true" size={16} />}</li>)}</ol>
    </div></section>

    <section className="section section-alt" id="story-inventory"><div className="page-width">
      <SectionHeading eyebrow="Story inventory" title="Ten experiences can cover far more than ten questions." description="Use this as a private worksheet. Nothing is entered, uploaded, or saved—capture your stories somewhere you control." />
      <div className="story-inventory-grid">{behavioralFrameworks.storyInventory.map((story, index) => <article key={story.id}><span>{String(index + 1).padStart(2, "0")}</span><small>{behavioralStoryTypes.find((type) => type.id === story.storyType)?.label}</small><h3>{story.title}</h3><p>{story.prompt}</p><div><b>Context</b><b>Decision</b><b>Outcome</b><b>Reflection</b></div></article>)}</div>
      <p className="privacy-callout"><Sparkles size={16} aria-hidden="true" /><span><strong>Your stories stay yours.</strong> This worksheet has no inputs, persistence, analytics, or account dependency.</span></p>
    </div></section>

    <section className="section" id="explorer"><div className="page-width">
      <SectionHeading eyebrow="Original question explorer" title="Find a prompt that fits the behavior you need to practice." description="Categories and story types are preparation tools, not company-specific interview claims or difficulty ratings." />
      <div className="behavioral-filters" aria-label="Behavioral question filters">
        <label className="behavioral-search"><span>Search prompt text</span><div><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setUrlParam("search", event.target.value); }} placeholder="Search prompts and signals" /></div></label>
        <label><span>Category</span><select value={category} onChange={(event) => { setCategory(event.target.value); setUrlParam("category", event.target.value); }}><option>All</option>{behavioralCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
        <label><span>Story type</span><select value={storyType} onChange={(event) => { setStoryType(event.target.value); setUrlParam("story", event.target.value); }}><option>All</option>{behavioralStoryTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>Scope</span><select value={scope} onChange={(event) => { setScope(event.target.value); setUrlParam("scope", event.target.value); }}><option>All</option>{behavioralScopes.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="behavioral-results-meta"><span>{filtered.length} {filtered.length === 1 ? "prompt" : "prompts"}</span><ListFilter size={14} aria-hidden="true" /></div>
      <div className="behavioral-question-grid">{filtered.map((question) => <button type="button" className={question.id === selected.id ? "selected" : ""} onClick={() => chooseQuestion(question)} key={question.id}><span>{question.category}</span><h3>{question.prompt}</h3><div>{question.storyTypes.slice(0, 2).map((type) => <small key={type}>{behavioralStoryTypes.find((item) => item.id === type)?.label}</small>)}</div><b>Practice this prompt <ArrowRight size={14} /></b></button>)}</div>
      {!filtered.length && <div className="empty-inline"><strong>No prompts match these filters.</strong><span>Try a broader search, category, story type, or scope.</span></div>}
    </div></section>

    <section className="section section-alt behavioral-practice-section" id="practice"><div className="page-width">
      <SectionHeading eyebrow="Practice mode" title="Attempt the answer before revealing the scaffolding." description="There is no timer, saved answer, or official response length. Practice aloud, then inspect the signals and likely follow-ups." action={<button type="button" className="button button-secondary" onClick={randomize} aria-label="Choose another random behavioral prompt"><RefreshCw size={15} /> Random prompt</button>} />
      <article className="behavioral-prompt-card">
        <div className="behavioral-prompt-meta"><span>{selected.category}</span><span>{selected.scope.join(" · ")}</span></div>
        <MessageSquareQuote size={25} aria-hidden="true" />
        <h2>{selected.prompt}</h2>
        <p>Pause here. Pick one truthful experience, identify your responsibility, and answer in your own words before opening any guidance.</p>
        <div className="behavioral-signal-list">{selected.signals.map((signal) => <span key={signal}>{signal}</span>)}</div>
      </article>
      <PreparationActivityControl track="behavioral" itemId={selected.id} noun="prompt practice" />
      <div className="behavioral-reveals">
        <details onToggle={(event) => trackReveal("answer_guidance", event.currentTarget.open)}><summary><span>01</span><div><strong>Reveal answer guidance</strong><small>What a strong answer should make clear</small></div></summary><ul>{selected.answerGuidance.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></details>
        <details onToggle={(event) => trackReveal("follow_ups", event.currentTarget.open)}><summary><span>02</span><div><strong>Reveal possible follow-ups</strong><small>Questions that test ownership and judgment</small></div></summary><ul>{selected.followUps.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></details>
        <details onToggle={(event) => trackReveal("common_mistakes", event.currentTarget.open)}><summary><span>03</span><div><strong>Review common mistakes</strong><small>Ways this answer can lose specificity or credibility</small></div></summary><ul>{selected.commonMistakes.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></details>
      </div>
    </div></section>

    <section className="section"><div className="page-width behavioral-review-grid">
      <div><SectionHeading eyebrow="Common mistakes" title="Protect credibility before polishing delivery." description="Strong behavioral answers are specific, truthful, and reflective. They do not require perfect outcomes." /><div className="behavioral-mistakes">{behavioralFrameworks.commonMistakes.map((mistake) => <article key={mistake.title}><h3>{mistake.title}</h3><p>{mistake.guidance}</p></article>)}</div></div>
      <aside className="behavioral-final-checklist"><small>Before the interview</small><h2>Final story check</h2><ul>{behavioralFrameworks.finalChecklist.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul><Link className="button" href="/interview-tips#checklists">Open the interview playbook <ArrowRight size={15} /></Link></aside>
    </div></section>
  </>;
}
