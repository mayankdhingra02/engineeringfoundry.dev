/*
THESIS: Settings is a short route index, not a second dashboard.
OWN-WORLD: Flat warm-paper shell, one ruled navigation list, restrained rust current states, and direct copy.
STORY: Find the relevant account boundary immediately, make the change in its focused route, and return to work.
FIRST VIEWPORT: Title and privacy reassurance lead directly into four scan-friendly rows with no summary metrics.
FORM: Direct code-led extension of the established settings world, phase8-account-extension.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import type { Metadata } from "next";
import { AccountUnavailable } from "@/components/account-unavailable";
import { SettingsNav } from "@/components/settings-nav";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile("/settings");
  return <section className="settings-page"><div className="page-width settings-index-shell"><header><h1>Settings</h1><p>Manage your account, preparation defaults, interview reminders, and private data.</p></header><SettingsNav /><p className="settings-privacy-note">Your saved interview preparation is private to your account.</p></div></section>;
}
