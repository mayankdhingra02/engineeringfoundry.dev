import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { SystemDesignAttemptEditor } from "@/features/system-design/attempt-editor";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getSystemDesignPracticeContent } from "@/content/system-design/problems/data";
import { isSystemDesignAttemptId } from "@/lib/system-design/attempt-query";
import { getSystemDesignAttempt, getSystemDesignWorkspaceState } from "@/lib/system-design/queries";

export const metadata: Metadata = { title: "System Design Attempt", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SystemDesignAttemptPage({ params }: { params: Promise<{ slug: string; attemptId: string }> }) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const { slug, attemptId } = await params;
  if (!isSystemDesignAttemptId(attemptId)) notFound();
  await requireMemberProfile(`/system-design/problems/${slug}/practice/${attemptId}`);
  const [attempt, workspace] = await Promise.all([getSystemDesignAttempt(attemptId), getSystemDesignWorkspaceState()]);
  const problem = getSystemDesignPracticeContent(slug);
  if (!attempt || attempt.problem_id !== slug || !problem || !workspace.signedIn) notFound();
  return <SystemDesignAttemptEditor attempt={attempt} problemTitle={problem.title} applications={workspace.applications} />;
}
