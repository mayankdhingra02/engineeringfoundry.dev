import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { PageHero } from "@/components/page-shell";
import { ProfileForm } from "@/features/profile/profile-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/queries";
export const metadata: Metadata = { title: "Profile Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ProfileSettingsPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const user = await getCurrentUser(); if (!user) redirect("/sign-in?next=/settings/profile"); const profile = await getCurrentProfile(); if (!profile?.onboarding_complete) redirect("/onboarding?next=/settings/profile"); return <><PageHero eyebrow="Account settings" title="Keep your profile current." description="Update your public identity, professional context, links, and visibility." /><section className="section"><div className="page-width profile-settings-width"><ProfileForm profile={profile} mode="settings" userId={user.id} /></div></section></>; }
