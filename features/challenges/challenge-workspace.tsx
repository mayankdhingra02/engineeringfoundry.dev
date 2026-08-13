"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardCopy, ExternalLink, RotateCcw, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { ChallengeAssessment, ChallengeRubric, EngineeringChallenge } from "@/types";

type Worksheet = {
  approach: string;
  decision: string;
  tradeoff: string;
  failure: string;
  validation: string;
  reflection: string;
  solutionUrl: string;
};

const emptyWorksheet: Worksheet = { approach: "", decision: "", tradeoff: "", failure: "", validation: "", reflection: "", solutionUrl: "" };
const assessments: ChallengeAssessment[] = ["Strong", "Developing", "Needs attention"];

function buildSolutionSummary(challenge: EngineeringChallenge, worksheet: Worksheet) {
  return [
    "ENGINEERING FOUNDRY CHALLENGE",
    `Challenge: ${challenge.title}`,
    `Category: ${challenge.category}`,
    `Engineering Foundry level: ${challenge.level}`,
    "",
    `Approach:\n${worksheet.approach.trim() || "Not included"}`,
    `Key decision:\n${worksheet.decision.trim() || "Not included"}`,
    `Important tradeoff:\n${worksheet.tradeoff.trim() || "Not included"}`,
    `Failure mode / edge case:\n${worksheet.failure.trim() || "Not included"}`,
    `Validation / testing plan:\n${worksheet.validation.trim() || "Not included"}`,
    `Reflection:\n${worksheet.reflection.trim() || "Not included"}`,
    `Optional solution URL:\n${worksheet.solutionUrl.trim() || "Not included"}`,
    "",
    "Prepared for optional community discussion. This is not an official submission or judged entry.",
  ].join("\n");
}

export function ChallengeWorkspace({ challenge, rubric }: { challenge: EngineeringChallenge; rubric: ChallengeRubric }) {
  const [worksheet, setWorksheet] = useState<Worksheet>(emptyWorksheet);
  const [reviews, setReviews] = useState<Record<string, ChallengeAssessment>>({});
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const opened = useRef(false);
  const revealed = useRef(new Set<string>());

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    track("challenge_opened", { challenge_id: challenge.id, category: challenge.category, level: challenge.level });
  }, [challenge.category, challenge.id, challenge.level]);

  function updateWorksheet<K extends keyof Worksheet>(key: K, value: Worksheet[K]) {
    setWorksheet((current) => ({ ...current, [key]: value }));
  }

  function trackReveal(section: string, isOpen: boolean) {
    if (!isOpen || revealed.current.has(section)) return;
    revealed.current.add(section);
    track("challenge_guidance_opened", { challenge_id: challenge.id, category: challenge.category, level: challenge.level, section });
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildSolutionSummary(challenge, worksheet));
      setCopyState("copied");
      track("challenge_solution_summary_copied", { challenge_id: challenge.id, category: challenge.category, level: challenge.level });
    } catch {
      setCopyState("failed");
    }
  }

  function clearWorksheet() {
    setWorksheet(emptyWorksheet);
    setReviews({});
    setCopyState("idle");
  }

  return <>
    <section className="section section-alt challenge-attempt-section"><div className="page-width"><div className="challenge-attempt-grid">
      <div><span className="section-kicker">Attempt before reveal</span><h2>Build your deliverable independently.</h2><p>Use the prompt, constraints, and workflow first. Guidance offers considerations and questions—not a canonical solution.</p></div>
      <div className="challenge-reveals">
        <details onToggle={(event) => trackReveal("guidance", event.currentTarget.open)}><summary><span>01</span><div><strong>Reveal guidance</strong><small>Directions and questions to test</small></div></summary><div>{challenge.guidance.map((section) => <article key={section.id}><h3>{section.title}</h3><ul>{section.considerations.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></article>)}</div></details>
        <details onToggle={(event) => trackReveal("common_mistakes", event.currentTarget.open)}><summary><span>02</span><div><strong>Reveal common mistakes</strong><small>Failure patterns worth checking</small></div></summary><ul>{challenge.common_mistakes.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></details>
        {challenge.stretch_goals.length > 0 && <details onToggle={(event) => trackReveal("stretch_goals", event.currentTarget.open)}><summary><span>03</span><div><strong>Reveal stretch goals</strong><small>Optional ways to extend the deliverable</small></div></summary><ul>{challenge.stretch_goals.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></details>}
      </div>
    </div></div></section>

    <section className="section" id="self-review"><div className="page-width"><div className="challenge-section-heading"><div><span className="section-kicker">Qualitative self-review</span><h2>{rubric.title}</h2><p>Choose the description that best matches your current deliverable. This is private reflection, not a score or ranking.</p></div><span>{Object.keys(reviews).length} of {rubric.dimensions.length} reviewed</span></div>
      <div className="challenge-rubric">{rubric.dimensions.map((dimension) => <fieldset key={dimension.id}><legend>{dimension.label}</legend><div>{assessments.map((assessment) => { const copyKey = assessment === "Strong" ? "strong" : assessment === "Developing" ? "developing" : "needs_attention"; const inputId = `${dimension.id}-${assessment.toLowerCase().replaceAll(" ", "-")}`; return <label htmlFor={inputId} key={assessment}><span className="sr-only">Choose self-review state</span><input id={inputId} type="radio" name={dimension.id} aria-label={`${dimension.label}: ${assessment}`} checked={reviews[dimension.id] === assessment} onChange={() => { setReviews((current) => ({ ...current, [dimension.id]: assessment })); track("challenge_rubric_used", { challenge_id: challenge.id, category: challenge.category, level: challenge.level, section: dimension.id }); }} /><span><strong>{assessment}</strong><small>{dimension[copyKey]}</small></span></label>; })}</div></fieldset>)}</div>
    </div></section>

    <section className="section section-alt" id="solution-worksheet"><div className="page-width"><div className="challenge-worksheet-shell">
      <div className="challenge-worksheet-heading"><div><span className="section-kicker">Optional solution worksheet</span><h2>Prepare your approach for discussion.</h2><p>Capture your reasoning, then copy a plain-text summary you control.</p></div><button className="button button-ghost button-sm" type="button" onClick={clearWorksheet}><RotateCcw size={14} />Clear worksheet</button></div>
      <div className="challenge-session-note" role="note"><ShieldCheck size={18} /><div><strong>Session only — not saved.</strong><span>Refreshing or leaving this page clears every worksheet field and self-review choice. Nothing is uploaded or officially submitted.</span></div></div>
      <div className="challenge-worksheet-form">
        <div className="form-group full"><label htmlFor="challenge-approach">Approach summary</label><textarea id="challenge-approach" value={worksheet.approach} onChange={(event) => updateWorksheet("approach", event.target.value)} placeholder="Outline the approach you chose and how it works." /></div>
        <div className="form-group"><label htmlFor="challenge-decision">Key decision</label><textarea id="challenge-decision" value={worksheet.decision} onChange={(event) => updateWorksheet("decision", event.target.value)} placeholder="What decision shaped the solution most?" /></div>
        <div className="form-group"><label htmlFor="challenge-tradeoff">Important tradeoff</label><textarea id="challenge-tradeoff" value={worksheet.tradeoff} onChange={(event) => updateWorksheet("tradeoff", event.target.value)} placeholder="What did you gain and give up?" /></div>
        <div className="form-group"><label htmlFor="challenge-failure">Failure mode or edge case</label><textarea id="challenge-failure" value={worksheet.failure} onChange={(event) => updateWorksheet("failure", event.target.value)} placeholder="Which failure or boundary deserves attention?" /></div>
        <div className="form-group"><label htmlFor="challenge-validation">Validation or testing plan</label><textarea id="challenge-validation" value={worksheet.validation} onChange={(event) => updateWorksheet("validation", event.target.value)} placeholder="How would you build confidence in the result?" /></div>
        <div className="form-group full"><label htmlFor="challenge-reflection">Reflection</label><textarea id="challenge-reflection" value={worksheet.reflection} onChange={(event) => updateWorksheet("reflection", event.target.value)} placeholder="What would you change or explore with more time?" /></div>
        <div className="form-group full"><label htmlFor="challenge-solution-url">Optional solution URL</label><input id="challenge-solution-url" type="url" value={worksheet.solutionUrl} onChange={(event) => updateWorksheet("solutionUrl", event.target.value)} placeholder="A GitHub repository, gist, or document you control" /><small>This link remains in the current browser session and is included only if you copy the summary.</small></div>
      </div>
      <div className="challenge-copy-row"><button className="button" type="button" onClick={copySummary}><ClipboardCopy size={15} />Copy solution summary</button><span role="status" aria-live="polite">{copyState === "copied" ? "Solution summary copied." : copyState === "failed" ? "Copy failed—select your worksheet text manually." : "Nothing is sent when you copy."}</span></div>
    </div></div></section>

    <section className="section"><div className="page-width"><div className="challenge-community-panel"><div><span className="section-kicker">Optional community discussion</span><h2>Compare reasoning, not rankings.</h2><p>Discuss this challenge in the Engineering Foundry community if you choose. Share your own work, explain assumptions, critique ideas rather than people, and remove confidential or proprietary material.</p><a className="button" href={siteConfig.discordUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("challenge_community_clicked", { challenge_id: challenge.id, category: challenge.category, level: challenge.level, placement: "challenge_detail" })}>Discuss this challenge <ExternalLink size={15} /></a></div><aside><strong>No official submission or judging</strong><p>Engineering Foundry is not collecting entries, running formal judging, promising prizes, or generating rankings in this phase.</p></aside></div></div></section>
  </>;
}
