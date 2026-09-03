import { ArrowRight, CornerDownRight } from "lucide-react";
import Link from "next/link";
import { DSAHeading } from "@/components/dsa-learning";
import { getCoreRoadmapTopic, getCoreRoadmapTopicHref } from "@/data/dsa/core-roadmap";
import { StrategyCallout } from "./strategy-callout";
import { stuckPrompts } from "./strategy-content";

const recoverySteps = ["Restate what you know", "Work through a tiny example", "Describe the simplest correct approach", "Identify repeated or expensive work", "Ask what information would make the next step easier", "Consider the matching data structure or pattern", "Incorporate the interviewer’s hint"];
const recoveryTopics = ["arrays-hashing", "two-pointers", "sliding-window", "graphs", "one-d-dp"].map((id) => getCoreRoadmapTopic(id)).filter(Boolean);

export function StuckRecovery() {
  return <section className="dsa-stuck-recovery">
    <DSAHeading level={2} id="stuck">If you&apos;re stuck</DSAHeading>
    <p>Use a recovery ladder instead of waiting for inspiration or abandoning the solution.</p>
    <ol className="dsa-recovery-ladder">{recoverySteps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p>{index < recoverySteps.length - 1 && <CornerDownRight size={14} aria-hidden="true" />}</li>)}</ol>
    <details><summary>Questions that can unlock the next step</summary><div><ul>{stuckPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul><nav className="dsa-strategy-inline-links" aria-label="Related recovery roadmap topics">{recoveryTopics.map((topic) => { if (!topic) return null; const topicHref = getCoreRoadmapTopicHref(topic.id); return topicHref ? <Link href={topicHref} key={topic.id}>{topic.title}<ArrowRight size={12} /></Link> : null; })}</nav></div></details>
    <StrategyCallout title="Ask for help with context"><p>“I have the O(n²) approach, and the remaining bottleneck is the repeated inner search. I&apos;m considering sorting or storing prior values; preserving the original indices makes the hash-map direction more promising.”</p></StrategyCallout>
    <DSAHeading level={3} id="hints" includeInToc>Use hints as new information</DSAHeading>
    <p>Acknowledge the hint, explain how it changes your reasoning, and update the approach. Do not ignore it or pretend you had already reached the same conclusion.</p>
    <StrategyCallout title="Incorporating a hint"><p>“Right—processing in sorted order lets me move the boundaries based on whether the sum is too small or too large. That removes the repeated search.”</p></StrategyCallout>
    <DSAHeading level={3} id="wrong-approach">When the approach is wrong</DSAHeading>
    <p>Name the flaw, state why a local patch is insufficient, and present the revised approach. A visible correction is stronger than defending a broken invariant.</p>
  </section>;
}
