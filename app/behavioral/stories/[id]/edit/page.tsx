import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { updateStoryAction } from "@/features/behavioral/actions";
import { StoryForm } from "@/features/behavioral/story-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getBehavioralStoryEditSnapshot } from "@/lib/behavioral/queries";
export const metadata: Metadata = { title: "Edit STAR story", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EditBehavioralStoryPage({ params }: { params: Promise<{ id: string }> }) { if (!isAccountPlatformAvailable()) return <AccountUnavailable />; const { id } = await params; await requireMemberProfile(`/behavioral/stories/${id}/edit`); const snapshot = await getBehavioralStoryEditSnapshot(id); if (!snapshot) notFound(); return <div className="behavioral-workspace"><div className="page-width behavioral-form-width"><header className="tracker-form-page-header"><h1>Edit {snapshot.story.title}</h1><p>Refine the evidence or themes without breaking its question links.</p></header><StoryForm action={updateStoryAction.bind(null, id)} story={snapshot.story} themes={[...snapshot.themes]} /></div></div>; }
