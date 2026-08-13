import { PageHero } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "FAQ", description: "Frequently asked questions about Engineering Foundry.", path: "/faq" });
const faqs = [
  ["What is Engineering Foundry?", "A software-engineering interview preparation and professional community platform being built around structured learning, deliberate practice, and engineers helping engineers."],
  ["Is Engineering Foundry free?", "Public preparation content is intended to remain browsable without an account. Final pricing and any premium programs have not been decided."],
  ["Do I need an account?", "No account is needed to browse public educational content, use the Mock Interview Practice Lab, or use the referral request and referrer toolkits. Accounts may be needed for future saved progress, authenticated routing, submissions, challenges, profiles, and leaderboard participation."],
  ["How do mock interviews work?", "Choose DSA, System Design, ML System Design, or Behavioral; then run a structured solo session or use the candidate and interviewer packets with a peer you already have. Engineering Foundry does not currently match or schedule users."],
  ["How do referrals work?", "The current public tool helps you draft a referral request locally in your browser, then copy it to share through a channel you choose. Engineering Foundry does not currently match people, route requests, verify employment, or track decisions."],
  ["Does Engineering Foundry guarantee referrals?", "No. Engineering Foundry does not guarantee referrals, interviews, or employment outcomes."],
  ["How can I help as a Referrer?", "Use the public Referrer Toolkit to draft a local availability card, set review boundaries, follow a neutral checklist, and copy response templates. It does not create a profile or enroll you in a service. Authenticated opt-in routing remains a possible future phase."],
  ["How can I contribute?", "Future contribution paths include resources, interview experiences, feedback, challenges, mentorship, and review."],
  ["How do I join the Discord?", "Use any Join Discord button on the site. The destination is centrally configured so it can be updated before launch."],
] as const;
export default function FaqPage() { return <><PageHero eyebrow="FAQ" title="A few useful answers." description="What the product is, what it will support, and where the current foundation stops." /><section className="section"><div className="page-width"><div className="faq-list">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section></>; }
