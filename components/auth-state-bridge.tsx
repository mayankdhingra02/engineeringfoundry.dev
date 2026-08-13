"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { identifyUser, track } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthStateBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("id", data.user.id).maybeSingle();
      identifyUser(data.user.id, { onboarding_complete: profile?.onboarding_complete ?? false });
      if (searchParams.get("auth_event") === "sign_in") {
        track("sign_in_completed", { method: searchParams.get("auth_method") ?? "unknown" });
        const clean = new URLSearchParams(searchParams.toString());
        clean.delete("auth_event");
        clean.delete("auth_method");
        router.replace(`${pathname}${clean.size ? `?${clean}` : ""}`, { scroll: false });
      }
    });
    return () => { active = false; };
  }, [pathname, router, searchParams]);

  return null;
}
