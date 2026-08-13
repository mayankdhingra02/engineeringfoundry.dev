"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/supabase/database.types";
import { resetAnalyticsUser, track } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountSummary = Pick<Profile, "username" | "display_name" | "avatar_url">;

export function AccountControl({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;
    async function load() {
      const { data } = await client.auth.getUser();
      if (!data.user) return setAccount(null);
      const { data: profile } = await client.from("profiles").select("username,display_name,avatar_url").eq("id", data.user.id).maybeSingle();
      setAccount(profile);
    }
    load();
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) setAccount(null);
      else window.setTimeout(load, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function close(event: PointerEvent) { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) return;
    track("sign_out_completed");
    resetAnalyticsUser();
    setAccount(null);
    router.replace("/");
    router.refresh();
  }

  if (!account) return mobile ? <div className="mobile-account-actions"><Link className="button button-secondary" href="/sign-in" onClick={onNavigate}>Sign in</Link><Link className="button" href="/sign-up" onClick={onNavigate}>Create account</Link></div> : <div className="logged-out-actions"><Link className="text-link sign-in" href="/sign-in">Sign in</Link><Link className="button button-sm" href="/sign-up">Get started</Link></div>;

  if (mobile) return <div className="mobile-account"><span>Signed in as <strong>{account.display_name ?? account.username ?? "Member"}</strong></span><div className="mobile-account-links"><Link href="/dashboard" onClick={onNavigate}>Dashboard</Link>{account.username && <Link href={`/u/${account.username}`} onClick={onNavigate}>Public profile</Link>}<Link href="/settings/profile" onClick={onNavigate}>Profile settings</Link><button type="button" onClick={signOut}>Sign out</button></div></div>;

  const initials = (account.display_name ?? account.username ?? "EF").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="account-control" ref={wrapper}><button className="account-trigger" type="button" aria-expanded={open} aria-controls="account-menu" onClick={() => setOpen(!open)}><span>{initials}</span><b>{account.display_name ?? account.username ?? "Member"}</b><ChevronDown size={13} /></button>{open && <div className="account-menu" id="account-menu"><div><small>ENGINEERING FOUNDRY ACCOUNT</small><strong>{account.display_name ?? "Member"}</strong>{account.username && <span>@{account.username}</span>}</div><Link href="/dashboard" onClick={() => setOpen(false)}><LayoutDashboard size={15} />Dashboard</Link>{account.username && <Link href={`/u/${account.username}`} onClick={() => setOpen(false)}><UserRound size={15} />Profile</Link>}<Link href="/settings/profile" onClick={() => setOpen(false)}><Settings size={15} />Settings</Link><button type="button" onClick={signOut}><LogOut size={15} />Sign out</button></div>}</div>;
}
