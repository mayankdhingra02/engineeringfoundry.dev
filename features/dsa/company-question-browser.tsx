"use client";

import type { DSACompany, DSAInterviewQuestion, DSAQuestionProgressStatus } from "@/data/dsa/interview-prep";
import { CompanyDirectory } from "@/features/dsa/questions/company-directory";
import { QuestionBrowser } from "@/features/dsa/questions/question-browser";

/** Compatibility exports for existing route imports; both use the shared Phase 2 browser primitives. */
export function CompanyIndex({ companies, questions }: { companies: DSACompany[]; questions: DSAInterviewQuestion[] }) {
  return <CompanyDirectory companies={companies} questions={questions} />;
}

export function CompanyQuestionBrowser({ questions, companies, fixedCompanySlug }: {
  questions: DSAInterviewQuestion[]; companies: DSACompany[]; fixedCompanySlug?: string;
  progressStatusById?: Readonly<Record<string, DSAQuestionProgressStatus>>;
}) {
  return <QuestionBrowser questions={questions} companies={companies} fixedCompanySlug={fixedCompanySlug} />;
}
