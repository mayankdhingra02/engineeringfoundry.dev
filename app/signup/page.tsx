import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/auth-page";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an Engineering Foundry account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return <AuthPage mode="sign-up" searchParams={searchParams} />;
}
