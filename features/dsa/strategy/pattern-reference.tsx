import { ArrowRight, Route } from "lucide-react";
import Link from "next/link";
import { getCoreRoadmapTopic, getRoadmapPracticeHref } from "@/data/dsa/core-roadmap";
import { patternCues } from "./strategy-content";

export function PatternReference() {
  return <div className="dsa-strategy-patterns">{patternCues.map((cue) => {
    const topic = getCoreRoadmapTopic(cue.roadmapTopicId);
    if (!topic) return null;
    const practiceHref = getRoadmapPracticeHref(topic);
    return <article key={cue.signal}><span>{cue.signal}</span><strong>{cue.pattern}</strong><nav aria-label={`${cue.pattern} resources`}><Link href={`/dsa/roadmap?topic=${topic.id}`}><Route size={12} />Roadmap<ArrowRight size={11} /></Link>{practiceHref && <Link href={practiceHref}>Practice<ArrowRight size={11} /></Link>}</nav></article>;
  })}</div>;
}

