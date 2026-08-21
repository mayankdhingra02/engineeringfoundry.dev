"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback/model";
import { submitFeedbackAction } from "./actions";
import { initialFeedbackActionState } from "./state";

export function FeedbackForm() {
  const [state, action, pending] = useActionState(submitFeedbackAction, initialFeedbackActionState);
  const [message, setMessage] = useState("");
  // The feedback route itself is the current page in the normal no-JS and JS
  // flows. The server collapses any manipulated value before it reaches storage.
  const pageContext = "/feedback";

  if (state.status === "success") {
    return <section className="feedback-receipt" aria-labelledby="feedback-receipt-title" role="status">
      <h2 id="feedback-receipt-title">Your feedback is in the queue.</h2>
      <p>{state.message}</p>
      <dl><div><dt>Reference</dt><dd>{state.referenceId}</dd></div><div><dt>What happens next</dt><dd>Only authorized operators can read it. We do not publish feedback or add you to marketing.</dd></div></dl>
    </section>;
  }

  return <form action={action} className="feedback-form form-shell" aria-describedby="feedback-privacy-note">
    <input type="hidden" name="page_context" value={pageContext} />
    <div className="form-group">
      <label htmlFor="feedback-category">What is this about? <span>Required</span></label>
      <select id="feedback-category" name="category" defaultValue="" required aria-invalid={Boolean(state.fieldErrors?.category)} aria-describedby={state.fieldErrors?.category ? "feedback-category-error" : undefined}>
        <option value="" disabled>Choose a category</option>
        {FEEDBACK_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
      </select>
      {state.fieldErrors?.category && <p id="feedback-category-error" className="form-error">{state.fieldErrors.category}</p>}
    </div>
    <div className="form-group">
      <label htmlFor="feedback-message">What happened, or what would help? <span>Required</span></label>
      <textarea id="feedback-message" name="message" required maxLength={5000} rows={9} value={message} onChange={(event) => setMessage(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.message)} aria-describedby="feedback-message-help feedback-message-error" placeholder="Please include enough detail for us to understand the issue. Do not include passwords, access tokens, private interview material, or other sensitive information." />
      <div className="feedback-message-meta"><small id="feedback-message-help">Up to 5,000 characters. Feedback is private operational data.</small><span aria-live="polite">{message.length.toLocaleString()} / 5,000</span></div>
      {state.fieldErrors?.message && <p id="feedback-message-error" className="form-error">{state.fieldErrors.message}</p>}
    </div>
    <fieldset className="feedback-contact-fieldset">
      <legend>Optional follow-up</legend>
      <p>Leave an email only if you want an authorized operator to contact you about this report. It is not used for marketing.</p>
      <div className="form-group"><label htmlFor="feedback-contact-email">Email address <span>Optional</span></label><input id="feedback-contact-email" name="contact_email" type="email" maxLength={254} autoComplete="email" aria-invalid={Boolean(state.fieldErrors?.contact_email)} aria-describedby={state.fieldErrors?.contact_email ? "feedback-contact-error" : undefined} /></div>
      {state.fieldErrors?.contact_email && <p id="feedback-contact-error" className="form-error">{state.fieldErrors.contact_email}</p>}
      <label className="feedback-consent"><input type="checkbox" name="contact_consent" /><span>I consent to Engineering Foundry using this email only to follow up on this feedback.</span></label>
      {state.fieldErrors?.contact_consent && <p className="form-error">{state.fieldErrors.contact_consent}</p>}
    </fieldset>
    <p id="feedback-privacy-note" className="form-note">Current context is stored only as the sanitized route <code>{pageContext}</code>; query strings, fragments, and private resource IDs are removed.</p>
    {state.status === "error" && <p className="form-error" role="alert">{state.message}</p>}
    <button className="button" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Sending…</> : <>Send feedback <Send size={16} /></>}</button>
  </form>;
}
