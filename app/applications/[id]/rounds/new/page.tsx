import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { createRoundAction } from "@/features/applications/actions";
import { RoundForm } from "@/features/applications/round-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getApplicationById } from "@/lib/applications/queries";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Add Interview Round", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function NewRoundPage({ params }: { params: Promise<{ id: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { id } = await params; await requireMemberProfile(`/applications/${id}/rounds/new`); const application = await getApplicationById(id); if (!application) notFound(); const action = createRoundAction.bind(null, id); return <div className="tracker-workspace"><div className="page-width tracker-form-width"><header className="tracker-form-page-header"><h1>Add interview round</h1><p>{application.company_name} · {application.role_title}. Create the round now even if its schedule is still unknown.</p></header><RoundForm action={action} applicationId={id} /></div></div>; }
