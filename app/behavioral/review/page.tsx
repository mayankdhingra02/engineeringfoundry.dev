import { BehavioralReviewReference } from "@/features/behavioral/review-reference";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Behavioral Evidence Review",
  description: "Review behavioral interview evidence across eleven descriptive dimensions with level-aware, privacy-safe calibration.",
  path: "/behavioral/review",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral evidence review reference",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function BehavioralReviewPage() {
  return <BehavioralReviewReference />;
}
