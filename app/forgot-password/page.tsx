import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/password-forms";
export const metadata: Metadata = { title: "Forgot Password", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <section className="auth-section"><div className="page-width"><ForgotPasswordForm /></div></section>; }
