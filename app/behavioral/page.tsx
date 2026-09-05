import { Suspense } from "react";
import { BehavioralPractice } from "@/components/behavioral-practice";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Behavioral Interview Questions & Practice",
  description: "Learn through 16 evidence-first lessons and practice 48 original behavioral interview prompts with private story and answer tools.",
  path: "/behavioral",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral practice, interview playbook, and verified resources",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function BehavioralPage() {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  return <>
    {!accountPlatformAvailable && <p className="sr-only">Account saving is unavailable. Public Behavioral practice and the on-page story worksheet remain available.</p>}
    <Suspense fallback={<div className="page-loading" role="status" aria-live="polite"><span className="sr-only">Loading behavioral practice…</span></div>}><BehavioralPractice accountPlatformAvailable={accountPlatformAvailable} /></Suspense>
  </>;
}
