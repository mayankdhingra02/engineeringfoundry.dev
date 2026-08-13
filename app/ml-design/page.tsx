import { DesignTrackPage } from "@/components/design-track-page";
import { activeMlDesignProblems, mlDesignConcepts, mlDesignDomains, mlDesignRoadmap } from "@/data/ml-design";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "ML System Design Interview Roadmap",
  description: "Frame ML products, reason about data and metrics, and practice seven original end-to-end ML system design problems.",
  path: "/ml-design",
});

export default function MlDesignPage() {
  return <DesignTrackPage
    track="ml-design"
    eyebrow="ML System Design"
    title="ML System Design Interview Roadmap"
    description="Connect the product decision to labels, evaluation, training, serving, monitoring, and feedback—then practice complete original ML architecture prompts."
    roadmap={mlDesignRoadmap}
    concepts={mlDesignConcepts}
    problems={activeMlDesignProblems}
    domains={mlDesignDomains}
  />;
}
