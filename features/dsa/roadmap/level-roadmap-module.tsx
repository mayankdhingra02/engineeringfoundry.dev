import { ChevronDown, Circle, Clock3, ListChecks } from "lucide-react";
import type { ProblemClassification, RoadmapModule, RoadmapProblemAssignment, RoadmapTopic, TopicPriority } from "@/data/dsa/level-roadmaps";
import { getRoadmapTopicGuidance, type RoadmapProgressSnapshot } from "@/data/dsa/roadmap-planning";
import { resolveRoadmapProblems } from "@/data/dsa/roadmap-problem-registry";
import { track } from "@/lib/analytics";
import { RoadmapProblemRow } from "./roadmap-problem-row";

const priorityLabels: Record<TopicPriority, string> = {
  core: "Core",
  "high-value": "High Value",
  advanced: "Advanced",
};

const problemGroupLabels: Partial<Record<ProblemClassification, string>> = { core: "Core Problems", practice: "Practice Problems", stretch: "Stretch" };

function TopicCard({ topic, level, defaultOpen, visibleClassifications, visibleProblemIds, assignments, progress, signedIn, skipped, onToggleSkipped }: { topic: RoadmapTopic; level: "sde1" | "sde2" | "sde3plus"; defaultOpen: boolean; visibleClassifications: readonly ProblemClassification[]; visibleProblemIds?: ReadonlySet<string>; assignments?: readonly RoadmapProblemAssignment[]; progress?: RoadmapProgressSnapshot; signedIn?: boolean; skipped?: boolean; onToggleSkipped?: () => void }) {
  const allTopicProblems = topic.problemIds?.length ? resolveRoadmapProblems(topic.problemIds, assignments) : topic.problems ?? [];
  const topicProblems = visibleProblemIds ? allTopicProblems.filter((problem) => visibleProblemIds.has(problem.id)) : allTopicProblems;
  const guidance = getRoadmapTopicGuidance(level, topic);
  return <details className={`dsa-level-roadmap-topic${skipped ? " skipped" : ""}`} open={defaultOpen || undefined} onToggle={(event) => { if (event.currentTarget.open) track("roadmap_topic_opened", { level, topic_id: topic.id }); }}>
    <summary>
      <span><strong>{topic.title}</strong><small>{topic.description}</small></span>
      <span className="dsa-level-topic-labels"><span className={`dsa-level-priority ${topic.priority}`}><Circle size={8} fill="currentColor" aria-hidden="true" />{priorityLabels[topic.priority]}</span>{skipped && <span className="dsa-level-topic-skipped">Skipped for now</span>}</span>
      <ChevronDown className="dsa-level-topic-chevron" size={17} aria-hidden="true" />
    </summary>
    <h4 className="sr-only">{topic.title}</h4>
    <div className="dsa-level-roadmap-topic-details">
      <section className="dsa-roadmap-topic-why"><h5>Why am I learning this?</h5><p>{guidance.why}</p></section>
      <section className="dsa-roadmap-topic-prerequisites"><h5>Prerequisites</h5>{guidance.prerequisites.length ? <div>{guidance.prerequisites.map((id) => <span key={id}>{id.replace(/^sde\d-/, "").replaceAll("-", " ")}</span>)}</div> : <p>Start here — no required prerequisite.</p>}</section>
      <section><h5>Learn</h5><ul>{topic.concepts?.map((concept) => <li key={concept}>{concept}</li>)}</ul></section>
      <section><h5>Recognize It When…</h5><ul>{topic.recognitionSignals?.map((signal) => <li key={signal}>{signal}</li>)}</ul></section>
      {!!topic.comparisonExamples?.length && <div className="dsa-roadmap-complexity-guide">{topic.comparisonExamples.map((example) => <div key={example.label}><span>{example.label}</span><strong>{example.complexity}</strong></div>)}</div>}
      {!!topic.interviewNotes?.length && <div className="dsa-roadmap-interview-notes">{topic.interviewNotes.map((note) => <p key={note}>{note}</p>)}</div>}
      {!!topicProblems.length && <div className="dsa-roadmap-problem-groups">{(["core", "practice", "stretch"] as const).map((classification) => {
        const problems = topicProblems.filter((problem) => problem.classification === classification);
        if (!problems.length || !visibleClassifications.includes(classification)) return null;
        return <section key={classification}><div className="dsa-roadmap-problem-group-heading"><h5>{problemGroupLabels[classification]}</h5><span>{problems.length}</span></div><div>{problems.map((problem) => <RoadmapProblemRow key={problem.id} problem={problem} status={progress?.statusByProblemId[problem.id] ?? "not-started"} signedIn={signedIn} />)}</div></section>;
      })}</div>}
      {!topicProblems.length && <section><h5>Practice</h5><p>No problems in this topic match the active plan and filters. The full topic remains available when filters are reset.</p></section>}
      <section className="dsa-roadmap-mastery"><h5>Mastery Check</h5><ul>{topic.masteryCriteria?.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></section>
      {onToggleSkipped && topic.priority !== "core" && <button type="button" className="dsa-roadmap-skip-topic" aria-pressed={Boolean(skipped)} onClick={onToggleSkipped}>{skipped ? "Return to plan" : "Skip for now"}<small>Current view only · does not change completion</small></button>}
    </div>
  </details>;
}

export function LevelRoadmapModule({ module, level, index, expanded, onToggle, visibleClassifications, visibleProblemIds, assignments, progress, signedIn, skippedTopicIds, onToggleSkipped }: { module: RoadmapModule; level: "sde1" | "sde2" | "sde3plus"; index: number; expanded: boolean; onToggle: () => void; visibleClassifications: readonly ProblemClassification[]; visibleProblemIds?: ReadonlySet<string>; assignments?: readonly RoadmapProblemAssignment[]; progress?: RoadmapProgressSnapshot; signedIn?: boolean; skippedTopicIds?: ReadonlySet<string>; onToggleSkipped?: (topicId: string) => void }) {
  const priorityCounts = module.topics.reduce<Record<TopicPriority, number>>((counts, current) => {
    counts[current.priority] += 1;
    return counts;
  }, { core: 0, "high-value": 0, advanced: 0 });
  const uniqueProblemCount = new Set(module.topics.flatMap((topic) => topic.problemIds ?? topic.problems?.map((problem) => problem.id) ?? [])).size;

  return <article className={`dsa-level-roadmap-module${expanded ? " expanded" : ""}`}>
    <h3 className="sr-only">{module.title}</h3>
    <button type="button" className="dsa-level-roadmap-module-toggle" aria-expanded={expanded} aria-controls={`roadmap-module-${module.id}`} onClick={onToggle}>
      <span className="dsa-level-roadmap-stage-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="dsa-level-roadmap-module-copy"><strong>{module.title}</strong><small>{module.description}</small></span>
      <span className="dsa-level-roadmap-module-meta"><ListChecks size={15} aria-hidden="true" />{module.topics.length} topic{module.topics.length === 1 ? "" : "s"}{uniqueProblemCount > 0 && ` · ${uniqueProblemCount} problems`}</span>
      <ChevronDown className="dsa-level-module-chevron" size={19} aria-hidden="true" />
    </button>
    {expanded && <div id={`roadmap-module-${module.id}`} className="dsa-level-roadmap-module-body">
      <div className="dsa-level-roadmap-priority-summary" aria-label="Module priority summary">
        {Object.entries(priorityCounts).filter(([, count]) => count > 0).map(([priority, count]) => <span key={priority} className={`dsa-level-priority ${priority}`}><Circle size={8} fill="currentColor" aria-hidden="true" />{count} {priorityLabels[priority as TopicPriority]}</span>)}
      </div>
      <div className="dsa-level-roadmap-topic-list">{module.topics.map((roadmapTopic, topicIndex) => <TopicCard key={roadmapTopic.id} topic={roadmapTopic} level={level} defaultOpen={index === 0 && topicIndex === 0} visibleClassifications={visibleClassifications} visibleProblemIds={visibleProblemIds} assignments={assignments} progress={progress} signedIn={signedIn} skipped={skippedTopicIds?.has(roadmapTopic.id)} onToggleSkipped={onToggleSkipped ? () => onToggleSkipped(roadmapTopic.id) : undefined} />)}</div>
      <p className="dsa-level-roadmap-progress-note"><Clock3 size={15} aria-hidden="true" />{signedIn ? "Problem state is shared with My Practice. Session-only skips never change completion." : "Sign in to persist problem state across this roadmap and the question library."}</p>
    </div>}
  </article>;
}
