import { PageHero } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Terms",
  description: "Draft Engineering Foundry terms requiring qualified legal review before public deployment.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Use" description="Draft product terms that state the current service boundaries and still require legal review." />
      <section className="section">
        <div className="page-width legal-copy">
          <p className="notice"><strong>Legal review required:</strong> These terms are non-final and must be reviewed by qualified counsel before public deployment.</p>
          <h2>Platform purpose</h2>
          <p>Engineering Foundry provides interview-preparation tools and community pathways. Content is informational and does not guarantee interview or employment outcomes.</p>
          <h2>Community conduct</h2>
          <p>Participants should act honestly, respectfully, and lawfully. Do not share proprietary interview content, confidential employer information, credentials, personal data without permission, harassment, impersonation, or misleading claims.</p>
          <h2>Referrals</h2>
          <p>Referrers independently decide whether to submit a referral. Engineering Foundry does not guarantee referrals, interviews, or employment outcomes. Participants must comply with applicable employer referral and conflict-of-interest policies.</p>
          <h2>Content and external links</h2>
          <p>External resources are provided for preparation convenience and do not imply affiliation or endorsement. Browser-only drafts remain under the user&apos;s control and are not submitted by the current public tools.</p>
          <h2>Service changes</h2>
          <p>Features may change as the product develops. Limitation-of-liability, dispute, governing-law, takedown, moderation, and termination terms remain to be completed through qualified legal review.</p>
        </div>
      </section>
    </>
  );
}
