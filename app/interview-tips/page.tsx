import { InterviewPlaybook } from "@/components/interview-playbook";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Software Engineering Interview Execution Guide",
  description: "Practical guidance for clarifying prompts, communicating decisions, recovering from mistakes, validating work, and handling interview-day logistics.",
  path: "/interview-tips",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry interview execution guidance and final-preparation checklists",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function InterviewTipsPage() {
  return <InterviewPlaybook />;
}
