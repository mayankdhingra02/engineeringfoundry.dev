import { Archive, BookOpenCheck, FileEdit, SearchCheck, ShieldCheck, UserRoundCheck } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { experienceGuidance } from "@/data/interview-experiences";
import { ExperienceBuilder } from "@/features/interview-experiences/experience-builder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Interview Experience Write-up Builder", description: "Create a structured, privacy-conscious interview reflection in your browser. Drafts are not saved, submitted, or published today.", path: "/interview-experiences" });

const futureRequirements = [
  { icon: UserRoundCheck, title: "Authenticated submission", text: "A future contributor would deliberately submit a finished account; this local draft is never submitted." },
  { icon: ShieldCheck, title: "Moderation and privacy review", text: "Review would check scope, personal information, confidentiality risk, and usefulness before publication." },
  { icon: BookOpenCheck, title: "Provenance and status", text: "Published accounts would carry contributor context, moderation status, and clear personal-experience boundaries." },
  { icon: Archive, title: "Freshness and removal", text: "A later directory needs correction, removal, and archival paths because experiences can become outdated." },
];

export default function InterviewExperiencesPage() {
  return <>
    <PageHero eyebrow="Interview experience workspace" title="Document the process without exposing the questions." description="Build a structured reflection you control. The tool runs only in your browser page session and publishes nothing." />
    <section className="section section-compact"><div className="page-width"><div className="experience-page-principles"><span><FileEdit size={16} />High-level process and topics</span><span><ShieldCheck size={16} />No identities or confidential material</span><span><SearchCheck size={16} />No upload, submission, or publishing</span></div></div></section>
    <section className="section section-alt"><div className="page-width"><ExperienceBuilder /></div></section>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="Reviewed public experiences" title="No reviewed public interview experiences are published yet." description="Engineering Foundry does not use demo accounts, scraped reviews, or invented activity to make this directory look populated." /><div className="experience-directory-empty" role="status"><SearchCheck size={25} /><div><strong>Current public experience count: {experienceGuidance.currentPublicExperienceCount}</strong><p>The write-up builder creates a private copyable summary. It does not place that summary into a directory or moderation queue.</p></div></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Future directory architecture" title="Publishing requires more than a form." description="A later authenticated phase can support reviewed contributor accounts without changing what the current private tool promises." /><div className="experience-future-grid">{futureRequirements.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={20} /><h2>{title}</h2><p>{text}</p></article>)}</div><p className="experience-future-note">Potential moderation states: {experienceGuidance.futureModerationStates.join(" · ")}. Future identity preferences may include display username or anonymous publicly, but no publishing occurs now and perfect anonymity is not promised.</p></div></section>
  </>;
}
