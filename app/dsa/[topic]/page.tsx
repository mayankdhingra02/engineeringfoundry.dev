import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHero, EmptyState } from "@/components/page-shell";
import { dsaTopics } from "@/data/fixtures/questions";

export function generateStaticParams() { return dsaTopics.slice(1).map((topic) => ({ topic: topic.toLowerCase().replaceAll(" ", "-") })); }
export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> { const { topic } = await params; const title = topic.split("-").map((word) => word[0]?.toUpperCase()+word.slice(1)).join(" "); return { title: `${title} DSA`, description: `${title} interview preparation roadmap.` }; }
export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) { const { topic } = await params; const title = dsaTopics.slice(1).find((item) => item.toLowerCase().replaceAll(" ", "-") === topic); if (!title) notFound(); return <><PageHero eyebrow="DSA topic" title={title} description={`A focused ${title.toLowerCase()} preparation page ready for concepts, patterns, and practice questions.`}><Link className="button button-secondary" href="/dsa"><ArrowLeft size={15} /> Back to DSA</Link></PageHero><section className="section"><div className="page-width"><EmptyState title={`${title} content is intentionally deferred`} description="The SEO-ready route and content shell are in place for the educational content phase." /></div></section></>; }
