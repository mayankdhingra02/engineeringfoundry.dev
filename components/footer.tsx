import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerGroups, siteConfig } from "@/config/site";
import { TrackedLink } from "./tracked-action";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main page-width">
        <div className="footer-brand"><Logo /><p>{siteConfig.tagline}</p><p className="muted">A community-built home for the engineering interview journey.</p></div>
        <div className="footer-links">{footerGroups.map((group) => <div key={group.title}><h3>{group.title}</h3>{group.links.map(([label, href]) => label === "Discord" ? <TrackedLink className="" event="discord_clicked" properties={{ placement: "footer" }} key={href} href={href}>{label}</TrackedLink> : href.startsWith("/") ? <Link key={href} href={href}>{label}</Link> : <a key={href} href={href}>{label}</a>)}</div>)}</div>
      </div>
      <div className="footer-base page-width"><span>© {new Date().getFullYear()} Engineering Foundry</span><span>Built for engineers, with engineers.</span><a href="mailto:hello@engineeringfoundry.dev">hello@engineeringfoundry.dev <ArrowUpRight size={13} /></a></div>
    </footer>
  );
}
