import { Award, Eye, Scale, ShieldCheck, Users } from "lucide-react";
import { AnalyticsEventOnMount } from "@/components/analytics-event";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-action";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Community Recognition", description: "An honest preview of future opt-in Engineering Foundry recognition. No public leaderboard, ranks, scores, or fabricated activity are active.", path: "/leaderboard" });

const principles = [
  { icon: ShieldCheck, title: "Recorded evidence", text: "Recognition can use only actual product activity or reviewed contributions—not seeded identities or invented history." },
  { icon: Eye, title: "Opt-in visibility", text: "People must control whether eligible activity and recognition are displayed publicly." },
  { icon: Scale, title: "Transparent rules", text: "Eligibility, moderation, corrections, and exclusions must be understandable before launch." },
  { icon: Users, title: "Human context", text: "Useful review and community assistance may need moderation; raw popularity cannot become a hidden score." },
];

const futureDimensions = ["Challenge participation backed by real submissions", "Useful reviews evaluated under published guidance", "Original content contributions that pass moderation", "Constructive community assistance with consent-aware evidence"];

export default function LeaderboardPage() {
  return <>
    <AnalyticsEventOnMount event="recognition_preview_viewed" properties={{ placement: "leaderboard_page" }} />
    <PageHero eyebrow="Recognition preview" title="No public leaderboard is active yet." description="Persistent, verified participation and opt-in visibility are required before real community recognition or rankings can exist." />
    <section className="section"><div className="page-width"><div className="recognition-empty-state"><Award size={30} /><span>Current state</span><h2>There are no public ranks, scores, winners, or activity rows.</h2><p>Engineering Foundry will not seed a leaderboard with fictional people or define arbitrary points before real community behavior and moderation requirements are understood.</p><div className="hero-actions"><TrackedLink href="/challenges" event="community_pathway_clicked" properties={{ pathway: "challenge_lab", placement: "recognition_empty" }}>Try a Challenge</TrackedLink><TrackedLink className="button button-secondary" href="/mock-interviews" event="community_pathway_clicked" properties={{ pathway: "mock_interviews", placement: "recognition_empty" }}>Practice a Mock Interview</TrackedLink><TrackedLink className="button button-secondary" href={siteConfig.discordUrl} event="community_discord_clicked" properties={{ placement: "recognition_empty" }}>Join Discord</TrackedLink></div></div></div></section>
    <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="Recognition philosophy" title="Evidence first. Visibility by choice." description="Any future program must reward useful participation without turning community attention into an opaque popularity contest." /><div className="recognition-principle-grid">{principles.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={20} /><h2>{title}</h2><p>{text}</p></article>)}</div></div></section>
    <section className="section"><div className="page-width"><div className="recognition-future-grid"><div><span className="section-kicker">Potential future dimensions</span><h2>What evidence-backed contribution could include.</h2><p>These are areas to evaluate, not a point system or published ranking formula.</p></div><ul>{futureDimensions.map((item) => <li key={item}><ShieldCheck size={16} />{item}</li>)}</ul></div></div></section>
  </>;
}
