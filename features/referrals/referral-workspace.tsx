"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  HandHeart,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { referralGuidance, referralTemplates } from "@/data/referrals";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { parseReferralMode, referralModeHref, type ReferralMode } from "@/lib/referrals/url-state";
import type { ReferrerAvailability } from "@/types";

type RequestDraft = {
  company: string;
  jobTitle: string;
  jobUrl: string;
  jobId: string;
  location: string;
  introduction: string;
  roleFit: string;
  experience: string;
  linkedinUrl: string;
  portfolioUrl: string;
  resumeUrl: string;
};
type ReferrerDraft = {
  company: string;
  role: string;
  jobFamilies: string;
  availability: ReferrerAvailability;
  preferences: string;
  bio: string;
};

const emptyRequest: RequestDraft = {
  company: "",
  jobTitle: "",
  jobUrl: "",
  jobId: "",
  location: "",
  introduction: "",
  roleFit: "",
  experience: "",
  linkedinUrl: "",
  portfolioUrl: "",
  resumeUrl: "",
};

const emptyReferrer: ReferrerDraft = {
  company: "",
  role: "",
  jobFamilies: "",
  availability: "Limited",
  preferences: "",
  bio: "",
};

function compact(values: Array<string | null>) {
  return values.filter((value): value is string => Boolean(value?.trim())).join("\n");
}

function buildShortPacket(draft: RequestDraft) {
  const role = `${draft.jobTitle.trim()} at ${draft.company.trim()}`;
  const details = [draft.location && `Location: ${draft.location.trim()}`, draft.jobId && `Job ID: ${draft.jobId.trim()}`].filter(Boolean).join(" · ");
  const links = [draft.jobUrl && `Role: ${draft.jobUrl.trim()}`, draft.linkedinUrl && `LinkedIn: ${draft.linkedinUrl.trim()}`, draft.portfolioUrl && `Portfolio: ${draft.portfolioUrl.trim()}`, draft.resumeUrl && `Resume: ${draft.resumeUrl.trim()}`].filter(Boolean).join("\n");
  return compact([
    `Hi—I'm reaching out about the ${role} role.`,
    draft.introduction.trim(),
    `Why I may be a fit: ${draft.roleFit.trim()}`,
    details || null,
    links || null,
    "If you are comfortable reviewing my background, I would appreciate your independent consideration. Please feel free to decline—there is no expectation.",
  ]);
}

function buildDetailedPacket(draft: RequestDraft) {
  const roleDetails = compact([
    `Company: ${draft.company.trim()}`,
    `Role: ${draft.jobTitle.trim()}`,
    draft.location && `Location: ${draft.location.trim()}`,
    draft.jobId && `Job ID: ${draft.jobId.trim()}`,
    draft.jobUrl && `Official job link: ${draft.jobUrl.trim()}`,
  ]);
  const links = compact([
    draft.linkedinUrl && `LinkedIn: ${draft.linkedinUrl.trim()}`,
    draft.portfolioUrl && `GitHub / portfolio: ${draft.portfolioUrl.trim()}`,
    draft.resumeUrl && `Resume: ${draft.resumeUrl.trim()}`,
  ]);
  return compact([
    "Hello,",
    draft.introduction.trim(),
    "ROLE DETAILS",
    roleDetails,
    "WHY THIS ROLE FITS",
    draft.roleFit.trim(),
    "RELEVANT SKILLS AND EXPERIENCE",
    draft.experience.trim(),
    links ? `PROFESSIONAL LINKS\n${links}` : null,
    "If you have the context and capacity to review this request, I would value your independent consideration. I understand you may decline, and that any referral would not guarantee an interview or hiring outcome. Thank you for your time.",
  ]);
}

function buildAvailabilityCard(draft: ReferrerDraft) {
  return compact([
    "REFERRER AVAILABILITY",
    `Company: ${draft.company.trim()}`,
    `Role / title: ${draft.role.trim()}`,
    `Job families: ${draft.jobFamilies.trim()}`,
    `Availability: ${draft.availability}`,
    `Review preferences: ${draft.preferences.trim() || "Exact job link or ID, concise relevant background, and accessible professional links."}`,
    draft.bio && `Context: ${draft.bio.trim()}`,
    "I review requests independently, may decline without explanation, and follow employer policies. Sharing this card does not promise a referral, interview, or hiring outcome.",
  ]);
}

function GuidanceList({ items }: { items: typeof referralGuidance.requestQualityChecklist }) {
  return <ul className="referral-guidance-list">{items.map((item) => <li key={item.id}><CheckCircle2 size={16} aria-hidden="true" /><span>{item.text}</span></li>)}</ul>;
}

function CopyButton({ text, label, onCopied }: { text: string; label: string; onCopied?: () => void }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      onCopied?.();
    } catch {
      setState("failed");
    }
  }
  return <div className="referral-copy-control">
    <button className="button button-secondary button-sm" type="button" onClick={copy}><Copy size={14} />{label}</button>
    <span role="status" aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Copy failed—select the text manually." : ""}</span>
  </div>;
}

export function ReferralWorkspace() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const mode = useMemo(() => parseReferralMode(queryString), [queryString]);
  const [requestDraft, setRequestDraft] = useState<RequestDraft>(emptyRequest);
  const [referrerDraft, setReferrerDraft] = useState<ReferrerDraft>(emptyReferrer);
  const [requestGenerated, setRequestGenerated] = useState(false);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [requestChecks, setRequestChecks] = useState<Record<string, boolean>>({});
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({});
  const requestModeButtonRef = useRef<HTMLButtonElement>(null);
  const referrerModeButtonRef = useRef<HTMLButtonElement>(null);
  const requestPanelRef = useRef<HTMLDivElement>(null);
  const referrerPanelRef = useRef<HTMLDivElement>(null);
  const renderedModeRef = useRef<ReferralMode>(mode);
  const renderedPathnameRef = useRef(pathname);
  const pendingHistoryFocusFrame = useRef<number | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (window.location.pathname !== pathname) return;
    const canonicalHref = referralModeHref(pathname, mode, window.location.hash);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (canonicalHref !== currentHref) {
      window.history.replaceState(null, "", canonicalHref);
    }
  }, [mode, pathname, queryString]);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    if (mode === "request") track("referral_builder_opened", { mode: "request" });
    else track("referrer_toolkit_opened", { mode: "referrer" });
  }, [mode]);

  useEffect(() => {
    renderedModeRef.current = mode;
    renderedPathnameRef.current = pathname;
  }, [mode, pathname]);

  useEffect(() => {
    function recoverModeFocusAfterHistory() {
      const previousMode = renderedModeRef.current;
      const previousPathname = renderedPathnameRef.current;
      const nextMode = parseReferralMode(window.location.search);

      if (window.location.pathname !== previousPathname || nextMode === previousMode) return;

      const previousPanel = previousMode === "request" ? requestPanelRef.current : referrerPanelRef.current;
      const previousFocus = document.activeElement;
      if (!(previousFocus instanceof HTMLElement) || !previousPanel?.contains(previousFocus)) return;

      if (pendingHistoryFocusFrame.current !== null) {
        window.cancelAnimationFrame(pendingHistoryFocusFrame.current);
      }

      pendingHistoryFocusFrame.current = window.requestAnimationFrame(() => {
        pendingHistoryFocusFrame.current = null;
        const settledMode = parseReferralMode(window.location.search);
        if (window.location.pathname !== previousPathname || settledMode === previousMode) return;

        const activeElement = document.activeElement;
        const focusIsUnclaimed = !(activeElement instanceof HTMLElement)
          || activeElement === document.body
          || activeElement === document.documentElement
          || !activeElement.isConnected
          || activeElement === previousFocus
          || previousPanel.contains(activeElement);
        if (!focusIsUnclaimed) return;

        const selectedModeButton = settledMode === "request" ? requestModeButtonRef.current : referrerModeButtonRef.current;
        if (!selectedModeButton?.isConnected) return;
        selectedModeButton.focus();
      });
    }

    window.addEventListener("popstate", recoverModeFocusAfterHistory);
    // Guarded focus recovery only runs for an actual same-route mode change.
    return () => {
      window.removeEventListener("popstate", recoverModeFocusAfterHistory);
      if (pendingHistoryFocusFrame.current !== null) {
        window.cancelAnimationFrame(pendingHistoryFocusFrame.current);
        pendingHistoryFocusFrame.current = null;
      }
    };
  }, []);

  function changeMode(nextMode: ReferralMode) {
    if (nextMode === mode) return;
    const nextHref = referralModeHref(window.location.pathname, nextMode, window.location.hash);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextHref === currentHref) return;
    window.history.pushState(null, "", nextHref);
    if (nextMode === "request") track("referral_builder_opened", { mode: "request" });
    else track("referrer_toolkit_opened", { mode: "referrer" });
  }

  function updateRequest<K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) {
    setRequestDraft((current) => ({ ...current, [key]: value }));
  }

  function updateReferrer<K extends keyof ReferrerDraft>(key: K, value: ReferrerDraft[K]) {
    setReferrerDraft((current) => ({ ...current, [key]: value }));
  }

  function clearDraft() {
    setRequestDraft(emptyRequest);
    setReferrerDraft(emptyReferrer);
    setRequestGenerated(false);
    setCardGenerated(false);
    setRequestChecks({});
    setReviewChecks({});
    track("referral_draft_cleared", { mode });
  }

  const shortPacket = buildShortPacket(requestDraft);
  const detailedPacket = buildDetailedPacket(requestDraft);
  const availabilityCard = buildAvailabilityCard(referrerDraft);

  return <div className="referral-workspace">
    <div className="referral-mode-picker" role="group" aria-label="Referral tool">
      <button ref={requestModeButtonRef} id="referral-mode-request" type="button" aria-controls="referral-request-panel" aria-pressed={mode === "request"} className={mode === "request" ? "selected" : ""} onClick={() => changeMode("request")}>
        <FileText size={20} aria-hidden="true" /><span><strong>Request builder</strong><small>Draft a request to share yourself</small></span>
      </button>
      <button ref={referrerModeButtonRef} id="referral-mode-referrer" type="button" aria-controls="referral-referrer-panel" aria-pressed={mode === "referrer"} className={mode === "referrer" ? "selected" : ""} onClick={() => changeMode("referrer")}>
        <HandHeart size={20} aria-hidden="true" /><span><strong>Referrer toolkit</strong><small>Set boundaries and review consistently</small></span>
      </button>
    </div>

    <div className="referral-privacy" role="note">
      <ShieldCheck size={20} aria-hidden="true" />
      <div><strong>Nothing you enter here is sent to Engineering Foundry or saved.</strong><p>Refreshing the page clears the draft. Leaving the page does too. Copy only what you choose to share.</p></div>
    </div>

    <div ref={requestPanelRef} id="referral-request-panel" className="referral-mode-panel" role="region" aria-labelledby="referral-mode-request" hidden={mode !== "request"}>
      <section className="referral-tool-shell" aria-labelledby="request-builder-title">
        <div className="referral-tool-header"><div><span className="section-kicker">Request builder</span><h2 id="request-builder-title">Build a clear, specific request.</h2><p>Use any company and the exact role details. The generated packets stay in this browser until you leave or refresh.</p></div><button className="button button-ghost button-sm" type="button" onClick={clearDraft}><RotateCcw size={14} />Clear draft</button></div>
        <form className="referral-form" onSubmit={(event) => { event.preventDefault(); setRequestGenerated(true); }}>
          <div className="form-group"><label htmlFor="request-company">Company</label><input id="request-company" required value={requestDraft.company} onChange={(event) => updateRequest("company", event.target.value)} placeholder="Any company" /></div>
          <div className="form-group"><label htmlFor="request-title">Job title</label><input id="request-title" required value={requestDraft.jobTitle} onChange={(event) => updateRequest("jobTitle", event.target.value)} placeholder="Software Engineer" /></div>
          <div className="form-group"><label htmlFor="request-url">Official job URL <span>(optional)</span></label><input id="request-url" type="url" value={requestDraft.jobUrl} onChange={(event) => updateRequest("jobUrl", event.target.value)} placeholder="https://…" /></div>
          <div className="form-group"><label htmlFor="request-id">Job ID <span>(optional)</span></label><input id="request-id" value={requestDraft.jobId} onChange={(event) => updateRequest("jobId", event.target.value)} placeholder="REQ-1234" /></div>
          <div className="form-group full"><label htmlFor="request-location">Location <span>(optional)</span></label><input id="request-location" value={requestDraft.location} onChange={(event) => updateRequest("location", event.target.value)} placeholder="Chicago, IL or Remote" /></div>
          <div className="form-group full"><label htmlFor="request-intro">Short introduction</label><textarea id="request-intro" required value={requestDraft.introduction} onChange={(event) => updateRequest("introduction", event.target.value)} placeholder="Who you are, your current focus, and why you are reaching out" /></div>
          <div className="form-group full"><label htmlFor="request-fit">Why this role fits</label><textarea id="request-fit" required value={requestDraft.roleFit} onChange={(event) => updateRequest("roleFit", event.target.value)} placeholder="Connect your background to specific requirements in the role" /></div>
          <div className="form-group full"><label htmlFor="request-experience">Relevant skills and experience</label><textarea id="request-experience" required value={requestDraft.experience} onChange={(event) => updateRequest("experience", event.target.value)} placeholder="Share two or three relevant skills, projects, or measurable outcomes" /></div>
          <div className="form-group"><label htmlFor="request-linkedin">LinkedIn URL <span>(optional)</span></label><input id="request-linkedin" type="url" value={requestDraft.linkedinUrl} onChange={(event) => updateRequest("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/…" /></div>
          <div className="form-group"><label htmlFor="request-portfolio">GitHub or portfolio URL <span>(optional)</span></label><input id="request-portfolio" type="url" value={requestDraft.portfolioUrl} onChange={(event) => updateRequest("portfolioUrl", event.target.value)} placeholder="https://github.com/…" /></div>
          <div className="form-group full"><label htmlFor="request-resume">Resume link <span>(optional)</span></label><input id="request-resume" type="url" value={requestDraft.resumeUrl} onChange={(event) => updateRequest("resumeUrl", event.target.value)} placeholder="A view-only link you control" /><small>Only share resume links with people you are comfortable giving access to. Confirm view-only permissions and remove sensitive details such as your home address.</small></div>
          <div className="form-group full referral-form-actions"><button className="button" type="submit"><ClipboardCheck size={16} />Generate local packets</button><span>Nothing is sent when you generate.</span></div>
        </form>
      </section>

      <section className="referral-checklist-section" aria-labelledby="request-checklist-title">
        <div><span className="section-kicker">Before you copy</span><h2 id="request-checklist-title">Request quality checklist</h2><p>These checks are for you alone and reset with the rest of the draft.</p></div>
        <div className="referral-checklist">{referralGuidance.requestQualityChecklist.map((item) => <label key={item.id}><input type="checkbox" checked={Boolean(requestChecks[item.id])} onChange={(event) => setRequestChecks((current) => ({ ...current, [item.id]: event.target.checked }))} /><span>{item.text}</span></label>)}</div>
      </section>

      {requestGenerated && <section className="referral-output" aria-labelledby="packet-output-title">
        <div className="referral-output-heading"><div><span className="section-kicker">Generated locally</span><h2 id="packet-output-title">Choose the packet that fits the conversation.</h2></div><p role="status">Review and personalize the text before sharing it.</p></div>
        <div className="referral-output-grid">
          <article className="referral-packet"><div><span>Short packet</span><h3>For a concise first message</h3></div><pre>{shortPacket}</pre><CopyButton text={shortPacket} label="Copy short packet" onCopied={() => track("referral_packet_copied", { mode: "request", packet_type: "short" })} /></article>
          <article className="referral-packet"><div><span>Detailed packet</span><h3>For a structured review</h3></div><pre>{detailedPacket}</pre><CopyButton text={detailedPacket} label="Copy detailed packet" onCopied={() => track("referral_packet_copied", { mode: "request", packet_type: "detailed" })} /></article>
        </div>
      </section>}

      <section className="referral-guidance-grid" aria-label="Referral request etiquette">
        <article><span className="guidance-icon good"><CheckCircle2 size={19} /></span><h2>Good request etiquette</h2><GuidanceList items={referralGuidance.goodRequestBehavior} /></article>
        <article><span className="guidance-icon caution"><AlertTriangle size={19} /></span><h2>Patterns to avoid</h2><GuidanceList items={referralGuidance.poorRequestBehavior} /></article>
      </section>
    </div>

    <div ref={referrerPanelRef} id="referral-referrer-panel" className="referral-mode-panel" role="region" aria-labelledby="referral-mode-referrer" hidden={mode !== "referrer"}>
      <section className="referral-tool-shell" aria-labelledby="referrer-toolkit-title">
        <div className="referral-tool-header"><div><span className="section-kicker">Referrer toolkit</span><h2 id="referrer-toolkit-title">Define your availability and boundaries.</h2><p>Create a card you can share where you choose. It is not a public profile and does not enroll you in a matching service.</p></div><button className="button button-ghost button-sm" type="button" onClick={clearDraft}><RotateCcw size={14} />Clear draft</button></div>
        <form className="referral-form" onSubmit={(event) => { event.preventDefault(); setCardGenerated(true); }}>
          <div className="form-group"><label htmlFor="referrer-company">Company</label><input id="referrer-company" required value={referrerDraft.company} onChange={(event) => updateReferrer("company", event.target.value)} placeholder="Your company" /></div>
          <div className="form-group"><label htmlFor="referrer-role">Role / title</label><input id="referrer-role" required value={referrerDraft.role} onChange={(event) => updateReferrer("role", event.target.value)} placeholder="Senior Software Engineer" /></div>
          <div className="form-group"><label htmlFor="referrer-families">Job families</label><input id="referrer-families" required value={referrerDraft.jobFamilies} onChange={(event) => updateReferrer("jobFamilies", event.target.value)} placeholder="Backend, Platform, Data" /></div>
          <div className="form-group"><label htmlFor="referrer-availability">Availability</label><select id="referrer-availability" value={referrerDraft.availability} onChange={(event) => updateReferrer("availability", event.target.value as ReferrerAvailability)}><option>Open</option><option>Limited</option><option>Not reviewing requests</option></select></div>
          <div className="form-group full"><label htmlFor="referrer-preferences">Review preferences <span>(optional)</span></label><textarea id="referrer-preferences" value={referrerDraft.preferences} onChange={(event) => updateReferrer("preferences", event.target.value)} placeholder="What context you need, which roles you can assess, and how people should approach you" /></div>
          <div className="form-group full"><label htmlFor="referrer-bio">Bio or useful context <span>(optional)</span></label><textarea id="referrer-bio" value={referrerDraft.bio} onChange={(event) => updateReferrer("bio", event.target.value)} placeholder="Brief professional context relevant to your review scope" /></div>
          <div className="form-group full referral-form-actions"><button className="button" type="submit"><ClipboardCheck size={16} />Generate local availability card</button><span>Nothing is published when you generate.</span></div>
        </form>
        <div className="referral-inline-help"><Info size={18} aria-hidden="true" /><GuidanceList items={referralGuidance.availabilityCardHelp} /></div>
      </section>

      {cardGenerated && <section className="referral-output" aria-labelledby="card-output-title">
        <div className="referral-output-heading"><div><span className="section-kicker">Generated locally</span><h2 id="card-output-title">Your availability card</h2></div><p role="status">Review it before sharing and update it when your capacity changes.</p></div>
        <article className="referral-packet referral-card-output"><pre>{availabilityCard}</pre><CopyButton text={availabilityCard} label="Copy availability card" onCopied={() => track("referrer_card_copied", { mode: "referrer", availability: referrerDraft.availability })} /></article>
      </section>}

      <section className="referral-checklist-section" aria-labelledby="review-checklist-title">
        <div><span className="section-kicker">Independent review</span><h2 id="review-checklist-title">Referrer review checklist</h2><p>This is a decision aid, not verification of the candidate or role.</p></div>
        <div className="referral-checklist">{referralGuidance.referrerReviewChecklist.map((item) => <label key={item.id}><input type="checkbox" checked={Boolean(reviewChecks[item.id])} onChange={(event) => setReviewChecks((current) => ({ ...current, [item.id]: event.target.checked }))} /><span>{item.text}</span></label>)}</div>
      </section>

      <section className="referral-decision-section" aria-labelledby="decision-title"><span className="section-kicker">Neutral workflow</span><h2 id="decision-title">A consistent way to decide</h2><p className="referral-section-note">Engineering Foundry provides this review aid but is not part of any final employer referral submission.</p><div className="referral-decision-flow">{referralGuidance.decisionSteps.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>

      <section className="referral-templates" aria-labelledby="templates-title"><span className="section-kicker">Response library</span><h2 id="templates-title">Decline or ask for specific context.</h2><p>These neutral templates protect the recipient&apos;s dignity and your boundaries. Personalize them before use.</p><div className="referral-template-grid">{referralTemplates.map((template) => <article key={template.id}><span>{template.kind === "decline" ? "Decline" : "More information"}</span><h3>{template.title}</h3><p>{template.body}</p><CopyButton text={template.body} label="Copy template" /></article>)}</div></section>
    </div>

    <section className="referral-community-safety" aria-labelledby="community-safety-title">
      <div><ShieldCheck size={24} aria-hidden="true" /><span className="section-kicker">Community safety</span><h2 id="community-safety-title">Keep every interaction voluntary and professional.</h2><GuidanceList items={referralGuidance.communitySafety} /><a className="button button-secondary" href={siteConfig.discordUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("referral_community_clicked", { placement: "referrals_page" })}>Discuss referral etiquette in the community <ExternalLink size={15} /></a></div>
      <aside><span className="section-kicker">Future account-based workflow</span><h3>Authenticated routing remains a later phase.</h3><p>This release does not create profiles, match people, route requests, verify employment, track decisions, or process payment.</p><ol>{referralGuidance.futureWorkflow.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.text}</span></li>)}</ol></aside>
    </section>
  </div>;
}
