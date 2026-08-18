import type { Metadata } from "next";
import { AccountUnavailable } from "@/components/account-unavailable";
import { PageHero } from "@/components/page-shell";
import { ProfileForm } from "@/features/profile/profile-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
export const metadata: Metadata = { title: "Profile Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ProfileSettingsPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { user, profile } = await requireMemberProfile("/settings/profile"); return <><PageHero eyebrow="Account settings" title="Keep your profile current." description="Update your public identity, professional context, links, and visibility." /><section className="section"><div className="page-width profile-settings-width"><ProfileForm profile={profile} mode="settings" userId={user.id} /></div></section></>; }
