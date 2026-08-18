import Link from "next/link";
import { SectionHeading, StatusPill } from "@/components/page-shell";
import { roundExecutionRelatedLinkLabel } from "@/lib/interview-playbook/round-execution-presentation";
import type { RoundExecutionGuideSummary } from "@/lib/interview-playbook/round-execution";
import type {
  RoundExecutionContentClassification,
  RoundExecutionDossier,
} from "@/lib/interview-playbook/round-execution-dossiers";

const TOC_ITEMS: readonly { id: string; label: string }[] = [
  { id: "evaluate", label: "Evaluate" },
  { id: "before", label: "Before the round" },
  { id: "flow", label: "Execution flow" },
  { id: "time-control", label: "Time control" },
  { id: "communication-recovery", label: "Communication and recovery" },
  { id: "validate-close", label: "Validate and close" },
  { id: "signals", label: "Signals" },
  { id: "seniority", label: "Seniority" },
  { id: "environment", label: "Environment" },
  { id: "interactions", label: "Interactions" },
  { id: "boundaries", label: "Boundaries" },
];

const CLASSIFICATION_LABELS: Readonly<Record<RoundExecutionContentClassification, string>> = {
  "widely-applicable": "Widely applicable",
  "context-dependent": "Context dependent",
  illustrative: "Illustrative example",
};

function List({ items }: { items: readonly string[] }) {
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

/**
 * Reusable renderer for a canonical round-execution dossier — the deeper
 * reference behind a v1 guide's compact quick reference. Presentation only:
 * every value comes from the supplied `dossier`, nothing is fetched, scored,
 * or persisted here.
 */
export function RoundExecutionDossierView({ guide, dossier }: { guide: RoundExecutionGuideSummary; dossier: RoundExecutionDossier }) {
  // A dossier authored for a different slug must never render under this guide.
  if (guide.slug !== dossier.slug) return null;

  return <>
    <section className="section"><div className="page-width">
      <SectionHeading eyebrow="Canonical execution dossier" title={dossier.title} description={dossier.purpose} />
      <div className="feature-card-top"><StatusPill tone="success">Published</StatusPill><span className="demo-label">Last reviewed: {dossier.lastReviewed}</span></div>
      <nav aria-label="Dossier sections">{TOC_ITEMS.map((item) => <Link className="text-link" href={`#${item.id}`} key={item.id}>{item.label}</Link>)}</nav>
    </div></section>

    <section className="section section-alt" id="evaluate"><div className="page-width">
      <h2>What the round is evaluating</h2>
      <div className="feature-grid">
        <article className="feature-card"><h3>Usually observable</h3><List items={dossier.intendedEvaluation} /></article>
        <article className="feature-card"><h3>What may vary</h3><List items={dossier.companyVariation} /></article>
      </div>
      <p className="prep-privacy">Variation does not make candidate reports official policy. Recruiter-provided and official instructions remain authoritative.</p>
    </div></section>

    <section className="section" id="before"><div className="page-width">
      <h2>Before the round</h2>
      <List items={dossier.beforeRound} />
      <nav aria-label="Related preparation">{guide.relatedHrefs.map((href) => <Link className="text-link" href={href} key={href}>{roundExecutionRelatedLinkLabel(href)}</Link>)}</nav>
    </div></section>

    <section className="section section-alt" id="flow"><div className="page-width">
      <h2>Execution flow</h2>
      <div className="feature-grid">
        {dossier.flow.map((step, index) => <article className="feature-card" key={step.id}>
          <div className="feature-card-top"><span className="demo-label">Step {index + 1}</span><StatusPill tone={step.classification === "widely-applicable" ? "accent" : "neutral"}>{CLASSIFICATION_LABELS[step.classification]}</StatusPill></div>
          <h3>{step.title}</h3>
          <p>{step.objective}</p>
          <List items={step.actions} />
        </article>)}
      </div>
    </div></section>

    <section className="section" id="time-control"><div className="page-width">
      <h2>Flexible time control</h2>
      {dossier.timeFrameworks.map((framework) => <div key={framework.label}>
        <h3>{framework.label}</h3>
        <p>{framework.assumption}</p>
        <div className="feature-grid">
          {framework.phases.map((phase) => <article className="feature-card" key={phase.label}>
            <div className="feature-card-top"><span className="demo-label">{phase.range}</span></div>
            <h3>{phase.label}</h3>
            <p>{phase.objective}</p>
            <p><small>{phase.adjustment}</small></p>
          </article>)}
        </div>
      </div>)}
      <p className="prep-privacy">These ranges are context-dependent planning aids, not universal interview rules or pass/fail timing thresholds.</p>
    </div></section>

    <section className="section section-alt" id="communication-recovery"><div className="page-width">
      <h2>Communication and recovery</h2>
      <h3>Communication patterns</h3>
      <div className="feature-grid">
        {dossier.communication.map((pattern) => <article className="feature-card" key={pattern.title}>
          <h3>{pattern.title}</h3>
          <p><strong>Productive</strong> {pattern.productive}</p>
          <p><strong>Avoid</strong> {pattern.avoid}</p>
        </article>)}
      </div>
      <h3>Recovery scenarios</h3>
      <div className="feature-grid">
        {dossier.recovery.map((scenario) => <article className="feature-card" key={scenario.situation}>
          <p><strong>Situation</strong> {scenario.situation}</p>
          <p><strong>Response</strong> {scenario.response}</p>
          <p><strong>Avoid</strong> {scenario.avoid}</p>
        </article>)}
      </div>
    </div></section>

    <section className="section" id="validate-close"><div className="page-width">
      <h2>Validate and close</h2>
      <div className="feature-grid">
        <article className="feature-card"><h3>Validate the result</h3><List items={dossier.validation} /></article>
        <article className="feature-card"><h3>Close the round</h3><List items={dossier.closing} /></article>
        <article className="feature-card"><h3>Questions when invited</h3><List items={dossier.questionsToAsk} /></article>
      </div>
    </div></section>

    <section className="section section-alt" id="signals"><div className="page-width">
      <h2>Strong and concern signals</h2>
      <div className="feature-grid">
        <article className="feature-card"><h3>Strong observable signals</h3><List items={dossier.signals.strong} /></article>
        <article className="feature-card"><h3>Concern signals</h3><List items={dossier.signals.concern} /></article>
      </div>
      <p className="prep-privacy">These are behavior descriptions, not a scoring rubric, hiring decision, or probability of passing.</p>
    </div></section>

    <section className="section"><div className="page-width">
      <h2>Common failure modes</h2>
      <div className="feature-grid">
        {dossier.failureModes.map((mode) => <article className="feature-card" key={mode.failure}>
          <h3>{mode.failure}</h3>
          <p>{mode.correction}</p>
        </article>)}
      </div>
    </div></section>

    <section className="section section-alt" id="seniority"><div className="page-width">
      <h2>Seniority calibration</h2>
      <div className="feature-grid">
        {dossier.seniority.map((entry) => <article className="feature-card" key={entry.level}>
          <div className="feature-card-top"><span className="demo-label">{entry.level}</span></div>
          <p>{entry.emphasis}</p>
          <h3>Strong signals</h3>
          <List items={entry.strongSignals} />
          <h3>Avoid</h3>
          <List items={entry.avoid} />
        </article>)}
      </div>
      <p className="prep-privacy">Seniority changes the evidence emphasized; it does not remove the requirement to complete the round’s core task and validate the result.</p>
    </div></section>

    <section className="section" id="environment"><div className="page-width">
      <h2>Environment and accessibility</h2>
      <div className="feature-grid">
        <article className="feature-card"><h3>Remote</h3><List items={dossier.environment.remote} /></article>
        <article className="feature-card"><h3>Onsite</h3><List items={dossier.environment.onsite} /></article>
        <article className="feature-card"><h3>Accessibility</h3><List items={dossier.environment.accessibility} /></article>
      </div>
      <p className="prep-privacy">Formal accommodation requests should be directed to the recruiter or the company’s designated accommodations contact.</p>
    </div></section>

    <section className="section section-alt" id="interactions"><div className="page-width">
      <h2>Annotated interactions</h2>
      <div className="feature-grid">
        {dossier.interactions.map((example) => <article className="feature-card" key={example.id}>
          <div className="feature-card-top"><StatusPill tone="neutral">Illustrative example</StatusPill></div>
          <h3>{example.title}</h3>
          <p>{example.scenario}</p>
          <p><strong>Less useful</strong> {example.weak}</p>
          <p><strong>Stronger</strong> {example.strong}</p>
          <p><small>{example.annotation}</small></p>
        </article>)}
      </div>
    </div></section>

    <section className="section" id="boundaries"><div className="page-width">
      <h2>Company and integrity boundaries</h2>
      <div className="feature-grid">
        <article className="feature-card"><h3>Company modifiers</h3><List items={dossier.companyModifierRules} /></article>
        <article className="feature-card"><h3>Integrity</h3><List items={dossier.integrity} /></article>
      </div>
      <nav aria-label="Continue preparing"><Link className="text-link" href="/companies">Company interview guides</Link><Link className="text-link" href="/interview-tips/rounds">All round guides</Link><Link className="text-link" href="/interview-tips">Interview Execution Guide</Link></nav>
    </div></section>
  </>;
}
