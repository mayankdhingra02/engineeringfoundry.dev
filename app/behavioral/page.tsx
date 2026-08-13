import type { Metadata } from "next";
import { LearningTrackPage } from "@/components/learning-track-page";

export const metadata: Metadata = { title: "Behavioral Interviews", description: "Build strong stories and practice behavioral interviews." };
const config = { eyebrow: "Behavioral Interviews", title: "Tell the story behind your engineering impact.", description: "Build a useful story bank, structure answers clearly, and practice the judgment and communication behind your work.", roadmap: [
  { title: "Build your story inventory", description: "Map projects, decisions, conflict, growth, and impact." }, { title: "Use the STAR framework", description: "Set context, clarify ownership, show action, and quantify results." }, { title: "Cover core categories", description: "Leadership, collaboration, ambiguity, failure, and influence." }, { title: "Adapt for companies", description: "Connect stories to role expectations without memorizing scripts." }, { title: "Practice & reflect", description: "Use timed prompts, notes, and structured peer feedback." },
], categories: ["Leadership", "Collaboration", "Conflict", "Ambiguity", "Failure & Growth", "Execution", "Mentorship", "Cross-functional Influence", "Company-specific Prep"], practiceTitle: "Practice naturally—not from a memorized script.", resources: ["STAR story workbook", "Question category map", "Practice reflection guide"] };
export default function Page() { return <LearningTrackPage config={config} />; }
