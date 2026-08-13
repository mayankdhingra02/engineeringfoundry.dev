import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AccountUnavailable } from "@/components/account-unavailable";
import { ResetPasswordForm } from "@/features/auth/password-forms";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getCurrentUser } from "@/lib/auth/queries";
export const metadata: Metadata = { title: "Reset Password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ResetPasswordPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const recovery = (await cookies()).get("ef-password-recovery")?.value === "1"; if (!recovery || !(await getCurrentUser())) redirect("/forgot-password"); return <section className="auth-section"><div className="page-width"><ResetPasswordForm /></div></section>; }
