import type { Metadata } from "next";
import { LearningTrackPage } from "@/components/learning-track-page";

export const metadata: Metadata = { title: "ML System Design", description: "Prepare for ML architecture and engineering interviews." };
const config = { eyebrow: "ML System Design", title: "Design machine-learning systems end to end.", description: "Connect modeling decisions with data, infrastructure, serving, monitoring, and product constraints.", roadmap: [
  { title: "ML foundations", description: "Problem framing, metrics, experimentation, and model selection." }, { title: "Data foundations", description: "Collection, labeling, quality, features, and pipelines." }, { title: "Training systems", description: "Orchestration, distributed training, evaluation, and reproducibility." }, { title: "Serving & monitoring", description: "Online inference, drift, reliability, and feedback loops." }, { title: "Applied architectures", description: "Recommendations, ranking, search, and LLM systems." },
], categories: ["Model Development", "Data Pipelines", "Feature Engineering", "Training Infrastructure", "Model Serving", "Monitoring", "Recommendation Systems", "Search & Ranking", "LLM Systems"], practiceTitle: "Turn open-ended ML prompts into grounded designs.", resources: ["ML systems foundations", "MLOps reading list", "Applied design prompts"] };
export default function Page() { return <LearningTrackPage config={config} />; }
