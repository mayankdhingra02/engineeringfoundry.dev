import { PageHero } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "FAQ", description: "Frequently asked questions about Engineering Foundry.", path: "/faq" });
const faqs = [
  ["What is Engineering Foundry?", "A software-engineering interview preparation and professional community platform being built around structured learning, deliberate practice, and engineers helping engineers."],
  ["Is Engineering Foundry free?", "Public preparation content is intended to remain browsable without an account. Final pricing and any premium programs have not been decided."],
  ["Do I need an account?", "Not to browse public educational content. Accounts will be needed for saved progress, mock interviews, referrals, submissions, challenges, profiles, and leaderboard participation."],
  ["How do mock interviews work?", "The planned flow matches peers by interview type, experience level, and availability, then supports scheduling and structured feedback."],
  ["How do referrals work?", "Job seekers can share a role and relevant context. Volunteer Referrers independently decide whether to accept, decline, or request more information."],
  ["Does Engineering Foundry guarantee referrals?", "No. Engineering Foundry does not guarantee referrals, interviews, or employment outcomes."],
  ["How can I become a Referrer?", "The planned Referrer profile lets employees share their company, role, availability, job families, and optional bio after verification controls are implemented."],
  ["How can I contribute?", "Future contribution paths include resources, interview experiences, feedback, challenges, mentorship, and review."],
  ["How do I join the Discord?", "Use any Join Discord button on the site. The destination is centrally configured so it can be updated before launch."],
] as const;
export default function FaqPage() { return <><PageHero eyebrow="FAQ" title="A few useful answers." description="What the product is, what it will support, and where the current foundation stops." /><section className="section"><div className="page-width"><div className="faq-list">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section></>; }
