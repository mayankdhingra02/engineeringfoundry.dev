import { MermaidDiagram } from "@/components/mermaid-diagram";
import { FailureDeepDive, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { productionEngineeringSources, productionEngineeringSourcesReviewedAt } from "./sources";

export interface ProductionEngineeringLessonSpec {
  id: string;
  mentalModel: string;
  mechanism: readonly string[];
  diagram?: { chart: string; title: string; description: string };
  example: { title: string; body: string; consequence: string };
  tradeoffs: readonly { option: string; chooseWhen: string; cost: string }[];
  failure: { failure: string; impact: string; detection: string; mitigation: string; tradeoff: string };
  exercise: readonly string[];
  probes: readonly string[];
  levelCalibration?: { level: string; evidence: string }[];
  practice: readonly string[];
  remember: string;
  note?: string;
}

export function ProductionEngineeringLessonEnd({ id, practice, children }: { id: string; practice: readonly string[]; children: React.ReactNode }) {
  return <><PracticeConnections ids={practice} /><FurtherReading items={productionEngineeringSources[id] ?? []} /><p>Sources reviewed {productionEngineeringSourcesReviewedAt}. Product-specific controls and threat assumptions still require current verification.</p><RememberThis><p>{children}</p></RememberThis></>;
}

export function ProductionEngineeringLesson({ spec }: { spec: ProductionEngineeringLessonSpec }) {
  return <>
    <LessonHeading level={2} id="mental-model">Mental model</LessonHeading><p>{spec.mentalModel}</p>
    {spec.note && <LessonCallout variant="important"><p>{spec.note}</p></LessonCallout>}
    <LessonHeading level={2} id="mechanism">Mechanism and state flow</LessonHeading><ol>{spec.mechanism.map((step) => <li key={step}>{step}</li>)}</ol>
    {spec.diagram && <MermaidDiagram chart={spec.diagram.chart} title={spec.diagram.title} description={spec.diagram.description} />}
    <LessonHeading level={2} id="worked-example">Concrete example</LessonHeading><WorkedExample title={spec.example.title}><p>{spec.example.body}</p><p><strong>Architecture consequence:</strong> {spec.example.consequence}</p></WorkedExample>
    <LessonHeading level={2} id="tradeoffs">Scaling and operational trade-offs</LessonHeading><TradeoffTable><table><thead><tr><th>Option</th><th>Choose when</th><th>Cost or limit</th></tr></thead><tbody>{spec.tradeoffs.map((row) => <tr key={row.option}><td><strong>{row.option}</strong></td><td>{row.chooseWhen}</td><td>{row.cost}</td></tr>)}</tbody></table></TradeoffTable>
    <LessonHeading level={2} id="failure-diagnosis">Failure diagnosis</LessonHeading><FailureDeepDive {...spec.failure} />
    <LessonHeading level={2} id="exercise">Checklist exercise</LessonHeading><details><summary>Work the scenario before revealing your answer</summary><div><ul>{spec.exercise.map((item) => <li key={item}>{item}</li>)}</ul></div></details>
    {spec.levelCalibration && <><LessonHeading level={2} id="level-calibration">Level calibration</LessonHeading><TradeoffTable><table><thead><tr><th>Level</th><th>Useful evidence</th></tr></thead><tbody>{spec.levelCalibration.map((row) => <tr key={row.level}><td>{row.level}</td><td>{row.evidence}</td></tr>)}</tbody></table></TradeoffTable></>}
    <InterviewFollowUps><ul>{spec.probes.map((probe) => <li key={probe}>{probe}</li>)}</ul></InterviewFollowUps>
    <ProductionEngineeringLessonEnd id={spec.id} practice={spec.practice}>{spec.remember}</ProductionEngineeringLessonEnd>
  </>;
}
