import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { MlDesignAttemptEditor } from "@/features/ml-design/attempt-editor";
import { getMlDesignProblem } from "@/data/ml-design";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { canonicalMlDesignProblemSlugs } from "@/lib/ml-design/attempt";
import { isMlDesignAttemptId } from "@/lib/ml-design/attempt-query";
import { getMlDesignAttempt } from "@/lib/ml-design/queries";

export const metadata: Metadata = { title: "ML Design Attempt", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MlDesignAttemptPage({ params }: { params: Promise<{ problem: string; attemptId: string }> }) {
  const { problem: problemId, attemptId } = await params;
  if (!canonicalMlDesignProblemSlugs.has(problemId) || !isMlDesignAttemptId(attemptId)) notFound();
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile(`/ml-design/problems/${problemId}/practice/${attemptId}`);
  const [attempt, problem] = await Promise.all([getMlDesignAttempt(attemptId), Promise.resolve(getMlDesignProblem(problemId))]);
  if (!attempt || attempt.problem_id !== problemId || !problem) notFound();
  return <MlDesignAttemptEditor attempt={attempt} problemTitle={problem.title} />;
}
