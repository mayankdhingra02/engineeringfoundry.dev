import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { MessagingLessonEnd } from "./shared";

const dlqFlow = `flowchart LR
  Q[Main queue] --> C[Consumer]
  C -->|failure| R[Bounded retries]
  R -->|exhausted| D[Dead-letter queue]
  D --> O[Inspect, remediate, redrive]`;
const eventFlow = `flowchart LR
  O[Order service] -->|OrderPlaced| B[Event bus]
  B --> N[Notification]
  B --> A[Analytics]
  B --> F[Fulfillment]`;
const outboxFlow = `sequenceDiagram
  participant O as Order Service
  participant D as Database
  participant R as Outbox Relay
  participant B as Broker
  O->>D: BEGIN
  O->>D: INSERT order
  O->>D: INSERT outbox row
  O->>D: COMMIT
  R->>D: read unpublished rows
  R->>B: publish OrderCreated
  B-->>R: accepted`;
const cdcFlow = `flowchart LR
  D[(Database)] --> L[Change log]
  L --> C[CDC connector]
  C --> S[Event stream]
  S --> I[Search index]
  S --> A[Analytics]
  S --> W[Warehouse]`;

export function DeadLetterQueuesLessonContent() { return <>
  <LessonHeading level={2} id="escape-hatch">Repeated failure needs an owned escape hatch</LessonHeading><MermaidDiagram chart={dlqFlow} title="Retry exhaustion and dead-letter handling" description="A consumer retries a failed message a bounded number of times, then isolates it for inspection, remediation, and safe redrive." /><p>A DLQ needs maximum attempts, original payload and metadata, retention, alerts, ownership, diagnosis, and a safe replay process. Moving a message is not resolution.</p><InterviewFollowUps><ul><li>Who monitors the DLQ?</li><li>Can replay preserve ordering?</li><li>How are corrected messages redriven safely?</li><li>When should one poison job halt a sequence?</li></ul></InterviewFollowUps><MessagingLessonEnd id="dead-letter-queues" practice={["notification-service", "job-scheduler", "payment-system"]}>A DLQ isolates retry-exhausted messages only; operators still need to diagnose, repair, and replay them safely.</MessagingLessonEnd>
  </>; }

export function DeduplicationLessonContent() { return <>
  <LessonHeading level={2} id="input-vs-effect">Repeated input and repeated effect are different problems</LessonHeading><p>Deduplication detects a repeated event ID or business key. Idempotency ensures repeating an operation does not create an unintended second effect. A service may dedupe within a time window yet still need a unique business constraint.</p><TradeoffTable><table><thead><tr><th>Technique</th><th>Strength</th><th>Cost</th></tr></thead><tbody><tr><td>Event-ID table</td><td>Explicit message identity</td><td>Storage and atomicity</td></tr><tr><td>Business key</td><td>Protects domain invariant</td><td>Requires correct semantic key</td></tr><tr><td>Unique constraint</td><td>Race-safe rejection</td><td>Must share the side-effect store</td></tr><tr><td>TTL record</td><td>Bounds storage</td><td>Duplicates outside window</td></tr></tbody></table></TradeoffTable><MessagingLessonEnd id="deduplication" practice={["payment-system", "notification-service", "ecommerce"]}>Deduplication recognizes repeated inputs; idempotency preserves the intended business result when an operation repeats.</MessagingLessonEnd>
  </>; }

export function BackpressureLessonContent() { return <>
  <LessonHeading level={2} id="buffer-not-cure">Buffering delays overload; it does not cure it</LessonHeading><WorkedExample title="A small sustained mismatch"><AssumptionBox><pre><code>{`Incoming = 12,000 events/sec
Processing = 10,000 events/sec`}</code></pre></AssumptionBox><FormulaBlock title="Backlog after one hour">{`(12,000 − 10,000) × 3,600
= 7,200,000 queued events`}</FormulaBlock><p>Queue depth, latency, storage, and recovery work continue growing as long as production exceeds consumption.</p></WorkedExample><p>Responses include producer throttling, bounded queues, flow control, autoscaling, batching, reducing work, pausing partition consumption, or shedding low-priority load. Each moves pressure somewhere; state where.</p><CommonMistakes><ul><li>Calling queue capacity a sustainable throughput plan.</li><li>Scaling consumers beyond partition or downstream limits.</li><li>Watching depth without oldest-event age and processing rate.</li></ul></CommonMistakes><MessagingLessonEnd id="backpressure" practice={["web-crawler", "kafka-platform", "metrics-platform"]}>A queue absorbs bursts, not infinite sustained overload. Slow production, increase safe consumption, reduce work, or reject load before backlog becomes unbounded.</MessagingLessonEnd>
  </>; }

export function EventDrivenArchitectureLessonContent() { return <>
  <LessonHeading level={2} id="facts-not-call-chains">React to facts that already happened</LessonHeading><MermaidDiagram chart={eventFlow} title="Independent reactions to OrderPlaced" description="The order service publishes an event; notification, analytics, and fulfillment react independently." /><p><code>SendEmail</code> is a command: please do this. <code>OrderPlaced</code> is an event: this happened. Keep the distinction practical rather than turning it into domain-theory ceremony.</p><p>Events loosen runtime coupling and make extension easier, while introducing eventual consistency, duplicates, ordering, tracing, testing, and schema evolution. New optional fields and backward compatibility matter because consumers upgrade at different times.</p><MessagingLessonEnd id="event-driven-architecture" practice={["notification-service", "news-feed", "event-analytics"]}>Event-driven systems gain independent consumers and asynchronous extension at the cost of delivery, schema, ordering, and debugging complexity.</MessagingLessonEnd>
  </>; }

export function EventSourcingLessonContent() { return <>
  <LessonHeading level={2} id="events-as-state">Model state as the events that produced it</LessonHeading><pre><code>{`AccountOpened  +$100
Purchase        −$20
Current balance  $80`}</code></pre><p>Event sourcing treats the event sequence as the source of truth and rebuilds current projections by replay. Snapshots can shorten recovery. Benefits include audit history and temporal reconstruction; costs include event evolution, replay, projection consistency, and substantial operating complexity.</p><LessonCallout variant="common-mistake"><p>Event-driven architecture uses events for communication. Event sourcing models system state as events. A system can use either without the other, and Kafka does not require event sourcing.</p></LessonCallout><MessagingLessonEnd id="event-sourcing" practice={["payment-system", "digital-wallet", "event-analytics"]}>Event sourcing is a state-modeling choice, not a prerequisite for event-driven architecture or Kafka.</MessagingLessonEnd>
  </>; }

export function TransactionalOutboxLessonContent() { return <>
  <LessonHeading level={2} id="dual-write">Avoid an unreliable database-plus-broker dual write</LessonHeading><p>If the order commits but event publication fails, downstream consumers never hear about it. If publication happens first and the transaction fails, consumers observe an order that does not exist.</p><MermaidDiagram chart={outboxFlow} title="Transactional outbox" description="The order and outbox row commit together in one database transaction; a relay later reads the row and publishes the event." /><p>Business state and publication intent commit atomically in one database. The relay can poll or use CDC. If it publishes and crashes before recording progress, it may publish again, so consumers remain duplicate-safe.</p><CommonMistakes><ul><li>Claiming the outbox gives global exactly-once effects.</li><li>Deleting outbox rows before broker acceptance.</li><li>Ignoring relay lag, cleanup, and partition ordering.</li></ul></CommonMistakes><MessagingLessonEnd id="transactional-outbox" practice={["payment-system", "ticketmaster", "ecommerce"]}>Commit business state and the outbox record together, then publish asynchronously; this solves the dual write, not duplicate delivery.</MessagingLessonEnd>
  </>; }

export function ChangeDataCaptureLessonContent() { return <>
  <LessonHeading level={2} id="database-log">Turn database log changes into downstream records</LessonHeading><MermaidDiagram chart={cdcFlow} title="Change Data Capture pipeline" description="A CDC connector reads the database change log and publishes records for search, analytics, and warehouse consumers." /><p>CDC supports search indexing, analytics, cache invalidation, replication, and integrations without requiring every write path to publish directly. Design for connector lag, schema changes, ordering, deletes/tombstones, and database-specific log behavior.</p><LessonCallout variant="tradeoff"><p>A row-level change describes storage mutation, not necessarily a meaningful domain event such as OrderApproved. Consumers may need translation and enrichment.</p></LessonCallout><MessagingLessonEnd id="change-data-capture" practice={["search-engine", "event-analytics", "metrics-platform"]}>CDC exposes database changes for downstream systems, but row mutations are not automatically domain events.</MessagingLessonEnd>
  </>; }
