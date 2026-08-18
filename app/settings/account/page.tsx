import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { SettingsNav } from "@/components/settings-nav";
import { DisplayNameForm, EmailChangeForm, GlobalSignOutForm, PasswordChangeForm } from "@/features/account/account-forms";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Account Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const { user, profile } = await requireMemberProfile("/settings/account");
  return <section className="settings-page"><div className="page-width settings-workspace"><aside><Link className="settings-back" href="/settings"><ArrowLeft size={15} />All settings</Link><SettingsNav current="/settings/account" /></aside><div className="settings-content"><header><h1>Account</h1><p>Manage the identity and security actions tied to your authentication account.</p></header><section><h2>Name</h2><DisplayNameForm displayName={profile.display_name} /></section><section><h2>Email</h2><EmailChangeForm email={user.email ?? ""} /></section><section><h2>Password</h2><PasswordChangeForm /></section><section><h2>Sessions</h2><GlobalSignOutForm /></section><footer><Link href="/settings/profile">Edit optional public profile<ExternalLink size={14} /></Link><p>Public profile fields remain separate from account identity and preparation preferences.</p></footer></div></div></section>;
}
