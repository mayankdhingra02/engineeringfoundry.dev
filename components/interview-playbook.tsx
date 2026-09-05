"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, CircleDot, Code2, FileLock2, MessageCircle, RotateCcw, ShieldCheck, Waypoints } from "lucide-react";
import { useState } from "react";
import { activeInterviewChecklists, activeInterviewTips, interviewPlaybookSections } from "@/data/interview-tips";
import { track } from "@/lib/analytics";
import { PageHero, SectionHeading } from "./page-shell";
import {
  INTERVIEW_CONTINGENCIES,
  INTERVIEW_DEBRIEF_GROUPS,
  INTERVIEW_LIFECYCLE_PHASES,
  RECRUITER_FOLLOW_UP_TEMPLATES,
} from "@/lib/interview-playbook/lifecycle-guidance";

const trackLinks: Record<string, { href: string; label: string }> = {
  Coding: { href: "/dsa", label: "Open the DSA roadmap" },
  "System Design": { href: "/system-design/start-here/introduction", label: "Practice System Design" },
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
    <PageHero eyebrow="Software engineering interview execution guide" title="Turn preparation into clear interview execution." description="Use concise, adaptable guidance for clarifying prompts, communicating decisions, recovering from mistakes, validating work, and handling interview-day logistics.">
      <a className="button" href="#playbook">Open the execution guide <ArrowRight size={16} /></a>
      <Link className="button button-secondary" href="/interview-tips/rounds">Browse round guides</Link>
      <a className="button button-secondary" href="#checklists">Open final-preparation checklists</a>
    </PageHero>

    <section className="section playbook-map-section"><div className="page-width">
      <SectionHeading eyebrow="Round execution map" title="Know the next useful move without memorizing scripts." description="Each section focuses on observable interview behavior. Adapt the sequence to the actual format and instructions you receive." />
      <nav className="playbook-map" aria-label="Interview execution guide sections">{interviewPlaybookSections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{section.title}</strong><small>{section.count} {section.count === 1 ? "guide" : "guides"}</small></a>)}</nav>
    </div></section>

    <section className="section section-alt" id="playbook"><div className="page-width playbook-sections">
      {interviewPlaybookSections.map((section, index) => {
        const items = activeInterviewTips.filter((tip) => tip.category === section.title);
        const related = trackLinks[section.title];
        return <section className="playbook-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
          <header><span>{String(index + 1).padStart(2, "0")}</span><div><small>Execution section</small><h2 id={`${section.id}-title`}>{section.title}</h2></div>{related && <Link href={related.href}>{related.label} <ArrowRight size={14} /></Link>}</header>
          <div className="playbook-tip-grid">{items.map((tip) => <details key={tip.id} onToggle={(event) => { if (event.currentTarget.open) track("interview_playbook_section_viewed", { section: section.id, tip_id: tip.id }); }}><summary><span className="icon-well">{section.title === "Coding" ? <Code2 size={18} /> : section.title.includes("Design") ? <Waypoints size={18} /> : section.title === "Communication" ? <MessageCircle size={18} /> : section.title === "Recovering When Stuck" ? <RotateCcw size={18} /> : <CircleDot size={18} />}</span><span><strong>{tip.title}</strong><small>{tip.whyItMatters}</small></span></summary><div><h3>Do this</h3><ul>{tip.guidance.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul><h3>Avoid</h3><ul>{tip.avoid.map((item) => <li key={item}><CircleDot size={12} />{item}</li>)}</ul></div></details>)}</div>
        </section>;
      })}
    </div></section>

    <section className="section" id="checklists"><div className="page-width">
      <SectionHeading eyebrow="Final-preparation checklists" title="Useful for this session. Gone on refresh." description="These checkboxes live only in browser memory. They are not stored locally, sent to Supabase, or treated as personal progress or readiness evidence." />
      <div className="session-only-banner"><ShieldCheck size={18} aria-hidden="true" /><span><strong>Session only — not saved</strong> Refreshing or leaving the page may clear every check.</span></div>
      <div className="interview-checklist-grid">{activeInterviewChecklists.map((checklist) => <fieldset key={checklist.id}><legend><small>{checklist.timing}</small><span>{checklist.title}</span></legend><p>{checklist.description}</p><div>{checklist.items.map((item) => { const key = `${checklist.id}:${item.id}`; return <label key={item.id}><input type="checkbox" checked={Boolean(checked[key])} onChange={(event) => toggle(checklist.id, item.id, event.target.checked)} /><span><CheckCircle2 size={16} aria-hidden="true" />{item.label}</span></label>; })}</div></fieldset>)}</div>
    </div></section>

    <section className="section section-alt" id="final-stretch"><div className="page-width">
      <SectionHeading eyebrow="Final stretch" title="Change the plan as the interview gets closer." description="The final week is not the ordinary plan with more urgency. Reduce novelty, confirm facts, and protect the next round." />
      <div className="playbook-lifecycle-grid">
        {INTERVIEW_LIFECYCLE_PHASES.map((phase) => <article key={phase.id}>
          <div className="feature-card-top"><span className="demo-label">{phase.label}</span></div>
          <h3>{phase.title}</h3>
          <p>{phase.intent}</p>
          <ul>{phase.actions.map((action) => <li key={action}>{action}</li>)}</ul>
          <p><strong>Avoid:</strong> {phase.avoid}</p>
        </article>)}
      </div>
    </div></section>

    <section className="section" id="contingencies"><div className="page-width">
      <SectionHeading eyebrow="When the plan breaks" title="Preserve facts and use the right contact path." description="A disruption needs a bounded response. It is not evidence of ability, and this guide does not make medical or legal determinations." />
      <div className="playbook-contingency-grid">
        {INTERVIEW_CONTINGENCIES.map((contingency) => <article key={contingency.event}>
          <div className="feature-card-top"><span className="icon-well"><CircleAlert size={18} aria-hidden="true" /></span></div>
          <h3>{contingency.event}</h3>
          <p>{contingency.response}</p>
        </article>)}
      </div>
    </div></section>

    <section className="section section-alt" id="debrief"><div className="page-width">
      <SectionHeading eyebrow="Private debrief" title="Separate what happened from what you think it means." description="Use category-level notes. Do not reconstruct proprietary prompts, publish automatically, or turn a feeling into a hiring prediction." />
      <div className="session-only-banner"><FileLock2 size={18} aria-hidden="true" /><span><strong>Keep the debrief private.</strong> Signed-in round workspaces store the reflection with the owning round; the public checklist does not save it.</span></div>
      <div className="playbook-debrief-grid">
        {INTERVIEW_DEBRIEF_GROUPS.map((group) => <article key={group.title}>
          <h3>{group.title}</h3>
          <ul>{group.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
        </article>)}
      </div>
      <div className="hero-actions">
        <Link className="button" href="/applications">Open the owning application</Link>
        <Link className="button button-secondary" href="/salary-negotiation">Offer recorded? Open Salary Negotiation</Link>
      </div>
    </div></section>

    <section className="section" id="follow-up"><div className="page-width">
      <SectionHeading eyebrow="Recruiter follow-up" title="Use the promised timeline before a generic convention." description="These are editable starting points, not automated messages. Confirm the recipient, facts, and current employer instruction before sending anything." />
      <div className="playbook-tip-grid">
        {RECRUITER_FOLLOW_UP_TEMPLATES.map((template) => <details key={template.title}>
          <summary><span className="icon-well"><MessageCircle size={18} aria-hidden="true" /></span><span><strong>{template.title}</strong><small>Editable template</small></span></summary>
          <div><p>{template.body}</p></div>
        </details>)}
      </div>
      <p className="prep-privacy">Do not automate repeated chasing. Thank-you messaging is optional and is never scored.</p>
    </div></section>

    <section className="section section-alt"><div className="page-width truthful-recovery">
      <div><small>When the answer is not immediate</small><h2>Recover with a smaller truthful step.</h2><p>Pause, state what you know, choose the nearest useful anchor, and make one precise move. In behavioral rounds, use the closest experience you actually had—never manufacture the perfect story.</p></div>
      <div><article><Code2 size={18} /><h3>Coding</h3><p>Simplify the example, establish a correct baseline, then locate the next decision.</p></article><article><Waypoints size={18} /><h3>Design</h3><p>Return to requirements and trace the primary read, write, prediction, or feedback path.</p></article><article><MessageCircle size={18} /><h3>Behavioral</h3><p>Take a moment, select the closest truthful story, and state why it is relevant.</p></article></div>
    </div></section>

    <section className="section"><div className="page-width">
      <SectionHeading eyebrow="Evidence and boundaries" title="See how this guidance was assembled." description="The methodology distinguishes official employer facts, assessment research, accessibility guidance, editorial synthesis, and user-confirmed application facts." />
      <Link className="button button-secondary" href="/interview-tips/methodology">Read the source methodology <ArrowRight size={15} aria-hidden="true" /></Link>
    </div></section>
  </>;
}
