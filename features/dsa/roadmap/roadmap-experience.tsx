"use client";

import Link from "next/link";
import { ArrowRight, List, Map, Route } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { coreInterviewRoadmap, getCoreRoadmapTopic } from "@/data/dsa/core-roadmap";
import { RoadmapCanvas } from "./roadmap-canvas";
import { createRoadmapLayout } from "./roadmap-layout";
import { RoadmapTopicPanel } from "./roadmap-topic-panel";

export function RoadmapExperience({ questionCounts }: { questionCounts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<"map" | "list">("map");
  const requestedTopic = searchParams.get("topic") ?? "";
  const selectedTopic = getCoreRoadmapTopic(requestedTopic);
  const orderedTopics = useMemo(() => [...createRoadmapLayout(coreInterviewRoadmap).nodes].sort((a, b) => a.topic.layout.row - b.topic.layout.row || a.topic.layout.lane - b.topic.layout.lane), []);

  function selectTopic(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("topic", id);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function closeTopic() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("topic");
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return <section className="dsa-roadmap-experience" aria-labelledby="core-roadmap-title">
    <div className="dsa-roadmap-start"><div><Route size={15} /><span><strong>New to interview preparation?</strong> Start with Arrays &amp; Hashing.</span></div><button type="button" onClick={() => selectTopic("arrays-hashing")}>Start here <ArrowRight size={13} /></button></div>
    <div className="dsa-roadmap-toolbar"><div><span>Recommended sequence</span><h2 id="core-roadmap-title">{coreInterviewRoadmap.title}</h2><small>{coreInterviewRoadmap.topics.length} topics · dependencies flow downward</small></div><div className="dsa-roadmap-toolbar-actions"><div className="dsa-roadmap-view-toggle" aria-label="Roadmap view"><button type="button" className={view === "map" ? "active" : undefined} aria-pressed={view === "map"} onClick={() => setView("map")}><Map size={13} />Map</button><button type="button" className={view === "list" ? "active" : undefined} aria-pressed={view === "list"} onClick={() => setView("list")}><List size={13} />List</button></div><Link href="/dsa/study-plans">Study plans <ArrowRight size={13} /></Link></div></div>
    <div className="dsa-roadmap-legend" aria-label="Roadmap level legend"><span className="foundations"><i />Foundation</span><span className="core"><i />Core patterns</span><span className="advanced"><i />Advanced</span><small>Drag to pan · scroll or use controls to zoom</small></div>
    <div className={`dsa-roadmap-workspace${selectedTopic ? " has-panel" : ""}`}>
      {view === "map" ? <RoadmapCanvas track={coreInterviewRoadmap} questionCounts={questionCounts} selectedId={selectedTopic?.id} onSelect={selectTopic} /> : <ol className="dsa-roadmap-list">{orderedTopics.map(({ topic }) => <li key={topic.id} className={topic.level}><span>{String(topic.layout.row + 1).padStart(2, "0")}</span><button type="button" aria-pressed={selectedTopic?.id === topic.id} onClick={() => selectTopic(topic.id)}><strong>{topic.title}</strong><small>{topic.prerequisites.length ? `After ${topic.prerequisites.map((id) => getCoreRoadmapTopic(id)?.title).join(" + ")}` : "Start here"}{questionCounts[topic.id] ? ` · ${questionCounts[topic.id]} questions` : ""}</small></button></li>)}</ol>}
      {selectedTopic && <RoadmapTopicPanel topic={selectedTopic} track={coreInterviewRoadmap} questionCount={questionCounts[selectedTopic.id] ?? 0} onSelect={selectTopic} onClose={closeTopic} />}
    </div>
  </section>;
}
