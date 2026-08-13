import { PageHero, SectionHeading } from "@/components/page-shell";
import { ResourceDirectory } from "@/features/resources/resource-directory";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Interview Resources", description: "A searchable directory of engineering interview preparation resources.", path: "/resources" });
export default function ResourcesPage() { return <><PageHero eyebrow="Resource directory" title="Useful engineering resources, without the noise." description="Search and filter a small set of clearly marked demo entries. Community curation and a larger attributed catalog come later." /><section className="section"><div className="page-width"><SectionHeading eyebrow="Demo catalog" title="Start with the right kind of resource." description="Each entry supports category, type, access model, tags, and an external URL." /><ResourceDirectory /></div></section></>; }
