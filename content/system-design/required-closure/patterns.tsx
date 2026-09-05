import { RequiredClosureLesson, type RequiredClosureLessonSpec } from "./shared";

const lessons: Record<string, RequiredClosureLessonSpec> = {
  "backfill-rebuild": {
    id: "backfill-rebuild",
    decision: "Recompute derived state from an authoritative source with a versioned, restartable process that coexists with live writes and proves completeness before cutover.",
    mechanism: ["Name the authoritative source and the target derivation version.", "Capture a change-log position or make target writes version-aware.", "Scan stable key ranges in bounded idempotent batches.", "Apply concurrent changes without letting older backfill output win.", "Compare invariants, lag, and samples; switch readers; retain a rollback window."],
    diagram: { title: "Online backfill and rebuild", description: "A snapshot scan and ongoing change stream converge into a versioned target that is verified before readers switch.", chart: `flowchart LR
  S[(Source of truth)] -->|snapshot ranges| B[Backfill workers]
  S -->|ongoing changes| C[Change stream]
  B --> T[(Target v2)]
  C --> T
  T --> V[Parity checks]
  V --> R[Reader cutover]` },
    example: { title: "Rebuild a search index", body: "Create index_v2 with a new analyzer. Bulk index records by primary-key range while CDC applies newer versions. Compare document counts, sampled queries, and maximum lag before moving a small reader cohort.", consequence: "An alias switch is reversible, and a stale bulk record cannot overwrite a newer CDC update." },
    tradeoffs: [{ option: "In-place repair", chooseWhen: "The transformation is small and individually reversible.", cost: "Mixed old and new state is harder to reason about." }, { option: "Parallel target", chooseWhen: "Validation and instant rollback matter.", cost: "Temporary duplicate storage and writes." }, { option: "Offline rebuild", chooseWhen: "Readers can tolerate unavailability or stale snapshots.", cost: "Simpler consistency but explicit downtime or freshness loss." }],
    failure: { failure: "A restarted worker repeats a range and writes an older projection over a live update.", impact: "The rebuilt target silently regresses individual entities.", detection: "Target version is below source version, checksum mismatches, or shadow queries diverge.", mitigation: "Checkpoint ranges, attach source versions, use conditional upserts, and make every batch replay-safe.", tradeoff: "Version checks add write cost but make retries and parallelism safe." },
    exercise: ["Name the source of truth and target derivation version.", "Choose stable range boundaries and checkpoint state.", "Define how live changes overtake snapshot work.", "Write cutover, abort, and rollback thresholds."],
    probes: ["What if the source row changes twice during its batch?", "How do deletes reach the rebuilt target?", "Which parity check catches semantically wrong but well-formed output?"],
    practice: ["search-engine", "feature-store", "event-analytics"],
    remember: "A safe rebuild is versioned, restartable, live-write aware, measurable, and reversible.",
  },
  "control-plane-data-plane": {
    id: "control-plane-data-plane",
    decision: "Keep configuration, placement, lifecycle, and policy decisions off the latency-critical serving path; data-plane nodes should operate from validated cached state during bounded control-plane disruption.",
    mechanism: ["Clients mutate desired state through an authenticated control API.", "The control plane validates, versions, audits, and distributes configuration.", "Data-plane nodes acknowledge applied versions and serve traffic locally.", "Health signals feed reconciliation without requiring the controller on every request.", "Safe defaults, expiry, and rollback bound stale configuration."],
    diagram: { title: "Control and data plane boundary", description: "Operators write versioned desired state through a control plane, while clients use a separately scaled serving path with cached configuration.", chart: `flowchart TB
  O[Operator] --> A[Control API]
  A --> S[(Desired state)]
  S --> C[Controller]
  C -->|versioned config| D1[Data node A]
  C -->|versioned config| D2[Data node B]
  U[Client traffic] --> D1
  U --> D2
  D1 -->|health and applied version| C
  D2 -->|health and applied version| C` },
    example: { title: "Feature flag service", body: "The control plane stores targeting rules and audits changes. Edge SDK relays cache a signed version and evaluate locally. A control outage blocks new configuration but does not add a dependency to every application request.", consequence: "Serving availability and latency are decoupled from configuration churn, with explicit staleness and emergency-disable rules." },
    tradeoffs: [{ option: "Local evaluation", chooseWhen: "Serving latency and control-plane isolation dominate.", cost: "Stale versions and distribution complexity." }, { option: "Remote evaluation", chooseWhen: "Central policy must be immediately authoritative.", cost: "Control availability and network latency enter the hot path." }, { option: "Hybrid", chooseWhen: "Most rules can be cached but sensitive decisions need a server.", cost: "Two paths and more consistency reasoning." }],
    failure: { failure: "A bad configuration version reaches every data node.", impact: "The independently available data plane consistently serves the wrong behavior.", detection: "Applied-version telemetry, canary outcome metrics, config validation, and audit correlation.", mitigation: "Stage distribution, keep last-known-good state, sign versions, provide rapid rollback, and constrain blast radius.", tradeoff: "Progressive rollout slows global convergence but limits failures." },
    exercise: ["Label each API as control or data plane.", "Choose a configuration version and acknowledgement model.", "Define behavior during control-plane loss and after cache expiry.", "Design canary, rollback, and audit paths."],
    probes: ["Can the data plane start if the controller is down?", "How stale may configuration become?", "Which emergency control must bypass normal rollout?"],
    practice: ["feature-flag-system", "api-gateway-system", "distributed-lock-service"],
    remember: "The control plane decides and reconciles; the data plane serves from bounded, observable, versioned state.",
  },
};

export function PatternsClosureLessonContent({ lessonId }: { lessonId: string }) {
  const spec = lessons[lessonId];
  return spec ? <RequiredClosureLesson spec={spec} /> : null;
}
