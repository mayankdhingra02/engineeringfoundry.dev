import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks, X } from "lucide-react";
import { getRoadmapPracticeHref, type CoreRoadmapTopic, type CoreRoadmapTrack } from "@/data/dsa/core-roadmap";

export function RoadmapTopicPanel({ topic, track, questionCount, onSelect, onClose }: {
  topic: CoreRoadmapTopic;
  track: CoreRoadmapTrack;
  questionCount: number;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const byId = new Map(track.topics.map((item) => [item.id, item]));
  const practiceHref = questionCount > 0 ? getRoadmapPracticeHref(topic) : undefined;
  const nextTopics = track.topics.filter((item) => item.prerequisites.includes(topic.id));
  return <aside className="dsa-roadmap-topic-panel" aria-label={`${topic.title} roadmap details`}>
    <header><div><span>{topic.level === "foundations" ? "Foundation" : topic.level === "core" ? "Core interview pattern" : "Advanced topic"}</span><h2>{topic.title}</h2></div><button type="button" onClick={onClose} aria-label="Close topic details"><X size={15} /></button></header>
    <p>{topic.description}</p>
    <section><h3>Recommended prerequisites</h3>{topic.prerequisites.length ? <div className="dsa-roadmap-panel-links">{topic.prerequisites.map((id) => <button type="button" key={id} onClick={() => onSelect(id)}>{byId.get(id)?.title}<ArrowRight size={11} /></button>)}</div> : <span className="dsa-roadmap-start-label">Start here — no prerequisites</span>}</section>
    <section><h3>Key interview patterns</h3><ul>{topic.patterns.map((pattern) => <li key={pattern}>{pattern}</li>)}</ul></section>
    {nextTopics.length > 0 && <section><h3>What this unlocks</h3><div className="dsa-roadmap-panel-links">{nextTopics.map((item) => <button type="button" key={item.id} onClick={() => onSelect(item.id)}>{item.title}<ArrowRight size={11} /></button>)}</div></section>}
    <footer>{practiceHref && <Link className="button" href={practiceHref}><ListChecks size={14} />Practice {questionCount} question{questionCount === 1 ? "" : "s"}</Link>}{topic.guideSlug && <Link className="button button-secondary" href={`/dsa/${topic.guideSlug}`}><BookOpen size={14} />Topic guide</Link>}</footer>
  </aside>;
}
