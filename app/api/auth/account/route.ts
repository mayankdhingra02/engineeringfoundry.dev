import { NextResponse } from "next/server";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";

export const dynamic = "force-dynamic";

const PRIVATE_NO_STORE = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

export async function GET() {
  if (!isAccountPlatformAvailable()) {
    return NextResponse.json({ account: null }, { headers: PRIVATE_NO_STORE });
  }

  const actor = await getAuthenticatedActor();
  if (!actor) {
    return NextResponse.json({ account: null }, { headers: PRIVATE_NO_STORE });
  }

  const { data: profile } = await actor.supabase
    .from("profiles")
    .select("username,display_name,avatar_url,is_public")
    .eq("id", actor.user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      account: {
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        is_public: profile?.is_public ?? false,
        email: actor.user.email ?? null,
      },
    },
    { headers: PRIVATE_NO_STORE },
  );
}
