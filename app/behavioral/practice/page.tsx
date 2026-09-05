import { Suspense } from "react";
import { BehavioralAdaptivePractice } from "@/features/behavioral/adaptive-practice";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Behavioral Follow-Up Practice",
  description: "Run a private, text-first behavioral follow-up drill driven by the evidence gaps you select—without answer collection or hiring prediction.",
  path: "/behavioral/practice",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral evidence-gap practice",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function BehavioralPracticePage() {
  return <Suspense fallback={<div className="page-loading" role="status" aria-live="polite"><span className="sr-only">Loading behavioral practice…</span></div>}><BehavioralAdaptivePractice /></Suspense>;
}
