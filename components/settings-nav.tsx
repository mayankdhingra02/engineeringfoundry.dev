import Link from "next/link";
import { BellRing, ChevronRight, CircleUserRound, SlidersHorizontal, UserRoundCog } from "lucide-react";

const items = [
  { href: "/settings/account", label: "Account", description: "Name, email, password, and sessions", icon: UserRoundCog },
  { href: "/settings/preparation", label: "Preparation", description: "Role, focus, and preferred DSA roadmap", icon: SlidersHorizontal },
  { href: "/settings/interviews", label: "Interview preferences", description: "Timezone and reminder timing", icon: BellRing },
  { href: "/settings/privacy", label: "Privacy & data", description: "Private export and account deletion", icon: CircleUserRound },
] as const;

export function SettingsNav({ current }: { current?: string }) {
  return <nav className="settings-nav" aria-label="Settings sections">
    {items.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>
      <Icon size={18} aria-hidden="true" />
      <span><strong>{label}</strong><small>{description}</small></span>
      <ChevronRight size={16} aria-hidden="true" />
    </Link>)}
  </nav>;
}
