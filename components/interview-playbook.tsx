"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDot, Code2, MessageCircle, RotateCcw, ShieldCheck, Waypoints } from "lucide-react";
import { useState } from "react";
import { activeInterviewChecklists, activeInterviewTips, interviewPlaybookSections } from "@/data/interview-tips";
import { track } from "@/lib/analytics";
import { PageHero, SectionHeading } from "./page-shell";

const trackLinks: Record<string, { href: string; label: string }> = {
  Coding: { href: "/dsa", label: "Open the DSA roadmap" },
  "System Design": { href: "/system-design", label: "Practice System Design" },
  "ML Design": { href: "/ml-design", label: "Practice ML Design" },
  Behavioral: { href: "/behavioral", label: "Practice behavioral prompts" },
};

export function InterviewPlaybook() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(checklistId: string, itemId: string, value: boolean) {
    const key = `${checklistId}:${itemId}`;
    setChecked((current) => ({ ...current, [key]: value }));
    track("interview_checklist_used", { checklist_id: checklistId, item_id: itemId, checked: value });
  }

  return <>
    <PageHero eyebrow="Software engineering interview playbook" title="A calmer plan for every stage of the interview." description="Use concise guidance and session-only checklists for preparation, coding, design, behavioral conversations, recovery, and follow-up.">
      <a className="button" href="#playbook">Open the playbook <ArrowRight size={16} /></a>
      <a className="button button-secondary" href="#checklists">Run a readiness check</a>
    </PageHero>

    <section className="section playbook-map-section"><div className="page-width">
      <SectionHeading eyebrow="Interview-day map" title="Know the next useful move without memorizing secret phrases." description="Each section focuses on observable habits. Adapt the sequence to the format and instructions you actually receive." />
      <nav className="playbook-map" aria-label="Interview playbook sections">{interviewPlaybookSections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{section.title}</strong><small>{section.count} {section.count === 1 ? "guide" : "guides"}</small></a>)}</nav>
    </div></section>

    <section className="section section-alt" id="playbook"><div className="page-width playbook-sections">
      {interviewPlaybookSections.map((section, index) => {
        const items = activeInterviewTips.filter((tip) => tip.category === section.title);
        const related = trackLinks[section.title];
        return <section className="playbook-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
          <header><span>{String(index + 1).padStart(2, "0")}</span><div><small>Playbook section</small><h2 id={`${section.id}-title`}>{section.title}</h2></div>{related && <Link href={related.href}>{related.label} <ArrowRight size={14} /></Link>}</header>
          <div className="playbook-tip-grid">{items.map((tip) => <details key={tip.id} onToggle={(event) => { if (event.currentTarget.open) track("interview_playbook_section_viewed", { section: section.id, tip_id: tip.id }); }}><summary><span className="icon-well">{section.title === "Coding" ? <Code2 size={18} /> : section.title.includes("Design") ? <Waypoints size={18} /> : section.title === "Communication" ? <MessageCircle size={18} /> : section.title === "Recovering When Stuck" ? <RotateCcw size={18} /> : <CircleDot size={18} />}</span><span><strong>{tip.title}</strong><small>{tip.whyItMatters}</small></span></summary><div><h3>Do this</h3><ul>{tip.guidance.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul><h3>Avoid</h3><ul>{tip.avoid.map((item) => <li key={item}><CircleDot size={12} />{item}</li>)}</ul></div></details>)}</div>
        </section>;
      })}
    </div></section>

    <section className="section" id="checklists"><div className="page-width">
      <SectionHeading eyebrow="Interactive readiness checks" title="Useful for this session. Gone on refresh." description="These checkboxes live only in browser memory. They are not stored locally, sent to Supabase, or treated as personal progress." />
      <div className="session-only-banner"><ShieldCheck size={18} aria-hidden="true" /><span><strong>Session only — not saved</strong> Refreshing or leaving the page may clear every check.</span></div>
      <div className="interview-checklist-grid">{activeInterviewChecklists.map((checklist) => <fieldset key={checklist.id}><legend><small>{checklist.timing}</small><span>{checklist.title}</span></legend><p>{checklist.description}</p><div>{checklist.items.map((item) => { const key = `${checklist.id}:${item.id}`; return <label key={item.id}><input type="checkbox" checked={Boolean(checked[key])} onChange={(event) => toggle(checklist.id, item.id, event.target.checked)} /><span><CheckCircle2 size={16} aria-hidden="true" />{item.label}</span></label>; })}</div></fieldset>)}</div>
    </div></section>

    <section className="section section-alt"><div className="page-width truthful-recovery">
      <div><small>When the answer is not immediate</small><h2>Recover with a smaller truthful step.</h2><p>Pause, state what you know, choose the nearest useful anchor, and make one precise move. In behavioral rounds, use the closest experience you actually had—never manufacture the perfect story.</p></div>
      <div><article><Code2 size={18} /><h3>Coding</h3><p>Simplify the example, establish a correct baseline, then locate the next decision.</p></article><article><Waypoints size={18} /><h3>Design</h3><p>Return to requirements and trace the primary read, write, prediction, or feedback path.</p></article><article><MessageCircle size={18} /><h3>Behavioral</h3><p>Take a moment, select the closest truthful story, and state why it is relevant.</p></article></div>
    </div></section>
  </>;
}
