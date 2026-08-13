import { Bug, ExternalLink, Mail, MessagesSquare } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-action";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description: "Reach Engineering Foundry through its working community and website-support channels.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Choose a working channel."
        description="Engineering Foundry does not collect contact-form submissions. Use the community for discussion or GitHub Issues for website and content reports."
      />
      <section className="section">
        <div className="page-width">
          <SectionHeading
            eyebrow="Contact pathways"
            title="Reach the right place directly."
            description="These links open the actual destination. No message is stored or sent by this website."
          />
          <div className="contact-channel-grid">
            <article className="contact-channel-card">
              <span className="icon-well"><MessagesSquare size={21} aria-hidden="true" /></span>
              <h2>Community discussion</h2>
              <p>Ask general questions, compare preparation approaches, and connect with the existing Discord community.</p>
              <TrackedLink href={siteConfig.discordUrl} event="contact_channel_clicked" properties={{ channel: "discord", placement: "contact_page" }} target="_blank">
                Open Discord <ExternalLink size={15} aria-hidden="true" />
              </TrackedLink>
            </article>
            <article className="contact-channel-card">
              <span className="icon-well"><Bug size={21} aria-hidden="true" /></span>
              <h2>Website or content issue</h2>
              <p>Report broken links, content problems, accessibility issues, or reproducible website bugs in the public repository.</p>
              <TrackedLink href={siteConfig.githubIssuesUrl} event="contact_channel_clicked" properties={{ channel: "github_issues", placement: "contact_page" }} target="_blank">
                Open GitHub Issues <ExternalLink size={15} aria-hidden="true" />
              </TrackedLink>
            </article>
            {siteConfig.contactEmail && (
              <article className="contact-channel-card">
                <span className="icon-well"><Mail size={21} aria-hidden="true" /></span>
                <h2>Email</h2>
                <p>Use the configured mailbox for matters that are not appropriate for a public issue or community channel.</p>
                <TrackedLink href={`mailto:${siteConfig.contactEmail}`} event="contact_channel_clicked" properties={{ channel: "email", placement: "contact_page" }}>
                  Email Engineering Foundry
                </TrackedLink>
              </article>
            )}
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="page-width contact-boundary">
          <h2>Keep public reports safe.</h2>
          <p>Do not include passwords, access tokens, private interview content, personal data, or confidential employer information in Discord or GitHub Issues.</p>
        </div>
      </section>
    </>
  );
}
