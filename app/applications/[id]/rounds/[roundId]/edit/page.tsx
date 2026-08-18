import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { updateRoundAction } from "@/features/applications/actions";
import { RoundForm } from "@/features/applications/round-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getApplicationById } from "@/lib/applications/queries";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Edit Interview Round", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EditRoundPage({ params }: { params: Promise<{ id: string; roundId: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { id, roundId } = await params; await requireMemberProfile(`/applications/${id}/rounds/${roundId}/edit`); const application = await getApplicationById(id); const round = application?.interview_rounds.find((item) => item.id === roundId); if (!application || !round) notFound(); const action = updateRoundAction.bind(null, id, roundId); return <div className="tracker-workspace"><div className="page-width tracker-form-width"><header className="tracker-form-page-header"><h1>Edit {round.round_name}</h1><p>{application.company_name} · Round {round.round_number}. Reschedule, update the result, or refine private notes without recreating the round.</p></header><RoundForm action={action} applicationId={id} round={round} /></div></div>; }
