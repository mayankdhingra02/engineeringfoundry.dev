import Link from "next/link";
import { ArrowRight, Binary, BrainCircuit, CheckCircle2, Code2, GitPullRequestArrow, MessagesSquare, Network, ServerCog, ShieldCheck, Trophy, Users } from "lucide-react";
import { FeatureCard, SectionHeading } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-action";
import { siteConfig } from "@/config/site";
import { companies } from "@/data/companies";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Engineering Foundry — Prepare. Practice. Build. Grow.", description: siteConfig.description, path: "/", absoluteTitle: true });

const preparationAreas = [
  { icon: Binary, title: "DSA", description: "Company-focused coding interview practice, organized by pattern and difficulty.", href: "/dsa", cta: "Explore DSA" },
  { icon: Network, title: "System Design", description: "Architecture concepts, tradeoffs, and structured design interview practice.", href: "/system-design", cta: "Explore System Design" },
  { icon: BrainCircuit, title: "ML System Design", description: "Applied ML and AI systems—from data pipelines to serving and monitoring.", href: "/ml-design", cta: "Explore ML Design" },
  { icon: MessagesSquare, title: "Behavioral", description: "Build stronger stories around leadership, impact, judgment, and communication.", href: "/behavioral", cta: "Explore Behavioral" },
  { icon: Users, title: "Mock Interviews", description: "Run a structured solo session or practice with a peer you already have.", href: "/mock-interviews", cta: "Open the Practice Lab" },
  { icon: GitPullRequestArrow, title: "Referrals", description: "Draft a thoughtful referral request or a clear referrer availability card locally.", href: "/referrals", cta: "Open the Toolkit" },
];

const ecosystem = [
  { step: "01", title: "Learn", description: "Build the foundation", items: ["DSA", "System Design", "ML Design"] },
  { step: "02", title: "Practice", description: "Turn knowledge into skill", items: ["Problems", "Mock interviews", "Challenges"] },
  { step: "03", title: "Get signal", description: "See where to improve", items: ["Peer feedback", "Experiences", "Progress"] },
  { step: "04", title: "Grow", description: "Move forward together", items: ["Community", "Referrals", "Mentorship"] },
];

const interviewTypes = ["DSA", "System Design", "ML System Design", "Behavioral"];
const challengeTracks = [{ icon: Binary, label: "DSA" }, { icon: Network, label: "System Design" }, { icon: BrainCircuit, label: "ML Design" }, { icon: ServerCog, label: "Backend Engineering" }];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner page-width">
          <div className="hero-copy">
            <div className="eyebrow"><Code2 size={13} />{siteConfig.tagline}</div>
            <h1>Everything you need to prepare for your next engineering interview.</h1>
            <p>Structured preparation for DSA, System Design, ML Design, and behavioral interviews—plus mock interviews, company guides, referrals, and a community that practices together.</p>
            <div className="hero-actions"><Link className="button button-lg" href="/dsa">Start Preparing <ArrowRight size={16} /></Link><TrackedLink className="button button-secondary button-lg" href={siteConfig.discordUrl} event="discord_clicked" properties={{ placement: "homepage_hero" }}>Join Discord</TrackedLink></div>
            <div className="community-proof"><span className="proof-mark"><Users size={15} /></span><span><strong>1,000+ community members</strong><small>Preparing, practicing, and helping each other grow.</small></span></div>
          </div>

          <div className="product-preview" aria-label="Engineering Foundry interview path product preview">
            <div className="preview-chrome"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>ENGINEERING FOUNDRY / INTERVIEW PATH</span><span className="preview-live"><i /> Product preview</span></div>
            <div className="preview-layout">
              <aside className="preview-sidebar" aria-label="Preparation tracks"><span>TRACKS</span><b className="selected"><Binary size={14} /> DSA</b><b><Network size={14} /> System Design</b><b><BrainCircuit size={14} /> ML Design</b><b><MessagesSquare size={14} /> Behavioral</b></aside>
              <div className="preview-main"><div className="preview-heading"><span>INTERVIEW READINESS PATH</span><small>A repeatable loop—not a fake progress score.</small></div><ol className="interview-path">
                <li className="current"><span>01</span><div><strong>Learn</strong><small>Foundations and mental models</small></div><CheckCircle2 size={17} /></li>
                <li><span>02</span><div><strong>Practice</strong><small>Problems and design prompts</small></div></li>
                <li><span>03</span><div><strong>Get feedback</strong><small>Peer mocks and thoughtful review</small></div></li>
                <li><span>04</span><div><strong>Interview</strong><small>Communicate with clarity</small></div></li>
                <li><span>05</span><div><strong>Grow</strong><small>Reflect, contribute, and help others</small></div></li>
              </ol><div className="preview-note"><ShieldCheck size={15} /><span><strong>Public by default</strong> Browse preparation content without creating an account.</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section preparation-section"><div className="page-width"><SectionHeading eyebrow="Preparation areas" title="A complete preparation stack." description="Move from scattered tabs and generic advice to focused tracks that fit the way engineering interviews actually work." /><div className="feature-grid preparation-grid">{preparationAreas.map((area) => <FeatureCard key={area.title} {...area} />)}</div></div></section>

      <section className="section section-alt ecosystem-section"><div className="page-width"><SectionHeading eyebrow="The product ecosystem" title="More than another question bank." description="Engineering Foundry connects the full interview journey—from learning the material to getting feedback and growing your network." /><div className="ecosystem-grid">{ecosystem.map((stage, index) => <article className="ecosystem-stage" key={stage.title}><div className="ecosystem-index">{stage.step}</div><div><span className="stage-label">{stage.description}</span><h3>{stage.title}</h3><div className="stage-items">{stage.items.map((item) => <span key={item}>{item}</span>)}</div></div>{index < ecosystem.length - 1 && <ArrowRight className="ecosystem-arrow" size={17} aria-hidden="true" />}</article>)}</div></div></section>

      <section className="section"><div className="page-width"><SectionHeading eyebrow="Prepare by company" title="Understand the interview in context." description="Company guides bring sourced DSA associations, structured design practice, and careful boundaries around future community features into one view." action={<Link className="button button-ghost" href="/companies">Browse Company Guides <ArrowRight size={15} /></Link>} /><div className="home-company-grid">{companies.map((company, index) => <Link className="home-company-card" href={`/companies/${company.slug}`} key={company.slug}><span className="company-seal">{company.name.slice(0, 2).toUpperCase()}</span><span><strong>{company.name}</strong><small>Preparation · Experiences · Community</small></span><ArrowRight size={15} aria-hidden="true" /><i>{String(index + 1).padStart(2, "0")}</i></Link>)}</div></div></section>

      <section className="section section-alt"><div className="page-width"><div className="home-split home-mock"><div><div className="eyebrow"><Users size={13} />Mock interviews</div><h2>Practice the interview format before the real interview.</h2><p>Run a complete solo session or bring a peer you already have. Engineering Foundry provides original prompts, candidate and interviewer packets, timing, and session-only feedback.</p><div className="type-list" aria-label="Mock interview types">{interviewTypes.map((type) => <span key={type}><CheckCircle2 size={14} />{type}</span>)}</div><div className="hero-actions"><Link className="button" href="/mock-interviews">Open the Practice Lab <ArrowRight size={15} /></Link></div><p className="availability-note">No account or matchmaking service is required. Experienced interviewer matching is planned for a later phase.</p></div><div className="mock-console" aria-label="Mock interview practice kit preview"><div className="console-label"><span>PRACTICE KIT / PREVIEW</span><span>01 — 03</span></div><div className="match-row"><span>Track</span><strong>System Design</strong></div><div className="match-row"><span>Mode</span><strong>Solo or your own peer</strong></div><div className="match-row"><span>Practice focus</span><strong>Scoping + tradeoffs</strong></div><div className="match-state"><i /><span>Session kit ready — no matching needed</span></div></div></div></div></section>

      <section className="section"><div className="page-width"><div className="home-split referral-highlight"><div className="referral-visual"><div className="referral-flow">{["Choose exact role", "Add relevant context", "Copy request", "Share appropriately"].map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong>{index < 3 && <ArrowRight size={15} />}</div>)}</div><p><ShieldCheck size={15} /> The public tools save and send nothing. A referral is never guaranteed, and recipients decide independently under employer policies.</p></div><div><div className="eyebrow"><GitPullRequestArrow size={13} />Referral preparation</div><h2>Build a referral request worth reviewing.</h2><p>Turn exact role details and truthful evidence into a concise packet you can share yourself. Potential referrers can also create a local availability card and use neutral review guidance.</p><div className="hero-actions"><Link className="button" href="/referrals?mode=request">Build a request</Link><Link className="button button-secondary" href="/referrals?mode=referrer">Open Referrer toolkit</Link></div></div></div></div></section>

      <section className="section section-dark"><div className="page-width"><SectionHeading eyebrow="Engineering Foundry Challenges" title="Practice engineering judgment, not just answers." description="Future challenges will create room to compare approaches, receive feedback, and earn community recognition across four technical tracks." action={<Link className="button button-inverse" href="/challenges">View Challenges <ArrowRight size={15} /></Link>} /><div className="challenge-track-grid">{challengeTracks.map(({ icon: Icon, label }, index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><Icon size={21} /><h3>{label}</h3><p>Structured scenario · community review · coming later</p></article>)}</div></div></section>

      <section className="section community-section"><div className="page-width"><div className="community-panel"><div><div className="eyebrow"><Users size={13} />1,000+ community members</div><h2>Don&apos;t prepare alone.</h2><p>Join engineers discussing interviews, finding study and mock partners, sharing technical context, reviewing each other&apos;s thinking, and building a more useful preparation community.</p><div className="community-topics"><span>Interview discussions</span><span>Study partners</span><span>Mock partners</span><span>Technical conversations</span><span>Referrals</span><span>Peer feedback</span></div><div className="hero-actions"><TrackedLink className="button" href={siteConfig.discordUrl} event="discord_clicked" properties={{ placement: "homepage_community" }}>Join the Discord <ArrowRight size={15} /></TrackedLink><Link className="button button-secondary" href="/community">Explore Community</Link></div></div><div className="community-grid-visual" aria-hidden="true"><span className="node core">EF</span><span className="node n1">DSA</span><span className="node n2">SYSTEMS</span><span className="node n3">MOCKS</span><span className="node n4">CAREER</span><i className="line l1" /><i className="line l2" /><i className="line l3" /><i className="line l4" /></div></div></div></section>

      <section className="final-cta"><div className="page-width"><div className="eyebrow"><Trophy size={13} />Build readiness deliberately</div><h2>Your next interview starts before the interview.</h2><p>Choose a focused track, practice with intention, and grow alongside engineers who take the craft seriously.</p><div className="hero-actions"><Link className="button button-lg" href="/dsa">Start Preparing <ArrowRight size={16} /></Link><TrackedLink className="button button-secondary button-lg" href={siteConfig.discordUrl} event="discord_clicked" properties={{ placement: "homepage_final_cta" }}>Join Discord</TrackedLink></div></div></section>
    </>
  );
}
