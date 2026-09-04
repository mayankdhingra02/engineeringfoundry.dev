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
import { useCallback, useEffect, useRef, useState } from "react";
import { signOutAction } from "@/features/auth/sign-out-action";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { resetAnalyticsUser, track } from "@/lib/analytics";
import {
  ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE,
  parseAccountNavigationResponse,
  resolveAccountNavigationSettlement,
  type AccountNavigationClientState,
  type AccountNavigationResponse,
} from "@/lib/auth/account-navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  const [navigation, setNavigation] = useState<AccountNavigationClientState>({
    state: "loading",
  });
  const navigationRef = useRef<AccountNavigationClientState>(navigation);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const retryTrigger = useRef<HTMLButtonElement>(null);
  const anonymousFocusTarget = useRef<HTMLAnchorElement>(null);
  const mobileReadyFocusTarget = useRef<HTMLAnchorElement>(null);
  const requestEpoch = useRef(0);
  const mounted = useRef(false);
  const retryPending = useRef(false);
  const focusAfterRetry = useRef(false);

  const commitNavigation = useCallback((next: AccountNavigationClientState) => {
    navigationRef.current = next;
    setNavigation(next);
  }, []);

  const load = useCallback(
    async (expectedAuthenticated = false, restoreRetryFocus = false) => {
      const requestId = ++requestEpoch.current;
      let incoming: AccountNavigationResponse = { state: "unavailable" };
      try {
        const response = await fetch("/api/auth/account", {
          cache: "no-store",
          credentials: "same-origin",
        });
        incoming = parseAccountNavigationResponse(
          response.status,
          await response.json(),
        );
      } catch {
        incoming = { state: "unavailable" };
      }
      if (!mounted.current || requestId !== requestEpoch.current) return null;
      const next = resolveAccountNavigationSettlement(
        navigationRef.current,
        incoming,
        expectedAuthenticated,
      );
      focusAfterRetry.current =
        restoreRetryFocus &&
        next.state !== "loading" &&
        next.state !== "unavailable";
      commitNavigation(next);
      return next;
    },
    [commitNavigation],
  );

  useEffect(() => {
    mounted.current = true;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      const unavailableTimer = window.setTimeout(() => {
        if (mounted.current) commitNavigation({ state: "unavailable" });
      }, 0);
      return () => {
        window.clearTimeout(unavailableTimer);
        mounted.current = false;
        requestEpoch.current += 1;
      };
    }
    const client = supabase;

    void load();
    const { data: listener } = client.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          requestEpoch.current += 1;
          commitNavigation({ state: "anonymous" });
          setOpen(false);
        } else if (
          session?.user &&
          (event === "INITIAL_SESSION" ||
            event === "PASSWORD_RECOVERY" ||
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED" ||
            event === "MFA_CHALLENGE_VERIFIED")
        ) {
          // Keep the last known navigation state visible while refreshing profile data.
          // Supabase may emit SIGNED_IN again when a tab regains focus.
          if (navigationRef.current.state !== "ready") {
            commitNavigation({ state: "loading" });
          }
          window.setTimeout(() => {
            if (mounted.current) void load(true);
          }, 0);
        }
      },
    );
    return () => {
      mounted.current = false;
      requestEpoch.current += 1;
      listener.subscription.unsubscribe();
    };
  }, [commitNavigation, load]);

  useEffect(() => {
    if (!focusAfterRetry.current) return;
    focusAfterRetry.current = false;
    const frame = window.requestAnimationFrame(() => {
      if (navigation.state === "anonymous") {
        anonymousFocusTarget.current?.focus();
      } else if (navigation.state === "ready") {
        (mobile ? mobileReadyFocusTarget.current : trigger.current)?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, navigation]);

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
    requestEpoch.current += 1;
    commitNavigation({ state: "anonymous" });
    setSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  async function retry() {
    if (retryPending.current) return;
    retryPending.current = true;
    setRetrying(true);
    const restoreFocus = document.activeElement === retryTrigger.current;
    try {
      await load(false, restoreFocus);
    } finally {
      retryPending.current = false;
      if (mounted.current) setRetrying(false);
    }
  }

  if (navigation.state === "disabled") return null;

  if (navigation.state === "loading") {
    return mobile ? null : (
      <div
        className="account-control account-control-loading"
        aria-label="Loading account"
      >
        <span />
      </div>
    );
  }

  if (navigation.state === "unavailable") {
    return (
      <div
        className={
          mobile
            ? "account-navigation-unavailable mobile-account-unavailable"
            : "account-control account-control-unavailable"
        }
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>{ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE}</span>
        <button
          ref={retryTrigger}
          type="button"
          aria-disabled={retrying}
          onClick={() => void retry()}
        >
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  if (navigation.state === "anonymous") {
    return mobile ? (
      <div className="mobile-account-actions">
        <Link
          ref={anonymousFocusTarget}
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
        <Link
          ref={anonymousFocusTarget}
          className="text-link sign-in"
          href="/signin"
        >
          Sign in
        </Link>
        <Link className="button button-sm" href="/signup">
          Sign up
        </Link>
      </div>
    );
  }

  const account = navigation.account;
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
          <Link href="/dashboard" onClick={onNavigate} ref={mobileReadyFocusTarget}>
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
