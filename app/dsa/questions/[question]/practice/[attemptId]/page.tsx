import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { DsaPracticeAttemptEditor } from "@/features/dsa/practice/attempt-editor";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getCanonicalDsaQuestion } from "@/lib/dsa/catalog";
import { isDsaAttemptId } from "@/lib/dsa/practice-attempt-action-input";
import { getDsaPracticeAttempt } from "@/lib/dsa/practice-queries";

export const metadata: Metadata = { title: "Private DSA Practice Attempt", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DsaPracticeAttemptPage({ params }: { params: Promise<{ question: string; attemptId: string }> }) {
  const { question: questionId, attemptId } = await params;
  const question = getCanonicalDsaQuestion(questionId);
  if (!question?.inQuestionBrowser || !isDsaAttemptId(attemptId)) notFound();
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile(`/dsa/questions/${questionId}/practice/${attemptId}`);
  const attempt = await getDsaPracticeAttempt(attemptId);
  if (!attempt || attempt.question_id !== questionId) notFound();
  return <DsaPracticeAttemptEditor attempt={attempt} questionTitle={question.title} />;
}
