"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Code2, FolderOpen, Gauge, Globe2, Network, Server, Target } from "lucide-react";
import type { CodingRoundFormat, CompanyGuideLevel, DesignTrack, GeographyContext, PracticalEngineeringGuide, ProjectDeepDiveGuide, QuestionStrategy, ReadinessScorecard } from "@/data/company-guides/types";
import { EvidenceBadge } from "./evidence-badge";

export function CodingRoundFormatCard({ format, company }: { format: CodingRoundFormat; company: string }) {
  return <div className="company-coding-format">
    <article className="company-coding-format-spotlight">
      <div><span>{format.label}</span><h3>{format.title}</h3><p>{format.description}</p></div>
      <div className="company-coding-format-stats"><strong>{format.durationLabel}</strong><ArrowRight size={18} aria-hidden="true" /><strong>{format.questionCountLabel}</strong></div>
      <EvidenceBadge kind={format.evidence.kind} confidence={format.evidence.confidence} company={company} />
      <small>{format.warning}</small>
    </article>
    <div className="company-coding-clock">
      <header><Clock3 size={18} /><div><h3>Example per-question coding clock</h3><p>{format.timingRecommendationLabel}</p></div></header>
      <ol>{format.timing.map((block) => <li key={block.range}><span>{block.range}</span><div><strong>{block.title}</strong><small>{block.detail}</small></div></li>)}</ol>
    </div>
    <div className="company-coding-format-details">
      <article><Code2 size={18} /><h3>Practice the environment</h3><ul>{format.environment.map((item) => <li key={item}>{item}</li>)}</ul><div className="company-inline-flow">{format.flow.map((item, index) => <span key={item}>{item}{index < format.flow.length - 1 && <ArrowRight size={11} />}</span>)}</div></article>
      <article><Gauge size={18} /><h3>Measure speed, not only correctness</h3><ul>{format.measurements.map((item) => <li key={item}>{item}</li>)}</ul></article>
    </div>
  </div>;
}

export function QuestionStrategyCard({ strategy }: { strategy: QuestionStrategy }) {
  return <div className="company-question-strategy">
    <div className="company-question-strategy-intro"><Target size={21} /><div><h3>{strategy.title}</h3><p>{strategy.description}</p><div className="company-mini-warning"><AlertTriangle size={15} /><span>{strategy.warning}</span></div></div></div>
    <ol>{strategy.steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}</ol>
    <div className="company-pattern-examples">{strategy.examples.map((example) => <span key={example}>{example}</span>)}</div>
  </div>;
}

export function DesignTrackSelector({ tracks }: { tracks: DesignTrack[] }) {
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]?.id);
  const track = tracks.find((item) => item.id === selectedTrack) ?? tracks[0];
  if (!track) return null;
  return <div className="company-design-tracks">
    <div className="company-design-track-tabs" role="group" aria-label="Choose design preparation track">{tracks.map((item) => <button type="button" aria-pressed={item.id === track.id} className={item.id === track.id ? "active" : ""} onClick={() => setSelectedTrack(item.id)} key={item.id}><Network size={15} />{item.title}</button>)}</div>
    <div className="company-design-track-panel"><div><span>Selected design lens</span><h3>{track.title}</h3><p>{track.description}</p></div><div><strong>Prioritize</strong><ul>{track.focus.map((item) => <li key={item}><CheckCircle2 size={13} />{item}</li>)}</ul></div><aside><strong>Practice examples</strong>{track.examples.map((item) => <span key={item}>{item}</span>)}</aside></div>
  </div>;
}

export function GeographySelector({ context, selected, onSelect }: { context: GeographyContext; selected: string; onSelect: (id: string) => void }) {
  const option = context.options.find((item) => item.id === selected) ?? context.options[0];
  return <div className="company-geography-context">
    <div className="company-geography-callout"><Globe2 size={21} /><div><h3>{context.title}</h3><p>{context.description}</p></div></div>
    <div className="company-geography-options" role="group" aria-label="Select geography context">{context.options.map((item) => <button type="button" className={item.id === option.id ? "active" : ""} aria-pressed={item.id === option.id} onClick={() => onSelect(item.id)} key={item.id}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
    <div className="company-geography-caveats"><span>Current context · {option.label}</span><ul>{option.processCaveats.map((item) => <li key={item}>{item}</li>)}</ul></div>
    <div className="company-mini-warning"><AlertTriangle size={15} /><span>{context.warning}</span></div>
  </div>;
}

export function PracticalEngineeringCard({ guide, company }: { guide: PracticalEngineeringGuide; company: string }) {
  return <div className="company-practical-engineering">
    <div className="company-practical-intro"><Server size={21} /><div><h3>{guide.title}</h3><p>{guide.description}</p><EvidenceBadge kind={guide.evidence.kind} confidence={guide.evidence.confidence} compact company={company} /></div></div>
    <div className="company-practical-categories">{guide.categories.map((category) => <article key={category.title}><h3>{category.title}</h3><ul>{category.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
    <div className="company-practical-exercises"><div><Code2 size={18} /><div><strong>Engineering Foundry practice exercises</strong><small>Practice recommendations—not company interview leaks.</small></div></div><ul>{guide.exercises.map((item) => <li key={item}><CheckCircle2 size={13} />{item}</li>)}</ul></div>
    <div className="company-mini-warning"><AlertTriangle size={15} /><span>{guide.warning}</span></div>
  </div>;
}

export function ProjectDeepDiveCard({ guide }: { guide: ProjectDeepDiveGuide }) {
  return <div className="company-project-deep-dive">
    <header><FolderOpen size={21} /><div><h3>{guide.title}</h3><p>{guide.description}</p></div></header>
    <div><article><strong>Prepare each project</strong><div>{guide.fields.map((field) => <span key={field}>{field}</span>)}</div></article><article><strong>Senior signals</strong><ul>{guide.seniorSignals.map((signal) => <li key={signal}><Target size={13} />{signal}</li>)}</ul></article></div>
  </div>;
}

export function ReadinessScorecardCard({ scorecard, level }: { scorecard: ReadinessScorecard; level: CompanyGuideLevel }) {
  return <div className="company-readiness-card">
    <header><Gauge size={21} /><div><h3>{scorecard.title}</h3><p>{scorecard.description}</p></div></header>
    <div className="company-readiness-spotlight"><span>Most important</span><strong>{scorecard.spotlight}</strong></div>
    {scorecard.groups && <div className="company-readiness-groups">{scorecard.groups.map((group) => <article key={group.title}><h4>{group.title}</h4>{group.metrics.map((metric) => <label key={metric}><input type="checkbox" />{metric}</label>)}</article>)}</div>}
    <div className="company-readiness-grid"><div><h4>Track consistently</h4>{scorecard.metrics.map((metric) => <label key={metric}><input type="checkbox" />{metric}</label>)}</div><div><h4>Current level target</h4>{(scorecard.targets[level] ?? []).map((target) => <p key={target}><Target size={13} />{target}</p>)}</div></div>
    <small>{scorecard.disclaimer}</small>
  </div>;
}
