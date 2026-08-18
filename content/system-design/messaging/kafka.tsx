import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { MessagingLessonEnd } from "./shared";

const kafkaArchitecture = `flowchart LR
  P[Producers] --> T[Kafka topic]
  T --> P0[Partition 0]
  T --> P1[Partition 1]
  T --> P2[Partition 2]
  P0 --> A[Consumer A]
  P1 --> A
  P2 --> B[Consumer B]`;
const kafkaReplication = `flowchart LR
  L[Partition 0 leader · Broker A] --> R1[Replica · Broker B]
  L --> R2[Replica · Broker C]`;

export function KafkaFundamentalsLessonContent() { return <>
  <LessonHeading level={2} id="concepts-packaged">Kafka packages the concepts you already learned</LessonHeading><p>Kafka is a distributed retained event-log platform built from clusters, brokers, topics, partitions, producers, consumers, consumer groups, offsets, retention, and replication. It makes sense only after streams and partition-scoped ordering do.</p><MermaidDiagram chart={kafkaArchitecture} title="Kafka topic and consumer group" description="Producers append to three topic partitions; two members of one consumer group divide partition ownership." />
  <p>Records remain according to retention or compaction policy rather than disappearing because one group consumed them. Independent groups can read the same history and track their own positions.</p><WorkedExample title="Estimate raw event ingress"><AssumptionBox><pre><code>{`20,000 events/sec
2 KB average event`}</code></pre></AssumptionBox><FormulaBlock title="Raw ingress and daily volume">{`20,000 × 2 KB ≈ 40 MB/sec
40 MB/sec × 86,400 ≈ 3.46 TB/day`}</FormulaBlock><p>This excludes replication, indexes/metadata, compression, and protocol overhead. Partition count depends on measured producer and consumer throughput, hardware, record size, replication, latency, and headroom—not a universal MB/sec constant.</p></WorkedExample><CommonMistakes><ul><li>Saying “use Kafka” without a replay, retention, consumer, or ordering requirement.</li><li>Claiming global topic order.</li><li>Assuming retained means forever.</li></ul></CommonMistakes><MessagingLessonEnd id="kafka" practice={["kafka-platform", "metrics-platform", "event-analytics"]}>Kafka is a retained partitioned log; the interview decisions are partitioning, ordering, retention, consumer scaling, recovery, and whether replay is needed.</MessagingLessonEnd>
  </>; }

export function KafkaPartitionsReplicationLessonContent() { return <>
  <LessonHeading level={2} id="leaders-replicas">Partitions provide parallelism; replicas provide failure tolerance</LessonHeading><p>A keyed producer selects a partition according to its partitioning strategy. Records in one partition have offsets and partition order; there is no total order across <code>orders-0</code>, <code>orders-1</code>, and <code>orders-2</code>.</p><MermaidDiagram chart={kafkaReplication} title="One Kafka partition with replicas" description="Broker A leads partition zero while Brokers B and C hold replicas." /><p>Producer acknowledgement settings and the in-sync replication state affect latency and durability. Replication supports recovery subject to configuration; it is not an unconditional no-loss promise.</p><LessonCallout variant="interview-tip"><p>Use <code>order_id</code> when per-order sequence matters, then discuss a celebrity or hot account that can overload one partition.</p></LessonCallout><MessagingLessonEnd id="kafka-partitions-replication" practice={["kafka-platform", "metrics-platform", "event-analytics"]}>Kafka preserves order within a partition; replication and producer acknowledgements define the failure and durability trade-off.</MessagingLessonEnd>
  </>; }

export function KafkaConsumerGroupsOffsetsLessonContent() { return <>
  <LessonHeading level={2} id="positions-and-rebalance">Offsets make progress explicit</LessonHeading><pre><code>{`Partition 0
offset 40 → A
offset 41 → B
offset 42 → C`}</code></pre><p>A group tracks processed or committed positions per partition. Restart can resume, deliberate rewind can replay, and lag measures distance from the latest available offset.</p><WorkedExample title="Measure consumer lag"><pre><code>{`latest offset   = 1,000,000
group position  =   980,000
lag             ≈    20,000 records`}</code></pre><p>Lag is workload, not time by itself. Combine it with record rate and oldest-event age.</p></WorkedExample><p>When a consumer joins, leaves, or crashes, partitions are reassigned. Rebalancing can pause work and repeat processing near an offset-commit boundary.</p><MessagingLessonEnd id="kafka-consumer-groups-offsets" practice={["kafka-platform", "metrics-platform", "event-analytics"]}>Offsets track group progress and enable resume, replay, and lag measurement; membership changes require partition reassignment.</MessagingLessonEnd>
  </>; }

export function KafkaDeliveryGuaranteesLessonContent() { return <>
  <LessonHeading level={2} id="processing-boundary">Kafka guarantees require configuration and scope</LessonHeading><p>At-least-once processing is common when a consumer performs a side effect before committing its offset. Producer retries, idempotent producer behavior, transactions, and offset commits influence duplicates and ordering.</p><TradeoffTable><table><thead><tr><th>Boundary</th><th>Useful mechanism</th><th>Still unresolved</th></tr></thead><tbody><tr><td>Producer → Kafka</td><td>Acknowledgements and idempotent production</td><td>Application request identity</td></tr><tr><td>Kafka → Kafka</td><td>Transactions for supported read/process/write workflows</td><td>External systems</td></tr><tr><td>Kafka → database/payment</td><td>Idempotent consumer and transactional state</td><td>Cross-system side-effect coordination</td></tr></tbody></table></TradeoffTable><LessonCallout variant="common-mistake"><p>Do not say “Kafka guarantees exactly once.” State the supported Kafka processing boundary and how every external side effect becomes duplicate-safe.</p></LessonCallout><MessagingLessonEnd id="kafka-delivery-guarantees" practice={["kafka-platform", "payment-system", "event-analytics"]}>Kafka delivery and processing behavior depends on producer, transaction, consumer, and offset choices; exactly-once is never a boundary-free claim.</MessagingLessonEnd>
  </>; }

export function KafkaVsQueuesLessonContent() { return <>
  <LessonHeading level={2} id="history-vs-dispatch">Retained history or work dispatch?</LessonHeading><TradeoffTable><table><thead><tr><th>Requirement</th><th>Kafka often fits</th><th>Traditional queue often fits</th></tr></thead><tbody><tr><td>Replay and retained history</td><td>Central capability</td><td>May be secondary or limited</td></tr><tr><td>Many independent readers</td><td>Consumer groups</td><td>Subscriptions may provide it</td></tr><tr><td>Work dispatch</td><td>Possible, with partition model</td><td>Natural competing-consumer model</td></tr><tr><td>Delay, priority, per-message lease</td><td>Not the primary abstraction</td><td>Often natural</td></tr><tr><td>Ordering</td><td>Partition-scoped</td><td>Product and queue-type dependent</td></tr></tbody></table></TradeoffTable><p>Kafka is not “better.” Use it when event history, replay, throughput, keyed ordering, and independent groups justify its operational model.</p><MessagingLessonEnd id="kafka-vs-queues" practice={["kafka-platform", "job-scheduler", "notification-service"]}>Choose Kafka for retained partitioned history and replay; choose a queue when straightforward work ownership is the central problem.</MessagingLessonEnd>
  </>; }

export function RabbitMqSqsLessonContent() { return <>
  <LessonHeading level={2} id="requirement-comparison">Interview-level RabbitMQ, SQS, and Kafka framing</LessonHeading><TradeoffTable><table><thead><tr><th>System</th><th>Primary interview model</th><th>Notable decision</th></tr></thead><tbody><tr><td>RabbitMQ</td><td>Broker, exchanges/routing, queues, acknowledgements</td><td>Routing topology and broker operations</td></tr><tr><td>Amazon SQS</td><td>Managed queue and visibility timeout</td><td>Operational simplicity, queue type, redelivery</td></tr><tr><td>Kafka</td><td>Retained partitioned log, offsets, groups</td><td>Replay, retention, partition key</td></tr></tbody></table></TradeoffTable><p>RabbitMQ is commonly approached as routing and work delivery; SQS as a managed work queue; Kafka as retained event history. All have broader capabilities and overlap, so decide from semantics rather than marketing throughput.</p><MessagingLessonEnd id="rabbitmq-sqs" practice={["notification-service", "job-scheduler", "kafka-platform"]}>Compare routing, ownership, retention, replay, ordering, acknowledgement, and operating model—not product slogans.</MessagingLessonEnd>
  </>; }

export function FlinkBridgeLessonContent() { return <>
  <LessonHeading level={2} id="stateful-computation">Kafka transports history; Flink computes over streams</LessonHeading><pre><code>{`Kafka → Flink → Database / Search / Another Topic`}</code></pre><p>Flink supports stateful stream processing, windows, event time, watermarks that represent event-time progress, and checkpoints for recoverable operator state. This bridge intentionally stops before APIs and topology internals.</p><TradeoffTable><table><thead><tr><th>Concept</th><th>Purpose</th></tr></thead><tbody><tr><td>Stateful operator</td><td>Remember data across events</td></tr><tr><td>Window</td><td>Aggregate a bounded time/key scope</td></tr><tr><td>Event time</td><td>Reason from when events occurred</td></tr><tr><td>Watermark</td><td>Estimate event-time progress amid late data</td></tr><tr><td>Checkpoint</td><td>Recover processing state and source positions</td></tr></tbody></table></TradeoffTable><p>Flink is Advanced for generic SWE, Important for infrastructure/streaming, and Must Know for many data-engineering roles. It is not required to understand Kafka.</p><MessagingLessonEnd id="flink" practice={["event-analytics", "metrics-platform", "kafka-platform"]}>Use a stateful stream processor only when windows, event time, recoverable state, or continuous computation justify it; Kafka alone does not require Flink.</MessagingLessonEnd>
  </>; }
