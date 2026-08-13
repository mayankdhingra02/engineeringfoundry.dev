import Link from "next/link";
import { PageHero } from "@/components/page-shell";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Privacy",
  description: "How Engineering Foundry handles public-site, account, profile, and analytics data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy" description="A plain-language description of the current public-site and deferred account data boundaries." />
      <section className="section">
        <div className="page-width legal-copy">
          <p className="notice"><strong>Draft notice:</strong> This policy requires owner and qualified legal review before public deployment.</p>
          <h2>Public tools</h2>
          <p>The Mock Interview Lab, Referral Toolkit, Challenge Lab, and Interview Experience Write-up Builder keep private drafts in browser memory only. Those drafts are not stored in local storage, sent to Supabase, or included in analytics, and refreshing the page clears them.</p>
          <h2>Accounts and profiles</h2>
          <p>Account features are disabled by default for the public content-first launch. If the account platform is explicitly enabled after hosted qualification, Supabase will provide authentication, session handling, and profile storage. Public profiles will show only fields a member deliberately makes public after completing onboarding.</p>
          <h2>Product analytics</h2>
          <p>Engineering Foundry may use PostHog for pageviews and fixed product events. Analytics remains inactive when its public environment key is absent. Free-text drafts, passwords, tokens, personal contact fields, and clipboard contents are not intentionally sent as event properties.</p>
          <h2>External channels</h2>
          <p>Discord, GitHub, and any configured email provider apply their own privacy practices when you choose to open those services. Do not post credentials, confidential interview material, or sensitive personal information in a public channel.</p>
          <h2>Your choices and future processes</h2>
          <p>Account deletion, exports, retention periods, analytics consent where required, and additional privacy controls still require a reviewed production process before account features can launch.</p>
          <h2>Contact</h2>
          <p>{siteConfig.contactEmail ? <>Privacy questions can be sent to <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.</> : <>No privacy mailbox is currently configured. Use the <Link href="/contact">working contact channels</Link>, and avoid including sensitive information in public reports.</>}</p>
        </div>
      </section>
    </>
  );
}
