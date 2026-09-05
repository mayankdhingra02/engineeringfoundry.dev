"use client";

import Link from "next/link";
import { BookOpen, Braces, CheckCircle2, ChevronRight, ClipboardCheck, ListChecks, Menu, Route, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DSACurriculumNode } from "@/data/dsa/curriculum";
import { useModalDrawer } from "@/hooks/use-modal-drawer";
import { cn } from "@/lib/utils";

const storageKey = "ef-dsa-open-sections";

function activeAncestorIds(nodes: readonly DSACurriculumNode[], pathname: string, trail: string[] = []): string[] {
  for (const node of nodes) {
    const nextTrail = node.type === "page" ? trail : [...trail, node.id];
    if (node.slug === pathname) return nextTrail;
    const found = activeAncestorIds(node.children ?? [], pathname, nextTrail);
    if (found.length) return found;
  }
  return [];
}

function Branch({ node, pathname, level, openIds, completed, scope, onToggle, onNavigate }: {
  node: DSACurriculumNode; pathname: string; level: number; openIds: Set<string>; completed: ReadonlySet<string>; scope: string;
  onToggle: (id: string) => void; onNavigate: () => void;
}) {
  if (node.type === "page" && node.slug) {
    const active = pathname === node.slug;
    return <li className="sd-curriculum-lesson"><Link href={node.slug} aria-current={active ? "page" : undefined} className={cn(active && "active")} onClick={onNavigate}>
      <span>{node.navigationTitle ?? node.title}</span>{completed.has(node.slug) && <CheckCircle2 size={13} aria-label="Completed" />}
    </Link></li>;
  }
  const open = openIds.has(node.id);
  const controlId = `dsa-curriculum-${scope}-${node.id}`;
  return <li className={cn("sd-curriculum-group", level === 0 && "major")}>
    <button type="button" aria-expanded={open} aria-controls={controlId} onClick={() => onToggle(node.id)}><ChevronRight size={14} aria-hidden="true" /><span>{node.title}</span></button>
    {open && <ul id={controlId}>{node.children?.map((child) => <Branch key={child.id} node={child} pathname={pathname} level={level + 1} openIds={openIds} completed={completed} scope={scope} onToggle={onToggle} onNavigate={onNavigate} />)}</ul>}
  </li>;
}

export function DSASidebar({ curriculum, completedPageSlugs = [] }: { curriculum: DSACurriculumNode[]; completedPageSlugs?: readonly string[] }) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const activeIds = useMemo(() => activeAncestorIds(curriculum, pathname), [curriculum, pathname]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(activeIds.length ? activeIds : [curriculum[0]?.id].filter(Boolean)));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const completed = useMemo(() => new Set(completedPageSlugs), [completedPageSlugs]);
  const visibleOpenIds = useMemo(() => new Set([...openIds, ...activeIds]), [activeIds, openIds]);

  useEffect(() => {
    let frame = 0;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored) frame = window.requestAnimationFrame(() => setOpenIds((current) => new Set([...current, ...JSON.parse(stored)])));
    } catch { /* Navigation remains usable when storage is unavailable. */ }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useModalDrawer(drawerOpen, setDrawerOpen, triggerRef, drawerRef);

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id);
      try { window.sessionStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* Optional enhancement only. */ }
      return next;
    });
  }

  function tree(scope: string) {
    return <ul className="sd-curriculum-tree">{curriculum.map((node) => <Branch key={node.id} node={node} pathname={pathname} level={0} openIds={visibleOpenIds} completed={completed} scope={scope} onToggle={toggle} onNavigate={() => setDrawerOpen(false)} />)}</ul>;
  }

  function workspaceJobs() {
    const jobs = [
      { label: "Practice", href: "/dsa/questions", icon: ListChecks },
      { label: "Roadmap", href: "/dsa/roadmap", icon: Route },
      { label: "Review", href: "/dsa/languages", icon: BookOpen },
      { label: "Playbook", href: "/interview-playbook", icon: ClipboardCheck },
    ] as const;
    return <div className="dsa-learning-jobs" aria-label="DSA workspace jobs">{jobs.map(({ label, href, icon: Icon }) => <Link href={href} key={href} onClick={() => setDrawerOpen(false)}><Icon size={14} aria-hidden="true" />{label}</Link>)}</div>;
  }

  return <>
    <aside className="sd-course-sidebar" aria-label="DSA interview-preparation navigation"><div className="sd-course-sidebar-heading"><span><Braces size={15} />DSA</span><small>Interview preparation</small></div><nav>{workspaceJobs()}<span className="dsa-learning-index-label">Reference index</span>{tree("desktop")}</nav></aside>
    <button ref={triggerRef} type="button" className="sd-curriculum-trigger" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-expanded={drawerOpen}><Menu size={17} />DSA: Practice · Roadmap · Review</button>
    {drawerOpen && <div className="sd-drawer-backdrop"><button className="sd-drawer-dismiss" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close DSA navigation" /><aside ref={drawerRef} className="sd-course-drawer" role="dialog" aria-modal="true" aria-label="DSA interview-preparation navigation"><div className="sd-course-drawer-heading"><span><Braces size={16} />DSA</span><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close DSA navigation"><X size={18} /></button></div><nav>{workspaceJobs()}<span className="dsa-learning-index-label">Reference index</span>{tree("drawer")}</nav></aside></div>}
  </>;
}
