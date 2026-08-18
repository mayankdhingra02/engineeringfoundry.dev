import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Construction, CircleDot } from "lucide-react";

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <section className="page-hero"><div className="page-width"><div className="eyebrow"><CircleDot size={12} />{eyebrow}</div><h1>{title}</h1><p>{description}</p>{children && <div className="hero-actions">{children}</div>}</div></section>;
}

export function SectionHeading({ eyebrow, title, description, action, level = 2 }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return <div className="section-heading"><div>{eyebrow && <span className="section-kicker">{eyebrow}</span>}<Heading>{title}</Heading>{description && <p>{description}</p>}</div>{action}</div>;
}

export function FeatureCard({ icon: Icon, label, title, description, href, cta = "Explore" }: { icon: LucideIcon; label?: string; title: string; description: string; href?: string; cta?: string }) {
  const content = <><div className="feature-card-top"><span className="icon-well"><Icon size={21} /></span>{label && <span className="demo-label">{label}</span>}</div><h3>{title}</h3><p>{description}</p>{href && <span className="card-link">{cta}<ArrowRight size={15} /></span>}</>;
  return href ? <Link className="feature-card" href={href}>{content}</Link> : <article className="feature-card">{content}</article>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><Construction size={22} /><strong>{title}</strong><p>{description}</p></div>;
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "accent" }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
