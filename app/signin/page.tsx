import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/auth-page";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Engineering Foundry.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return <AuthPage mode="sign-in" searchParams={searchParams} />;
}
