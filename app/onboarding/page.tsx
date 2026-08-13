import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/features/profile/profile-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/queries";
import { safeInternalPath } from "@/lib/auth/redirects";
export const metadata: Metadata = { title: "Set Up Your Profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const user = await getCurrentUser(); if (!user) redirect("/sign-in?next=/onboarding"); const profile = await getCurrentProfile(); if (!profile) redirect("/auth/error?reason=profile"); const next = safeInternalPath((await searchParams).next); if (profile.onboarding_complete) redirect(next); return <section className="auth-section onboarding-section"><div className="page-width"><div className="onboarding-heading"><span>Welcome to Engineering Foundry</span><h1>Build your engineering identity.</h1><p>Your profile makes future practice, community, and career workflows attributable to you—not a demo account.</p></div><ProfileForm profile={profile} mode="onboarding" next={next} userId={user.id} /></div></section>; }
