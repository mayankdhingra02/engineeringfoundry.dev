"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Send, Trash2, Undo2 } from "lucide-react";
import { experienceRoundTypes, experienceTopics } from "@/data/interview-experiences";
import { manageInterviewExperience, saveInterviewExperience, type ExperienceSubmissionInput } from "@/app/interview-experiences/actions";

const initial: ExperienceSubmissionInput = { companyName: "", roleTitle: "", roleLevel: "", region: "", interviewDate: "", summary: "", preparationLessons: "", publicIdentity: "anonymous", publicationConsent: false, roundType: "", topics: [] };
type OwnedExperience = { id: string; status: string; company_name: string; role_title: string; updated_at: string; review_note: string | null };

export function ExperienceSubmission({ signedIn, owned }: { signedIn: boolean; owned: readonly OwnedExperience[] }) {
  const [input, setInput] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const update = <K extends keyof ExperienceSubmissionInput>(key: K, value: ExperienceSubmissionInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const save = (submit: boolean) => startTransition(async () => {
    const result = await saveInterviewExperience(input, submit);
    setMessage(result.ok ? (submit ? "Submitted for privacy and moderation review. You can withdraw it while it is under review." : "Private draft saved. It is not public.") : result.error ?? "Your experience could not be saved.");
    if (result.ok) setInput(initial);
  });
  const manage = (id: string, action: "withdraw" | "delete") => startTransition(async () => {
    const result = await manageInterviewExperience(id, action);
    setMessage(result.ok ? (action === "withdraw" ? "Submission withdrawn. It is no longer public or under review." : "Draft deleted.") : result.error ?? "Your submission could not be updated.");
  });

  if (!signedIn) return <div className="experience-directory-empty"><div><strong>Share a process-level experience when you are signed in.</strong><p>Your report starts private, goes through review, and only approved reports can appear here. Never include exact questions, interviewer identities, private links, or confidential material.</p></div><a className="button" href="/signin?next=/interview-experiences#contribute">Sign in to contribute</a></div>;

  return <div className="experience-submission" id="contribute">
    <div className="experience-submission-intro"><div><h2>Add an interview experience</h2><p>Describe high-level process and preparation lessons. This is a contributor report—not a question bank—and it stays private until review approves it.</p></div><span><CheckCircle2 size={16} />Review required</span></div>
    <div className="experience-field-grid">
      <label className="form-group"><span>Company</span><input value={input.companyName} onChange={(event) => update("companyName", event.target.value)} maxLength={120} required /></label>
      <label className="form-group"><span>Role title</span><input value={input.roleTitle} onChange={(event) => update("roleTitle", event.target.value)} maxLength={160} required /></label>
      <label className="form-group"><span>Level</span><select value={input.roleLevel} onChange={(event) => update("roleLevel", event.target.value)}><option value="">Not provided</option>{["Entry", "Mid", "Senior", "Staff+", "Management", "Prefer not to say"].map((level) => <option key={level}>{level}</option>)}</select></label>
      <label className="form-group"><span>Country or general region</span><input value={input.region} onChange={(event) => update("region", event.target.value)} maxLength={120} placeholder="Optional; avoid precise locations" /></label>
      <label className="form-group"><span>Interview date</span><input type="month" value={input.interviewDate} onChange={(event) => update("interviewDate", event.target.value ? `${event.target.value}-01` : "")} /><small>Optional; month only helps readers judge freshness.</small></label>
      <label className="form-group"><span>One process stage</span><select value={input.roundType} onChange={(event) => update("roundType", event.target.value)}><option value="">Not provided</option>{experienceRoundTypes.map((round) => <option key={round.id} value={round.label}>{round.label}</option>)}</select></label>
      {input.roundType && <fieldset className="experience-topic-picker full"><legend>High-level topic families</legend><div>{experienceTopics.map((topic) => <label key={topic.id}><input type="checkbox" checked={input.topics.includes(topic.label)} onChange={() => update("topics", input.topics.includes(topic.label) ? input.topics.filter((item) => item !== topic.label) : [...input.topics, topic.label])} /><span>{topic.label}</span></label>)}</div></fieldset>}
      <label className="form-group full"><span>High-level process summary</span><textarea rows={6} value={input.summary} onChange={(event) => update("summary", event.target.value)} maxLength={4000} placeholder="Describe the process, timing, and topic families without exact prompts, identities, or confidential details." required /><small>{input.summary.length}/4000. At least 40 characters are required to submit.</small></label>
      <label className="form-group full"><span>Preparation lessons (optional)</span><textarea rows={4} value={input.preparationLessons} onChange={(event) => update("preparationLessons", event.target.value)} maxLength={3000} placeholder="What would you recommend preparing, at a high level?" /></label>
    </div>
    <fieldset className="experience-safety-checklist"><legend>Publication choices</legend><label><input type="radio" checked={input.publicIdentity === "anonymous"} onChange={() => update("publicIdentity", "anonymous")} /><span>Publish anonymously</span></label><label><input type="radio" checked={input.publicIdentity === "username"} onChange={() => update("publicIdentity", "username")} /><span>Show my Engineering Foundry username if approved</span></label><label><input type="checkbox" checked={input.publicationConsent} onChange={(event) => update("publicationConsent", event.target.checked)} /><span>I confirm this is my own account, I have removed exact proprietary questions and personal/confidential information, and I consent to review and publication if approved.</span></label></fieldset>
    <div className="experience-generate-row"><button className="button button-secondary" type="button" disabled={pending} onClick={() => save(false)}>Save private draft</button><button className="button" type="button" disabled={pending} onClick={() => save(true)}><Send size={15} />Submit for review</button><span role="status" aria-live="polite">{pending ? "Saving…" : message || "Submission is optional; nothing is public without approval."}</span></div>
    {owned.length > 0 && <section className="experience-owned" aria-labelledby="your-experiences"><h2 id="your-experiences">Your submissions</h2><ul>{owned.map((item) => <li key={item.id}><div><strong>{item.company_name} · {item.role_title}</strong><span>{item.status.replaceAll("_", " ")} · updated {new Date(item.updated_at).toLocaleDateString()}</span>{item.review_note && <p>{item.review_note}</p>}</div><div>{["draft", "submitted", "needs_changes"].includes(item.status) && <button className="button button-secondary" type="button" disabled={pending} onClick={() => manage(item.id, "withdraw")}><Undo2 size={14} />Withdraw</button>}{["draft", "withdrawn", "rejected"].includes(item.status) && <button className="button button-ghost" type="button" disabled={pending} onClick={() => manage(item.id, "delete")}><Trash2 size={14} />Delete</button>}</div></li>)}</ul></section>}
  </div>;
}
