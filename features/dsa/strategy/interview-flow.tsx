import { ArrowDown, ArrowRight } from "lucide-react";
import { interviewFlowStages } from "./strategy-content";

export function InterviewFlow() {
  return <ol className="dsa-interview-flow" aria-label="Six-stage coding interview flow">{interviewFlowStages.map((stage, index) => <li key={stage.id}>
    <a href={`#${stage.id}`}><span>{stage.number}</span><strong>{stage.title}</strong><p>{stage.summary}</p><ul>{stage.actions.map((action) => <li key={action}>{action}</li>)}</ul></a>
    {index < interviewFlowStages.length - 1 && <span className="dsa-flow-arrow" aria-hidden="true"><ArrowRight className="desktop" size={14} /><ArrowDown className="mobile" size={14} /></span>}
  </li>)}</ol>;
}

