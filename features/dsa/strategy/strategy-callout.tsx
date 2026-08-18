import { CircleAlert, MessageSquareText, Zap } from "lucide-react";
import type { ReactNode } from "react";

const icons = { rule: Zap, example: MessageSquareText, watch: CircleAlert } as const;

export function StrategyCallout({ title, tone = "example", children }: { title: string; tone?: keyof typeof icons; children: ReactNode }) {
  const Icon = icons[tone];
  return <aside className={`dsa-strategy-callout ${tone}`}><Icon size={16} aria-hidden="true" /><div><strong>{title}</strong>{children}</div></aside>;
}

