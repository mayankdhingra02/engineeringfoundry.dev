"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, ListChecks, Menu, NotebookPen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SystemDesignCurriculumNode } from "@/data/system-design/curriculum";
import { useModalDrawer } from "@/hooks/use-modal-drawer";
import { cn } from "@/lib/utils";

const storageKey = "ef-system-design-open-sections";

function lessonCount(node: SystemDesignCurriculumNode): number {
  if (node.type === "lesson") return 1;
  return (node.children ?? []).reduce((total, child) => total + lessonCount(child), 0);
}

function problemCatalogOpenIds(curriculum: readonly SystemDesignCurriculumNode[]) {
  const catalog = curriculum.find((node) => node.title === "System Design Problems");
  if (!catalog) return [];
  return [catalog.id];
}

function activeAncestorIds(nodes: readonly SystemDesignCurriculumNode[], pathname: string, trail: string[] = []): string[] {
  for (const node of nodes) {
    const nextTrail = node.type === "lesson" ? trail : [...trail, node.id];
    if (node.slug === pathname) return nextTrail;
    const found = activeAncestorIds(node.children ?? [], pathname, nextTrail);
    if (found.length) return found;
  }
  return [];
}

function CurriculumBranch({
  node,
  pathname,
  level,
  openIds,
  completedLessons,
  scope,
  onToggle,
  onNavigate,
}: {
  node: SystemDesignCurriculumNode;
  pathname: string;
  level: number;
  openIds: Set<string>;
  completedLessons: ReadonlySet<string>;
  scope: string;
  onToggle: (id: string) => void;
  onNavigate: () => void;
}) {
  if (node.type === "lesson" && node.slug) {
    const active = pathname === node.slug;
    const completed = completedLessons.has(node.slug);
    return <li className="sd-curriculum-lesson">
      <Link href={node.slug} aria-current={active ? "page" : undefined} className={cn(active && "active")} onClick={onNavigate}>
        <span>{node.navigationTitle ?? node.title}</span>
        {node.status === "coming-soon" && <small className="sd-curriculum-status">Soon</small>}
        {completed && <CheckCircle2 size={13} aria-label="Completed" />}
      </Link>
    </li>;
  }

  const open = openIds.has(node.id);
  const controlId = `sd-curriculum-${scope}-${node.id}`;
  const isProblemCatalog = node.title === "System Design Problems";
  return <li className={cn("sd-curriculum-group", level === 0 && "major")}>
    <button type="button" aria-expanded={open} aria-controls={controlId} onClick={() => onToggle(node.id)}>
      <ChevronRight size={14} aria-hidden="true" />
      <span>{node.title}{isProblemCatalog && <small>{lessonCount(node)} problems</small>}</span>
    </button>
    {open && <ul id={controlId}>{isProblemCatalog && <li className="sd-curriculum-lesson sd-curriculum-library-link"><Link href="/system-design/problems" aria-current={pathname === "/system-design/problems" ? "page" : undefined} className={cn(pathname === "/system-design/problems" && "active")} onClick={onNavigate}><span>Browse practice library</span></Link></li>}{node.children?.map((child) => <CurriculumBranch key={child.id} node={child} pathname={pathname} level={level + 1} openIds={openIds} completedLessons={completedLessons} scope={scope} onToggle={onToggle} onNavigate={onNavigate} />)}</ul>}
  </li>;
}

export function SystemDesignSidebar({ curriculum, completedLessonSlugs = [], accountPlatformAvailable }: { curriculum: SystemDesignCurriculumNode[]; completedLessonSlugs?: readonly string[]; accountPlatformAvailable: boolean }) {
  const pathname = usePathname();
  const activeWorkspace = pathname === "/system-design/plan" ? "plan" : pathname === "/system-design/practice" && accountPlatformAvailable ? "workspace" : pathname.startsWith("/system-design/problems") || pathname === "/system-design/practice" ? "practice" : "learn";
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const activeIds = useMemo(() => activeAncestorIds(curriculum, pathname), [curriculum, pathname]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([
    ...(pathname === "/system-design/plan" ? [] : activeIds.length ? activeIds : curriculum.slice(0, 2).map((item) => item.id)),
    ...(pathname === "/system-design/plan" ? [] : problemCatalogOpenIds(curriculum)),
  ]));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const completedLessons = useMemo(() => new Set(completedLessonSlugs), [completedLessonSlugs]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => setOpenIds((current) => {
      if (activeIds.every((id) => current.has(id))) return current;
      return new Set([...current, ...activeIds]);
    }));
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeIds]);

  useEffect(() => {
    let animationFrame = 0;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored) animationFrame = window.requestAnimationFrame(() => setOpenIds((current) => new Set([...current, ...JSON.parse(stored)])));
    } catch { /* Session storage may be unavailable in hardened browsers. */ }
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useModalDrawer(drawerOpen, setDrawerOpen, triggerRef, drawerRef);

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { window.sessionStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* Navigation remains functional without storage. */ }
      return next;
    });
  }

  function curriculumTree(scope: string) {
    return <ul className="sd-curriculum-tree">{curriculum.map((node) => <CurriculumBranch key={node.id} node={node} pathname={pathname} level={0} openIds={openIds} completedLessons={completedLessons} scope={scope} onToggle={toggle} onNavigate={() => setDrawerOpen(false)} />)}</ul>;
  }

  function workspaceNavigation(onNavigate: () => void) {
    const items = [
      { id: "learn", label: "Learn", href: "/system-design/start-here/introduction", icon: BookOpen },
      { id: "practice", label: "Practice", href: "/system-design/problems", icon: ListChecks },
      ...(accountPlatformAvailable ? [{ id: "workspace", label: "My Practice", href: "/system-design/practice", icon: NotebookPen }] : []),
      { id: "plan", label: "Plan", href: "/system-design/plan", icon: CalendarDays },
    ] as const;
    return <nav className="sd-workspace-nav" aria-label="System Design workspace">{items.map((item) => {
      const Icon = item.icon;
      const active = activeWorkspace === item.id;
      return <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} className={cn(active && "active")} onClick={onNavigate}><Icon size={14} aria-hidden="true" />{item.label}</Link>;
    })}</nav>;
  }

  return <>
    <aside className="sd-course-sidebar" aria-label="System Design course navigation">
      <div className="sd-course-sidebar-heading"><span><BookOpen size={15} />System Design</span><small>Course navigation</small></div>
      {workspaceNavigation(() => setDrawerOpen(false))}
      <nav className="sd-curriculum-nav" aria-label="System Design curriculum">{curriculumTree("desktop")}</nav>
    </aside>
    <button ref={triggerRef} type="button" className="sd-curriculum-trigger" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-expanded={drawerOpen}>
      <Menu size={17} />Course navigation
    </button>
    {drawerOpen && <div className="sd-drawer-backdrop">
      <button className="sd-drawer-dismiss" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close course navigation" />
      <aside ref={drawerRef} className="sd-course-drawer" role="dialog" aria-modal="true" aria-label="System Design course navigation">
        <div className="sd-course-drawer-heading"><span><BookOpen size={16} />System Design</span><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close course navigation"><X size={18} /></button></div>
        {workspaceNavigation(() => setDrawerOpen(false))}
        <nav className="sd-curriculum-nav" aria-label="System Design curriculum">{curriculumTree("drawer")}</nav>
      </aside>
    </div>}
  </>;
}
