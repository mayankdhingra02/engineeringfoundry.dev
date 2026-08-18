import { DSAHeading } from "@/components/dsa-learning";
import { StrategyCallout } from "./strategy-callout";
import { timingStages } from "./strategy-content";

export function TimingGuide() {
  return <section>
    <DSAHeading level={2} id="timing">A flexible 45-minute pace</DSAHeading>
    <StrategyCallout title="Example pacing, not a rule" tone="rule"><p>Interview length, problem shape, company, and interviewer all vary. Use this only to notice when one stage is consuming the whole round.</p></StrategyCallout>
    <ol className="dsa-strategy-timing">{timingStages.map((stage) => <li key={stage.range}><time>{stage.range}</time><div><strong>{stage.label}</strong><p>{stage.note}</p></div></li>)}</ol>
    <DSAHeading level={3} id="time-warning">When time is running out</DSAHeading>
    <ol><li>State the remaining logic clearly.</li><li>Finish the core algorithm before polishing.</li><li>Avoid unnecessary refactors.</li><li>Explain known edge cases if you cannot implement them in time.</li></ol>
  </section>;
}

