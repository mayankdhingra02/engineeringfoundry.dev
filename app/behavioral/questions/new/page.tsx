import type { Metadata } from "next";
import { AccountUnavailable } from "@/components/account-unavailable";
import { createQuestionAction } from "@/features/behavioral/actions";
import { QuestionForm } from "@/features/behavioral/question-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
export const metadata: Metadata = { title: "Add behavioral question", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function NewBehavioralQuestionPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; await requireMemberProfile("/behavioral/questions/new"); return <div className="behavioral-workspace"><div className="page-width behavioral-form-width"><header className="tracker-form-page-header"><h1>Add your own question</h1><p>Save a prompt from an interview loop without changing the shared curated library.</p></header><QuestionForm action={createQuestionAction} /></div></div>; }
