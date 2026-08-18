import Link from "next/link";
import { ConsumerGroupDemo } from "@/components/consumer-group-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { MessagingLessonEnd } from "./shared";

const partitionFlow = `flowchart LR
  T[Topic] --> P0[Partition 0]
  T --> P1[Partition 1]
  T --> P2[Partition 2]
  T --> P3[Partition 3]`;
const consumerFallback = `flowchart LR
  P0[P0] --> A[Consumer A]
  P1[P1] --> A
  P2[P2] --> B[Consumer B]
  P3[P3] --> B`;
const duplicateSequence = `sequenceDiagram
  participant B as Broker
  participant C as Consumer
  participant D as Database
  B->>C: OrderPaid evt_123
  C->>D: write succeeds
  C-xB: crashes before ACK
  B->>C: redelivery
  C->>D: duplicate write attempt`;

export function PartitionsLessonContent() { return <>
  <LessonHeading level={2} id="parallel-logs">Partitions trade global order for parallelism</LessonHeading><p>One ordered log limits parallel work. Splitting a topic across partitions distributes storage and throughput, but order is now scoped to each partition.</p><MermaidDiagram chart={partitionFlow} title="A topic split into four partitions" description="One topic distributes records across four independent ordered partitions." />
  <p>Choose a key around the entity that needs locality: <code>conversation_id</code> for chat or <code>account_id</code> for account events. A country key where the US produces 70% of traffic can create a hot partition.</p><LessonCallout variant="tradeoff"><p>Partition by the unit that needs ordering while preserving enough cardinality for load distribution. More partitions add parallelism and operational cost.</p></LessonCallout><MessagingLessonEnd id="partitions" practice={["chat-system", "metrics-platform", "kafka-platform"]}>Partitions create parallelism, but ordering exists only inside a partition. The key must balance entity locality against hotspots.</MessagingLessonEnd>
  </>; }

export function ConsumerGroupsLessonContent() { return <>
  <LessonHeading level={2} id="divide-partitions">A group divides partition ownership</LessonHeading><p>Within one Kafka-style consumer group, partitions are assigned across members so the group processes in parallel. Four partitions allow at most four active partition owners at an instant; extra members wait idle.</p><ConsumerGroupDemo /><MermaidDiagram chart={consumerFallback} title="Static two-consumer assignment" description="Consumer A owns partitions zero and one, while Consumer B owns partitions two and three." /><p>Membership changes require reassignment—a rebalance—which may interrupt processing and can repeat work near commit boundaries.</p><MessagingLessonEnd id="consumer-groups" practice={["kafka-platform", "metrics-platform", "event-analytics"]}>Consumer groups scale until partition parallelism is exhausted; joins and failures reassign ownership.</MessagingLessonEnd>
  </>; }

export function MessageOrderingLessonContent() { return <>
  <LessonHeading level={2} id="order-the-entity">Preserve the sequence that carries business meaning</LessonHeading><pre><code>{`Order 42: Created → Paid → Shipped → Cancelled`}</code></pre><p>Randomly sending these events to independent partitions can expose them out of expected order. Keying by <code>order_id</code> keeps one order in one partition, preserving partition sequence under the relevant broker and producer semantics.</p><TradeoffTable><table><thead><tr><th>Guarantee</th><th>Scope</th><th>Cost</th></tr></thead><tbody><tr><td>Global order</td><td>Every event</td><td>Coordination and limited parallelism</td></tr><tr><td>Partition order</td><td>One partition</td><td>No order across partitions</td></tr><tr><td>Entity order</td><td>One keyed entity</td><td>Hot entities and key discipline</td></tr></tbody></table></TradeoffTable><p>Retries, multiple producers, concurrent application handlers, and external side effects can still disturb observed business order.</p><MessagingLessonEnd id="message-ordering" practice={["chat-system", "payment-system", "kafka-platform"]}>Ask which entity needs order, key it consistently, and avoid claiming a global sequence across partitions.</MessagingLessonEnd>
  </>; }

export function DeliverySemanticsLessonContent() { return <>
  <LessonHeading level={2} id="ambiguous-boundary">Failure makes completion ambiguous</LessonHeading><TradeoffTable><table><thead><tr><th>Model</th><th>Possible attempts</th><th>Trade-off</th></tr></thead><tbody><tr><td>At-most-once</td><td>Zero or one</td><td>No retry duplicate, but work may be lost</td></tr><tr><td>At-least-once</td><td>One or more</td><td>Retries preserve work under assumptions; duplicates possible</td></tr><tr><td>Exactly-once</td><td>Scoped coordinated boundary</td><td>Requires explicit supported system and side-effect boundary</td></tr></tbody></table></TradeoffTable><MermaidDiagram chart={duplicateSequence} title="Side effect succeeds before acknowledgement fails" description="The consumer writes the database, crashes before acknowledging, then receives the message again and risks a duplicate write." />
  <p>Kafka transactions can coordinate supported Kafka read–process–write workflows. A call from a Kafka consumer to an external payment provider still needs application-level idempotency.</p><CommonMistakes><ul><li>Claiming acknowledgements eliminate duplicates.</li><li>Saying “exactly once” without naming the boundary.</li><li>Ignoring redelivery after a successful side effect.</li></ul></CommonMistakes><MessagingLessonEnd id="delivery-semantics" practice={["payment-system", "notification-service", "kafka-platform"]}>At-least-once delivery requires duplicate-safe processing; exactly-once claims are meaningful only inside a defined coordinated boundary.</MessagingLessonEnd>
  </>; }

export function IdempotentConsumersLessonContent() { return <>
  <LessonHeading level={2} id="repeat-safe">Make the business effect safe to repeat</LessonHeading><pre><code>{`{ eventId: "evt_123", orderId: "order_42", type: "OrderPaid" }`}</code></pre><p>A consumer can record the event ID, enforce a business-level unique constraint, or use an idempotency key. The dedupe record and side effect need one atomic boundary where possible; a naïve read-then-write check races under concurrent delivery.</p><WorkedExample title="Send one receipt"><pre><code>{`BEGIN
INSERT processed_events(event_id) VALUES ('evt_123')
  -- unique constraint rejects duplicates
INSERT receipt_jobs(order_id) VALUES ('order_42')
COMMIT`}</code></pre><p>The exact schema differs, but the invariant is one committed business effect for the event identity.</p></WorkedExample><p>Retention must cover the redelivery/replay window without growing forever. See the later <Link href="/system-design/patterns/idempotency">Idempotency lesson</Link> for the full reliability treatment.</p><MessagingLessonEnd id="idempotent-consumers" practice={["payment-system", "notification-service", "ecommerce"]}>Duplicate detection and the business side effect must be coordinated; read-then-write dedupe alone is not race-safe.</MessagingLessonEnd>
  </>; }

export function MessageRetriesLessonContent() { return <>
  <LessonHeading level={2} id="retry-with-space">Space retries so failure can recover</LessonHeading><pre><code>{`1s → 2s → 4s → 8s → … + jitter`}</code></pre><p>Immediate retries amplify a slow dependency and can reorder or duplicate work. Bound attempts, add randomized delay, preserve attempt metadata, and move permanently failing messages to an owned remediation path.</p><TradeoffTable><table><thead><tr><th>Often retryable</th><th>Usually requires correction</th></tr></thead><tbody><tr><td>Timeout, temporary unavailable, rate limit</td><td>Malformed payload, invalid schema</td></tr><tr><td>Transient network failure</td><td>Permanent missing resource or denied authorization</td></tr></tbody></table></TradeoffTable><p>Classification is contextual. Cross-link to <Link href="/system-design/patterns/retries">Retries, Exponential Backoff and Jitter</Link> for deeper budgets and storm prevention.</p><MessagingLessonEnd id="message-retries" practice={["notification-service", "payment-system", "web-crawler"]}>Retry only plausible transient failures, with bounded exponential backoff, jitter, observability, and duplicate-safe effects.</MessagingLessonEnd>
  </>; }
