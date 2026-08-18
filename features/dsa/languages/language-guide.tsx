import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks, TriangleAlert } from "lucide-react";
import { DSAHeading, DSANote } from "@/components/dsa-learning";
import type { LanguageGuideData, LanguageGuideSection } from "./language-guide-types";
import { CodeExample } from "./code-example";
import { InterviewTemplate } from "./interview-template";

function ComplexityReference({ rows }: { rows: NonNullable<LanguageGuideSection["complexity"]> }) {
  return <div className="dsa-language-complexity"><table><thead><tr><th>Operation</th><th>Complexity</th><th>Interview note</th></tr></thead><tbody>{rows.map((row) => <tr key={row.operation}><td><code>{row.operation}</code></td><td>{row.complexity}</td><td>{row.note ?? "—"}</td></tr>)}</tbody></table></div>;
}

export function LanguageGuide({ guide }: { guide: LanguageGuideData }) {
  return <div className="dsa-language-guide">
    <nav className="dsa-language-actions" aria-label={`${guide.name} guide shortcuts`}><a href="#quick-reference"><BookOpen size={14} />Quick Reference</a><a href="#common-templates"><ListChecks size={14} />Common Templates</a></nav>
    <DSAHeading level={2} id="quick-reference">Quick Reference</DSAHeading>
    <p className="dsa-language-lead">The syntax candidates most often want immediately before a coding round.</p>
    <div className="dsa-language-quick-grid">{guide.quickReference.map((example) => <CodeExample key={example.title} language={guide.slug} {...example} />)}</div>

    {guide.sections.map((section) => <section className="dsa-language-section" key={section.id}>
      <DSAHeading level={2} id={section.id}>{section.title}</DSAHeading>
      <p>{section.introduction}</p>
      {section.examples?.map((example) => <CodeExample key={example.title} language={guide.slug} {...example} />)}
      {section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
      {section.warning && <DSANote tone="important" title="Interview pitfall"><p>{section.warning}</p></DSANote>}
      {section.complexity && <ComplexityReference rows={section.complexity} />}
    </section>)}

    <DSAHeading level={2} id="common-templates">Common Interview Templates</DSAHeading>
    <p>These are structural recall aids, not answers to proprietary problems. Open only the pattern you need.</p>
    <div className="dsa-language-templates">{guide.templates.map((template) => <InterviewTemplate language={guide.slug} template={template} key={template.id} />)}</div>

    <DSAHeading level={2} id="common-mistakes">Common Interview Mistakes</DSAHeading>
    <div className="dsa-language-mistakes">{guide.mistakes.map((mistake) => <article key={mistake.title}><TriangleAlert size={15} /><div><h3>{mistake.title}</h3><p>{mistake.explanation}</p></div></article>)}</div>
    <DSANote title="Practice the algorithm, not the syntax"><p>Use the <Link href="/dsa/roadmap">canonical roadmap</Link> to choose the next pattern and the <Link href="/dsa/questions">question browser</Link> for language-independent practice.</p></DSANote>
    <div className="dsa-language-next"><Link href="/dsa/roadmap">Open the DSA roadmap <ArrowRight size={13} /></Link><Link href="/dsa/questions">Practice questions <ArrowRight size={13} /></Link></div>
  </div>;
}
