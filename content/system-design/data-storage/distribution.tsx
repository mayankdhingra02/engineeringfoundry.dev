import Link from "next/link";
import { ConsistentHashingDemo } from "@/components/consistent-hashing-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { dataStorageSources } from "./sources";

const replicationTopology = `flowchart LR
  W[Writes] --> L[(Leader)]
  L -->|replication| A[(Replica A)]
  L -->|replication| B[(Replica B)]
  R[Reads] --> L
  R --> A
  R --> B`;

const replicaLag = `sequenceDiagram
  participant U as User
  participant L as Leader
  participant R as Read replica
  U->>L: Update profile to Maya
  L-->>U: Success
  U->>R: GET /profile
  R-->>U: Old profile
  L-->>R: Replicate update later`;

const shardingTopology = `flowchart LR
  Q[Request + shard key] --> Router
  Router -->|A–F| S1[(Shard 1)]
  Router -->|G–M| S2[(Shard 2)]
  Router -->|N–Z| S3[(Shard 3)]
  D[(Directory)] -. customer_123 → Shard 2 .-> Router`;

const consistencyTimeline = `sequenceDiagram
  participant U as User
  participant L as Leader
  participant A as Replica A
  participant B as Replica B
  U->>L: username = maya2
  L-->>U: committed
  L-->>A: propagate
  U->>A: read own profile
  A-->>U: maya2
  Note over B: B may still hold maya1
  L-->>B: converge later`;

const capPartition = `flowchart LR
  C1[Client in Region A] --> A[(Region A copy)]
  C2[Client in Region B] --> B[(Region B copy)]
  A x--x|network partition| B
  A --> X{Operation policy}
  X -->|preserve guarantee| Reject[Reject or pause some work]
  X -->|serve independently| Diverge[Accept and reconcile later]`;

export function ReplicationLessonContent() {
  return <>
    <LessonHeading level={2} id="copies-have-a-purpose">A copy is useful only with an acknowledgement and read policy</LessonHeading>
    <p>Replication maintains additional copies for read capacity, availability, geographic serving, fault tolerance, or durability under a stated failure model. It does not automatically provide all of them.</p>
    <MermaidDiagram chart={replicationTopology} title="Leader and follower replication" description="Writes reach a leader and changes propagate to two replicas. Reads may be routed to the leader or a replica, with different freshness and load consequences." />

    <LessonHeading level={2} id="sync-vs-async">Synchronous versus asynchronous acknowledgement</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Mode</th><th>Write acknowledgement</th><th>Pressure</th></tr></thead><tbody><tr><td>Synchronous</td><td>Waits for configured replica acknowledgement</td><td>More latency and dependency on replica health</td></tr><tr><td>Asynchronous</td><td>Leader can acknowledge before followers catch up</td><td>Lag and a potential loss window under some failures</td></tr></tbody></table></TradeoffTable>
    <p>Exact durability and consistency depend on how many replicas acknowledge, where they are, what is persisted, and how failures are recovered. Avoid absolute claims based on “sync” alone.</p>

    <LessonHeading level={2} id="lag-becomes-product-behavior">Replication lag becomes product behavior</LessonHeading>
    <MermaidDiagram chart={replicaLag} title="Read immediately after an asynchronous write" description="A user updates their profile on the leader, then reads from a replica before replication arrives and observes the older value." />
    <p>Read-your-writes can be provided by temporarily routing that user to the leader, using a session/version token, applying affinity, or choosing a lag-aware replica. Each option changes load and complexity.</p>

    <LessonHeading level={2} id="failover-and-multi-leader">Failover is a transition, not a checkbox</LessonHeading>
    <p>Detect leader failure, choose and promote an eligible replica, redirect writers, and prevent conflicting leaders where the design requires one. Keep consensus mechanics for the later Reliability section, but state the split-brain risk.</p>
    <p>Multi-leader replication can reduce regional write latency, while introducing conflict detection/resolution and substantial operational complexity. Use it for a demonstrated multi-region write requirement, not by default.</p>
    <LessonCallout variant="important"><p><strong>Replication copies data; sharding splits data.</strong> Large systems often shard for capacity and replicate each shard for resilience.</p></LessonCallout>
    <CommonMistakes><ul><li>Adding read replicas without discussing stale reads.</li><li>Assuming replicas protect against application deletes or corrupted writes.</li><li>Calling failover instant without a detection and promotion path.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>What happens immediately after a write?</li><li>What if the leader fails?</li><li>Which replicas acknowledge?</li><li>How would multiple regions change latency and conflicts?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["chat-system", "payment-system", "news-feed", "collaborative-app"]} />
    <FurtherReading items={dataStorageSources.replication} />
    <RememberThis><p>Replication creates copies for serving or resilience, but every copy introduces acknowledgement, lag, read routing, failover, and consistency questions.</p></RememberThis>
  </>;
}

export function ShardingLessonContent() {
  return <>
    <LessonHeading level={2} id="split-capacity">One node cannot absorb every row and write forever</LessonHeading>
    <p>Sharding horizontally partitions rows so each node owns a subset. The shard key determines routing, locality, balance, cross-shard work, and eventually migration cost.</p>
    <MermaidDiagram chart={shardingTopology} title="Shard routing by range or directory" description="A router uses a shard key to choose among three range shards. An optional directory maps a specific customer to a shard and becomes routing metadata that must remain available and correct." />

    <LessonHeading level={2} id="three-strategies">Hash, range, and directory placement</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Strategy</th><th>Strength</th><th>Trade-off</th></tr></thead><tbody><tr><td><code>hash(user_id) % 4</code></td><td>Can distribute varied keys</td><td>Range queries scatter; shard-count changes remap heavily</td></tr><tr><td>A–F, G–M, N–Z or time ranges</td><td>Range locality</td><td>Skew and sequential-write hotspots</td></tr><tr><td><code>customer_123 → shard_7</code></td><td>Flexible placement</td><td>Directory availability, consistency, and operation</td></tr></tbody></table></TradeoffTable>

    <LessonHeading level={2} id="choose-the-key">Choose the key from dominant access patterns</LessonHeading>
    <ul><li>Prefer high cardinality and a distribution compatible with expected traffic.</li><li>Co-locate data commonly queried or changed together.</li><li>Avoid keys whose hottest values overwhelm one shard.</li><li>Choose a stable key; changing it later means moving data and routing.</li></ul>
    <p><code>user_id</code> may work for user-scoped records. <code>country</code> can skew when one country dominates. <code>created_date</code> can make today&apos;s range absorb every current write. Context decides.</p>

    <LessonHeading level={2} id="hot-and-global-work">Even distribution does not eliminate hot keys</LessonHeading>
    <p>A celebrity account can overwhelm its owning shard even when millions of ordinary keys are balanced. Caching, replicas, key splitting, precomputation, or workload-specific fan-out may spread the hot operation.</p>
    <WorkedExample title="A global query across user shards">
      <p>If orders are partitioned by <code>user_id</code>, “all orders in the last hour” may query every shard and merge results. A dedicated time-oriented index or analytics pipeline may be more appropriate than making the transactional path perform a scatter-gather.</p>
    </WorkedExample>

    <LessonHeading level={2} id="resharding">Four shards becoming eight is a migration</LessonHeading>
    <p>Data must move while reads and writes continue. The router needs old/new ownership, migrations add load, and correctness must survive partial progress. Naïve modulo hashing makes many keys move; the next lesson shows why <Link href="/system-design/fundamentals/consistent-hashing">consistent hashing</Link> can help some changing-node workloads.</p>
    <p>Atomic operations across shards also require more coordination. Cross-link later to <Link href="/system-design/patterns/distributed-transactions">Distributed Transactions</Link> and <Link href="/system-design/patterns/two-phase-commit">Two-Phase Commit</Link>.</p>
    <InterviewFollowUps><ul><li>Why this shard key?</li><li>What becomes hot?</li><li>How does a global query run?</li><li>How do cross-shard changes behave?</li><li>How do you reshard without stopping traffic?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["url-shortener", "news-feed", "chat-system", "video-streaming"]} />
    <FurtherReading items={dataStorageSources.sharding} />
    <RememberThis><p>Sharding increases capacity by splitting data. The hard parts are the key, hotspots, cross-shard work, routing, and eventually moving ownership.</p></RememberThis>
  </>;
}

export function ConsistentHashingLessonContent() {
  return <>
    <LessonHeading level={2} id="modulo-remaps">Modulo hashing couples every key to the node count</LessonHeading>
    <pre><code>{`node = hash(key) % 4

Add one node:
node = hash(key) % 5`}</code></pre>
    <p>The remainder changes for many keys, forcing broad movement or cache misses. That is expensive when nodes join and leave in a distributed cache, partitioned store, or request-routing pool.</p>

    <LessonHeading level={2} id="ring-model">The ring is a keyspace model, not a network topology</LessonHeading>
    <p>Place node positions and key hashes in a circular hash space. A key belongs to the next node clockwise. Adding or removing one node changes ownership mainly for a neighboring interval rather than remapping nearly every key.</p>
    <ConsistentHashingDemo />

    <LessonHeading level={2} id="virtual-nodes">Virtual nodes improve placement flexibility</LessonHeading>
    <p>One physical node can own many positions, helping smooth random imbalance and represent heterogeneous capacity in some implementations. Virtual nodes add metadata and migration work; they do not make a heavily requested key divisible.</p>
    <LessonCallout variant="common-mistake"><p>Consistent hashing addresses ownership movement as the node set changes. It does not automatically solve replication, exact balance, hot keys, capacity overload, or cross-key queries.</p></LessonCallout>
    <InterviewFollowUps><ul><li>What changes when a node joins?</li><li>How is a failed node handled?</li><li>Why use virtual nodes?</li><li>What happens to one extremely hot key?</li><li>Does this workload actually have a changing node set?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["distributed-cache", "key-value-store", "url-shortener", "video-streaming"]} />
    <FurtherReading items={dataStorageSources["consistent-hashing"]} />
    <RememberThis><p>Consistent hashing limits key movement when a node set changes. Explain ownership, movement, virtual nodes, replication separately, and why hot keys remain possible.</p></RememberThis>
  </>;
}

export function ConsistencyModelsLessonContent() {
  return <>
    <LessonHeading level={2} id="what-can-a-user-observe">Start with what a user is allowed to observe</LessonHeading>
    <p>Maya changes her username from <code>maya1</code> to <code>maya2</code>. Must every user immediately see the new value? Must Maya see it? Can one session see <code>maya2</code> and later move backward to <code>maya1</code>?</p>
    <MermaidDiagram chart={consistencyTimeline} title="Session guarantee over asynchronously changing replicas" description="A username update commits on the leader and reaches one replica before another. The user reads the updated replica, while another copy can temporarily hold the older value." />
    <TradeoffTable><table><thead><tr><th>Guarantee</th><th>Product behavior</th></tr></thead><tbody><tr><td>Strong consistency</td><td>Reads follow a stated strong ordering/recency guarantee; define the exact model.</td></tr><tr><td>Eventual consistency</td><td>Copies may differ temporarily and are expected to converge if updates stop under stated assumptions.</td></tr><tr><td>Read-your-writes</td><td>A session observes its own completed updates.</td></tr><tr><td>Monotonic reads</td><td>A session does not move from a newer observed value to an older one.</td></tr><tr><td>Session consistency</td><td>A practical bundle of guarantees scoped to a client/session.</td></tr></tbody></table></TradeoffTable>
    <LessonHeading level={2} id="correctness-is-per-operation">Different operations deserve different guarantees</LessonHeading>
    <ul><li>A bank balance or inventory reservation often needs stronger correctness.</li><li>A social like count can often lag temporarily.</li><li>A profile edit may need read-your-writes without global strong consistency.</li><li>DNS demonstrates cached, gradual visibility, though its semantics are not a database consistency API.</li></ul>
    <LessonCallout variant="tradeoff"><p>Stronger guarantees can require coordination that affects latency, availability during failures, throughput, and cost. “Strong everywhere” is not a free safety setting.</p></LessonCallout>
    <PracticeConnections ids={["payment-system", "news-feed", "chat-system", "collaborative-editor"]} />
    <FurtherReading items={dataStorageSources["consistency-models"]} />
    <RememberThis><p>Name the user-visible guarantee per operation. Global strength, eventual convergence, read-your-writes, and monotonic reads solve different product problems.</p></RememberThis>
  </>;
}

export function CapTheoremLessonContent() {
  return <>
    <LessonHeading level={2} id="partition-forces-a-choice">CAP starts when communication is partitioned</LessonHeading>
    <p>“Choose any two” is misleading. In a real distributed system, the network can separate nodes. During that partition, a conflicting operation may have to choose between responding everywhere and preserving a particular strong consistency guarantee.</p>
    <MermaidDiagram chart={capPartition} title="Operation policy during a regional partition" description="Two regions cannot communicate. The design can reject or pause some operations to preserve a stronger guarantee, or accept independently and reconcile divergence later." />

    <LessonHeading level={2} id="cap-terms">Use the theorem&apos;s terms precisely</LessonHeading>
    <dl><dt><strong>Consistency</strong></dt><dd>A specific strong consistency model under CAP, not generic correctness or ACID consistency.</dd><dt><strong>Availability</strong></dt><dd>Every request to a non-failing node receives a response under the theorem&apos;s model—not a percentage uptime target.</dd><dt><strong>Partition</strong></dt><dd>Communication between groups of nodes is lost or disrupted, not data sharding.</dd></dl>

    <LessonHeading level={2} id="account-example">One account, two disconnected regions</LessonHeading>
    <p>If both regions receive a withdrawal, one design rejects or pauses some operations where it cannot safely coordinate. Another accepts in both regions and resolves divergence later. Reads, profile updates, and withdrawals can use different policies; a complete product need not have one universal “CP” or “AP” label.</p>
    <CommonMistakes><ul><li>“SQL is CA” or “MongoDB is AP” without configuration and operation context.</li><li>“Pick two” as a normal database-selection shortcut.</li><li>Confusing partition tolerance with sharding.</li><li>Confusing CAP consistency with ACID consistency.</li><li>Treating CAP as a complete architecture framework.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>Which exact link failed?</li><li>Which operations can remain available?</li><li>Which must preserve a stronger guarantee?</li><li>How is divergence detected and repaired?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["payment-system", "collaborative-editor", "distributed-lock-service"]} />
    <FurtherReading items={dataStorageSources["cap-theorem"]} />
    <RememberThis><p>During a network partition, an operation may trade serving every request against preserving a particular strong consistency guarantee. “Pick any two” is not a useful design rule.</p></RememberThis>
  </>;
}

export function PacelcLessonContent() {
  return <>
    <LessonHeading level={2} id="partitions-are-not-the-whole-life">What trade-off exists when the network is healthy?</LessonHeading>
    <pre><code>{`If Partition:
  Availability vs Consistency
Else:
  Latency vs Consistency`}</code></pre>
    <p>CAP focuses attention on partition behavior. PACELC adds the ordinary path: even without a partition, waiting for coordination can strengthen a consistency guarantee while increasing latency.</p>
    <LessonHeading level={2} id="model-not-label-chart">Use PACELC to ask a question, not memorize a chart</LessonHeading>
    <p>A globally replicated write can wait for remote acknowledgement or return after local work. The first may strengthen what later reads can observe; the second can reduce latency while accepting a weaker or delayed guarantee. Actual behavior depends on the operation and configuration.</p>
    <LessonCallout variant="important"><p>PACELC is an advanced reasoning lens. It does not classify every behavior of an entire database product, and it does not replace an explicit latency and correctness requirement.</p></LessonCallout>
    <PracticeConnections ids={["payment-system", "chat-system", "news-feed"]} />
    <FurtherReading items={dataStorageSources.pacelc} />
    <RememberThis><p>PACELC asks two questions: what happens during a partition, and what latency-versus-consistency trade-off remains during normal operation.</p></RememberThis>
  </>;
}
