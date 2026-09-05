import { CalendarDays, FilePlus2, SearchCheck, ShieldCheck } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { ExperienceSubmission } from "@/features/interview-experiences/experience-submission";
import { ExperienceDirectory, type PublicExperience } from "@/features/interview-experiences/experience-directory";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";
import { getAuthenticatedActorState } from "@/lib/auth/actor";
import { getOwnedInterviewExperienceHistory } from "@/lib/interview-experiences/queries";
import { resolveInterviewExperiencePage } from "@/lib/interview-experiences/private-state";
import { listPublicInterviewExperiences } from "@/lib/supabase/public";

export const metadata = createPageMetadata({ title: "Interview Experiences", description: "Read reviewed, contributor-submitted interview process reports and learn how privacy-conscious reports are moderated before publication.", path: "/interview-experiences" });
export const dynamic = "force-dynamic";

type Search = { submissions_page?: string | string[] };

export default async function InterviewExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const ownerPage = resolveInterviewExperiencePage(search.submissions_page);
  const accountPlatformAvailable = isAccountPlatformAvailable();
  const actorState = accountPlatformAvailable
    ? await getAuthenticatedActorState()
    : { state: "anonymous" as const };
  const publicResult = await listPublicInterviewExperiences();
  const ownerState = actorState.state === "authenticated"
    ? await getOwnedInterviewExperienceHistory(actorState.actor, ownerPage)
    : actorState.state === "unavailable"
      ? { status: "unavailable" as const }
      : { status: "anonymous" as const };
  const experiences = (publicResult.data ?? []) as unknown as PublicExperience[];
  return <>
    <PageHero eyebrow="Interview experiences" title="Interview experiences, reviewed before they are shared." description="Browse real, high-level process reports—not copied questions or invented activity. Processes vary by role, team, location, and time." />
    <section className="section section-compact"><div className="page-width"><div className="experience-page-principles"><span><SearchCheck size={16} />Approved contributor reports only</span><span><ShieldCheck size={16} />No exact prompts or private identities</span><span><CalendarDays size={16} />Date and context keep reports honest</span></div></div></section>
    <section className="section"><div className="page-width"><SectionHeading title="Reviewed experience directory" description="Reports appear only after moderation. A report describes one contributor’s high-level experience and may not reflect the current process." />
      <ExperienceDirectory availability={publicResult.availability} experiences={experiences} /></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading title={accountPlatformAvailable ? "Contribute a high-level experience" : "Contribution availability"} description={accountPlatformAvailable ? "Start private. Submit only what you are allowed to share. Moderation checks confidentiality, personal information, and usefulness before publication." : "Account-backed drafts and moderation submissions are unavailable in this configuration. The reviewed-report directory above reports its own availability separately."} /><ExperienceSubmission accountPlatformAvailable={accountPlatformAvailable} ownerState={ownerState} /></div></section>
    <section className="section"><div className="page-width"><div className="experience-community-note"><div><h2>Request a correction, removal, or safety review</h2><p>Use the private contact pathway when a published report is inaccurate, outdated, unsafe, abusive, or contains personal or confidential information. A moderator can archive it without silently rewriting the contributor&apos;s account.</p></div><a className="button button-secondary" href="/contact">Choose a reporting channel <FilePlus2 size={15} /></a></div></div></section>
  </>;
}
