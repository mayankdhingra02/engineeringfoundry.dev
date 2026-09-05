import { RequiredClosureLesson, type RequiredClosureLessonSpec } from "./shared";

const lessons: Record<string, RequiredClosureLessonSpec> = {
  "payments-ledgers": {
    id: "payments-ledgers",
    decision: "Separate payment orchestration from accounting: provider calls move an external payment state machine, while an immutable balanced ledger records what the product believes happened.",
    note: "A provider status is not a general ledger, and an idempotency key is not reconciliation.",
    mechanism: ["Create one payment intent with a stable business and idempotency key.", "Advance provider state through authorized attempts and asynchronous events.", "Record balanced immutable ledger entries for recognized financial events.", "Use compensating entries for refunds or corrections rather than rewriting history.", "Reconcile provider, bank, payout, and internal totals; route discrepancies and disputes to owned workflows."],
    diagram: { title: "Payment orchestration and ledger", description: "Checkout drives an idempotent provider workflow while verified events append balanced entries that reconciliation compares with provider and bank records.", chart: `flowchart LR
  C[Checkout] --> O[Payment orchestrator]
  O -->|idempotency key| P[Payment provider]
  P -->|signed event| O
  O --> L[(Immutable ledger)]
  P --> R[Reconciliation]
  B[Bank or payout report] --> R
  L --> R
  R --> X[Discrepancy workflow]` },
    example: { title: "Captured order and refund", body: "A successful capture posts equal debit and credit entries tied to the order and provider transaction. A later refund creates reversing entries and its own provider workflow; neither operation edits the original ledger rows.", consequence: "Balance can be replayed and audited even when callbacks repeat, arrive late, or a dispute changes the economic outcome." },
    tradeoffs: [{ option: "Provider-only records", chooseWhen: "A prototype has no independent balance or audit requirement.", cost: "Weak internal reconciliation and provider coupling." }, { option: "Double-entry ledger", chooseWhen: "Money movement and auditability are core domain state.", cost: "More modeling, invariants, and operational controls." }, { option: "Event-sourced accounting", chooseWhen: "Temporal reconstruction is a first-class requirement.", cost: "Event evolution, projections, and specialist review." }],
    failure: { failure: "The provider captured funds but the client timed out before receiving the response.", impact: "A naive retry can charge twice or the order can remain falsely unpaid.", detection: "Stable idempotency lookup, provider event, reconciliation mismatch, and age of unresolved intent.", mitigation: "Retry the same operation key, treat ambiguous outcomes as pending, process authenticated events idempotently, and reconcile before creating a new attempt.", tradeoff: "Pending states complicate UX but preserve financial correctness." },
    exercise: ["Name business, provider, attempt, event, and ledger identifiers.", "Write balanced entries for capture, fee, refund, and dispute.", "Define idempotency scope and retention.", "Specify reconciliation cadence, discrepancy states, and human ownership."],
    probes: ["Why not update the original row for a refund?", "How do you handle duplicate and out-of-order webhooks?", "Which system is authoritative for customer access while reconciliation is pending?"],
    practice: ["payment-system", "digital-wallet", "checkout-system"],
    remember: "Orchestrate external payment state, append balanced internal facts, and reconcile every boundary.",
  },
  "distributed-file-systems": {
    id: "distributed-file-systems",
    decision: "Separate namespace and block metadata from bulk data transfer, then design placement, replication, and recovery around large sequential files rather than small transactional objects.",
    mechanism: ["A metadata service maps paths and files to immutable or append-oriented blocks.", "Clients request block locations, then transfer bytes directly with data nodes.", "Data nodes heartbeat and report block inventory.", "Placement spreads replicas across failure domains while considering locality and write cost.", "The controller re-replicates under-replicated blocks and rebalances capacity."],
    diagram: { title: "Metadata and data-node topology", description: "The client asks a metadata service for block locations, then streams blocks through replicated data nodes without sending bytes through the metadata path.", chart: `flowchart LR
  C[Client] -->|path and block lookup| N[Metadata service]
  N -->|locations| C
  C -->|block bytes| D1[Data node rack A]
  D1 -->|replication pipeline| D2[Data node rack B]
  D2 --> D3[Data node rack B]
  D1 -->|heartbeat and block report| N
  D2 -->|heartbeat and block report| N
  D3 -->|heartbeat and block report| N` },
    example: { title: "One terabyte analytics file", body: "The file is split into large blocks. Metadata returns nearby healthy replicas, readers stream blocks in parallel, and a failed data node triggers re-replication from surviving copies without moving user bytes through the namespace service.", consequence: "Metadata capacity, small-file pressure, rack placement, and recovery bandwidth become explicit design constraints." },
    tradeoffs: [{ option: "Large blocks", chooseWhen: "Files are large and scans dominate.", cost: "Poor fit for many tiny files and fine-grained updates." }, { option: "Replication", chooseWhen: "Fast recovery and simple reads matter.", cost: "Multiplicative storage and network writes." }, { option: "Erasure coding", chooseWhen: "Cold durable data dominates cost.", cost: "Encoding, repair, and degraded-read complexity." }],
    failure: { failure: "A rack fails while many blocks have replicas concentrated in it.", impact: "Data becomes unavailable or recovery saturates cross-rack bandwidth.", detection: "Heartbeats disappear, block reports age, and under-replicated block count rises.", mitigation: "Place across failure domains, reserve recovery bandwidth, prioritize rare blocks, and throttle re-replication storms.", tradeoff: "Cross-rack placement improves fault tolerance but increases write traffic." },
    exercise: ["Choose block size and expected file-size distribution.", "Define metadata durability and failover.", "Place three replicas across two or more failure domains.", "Estimate recovery bandwidth after losing one rack."],
    probes: ["Why should bulk data bypass the metadata service?", "What makes small files expensive?", "How do you prevent recovery traffic from harming foreground reads?"],
    practice: ["cloud-file-storage", "object-storage-system", "video-streaming"],
    remember: "Distributed file systems coordinate namespace and block placement centrally while moving bulk bytes directly across replicated data nodes.",
  },
  "storage-compute-separation": {
    id: "storage-compute-separation",
    decision: "Disaggregate durable storage from elastic compute when their growth, lifetime, or workload isolation needs differ enough to justify remote I/O and cache coordination.",
    mechanism: ["Durable shared storage keeps canonical files, segments, or table blocks.", "Stateless or replaceable compute workers acquire work and fetch needed data.", "Local SSD and memory cache the hot working set with explicit eviction and versioning.", "Independent compute pools isolate interactive, batch, and maintenance workloads.", "Schedulers scale pools from demand while storage durability and lifecycle remain separate."],
    diagram: { title: "Disaggregated storage and compute", description: "Independent compute pools read shared durable storage through local caches, allowing workload-specific scaling and isolation.", chart: `flowchart TB
  S[(Durable shared storage)]
  C1[Interactive compute] --> L1[(Hot cache)]
  C2[Batch compute] --> L2[(Hot cache)]
  C3[Maintenance compute] --> L3[(Hot cache)]
  L1 --> S
  L2 --> S
  L3 --> S
  Q[Scheduler] --> C1
  Q --> C2
  Q --> C3` },
    example: { title: "Growing analytics warehouse", body: "Historical data grows faster than daily query demand. Shared object-backed storage retains the corpus, while an interactive pool scales for dashboards and a separate batch pool expands for nightly transformations.", consequence: "Storage growth no longer forces idle compute purchases, but cache warmth and remote-read bandwidth become performance controls." },
    tradeoffs: [{ option: "Local attached storage", chooseWhen: "Predictable low-latency access and simple failure boundaries dominate.", cost: "Storage and compute scale together; replacement moves data." }, { option: "Shared remote storage", chooseWhen: "Independent scaling, elasticity, and workload isolation matter.", cost: "Network latency, bandwidth, and cache misses." }, { option: "Hybrid tiering", chooseWhen: "A bounded hot set needs local speed over a large durable corpus.", cost: "Placement and eviction policy complexity." }],
    failure: { failure: "A newly scaled compute fleet starts with empty caches during a traffic spike.", impact: "Remote storage and network saturate, increasing latency for every pool.", detection: "Cache-hit rate falls while remote bytes, queue time, and storage throttling rise.", mitigation: "Warm critical ranges, limit concurrency, prioritize interactive traffic, use admission control, and size shared bandwidth for recovery events.", tradeoff: "Warm capacity costs more but avoids synchronized cold-start amplification." },
    exercise: ["Plot independent storage and compute growth for one year.", "Name the hot working set and acceptable cache-miss latency.", "Partition interactive and batch resource pools.", "Design behavior for storage throttling and a fleet-wide cold start."],
    probes: ["When is disaggregation worse than attached storage?", "How do you invalidate or version cached blocks?", "Which cost moves from disks to network after separation?"],
    practice: ["event-analytics", "feature-store", "stream-processing-platform"],
    remember: "Independent scaling trades local simplicity for remote-I/O, cache, and shared-bandwidth responsibilities.",
  },
};

export function StoragePaymentsLessonContent({ lessonId }: { lessonId: string }) {
  const spec = lessons[lessonId];
  return spec ? <RequiredClosureLesson spec={spec} /> : null;
}
