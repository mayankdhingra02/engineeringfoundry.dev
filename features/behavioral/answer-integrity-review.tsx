"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FACT_INTEGRITY_PROMPTS, reviewAnswerFacts, type AnswerFactDraft, type FactSourceStory } from "@/lib/behavioral/fact-integrity";

export function AnswerIntegrityReview({ story, draft }: { story?: FactSourceStory; draft: AnswerFactDraft }) {
  const findings = useMemo(() => reviewAnswerFacts(story, draft), [story, draft]);
  return <aside className="behavioral-integrity-review" aria-labelledby="fact-review-heading">
    <div>
      <h2 id="fact-review-heading">Keep the facts anchored</h2>
      <p>{story ? <>This variant frames <strong>{story.title}</strong>. It does not replace the source story.</> : "Choose a story first. A question-specific answer is framing, not a separate source of facts."}</p>
      {story && <Link href={`/behavioral/stories/${story.id}/edit`}>Edit source story</Link>}
    </div>
    {findings.length ? <ul className="behavioral-integrity-findings" role="status">{findings.map((finding) => <li key={finding.message}>{finding.message}</li>)}</ul> : <p className="behavioral-integrity-clear">No unmatched numeric claims detected. This is an internal consistency check, not proof of factual truth.</p>}
    <details><summary>Self-review prompts</summary><ul>{FACT_INTEGRITY_PROMPTS.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul></details>
  </aside>;
}
