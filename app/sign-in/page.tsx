import type { Metadata } from "next";
import { SignInPanel } from "@/features/auth/sign-in-panel";

export const metadata: Metadata = { title: "Sign In", description: "Sign in to Engineering Foundry." };
export default function SignInPage() { return <section className="section"><div className="page-width"><SignInPanel /></div></section>; }
