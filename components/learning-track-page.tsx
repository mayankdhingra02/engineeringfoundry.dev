import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Layers3, Wrench } from "lucide-react";
import { EmptyState, FeatureCard, PageHero, SectionHeading, StatusPill } from "./page-shell";

export interface TrackConfig {
  eyebrow: string;
  title: string;
  description: string;
  roadmap: Array<{ title: string; description: string }>;
  categories: string[];
  practiceTitle: string;
  resources: string[];
}

export function LearningTrackPage({ config }: { config: TrackConfig }) {
  return <>
    <PageHero eyebrow={config.eyebrow} title={config.title} description={config.description}><a className="button" href="#roadmap">View roadmap <ArrowRight size={16} /></a><Link className="button button-secondary" href="/resources">Browse resources</Link></PageHero>
    <section className="section" id="roadmap"><div className="page-width"><div className="content-grid">
      <aside className="sidebar-card"><h3>On this page</h3><a href="#roadmap">Roadmap</a><a href="#fundamentals">Fundamentals</a><a href="#practice">Practice</a><a href="#resources">Resources</a></aside>
      <div><SectionHeading eyebrow="Structured path" title="From foundations to interview practice." description="A staged roadmap shell ready for lessons, checkpoints, and saved progress." />
        <div className="roadmap-list">{config.roadmap.map((step, index) => <div className="roadmap-row" key={step.title}><span className="roadmap-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p></div><StatusPill tone={index === 0 ? "accent" : "neutral"}>{index === 0 ? "Start here" : "Planned"}</StatusPill></div>)}</div>
      </div>
    </div></div></section>
    <section className="section section-alt" id="fundamentals"><div className="page-width"><SectionHeading eyebrow="Concept map" title="Core areas to cover." description="Short structural cards now; focused guides and progress checkpoints in the next content phase." /><div className="feature-grid">{config.categories.map((category, index) => <FeatureCard icon={[Layers3, Compass, Wrench, BookOpen][index % 4]} title={category} description={`A focused ${category.toLowerCase()} module with concepts, examples, and practice prompts.`} label="Placeholder" key={category} />)}</div></div></section>
    <section className="section" id="practice"><div className="page-width"><SectionHeading eyebrow="Practice" title={config.practiceTitle} description="The practice engine will support saved progress, difficulty, feedback, and review state." /><EmptyState title="Practice workspace coming next" description="The information architecture is ready. Real prompts, answer review, and progress persistence are intentionally deferred." /></div></section>
    <section className="section section-alt" id="resources"><div className="page-width"><SectionHeading eyebrow="Recommended resources" title="Keep learning materials close to the roadmap." /><div className="mini-grid">{config.resources.map((resource, index) => <div className="mini-card" key={resource}><small>Demo resource {String(index + 1).padStart(2, "0")}</small><h3>{resource}</h3><p>Placeholder description. Resource curation and attribution will be completed in the content phase.</p></div>)}</div></div></section>
  </>;
}
