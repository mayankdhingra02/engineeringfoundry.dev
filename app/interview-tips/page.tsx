import { InterviewPlaybook } from "@/components/interview-playbook";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Software Engineering Interview Playbook",
  description: "Practical preparation, coding, design, behavioral, communication, recovery, and follow-up guidance with session-only checklists.",
  path: "/interview-tips",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral practice, interview playbook, and verified resources",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function InterviewTipsPage() {
  return <InterviewPlaybook />;
}
