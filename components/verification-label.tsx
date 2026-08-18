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
  const Icon = status === "verified" ? BadgeCheck : status === "community-reported" ? MessagesSquare : CircleDotDashed;
  return <>
    {original && <span className="verification-label original" aria-label="Authorship: Engineering Foundry original"><Wrench size={12} aria-hidden="true" />{labels.original}</span>}
    <span className={`verification-label ${status}`} aria-label={`Verification status: ${labels[status]}`}><Icon size={12} aria-hidden="true" />{labels[status]}</span>
  </>;
}
