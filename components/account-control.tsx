"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/features/auth/sign-out-action";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { resetAnalyticsUser, track } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";

type AccountSummary = Pick<
  Profile,
  "username" | "display_name" | "avatar_url" | "is_public"
> & { email: string | null };

type AccountControlProps = { mobile?: boolean; onNavigate?: () => void };

export function AccountControl(props: AccountControlProps) {
  if (!isAccountPlatformAvailable()) return null;
  return <AvailableAccountControl {...props} />;
}

function AvailableAccountControl({
  mobile = false,
  onNavigate,
}: AccountControlProps) {
  const router = useRouter();
  const [account, setAccount] = useState<
    AccountSummary | null | undefined
  >(undefined);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    async function load() {
      try {
        const response = await fetch("/api/auth/account", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Account request failed");
        const result = (await response.json()) as {
          account: AccountSummary | null;
        };
        setAccount(result.account);
      } catch {
        setAccount((current) => (current === undefined ? null : current));
      }
    }

    void load();
    const { data: listener } = client.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) setAccount(null);
        else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          // Keep the last known navigation state visible while refreshing profile data.
          // Supabase may emit SIGNED_IN again when a tab regains focus.
          window.setTimeout(load, 0);
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !open) return;
      setOpen(false);
      window.requestAnimationFrame(() => trigger.current?.focus());
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    const result = await signOutAction();
    if (!result.ok) {
      setSigningOut(false);
      setSignOutError(result.message);
      return;
    }
    // Notify other client listeners after the server has authoritatively
    // revoked and removed the cookie-backed session.
    await createSupabaseBrowserClient()?.auth.signOut({ scope: "local" });
    track("sign_out_completed");
    resetAnalyticsUser();
    setOpen(false);
    setAccount(null);
    setSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  if (account === undefined) {
    return mobile ? null : (
      <div
        className="account-control account-control-loading"
        aria-label="Loading account"
      >
        <span />
      </div>
    );
  }

  if (!account) {
    return mobile ? (
      <div className="mobile-account-actions">
        <Link
          className="button button-secondary"
          href="/signin"
          onClick={onNavigate}
        >
          Sign in
        </Link>
        <Link className="button" href="/signup" onClick={onNavigate}>
          Sign up
        </Link>
      </div>
    ) : (
      <div className="logged-out-actions">
        <Link className="text-link sign-in" href="/signin">
          Sign in
        </Link>
        <Link className="button button-sm" href="/signup">
          Sign up
        </Link>
      </div>
    );
  }

  const label =
    account.display_name?.trim().split(/\s+/)[0] ??
    account.username ??
    account.email ??
    "Member";
  const fullName = account.display_name ?? account.username ?? account.email;
  const initials = label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (mobile) {
    return (
      <div className="mobile-account">
        <span>
          Signed in as <strong>{label}</strong>
        </span>
        <div className="mobile-account-links">
          <Link href="/dashboard" onClick={onNavigate}>
            Dashboard
          </Link>
          <Link href="/interview-playbook" onClick={onNavigate}>
            Interview Playbook
          </Link>
          <Link href="/applications" onClick={onNavigate}>
            Applications
          </Link>
          <Link href="/calendar" onClick={onNavigate}>
            Interview calendar
          </Link>
          <Link href="/settings" onClick={onNavigate}>
            Settings
          </Link>
          <button type="button" disabled={signingOut} onClick={signOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
        {signOutError && (
          <p className="account-menu-error" role="alert">
            {signOutError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="account-control" ref={wrapper}>
      <button
        ref={trigger}
        className="account-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-haspopup="true"
        onClick={() => {
          setOpen(!open);
          setSignOutError("");
        }}
      >
        <span>{initials}</span>
        <b>{label}</b>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu" id="account-menu">
          <div>
            <small>ENGINEERING FOUNDRY ACCOUNT</small>
            <strong>{fullName ?? "Member"}</strong>
            {account.email && account.email !== fullName && (
              <span>{account.email}</span>
            )}
          </div>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <LayoutDashboard size={15} aria-hidden="true" />
            Dashboard
          </Link>
          <Link href="/interview-playbook" onClick={() => setOpen(false)}>
            <Compass size={15} aria-hidden="true" />
            Interview Playbook
          </Link>
          <Link href="/applications" onClick={() => setOpen(false)}>
            <BriefcaseBusiness size={15} aria-hidden="true" />
            Applications
          </Link>
          <Link href="/calendar" onClick={() => setOpen(false)}>
            <CalendarDays size={15} aria-hidden="true" />
            Interview calendar
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)}>
            <Settings size={15} aria-hidden="true" />
            Settings
          </Link>
          <button type="button" disabled={signingOut} onClick={signOut}>
            <LogOut size={15} aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          {signOutError && (
            <p className="account-menu-error" role="alert">
              {signOutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
