import { BookOpenCheck, Hammer, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { FeatureCard, PageHero, SectionHeading } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description: "The mission and community-first foundation behind Engineering Foundry.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Engineering Foundry"
        title="A better home for the engineering interview journey."
        description="Engineering Foundry brings preparation, deliberate practice, career support, and community pathways into one credible public product."
      />
      <section className="section">
        <div className="page-width">
          <SectionHeading
            eyebrow="Mission"
            title="Help engineers prepare with structure—and grow through community."
            description="Interview preparation is fragmented. The Foundry makes the path clearer, the practice more useful, and the community around it more generous."
          />
          <div className="feature-grid">
            <FeatureCard icon={Hammer} title="Built for craft" description="Clear roadmaps and practical tools that respect the complexity of engineering work." />
            <FeatureCard icon={HeartHandshake} title="Community-first" description="Practice, feedback, experiences, and voluntary referrals shaped around mutual benefit." />
            <FeatureCard icon={Users} title="Open to contributors" description="A long-term platform improved by engineers who share useful, responsible knowledge." />
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="page-width">
          <SectionHeading
            eyebrow="What is live"
            title="Public preparation first."
            description="The current release is deliberately useful without an account and explicit about the boundaries of every workflow."
          />
          <div className="feature-grid">
            <FeatureCard icon={BookOpenCheck} title="Structured preparation" description="DSA, System Design, ML Design, behavioral practice, company guides, and an interview playbook." href="/dsa" cta="Explore preparation" />
            <FeatureCard icon={ShieldCheck} title="Private browser tools" description="Mock, referral, challenge, and interview-experience drafts stay in browser memory and clear on refresh." href="/mock-interviews" cta="Try a practice tool" />
            <FeatureCard icon={Users} title="Real community pathway" description="The Community Hub connects public tools to an existing Discord community without inventing participation metrics." href="/community" cta="Open the Community Hub" />
          </div>
        </div>
      </section>
    </>
  );
}
