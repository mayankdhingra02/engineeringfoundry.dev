import { ArchitecturePatternLesson } from "./shared";

const readScalingFlow = `flowchart LR
  C[Clients] --> E[Edge cache]
  E --> A[Read API]
  A --> K[Application cache]
  A --> R1[(Replica A)]
  A --> R2[(Replica B)]
  W[Primary] -. replication lag .-> R1
  W -. replication lag .-> R2`;

const writeScalingFlow = `flowchart LR
  C[Clients] --> A[Admission and validation]
  A --> P{Partition key}
  P --> S1[(Shard 1)]
  P --> S2[(Shard 2)]
  P --> S3[(Shard 3)]
  A --> Q[Durable queue]
  Q --> B[Batching workers]`;

export function ScalingReadsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "scaling-reads",
  decision: "Scale reads only after naming the access path, freshness requirement, and skew. Replicas, caches, CDNs, and partitions remove different work from the primary; each also creates a place where data can be stale or missing.",
  mechanism: ["Measure read rate, key popularity, payload size, latency target, and tolerated staleness by access path.", "Serve immutable public bytes at the edge and reusable query results from a bounded application cache.", "Route eligible queries to replicas while writes and read-after-write paths remain on the authoritative store.", "Partition when one database cannot own the total dataset or read throughput, and preserve a route to the owning partition.", "Observe hit ratio, replica lag, origin load, hot keys, and correctness—not just aggregate latency."],
  diagram: { chart: readScalingFlow, title: "Layered read scaling", description: "Clients first reach an edge cache, then a read API that can use an application cache or two replicas. The primary feeds replicas asynchronously, making replication lag an explicit freshness boundary." },
  example: { title: "Product pages with inventory", body: "Cache product description and images at the edge, cache a bounded product projection near the API, and read catalog searches from replicas. Fetch inventory and checkout eligibility from an authoritative path because stale availability changes the purchase decision.", consequence: "Split the response by freshness semantics instead of assigning one cache policy to the whole page." },
  tradeoffs: [{ option: "Cache", chooseWhen: "Requests repeat and bounded staleness is acceptable.", cost: "Invalidation, stampedes, and hot keys become correctness and capacity work." }, { option: "Read replicas", chooseWhen: "Queries can tolerate replication lag and the write primary has read pressure.", cost: "Read-after-write and failover routing need an explicit policy." }, { option: "Partitioned reads", chooseWhen: "A stable key can route work across independently scalable owners.", cost: "Cross-partition queries and rebalancing become application concerns." }],
  failure: { failure: "A newly changed product is immediately read from a lagging replica and the cache stores the old version.", impact: "Staleness outlives the replica lag and may drive an incorrect user action.", detection: "Version-aware logs show the cache fill used an older commit or entity version than the write response.", mitigation: "Use primary reads or version tokens for read-after-write paths, and reject cache fills older than the known version.", tradeoff: "Stronger freshness sends more traffic to the authoritative store." },
  exercise: ["Classify each field in a product response by freshness tolerance.", "Choose an owner, key, TTL, and invalidation signal for every cacheable projection.", "Define the read-after-write path and a replica-lag threshold that removes replicas from eligible traffic.", "Estimate the origin load if every cache layer misses at once."],
  probes: ["Which reads require the latest committed value?", "What happens during a cache flush or replica failover?", "How do you prevent one popular key from overloading a node?", "Which metric proves the primary was actually relieved?"],
  practice: ["distributed-cache", "news-feed", "search-engine"],
  remember: "Read scaling is access-path design. Match each layer to freshness and skew, then design the miss path as carefully as the hit path.",
}} />; }

export function ScalingWritesLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "scaling-writes",
  decision: "Write capacity is constrained by the narrowest serialization point: one partition, lock, index, synchronous replica set, or downstream side effect. Find that point before adding queues or shards.",
  mechanism: ["Measure accepted commands separately from durable commits and completed side effects.", "Choose a partition key that spreads writes while keeping required atomic state together.", "Batch or append where the product permits delayed materialization; keep admission and idempotency at the edge.", "Use a durable queue to absorb bursts only when backlog age and retry semantics are acceptable.", "Scale consumers and storage partitions from queue age, partition utilization, conflict rate, and durability lag."],
  diagram: { chart: writeScalingFlow, title: "Partitioned and buffered write path", description: "Validated client commands route by partition key to three storage shards. Work that may complete asynchronously also enters a durable queue where workers batch compatible operations." },
  example: { title: "Event ingestion during a launch", body: "The API validates event shape and idempotency, partitions by stable tenant-plus-bucket identity, appends durable records, and acknowledges only the agreed durability level. Aggregations run from the log asynchronously and expose freshness.", consequence: "Separate durable acceptance from derived views so a slow aggregate does not throttle raw event capture." },
  tradeoffs: [{ option: "Synchronous partitioned writes", chooseWhen: "The response requires a committed authoritative result.", cost: "Key skew, cross-partition transactions, and replication bound throughput." }, { option: "Queued writes", chooseWhen: "The caller can accept durable admission before completion.", cost: "Backlog, duplicates, cancellation, and result delivery become product states." }, { option: "Batching", chooseWhen: "Many compatible operations can wait for a short window.", cost: "Latency rises and partial batch failure needs item-level truth." }],
  failure: { failure: "Most events share a date-only partition key during the daily peak.", impact: "One partition throttles while the fleet appears underutilized.", detection: "Per-key or per-partition write latency and throttling diverge from the fleet average.", mitigation: "Add a deterministic shard suffix, bound per-tenant admission, and fan in results when reading the bucket.", tradeoff: "Write distribution makes range reads and rebalancing more expensive." },
  exercise: ["Name the exact point that serializes the current write path.", "Propose a partition key and list the operations that would cross partitions.", "Define accepted, committed, processed, and failed states for the client.", "Set a backlog-age threshold and the overload action when it is crossed."],
  probes: ["What does the acknowledgment guarantee?", "Can a retry duplicate a side effect?", "How does one hot tenant affect others?", "Which work is safe to defer or batch?"],
  practice: ["distributed-queue", "event-analytics", "key-value-store"],
  remember: "Scale writes by removing or distributing the true serialization point. A queue moves work through time; it does not create storage capacity or correctness for free.",
}} />; }

export function ReadHeavySystemsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "read-heavy-systems",
  decision: "A read-heavy system should optimize the few dominant access paths without turning every response into an untraceable stack of stale copies. Start with the read distribution, not the total request count.",
  mechanism: ["Rank reads by frequency, latency objective, payload, and freshness.", "Precompute stable projections and place them near their consumers.", "Use edge, application, and database caches only where each layer has a distinct ownership and invalidation contract.", "Replicate or partition the remaining misses, preserving a route for authoritative reads.", "Model a full miss storm and cap regeneration concurrency before launch."],
  example: { title: "A public news homepage", body: "Anonymous headlines are edge cached, article cards use a versioned projection, and personalized badges are fetched separately. Editors preview from the authoritative store rather than the public cache.", consequence: "Compose data with different freshness policies instead of weakening the strictest field or overloading the origin for the loosest one." },
  tradeoffs: [{ option: "Precomputed projection", chooseWhen: "A common query shape is expensive but changes predictably.", cost: "Projection lag and rebuild operations must be visible." }, { option: "Replica query", chooseWhen: "Query flexibility matters more than immediate freshness.", cost: "Lag and replica capacity still constrain the path." }, { option: "Origin query", chooseWhen: "The decision requires current authoritative state.", cost: "Expensive fan-in cannot scale by caching unrelated fields." }],
  failure: { failure: "A cache expiry synchronizes millions of requests on one expensive query.", impact: "The database saturates and healthy cached paths fail behind the same shared pool.", detection: "Hit ratio drops while concurrent regeneration, connection wait, and origin latency spike together.", mitigation: "Use jittered expiry, request coalescing, stale-while-revalidate where safe, and isolated capacity for regeneration.", tradeoff: "Serving stale data extends the period before every reader sees an update." },
  exercise: ["Draw the top three read paths and their cache keys.", "State freshness and invalidation separately for every response field.", "Estimate origin QPS at normal hit rate and at zero hit rate.", "Choose the safe behavior when the projection builder is behind."],
  probes: ["What is the read access skew?", "Which layer owns invalidation?", "How do privileged and public views avoid sharing a cache entry?", "What protects the origin during a cold start?"],
  practice: ["news-feed", "distributed-cache", "search-autocomplete"],
  remember: "Design read-heavy systems around dominant access paths, explicit freshness, and a survivable miss path—not a target cache-hit percentage alone.",
}} />; }

export function WriteHeavySystemsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "write-heavy-systems",
  decision: "For a write-heavy system, define the durable record and the permissible delay before derived state. The safest high-throughput path is often a small append followed by asynchronous, replayable materialization.",
  mechanism: ["Validate and deduplicate at admission, then append the smallest durable event or command record.", "Partition by a stable high-cardinality key and bound any tenant or key that can dominate it.", "Process derived indexes, aggregates, and notifications with idempotent consumers.", "Compact, retain, or archive append-only data under a stated replay and audit policy.", "Track acceptance rate, durability lag, backlog age, hot partitions, and materialization freshness."],
  example: { title: "Device telemetry ingestion", body: "Gateways batch measurements, the service partitions by device hash and time bucket, and a durable log records accepted data. Stream processors update live alerts; batch compaction creates efficient historical files.", consequence: "Keep raw durable input available for replay while treating live and historical views as replaceable projections." },
  tradeoffs: [{ option: "Append-only log", chooseWhen: "Writes are naturally ordered facts and replay has value.", cost: "Retention, compaction, schema evolution, and duplicate processing are permanent responsibilities." }, { option: "In-place update", chooseWhen: "A current value with tight per-key consistency is the product requirement.", cost: "Hot records, locks, and indexes become throughput limits." }, { option: "Client or gateway batch", chooseWhen: "Small writes can tolerate a bounded collection delay.", cost: "Partial loss and retry semantics move closer to the client." }],
  failure: { failure: "A slow downstream indexer causes an unbounded durable backlog.", impact: "Freshness degrades, storage cost rises, and eventual recovery can overload the index.", detection: "Oldest-message age grows even when accepted write rate is stable.", mitigation: "Apply admission policy, isolate consumer pools, scale from backlog age, and replay in bounded partitions.", tradeoff: "Rejecting or sampling low-value writes protects recovery but loses accepted volume." },
  exercise: ["Define the minimum durable record and acknowledgment boundary.", "Choose partition and ordering scope for one device or tenant.", "List every derived view and prove its consumer is idempotent.", "Set backlog and replay limits before estimating worker count."],
  probes: ["Can the source of truth be replayed?", "What compacts old writes?", "Where does backpressure reach the caller?", "How do schema changes coexist in the log?"],
  practice: ["event-analytics", "kafka-platform", "metrics-platform"],
  remember: "Protect the durable write path first. Derived state may lag or rebuild, but admission, idempotency, partitioning, and recovery must remain explicit.",
}} />; }
