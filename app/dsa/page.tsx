import { DSAWorkspaceHeader, ReviewPreview, RoadmapPreview } from "@/components/dsa-workspace";
import { DSAWorkspaceSidebar } from "@/components/dsa-workspace-sidebar";
import { dsaCompanies } from "@/data/dsa/interview-prep";
import { dsaInterviewQuestionDatabase } from "@/data/dsa/question-database";
import { QuestionBrowserPreview } from "@/features/dsa/question-browser-preview";
import { createPageMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDsaWorkspaceState } from "@/lib/dsa/queries";
import { chooseContinueQuestion, getNeedsReview, getRoadmapProgress } from "@/lib/dsa/progress";
import { isAccountPlatformAvailable } from "@/lib/account-platform";

export const metadata = createPageMetadata({
  title: "DSA Interview Prep Workspace",
  description: "A focused coding interview workspace with practice questions, company discovery, language refreshers, and structured DSA roadmaps.",
  path: "/dsa",
});

async function AccountPracticePreview() {
  const state = await getDsaWorkspaceState();
  if (!state.signedIn) return null;
  const next = chooseContinueQuestion(state.preferredRoadmap, state.progress);
  const roadmap = getRoadmapProgress(state.preferredRoadmap, state.progress);
  return <aside className="dsa-home-practice-preview"><div><span>My Practice · {state.preferredRoadmap === "sde3plus" ? "SDE III+" : state.preferredRoadmap.toUpperCase()}</span><strong>{next?.title ?? "Roadmap complete"}</strong><p>{roadmap.completed} of {roadmap.total} complete · {getNeedsReview(state.progress).length} need review</p></div><Link href="/dsa/practice">Continue<ArrowRight size={14} /></Link></aside>;
}

export default function DsaPage() {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  return <div className="dsa-workspace-layout">
    <DSAWorkspaceSidebar />
    <div className="dsa-workspace-main">
      <DSAWorkspaceHeader />
      <Suspense fallback={null}><AccountPracticePreview /></Suspense>
      <QuestionBrowserPreview questions={dsaInterviewQuestionDatabase} companies={dsaCompanies} accountPlatformAvailable={accountPlatformAvailable} />
      <div className="dsa-workspace-lower-grid"><RoadmapPreview /><ReviewPreview /></div>
    </div>
  </div>;
}
