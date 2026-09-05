"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateOfferComparison, type OfferComparisonInput } from "@/data/salary-negotiation";
import { track } from "@/lib/analytics";

type DraftOffer = OfferComparisonInput & { id: string; role: string; location: string; benefitsNotes: string; startDate: string; deadline: string; scopeNotes: string };
const MAX_OFFERS = 4;
const emptyOffer = (index: number): DraftOffer => ({ id: `offer-${index}`, label: `Offer ${index}`, role: "", location: "", baseSalary: null, targetBonus: null, targetBonusGuaranteed: false, signOn: null, equityGrantValue: null, vestingYears: null, otherGuaranteedCompensation: null, benefitsNotes: "", startDate: "", deadline: "", scopeNotes: "" });
const asNumber = (value: string) => value.trim() === "" ? null : Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function OfferComparisonWorksheet() {
  const [offers, setOffers] = useState<DraftOffer[]>(() => [emptyOffer(1), emptyOffer(2)]);
  const [builder, setBuilder] = useState({ enthusiasm: "", request: "", rationale: "", flexibility: "", closing: "" });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");
  const messageOutputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { track("offer_comparison_opened", { surface: "salary-negotiation" }); }, []);
  const update = (id: string, key: keyof DraftOffer, value: string | boolean) => setOffers((current) => current.map((offer) => offer.id === id ? { ...offer, [key]: typeof value === "string" && ["baseSalary", "targetBonus", "signOn", "equityGrantValue", "vestingYears", "otherGuaranteedCompensation"].includes(key) ? asNumber(value) : value } : offer));
  const message = [builder.enthusiasm, builder.rationale, builder.request, builder.flexibility, builder.closing].map((part) => part.trim()).filter(Boolean).join(" ");
  const summaries = useMemo(() => offers.map((offer) => ({ offer, summary: calculateOfferComparison(offer) })), [offers]);
  const copyMessage = async () => {
    if (!message) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(message);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("unavailable");
      requestAnimationFrame(() => {
        messageOutputRef.current?.focus();
        messageOutputRef.current?.select();
      });
    }
    window.setTimeout(() => setCopyStatus("idle"), 2600);
  };

  return <section className="salary-worksheet" id="compare-offers" aria-labelledby="offer-comparison-heading">
    <header><div><h2 id="offer-comparison-heading">Private offer comparison</h2><p>Your inputs stay only in this page&apos;s in-memory state. Engineering Foundry does not transmit or store them; refreshing or closing the page clears them. If analytics is enabled and available, opening this page sends one fixed, value-free event that never includes anything you enter.</p></div><button className="button button-secondary button-sm" type="button" onClick={() => setOffers((current) => current.length < MAX_OFFERS ? [...current, emptyOffer(current.length + 1)] : current)} disabled={offers.length >= MAX_OFFERS}><Plus size={15} />Add offer</button></header>
    <p className="salary-worksheet-rule"><strong>Transparent math:</strong> first-year guaranteed cash = base + sign-on + other guaranteed compensation + bonus only when you mark it guaranteed. Target bonus and equity remain separate.</p>
    <div className="salary-offer-grid">
      {summaries.map(({ offer, summary }, index) => <article key={offer.id}>
        <div className="salary-offer-heading"><label><span>Offer label</span><input value={offer.label} onChange={(event) => update(offer.id, "label", event.target.value)} placeholder={`Offer ${index + 1}`} /></label>{offers.length > 2 && <button type="button" className="icon-button" onClick={() => setOffers((current) => current.filter((item) => item.id !== offer.id))} aria-label={`Remove ${offer.label || `offer ${index + 1}`} `}><Trash2 size={15} /></button>}</div>
        <div className="salary-offer-fields">
          <label><span>Role</span><input value={offer.role} onChange={(event) => update(offer.id, "role", event.target.value)} /></label><label><span>Location</span><input value={offer.location} onChange={(event) => update(offer.id, "location", event.target.value)} placeholder="Remote, city, or region" /></label>
          <MoneyField label="Base salary" value={offer.baseSalary} onChange={(value) => update(offer.id, "baseSalary", value)} /><MoneyField label="Target bonus" value={offer.targetBonus} onChange={(value) => update(offer.id, "targetBonus", value)} />
          <label className="salary-checkbox"><input type="checkbox" checked={offer.targetBonusGuaranteed} onChange={(event) => update(offer.id, "targetBonusGuaranteed", event.target.checked)} /> <span>Bonus is explicitly guaranteed</span></label>
          <MoneyField label="Sign-on" value={offer.signOn} onChange={(value) => update(offer.id, "signOn", value)} /><MoneyField label="Equity grant value you entered" value={offer.equityGrantValue} onChange={(value) => update(offer.id, "equityGrantValue", value)} />
          <label><span>Vesting years</span><input inputMode="decimal" type="number" min="0" value={offer.vestingYears ?? ""} onChange={(event) => update(offer.id, "vestingYears", event.target.value)} /></label><MoneyField label="Other guaranteed compensation" value={offer.otherGuaranteedCompensation} onChange={(value) => update(offer.id, "otherGuaranteedCompensation", value)} />
          <label><span>Start date</span><input type="date" value={offer.startDate} onChange={(event) => update(offer.id, "startDate", event.target.value)} /></label><label><span>Offer deadline</span><input type="date" value={offer.deadline} onChange={(event) => update(offer.id, "deadline", event.target.value)} /></label>
          <label className="salary-field-wide"><span>Benefits, role scope, team, growth, or location notes</span><textarea value={`${offer.benefitsNotes}${offer.scopeNotes ? `${offer.benefitsNotes ? "\n" : ""}${offer.scopeNotes}` : ""}`} onChange={(event) => update(offer.id, "benefitsNotes", event.target.value)} placeholder="Keep subjective factors separate from the compensation math." rows={3} /></label>
        </div>
        <dl className="salary-offer-math"><div><dt>First-year guaranteed cash</dt><dd>{money(summary.firstYearGuaranteedCash)}</dd></div><div><dt>Target bonus (not guaranteed unless marked)</dt><dd>{money(summary.targetBonus)}</dd></div><div><dt>Annualized equity</dt><dd>{summary.annualizedEquity === null ? "Add grant + vesting years" : money(summary.annualizedEquity)}</dd></div></dl>
        <p className="salary-offer-warning">Annualized equity is only your entered grant value ÷ vesting years. It is not a realized value, market prediction, tax estimate, or recommendation.</p>
      </article>)}
    </div>
    <section className="salary-message-builder" aria-labelledby="message-builder-heading"><header><div><h3 id="message-builder-heading">Review-and-copy message builder</h3><p>Private draft only. Copy writes the assembled message to your clipboard; it does not send email or contact a recruiter.</p></div></header><div className="salary-builder-fields"><label><span>Enthusiasm</span><textarea value={builder.enthusiasm} onChange={(event) => setBuilder({ ...builder, enthusiasm: event.target.value })} placeholder="I’m excited about the role and team." rows={2} /></label><label><span>Rationale</span><textarea value={builder.rationale} onChange={(event) => setBuilder({ ...builder, rationale: event.target.value })} placeholder="The main gap for me is…" rows={2} /></label><label><span>Specific request</span><textarea value={builder.request} onChange={(event) => setBuilder({ ...builder, request: event.target.value })} placeholder="Could we revisit…" rows={2} /></label><label><span>Flexibility</span><textarea value={builder.flexibility} onChange={(event) => setBuilder({ ...builder, flexibility: event.target.value })} placeholder="If that is constrained, I’m open to…" rows={2} /></label><label className="salary-field-wide"><span>Closing</span><textarea value={builder.closing} onChange={(event) => setBuilder({ ...builder, closing: event.target.value })} placeholder="I appreciate your consideration." rows={2} /></label></div><div className="salary-message-output"><label><span>Assembled private draft</span><textarea ref={messageOutputRef} readOnly value={message || "Your private draft will appear here as you add the parts you want to say."} rows={4} /></label><button type="button" className="button button-secondary button-sm" disabled={!message} onClick={copyMessage}><Copy size={14} />{copyStatus === "copied" ? "Copied" : "Copy draft"}</button><span role="status" aria-live="polite">{copyStatus === "copied" ? "Draft copied to your clipboard." : copyStatus === "unavailable" ? "Copy was unavailable. The draft is selected; copy it manually." : ""}</span></div></section>
  </section>;
}

function MoneyField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: string) => void }) {
  return <label><span>{label}</span><input inputMode="decimal" type="number" min="0" value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder="0" /></label>;
}
