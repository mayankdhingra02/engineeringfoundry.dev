import type { FurtherReadingItem } from "@/components/system-design-article";

export const foundationSources: Record<string, readonly FurtherReadingItem[]> = {
  introduction: [
    { title: "Design architecture based on requirements", publisher: "Microsoft Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/design-business-requirements" },
    { title: "Understand architecture tradeoffs", publisher: "AWS Well-Architected Framework", url: "https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/perf_architecture_evaluate_trade_offs.html" },
  ],
  "interview-framework": [
    { title: "Architecture design specification", publisher: "Microsoft Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-design-specification" },
    { title: "Understand architecture tradeoffs", publisher: "AWS Well-Architected Framework", url: "https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/perf_architecture_evaluate_trade_offs.html" },
  ],
  requirements: [
    { title: "Design architecture based on business requirements", publisher: "Microsoft Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/design-business-requirements" },
    { title: "Simplify", publisher: "Microsoft Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/reliability/simplify" },
  ],
  estimation: [
    { title: "Service Level Objectives", publisher: "Google Site Reliability Engineering", url: "https://sre.google/sre-book/service-level-objectives/" },
  ],
  "core-system-properties": [
    { title: "Service Level Objectives", publisher: "Google Site Reliability Engineering", url: "https://sre.google/sre-book/service-level-objectives/" },
    { title: "Scale out", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/scale-out" },
    { title: "Reliability Pillar", publisher: "AWS Well-Architected Framework", url: "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html" },
  ],
};
