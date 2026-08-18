import Link from "next/link";
import { BookOpenText, LayoutDashboard, LibraryBig, MessageSquareQuote } from "lucide-react";

export function BehavioralWorkspaceHeader({ title, description }: { title: string; description: string }) {
  return <header className="behavioral-workspace-header"><div><h1>{title}</h1><p>{description}</p></div><nav aria-label="Behavioral workspace"><Link href="/behavioral/workspace"><LayoutDashboard size={15} />Overview</Link><Link href="/behavioral/questions"><BookOpenText size={15} />Questions</Link><Link href="/behavioral/stories"><LibraryBig size={15} />Story bank</Link><Link href="/behavioral"><MessageSquareQuote size={15} />Public guide</Link></nav></header>;
}
