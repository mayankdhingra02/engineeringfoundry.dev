import { ArchitecturePatternLesson } from "./shared";

const batchStreamFlow = `flowchart LR
  B[Bounded files] --> P[Shared transforms]
  S[Unbounded events] --> W[Event-time windows]
  W --> P
  P --> O[(Serving output)]
  P --> R[(Replayable archive)]`;

const cqrsFlow = `flowchart LR
  C[Command] --> W[Write model]
  W --> E[Committed event or outbox]
  E --> P[Projection worker]
  P --> Q[(Read model)]
  U[Query] --> Q`;

const workflowFlow = `flowchart LR
  O[Workflow state] --> A[Reserve]
  A --> B[Charge]
  B --> C[Fulfill]
  C --> D[Complete]
  B -. failure .-> X[Release reservation]
  C -. failure .-> Y[Refund and release]`;

const largeFileFlow = `flowchart LR
  C[Client] -->|multipart chunks| O[(Object store)]
  C -->|complete metadata| A[API]
  A --> Q[Job queue]
  Q --> W[Chunk workers]
  W --> T[(Staged results)]
  T --> V[Validate and publish]`;

export function BatchVsStreamingLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "batch-vs-streaming",
  decision: "Choose batch or streaming from the decision deadline, input boundedness, correction model, and cost—not from a desire to appear real time. A shared logical transform can still run under different operational SLOs.",
  mechanism: ["Define event time, processing time, and the maximum useful result delay.", "Use a bounded source and finite run for batch; use durable offsets, watermarks, and windows for unbounded input.", "Choose how late data updates or retracts earlier results.", "Make sinks idempotent or transactional because workers and windows may retry.", "Retain replayable input and version transforms so corrected output can be rebuilt."],
  diagram: { chart: batchStreamFlow, title: "Bounded and unbounded processing", description: "Bounded files and unbounded event-time windows feed shared transforms. Results serve current queries while replayable input is retained for correction and rebuild." },
  example: { title: "Fraud signals and financial reconciliation", body: "A streaming pipeline scores transactions within seconds and updates provisional features. A daily batch recomputes the ledger-derived truth, incorporates late events, and reports divergence from the online result.", consequence: "Assign low latency to the provisional decision and exact reconciliation to the bounded authoritative run instead of pretending one path has both properties." },
  tradeoffs: [{ option: "Batch", chooseWhen: "Input is bounded or the result may arrive on a schedule.", cost: "Freshness is limited by collection and run time." }, { option: "Streaming", chooseWhen: "Each event must affect a decision within a tight deadline.", cost: "State, late data, backpressure, and continuous operations add complexity." }, { option: "Shared model, separate pipelines", chooseWhen: "The transforms match but SLOs and resource isolation differ.", cost: "Outputs need explicit reconciliation and versioning." }],
  failure: { failure: "A late event arrives after a window was published and billed.", impact: "The aggregate disagrees with authoritative records or changes silently after consumers acted.", detection: "Late-data counters and batch reconciliation expose a versioned result difference.", mitigation: "Define allowed lateness, correction events, and a finalization policy; keep billing on a reconciled source if exactness is required.", tradeoff: "Waiting longer improves completeness but delays final results." },
  exercise: ["Name the business decision and its latest useful answer.", "Define event time, window, watermark, and late-data policy.", "Choose a replay source and output version key.", "Explain how a batch recomputation replaces or corrects streamed output."],
  probes: ["Is the input truly unbounded?", "What happens to late or out-of-order events?", "Which output is authoritative?", "Can the sink tolerate a replay?"],
  practice: ["event-analytics", "feature-store", "metrics-platform"],
  remember: "Batch and streaming are execution choices around boundedness and latency. Correctness comes from explicit time, replay, sink, and correction semantics.",
}} />; }

export function CqrsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "cqrs",
  decision: "Use CQRS when commands and queries genuinely need different models, scaling, or security boundaries. Separate intent from presentation; do not split a simple CRUD service merely to add architecture vocabulary.",
  mechanism: ["Express writes as domain commands with validation and invariant enforcement.", "Commit authoritative state and a projection signal atomically, usually through the same transaction or an outbox.", "Build idempotent read projections shaped for concrete query paths.", "Expose projection version or freshness where users can act on stale data.", "Rebuild projections from an authoritative source and version schema changes independently."],
  diagram: { chart: cqrsFlow, title: "Command and query models", description: "Commands update an authoritative write model and commit a correlated event or outbox record. A projection worker updates a separate read model that serves queries and may lag behind the write." },
  example: { title: "Order entry and operations dashboard", body: "PlaceOrder validates inventory and payment invariants in the write model. An outbox drives a denormalized dashboard grouped by region and fulfillment state. The command response returns the order identity and version without waiting for every dashboard projection.", consequence: "Treat the dashboard as a replaceable, lagging view and keep decisions that require current order state on the command side." },
  tradeoffs: [{ option: "Shared store, separate models", chooseWhen: "Read/write code needs separation but one transaction boundary still fits.", cost: "Independent scaling and failure isolation remain limited." }, { option: "Separate read store", chooseWhen: "Query shape or volume justifies dedicated projections.", cost: "Eventual consistency, replay, and dual operations are unavoidable." }, { option: "Ordinary CRUD", chooseWhen: "One model meets the load and domain complexity.", cost: "Read and write optimization stay coupled, but the system remains simpler." }],
  failure: { failure: "The command succeeds but the projection consumer is down.", impact: "The user refreshes into stale state and may repeat or contradict the command.", detection: "Projection checkpoint age trails the write version and user reads expose the lag.", mitigation: "Return command identity, make retries idempotent, expose pending state, and replay the durable projection signal.", tradeoff: "Read-your-write overlays add client and API complexity." },
  exercise: ["Name one command invariant and one query projection that differ materially.", "Draw the atomic boundary between write state and projection signal.", "Define how the UI behaves before the projection catches up.", "Describe projection rebuild and schema version rollout."],
  probes: ["What complexity justifies CQRS here?", "Which model is authoritative?", "How is the projection signal committed without a gap?", "Can a stale read trigger a destructive command?"],
  practice: ["payment-system", "event-analytics", "notification-service"],
  remember: "CQRS earns its cost only when read and write concerns need different models. The projection is allowed to lag, so stale-state behavior and replay are part of the product contract.",
}} />; }

export function HandlingHotPartitionsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "handling-hot-partitions",
  decision: "A hot partition is a distribution failure, not simply high total load. Diagnose the key or range concentrating work before scaling the whole fleet.",
  mechanism: ["Measure throttling, queueing, storage, and request rate per logical and physical partition.", "Identify whether heat comes from a low-cardinality key, a sequential range, or one genuinely popular entity.", "Increase key cardinality with a deterministic or random shard suffix when the access path can fan in.", "Isolate exceptional tenants or keys and split adaptive ranges before they exhaust shared capacity.", "Plan backfill, dual routing, and read merge before changing the key."],
  example: { title: "Orders partitioned by today's date", body: "All new orders land on one date key. The service adds a hash(order_id) modulo N suffix, writes each order to one predictable shard, and queries all N shards in parallel for daily reports.", consequence: "Trade a single hot write partition for bounded read fan-in and keep N in versioned routing metadata." },
  tradeoffs: [{ option: "Calculated suffix", chooseWhen: "Reads know an item identity that can reproduce the shard.", cost: "Range queries still fan out across every suffix." }, { option: "Random suffix", chooseWhen: "Only bulk retrieval matters and maximum write spread is useful.", cost: "Point lookup needs an index or fan-out." }, { option: "Dedicated heavy-key path", chooseWhen: "A small number of known entities dominate traffic.", cost: "Routing and capacity policy become two-tiered." }],
  failure: { failure: "A key-salting change starts writing new shards while readers query only the old key.", impact: "Fresh records disappear from reads even though writes succeed.", detection: "Dual-read comparison shows count and version gaps during migration.", mitigation: "Version routing, dual read during backfill, verify parity, then retire the old path after the retention window.", tradeoff: "Dual paths temporarily multiply cost and operational complexity." },
  exercise: ["Name the hottest logical key and show its share of traffic.", "Choose deterministic or random sharding and calculate read fan-in.", "Design the routing-version migration and rollback.", "Set a per-key admission or isolation policy."],
  probes: ["Is the hotspot logical or physical?", "Can this entity itself be split?", "How does re-sharding preserve read completeness?", "What happens when the shard count changes?"],
  practice: ["key-value-store", "leaderboard", "metrics-platform"],
  remember: "Fix hot partitions at the distribution boundary. More fleet capacity helps only when the hot key can actually use it.",
}} />; }

export function HandlingContentionLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "handling-contention",
  decision: "When concurrent actors want the same state, choose whether they may retry, wait, serialize, partition, or merge. The business invariant determines the control; lock syntax does not.",
  mechanism: ["Name the contested invariant and the smallest key that owns it.", "Use optimistic revision checks when conflicts are uncommon and drafts can be retried or merged.", "Use row or advisory locks when one short transaction must serialize a critical state transition.", "Queue or partition operations when high sustained contention makes retries or locks unstable.", "Acquire multiple locks in a stable order, bound transaction duration, and expose conflict/timeout rates."],
  example: { title: "Reserve the last seat", body: "A transaction conditionally moves inventory from one to zero and creates the reservation under the same ownership key. Competing requests get a clear unavailable result rather than both reading one and committing.", consequence: "Keep payment outside the inventory lock; reserve first, then use an expiring workflow for the external side effect." },
  tradeoffs: [{ option: "Optimistic CAS", chooseWhen: "Conflicts are rare and callers can refresh or merge.", cost: "Hot keys waste work through repeated conflicts." }, { option: "Pessimistic lock", chooseWhen: "The critical section is short and waiting is preferable to retry.", cost: "Long holders, deadlocks, and pool exhaustion threaten unrelated work." }, { option: "Single-key queue", chooseWhen: "Commands can wait and strict ordering is valuable.", cost: "Backlog becomes latency and the consumer is a serialization bottleneck." }],
  failure: { failure: "Two transaction paths lock account and ledger rows in opposite order.", impact: "Deadlocks abort transactions and retries amplify pressure.", detection: "Deadlock diagnostics and lock-wait graphs identify the reversed acquisition order.", mitigation: "Use one stable order, keep the transaction bounded, and retry aborted transactions with jitter and an overall deadline.", tradeoff: "A universal ordering constraint can reduce parallelism or require refactoring." },
  exercise: ["Write the invariant and exact ownership key.", "Estimate conflict probability and maximum safe wait.", "Choose CAS, lock, queue, partition, or merge and explain rejected alternatives.", "Draw lock order and the user-visible retry/conflict state."],
  probes: ["Can the operation be commutative?", "What is held while calling an external service?", "How are deadlocks retried safely?", "Would partitioning eliminate shared ownership?"],
  practice: ["ticketmaster", "payment-system", "collaborative-editor"],
  remember: "Contention is competing ownership of an invariant. Minimize the shared key and critical section, then make waits, conflicts, and retries explicit.",
}} />; }

export function MultiStepWorkflowsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "multi-step-workflows",
  decision: "Use a durable workflow when a business outcome spans multiple independently failing steps. Decide which transitions are reversible, which need compensation, and which require human resolution.",
  mechanism: ["Persist workflow state, input identity, and the next permitted transition before dispatching work.", "Execute one idempotent local transaction per step and record its outcome.", "Retry transient failures within a bounded policy; compensate prior reversible steps when the outcome cannot complete.", "Treat compensation as new work that can fail, not as an automatic database rollback.", "Expose stuck state, operator action, audit history, and terminal business meaning."],
  diagram: { chart: workflowFlow, title: "Order workflow and compensation", description: "An order reserves inventory, charges payment, fulfills, and completes. Charge failure releases the reservation; fulfillment failure triggers refund and release as explicit compensating work." },
  example: { title: "Reserve, charge, and fulfill an order", body: "Inventory reservation commits locally, payment uses an idempotency key, and fulfillment begins only after charge. If fulfillment becomes impossible, the workflow requests a refund and releases stock, recording each result.", consequence: "The user sees pending, completed, or needs-attention truth while the system retains enough state to resume without replaying successful effects." },
  tradeoffs: [{ option: "Orchestration", chooseWhen: "One owner must enforce a visible sequence and recovery policy.", cost: "The coordinator becomes critical workflow infrastructure." }, { option: "Choreography", chooseWhen: "Independent reactions are loosely coupled and no single sequence owns the outcome.", cost: "Global state and failure diagnosis become harder." }, { option: "Distributed transaction", chooseWhen: "Participants truly support one bounded atomic protocol and availability cost is acceptable.", cost: "Coupling and blocking often make external services a poor fit." }],
  failure: { failure: "Payment succeeds, fulfillment fails, and the refund request times out.", impact: "The customer is charged without delivery and an automatic retry may duplicate the refund.", detection: "Workflow age and a nonterminal compensation state breach their objective.", mitigation: "Use the original payment identity for idempotent refund, retry with bounds, and route exhausted cases to an owned reconciliation queue.", tradeoff: "Human recovery preserves correctness but increases operating cost and completion time." },
  exercise: ["List every state and legal transition for an order.", "Mark each side effect as idempotent, compensatable, irreversible, or manual.", "Define timeout and retry policy separately for each step.", "Create an operator view for workflows past their expected age."],
  probes: ["Who owns the end-to-end outcome?", "Can compensation itself fail?", "What does the customer see between steps?", "How do deploys and duplicate messages affect the state machine?"],
  practice: ["payment-system", "notification-service", "ride-sharing"],
  remember: "A multi-step workflow is persisted business state, not a chain of hopeful calls. Every transition, retry, compensation, and manual escape needs identity and truth.",
}} />; }

export function LargeFileProcessingLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "large-file-processing",
  decision: "Keep large bytes off the application request path. Separate resumable transfer, immutable object identity, asynchronous processing, and atomic result publication.",
  mechanism: ["Authorize an upload intent and issue bounded object-store credentials or signed part operations.", "Upload chunks independently with checksums, size/type limits, and an explicit complete or abort step.", "Create a processing job only for a finalized immutable input version.", "Partition processing into idempotent chunks and stage results under the job version.", "Validate completeness, atomically publish the result pointer, and expire input, parts, and failed staging data by policy."],
  diagram: { chart: largeFileFlow, title: "Large file upload and processing", description: "A client sends multipart chunks directly to object storage and completion metadata to an API. The API enqueues processing; workers stage chunk results before validation atomically publishes the completed version." },
  example: { title: "Process a 40 GB video upload", body: "The browser uploads numbered parts directly to object storage and completes with checksums. A job probes media metadata, creates segment tasks, writes renditions to a versioned prefix, validates the manifest, then switches the video's published pointer.", consequence: "A failed segment retries independently, while viewers continue using the previous complete version and never see partial output." },
  tradeoffs: [{ option: "Multipart direct upload", chooseWhen: "Files exceed a safe application-request size or networks are unreliable.", cost: "Orphaned parts, credential scope, checksums, and completion become explicit." }, { option: "Parallel chunk processing", chooseWhen: "Chunks are independently transformable and merge order is known.", cost: "Skew and final assembly may dominate total time." }, { option: "Single sequential worker", chooseWhen: "The format prevents safe splitting and volume is bounded.", cost: "Recovery repeats more work and one worker limits throughput." }],
  failure: { failure: "The publisher exposes the output prefix before every chunk finishes.", impact: "Readers observe missing segments or a mixture of job versions.", detection: "Manifest validation finds absent checksums while the public pointer already references the staging version.", mitigation: "Write immutable staged objects, validate the complete manifest, and conditionally swap one published pointer only after success.", tradeoff: "Keeping old and staged versions consumes more temporary storage." },
  exercise: ["Choose part size, maximum file size, checksum, and credential scope.", "Define the immutable input version and processing job identity.", "Draw chunk retry, cancellation, and cleanup paths.", "Specify the single atomic action that makes output visible."],
  probes: ["Who pays for abandoned multipart uploads?", "Can a file change after processing starts?", "How is malicious content isolated?", "What happens when one chunk is much slower than the rest?"],
  practice: ["cloud-file-storage", "media-processing", "web-crawler"],
  remember: "Large-file systems are versioned pipelines: resumable transfer, immutable input, idempotent chunks, validated assembly, and one atomic publication boundary.",
  note: "Object size and media type are security inputs. Enforce quotas before processing, isolate untrusted decoders, scan where required, and never trust a filename or client-declared content type as authorization to publish.",
}} />; }
