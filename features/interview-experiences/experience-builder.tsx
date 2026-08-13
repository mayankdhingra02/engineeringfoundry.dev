"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clipboard, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { experienceGuidance, experienceRoundTypes, experienceTopics } from "@/data/interview-experiences";
import { track } from "@/lib/analytics";
import type { ExperienceTopicCategory } from "@/types";

type DraftRound = { id: number; typeId: string; topics: string[]; notes: string };
type DraftState = {
  company: string;
  role: string;
  level: string;
  regionMode: string;
  region: string;
  periodMode: string;
  periodMonth: string;
  periodYear: string;
  result: string;
  overallSummary: string;
  preparationLessons: string;
  whatWentWell: string;
  whatWouldChange: string;
  whatSurprisedYou: string;
  whatYouLearned: string;
};

const emptyDraft = (company = ""): DraftState => ({ company, role: "", level: "", regionMode: "", region: "", periodMode: "", periodMonth: "", periodYear: "", result: "", overallSummary: "", preparationLessons: "", whatWentWell: "", whatWouldChange: "", whatSurprisedYou: "", whatYouLearned: "" });
const topicCategories: ExperienceTopicCategory[] = ["Coding", "System Design", "ML", "Behavioral"];
const roundCountBucket = (count: number) => count >= 4 ? "4+" : String(count);
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function ExperienceBuilder({ initialCompany = "", sourceRoute = "interview_experiences" }: { initialCompany?: string; sourceRoute?: string }) {
  const [draft, setDraft] = useState<DraftState>(() => emptyDraft(initialCompany));
  const [rounds, setRounds] = useState<DraftRound[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const nextRoundId = useRef(1);
  const opened = useRef(false);
  const guidanceOpened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    track("experience_builder_opened", { mode: initialCompany ? "company_prefilled" : "general", source_route: sourceRoute });
  }, [initialCompany, sourceRoute]);

  const invalidateOutput = () => { setGeneratedSummary(""); setCopyStatus(""); };
  const updateDraft = (field: keyof DraftState, value: string) => { setDraft((current) => ({ ...current, [field]: value })); invalidateOutput(); };
  const updateRound = (id: number, patch: Partial<DraftRound>) => { setRounds((current) => current.map((round) => round.id === id ? { ...round, ...patch } : round)); invalidateOutput(); };

  function addRound() {
    const nextCount = rounds.length + 1;
    setRounds((current) => [...current, { id: nextRoundId.current++, typeId: "", topics: [], notes: "" }]);
    invalidateOutput();
    track("experience_round_added", { round_count_bucket: roundCountBucket(nextCount), source_route: sourceRoute });
  }

  function removeRound(id: number) {
    const nextCount = Math.max(0, rounds.length - 1);
    setRounds((current) => current.filter((round) => round.id !== id));
    invalidateOutput();
    track("experience_round_removed", { round_count_bucket: roundCountBucket(nextCount), source_route: sourceRoute });
  }

  function toggleTopic(round: DraftRound, topicId: string) {
    updateRound(round.id, { topics: round.topics.includes(topicId) ? round.topics.filter((id) => id !== topicId) : [...round.topics, topicId] });
  }

  function displayPeriod() {
    if (draft.periodMode === "prefer-not") return "Prefer not to say";
    if (!draft.periodYear) return "Not provided";
    if (draft.periodMode === "month-year") {
      return draft.periodMonth ? `${draft.periodMonth} ${draft.periodYear}` : draft.periodYear;
    }
    return draft.periodYear;
  }

  function displayRegion() {
    if (draft.regionMode === "remote") return "Remote";
    if (draft.regionMode === "prefer-not") return "Prefer not to say";
    return draft.region || "Not provided";
  }

  function generateSummary() {
    const roundSections = rounds.length ? rounds.map((round, index) => {
      const roundType = experienceRoundTypes.find((item) => item.id === round.typeId)?.label ?? "Not specified";
      const topics = round.topics.map((id) => experienceTopics.find((topic) => topic.id === id)?.label).filter(Boolean);
      return [`Round ${index + 1} — ${roundType}`, "Focus areas:", ...(topics.length ? topics.map((topic) => `- ${topic}`) : ["- Not provided"]), "", "High-level process notes:", round.notes.trim() || "Not provided"].join("\n");
    }).join("\n\n") : "No rounds documented.";
    const summary = [
      "Interview Experience Summary",
      "",
      `Company: ${draft.company.trim() || "Not provided"}`,
      `Role: ${draft.role.trim() || "Not provided"}`,
      `Level: ${draft.level || "Not provided"}`,
      `Interview period: ${displayPeriod()}`,
      `Region: ${displayRegion()}`,
      `Result: ${draft.result || "Not provided"}`,
      "",
      "PROCESS",
      "",
      roundSections,
      "",
      "OVERALL REFLECTION",
      "",
      `Overall summary:\n${draft.overallSummary.trim() || "Not provided"}`,
      "",
      `What went well:\n${draft.whatWentWell.trim() || "Not provided"}`,
      "",
      `What I would prepare differently:\n${draft.whatWouldChange.trim() || "Not provided"}`,
      "",
      `What surprised me:\n${draft.whatSurprisedYou.trim() || "Not provided"}`,
      "",
      `Preparation lessons:\n${draft.preparationLessons.trim() || "Not provided"}`,
      "",
      `What I learned:\n${draft.whatYouLearned.trim() || "Not provided"}`,
      "",
      "This summary intentionally omits exact proprietary interview questions and interviewer identities."
    ].join("\n");
    setGeneratedSummary(summary);
    setCopyStatus("");
    track("experience_summary_generated", { round_count_bucket: roundCountBucket(rounds.length), source_route: sourceRoute });
  }

  async function copySummary() {
    if (!generatedSummary || !experienceGuidance.safetyChecklist.every((item) => checks[item.id])) return;
    try {
      await navigator.clipboard.writeText(generatedSummary);
      setCopyStatus("Safe summary copied. Nothing was sent to Engineering Foundry.");
      track("experience_summary_copied", { round_count_bucket: roundCountBucket(rounds.length), source_route: sourceRoute });
    } catch {
      setCopyStatus("Copy failed. Select the preview text and copy it manually.");
    }
  }

  function clearDraft() {
    setDraft(emptyDraft());
    setRounds([]);
    setChecks({});
    setGeneratedSummary("");
    setCopyStatus("Draft cleared from this page session.");
    nextRoundId.current = 1;
    track("experience_draft_cleared", { mode: initialCompany ? "company_prefilled" : "general", source_route: sourceRoute });
  }

  const checklistComplete = experienceGuidance.safetyChecklist.every((item) => checks[item.id]);

  return <div className="experience-builder" id="write-up-builder">
    <header className="experience-builder-header"><div><span className="section-kicker">Private writing workspace</span><h2>Build a useful, privacy-conscious reflection.</h2><p>Describe process and topic context at a high level. This is not a question-leaking or submission tool.</p></div><button className="button button-ghost" type="button" onClick={clearDraft}><RotateCcw size={15} />Clear draft</button></header>
    <div className="experience-privacy-banner" role="note"><ShieldCheck size={20} /><div><strong>Draft is session-only and is not sent to Engineering Foundry.</strong><span>Refreshing or leaving clears it. Share only information you are permitted and comfortable making public.</span></div></div>

    <details className="experience-guidance" onToggle={(event) => { if (event.currentTarget.open && !guidanceOpened.current) { guidanceOpened.current = true; track("experience_guidance_opened", { placement: "builder_privacy", source_route: sourceRoute }); } }}>
      <summary>Privacy and writing guidance</summary>
      <div><section><h3>Keep the context useful</h3><ul>{experienceGuidance.writingGuidance.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>Keep private material out</h3><ul>{experienceGuidance.privacyGuidance.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
    </details>

    <form className="experience-form" onSubmit={(event) => { event.preventDefault(); generateSummary(); }}>
      <section className="experience-form-section" aria-labelledby="experience-context-heading"><div className="experience-section-heading"><span>01</span><div><h3 id="experience-context-heading">Experience context</h3><p>Use broad, privacy-conscious details. Every field is optional.</p></div></div><div className="experience-field-grid">
        <label className="form-group"><span>Company</span><input value={draft.company} onChange={(event) => updateDraft("company", event.target.value)} placeholder="Any company name" autoComplete="organization" /></label>
        <label className="form-group"><span>Role</span><input value={draft.role} onChange={(event) => updateDraft("role", event.target.value)} placeholder="Software Engineer" autoComplete="organization-title" /></label>
        <label className="form-group"><span>Level</span><select value={draft.level} onChange={(event) => updateDraft("level", event.target.value)}><option value="">Prefer not to say / not provided</option><option>Early career</option><option>Mid-level</option><option>Senior</option><option>Staff+</option><option>Management</option></select></label>
        <label className="form-group"><span>Region format</span><select value={draft.regionMode} onChange={(event) => updateDraft("regionMode", event.target.value)}><option value="">Country or general region</option><option value="remote">Remote</option><option value="prefer-not">Prefer not to say</option></select></label>
        {draft.regionMode === "" && <label className="form-group"><span>Country or general region</span><input value={draft.region} onChange={(event) => updateDraft("region", event.target.value)} placeholder="United States, Europe, APAC…" /><small>Do not enter an address, room, or precise interviewer location.</small></label>}
        <label className="form-group"><span>Interview period format</span><select value={draft.periodMode} onChange={(event) => { updateDraft("periodMode", event.target.value); updateDraft("periodMonth", ""); updateDraft("periodYear", ""); }}><option value="">Choose a privacy level</option><option value="month-year">Month + year</option><option value="year">Year only</option><option value="prefer-not">Prefer not to say</option></select></label>
        {draft.periodMode === "month-year" && <label className="form-group"><span>Interview month</span><select value={draft.periodMonth} onChange={(event) => updateDraft("periodMonth", event.target.value)}><option value="">Choose month</option>{months.map((month) => <option key={month}>{month}</option>)}</select></label>}
        {(draft.periodMode === "month-year" || draft.periodMode === "year") && <label className="form-group"><span>Interview year</span><input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={draft.periodYear} onChange={(event) => updateDraft("periodYear", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2026" /></label>}
        <label className="form-group"><span>Result (optional)</span><select value={draft.result} onChange={(event) => updateDraft("result", event.target.value)}><option value="">Not provided</option><option>Offer</option><option>No offer</option><option>Withdrew</option><option>In progress</option><option>Prefer not to say</option></select><small>An outcome is context, not a judgment of candidate quality.</small></label>
        <label className="form-group full"><span>Overall process summary</span><textarea rows={4} value={draft.overallSummary} onChange={(event) => updateDraft("overallSummary", event.target.value)} placeholder="Summarize the structure, pace, and your general experience without exact questions or identities." /></label>
      </div></section>

      <section className="experience-form-section" aria-labelledby="experience-rounds-heading"><div className="experience-section-heading"><span>02</span><div><h3 id="experience-rounds-heading">Process rounds</h3><p>Round types are neutral options, not claims about any company.</p></div><button className="button button-secondary" type="button" onClick={addRound}><Plus size={15} />Add round</button></div>
        {!rounds.length && <div className="experience-round-empty"><strong>No rounds added yet.</strong><span>Add only the stages you want to remember.</span></div>}
        <div className="experience-round-list">{rounds.map((round, index) => <fieldset className="experience-round" key={round.id}><legend>Round {index + 1}</legend><div className="experience-round-top"><label className="form-group"><span>Round type</span><select value={round.typeId} onChange={(event) => updateRound(round.id, { typeId: event.target.value })}><option value="">Choose a neutral type</option>{experienceRoundTypes.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}</select></label><button className="icon-button" type="button" onClick={() => removeRound(round.id)} aria-label={`Remove round ${index + 1}`}><Trash2 size={16} /></button></div>
          <details className="experience-topic-picker"><summary>Choose high-level focus areas <span>{round.topics.length} selected</span></summary><div>{topicCategories.map((category) => <fieldset key={category}><legend>{category}</legend><div>{experienceTopics.filter((topic) => topic.category === category).map((topic) => <label key={topic.id}><input type="checkbox" checked={round.topics.includes(topic.id)} onChange={() => toggleTopic(round, topic.id)} /><span>{topic.label}</span></label>)}</div></fieldset>)}</div></details>
          <label className="form-group"><span>High-level process notes</span><textarea rows={4} value={round.notes} onChange={(event) => updateRound(round.id, { notes: event.target.value })} placeholder="Describe the format, focus, and your experience." /><small>Do not paste exact proprietary questions, interviewer identities, private links, or confidential material.</small></label>
        </fieldset>)}</div>
      </section>

      <section className="experience-form-section" aria-labelledby="experience-reflection-heading"><div className="experience-section-heading"><span>03</span><div><h3 id="experience-reflection-heading">Reflection and preparation</h3><p>Turn the experience into useful learning rather than a question bank.</p></div></div><div className="experience-field-grid">
        <label className="form-group"><span>What went well?</span><textarea rows={4} value={draft.whatWentWell} onChange={(event) => updateDraft("whatWentWell", event.target.value)} /></label>
        <label className="form-group"><span>What would you prepare differently?</span><textarea rows={4} value={draft.whatWouldChange} onChange={(event) => updateDraft("whatWouldChange", event.target.value)} /></label>
        <label className="form-group"><span>What surprised you about the process?</span><textarea rows={4} value={draft.whatSurprisedYou} onChange={(event) => updateDraft("whatSurprisedYou", event.target.value)} /></label>
        <label className="form-group"><span>What preparation would you recommend?</span><textarea rows={4} value={draft.preparationLessons} onChange={(event) => updateDraft("preparationLessons", event.target.value)} /></label>
        <label className="form-group full"><span>What did you learn?</span><textarea rows={4} value={draft.whatYouLearned} onChange={(event) => updateDraft("whatYouLearned", event.target.value)} /></label>
      </div></section>

      <div className="experience-generate-row"><button className="button" type="submit">Generate safe summary</button><span>Generation happens entirely in this page session.</span></div>
    </form>

    <section className="experience-output" aria-labelledby="experience-output-heading"><div className="experience-output-heading"><div><span className="section-kicker">Controlled output</span><h3 id="experience-output-heading">Safe summary preview</h3></div>{generatedSummary && <CheckCircle2 size={20} />}</div>{generatedSummary ? <pre aria-label="Generated safe interview experience summary">{generatedSummary}</pre> : <div className="experience-preview-empty"><strong>No summary generated yet.</strong><span>Complete only the fields you want, then generate a polished local preview.</span></div>}
      <fieldset className="experience-safety-checklist"><legend>Safety checklist before copy</legend><p>These checks support a careful review; they do not guarantee legal or policy compliance.</p><div>{experienceGuidance.safetyChecklist.map((item) => <label key={item.id}><input type="checkbox" checked={Boolean(checks[item.id])} onChange={(event) => { setChecks((current) => ({ ...current, [item.id]: event.target.checked })); setCopyStatus(""); }} /><span>{item.label}</span></label>)}</div></fieldset>
      <div className="experience-copy-row"><button className="button" type="button" onClick={copySummary} disabled={!generatedSummary || !checklistComplete}><Clipboard size={15} />Copy safe summary</button><span role="status" aria-live="polite">{copyStatus || (!checklistComplete ? "Complete the safety checklist before copying." : "Ready to copy locally.")}</span></div>
    </section>

    <aside className="experience-community-note"><div><strong>Discuss interview preparation in the Engineering Foundry community</strong><p>Keep proprietary questions and confidential details out of public discussion.</p></div><a className="button button-secondary" href={siteConfig.discordUrl} onClick={() => track("experience_community_clicked", { placement: "builder_footer", source_route: sourceRoute })}>Open Discord</a></aside>
  </div>;
}
