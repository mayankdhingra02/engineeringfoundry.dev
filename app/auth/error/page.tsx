import type { Metadata } from "next";
import Link from "next/link";
import { AccountUnavailable } from "@/components/account-unavailable";
import { isAccountPlatformAvailable } from "@/lib/account-platform";

export const metadata: Metadata = { title: "Authentication Error", robots: { index: false, follow: false } };
export default function AuthErrorPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; return <section className="auth-section"><div className="page-width"><div className="auth-card auth-success"><p className="auth-kicker">Authentication interrupted</p><h1>We couldn&apos;t sign you in.</h1><p>The link may have expired, the provider may not be configured, or the request could not be verified. Start again safely from the sign-in page.</p><div className="hero-actions"><Link className="button" href="/signin">Return to sign in</Link><Link className="button button-secondary" href="/forgot-password">Reset password</Link></div></div></div></section>; }
