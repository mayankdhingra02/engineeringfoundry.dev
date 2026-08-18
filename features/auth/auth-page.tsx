import { redirect } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/queries";
import { safeInternalPath } from "@/lib/auth/redirects";
import { AuthForm } from "./auth-form";

export type AuthPageMode = "sign-in" | "sign-up";

export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: AuthPageMode;
  searchParams: Promise<{ next?: string }>;
}) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;

  const next = safeInternalPath((await searchParams).next);
  const user = await getCurrentUser();
  if (user) {
    const profile = await getCurrentProfile();
    redirect(
      profile?.onboarding_complete
        ? next
        : `/onboarding?next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <section className="auth-section">
      <div className="page-width">
        <AuthForm mode={mode} next={next} />
      </div>
    </section>
  );
}
