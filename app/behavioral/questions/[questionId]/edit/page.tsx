import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { updateQuestionAction } from "@/features/behavioral/actions";
import { QuestionForm } from "@/features/behavioral/question-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getBehavioralWorkspaceData } from "@/lib/behavioral/queries";
export const metadata: Metadata = { title: "Edit behavioral question", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EditBehavioralQuestionPage({ params }: { params: Promise<{ questionId: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { questionId } = await params; await requireMemberProfile(`/behavioral/questions/${questionId}/edit`); const data = await getBehavioralWorkspaceData(); const question = data.customQuestions.find((item) => item.id === questionId); if (!question) notFound(); return <div className="behavioral-workspace"><div className="page-width behavioral-form-width"><header className="tracker-form-page-header"><h1>Edit question</h1><p>Update your prompt, grouping, company, or private preparation notes.</p></header><QuestionForm action={updateQuestionAction.bind(null, questionId)} question={question} /></div></div>; }
