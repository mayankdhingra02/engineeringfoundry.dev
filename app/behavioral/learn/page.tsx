import { BehavioralLearningPath } from "@/features/behavioral/learning-path";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Behavioral Interview Learning Path",
  description: "A 16-lesson evidence-first behavioral interview curriculum for truthful stories, adaptable answers, follow-ups, and level calibration.",
  path: "/behavioral/learn",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral interview learning path",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function BehavioralLearnPage() {
  return <BehavioralLearningPath />;
}
