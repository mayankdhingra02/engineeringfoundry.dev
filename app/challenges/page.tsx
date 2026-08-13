import { Binary, BrainCircuit, ExternalLink, Network, ServerCog, ShieldCheck } from "lucide-react";
import { ChallengeExplorer } from "@/components/challenge-explorer";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-action";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Engineering Challenges for Software Engineers", description: "Practice eight original, self-guided DSA, System Design, ML System Design, and Backend Engineering scenarios without an account or official judging.", path: "/challenges" });

const tracks = [
  { icon: Binary, title: "DSA", text: "Turn precise constraints into algorithms, complexity arguments, edge cases, and tests." },
  { icon: Network, title: "System Design", text: "Produce architectures, interfaces, reliability plans, and explicit tradeoffs." },
  { icon: BrainCircuit, title: "ML System Design", text: "Frame product decisions across data, models, serving, monitoring, and safe fallback." },
  { icon: ServerCog, title: "Backend Engineering", text: "Reason about interfaces, persistence, concurrency, failures, testing, and observability." },
];

export default function ChallengesPage() {
  return <>
    <PageHero eyebrow="Engineering Challenge Lab" title="Practice engineering judgment beyond memorized answers." description="Choose an original scenario, produce a concrete engineering deliverable, reveal considerations only when needed, and review your work qualitatively. No account or competition is required."><span className="hero-inline-note"><ShieldCheck size={15} />Self-guided practice · nothing submitted</span></PageHero>
    <section className="section"><div className="page-width"><SectionHeading eyebrow="Four practice tracks" title="Choose the kind of deliverable you want to strengthen." description="Levels are Engineering Foundry preparation labels. They do not map to employer titles or interview levels." /><div className="challenge-overview-grid">{tracks.map(({ icon: Icon, title, text }, index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><Icon size={21} /><h2>{title}</h2><p>{text}</p></article>)}</div></div></section>
    <section className="section section-alt" id="challenge-explorer"><div className="page-width"><SectionHeading eyebrow="Challenge explorer" title="Select a realistic scenario and start building." description="Every active challenge includes deliverables, constraints, a suggested workflow, revealable guidance, qualitative self-review, and a session-only worksheet." /><ChallengeExplorer /></div></section>
    <section className="section"><div className="page-width"><div className="challenge-lab-community"><div><span className="section-kicker">Community participation</span><h2>Share an approach only if it helps you learn.</h2><p>Discord discussion is optional. Engineering Foundry is not collecting official submissions, conducting formal judging, promising prizes, or producing rankings today.</p><TrackedLink href={siteConfig.discordUrl} event="challenge_community_clicked" properties={{ placement: "challenge_explorer" }}>Join the community discussion <ExternalLink size={15} /></TrackedLink></div><ul><li>Share your own work and explain assumptions.</li><li>Critique ideas rather than people.</li><li>Do not copy another participant&apos;s solution.</li><li>Do not post proprietary employer or interview material.</li><li>Remove confidential and personal information.</li><li>Offer specific, constructive feedback.</li></ul></div></div></section>
  </>;
}
