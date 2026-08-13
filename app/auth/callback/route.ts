import { NextResponse, type NextRequest } from "next/server";
import { appendAuthEvent, safeInternalPath } from "@/lib/auth/redirects";
import { siteConfig } from "@/config/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flow = request.nextUrl.searchParams.get("flow");
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
  const localRequest = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const redirectOrigin = localRequest ? request.nextUrl.origin : new URL(siteConfig.url).origin;
  const supabase = await createSupabaseServerClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/auth/error?reason=callback", redirectOrigin));
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/auth/error?reason=callback", redirectOrigin));
  if (next === "/reset-password" && flow === "recovery") {
    const response = NextResponse.redirect(new URL(next, redirectOrigin));
    response.cookies.set("ef-password-recovery", "1", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 600 });
    return response;
  }
  const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("id", data.user.id).maybeSingle();
  const provider = typeof data.user.app_metadata.provider === "string" ? data.user.app_metadata.provider : "oauth";
  const destination = profile?.onboarding_complete ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(appendAuthEvent(destination, provider), redirectOrigin));
}
