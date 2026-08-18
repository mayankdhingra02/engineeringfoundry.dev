import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/queries";
import { safeInternalPath } from "@/lib/auth/redirects";

export async function requireAuthenticatedUser(destination: string) {
  const next = safeInternalPath(destination);
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireMemberProfile(destination: string) {
  const next = safeInternalPath(destination);
  const user = await requireAuthenticatedUser(next);
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/error?reason=profile");
  if (!profile.onboarding_complete) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  return { user, profile };
}
