"use client";

import { Copy } from "lucide-react";
import { useRef, useState } from "react";
import type { NegotiationScript } from "@/data/salary-negotiation";

function EditableScript({ script }: { script: NegotiationScript }) {
  const [draft, setDraft] = useState(script.template);
  const [status, setStatus] = useState<"idle" | "copied" | "unavailable">("idle");
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(draft);
      setStatus("copied");
    } catch {
      setStatus("unavailable");
      requestAnimationFrame(() => {
        draftRef.current?.focus();
        draftRef.current?.select();
      });
    }
    window.setTimeout(() => setStatus("idle"), 2600);
  };

  return <article>
    <h3>{script.title}</h3>
    <p><strong>Use when:</strong> {script.situation}</p>
    <label className="salary-script-editor">
      <span>Edit this draft to match only what is true</span>
      <textarea ref={draftRef} value={draft} onChange={(event) => setDraft(event.target.value)} rows={5} />
    </label>
    <footer>
      <button type="button" className="button button-secondary button-sm" onClick={copy} disabled={!draft.trim()}><Copy size={14} aria-hidden="true" />Copy edited draft</button>
      <span role="status" aria-live="polite">{status === "copied" ? "Edited draft copied to your clipboard." : status === "unavailable" ? "Copy was unavailable. The edited draft is selected; copy it manually." : ""}</span>
    </footer>
  </article>;
}

export function EditableNegotiationScripts({ scripts }: { scripts: readonly NegotiationScript[] }) {
  return <section className="salary-scripts" aria-labelledby="editable-script-heading">
    <header><Copy size={18} aria-hidden="true" /><div><h2 id="editable-script-heading">Editable examples</h2><p>Adapt these to your true situation. Edits stay in this page&apos;s memory and are never sent or saved. Copying uses only your device clipboard.</p></div></header>
    {scripts.map((script) => <EditableScript key={script.title} script={script} />)}
  </section>;
}
