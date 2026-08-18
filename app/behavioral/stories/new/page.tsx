import type { Metadata } from "next";
import { AccountUnavailable } from "@/components/account-unavailable";
import { createStoryAction } from "@/features/behavioral/actions";
import { StoryForm } from "@/features/behavioral/story-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
export const metadata: Metadata = { title: "Create STAR story", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function NewBehavioralStoryPage() { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; await requireMemberProfile("/behavioral/stories/new"); return <div className="behavioral-workspace"><div className="page-width behavioral-form-width"><header className="tracker-form-page-header"><h1>Create a STAR story</h1><p>Capture the full evidence once. You can link this story to several questions later.</p></header><StoryForm action={createStoryAction} /></div></div>; }
