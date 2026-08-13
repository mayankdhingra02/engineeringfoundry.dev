import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DsaExplorer } from "@/features/dsa/dsa-explorer";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { dsaTopics } from "@/data/fixtures/questions";
import { createPageMetadata } from "@/lib/metadata";
import { AnalyticsEventOnMount } from "@/components/analytics-event";

export const metadata = createPageMetadata({ title: "DSA Interview Preparation", description: "Structured coding-interview roadmaps, topic filters, and demo practice questions.", path: "/dsa" });
export default function DsaPage() { return <><AnalyticsEventOnMount event="roadmap_viewed" properties={{ roadmap: "dsa" }} /><PageHero eyebrow="Data Structures & Algorithms" title="Practice patterns. Build durable instincts." description="Follow a topic roadmap, focus by difficulty or company, and turn question practice into trackable progress."><a className="button" href="#questions">Browse questions <ArrowRight size={16} /></a></PageHero>
  <section className="section section-compact"><div className="page-width"><SectionHeading eyebrow="Topic roadmap" title="A foundation-first sequence." description="Explore the topic architecture now. Guided lessons, checkpoints, and personal progress arrive with the content layer." /><div className="tag-list">{dsaTopics.slice(1).map((topic, index) => <Link className="tag" href={`/dsa/${topic.toLowerCase().replaceAll(" ", "-")}`} key={topic}>{String(index + 1).padStart(2,"0")} · {topic}</Link>)}</div></div></section>
  <section className="section section-alt" id="questions"><div className="page-width"><SectionHeading eyebrow="Demo question library" title="Filter the practice queue." description="Original placeholder titles only. External links point to public practice surfaces and can be replaced through data fixtures later." /><DsaExplorer /></div></section></>; }
