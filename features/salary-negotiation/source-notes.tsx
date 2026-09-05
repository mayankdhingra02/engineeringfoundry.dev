import { ExternalLink } from "lucide-react";
import type { SalaryNegotiationSource } from "@/data/salary-negotiation";

export function SalaryNegotiationSourceNotes({ sources, compact = false }: { sources: readonly SalaryNegotiationSource[]; compact?: boolean }) {
  if (sources.length === 0) return null;
  return <section className={`salary-sources${compact ? " compact" : ""}`} aria-labelledby={compact ? "module-source-heading" : "salary-source-heading"}>
    <header>
      <div>
        <h2 id={compact ? "module-source-heading" : "salary-source-heading"}>Sources, jurisdiction, and freshness</h2>
        <p>These first-party sources support only the bounded statements shown. Re-check volatile rules and your actual documents before acting.</p>
      </div>
      <span>Reviewed 2026-09-05</span>
    </header>
    <div>
      {sources.map((source) => <article key={source.id}>
        <div className="salary-source-meta"><span>{source.jurisdiction}</span><span>{source.volatility}</span></div>
        <h3>{source.title}</h3>
        <p>{source.claim}</p>
        <p className="salary-source-limit"><strong>Boundary:</strong> {source.limits}</p>
        <dl><div><dt>Verified</dt><dd>{source.verifiedAt}</dd></div><div><dt>Review by</dt><dd>{source.reviewBy}</dd></div></dl>
        <a href={source.url} target="_blank" rel="noopener noreferrer">Open {source.publisher} source <ExternalLink size={14} aria-hidden="true" /></a>
      </article>)}
    </div>
  </section>;
}
