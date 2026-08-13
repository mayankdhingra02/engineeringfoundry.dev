import { Suspense } from "react";
import { ReferralWorkspace } from "@/features/referrals/referral-workspace";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Referral Request Builder for Software Engineers",
  description: "Draft a thoughtful referral request or a referrer availability card locally in your browser. Nothing is submitted, saved, routed, or guaranteed.",
  path: "/referrals",
});

export default function ReferralsPage() {
  return <>
    <PageHero
      eyebrow="Referral practice lab"
      title="Prepare a request someone can review thoughtfully."
      description="Build a concise referral packet or define your boundaries as a potential referrer. The tools work locally in this browser—there is no account, matching, routing, or referral guarantee."
    />
    <section className="section" id="referral-tools">
      <div className="page-width">
        <SectionHeading
          eyebrow="Two local tools"
          title="Useful preparation, with clear boundaries."
          description="Choose the request builder when asking for help, or the referrer toolkit when setting review expectations. You decide where anything you copy is shared."
        />
        <Suspense fallback={<div className="referral-loading" role="status">Loading the local toolkit…</div>}>
          <ReferralWorkspace />
        </Suspense>
      </div>
    </section>
  </>;
}
