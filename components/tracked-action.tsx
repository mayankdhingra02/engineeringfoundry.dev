"use client";

import Link from "next/link";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";

export function TrackedLink({ href, event, properties, className = "button", children, target }: { href: string; event: AnalyticsEvent; properties?: Record<string, string | number | boolean>; className?: string; children: React.ReactNode; target?: "_blank" }) {
  return href.startsWith("/") ? <Link href={href} className={className} onClick={() => track(event, properties)}>{children}</Link> : <a href={href} className={className} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} onClick={() => track(event, properties)}>{children}</a>;
}

export function TrackedButton({ event, properties, className = "button", children }: { event: AnalyticsEvent; properties?: Record<string, string | number | boolean>; className?: string; children: React.ReactNode }) {
  return <button type="button" className={className} onClick={() => track(event, properties)}>{children}</button>;
}
