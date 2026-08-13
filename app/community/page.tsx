import { ArrowRight, Binary, BrainCircuit, Code2, ExternalLink, GitPullRequestArrow, HandHeart, MessagesSquare, Network, ShieldCheck, Users } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-action";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Engineering Foundry Community", description: "Explore public learning, practice, career, and discussion pathways supported by an existing Discord community of 1,000+ members.", path: "/community" });

const pathways = [
  { group: "Learn", icon: Binary, title: "DSA", text: "Build algorithmic foundations through sourced questions and original topic guidance.", href: "/dsa", pathway: "dsa" },
  { group: "Learn", icon: Network, title: "System Design", text: "Practice requirements, architecture, reliability, and tradeoff reasoning.", href: "/system-design", pathway: "system_design" },
  { group: "Learn", icon: BrainCircuit, title: "ML Design", text: "Work from product framing through data, models, serving, and monitoring.", href: "/ml-design", pathway: "ml_design" },
  { group: "Learn", icon: MessagesSquare, title: "Behavioral", text: "Build truthful stories around leadership, collaboration, judgment, and growth.", href: "/behavioral", pathway: "behavioral" },
  { group: "Practice", icon: Users, title: "Mock Interview Practice Lab", text: "Run a structured solo session or bring a peer you already have.", href: "/mock-interviews", pathway: "mock_interviews" },
  { group: "Practice", icon: Code2, title: "Engineering Challenge Lab", text: "Produce concrete deliverables for eight original engineering scenarios.", href: "/challenges", pathway: "challenge_lab" },
  { group: "Career", icon: GitPullRequestArrow, title: "Referral Request Builder", text: "Prepare a respectful request locally without routing or saving personal data.", href: "/referrals?mode=request", pathway: "referral_builder" },
  { group: "Contribute / discuss", icon: HandHeart, title: "Discord community", text: "Discuss approaches, find peers, and help improve the community responsibly.", href: siteConfig.discordUrl, pathway: "discord" },
];

const guidelines = [
  ["Respect people", "Critique ideas and decisions without harassment, hostility, or personal attacks."],
  ["No spam or scraping", "Do not scrape member information, mass-DM people, or repeatedly promote unrelated services."],
  ["Share lawful, original work", "Do not plagiarize solutions or post proprietary employer, assessment, or interview material."],
  ["Keep career help voluntary", "Do not sell referral access, pressure employees, or imply that community membership guarantees availability."],
  ["Protect information", "Remove personal, confidential, customer, employer, credential, and access-control details before sharing."],
  ["Give constructive feedback", "Explain assumptions, ask useful questions, and suggest improvements with specific reasoning."],
];

export default function CommunityPage() {
  return <>
    <PageHero eyebrow="Community Hub" title="Learn, practice, and contribute without invented activity." description="Use the public product pathways today, then join an existing community for optional discussion and peer connection."><TrackedLink href={siteConfig.discordUrl} event="community_discord_clicked" properties={{ placement: "community_hero" }}>Join Discord <ExternalLink size={15} /></TrackedLink></PageHero>
    <section className="section community-proof-section"><div className="page-width"><div className="community-membership-proof"><Users size={28} /><div><span>Existing Discord community</span><strong>1,000+ community members</strong><p>This number refers to community membership—not active users, monthly usage, or people currently online.</p></div><ShieldCheck size={24} /></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Participation pathways" title="Choose what would help you today." description="Each pathway is public and useful without an account. Persistent contributions and reviewed community programs remain future work." /><div className="community-pathway-grid">{pathways.map(({ icon: Icon, ...pathway }) => <TrackedLink className="community-pathway-card" href={pathway.href} event={pathway.pathway === "discord" ? "community_discord_clicked" : "community_pathway_clicked"} properties={pathway.pathway === "discord" ? { placement: "community_pathway" } : { pathway: pathway.pathway, placement: "community_hub" }} key={pathway.title}><span>{pathway.group}</span><Icon size={21} /><h2>{pathway.title}</h2><p>{pathway.text}</p><strong>{pathway.pathway === "discord" ? "Open Discord" : "Open pathway"}<ArrowRight size={14} /></strong></TrackedLink>)}</div></div></section>
    <section className="section" id="community-guidelines"><div className="page-width"><SectionHeading eyebrow="Community guidelines" title="Useful participation starts with clear boundaries." description="These expectations apply when discussing Engineering Foundry material or meeting community members through Discord." /><div className="community-guideline-grid">{guidelines.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{text}</p></article>)}</div></div></section>
    <section className="final-cta" id="contributors"><div className="page-width"><div className="eyebrow"><HandHeart size={13} />Contribute thoughtfully</div><h2>Help shape a community worth learning in.</h2><p>Reviewed contributions, moderation workflows, and evidence-backed recognition are planned, not fabricated. Today, share responsibly and help peers reason more clearly.</p><div className="hero-actions"><TrackedLink href={siteConfig.discordUrl} event="community_discord_clicked" properties={{ placement: "community_footer" }}>Join the conversation <ExternalLink size={15} /></TrackedLink><TrackedLink className="button button-secondary" href="/leaderboard" event="community_pathway_clicked" properties={{ pathway: "recognition_preview", placement: "community_footer" }}>Read the recognition model</TrackedLink></div></div></section>
  </>;
}
