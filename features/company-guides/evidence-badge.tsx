import { BadgeCheck, Compass, MessageSquareText } from "lucide-react";
import type { Confidence, EvidenceKind } from "@/data/company-guides/types";

const labels: Record<EvidenceKind, string> = {
  official: "Official company source",
  candidate: "Candidate report",
  recommendation: "EF recommendation",
};

const icons = {
  official: BadgeCheck,
  candidate: MessageSquareText,
  recommendation: Compass,
};

export function EvidenceBadge({ kind, confidence, compact = false, company }: { kind: EvidenceKind; confidence?: Confidence; compact?: boolean; company?: string }) {
  const Icon = icons[kind];
  const label = kind === "official" && company ? `Official ${company}` : labels[kind];
  return (
    <span className={`company-evidence ${kind}`} title={confidence ? `Confidence: ${confidence}` : undefined}>
      <Icon size={11} aria-hidden="true" />
      {compact && kind === "official" ? "Official" : label}
      {confidence && <b>{confidence}</b>}
    </span>
  );
}
