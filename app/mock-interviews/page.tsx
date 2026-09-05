import { Suspense } from "react";
import { MockInterviewLab } from "@/components/mock-interview-lab";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Free Mock Interview Practice",
  description: "Practice mock interviews solo or with your own peer using structured DSA, System Design, Low-Level Design, ML System Design, and Behavioral session kits.",
  path: "/mock-interviews",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry Mock Interview Practice Lab",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function MockInterviewsPage() {
  return <Suspense fallback={<div className="page-loading" role="status" aria-live="polite"><span className="sr-only">Loading Mock Interview Practice Lab…</span></div>}><MockInterviewLab accountPlatformAvailable={isAccountPlatformAvailable()} /></Suspense>;
}
