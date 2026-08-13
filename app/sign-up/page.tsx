import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { AuthForm } from "@/features/auth/auth-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/queries";
import { safeInternalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Create Account", description: "Create an Engineering Foundry account.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const next = safeInternalPath((await searchParams).next); const user = await getCurrentUser(); if (user) { const profile = await getCurrentProfile(); redirect(profile?.onboarding_complete ? next : `/onboarding?next=${encodeURIComponent(next)}`); } return <section className="auth-section"><div className="page-width"><AuthForm mode="sign-up" next={next} /></div></section>; }
