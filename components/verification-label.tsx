import { BadgeCheck, CircleDotDashed, MessagesSquare, Wrench } from "lucide-react";
import type { VerificationStatus } from "@/types";

const labels: Record<VerificationStatus | "original", string> = {
  verified: "Verified",
  "community-reported": "Community reported",
  unverified: "Unverified",
  demo: "Demo",
  original: "Original",
};

export function VerificationLabel({ status, original = false }: { status: VerificationStatus; original?: boolean }) {
  const display = original ? "original" : status;
  const Icon = display === "verified" ? BadgeCheck : display === "community-reported" ? MessagesSquare : display === "original" ? Wrench : CircleDotDashed;
  return <span className={`verification-label ${display}`} aria-label={`Verification status: ${labels[display]}`}><Icon size={12} aria-hidden="true" />{labels[display]}</span>;
}
