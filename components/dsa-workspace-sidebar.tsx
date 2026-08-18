"use client";

import Link from "next/link";
import { BookOpen, Braces, Building2, CalendarRange, Compass, ListChecks, Map, Menu, Route, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useModalDrawer } from "@/hooks/use-modal-drawer";
import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Practice", href: "/dsa/questions", icon: ListChecks,
    description: "Find interview questions",
    match: (path: string) => path === "/dsa/questions" || path === "/dsa/practice" || path.startsWith("/dsa/companies") || path.startsWith("/dsa/company-questions"),
    children: [{ label: "Company questions", href: "/dsa/companies", icon: Building2, match: (path: string) => path.startsWith("/dsa/companies") || path.startsWith("/dsa/company-questions") }],
  },
  {
    label: "Roadmap", href: "/dsa/roadmap", icon: Route,
    description: "Choose role, then time",
    match: (path: string) => path.startsWith("/dsa/roadmap") || path === "/dsa/study-plans",
    children: [
      { label: "Study plans", href: "/dsa/study-plans", icon: CalendarRange, match: (path: string) => path === "/dsa/study-plans" },
      { label: "Topic map", href: "/dsa/roadmap/topic-map", icon: Map, match: (path: string) => path === "/dsa/roadmap/topic-map" },
    ],
  },
  {
    label: "Review", href: "/dsa/languages", icon: BookOpen,
    description: "Refresh concepts and syntax",
    match: (path: string) => path.startsWith("/dsa/languages") || path === "/dsa/patterns" || path.startsWith("/dsa/strategy") || path.startsWith("/dsa/interview-strategy") || path.startsWith("/dsa/start-here/") || /^\/dsa\/(arrays|strings|hash-maps|linked-lists|stacks-queues|trees|graphs|heaps|binary-search|dynamic-programming|sorting|backtracking|tries|intervals|greedy|bit-manipulation)$/.test(path),
    children: [
      { label: "Pattern index", href: "/dsa/patterns", icon: Braces, match: (path: string) => path === "/dsa/patterns" },
      { label: "Interview strategy", href: "/dsa/strategy", icon: Compass, match: (path: string) => path.startsWith("/dsa/strategy") || path.startsWith("/dsa/interview-strategy") },
    ],
  },
] as const;

function WorkspaceNavigation({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return <nav aria-label="Coding interview workspace"><ul>{navigation.map(({ label, href, icon: Icon, description, match, children }) => {
    const activeGroup = match(pathname);
    const primaryCurrent = pathname === href;
    return <li className={cn("dsa-workspace-nav-group", activeGroup && "active-group")} key={href}>
      <Link href={href} className={cn("dsa-workspace-primary-link", primaryCurrent && "active")} aria-current={primaryCurrent ? "page" : undefined} onClick={onNavigate}><Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span></Link>
      <ul>{children.map((child) => { const childCurrent = child.match(pathname); const ChildIcon = child.icon; return <li key={child.href}><Link href={child.href} className={cn(childCurrent && "active")} aria-current={childCurrent ? "page" : undefined} onClick={onNavigate}><ChildIcon size={14} aria-hidden="true" /><span>{child.label}</span></Link></li>; })}</ul>
    </li>;
  })}</ul></nav>;
}

export function DSAWorkspaceSidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useModalDrawer(drawerOpen, setDrawerOpen, triggerRef, drawerRef);

  return <>
    <aside className="dsa-workspace-sidebar" aria-label="Coding interview workspace navigation">
      <Link className="dsa-workspace-brand" href="/dsa" aria-current={pathname === "/dsa" ? "page" : undefined}><span><Braces size={16} />Coding Interviews</span><small>DSA workspace home</small></Link>
      <WorkspaceNavigation pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
      <p>Interview-focused practice, not a from-scratch algorithms course.</p>
    </aside>
    <button ref={triggerRef} type="button" className="dsa-workspace-trigger" aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Menu size={17} />DSA: Practice · Roadmap · Review</button>
    {drawerOpen && <div className="dsa-workspace-backdrop"><button type="button" className="dsa-workspace-dismiss" aria-label="Close coding interview navigation" onClick={() => setDrawerOpen(false)} /><aside ref={drawerRef} className="dsa-workspace-drawer" role="dialog" aria-modal="true" aria-label="Coding interview workspace navigation"><div className="dsa-workspace-drawer-heading"><span><Braces size={16} />Coding Interviews</span><button type="button" aria-label="Close coding interview navigation" onClick={() => setDrawerOpen(false)}><X size={18} /></button></div><WorkspaceNavigation pathname={pathname} onNavigate={() => setDrawerOpen(false)} /></aside></div>}
  </>;
}
