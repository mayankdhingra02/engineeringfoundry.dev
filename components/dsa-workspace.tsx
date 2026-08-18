import Link from "next/link";
import { ArrowRight, BookOpen, Braces, CalendarRange, ListChecks, Route } from "lucide-react";
import { DSAWorkspaceSidebar } from "@/components/dsa-workspace-sidebar";
import { dsaRoadmapLevels } from "@/data/dsa/level-roadmaps";

export function DSAWorkspaceHeader() {
  return <header className="dsa-workspace-header"><div><h1>DSA interview preparation</h1><p>Practice interview questions now, or choose a role roadmap when you need a sequence.</p></div><div className="dsa-workspace-actions"><Link className="button" href="/dsa/questions"><ListChecks size={15} />Find a question</Link><Link className="button button-secondary" href="/dsa/roadmap"><Route size={15} />Choose a roadmap</Link></div></header>;
}

export function DSAWorkspacePageLayout({ eyebrow, title, description, badge, meta, children }: { eyebrow?: string; title: string; description: string; badge?: string; meta?: string; children: React.ReactNode }) {
  return <div className="dsa-workspace-layout"><DSAWorkspaceSidebar /><div className="dsa-workspace-main dsa-database-main"><header className="dsa-database-header"><div>{eyebrow && <span>{eyebrow}</span>}<div><h1>{title}</h1>{badge && <small>{badge}</small>}</div><p>{description}</p>{meta && <strong>{meta}</strong>}</div></header>{children}</div></div>;
}

export function RoadmapPreview() {
  const signals = {
    sde1: "Patterns · correct implementation · complexity",
    sde2: "Breadth · optimization · changing constraints",
    sde3plus: "Invariants · APIs · failure and scale",
  } as const;
  return <section className="dsa-workspace-section dsa-roadmap-preview" aria-labelledby="roadmap-preview-title">
    <div className="dsa-workspace-section-heading"><div><h2 id="roadmap-preview-title">Choose a roadmap for your level</h2><p>Seniority changes the expected reasoning depth. Choose the role first; then set the time you have available.</p></div><Link href="/dsa/roadmap">Open roadmap planner <ArrowRight size={14} /></Link></div>
    <div className="dsa-roadmap-role-options" aria-label="Role roadmap choices">{dsaRoadmapLevels.map((option) => <Link href={`/dsa/roadmap?level=${option.level}`} key={option.level}><span>{option.shortTitle}</span><strong>{option.subtitle}</strong><small>{signals[option.level]}</small><ArrowRight size={14} aria-hidden="true" /></Link>)}</div>
    <div className="dsa-roadmap-time-step"><CalendarRange size={17} aria-hidden="true" /><div><strong>Then choose your pace</strong><span>30 days for focus · 60 for balance · 90 for broader coverage and repetition</span></div><Link href="/dsa/study-plans">Compare study plans <ArrowRight size={13} /></Link></div>
  </section>;
}

export function ReviewPreview() {
  const resources = [
    { href: "/dsa/languages", label: "Language reference", description: "Interview syntax, collections, and templates", icon: Braces },
    { href: "/dsa/patterns", label: "Pattern index", description: "Recognition signals and reusable solution shapes", icon: BookOpen },
    { href: "/dsa/strategy", label: "Interview strategy", description: "Clarify, communicate, test, and recover", icon: Route },
  ] as const;
  return <section className="dsa-workspace-section dsa-review-preview" aria-labelledby="review-preview-title">
    <div className="dsa-workspace-section-heading"><div><h2 id="review-preview-title">Review when you find a gap</h2><p>Refresh only the concept or implementation detail blocking your next practice attempt.</p></div></div>
    <nav aria-label="DSA review resources">{resources.map(({ href, label, description, icon: Icon }) => <Link href={href} key={href}><Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><ArrowRight size={14} aria-hidden="true" /></Link>)}</nav>
  </section>;
}
