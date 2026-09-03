import { NextResponse, type NextRequest } from "next/server";
import { appendAuthEvent, safeInternalPath } from "@/lib/auth/redirects";
import { siteConfig } from "@/config/site";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { resolveRecentPasswordRecoverySubject } from "@/lib/auth/password-recovery-claims";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!isAccountPlatformAvailable()) return NextResponse.redirect(new URL("/signin", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
  const localRequest = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const redirectOrigin = localRequest ? request.nextUrl.origin : new URL(siteConfig.url).origin;
  const supabase = await createSupabaseServerClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/auth/error?reason=callback", redirectOrigin));
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user || !data.session) return NextResponse.redirect(new URL("/auth/error?reason=callback", redirectOrigin));
  if (next === "/reset-password") {
    const validationInstant = new Date();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      data.session.access_token,
    );
    const recoverySubject = claimsError
      ? null
      : resolveRecentPasswordRecoverySubject(
          claimsData?.claims,
          validationInstant,
        );
    if (!recoverySubject || recoverySubject !== data.user.id.toLowerCase()) {
      return NextResponse.redirect(
        new URL("/auth/error?reason=callback", redirectOrigin),
      );
    }
    return NextResponse.redirect(new URL(next, redirectOrigin));
  }
  const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("id", data.user.id).maybeSingle();
  const provider = typeof data.user.app_metadata.provider === "string" ? data.user.app_metadata.provider : "oauth";
  const destination = profile?.onboarding_complete ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(appendAuthEvent(destination, provider), redirectOrigin));
}
