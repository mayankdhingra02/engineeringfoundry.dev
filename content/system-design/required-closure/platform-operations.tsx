import { RequiredClosureLesson, type RequiredClosureLessonSpec } from "./shared";

const lessons: Record<string, RequiredClosureLessonSpec> = {
  "security-threat-modeling": {
    id: "security-threat-modeling",
    decision: "Model valuable assets, actors, data flows, and trust boundaries before choosing controls; each credible abuse path needs an explicit response and a testable requirement.",
    mechanism: ["Scope the system and name sensitive assets.", "Draw actors, processes, stores, data flows, and trust boundaries.", "Walk abuse cases such as spoofing, tampering, disclosure, denial, and privilege escalation.", "Rank likelihood and impact, then mitigate, eliminate, transfer, or explicitly accept each threat.", "Validate controls and update the model when architecture or exposure changes."],
    diagram: { title: "Trust-boundary threat model", description: "An untrusted client crosses an authenticated API boundary before private data and an external provider, exposing concrete abuse paths.", chart: `flowchart LR
  U[Untrusted client] -->|credentials and input| A[Public API]
  subgraph T[Trusted service boundary]
    A --> Z[Authorization]
    Z --> D[(Private data)]
    A --> Q[Outbound worker]
  end
  Q -->|signed request| P[External provider]` },
    example: { title: "File-sharing link", body: "Assets include private files and access grants. Actors include owners, invited users, anonymous link holders, and support staff. The share-token boundary exposes guessing, replay, leakage through logs, and overbroad revocation.", consequence: "Controls become concrete: high-entropy tokens, scoped grants, expiry, redacted logs, owner-visible audit, rate limits, and tested revocation." },
    tradeoffs: [{ option: "Capability link", chooseWhen: "Low-friction delegated access is a requirement.", cost: "Possession grants authority, so leakage and revocation matter." }, { option: "Account membership", chooseWhen: "Identity, audit, and durable revocation dominate.", cost: "Higher onboarding and recovery friction." }, { option: "Network boundary", chooseWhen: "A service is genuinely internal and network identity is controlled.", cost: "Network location alone is not user authorization." }],
    failure: { failure: "The diagram omits an administrative or asynchronous path.", impact: "A privileged or replayable flow escapes the reviewed controls.", detection: "Runtime inventory, logs, and data-flow review reveal actors or writes absent from the model.", mitigation: "Treat undocumented boundaries as findings, enumerate background and support actors, and bind mitigations to executable acceptance tests.", tradeoff: "Maintaining the model costs review time but exposes assumptions before they become incidents." },
    exercise: ["List three assets and why an attacker values each.", "Mark every trust boundary and privileged actor.", "Write one abuse path for identity, integrity, confidentiality, and availability.", "Turn each chosen mitigation into a testable requirement."],
    probes: ["What changes when support staff can impersonate a user?", "Where can secrets or personal data enter logs?", "Which accepted threat needs an explicit owner and review date?"],
    practice: ["cloud-file-storage", "api-gateway-system", "payment-system"],
    remember: "Threat modeling connects assets and boundaries to credible abuse paths, owned responses, and testable controls.",
  },
  "cost-efficiency": {
    id: "cost-efficiency",
    decision: "Express cost in workload units—requests, stored bytes, transferred bytes, retained history, and provisioned headroom—then optimize the dominant driver without violating reliability targets.",
    mechanism: ["Estimate steady and peak demand with growth and retention.", "Map each request to compute, storage operations, replication, and network transfer.", "Separate fixed baseline cost from demand-shaped variable cost.", "Measure cost per useful product unit and attribute it to owners.", "Use caching, batching, lifecycle policy, tiering, or autoscaling only where the model predicts material savings."],
    diagram: { title: "Cost-driver worksheet", description: "Traffic fans into compute, storage, and transfer drivers that combine with reliability headroom into cost per useful outcome.", chart: `flowchart LR
  A[Requests and events] --> B[Compute seconds]
  A --> C[Storage operations]
  A --> D[Network bytes]
  C --> E[Retained bytes]
  B --> F[Capacity plus headroom]
  D --> G[Cross-zone or egress]
  E --> H[Cost per outcome]
  F --> H
  G --> H` },
    example: { title: "Image delivery", body: "Ten million daily image views average 100 KB. Origin egress dominates if every view misses, so the design models cache hit rate, regional transfer, transformation compute, and retained variants rather than merely counting servers.", consequence: "A CDN and bounded rendition set target the dominant bytes while origin headroom and failure behavior remain explicit." },
    tradeoffs: [{ option: "Precompute", chooseWhen: "Many reads reuse the same expensive result.", cost: "Storage, invalidation, and unused work." }, { option: "Compute on demand", chooseWhen: "Requests are sparse or highly personalized.", cost: "Latency and burst capacity." }, { option: "Managed service", chooseWhen: "Operational leverage outweighs unit premium.", cost: "Provider pricing dimensions and portability." }],
    failure: { failure: "Autoscaling reacts after a burst while minimum capacity is too small.", impact: "Latency and errors rise even though the steady-state cost model looks efficient.", detection: "Queue age, throttling, cold-start latency, saturation, and cost per completed request.", mitigation: "Model provisioning time, buffer or throttle demand, keep justified headroom, and load-test the scaling control loop.", tradeoff: "Headroom costs money; insufficient headroom spends the error budget." },
    exercise: ["Choose the useful unit: request, active user, processed GB, or completed job.", "Estimate peak compute, retained bytes, operations, and egress.", "Identify the largest and fastest-growing driver.", "State which reliability target prevents further cost reduction."],
    probes: ["When does a cache increase total cost?", "How does cross-region replication change the model?", "What metric detects expensive work that produces no user value?"],
    practice: ["video-streaming", "metrics-platform", "image-hosting"],
    remember: "Optimize cost per useful outcome from a measured workload model, with reliability and provisioning time included.",
  },
  "operational-ownership": {
    id: "operational-ownership",
    decision: "Every production component needs a named team that can deploy, observe, respond, migrate, and retire it; shared infrastructure still requires explicit service boundaries.",
    mechanism: ["Name the owning team and the user-facing promise.", "Define dashboards, alerts, runbooks, access, and escalation paths.", "Assign deploy, configuration, dependency, data, and incident responsibilities.", "Review readiness before launch and rehearse recovery.", "Transfer or retire ownership with documentation, training, access, and a dated handoff."],
    diagram: { title: "Ownership map", description: "A service owner coordinates deploy, observe, respond, migrate, and retire responsibilities with platform and dependency owners.", chart: `flowchart TB
  O[Service owner] --> D[Deploy and rollback]
  O --> M[Monitor and alert]
  O --> I[Incident response]
  O --> G[Data migration]
  O --> R[Deprecation]
  P[Platform owner] --> O
  X[Dependency owner] --> O` },
    example: { title: "Notification service", body: "The product team owns templates and user preferences; the messaging platform team owns queues and worker runtime; a delivery team owns provider integrations and bounce handling. One severity matrix names who commands cross-boundary incidents.", consequence: "No alert or migration lands in a gap between teams, and handoffs include permissions plus executable recovery knowledge." },
    tradeoffs: [{ option: "Product-team ownership", chooseWhen: "Domain behavior changes frequently and tight feedback matters.", cost: "Operational expertise may be uneven." }, { option: "Platform ownership", chooseWhen: "Many services share a stable capability.", cost: "Queueing, abstraction, and priority conflicts." }, { option: "Shared rotation", chooseWhen: "A transition or coupled boundary genuinely requires both teams.", cost: "Ambiguous command unless responsibilities are explicit." }],
    failure: { failure: "A provider credential expires and every team assumes another team owns renewal.", impact: "Delivery stops while responders search for access and decision authority.", detection: "Unowned alerts, stale runbooks, expired access reviews, and incidents with repeated escalations.", mitigation: "Keep a component ownership map, expiration alerts, named primary and secondary rotations, and readiness checks that fail on missing owners.", tradeoff: "Ownership metadata needs upkeep; missing ownership creates much larger incident toil." },
    exercise: ["Map every stateful or externally managed component to one accountable team.", "Name deploy, rollback, on-call, data, and deprecation owners.", "Identify the highest-risk cross-team dependency.", "Define the evidence required before an ownership transfer completes."],
    probes: ["Who owns a shared schema migration?", "What happens when the owning team is unavailable?", "How do you retire a component without leaving data or alerts behind?"],
    practice: ["notification-service", "cicd-platform", "api-gateway-system"],
    remember: "A box in a diagram is production-ready only when somebody can deploy, observe, recover, migrate, and retire it.",
  },
};

export function PlatformOperationsLessonContent({ lessonId }: { lessonId: string }) {
  const spec = lessons[lessonId];
  return spec ? <RequiredClosureLesson spec={spec} /> : null;
}
