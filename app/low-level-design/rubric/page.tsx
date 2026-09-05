import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheckBig } from "lucide-react";
import { lowLevelDesignRubric } from "@/data/low-level-design";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Low-Level Design Self-Review Rubric",
  description: "Review Low-Level Design interview reasoning across 12 qualitative dimensions without an opaque score or a single correct diagram.",
  path: "/low-level-design/rubric",
});

export default function LowLevelDesignRubricPage() {
  return <main className="lld-rubric-page page-width">
    <nav className="lld-breadcrumbs" aria-label="Breadcrumb"><Link href="/low-level-design"><ArrowLeft size={14} />Low-Level Design</Link><span>/ Self-review rubric</span></nav>
    <header><p className="lld-eyebrow">12 qualitative dimensions</p><h1>Review the reasoning, not the drawing.</h1><p>Use this rubric after a first attempt. It helps you name what to revisit and what is already evident; it does not produce a score, readiness claim, employer prediction, or correct-UML verdict.</p><nav aria-label="Rubric actions"><Link className="button" href="/low-level-design/practice">Choose a practice design <ArrowRight size={15} /></Link><Link className="button button-secondary" href="/interview-tips/rounds/low-level-design">Review round execution</Link></nav></header>
    <aside className="lld-rubric-method"><CircleCheckBig aria-hidden="true" /><div><h2>How to use it</h2><ol><li>Finish one bounded design and walk a representative flow.</li><li>Select Revisit, Developing, or Evident for every dimension on the practice page.</li><li>Choose one dimension to improve on the next attempt; do not total the labels into a score.</li></ol></div></aside>
    <section className="lld-rubric-list" aria-labelledby="rubric-dimensions-title"><h2 id="rubric-dimensions-title">The dimensions</h2>{lowLevelDesignRubric.map((dimension, index) => <article key={dimension.id} id={dimension.id}><div><span>{String(index + 1).padStart(2, "0")}</span><h3>{dimension.title}</h3><p>{dimension.prompt}</p></div><dl><div><dt>Revisit</dt><dd>{dimension.revisit}</dd></div><div><dt>Developing</dt><dd>{dimension.developing}</dd></div><div><dt>Evident</dt><dd>{dimension.evident}</dd></div></dl></article>)}</section>
    <footer className="lld-rubric-footer"><p><strong>Keep the claim narrow.</strong> This is a structured self-review of one practice attempt. The interview invitation, interviewer, and active role remain authoritative.</p><Link href="/low-level-design/practice">Apply it to a practice design <ArrowRight size={15} /></Link></footer>
  </main>;
}
