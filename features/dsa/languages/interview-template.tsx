import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { getCoreRoadmapTopic, getCoreRoadmapTopicHref, getRoadmapPracticeHref } from "@/data/dsa/core-roadmap";
import type { LanguageGuideData, LanguageInterviewTemplate } from "./language-guide-types";
import { CodeExample } from "./code-example";

export function InterviewTemplate({ language, template }: { language: LanguageGuideData["slug"]; template: LanguageInterviewTemplate }) {
  const topic = getCoreRoadmapTopic(template.roadmapTopicId);
  const topicHref = topic ? getCoreRoadmapTopicHref(topic.id) : undefined;
  const practiceHref = topic ? getRoadmapPracticeHref(topic) : undefined;
  return <details className="dsa-language-template"><summary><span>{template.title}</span><small>{template.useWhen}</small></summary><div><p><strong>Use when:</strong> {template.useWhen}</p>{template.complexity && <p className="complexity"><strong>Typical complexity:</strong> {template.complexity}</p>}<CodeExample language={language} title={`${template.title} template`} code={template.code} /><nav aria-label={`${template.title} related resources`}>{topic && topicHref && <Link href={topicHref}><Route size={13} />Roadmap: {topic.title}<ArrowRight size={12} /></Link>}{practiceHref && <Link href={practiceHref}>Practice {template.title}<ArrowRight size={12} /></Link>}</nav></div></details>;
}
