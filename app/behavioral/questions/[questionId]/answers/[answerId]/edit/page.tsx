import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { updateAnswerAction } from "@/features/behavioral/actions";
import { AnswerForm } from "@/features/behavioral/answer-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { answerMatchesQuestion, getBehavioralWorkspaceData } from "@/lib/behavioral/queries";
export const metadata: Metadata = { title: "Edit behavioral answer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EditBehavioralAnswerPage({ params }: { params: Promise<{ questionId: string; answerId: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { questionId, answerId } = await params; await requireMemberProfile(`/behavioral/questions/${questionId}/answers/${answerId}/edit`); const data = await getBehavioralWorkspaceData(); const question = data.questions.find((item) => item.id === questionId); const answer = question && data.answers.find((item) => item.id === answerId && answerMatchesQuestion(item, question)); if (!question || !answer) notFound(); return <div className="behavioral-workspace"><div className="page-width behavioral-form-width"><header className="tracker-form-page-header"><h1>Edit answer variant</h1><p>{question.prompt}</p></header><AnswerForm action={updateAnswerAction.bind(null, questionId, answerId)} questionId={questionId} stories={data.stories.map(({ id, title, situation, task, action, result, reflection, short_summary }) => ({ id, title, situation, task, action, result, reflection, short_summary }))} applications={data.applications.map(({ id, company_name, company_slug, role_title }) => ({ id, company_name, company_slug, role_title }))} answer={answer} /></div></div>; }
