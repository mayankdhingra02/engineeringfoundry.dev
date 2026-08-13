import { DesignTrackPage } from "@/components/design-track-page";
import { activeSystemDesignProblems, systemDesignConcepts, systemDesignDomains, systemDesignRoadmap } from "@/data/system-design";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "System Design Interview Roadmap",
  description: "Learn a repeatable System Design interview framework, explore architecture concepts, and practice 10 original design problems.",
  path: "/system-design",
});

export default function SystemDesignPage() {
  return <DesignTrackPage
    track="system-design"
    eyebrow="System Design"
    title="System Design Interview Roadmap"
    description="Learn a repeatable framework, reason from explicit constraints, and practice complete original architecture prompts without pretending there is one correct design."
    roadmap={systemDesignRoadmap}
    concepts={systemDesignConcepts}
    problems={activeSystemDesignProblems}
    domains={systemDesignDomains}
  />;
}
