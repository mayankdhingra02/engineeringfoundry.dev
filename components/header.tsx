"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { GlobalSearch } from "./global-search";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type NavItem = { readonly label: string; readonly href: string };

const navDescriptions: Record<string, string> = {
  DSA: "Coding patterns and company-focused practice",
  "System Design": "Architecture concepts and design prompts",
  "ML Design": "Applied ML and AI system design",
  Behavioral: "Stories, leadership, and communication",
  "Interview Tips": "Practical guidance for interview day",
  "Interview Experiences": "Community-shared process context",
  Resources: "Curated preparation material",
  Challenges: "Weekly engineering practice",
  Leaderboard: "Contribution and challenge recognition",
  About: "The mission behind the Foundry",
  FAQ: "Answers about the platform",
  Contact: "Feedback, partnerships, and support",
};

function NavDropdown({ label, items, pathname, open, onToggle, onClose }: { label: string; items: readonly NavItem[]; pathname: string; open: boolean; onToggle: () => void; onClose: () => void }) {
  const active = items.some((item) => pathname.startsWith(item.href));
  const menuId = `${label.toLowerCase()}-navigation`;

  return (
    <div className="nav-dropdown" role="group" aria-label={`${label} menu`}>
      <button className={cn("nav-link", active && "active", open && "open")} aria-expanded={open} aria-controls={menuId} onClick={onToggle}>
        {label}<ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && <div className="nav-panel" id={menuId}>{items.map((item) => <Link href={item.href} key={item.href} onClick={onClose} aria-current={pathname === item.href ? "page" : undefined}><span>{item.label}</span><small>{navDescriptions[item.label]}</small></Link>)}</div>}
    </div>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"prepare" | "explore" | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (openMenu && !headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="nav-shell">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavDropdown label="Prepare" items={siteConfig.prepareNav} pathname={pathname} open={openMenu === "prepare"} onToggle={() => setOpenMenu(openMenu === "prepare" ? null : "prepare")} onClose={() => setOpenMenu(null)} />
          {siteConfig.primaryNav.map((item) => <Link className={cn("nav-link", pathname.startsWith(item.href) && "active")} aria-current={pathname === item.href ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}
          <NavDropdown label="Explore" items={siteConfig.exploreNav} pathname={pathname} open={openMenu === "explore"} onToggle={() => setOpenMenu(openMenu === "explore" ? null : "explore")} onClose={() => setOpenMenu(null)} />
        </nav>
        <div className="nav-actions">
          <GlobalSearch />
          <ThemeToggle />
          <a className="text-link discord-nav" href={siteConfig.discordUrl} onClick={() => track("discord_clicked", { placement: "header" })}>Discord</a>
          <Link className="text-link sign-in" href="/sign-in">Sign in</Link>
          <Link className="button button-sm" href="/dsa">Get started</Link>
          <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileOpen && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-search"><GlobalSearch triggerClass="mobile-search-trigger" /></div>
        <div className="mobile-nav-group"><span>Prepare</span>{siteConfig.prepareNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile}>{item.label}</Link>)}</div>
        <div className="mobile-nav-group"><span>Practice & career</span>{siteConfig.primaryNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile}>{item.label}</Link>)}</div>
        <div className="mobile-nav-group"><span>Explore</span>{siteConfig.exploreNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile}>{item.label}</Link>)}</div>
        <div className="mobile-actions"><a className="button button-secondary" href={siteConfig.discordUrl} onClick={() => track("discord_clicked", { placement: "mobile_header" })}>Join Discord</a><Link className="button" href="/dsa" onClick={closeMobile}>Start preparing</Link></div>
      </nav>}
    </header>
  );
}
