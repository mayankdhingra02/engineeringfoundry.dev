import { Suspense } from "react";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { ResourceDirectory } from "@/features/resources/resource-directory";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Engineering Interview Resource Directory",
  description: "A curated directory of attributable DSA, System Design, ML, behavioral, interview strategy, and engineering resources.",
  path: "/resources",
  image: "/og-interview-prep.png",
  imageAlt: "Engineering Foundry behavioral practice, interview playbook, and verified resources",
  imageWidth: 1659,
  imageHeight: 948,
});

export default function ResourcesPage() {
  return <>
    <PageHero eyebrow="Verified resource directory" title="Useful engineering resources, with their destination in plain sight." description="Browse a modest catalog of Engineering Foundry preparation products and checked public resources. Verification means the destination was reviewed—not that a provider endorses this directory.">
      <a className="button" href="#directory">Browse 20 resources</a>
      <a className="button button-secondary" href="#verification">How verification works</a>
    </PageHero>
    <section className="section" id="directory"><div className="page-width"><SectionHeading eyebrow="Curated catalog" title="Filter by the work you need to do next." description="Every summary is written by Engineering Foundry. External links go directly to the named provider with no affiliate or redirect parameters." /><Suspense fallback={<div className="page-loading" role="status" aria-live="polite"><span className="sr-only">Loading resource directory…</span></div>}><ResourceDirectory /></Suspense></div></section>
    <section className="section section-alt" id="verification"><div className="page-width resource-integrity"><SectionHeading eyebrow="Directory integrity" title="Checked links, visible providers, no popularity theater." description="The catalog does not rank resources by stars, student counts, or invented recommendation scores." /><div><article><strong>Verified</strong><p>The destination and its public purpose were checked on the displayed date. This is not an endorsement or partnership claim.</p></article><article><strong>Needs review</strong><p>The entry may remain useful, but its destination or description needs another content review before being presented as checked.</p></article><article><strong>Access labels</strong><p>Free, paid, and freemium labels describe known public access at review time and may change at the provider.</p></article></div></div></section>
  </>;
}
