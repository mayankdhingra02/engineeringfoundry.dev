import { Suspense } from "react";
import { BehavioralPractice } from "@/components/behavioral-practice";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Behavioral Interview Questions & Practice",
  description: "Practice 35 original behavioral interview prompts with STAR plus reflection, story selection, answer guidance, and realistic follow-ups.",
  path: "/behavioral",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral practice, interview playbook, and verified resources",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function BehavioralPage() {
  return <Suspense fallback={<div className="page-loading" aria-label="Loading behavioral practice" />}><BehavioralPractice /></Suspense>;
}
