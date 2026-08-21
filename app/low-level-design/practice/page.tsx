import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { lowLevelDesignPractice } from "@/data/low-level-design";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Low-Level Design Practice Library", description: "Practice six original object and component design interviews with progressive hints, follow-ups, error cases, and example approaches.", path: "/low-level-design/practice" });
export default function LowLevelDesignPracticeLibraryPage() { return <section className="lld-library page-width"><nav className="lld-breadcrumbs" aria-label="Breadcrumb"><Link href="/low-level-design">Low-Level Design</Link><span>/ Practice</span></nav><header><h1>Practice design judgment under constraints.</h1><p>Start with one prompt, write or sketch a first approach, then reveal only the guidance you need. These are original exercises, not company question banks.</p></header><div>{lowLevelDesignPractice.map((problem) => <Link href={`/low-level-design/practice/${problem.slug}`} key={problem.id}><span>Original practice design</span><h2>{problem.title}</h2><p>{problem.summary}</p><small>{problem.levels.join(" / ")} · {problem.reasoningAreas.slice(0, 3).join(" · ")}</small><b>Open exercise <ArrowRight size={15} /></b></Link>)}</div></section>; }
