import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SystemDesignFocusPlanner } from "@/components/system-design-focus-planner";
import { SystemDesignSidebar } from "@/components/system-design-sidebar";
import { systemDesignCurriculum } from "@/data/system-design/curriculum";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "System Design Study Planner",
  description: "Build a focused System Design curriculum from your interview level, timeline, and available study time without locking any lesson.",
  path: "/system-design/plan",
});

export default function SystemDesignPlanPage() {
  return <div className="sd-doc-layout sd-plan-page-layout">
    <SystemDesignSidebar curriculum={systemDesignCurriculum} />
    <div className="sd-plan-page-column">
      <nav className="sd-breadcrumbs" aria-label="Breadcrumb"><Link href="/system-design/start-here/introduction"><ArrowLeft size={13} />System Design</Link><span>/ Study planner</span></nav>
      <header className="sd-plan-page-header">
        <h1>Build a focused System Design plan.</h1>
        <p>Choose your interview level, timeline, and available study time. The planner changes what to prioritize—not which lessons you can access.</p>
        <nav className="sd-plan-page-links" aria-label="System Design learning options">
          <Link className="button button-secondary" href="/system-design/start-here/introduction">Start learning<ArrowRight size={15} /></Link>
          <Link className="text-link" href="/system-design/problems">Browse practice problems<ArrowRight size={14} /></Link>
        </nav>
      </header>
      <SystemDesignFocusPlanner accountPlatformAvailable={isAccountPlatformAvailable()} />
    </div>
  </div>;
}
