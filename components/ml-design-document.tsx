import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, ExternalLink } from "lucide-react";
import type { MlDesignConcept, MlDesignProblem } from "@/types";
import { activeMlDesignProblems, mlDesignConcepts } from "@/data/ml-design";
import { mlDesignFramework, mlGlossary, mlRoleProfiles, mlRubric, mlRubricBands } from "@/data/ml-design/reference";
import { getMlDesignSources } from "@/data/ml-design/sources";
import {
  ML_DESIGN_CONCEPTS_ROOT,
  ML_DESIGN_GLOSSARY,
  ML_DESIGN_PRACTICE_ROOT,
  ML_DESIGN_PROBLEMS_ROOT,
  ML_DESIGN_ROOT,
  ML_DESIGN_RUBRIC,
  mlDesignConceptHref,
  mlDesignProblemHref,
} from "@/lib/ml-design-routes";

const navigation = [
  ["Concepts", ML_DESIGN_CONCEPTS_ROOT],
  ["Problems", ML_DESIGN_PROBLEMS_ROOT],
  ["Practice", ML_DESIGN_PRACTICE_ROOT],
  ["Rubric", ML_DESIGN_RUBRIC],
  ["Glossary", ML_DESIGN_GLOSSARY],
] as const;

export function MlDesignDocument({
  title,
  description,
  context,
  reviewed,
  children,
}: {
  title: string;
  description: string;
  context: string;
  reviewed?: string;
  children: React.ReactNode;
}) {
  return <div className="ml-doc">
    <MlDesignDirectionContract />
    <nav className="ml-doc-nav" aria-label="ML System Design">
      <Link className="ml-doc-home" href={ML_DESIGN_ROOT}>ML System Design</Link>
      <div>{navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>
    </nav>
    <div className="ml-doc-width">
      <header className="ml-doc-header">
        <Link className="ml-doc-back" href={ML_DESIGN_ROOT}><ArrowLeft size={15} aria-hidden="true" />ML System Design</Link>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="ml-doc-meta"><span>{context}</span>{reviewed ? <span><CalendarDays size={15} aria-hidden="true" />Content reviewed {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${reviewed}T00:00:00`))}</span> : null}</div>
      </header>
      {children}
    </div>
  </div>;
}

const directionContract = "THESIS: ML System Design is a decision-led learning workspace, not a generic roadmap or card directory. OWN-WORLD: warm paper, flat ruled surfaces, rust actions, green only for verified or completed state, direct sans type, and engineered 8–12px corners. STORY: see DECIDE, choose a default or task-specific path, then practice with bounded guidance and descriptive review. FIRST VIEWPORT: title, direct actions, honest recent state, and the complete DECIDE sequence. FORM: code-led extension of the established workspace; precise specification made a concept roll unnecessary; seed ml-decide-register-v1. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.";

export function MlDesignDirectionContract() {
  return <span hidden aria-hidden="true" data-ml-design-direction="ml-decide-register-v1" dangerouslySetInnerHTML={{ __html: `<!-- ${directionContract} -->` }} />;
}

export function MlDesignFlow({ visual }: { visual: { title: string; steps: string[]; note?: string } }) {
  return <figure className="ml-flow">
    <figcaption><strong>{visual.title}</strong>{visual.note ? <span>{visual.note}</span> : null}</figcaption>
    <ol aria-label={visual.title}>{visual.steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><strong>{step}</strong></li>)}</ol>
  </figure>;
}

function BulletSection({ title, items }: { title: string; items: readonly string[] }) {
  return <section className="ml-copy-section"><h2>{title}</h2><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

export function MlSourceList({ sourceIds }: { sourceIds: readonly string[] }) {
  const sources = getMlDesignSources(sourceIds);
  return <section className="ml-sources" aria-labelledby="ml-sources-title">
    <h2 id="ml-sources-title">Sources and review notes</h2>
    <p>These sources support the technical claims on this page. Product-specific examples remain Engineering Foundry teaching scenarios.</p>
    <ul>{sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={13} aria-hidden="true" /></a><span>{source.publisher} · {source.sourceClass} · reviewed {source.reviewedAt}</span><p>{source.use}</p></li>)}</ul>
  </section>;
}

export function MlConceptDirectory() {
  return <MlDesignDocument title="Core concepts" description="Twenty interview-ready lessons connect ML judgment to the production system around it." context="Concept directory">
    <div className="ml-directory-intro"><p>Start in order if ML system design is new. If you already build ML systems, use the decision trigger to find the lesson that matches the part of your design you cannot yet defend.</p><Link className="button" href={mlDesignConceptHref(mlDesignConcepts[0].slug)}>Start with problem formulation<ArrowRight size={15} /></Link></div>
    <ol className="ml-index-list">{mlDesignConcepts.map((concept, index) => <li key={concept.id}><Link href={mlDesignConceptHref(concept.slug)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{concept.title}</strong><p>{concept.learningObjective}</p><small>{concept.level} · {concept.decisionTrigger}</small></div><ArrowRight size={16} aria-hidden="true" /></Link></li>)}</ol>
  </MlDesignDocument>;
}

export function MlConceptPage({ concept }: { concept: MlDesignConcept }) {
  const relatedProblems = concept.relatedProblemSlugs.map((slug) => activeMlDesignProblems.find((problem) => problem.slug === slug)).filter((problem): problem is MlDesignProblem => Boolean(problem));
  return <MlDesignDocument title={concept.title} description={concept.learningObjective} context={`Core concept · ${concept.level}`} reviewed={concept.lastReviewed}>
    <div className="ml-lesson-lead"><div><h2>Decision trigger</h2><p>{concept.decisionTrigger}</p></div><div><h2>Interview impact</h2><p>{concept.interviewImpact}</p></div></div>
    <MlDesignFlow visual={concept.visual} />
    <section className="ml-copy-section"><h2>Mental model</h2><p>{concept.mentalModel}</p><p>{concept.scenario}</p></section>
    <BulletSection title="How it works" items={concept.mechanism} />
    <div className="ml-two-column"><BulletSection title="Product consequences" items={concept.productConsequences} /><BulletSection title="Operational consequences" items={concept.operationalConsequences} /></div>
    <div className="ml-two-column"><BulletSection title="Alternatives" items={concept.alternatives} /><BulletSection title="Failure modes" items={concept.failureModes} /></div>
    <section className="ml-copy-section"><h2>Worked example</h2><ol>{concept.workedExample.map((item) => <li key={item}>{item}</li>)}</ol></section>
    <aside className="ml-exercise"><h2>Try it before moving on</h2><p>{concept.exercise.prompt}</p><details><summary>Check what a complete answer should cover</summary><p>{concept.exercise.expected}</p></details></aside>
    <section className="ml-copy-section"><h2>Interviewer probes</h2><ul>{concept.interviewerProbes.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section className="ml-level-overlays"><h2>Expected depth by level</h2><dl><div><dt>Entry</dt><dd>{concept.levelOverlays.entry}</dd></div><div><dt>Mid-level</dt><dd>{concept.levelOverlays.mid}</dd></div><div><dt>Senior+</dt><dd>{concept.levelOverlays.senior}</dd></div><div><dt>Role emphasis</dt><dd>{concept.levelOverlays.role}</dd></div></dl></section>
    <aside className="ml-risk"><strong>Risk to name explicitly</strong><p>{concept.riskCallout}</p></aside>
    {concept.systemDesignPrerequisites.length ? <section className="ml-prerequisite-links"><h2>System Design prerequisites</h2><div>{concept.systemDesignPrerequisites.map((item) => <Link href={item.href} key={item.href}>{item.title}<ArrowRight size={14} /></Link>)}</div></section> : null}
    <section className="ml-related"><h2>Practice this concept</h2>{relatedProblems.length ? <ul>{relatedProblems.map((problem) => <li key={problem.id}><Link href={mlDesignProblemHref(problem.slug)}>{problem.title}<ArrowRight size={14} /></Link></li>)}</ul> : <p>The concept is cross-cutting; choose any dossier and name where it changes the design.</p>}</section>
    <MlSourceList sourceIds={concept.sourceIds} />
  </MlDesignDocument>;
}

export function MlProblemDirectory({ practice = false }: { practice?: boolean }) {
  return <MlDesignDocument title={practice ? "Practice modes" : "Design problems"} description={practice ? "Choose a dossier, then work in guided, untimed, or timed mode without turning self-review into a score." : "Thirteen canonical dossiers span ranking, risk, forecasting, serving, platforms, and RAG."} context={practice ? "Practice workspace" : "Canonical dossier library"}>
    {practice ? <div className="ml-practice-modes"><section><h2>Guided</h2><p>Reveal DECIDE stages as you work. Useful for learning; not strong readiness evidence.</p></section><section><h2>Untimed</h2><p>Keep the full prompt visible, capture assumptions, and review every rubric dimension.</p></section><section><h2>Timed</h2><p>Choose 30, 45, or 60 minutes. Guidance stays hidden until requested or time expires.</p></section></div> : null}
    <div className="ml-problem-table"><div className="ml-problem-table-head"><span>Problem</span><span>Dominant challenge</span><span>Level</span></div>{activeMlDesignProblems.map((problem) => <Link href={mlDesignProblemHref(problem.slug)} key={problem.id}><div><strong>{problem.title}</strong><small>{problem.family} · {problem.domains.join(" · ")}</small></div><p>{problem.summary}</p><span>{problem.difficulty}<ArrowRight size={14} /></span></Link>)}</div>
  </MlDesignDocument>;
}

export function MlRubricPage() {
  return <MlDesignDocument title="Descriptive interview rubric" description="Use evidence in each dimension to decide what to improve next. The rubric does not calculate a readiness score." context="Self-review">
    <div className="ml-rubric-note"><p>Read each row independently. A design can be strong in data and weak in rollout; averaging those signals would hide the next useful action.</p></div>
    <div className="ml-rubric-table" role="region" aria-label="ML System Design rubric"><table><thead><tr><th>Dimension</th>{mlRubricBands.map((band) => <th key={band}>{band}</th>)}</tr></thead><tbody>{mlRubric.map(([dimension, ...bands]) => <tr key={dimension}><th>{dimension}</th>{bands.map((copy, index) => <td key={`${dimension}-${index}`}>{copy}</td>)}</tr>)}</tbody></table></div>
    <section className="ml-role-profiles"><h2>Role overlays</h2><div>{mlRoleProfiles.map((profile) => <article key={profile.title}><h3>{profile.title}</h3><p>{profile.description}</p></article>)}</div></section>
  </MlDesignDocument>;
}

export function MlGlossaryPage() {
  return <MlDesignDocument title="ML System Design glossary" description="Precise definitions for terms that often become hand-waving in interviews." context="Reference">
    <dl className="ml-glossary">{mlGlossary.map(([term, definition]) => <div id={term.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")} key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
    <div className="ml-glossary-close"><BookOpen size={18} /><p>Definitions are scoped to system-design reasoning. A source lesson or dossier may narrow the term further for a specific task.</p></div>
  </MlDesignDocument>;
}

export function MlDecideReference() {
  return <section className="ml-decide-reference"><h2>DECIDE stays consistent, not rigid</h2><ol>{mlDesignFramework.map((stage) => <li key={`${stage.letter}-${stage.title}`}><span>{stage.letter}</span><div><strong>{stage.title}</strong><p>{stage.summary}</p></div></li>)}</ol></section>;
}
