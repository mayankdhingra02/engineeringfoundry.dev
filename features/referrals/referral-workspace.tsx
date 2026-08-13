"use client";

import { useEffect, useState } from "react";
import { HandHeart, Info, Send } from "lucide-react";
import { companies } from "@/data/fixtures/companies";
import { track } from "@/lib/analytics";
import { StatusPill } from "@/components/page-shell";

export function ReferralWorkspace() {
  const [tab, setTab] = useState<"request" | "referrer">("request");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => track("referral_page_viewed"), []);
  function submit(event: React.FormEvent) { event.preventDefault(); setSubmitted(true); track(tab === "request" ? "referral_requested" : "referrer_signup_started", { demo: true }); }
  return <>
    <div className="two-column-feature">
      <button className={`flow-card ${tab === "request" ? "selected" : ""}`} onClick={() => { setTab("request"); setSubmitted(false); }}><span className="icon-well"><Send size={20} /></span><h2>Request a Referral</h2><p>Share the role and enough context for a Referrer to independently consider your request.</p><span className="card-link">Open request form</span></button>
      <button className={`flow-card ${tab === "referrer" ? "selected" : ""}`} onClick={() => { setTab("referrer"); setSubmitted(false); }}><span className="icon-well"><HandHeart size={20} /></span><h2>Become a Referrer</h2><p>Volunteer to review relevant requests on your own terms and your own timeline.</p><span className="card-link">Create Referrer profile</span></button>
    </div>
    <div className="form-shell" style={{ marginTop: 18 }}>
      <div className="form-note"><Info size={15} style={{ display: "inline", marginRight: 8, verticalAlign: -3 }} /><strong>Important:</strong> Referrers independently decide whether to submit a referral. Engineering Foundry does not guarantee referrals, interviews, or employment outcomes. Users must comply with their employer&apos;s referral and conflict-of-interest policies.</div>
      {submitted ? <div className="empty-state" style={{ marginTop: 20 }}><StatusPill tone="success">Demo complete</StatusPill><strong>Flow validated locally</strong><p>No data was sent. Connect Supabase authentication and database tables to make this flow live.</p><button className="button button-secondary" onClick={() => setSubmitted(false)}>Back to form</button></div> :
      <form onSubmit={submit} className="form-grid" style={{ marginTop: 22 }}>
        {tab === "request" ? <>
          <div className="form-group"><label htmlFor="company">Company</label><select id="company" required defaultValue=""><option value="" disabled>Select a company</option>{companies.map((company) => <option key={company.slug}>{company.name}</option>)}</select></div>
          <div className="form-group"><label htmlFor="job-title">Job title</label><input id="job-title" required placeholder="Software Engineer" /></div>
          <div className="form-group"><label htmlFor="job-url">Job URL (optional)</label><input id="job-url" type="url" placeholder="https://…" /></div>
          <div className="form-group"><label htmlFor="job-id">Job ID (optional)</label><input id="job-id" placeholder="REQ-1234" /></div>
          <div className="form-group"><label htmlFor="location">Location</label><input id="location" placeholder="Chicago, IL or Remote" /></div>
          <div className="form-group"><label htmlFor="linkedin">LinkedIn URL</label><input id="linkedin" type="url" placeholder="https://linkedin.com/in/…" /></div>
          <div className="form-group full"><label htmlFor="intro">Short introduction</label><textarea id="intro" required placeholder="Briefly share your background and fit for this role." /></div>
          <div className="form-group full"><label htmlFor="message">Optional message to the Referrer</label><textarea id="message" placeholder="Add any useful context. Resume sharing will be added later." /></div>
        </> : <>
          <div className="form-group"><label htmlFor="ref-company">Company</label><select id="ref-company" required defaultValue=""><option value="" disabled>Select your company</option>{companies.map((company) => <option key={company.slug}>{company.name}</option>)}</select></div>
          <div className="form-group"><label htmlFor="role">Role / title</label><input id="role" required placeholder="Senior Software Engineer" /></div>
          <div className="form-group"><label htmlFor="families">Supported job families</label><input id="families" placeholder="Backend, Platform, Data" /></div>
          <div className="form-group"><label htmlFor="availability">Request availability</label><select id="availability"><option>Open</option><option>Limited</option><option>Unavailable</option></select></div>
          <div className="form-group full"><label htmlFor="bio">Optional profile bio</label><textarea id="bio" placeholder="Share what kinds of candidates and roles you can review." /></div>
        </>}
        <div className="form-group full"><button className="button" type="submit">{tab === "request" ? "Preview referral request" : "Preview Referrer profile"}</button></div>
      </form>}
    </div>
  </>;
}
