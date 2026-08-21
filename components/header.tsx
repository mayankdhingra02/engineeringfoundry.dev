"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { GlobalSearch } from "./global-search";
import { SearchLauncher } from "./search-launcher";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { AccountControl } from "./account-control";

type NavItem = { readonly label: string; readonly href: string };

const navDescriptions: Record<string, string> = {
  DSA: "Coding patterns and company-focused practice",
  "System Design": "Architecture concepts and design prompts",
  "Low-Level Design": "Object design, interfaces, state, and practice",
  "ML Design": "Applied ML and AI system design",
  Behavioral: "Stories, leadership, and communication",
  "Interview Execution Guide": "Clarification, communication, recovery, validation, and interview-day guidance",
  "Mock Interviews": "Structured solo or bring-your-own-peer practice",
  Referrals: "Private request builder and referrer toolkit",
  Companies: "Neutral, provenance-aware preparation guides",
  Community: "Public pathways and Discord community",
  "Interview Experiences": "Private, privacy-conscious write-up builder",
  "Salary Negotiation": "Ethical offer and compensation guidance",
  Resources: "Curated preparation material",
  Challenges: "Self-guided engineering scenarios",
  Recognition: "Honest recognition preview",
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
  const [openMenu, setOpenMenu] = useState<"practice" | "career" | "more" | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const closeMobile = () => setMobileOpen(false);
  const prepareActive = pathname === "/prepare" || siteConfig.prepareNav.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        if (openMenu) setOpenMenu(null);
        if (mobileOpen) setMobileOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || document.querySelector('.search-dialog[role="dialog"]')) return;
      setOpenMenu(null);
      if (mobileOpen) {
        setMobileOpen(false);
        window.requestAnimationFrame(() => mobileTriggerRef.current?.focus());
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, openMenu]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="nav-shell">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link className={cn("nav-link", prepareActive && "active")} href="/prepare" aria-current={pathname === "/prepare" ? "page" : prepareActive ? "location" : undefined}>Prepare</Link>
          <NavDropdown label="Practice" items={siteConfig.practiceNav} pathname={pathname} open={openMenu === "practice"} onToggle={() => setOpenMenu(openMenu === "practice" ? null : "practice")} onClose={() => setOpenMenu(null)} />
          <NavDropdown label="Career & community" items={siteConfig.careerCommunityNav} pathname={pathname} open={openMenu === "career"} onToggle={() => setOpenMenu(openMenu === "career" ? null : "career")} onClose={() => setOpenMenu(null)} />
          <NavDropdown label="More" items={siteConfig.moreNav} pathname={pathname} open={openMenu === "more"} onToggle={() => setOpenMenu(openMenu === "more" ? null : "more")} onClose={() => setOpenMenu(null)} />
        </nav>
        <div className="nav-actions">
          <GlobalSearch />
          <ThemeToggle />
          <a className="text-link discord-nav" href={siteConfig.discordUrl} onClick={() => track("discord_clicked", { placement: "header" })}>Discord</a>
          <AccountControl />
          <button ref={mobileTriggerRef} className="icon-button mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileOpen && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-search"><SearchLauncher className="mobile-search-trigger" /></div>
        <div className="mobile-nav-group"><Link className="mobile-nav-heading" href="/prepare" onClick={closeMobile} aria-current={pathname === "/prepare" ? "page" : prepareActive ? "location" : undefined}>Prepare <ArrowRight size={13} aria-hidden="true" /></Link>{siteConfig.prepareNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}</div>
        <div className="mobile-nav-group"><span>Practice</span>{siteConfig.practiceNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}</div>
        <div className="mobile-nav-group"><span>Career / community</span>{siteConfig.careerCommunityNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}</div>
        <div className="mobile-nav-group"><span>More</span>{siteConfig.moreNav.map((item) => <Link href={item.href} key={item.href} onClick={closeMobile} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}</div>
        <div className="mobile-utilities"><ThemeToggle showLabel /></div>
        <div className="mobile-actions"><a className="button button-secondary" href={siteConfig.discordUrl} onClick={() => track("discord_clicked", { placement: "mobile_header" })}>Join Discord</a><Link className="button" href="/prepare" onClick={closeMobile}>Start preparing</Link></div>
        <AccountControl mobile onNavigate={closeMobile} />
      </nav>}
    </header>
  );
}
