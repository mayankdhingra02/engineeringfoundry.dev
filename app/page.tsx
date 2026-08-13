import Link from "next/link";
import { ArrowRight, Binary, Blocks, BrainCircuit, BriefcaseBusiness, Code2, GitPullRequestArrow, MessagesSquare, Network, Quote, Trophy, Users } from "lucide-react";
import { FeatureCard, SectionHeading } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-action";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Engineering Foundry — Prepare. Practice. Build. Grow.", description: siteConfig.description, path: "/", absoluteTitle: true });

const features = [
  { icon: Binary, title: "DSA", description: "Company-focused coding interview preparation and structured learning paths.", href: "/dsa", cta: "Explore DSA" },
  { icon: Network, title: "System Design", description: "Learn core architecture concepts and practice system-design interviews.", href: "/system-design", cta: "Explore System Design" },
  { icon: BrainCircuit, title: "ML System Design", description: "Prepare for machine-learning architecture and ML engineering interviews.", href: "/ml-design", cta: "Explore ML Design" },
  { icon: MessagesSquare, title: "Behavioral Interviews", description: "Build clear impact stories with practical frameworks and focused practice.", href: "/behavioral", cta: "Explore Behavioral" },
  { icon: Users, title: "Mock Interviews", description: "Practice interviews with peers—and experienced interviewers in the future.", href: "/mock-interviews", cta: "Find a Mock Interview" },
  { icon: GitPullRequestArrow, title: "Referrals", description: "Connect job seekers with engineers open to considering referral requests.", href: "/referrals", cta: "Explore Referrals" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner page-width">
          <div className="hero-copy">
            <div className="eyebrow"><Code2 size={13} />{siteConfig.tagline}</div>
            <h1>Everything you need to prepare for your next engineering interview.</h1>
            <p>Structured preparation, real practice, community, mock interviews, referrals, and engineering resources—brought together in one focused platform.</p>
            <div className="hero-actions"><Link className="button" href="/dsa">Start preparing <ArrowRight size={16} /></Link><Link className="button button-secondary" href="/community">Join the community</Link></div>
            <div className="social-proof"><span className="avatar-stack" aria-hidden="true"><span>01</span><span>10</span><span>11</span><span>EF</span></span><span className="proof-dot" /><span>1,000+ engineers in the community <em>(placeholder)</em></span></div>
          </div>
          <div className="blueprint-card" aria-label="Preparation roadmap preview">
            <div className="blueprint-bar"><span className="window-dots"><i /><i /><i /></span><span>PATH / INTERVIEW-READY</span><span>v0.1</span></div>
            <div className="blueprint-body"><div className="forge-path">
              <div className="forge-step active"><span className="step-no">01</span><span><strong>Build your foundation</strong><small>Core concepts · structured roadmap</small></span><span className="step-state">In progress</span></div>
              <div className="forge-step"><span className="step-no">02</span><span><strong>Practice deliberately</strong><small>Questions · design prompts · stories</small></span><span className="step-state">Next</span></div>
              <div className="forge-step"><span className="step-no">03</span><span><strong>Get real feedback</strong><small>Mock interviews · peer review</small></span><span className="step-state">Queued</span></div>
              <div className="forge-step"><span className="step-no">04</span><span><strong>Build your network</strong><small>Community · referrals · contribution</small></span><span className="step-state">Queued</span></div>
            </div><div className="progress-rail"><span /></div><div className="blueprint-footer"><span>Foundation progress</span><span>32%</span></div></div>
          </div>
        </div>
      </section>

      <section className="section"><div className="page-width"><SectionHeading eyebrow="The preparation stack" title="One place. Every part of the process." description="Move from scattered tabs and advice to a clear preparation system built for working engineers." /><div className="feature-grid">{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</div></div></section>

      <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="How it works" title="A tighter loop from learning to readiness." description="The Foundry is designed around steady progress, useful feedback, and people helping people." />
        <div className="how-grid"><div className="how-step"><span className="number">01 / MAP</span><h3>Choose a track</h3><p>Focus your effort with clear roadmaps for coding, architecture, ML, and behavioral interviews.</p></div><div className="how-step"><span className="number">02 / BUILD</span><h3>Learn & practice</h3><p>Work through focused questions, design prompts, frameworks, and curated resources.</p></div><div className="how-step"><span className="number">03 / TEST</span><h3>Practice together</h3><p>Turn knowledge into interview skill through peer mocks and structured feedback.</p></div><div className="how-step"><span className="number">04 / GROW</span><h3>Contribute back</h3><p>Share experiences, review peers, become a Referrer, and strengthen the community.</p></div></div>
      </div></section>

      <section className="section"><div className="page-width"><div className="split-banner"><div><div className="eyebrow"><Users size={13} />Community, not a content treadmill</div><h2>Prepare alongside engineers who are doing the work.</h2><p>Find peers for mock interviews, learn from shared experiences, join weekly challenges, and contribute what you know. The strongest preparation systems are built together.</p><div className="hero-actions"><Link className="button" href="/community">Explore the community</Link><TrackedLink className="button button-secondary" href={siteConfig.discordUrl} event="discord_clicked" properties={{ placement: "homepage" }}>Join Discord</TrackedLink></div></div><div className="community-nodes" aria-label="Community activity map"><span>Mock partners</span><span>Reviewers</span><span>Engineering Foundry</span><span>Contributors</span><span>Referrers</span></div></div></div></section>

      <section className="section section-alt"><div className="page-width"><SectionHeading eyebrow="What’s happening" title="A living practice ground." description="These launch surfaces are ready for real content and community activity in the next phase." action={<Link className="button button-ghost" href="/challenges">View all challenges</Link>} />
        <div className="mini-grid"><div className="mini-card"><small>Upcoming challenge · Demo</small><h3>Design a resilient notification service</h3><p>System Design · Opens when the community challenge program launches.</p></div><div className="mini-card"><small>Popular companies · Demo</small><h3>Company guide foundations</h3><p>Browse structural guides for Google, Meta, Amazon, Microsoft, Apple, and LinkedIn.</p></div><div className="mini-card"><small>Resource collection · Demo</small><h3>The interview-ready reading list</h3><p>A small, searchable foundation ready for community-curated engineering resources.</p></div></div>
      </div></section>

      <section className="section section-dark"><div className="page-width"><SectionHeading eyebrow="Built for the whole journey" title="More than a question bank." description="A long-term home for preparation, practice, career momentum, and the engineering community around it." /><div className="mini-grid"><div className="mini-card"><Trophy size={19} /><h3>Weekly challenges</h3><p>Practice beyond interviews with engineering scenarios across four disciplines.</p></div><div className="mini-card"><Quote size={19} /><h3>Interview experiences</h3><p>Share useful process context without scraping or copying proprietary content.</p></div><div className="mini-card"><BriefcaseBusiness size={19} /><h3>Community referrals</h3><p>A transparent, voluntary path between job seekers and willing Referrers.</p></div></div></div></section>

      <section className="final-cta"><div className="page-width"><div className="eyebrow"><Blocks size={13} />Your next step</div><h2>Build the interview readiness you can trust.</h2><p>Start with a focused track, practice consistently, and grow with the Engineering Foundry community.</p><div className="hero-actions"><Link className="button" href="/dashboard">Get started <ArrowRight size={16} /></Link><Link className="button button-secondary" href="/resources">Browse resources</Link></div></div></section>
    </>
  );
}
