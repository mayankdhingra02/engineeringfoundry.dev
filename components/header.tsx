"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { GlobalSearch } from "./global-search";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {siteConfig.nav.map((item) => <Link className={cn("nav-link", pathname.startsWith(item.href) && "active")} href={item.href} key={item.href}>{item.label}</Link>)}
          <div className="more-menu"><button className="nav-link">More <ChevronDown size={14} /></button><div className="more-panel">{siteConfig.moreNav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</div></div>
        </nav>
        <div className="nav-actions">
          <GlobalSearch />
          <ThemeToggle />
          <a className="text-link discord-nav" href={siteConfig.discordUrl} onClick={() => track("discord_clicked", { placement: "header" })}>Join Discord</a>
          <Link className="text-link sign-in" href="/sign-in">Sign in</Link>
          <Link className="button button-sm" href="/dashboard">Get started</Link>
          <button className="icon-button mobile-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Toggle menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">{[...siteConfig.nav, ...siteConfig.moreNav].map((item) => <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}<div className="mobile-actions"><a className="button button-secondary" href={siteConfig.discordUrl}>Join Discord</a><Link className="button" href="/dashboard">Get started</Link></div></nav>}
    </header>
  );
}
