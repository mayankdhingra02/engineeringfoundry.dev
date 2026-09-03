import { ExternalLink, MessageSquareWarning } from "lucide-react";
import { PageHero } from "@/components/page-shell";
import { siteConfig } from "@/config/site";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { isSupabaseConfigured } from "@/lib/account-platform";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "Feedback", description: "Find the available channel for a bug report, suggestion, source correction, accessibility concern, or privacy and safety report.", path: "/feedback" });

export default function FeedbackPage() {
  const feedbackAvailable = isSupabaseConfigured();

  return <><PageHero eyebrow="Feedback" title="Help us improve Engineering Foundry." description={feedbackAvailable ? "Send a private report about a bug, source, accessibility, privacy, or safety concern. You do not need an account, and feedback is never published." : "Private feedback intake is unavailable in this configuration. Public-safe website and content reports can still be shared through GitHub Issues."} />
    <section className="section"><div className="page-width feedback-layout"><aside className="feedback-expectations"><MessageSquareWarning size={22} aria-hidden="true" /><h2>{feedbackAvailable ? "What to expect" : "Before using a public channel"}</h2>{feedbackAvailable ? <ul><li>Use this for website and preparation-content feedback.</li><li>Do not include credentials, confidential interview material, or private workspace text.</li><li>Successful submissions receive a private support reference, not a public ticket.</li></ul> : <ul><li>Use GitHub Issues only for information that is safe to share publicly.</li><li>Remove credentials, personal data, confidential employer information, and private interview material.</li><li>Private reports cannot be accepted until the feedback service is configured.</li></ul>}</aside><div>{feedbackAvailable ? <FeedbackForm /> : <section className="empty-state feedback-unavailable" aria-labelledby="feedback-unavailable-title"><MessageSquareWarning size={24} aria-hidden="true" /><h2 id="feedback-unavailable-title">Private feedback is unavailable in this configuration.</h2><p>GitHub Issues are public. Do not include passwords, access tokens, personal data, confidential employer information, or private interview material.</p><a className="button button-secondary" href={siteConfig.githubIssuesUrl} target="_blank" rel="noopener noreferrer">Open GitHub Issues <ExternalLink size={15} aria-hidden="true" /></a></section>}</div></div></section>
  </>;
}
