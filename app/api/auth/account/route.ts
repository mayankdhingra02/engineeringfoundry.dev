import { NextResponse } from "next/server";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import {
  resolveAccountNavigationProfileResult,
  resolveAccountNavigationUserResult,
} from "@/lib/auth/account-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PRIVATE_NO_STORE = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow",
};

function unavailableResponse() {
  return NextResponse.json(
    { state: "unavailable" },
    { status: 503, headers: PRIVATE_NO_STORE },
  );
}

export async function GET() {
  if (!isAccountPlatformAvailable()) {
    return NextResponse.json({ state: "disabled" }, { headers: PRIVATE_NO_STORE });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return unavailableResponse();
    const userResult = await supabase.auth.getUser();
    const identity = resolveAccountNavigationUserResult(
      { data: userResult.data, error: userResult.error },
      isAuthSessionMissingError,
    );
    if (identity.state === "anonymous") {
      return NextResponse.json(identity, { headers: PRIVATE_NO_STORE });
    }

    const profileResult = await supabase
      .from("profiles")
      .select("username,display_name")
      .eq("id", identity.user.id)
      .maybeSingle();
    const response = resolveAccountNavigationProfileResult(
      { data: profileResult.data, error: profileResult.error },
      identity.user,
    );

    return NextResponse.json(response, { headers: PRIVATE_NO_STORE });
  } catch {
    return unavailableResponse();
  }
}
