import type { Metadata } from "next";
import { AccountUnavailable } from "@/components/account-unavailable";
import { ApplicationForm } from "@/features/applications/application-form";
import { createApplicationAction } from "@/features/applications/actions";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Add Application", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function NewApplicationPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; await requireMemberProfile("/applications/new"); return <div className="tracker-workspace"><div className="page-width tracker-form-width"><header className="tracker-form-page-header"><h1>Add application</h1><p>Add the role now, then build the interview process as it develops.</p></header><ApplicationForm action={createApplicationAction} /></div></div>; }
