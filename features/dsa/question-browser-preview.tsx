"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DSACompany, DSAInterviewQuestion } from "@/data/dsa/interview-prep";
import { QuestionBrowserPreviewCore } from "@/features/dsa/questions/question-browser";

export function QuestionBrowserPreview({ questions, companies, accountPlatformAvailable }: { questions: DSAInterviewQuestion[]; companies: DSACompany[]; accountPlatformAvailable: boolean }) {
  return <section className="dsa-workspace-section dsa-practice-preview" aria-labelledby="practice-preview-title"><div className="dsa-workspace-section-heading"><div><h2 id="practice-preview-title">Foundry 75</h2><p>A versioned, finite core spanning every canonical pattern. Search by title, company, difficulty, or topic; company associations remain explicitly labeled demonstration data.</p></div><Link href="/dsa/questions">Open all 75 questions <ArrowRight size={14} /></Link></div><QuestionBrowserPreviewCore questions={questions} companies={companies} accountPlatformAvailable={accountPlatformAvailable} /></section>;
}
