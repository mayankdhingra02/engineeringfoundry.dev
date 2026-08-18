import { Clock3 } from "lucide-react";
import { quickReviewSteps } from "./strategy-content";

export function QuickReview() {
  return <section className="dsa-strategy-quick-review" aria-labelledby="quick-review"><header><span><Clock3 size={14} />Pre-interview reset</span><h2 id="quick-review">5-Minute Review</h2><p>The smallest useful version of the playbook.</p></header><ol>{quickReviewSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol><blockquote>Explain decisions, not keystrokes.</blockquote></section>;
}
