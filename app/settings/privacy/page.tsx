import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { SettingsNav } from "@/components/settings-nav";
import { DeleteAccountForm, ExportAccountData } from "@/features/account/account-forms";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { accountDeletionStatus } from "@/lib/config/capabilities";
import { supportsPasswordReauthentication } from "@/lib/auth/reauthentication";

export const metadata: Metadata = { title: "Privacy & Data", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PrivacySettingsPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const { user } = await requireMemberProfile("/settings/privacy");
  // Deletion needs the server-only Auth admin credential. Resolve it here so an
  // unconfigured environment explains itself instead of offering a control that
  // fails only after the user types DELETE.
  const deletionAvailable = accountDeletionStatus().available;
  // Only password-capable accounts can be reauthenticated; the action enforces
  // this independently, this only decides whether to render the field.
  const requiresPassword = supportsPasswordReauthentication(user);
  return <section className="settings-page"><div className="page-width settings-workspace"><aside><Link className="settings-back" href="/settings"><ArrowLeft size={15} />All settings</Link><SettingsNav current="/settings/privacy" /></aside><div className="settings-content"><header><h1>Privacy & data</h1><p>Download your private workspace data or permanently remove the account that owns it.</p></header><section><h2>Your data</h2><div className="settings-assurance"><ShieldCheck size={18} aria-hidden="true" /><p>Exports are generated for the current authenticated account, delivered directly, and never placed at a public URL.</p></div><ExportAccountData /></section><section className="danger-zone"><h2>Danger zone</h2><DeleteAccountForm available={deletionAvailable} requiresPassword={requiresPassword} /></section></div></div></section>;
}
