import type { Metadata } from "next";
import { AccountUnavailable } from "@/components/account-unavailable";
import { ForgotPasswordForm } from "@/features/auth/password-forms";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
export const metadata: Metadata = { title: "Forgot Password", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; return <section className="auth-section"><div className="page-width"><ForgotPasswordForm /></div></section>; }
