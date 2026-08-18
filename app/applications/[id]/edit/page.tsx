import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { ApplicationForm } from "@/features/applications/application-form";
import { updateApplicationAction } from "@/features/applications/actions";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getApplicationById } from "@/lib/applications/queries";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Edit Application", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { id } = await params; await requireMemberProfile(`/applications/${id}/edit`); const application = await getApplicationById(id); if (!application) notFound(); const action = updateApplicationAction.bind(null, id); return <div className="tracker-workspace"><div className="page-width tracker-form-width"><header className="tracker-form-page-header"><h1>Edit {application.company_name}</h1><p>Update the role, stage, contacts, or private notes.</p></header><ApplicationForm action={action} application={application} /></div></div>; }
