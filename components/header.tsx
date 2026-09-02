"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useReducer, useRef, type Ref } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { closedHeaderNavigation, headerNavigationReducer, type DesktopMenuId } from "@/lib/header-navigation";
import { GlobalSearch, globalSearchOpenEvent } from "./global-search";
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
  "Interview Experiences": "Reviewed reports and private local reflection",
  "Salary Negotiation": "Ethical offer and compensation guidance",
  Resources: "Curated preparation material",
  Challenges: "Self-guided engineering scenarios",
  Recognition: "Honest recognition preview",
  About: "The mission behind the Foundry",
  FAQ: "Answers about the platform",
  Contact: "Feedback, partnerships, and support",
};

function NavDropdown({ id, label, items, pathname, open, onToggle, onClose, triggerRef }: { id: DesktopMenuId; label: string; items: readonly NavItem[]; pathname: string; open: boolean; onToggle: () => void; onClose: () => void; triggerRef: Ref<HTMLButtonElement> }) {
  const active = items.some((item) => pathname.startsWith(item.href));
  const menuId = `${id}-navigation`;

  return (
    <div className="nav-dropdown" role="group" aria-label={`${label} menu`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onClose(); }}>
      <button ref={triggerRef} type="button" className={cn("nav-link", active && "active", open && "open")} aria-expanded={open} aria-controls={menuId} onClick={onToggle}>
        {label}<ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && <div className="nav-panel" id={menuId}>{items.map((item) => <Link href={item.href} key={item.href} onClick={onClose} aria-current={pathname === item.href ? "page" : undefined}><span>{item.label}</span><small>{navDescriptions[item.label]}</small></Link>)}</div>}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  return <HeaderNavigation key={pathname} pathname={pathname} />;
}

function HeaderNavigation({ pathname }: { pathname: string }) {
  const headerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopTriggerRefs = useRef<Record<DesktopMenuId, HTMLButtonElement | null>>({ practice: null, career: null, more: null });
  const [storedNavigation, dispatchNavigation] = useReducer(headerNavigationReducer, pathname, closedHeaderNavigation);
  const { openMenu, mobileOpen } = storedNavigation;
  const closeMobile = () => dispatchNavigation({ type: "close-mobile", pathname });
  const prepareActive = pathname === "/prepare" || siteConfig.prepareNav.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target as Node;
      const openDropdown = openMenu ? desktopTriggerRefs.current[openMenu]?.closest(".nav-dropdown") : null;
      if (openMenu && !openDropdown?.contains(target)) dispatchNavigation({ type: "close-desktop", pathname });
      if (mobileOpen && !headerRef.current?.contains(target)) dispatchNavigation({ type: "close-mobile", pathname });
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || document.querySelector('.search-dialog[role="dialog"]')) return;
      const desktopTrigger = openMenu ? desktopTriggerRefs.current[openMenu] : null;
      if (!desktopTrigger && !mobileOpen) return;
      event.preventDefault();
      dispatchNavigation({ type: "close-all", pathname });
      if (mobileOpen) {
        window.requestAnimationFrame(() => mobileTriggerRef.current?.focus());
      } else {
        window.requestAnimationFrame(() => desktopTrigger?.focus());
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, openMenu, pathname]);

  useEffect(() => {
    function closeNavigationForSearch() {
      if (openMenu || mobileOpen) dispatchNavigation({ type: "close-all", pathname });
    }
    window.addEventListener(globalSearchOpenEvent, closeNavigationForSearch);
    return () => window.removeEventListener(globalSearchOpenEvent, closeNavigationForSearch);
  }, [mobileOpen, openMenu, pathname]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="nav-shell">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link className={cn("nav-link", prepareActive && "active")} href="/prepare" aria-current={pathname === "/prepare" ? "page" : prepareActive ? "location" : undefined}>Prepare</Link>
          <NavDropdown id="practice" label="Practice" items={siteConfig.practiceNav} pathname={pathname} open={openMenu === "practice"} onToggle={() => dispatchNavigation({ type: "toggle-desktop", menu: "practice", pathname })} onClose={() => dispatchNavigation({ type: "close-desktop", pathname })} triggerRef={(node) => { desktopTriggerRefs.current.practice = node; }} />
          <NavDropdown id="career" label="Career & community" items={siteConfig.careerCommunityNav} pathname={pathname} open={openMenu === "career"} onToggle={() => dispatchNavigation({ type: "toggle-desktop", menu: "career", pathname })} onClose={() => dispatchNavigation({ type: "close-desktop", pathname })} triggerRef={(node) => { desktopTriggerRefs.current.career = node; }} />
          <NavDropdown id="more" label="More" items={siteConfig.moreNav} pathname={pathname} open={openMenu === "more"} onToggle={() => dispatchNavigation({ type: "toggle-desktop", menu: "more", pathname })} onClose={() => dispatchNavigation({ type: "close-desktop", pathname })} triggerRef={(node) => { desktopTriggerRefs.current.more = node; }} />
        </nav>
        <div className="nav-actions">
          <GlobalSearch />
          <ThemeToggle />
          <a className="text-link discord-nav" href={siteConfig.discordUrl} onClick={() => track("discord_clicked", { placement: "header" })}>Discord</a>
          <AccountControl />
          <button id="mobile-navigation-trigger" ref={mobileTriggerRef} type="button" className="icon-button mobile-menu-button" onClick={() => dispatchNavigation({ type: "toggle-mobile", pathname })} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileOpen && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-search"><SearchLauncher className="mobile-search-trigger" fallbackFocusId="mobile-navigation-trigger" /></div>
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
