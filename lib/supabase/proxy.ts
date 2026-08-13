import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isAccountPlatformAvailable() || !url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const setAll: SetAllCookies = (cookiesToSet, headers) => {
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
    response = NextResponse.next({ request });
    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
  };

  const supabase = createServerClient<Database, "public">(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll,
    },
  });

  // Verifies or refreshes the token and propagates updated cookies. Authorization remains in pages/actions and RLS.
  await supabase.auth.getClaims();
  return response;
}
