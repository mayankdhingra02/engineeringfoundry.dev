import Link from "next/link";
import { ArrowRight, BookOpen, Bug, ExternalLink, ListChecks, MessageSquareText, TriangleAlert } from "lucide-react";
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
    <section className="dsa-language-provenance" aria-label={`${guide.name} guide provenance`}><div><span>Runtime boundary</span><strong>{guide.runtimeNote}</strong></div><div><span>Reviewed</span><strong>{guide.reviewedAt}</strong></div><details><summary>Source notes</summary><ul>{guide.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalLink size={12} aria-hidden="true" /></a><span>{source.supports}</span></li>)}</ul></details></section>
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
    <div className="dsa-language-operating-grid"><section aria-labelledby="debugging-checklist"><DSAHeading level={2} id="debugging-checklist"><Bug size={17} aria-hidden="true" />Debugging checklist</DSAHeading><ol>{guide.debuggingChecklist.map((item) => <li key={item}>{item}</li>)}</ol></section><section aria-labelledby="interviewer-topics"><DSAHeading level={2} id="interviewer-topics"><MessageSquareText size={17} aria-hidden="true" />Questions about the language</DSAHeading><p>These are reasonable discussion prompts, not claims about every interviewer or company.</p><ul>{guide.interviewerTopics.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
    <DSAHeading level={2} id="practice-exercises">Language transfer exercises</DSAHeading>
    <p>Use these to check runtime judgment before another algorithm repetition. Open the answer check only after committing to a result.</p>
    <ol className="dsa-language-exercises">{guide.exercises.map((exercise) => <li key={exercise.kind}><span>{exercise.kind}</span><h3>{exercise.title}</h3><p>{exercise.prompt}</p><details><summary>Answer check</summary><p>{exercise.answerCheck}</p></details></li>)}</ol>
    <DSANote title="Practice the algorithm, not the syntax"><p>Use the <Link href="/dsa/roadmap">canonical roadmap</Link> to choose the next pattern and the <Link href="/dsa/questions">question browser</Link> for language-independent practice.</p></DSANote>
    <div className="dsa-language-next"><Link href="/dsa/roadmap">Open the DSA roadmap <ArrowRight size={13} /></Link><Link href="/dsa/questions">Practice questions <ArrowRight size={13} /></Link><Link href="/interview-playbook">Return to Interview Playbook <ArrowRight size={13} /></Link></div>
  </div>;
}
