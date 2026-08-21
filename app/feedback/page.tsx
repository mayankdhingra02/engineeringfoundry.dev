import { MessageSquareWarning } from "lucide-react";
import { PageHero } from "@/components/page-shell";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Send feedback", description: "Send a private bug report, suggestion, source correction, accessibility concern, or privacy and safety report to Engineering Foundry.", path: "/feedback" });

export default function FeedbackPage() {
  return <><PageHero eyebrow="Feedback" title="Help us improve Engineering Foundry." description="Send a private report about a bug, source, accessibility, privacy, or safety concern. You do not need an account, and feedback is never published." />
    <section className="section"><div className="page-width feedback-layout"><aside className="feedback-expectations"><MessageSquareWarning size={22} aria-hidden="true" /><h2>What to expect</h2><ul><li>Use this for website and preparation-content feedback.</li><li>Do not include credentials, confidential interview material, or private workspace text.</li><li>Successful submissions receive a private support reference, not a public ticket.</li></ul></aside><div><FeedbackForm /></div></div></section>
  </>;
}
