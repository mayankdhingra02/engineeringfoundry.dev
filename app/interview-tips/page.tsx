import { LearningTrackPage } from "@/components/learning-track-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Interview Tips", description: "Practical guidance before, during, and after engineering interviews.", path: "/interview-tips" });
const config = { eyebrow: "Interview Tips", title: "Small habits that make interviews clearer.", description: "Short, practical guidance for preparation, communication, interview day, and follow-up.", roadmap: [
  { title: "Before the interview", description: "Understand the format, rehearse your setup, and prioritize weak spots." }, { title: "During the interview", description: "Clarify, narrate decisions, test assumptions, and recover calmly." }, { title: "Communicate your thinking", description: "Keep the interviewer oriented without filling every silence." }, { title: "Close thoughtfully", description: "Ask useful questions, capture notes, and send concise follow-up." },
], categories: ["Before the Interview", "During the Interview", "Coding Interviews", "System Design Interviews", "Behavioral Interviews", "Communication", "Interview-day Preparation", "Follow-up"], practiceTitle: "Turn advice into repeatable interview habits.", resources: ["Interview day checklist", "Communication prompts", "Follow-up template"] };
export default function Page() { return <LearningTrackPage config={config} roadmap="interview-tips" />; }
