import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ClipboardCheck, MessageSquare, ShieldCheck } from "lucide-react";
import { requireAdminActor } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Operations", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const links = [
  ["/admin", "Operations", ShieldCheck],
  ["/admin/feedback", "Feedback", MessageSquare],
  ["/admin/interview-experiences", "Experiences", ClipboardCheck],
  ["/admin/company-freshness", "Company freshness", Activity],
  ["/admin/operational-health", "Operational health", Activity],
] as const;

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminActor("/admin");
  return <section className="admin-shell"><div className="page-width admin-layout"><aside className="admin-nav"><Link href="/dashboard">Return to workspace</Link><h1>Operations</h1><p>Private launch queues. Configuration presence is not a service-health claim.</p><nav aria-label="Admin operations">{links.map(([href, label, Icon]) => <Link href={href} key={href}><Icon size={16} aria-hidden="true" />{label}</Link>)}</nav></aside><div className="admin-content">{children}</div></div></section>;
}
