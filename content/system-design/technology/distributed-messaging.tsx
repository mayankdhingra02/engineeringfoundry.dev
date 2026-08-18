import Link from "next/link";
import { ConsistentHashingDemo } from "@/components/consistent-hashing-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { CommonMistakes, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { ConceptFirst, TechnologyLessonEnd } from "./shared";

const cassandraArchitecture = `flowchart TD
  C[Client] --> N[Coordinator node]
  N --> H[Hash partition key to token]
  H --> A[Replica A]
  H --> B[Replica B]
  H --> D[Replica C]
  A --> R[Consistency-level response]
  B --> R
  D --> R`;
const rabbitArchitecture = `flowchart LR
  P[Producer] --> E[Exchange]
  E -->|binding / routing key| Q1[Queue A]
  E -->|binding / routing key| Q2[Queue B]
  Q1 --> C1[Consumers]
  Q2 --> C2[Consumers]`;
const sqsArchitecture = `sequenceDiagram
  participant P as Producer
  participant Q as SQS queue
  participant C as Consumer
  P->>Q: Send message
  C->>Q: Receive
  Q-->>C: Message becomes temporarily invisible
  alt processing succeeds
    C->>Q: Delete message
  else consumer crashes
    Q-->>Q: Visibility expires
    Q-->>C: Message can be delivered again
  end`;

export function CassandraTechnologyLessonContent() { return <>
  <ConceptFirst need="a distributed wide-column store for known partition-scoped queries and tunable consistency" technology="Apache Cassandra" />
  <LessonHeading level={2} id="problem">Design around bounded partitions and known queries</LessonHeading><p>Cassandra fits distributed, write-heavy or multi-datacenter workloads when queries can be shaped around partition keys and clustering order. “We have lots of data” is not enough. Review <Link href="/system-design/fundamentals/wide-column-databases">wide-column modeling</Link> first.</p>
  <LessonHeading level={2} id="model">Partition keys locate data; clustering columns order within it</LessonHeading><WorkedExample title="Conversation-scoped message history"><pre><code>{`partition key   = conversation_id
clustering key  = message_time

Efficient: fetch recent messages for one conversation.
Risk: an enormous long-lived conversation creates a huge/hot partition.`}</code></pre><p>Query-driven tables often duplicate data for different access patterns. That is intentional only when propagation and consistency are owned.</p></WorkedExample>
  <LessonHeading level={2} id="architecture">Coordinator, token ownership, and replicas</LessonHeading><MermaidDiagram chart={cassandraArchitecture} title="A coordinator routes one partition to its replicas" description="A client contacts a coordinator, which hashes the partition key to a token and sends work to three replicas before satisfying the selected consistency level." /><p>Cassandra uses hash-based token ownership and replicates partitions according to the keyspace strategy and replication factor. Nodes can coordinate requests even when they do not own the target partition.</p><ConsistentHashingDemo /><p>The ring visual isolates the ownership concept. Cassandra adds token ranges, replicas, topology-aware placement, and operational details beyond this generic model.</p>
  <LessonHeading level={2} id="consistency">Tunable consistency changes the acknowledgement set</LessonHeading><p>Per-operation consistency levels determine how many appropriate replicas must respond. Under assumptions, overlapping read and write quorums—often summarized as <code>R + W &gt; N</code>—can make a completed write visible to a later read. That arithmetic alone does not prove universal linearizability, protect against clock-dependent conflict resolution, or describe every multi-datacenter case.</p>
  <LessonHeading level={2} id="failure">Convergence has operational machinery</LessonHeading><p>Replication supports availability while replicas can temporarily diverge. Hinted handoff, read repair, and anti-entropy repair help convergence at different points. Compaction reconciles storage files; deletes create tombstone state that must propagate and later be reclaimed. Interview depth is why repair and bounded partitions matter, not tuning compaction internals.</p>
  <LessonHeading level={2} id="compare">Cassandra vs DynamoDB</LessonHeading><TradeoffTable><table><thead><tr><th>Cassandra tendency</th><th>DynamoDB tendency</th></tr></thead><tbody><tr><td>Open, self-managed distributed database ecosystem and direct operational control</td><td>Managed AWS service with service-defined operations and APIs</td></tr><tr><td>Tunable consistency and explicit cluster topology</td><td>Table/index read-consistency options and managed partitioning</td></tr><tr><td>Team owns repair, capacity, upgrades, and topology</td><td>Team owns key/access design while AWS owns more infrastructure operations</td></tr></tbody></table></TradeoffTable>
  <CommonMistakes><ul><li>Choosing Cassandra because the dataset is “big.”</li><li>Modeling like normalized relational tables.</li><li>Creating unbounded or hot partitions.</li><li>Claiming quorum arithmetic always yields linearizability.</li><li>Ignoring repair, tombstones, compaction, and operational ownership.</li></ul></CommonMistakes>
  <InterviewFollowUps><ul><li>Which query determines the partition and clustering keys?</li><li>How large can one partition become?</li><li>Which consistency level serves each operation and why?</li><li>What happens when replicas diverge?</li><li>Why operate Cassandra instead of using DynamoDB or PostgreSQL?</li></ul></InterviewFollowUps>
  <TechnologyLessonEnd id="cassandra" practice={["chat-system", "metrics-platform", "key-value-store"]}>Cassandra is a query-shaped distributed wide-column store. Defend bounded partitions, clustering order, replica acknowledgement, convergence and repair, and the operational reason to choose it.</TechnologyLessonEnd>
</>; }

export function RabbitMqTechnologyLessonContent() { return <>
  <ConceptFirst need="brokered work delivery with flexible routing and acknowledgements" technology="RabbitMQ" />
  <LessonHeading level={2} id="problem">Route work to queues, then transfer responsibility explicitly</LessonHeading><p>RabbitMQ fits background work and message routing where producers publish through a broker topology, queues hold pending deliveries, and consumers acknowledge ownership after processing. It is not primarily a retained history that every future consumer replays.</p>
  <LessonHeading level={2} id="architecture">Exchange bindings route messages to queues</LessonHeading><MermaidDiagram chart={rabbitArchitecture} title="RabbitMQ exchange routing" description="A producer publishes to an exchange whose bindings and routing keys direct messages to two queues, each served by its own consumers." /><TradeoffTable><table><thead><tr><th>Routing tendency</th><th>Use</th></tr></thead><tbody><tr><td>Direct</td><td>Exact routing-key matches.</td></tr><tr><td>Fan-out</td><td>Copy a publication to every bound queue.</td></tr><tr><td>Topic-style</td><td>Pattern-based routing across hierarchical keys.</td></tr></tbody></table></TradeoffTable><p>The important design is which queue owns backlog and failure behavior, not memorizing every exchange option.</p>
  <LessonHeading level={2} id="reliability">Consumer acknowledgements and publisher confirms cover different transfers</LessonHeading><p>A consumer acknowledgement tells the broker that processing responsibility has transferred and the delivery can be removed. A publisher confirm tells the producer the broker has accepted responsibility according to configuration. Connection success alone does not prove either application-level handoff.</p><LessonCallout variant="important" title="Redelivery requires idempotency"><p>If a consumer dies before acknowledging, work can be redelivered. If the side effect finished but the acknowledgement was lost, it can run again. Store an idempotency key or make the state transition conditional.</p></LessonCallout>
  <LessonHeading level={2} id="fit">When to choose it—and when not to</LessonHeading><TradeoffTable><table><thead><tr><th>Good fit</th><th>Look elsewhere when</th></tr></thead><tbody><tr><td>Work queues and flexible broker routing are central.</td><td>Long retained history and replay by many groups are central.</td></tr><tr><td>Acknowledgements and queue-level ownership match the workflow.</td><td>A managed queue removes operations you do not need to control.</td></tr><tr><td>Multiple routing patterns justify exchange topology.</td><td>One simple worker queue does not justify broker operations.</td></tr></tbody></table></TradeoffTable>
  <CommonMistakes><ul><li>Equating broker receipt with completed business processing.</li><li>Acknowledging before the durable side effect.</li><li>Assuming redelivery cannot happen.</li><li>Using RabbitMQ as retained analytics history by default.</li><li>Building complicated exchange topology without a routing requirement.</li></ul></CommonMistakes>
  <InterviewFollowUps><ul><li>Who owns a message after each handoff?</li><li>What triggers acknowledgement?</li><li>How are poison jobs and retries isolated?</li><li>What happens when a node or connection fails?</li><li>Why not SQS or Kafka?</li></ul></InterviewFollowUps>
  <TechnologyLessonEnd id="rabbitmq" practice={["notification-service", "job-scheduler", "distributed-queue"]}>RabbitMQ is a brokered work-and-routing system. Explain exchange-to-queue routing, publisher confirms, consumer acknowledgements, redelivery, idempotency, and why replay is not the primary requirement.</TechnologyLessonEnd>
</>; }

export function SqsTechnologyLessonContent() { return <>
  <ConceptFirst need="a managed AWS work queue with retry and dead-letter behavior" technology="Amazon SQS" />
  <LessonHeading level={2} id="problem">Managed pending work with explicit completion</LessonHeading><p>A producer sends work, consumers receive it, and successful workers delete it. SQS owns queue infrastructure; your application still owns idempotency, visibility duration, poison-message policy, and the downstream side effect.</p>
  <LessonHeading level={2} id="visibility">Visibility timeout is a temporary processing lease</LessonHeading><MermaidDiagram chart={sqsArchitecture} title="Receive, process, delete—or become visible again" description="A consumer receives a queued message, making it temporarily invisible. Success deletes it; a crash lets the visibility timeout expire so it may be delivered again." /><p>The timeout should cover expected work and can be extended for variable jobs. If it is too short, parallel duplicate processing becomes more likely; too long delays retry after failure. It is not a distributed transaction or an absolute duplicate-prevention lock.</p>
  <LessonHeading level={2} id="types">Standard and FIFO make different ordering promises</LessonHeading><TradeoffTable><table><thead><tr><th>Standard queue</th><th>FIFO queue</th></tr></thead><tbody><tr><td>At-least-once delivery</td><td>Ordering is scoped by message group</td></tr><tr><td>Best-effort ordering</td><td>Later messages in a group wait behind the in-flight one</td></tr><tr><td>Consumers must tolerate duplicates</td><td>Deduplication has documented scope and conditions; application side effects still need correctness</td></tr></tbody></table></TradeoffTable><p>A FIFO label does not make an external database update or payment exactly once. Identify the message group, deduplication identity, and side-effect transaction.</p>
  <LessonHeading level={2} id="retry">Retries and DLQs are operations, not correctness</LessonHeading><p>Repeated failures can move messages to a dead-letter queue according to policy. A DLQ preserves evidence and protects the hot path, but requires alarms, inspection, repair, and replay. Review <Link href="/system-design/fundamentals/retries-and-exponential-backoff">retries</Link>, <Link href="/system-design/fundamentals/dead-letter-queues">DLQs</Link>, and <Link href="/system-design/fundamentals/idempotent-consumers">idempotent consumers</Link>.</p>
  <LessonHeading level={2} id="comparison">Kafka vs RabbitMQ vs SQS</LessonHeading><TradeoffTable><table><thead><tr><th>Dimension</th><th>Kafka</th><th>RabbitMQ</th><th>SQS</th></tr></thead><tbody><tr><td>Mental model</td><td>Retained partitioned log</td><td>Broker, routing, queues</td><td>Managed queue</td></tr><tr><td>Replay/history</td><td>Central</td><td>Not primary</td><td>Not primary</td></tr><tr><td>Routing</td><td>Topics and partition keys</td><td>Flexible exchange bindings</td><td>Queue-centric; combine AWS services for fan-out</td></tr><tr><td>Operations</td><td>Cluster/platform or managed service</td><td>Broker topology or managed service</td><td>AWS-managed queue service</td></tr><tr><td>Ordering</td><td>Per partition</td><td>Queue/topology and failure dependent</td><td>Best effort Standard; message-group scoped FIFO</td></tr><tr><td>Common fit</td><td>Event history and independent groups</td><td>Routed brokered work</td><td>Straightforward AWS background work</td></tr></tbody></table></TradeoffTable>
  <CommonMistakes><ul><li>Treating receive as acknowledgement; SQS completion requires deletion.</li><li>Assuming visibility eliminates all duplicates.</li><li>Calling Standard ordered or calling FIFO globally ordered without message-group context.</li><li>Using a DLQ without an operational recovery path.</li><li>Choosing Kafka when a managed work queue satisfies the requirement.</li></ul></CommonMistakes>
  <InterviewFollowUps><ul><li>How long is visibility and how is it extended?</li><li>What makes the consumer idempotent?</li><li>Which failures move work to a DLQ?</li><li>Does order matter globally or only per entity?</li><li>Why SQS instead of RabbitMQ or Kafka?</li></ul></InterviewFollowUps>
  <TechnologyLessonEnd id="sqs" practice={["notification-service", "job-scheduler", "distributed-queue"]}>SQS is a managed work queue. Explain receive visibility, delete, redelivery, idempotency, DLQ recovery, and the exact Standard or FIFO ordering boundary.</TechnologyLessonEnd>
</>; }
