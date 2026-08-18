import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { createAnswerAction } from "@/features/behavioral/actions";
import { AnswerForm } from "@/features/behavioral/answer-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getBehavioralWorkspaceData } from "@/lib/behavioral/queries";
export const metadata: Metadata = { title: "Draft behavioral answer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function NewBehavioralAnswerPage({ params, searchParams }: { params: Promise<{ questionId: string }>; searchParams: Promise<{ application?: string; company?: string; story?: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { questionId } = await params; const query = await searchParams; await requireMemberProfile(`/behavioral/questions/${questionId}/answers/new`); const data = await getBehavioralWorkspaceData(); const question = data.questions.find((item) => item.id === questionId); if (!question) notFound(); const application = data.applications.find((item) => item.id === query.application); return <div className="behavioral-workspace"><div className="page-width behavioral-form-width"><header className="tracker-form-page-header"><h1>Prepare this question</h1><p>{question.prompt}{application ? ` · ${application.company_name} — ${application.role_title}` : ""}</p></header><AnswerForm action={createAnswerAction.bind(null, question.id)} questionId={question.id} stories={data.stories.map(({ id, title, situation, task, action, result }) => ({ id, title, situation, task, action, result }))} applications={data.applications.map(({ id, company_name, company_slug, role_title }) => ({ id, company_name, company_slug, role_title }))} defaultCompany={application?.company_slug ?? query.company ?? question.companySlug} defaultApplication={application?.id} defaultStory={query.story} /></div></div>; }
