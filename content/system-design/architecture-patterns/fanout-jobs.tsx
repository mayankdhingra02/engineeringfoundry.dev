import { ArchitecturePatternLesson } from "./shared";
import { FanOutDemo } from "@/components/fan-out-demo";

const fanoutFlow = `flowchart LR
  P[Publisher] --> T[Topic]
  T --> S1[Search subscription]
  T --> S2[Notification subscription]
  T --> S3[Analytics subscription]
  S1 --> C1[Search consumers]
  S2 --> C2[Notification consumers]
  S3 --> C3[Analytics consumers]`;

const backgroundFlow = `flowchart LR
  A[API] -->|durable job| Q[Queue]
  Q --> W1[Worker]
  Q --> W2[Worker]
  W1 --> R[(Result store)]
  W2 --> R
  Q --> D[Dead-letter review]`;

const longJobFlow = `stateDiagram-v2
  [*] --> Pending
  Pending --> Running
  Running --> Running: checkpoint
  Running --> Succeeded
  Running --> Failed
  Running --> Canceling
  Canceling --> Canceled
  Failed --> Pending: retry from checkpoint`;

export function FanOutLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "fan-out",
  decision: "Use fan-out when one committed fact must drive independent consumers. Define whether every consumer receives a copy, which delivery may lag, and how one failing branch stays isolated from the others.",
  mechanism: ["Publish a stable event only after the source state and event are durably correlated.", "Give each independent consumer purpose its own subscription or durable cursor.", "Scale workers within a subscription as competing consumers; do not confuse that with cross-subscription fan-out.", "Make every consumer idempotent and expose backlog age, retries, and dead letters per branch.", "Set retention and replay policy so a repaired consumer can catch up without republishing the business event."],
  diagram: { chart: fanoutFlow, title: "One event, independent subscriber branches", description: "A publisher writes once to a topic. Separate search, notification, and analytics subscriptions each receive the event and scale their own consumer pool without sharing completion state." },
  interactive: <FanOutDemo />,
  example: { title: "A new marketplace listing", body: "The listing transaction emits one versioned ListingPublished event. Search indexes it, notifications evaluate subscriptions, and analytics records the fact. Search failure cannot block notification delivery, and replaying search does not resend notifications.", consequence: "Create subscriptions by independent effect and recovery policy, not by organizational convenience alone." },
  tradeoffs: [{ option: "Independent subscriptions", chooseWhen: "Every branch needs the full event and its own retry state.", cost: "Storage and delivery work multiply with subscribers." }, { option: "Shared work queue", chooseWhen: "Any one worker may perform the same task.", cost: "Consumers do not each receive a copy." }, { option: "Synchronous calls", chooseWhen: "The caller cannot succeed unless every dependency commits now.", cost: "Latency and availability couple to the slowest branch." }],
  failure: { failure: "A poison event retries forever in the notification branch.", impact: "That subscription's backlog grows while search and analytics appear healthy.", detection: "Per-subscription oldest-message age and repeated delivery count identify one event and branch.", mitigation: "Bound retries, quarantine with context, repair the handler or data, then replay only the affected subscription.", tradeoff: "Quarantine preserves throughput but delays or omits that effect until reviewed." },
  exercise: ["List each consumer and whether it needs every event or only shared work.", "Define ordering, retention, replay, and idempotency per subscription.", "Calculate amplification from one publish to storage, delivery, and downstream writes.", "Explain how one branch fails without blocking the others."],
  probes: ["What makes publication atomic with the source change?", "Does every subscriber receive every event?", "How do you add a new consumer without replaying unwanted side effects?", "Where is backpressure visible?"],
  practice: ["notification-service", "news-feed", "event-analytics"],
  remember: "Fan-out multiplies one fact into independent delivery obligations. Isolate cursor, retry, replay, and ownership for every branch.",
}} />; }

export function FanoutReadWriteLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "fanout-read-write",
  decision: "Choose where to pay fan-out cost. Fan-out-on-write precomputes recipient views when content changes; fan-out-on-read assembles them when a reader asks. The right answer follows audience size, read frequency, freshness, and skew.",
  mechanism: ["Estimate writers, followers per writer, reader sessions, items per feed, and acceptable freshness.", "For ordinary publishers, write recipient inbox references asynchronously and make delivery idempotent.", "For very large publishers, retain source posts and merge them into feeds at read time.", "Use stable cursors and versions so retries do not duplicate or reorder items unexpectedly.", "Measure write amplification, feed build latency, stale entries, celebrity skew, and storage per strategy."],
  example: { title: "A social feed with celebrity accounts", body: "Most posts fan out into follower inboxes, making ordinary feed reads cheap. Posts from accounts with millions of followers remain in an author stream and are merged into each reader's feed at request time.", consequence: "Use a hybrid threshold because one global strategy pays the worst cost for the most skewed users." },
  tradeoffs: [{ option: "Fan-out on write", chooseWhen: "Readers are frequent and publisher audiences are bounded.", cost: "Write amplification, stale inbox entries, and celebrity spikes." }, { option: "Fan-out on read", chooseWhen: "Writes are frequent, reads sparse, or audiences enormous.", cost: "Read latency and multi-stream ranking work grow." }, { option: "Hybrid", chooseWhen: "Audience size and activity are heavily skewed.", cost: "Two paths complicate ordering, caching, and diagnosis." }],
  failure: { failure: "A celebrity post enqueues millions of inbox writes into the same worker pool.", impact: "Ordinary users' posts and feed freshness are delayed behind one amplified event.", detection: "Queue age, fan-out cardinality, and per-author work show one source dominating capacity.", mitigation: "Switch high-cardinality authors to read-time merge, isolate fan-out tiers, and cap per-source scheduling.", tradeoff: "Hybrid reads spend more compute and can expose ordering differences between paths." },
  exercise: ["Estimate writes per post and reads per session for ordinary and celebrity users.", "Choose the threshold that moves a publisher to read-time merge.", "Define ordering across precomputed and read-time sources.", "Describe deletion and privacy propagation through both paths."],
  probes: ["Where is ranking performed?", "How quickly does an unfollow remove content?", "How does a retry avoid duplicate inbox entries?", "What happens when a user follows ten celebrity accounts?"],
  practice: ["news-feed", "notification-service"],
  remember: "Fan-out-on-write buys cheap reads with amplified writes; fan-out-on-read buys cheap writes with assembled reads. Model skew and use a hybrid when the population is not uniform.",
}} />; }

export function BackgroundJobsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "background-jobs",
  decision: "Move work to a background job when the caller does not need its completed effect before receiving a truthful response. Define durable acceptance, result state, retries, and ownership before removing the work from the request.",
  mechanism: ["Validate authorization and input synchronously, then commit a job record or message with an idempotency identity.", "Return an accepted state that names what has and has not completed.", "Lease work to bounded consumers and renew or redeliver it when a worker disappears.", "Make side effects idempotent, classify retryable failures, and quarantine exhausted jobs.", "Persist terminal state and expose progress or notification only when the product needs it."],
  diagram: { chart: backgroundFlow, title: "Durable background job path", description: "An API durably enqueues a job, two competing workers process queue items, completed outputs go to a result store, and exhausted failures move to a reviewable dead-letter path." },
  example: { title: "Generate a monthly account export", body: "The API validates the owner and creates an export job, then returns its identifier. A worker reads a consistent snapshot, writes the encrypted archive, records expiry, and marks the job complete. The UI polls a status resource.", consequence: "Treat the export and its downloadable artifact as a stateful product workflow, not a fire-and-forget function call." },
  tradeoffs: [{ option: "Inline work", chooseWhen: "Completion is fast, bounded, and required for the response.", cost: "The request inherits dependency latency and retry uncertainty." }, { option: "Queued job", chooseWhen: "Durable acceptance may precede completion.", cost: "Status, duplicates, cancellation, backlog, and cleanup need design." }, { option: "Scheduled sweep", chooseWhen: "Work can be discovered periodically from authoritative state.", cost: "Discovery delay and repeated scans trade simplicity for freshness." }],
  failure: { failure: "A worker sends email and crashes before acknowledging the job.", impact: "Redelivery can send the same message twice.", detection: "One job identity appears in repeated attempts with an external side effect before terminal state.", mitigation: "Use an idempotency key at the provider boundary or an effect ledger that atomically records the claim.", tradeoff: "Effect deduplication adds storage and may require provider cooperation." },
  exercise: ["Write the API response for accepted, running, failed, and completed states.", "Choose the job identity, lease duration, retry classes, and dead-letter owner.", "List every side effect and its deduplication boundary.", "Set a backlog-age objective and overload response."],
  probes: ["What is guaranteed when the API returns?", "Who retries after a worker crash?", "Can the user cancel after work starts?", "How are abandoned results expired?"],
  practice: ["job-scheduler", "notification-service", "media-processing"],
  remember: "Background work is a durable state machine. A queue decouples time; it does not remove the need for truthful status, idempotency, recovery, and cleanup.",
}} />; }

export function LongRunningJobsLessonContent() { return <ArchitecturePatternLesson spec={{
  id: "long-running-jobs",
  decision: "A long-running job must survive process restarts, deployment, cancellation, and partial progress. Model it as persisted state with checkpoints rather than one extended function invocation.",
  mechanism: ["Create a durable operation with an immutable input reference and explicit pending state.", "Divide work into restartable stages or chunks and checkpoint committed progress.", "Lease one stage at a time, heartbeat while useful work continues, and reclaim expired leases.", "Treat cancellation as a requested transition that workers observe at safe boundaries.", "Publish terminal output atomically with the succeeded state and retain enough evidence to diagnose or resume failure."],
  diagram: { chart: longJobFlow, title: "Long-running job state machine", description: "A job moves from pending to running, records repeated checkpoints, and ends succeeded, failed, or canceled. A failed job may retry from its last valid checkpoint instead of restarting all work." },
  example: { title: "Re-index a tenant's search corpus", body: "A coordinator snapshots the target version and creates shard tasks. Workers checkpoint completed ranges into a new index. Validation compares counts and samples before one atomic alias switch publishes the result.", consequence: "Keep the old serving index until the complete new version is validated, making rollback a pointer change rather than another rebuild." },
  tradeoffs: [{ option: "Fine checkpoints", chooseWhen: "Work is expensive and replay must be small.", cost: "Checkpoint I/O and state transitions increase." }, { option: "Coarse checkpoints", chooseWhen: "Stages are cheap and naturally idempotent.", cost: "Failures repeat more work." }, { option: "One long lease", chooseWhen: "Work cannot expose a safe restart boundary.", cost: "Recovery is slow and false worker death is hard to distinguish." }],
  failure: { failure: "A deployment kills a worker after it wrote output but before recording the checkpoint.", impact: "The replacement repeats the chunk and may corrupt or duplicate output.", detection: "Output contains duplicate chunk identity or the checkpoint trails committed artifact versions.", mitigation: "Write deterministic chunk keys and make checkpoint publication conditional on the expected job revision.", tradeoff: "Deterministic staging consumes temporary storage and metadata." },
  exercise: ["Draw all job states, legal transitions, and terminal states.", "Choose checkpoint boundaries and prove every stage is restartable.", "Define cancellation behavior during each stage.", "Explain how output becomes visible and how an old version is retained."],
  probes: ["What happens during a deployment?", "How do you distinguish a slow worker from a dead one?", "Can progress move backward?", "Where is the point of no return for cancellation?"],
  practice: ["job-scheduler", "search-engine", "web-crawler"],
  remember: "Persist progress at restartable boundaries and publish output only after validation. Long duration turns process lifecycle into a correctness concern.",
}} />; }
