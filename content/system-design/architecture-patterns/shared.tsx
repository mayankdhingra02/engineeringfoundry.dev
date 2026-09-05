import { MermaidDiagram } from "@/components/mermaid-diagram";
import { FailureDeepDive, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { architecturePatternSources, architecturePatternSourcesReviewedAt } from "./sources";

export interface ArchitecturePatternLessonSpec {
  id: string;
  decision: string;
  mechanism: readonly string[];
  diagram?: { chart: string; title: string; description: string };
  interactive?: React.ReactNode;
  example: { title: string; body: string; consequence: string };
  tradeoffs: readonly { option: string; chooseWhen: string; cost: string }[];
  failure: { failure: string; impact: string; detection: string; mitigation: string; tradeoff: string };
  exercise: readonly string[];
  probes: readonly string[];
  practice: readonly string[];
  remember: string;
  note?: string;
}

export function ArchitecturePatternLesson({ spec }: { spec: ArchitecturePatternLessonSpec }) {
  return <>
    <LessonHeading level={2} id="decision">Start with the decision</LessonHeading><p>{spec.decision}</p>
    {spec.note && <LessonCallout variant="important"><p>{spec.note}</p></LessonCallout>}
    <LessonHeading level={2} id="mechanism">Mechanism and state flow</LessonHeading><ol>{spec.mechanism.map((step) => <li key={step}>{step}</li>)}</ol>
    {spec.diagram && <MermaidDiagram chart={spec.diagram.chart} title={spec.diagram.title} description={spec.diagram.description} />}
    {spec.interactive}
    <LessonHeading level={2} id="worked-example">Concrete example</LessonHeading><WorkedExample title={spec.example.title}><p>{spec.example.body}</p><p><strong>Architecture consequence:</strong> {spec.example.consequence}</p></WorkedExample>
    <LessonHeading level={2} id="tradeoffs">Trade-offs</LessonHeading><TradeoffTable><table><thead><tr><th>Option</th><th>Choose when</th><th>Cost or limit</th></tr></thead><tbody>{spec.tradeoffs.map((row) => <tr key={row.option}><td><strong>{row.option}</strong></td><td>{row.chooseWhen}</td><td>{row.cost}</td></tr>)}</tbody></table></TradeoffTable>
    <LessonHeading level={2} id="failure-diagnosis">Failure diagnosis</LessonHeading><FailureDeepDive {...spec.failure} />
    <LessonHeading level={2} id="exercise">Design checkpoint</LessonHeading><details><summary>Work the scenario before revealing the checklist</summary><div><ul>{spec.exercise.map((item) => <li key={item}>{item}</li>)}</ul></div></details>
    <InterviewFollowUps><ul>{spec.probes.map((probe) => <li key={probe}>{probe}</li>)}</ul></InterviewFollowUps>
    <PracticeConnections ids={spec.practice} />
    <FurtherReading items={architecturePatternSources[spec.id] ?? []} />
    <p>Sources reviewed {architecturePatternSourcesReviewedAt}. Service limits and product-specific guarantees still require current verification.</p>
    <RememberThis><p>{spec.remember}</p></RememberThis>
  </>;
}
