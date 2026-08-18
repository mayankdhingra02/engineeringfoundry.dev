import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FailureDeepDive, FormulaBlock, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { ReliabilityLessonEnd } from "./shared";

const twoPc = `sequenceDiagram
  participant C as Coordinator
  participant A as DB A
  participant B as DB B
  C->>A: PREPARE
  C->>B: PREPARE
  A-->>C: YES
  B-->>C: YES
  C->>A: COMMIT
  C->>B: COMMIT`;
const saga = `flowchart LR
  O[Order saga] --> I[Reserve inventory]
  I --> P[Capture payment]
  P --> S[Arrange shipping]
  P -. failure .-> CI[Release inventory]`;
const regions = `flowchart TD
  G[Global traffic routing] --> A[Region A API]
  G --> B[Region B API]
  A --> DA[(DB A)]
  B --> DB[(DB B)]
  DA <-- replication --> DB`;
const activePassive = `flowchart LR
  U[Users] --> A[Active Region A]
  A -- replication --> B[Standby Region B]
  B -. failover target .-> U`;
const activeActive = `flowchart LR
  UA[Americas users] --> A[Region A]
  UE[Europe users] --> B[Region B]
  A <-- replication / conflict policy --> B`;
const dr = `flowchart LR
  P[(Production data)] --> R[(Replicated state)]
  P --> B[(Point-in-time backups)]
  R --> F[Availability failover]
  B --> X[Restore after deletion or corruption]`;
const synthesis = `flowchart TD
  C[Client] --> A[API]
  A --> K[(Cache)]
  A --> D[(Database)]
  A --> R[Recommendation]
  A --> Q[(Broker)]`;

export function DistributedTransactionsLessonContent() { return <>
  <LessonHeading level={2} id="one-business-outcome">Independent systems fail at different points</LessonHeading><p>A booking reserves a seat, charges payment, and creates a ticket. If ticket creation fails after the first two succeed, the business outcome spans services and databases that do not share one local transaction.</p><TradeoffTable><table><thead><tr><th>Local transaction</th><th>Distributed operation</th></tr></thead><tbody><tr><td>One database controls commit</td><td>Participants fail independently</td></tr><tr><td>Rollback within one boundary</td><td>Network ambiguity and irreversible effects</td></tr><tr><td>Simpler correctness boundary</td><td>Coordination or compensation required</td></tr></tbody></table></TradeoffTable><p>Prefer one transactional boundary when requirements allow. Distribution is a business and scaling choice, not a default upgrade.</p><ReliabilityLessonEnd id="distributed-transactions" practice={["ticketmaster", "payment-system", "checkout-system"]}>A distributed transaction is a business invariant across independently failing systems. First ask whether the boundary can remain local.</ReliabilityLessonEnd>
  </>; }

export function TwoPhaseCommitLessonContent() { return <>
  <LessonHeading level={2} id="prepare-then-decide">Participants prepare before the coordinator decides</LessonHeading><MermaidDiagram chart={twoPc} title="Two-phase commit happy path" description="A coordinator asks two databases to prepare; after both vote yes, it tells both to commit." /><p>In prepare, each participant promises it can commit and may hold resources. In the second phase, the coordinator records and sends commit or abort. If the coordinator is unavailable after participants prepare, those participants may wait for the decision, affecting latency and availability.</p><p>2PC adds coordination, resource holding, participant availability requirements, and operational complexity. It is not consensus, and a Saga is not merely an asynchronous 2PC.</p><ReliabilityLessonEnd id="two-phase-commit" practice={["payment-system", "ticketmaster"]}>2PC coordinates one commit decision through prepare and commit/abort phases; prepared participants can block while the decision is unavailable.</ReliabilityLessonEnd>
  </>; }

export function SagaLessonContent() { return <>
  <LessonHeading level={2} id="compensate-workflow">Compensation is a new business action, not rollback</LessonHeading><p>A Saga decomposes a workflow into local transactions. If a later step fails, compensating actions restore an acceptable business state: cancel a reservation, release inventory, or refund a captured payment.</p><MermaidDiagram chart={saga} title="Orchestrated order Saga with compensation" description="An order saga reserves inventory, captures payment, and arranges shipping; payment failure releases inventory." /><TradeoffTable><table><thead><tr><th>Orchestration</th><th>Choreography</th></tr></thead><tbody><tr><td>Central workflow state and commands</td><td>Services react to events</td></tr><tr><td>Flow visible in one place</td><td>Looser runtime coupling</td></tr><tr><td>Orchestrator owns coupling</td><td>Global flow, cycles, and debugging get harder</td></tr></tbody></table></TradeoffTable><p>A card charge followed by a refund still happened. Compensation can fail, events can duplicate, and a timed-out step may have succeeded; persist workflow state and make steps idempotent.</p><InterviewFollowUps><ul><li>Which effects are irreversible?</li><li>How does failed compensation retry or escalate?</li><li>How does the workflow resume after a crash?</li><li>What happens if the user cancels mid-flow?</li></ul></InterviewFollowUps><ReliabilityLessonEnd id="saga" practice={["checkout-system", "payment-system", "ticketmaster"]}>A Saga coordinates local transactions and semantic compensation. It provides workflow-level recovery, not an ACID transaction across services.</ReliabilityLessonEnd>
  </>; }

export function MultiRegionLessonContent() { return <>
  <LessonHeading level={2} id="requirements-first">A second region must satisfy a named requirement</LessonHeading><p>Regions can reduce user latency, provide a recovery domain, address data residency, or add capacity. They also introduce replication delay, routing, conflicts, data locality, failover, and significant operational cost.</p><MermaidDiagram chart={regions} title="Two-region architecture baseline" description="Global routing sends traffic to APIs in Regions A and B, whose databases replicate between regions." /><p>A user updates <code>name = May</code> in Region A; before replication reaches B, a read in B may still return <code>Maya</code>. The design must choose write ownership, conflict behavior, and whether session routing or another mechanism provides read-your-writes.</p>
  <WorkedExample title="Failover capacity is not implied by redundancy"><AssumptionBox><pre><code>{`Region A capacity = 60K RPS; normal = 40K
Region B capacity = 60K RPS; normal = 40K`}</code></pre></AssumptionBox><FormulaBlock title="Traffic after A fails">{`40K + 40K = 80K RPS demand
80K - 60K = 20K RPS beyond B's capacity`}</FormulaBlock><p>The surviving region needs headroom, tested scaling, degradation, or shedding. A second region does not automatically make failover viable.</p></WorkedExample><ReliabilityLessonEnd id="multi-region" practice={["chat-system", "news-feed", "payment-system", "cloud-file-storage"]}>Add regions only for explicit latency, residency, capacity, or recovery requirements—and design replication, routing, consistency, and survivor capacity.</ReliabilityLessonEnd>
  </>; }

export function ActivePassiveActiveActiveLessonContent() { return <>
  <LessonHeading level={2} id="serve-or-standby">Serving from both regions changes the write problem</LessonHeading><MermaidDiagram chart={activePassive} title="Active-passive regions" description="Users use active Region A; state replicates to standby Region B, which is a failover target." /><p>Active-passive often keeps simpler write ownership, but pays for standby capacity, accepts failover time, and may lose lagging changes under some failures.</p><MermaidDiagram chart={activeActive} title="Active-active regions" description="Americas and Europe users use local regions, which replicate with an explicit conflict policy." /><p>Active-active can improve latency and capacity use but makes multi-region writes, conflict, routing, and operations harder. Alternatives include one home region per entity, accepting writes in multiple regions with a defined conflict strategy, or partitioning ownership by region.</p><ReliabilityLessonEnd id="active-passive-active-active" practice={["chat-system", "payment-system", "news-feed"]}>Active-active is not automatically better. Choose from write ownership, latency, consistency, failover time, conflict semantics, and operational cost.</ReliabilityLessonEnd>
  </>; }

export function DisasterRecoveryLessonContent() { return <>
  <LessonHeading level={2} id="restore-after-disaster">Availability copies are not historical recovery</LessonHeading><p>High availability tries to keep service running through expected failures. Disaster recovery restores service and data after severe events such as region loss, accidental deletion, corruption, ransomware, or operator error.</p><MermaidDiagram chart={dr} title="Replication and backup protect different failures" description="Production data feeds replicated state for availability and point-in-time backups for restoration after deletion or corruption." /><p>Replication can faithfully copy <code>DELETE important_table</code> or corruption everywhere. Snapshots, continuous or log-based backups, cross-region copies, cold or warm standby, and documented recovery procedures protect different scenarios.</p><LessonCallout variant="tradeoff"><p>A backup strategy that has never completed a representative restore is not well validated. Test restores and regional failover drills.</p></LessonCallout><ReliabilityLessonEnd id="disaster-recovery" practice={["payment-system", "cloud-file-storage", "key-value-store"]}>Replication supports availability; point-in-time backups protect historical state. Recovery is only credible when restore and failover procedures are tested.</ReliabilityLessonEnd>
  </>; }

export function RpoRtoLessonContent() { return <>
  <LessonHeading level={2} id="business-objectives">Recovery targets come from business tolerance</LessonHeading><TradeoffTable><table><thead><tr><th>Objective</th><th>Question</th><th>Illustrative target</th></tr></thead><tbody><tr><td>RPO</td><td>How much recent data loss can the business tolerate?</td><td>5 minutes</td></tr><tr><td>RTO</td><td>How long may recovery take?</td><td>30 minutes</td></tr></tbody></table></TradeoffTable><p>These are objectives for a specified disaster scenario, not unconditional guarantees. A payment ledger may require a very low RPO; an internal analytics dashboard may tolerate hours. Lower targets generally increase replication, standby, automation, testing, and operational cost.</p><CommonMistakes><ul><li>Claiming “zero loss and instant recovery” without a failure model.</li><li>Using one RPO/RTO for every product capability.</li><li>Confusing data-loss tolerance with downtime tolerance.</li></ul></CommonMistakes><ReliabilityLessonEnd id="rpo-rto" practice={["payment-system", "cloud-file-storage", "metrics-platform"]}>RPO bounds intended data-loss exposure; RTO bounds intended recovery time for a defined scenario. Both are business objectives that shape architecture and cost.</ReliabilityLessonEnd>
  </>; }

export function PartialFailureLessonContent() { return <>
  <LessonHeading level={2} id="prioritized-review">Review the important failures, not every imaginable one</LessonHeading><MermaidDiagram chart={synthesis} title="Dependencies for a partial-failure review" description="An API depends independently on a cache, database, recommendation service, and message broker." /><FailureDeepDive failure="Cache cluster unavailable" impact="Database demand may jump far beyond safe capacity" detection="Cache error rate rises while database load and tail latency follow" mitigation="Serve bounded stale local data, rate-limit misses, and shed optional work" tradeoff="Users may see stale results and some uncached requests fail" />
  <TradeoffTable><table><thead><tr><th>Failure</th><th>Reasoning path</th></tr></thead><tbody><tr><td>Recommendation unavailable</td><td>Remove optional module; preserve core response</td></tr><tr><td>Replica lags</td><td>State the consistency and session behavior</td></tr><tr><td>Broker unavailable</td><td>Decide whether the request can commit; consider the <Link href="/system-design/fundamentals/transactional-outbox">outbox</Link> only when requirements fit</td></tr><tr><td>Region disappears</td><td>Route, capacity, replication lag, sessions, RPO/RTO</td></tr></tbody></table></TradeoffTable><p>For each: normal behavior → failure or ambiguity → impact → detection → containment → recovery → new trade-off. Prioritize failures that threaten the core product or cause cascading load.</p><ReliabilityLessonEnd id="partial-failure" practice={["ecommerce", "news-feed", "payment-system", "chat-system"]}>A strong design names the highest-impact partial failures and traces containment, recovery, and trade-offs—not a generic promise to add redundancy.</ReliabilityLessonEnd>
  </>; }
