import { MlDesignTrackPage } from "@/components/ml-design-track-page";
import { activeMlDesignProblems, mlDesignConcepts, mlDesignDomains, mlDesignRoadmap } from "@/data/ml-design";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "ML System Design Interview Roadmap",
  description: "Use DECIDE to learn twenty ML system design concepts and practice thirteen task-specific end-to-end dossiers.",
  path: "/ml-design",
});

export default function MlDesignPage() {
  return <MlDesignTrackPage
    roadmap={mlDesignRoadmap}
    concepts={mlDesignConcepts}
    problems={activeMlDesignProblems}
    domains={mlDesignDomains}
  />;
}
