import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ExecutionFramework } from "@/data/company-guides/types";

export function InterviewExecutionFramework({ framework }: { framework: ExecutionFramework }) {
  return (
    <div className="company-execution-workspace">
      {framework.warning && <div className="company-callout caution"><AlertTriangle size={18} /><div><strong>Practice without your IDE.</strong><p>{framework.warning}</p></div></div>}
      <ol className="company-execution-framework" aria-label={framework.title}>
        {framework.steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div><CheckCircle2 size={15} aria-hidden="true" /></li>)}
      </ol>
    </div>
  );
}
