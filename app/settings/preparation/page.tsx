import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { SettingsNav } from "@/components/settings-nav";
import { PreparationPreferencesForm } from "@/features/account/account-forms";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getPreparationPreferences } from "@/lib/account/preparation-preferences-query";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Preparation Preferences", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PreparationSettingsPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile("/settings/preparation");
  const preference = await getPreparationPreferences();
  return <section className="settings-page"><div className="page-width settings-workspace"><aside><Link className="settings-back" href="/settings"><ArrowLeft size={15} />All settings</Link><SettingsNav current="/settings/preparation" /></aside><div className="settings-content"><header><h1>Preparation</h1><p>Set lightweight defaults for preparation outside a specific application.</p></header><section><h2>Your defaults</h2><PreparationPreferencesForm preference={preference} /></section><aside className="preference-precedence"><strong>How defaults work</strong><ol><li>Application-specific role context wins for that interview.</li><li>Your preferred level guides preparation elsewhere.</li><li>An explicit roadmap or filter choice stays in control until you change it.</li></ol></aside></div></div></section>;
}
