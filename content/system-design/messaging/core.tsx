import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { MessagingLessonEnd } from "./shared";

const syncAsync = `flowchart LR
  C[Client] --> A[Checkout API]
  A --> P[Payment: critical]
  A --> Q[(Queue)]
  Q --> E[Email worker]
  Q --> N[Analytics worker]
  Q --> R[Receipt worker]`;
const queueFlow = `flowchart LR
  A[API servers] --> Q[(Queue)]
  Q --> W1[Worker 1]
  Q --> W2[Worker 2]
  Q --> W3[Worker 3]
  W1 -. acknowledge .-> Q`;
const pubsubFlow = `flowchart LR
  P[Publisher] --> T[Order events topic]
  T --> E[Email subscription]
  T --> A[Analytics subscription]
  T --> F[Fraud subscription]`;
const streamFlow = `flowchart LR
  E100[Offset 100 · A] --> E101[Offset 101 · B] --> E102[Offset 102 · C] --> E103[Offset 103 · D]`;

export function SyncVsAsyncLessonContent() { return <>
  <LessonHeading level={2} id="slow-checkout">Move only deferrable work off the request path</LessonHeading><p>If checkout waits for payment, inventory, email, analytics, and receipt generation in sequence, latency accumulates and one slow optional dependency becomes user-facing. Keep the correctness-critical acknowledgement boundary synchronous; enqueue work that may safely finish later.</p>
  <MermaidDiagram chart={syncAsync} title="Checkout with a short critical path" description="Checkout handles payment synchronously, while email, analytics, and receipt work continue through a queue." />
  <TradeoffTable><table><thead><tr><th>Prefer synchronous</th><th>Prefer asynchronous</th></tr></thead><tbody><tr><td>Immediate result, authorization, required commit</td><td>Email, notification, indexing, media processing</td></tr><tr><td>Simple low-volume operation</td><td>Long-running work, retries, burst absorption</td></tr><tr><td>Delayed failure breaks the contract</td><td>Completion can be observed later</td></tr></tbody></table></TradeoffTable>
  <LessonCallout variant="tradeoff"><p>Async work changes the product contract: acceptance is not completion. Expose job state and failure where users need it.</p></LessonCallout><MessagingLessonEnd id="sync-vs-async" practice={["notification-service", "job-scheduler", "ecommerce"]}>Async processing decouples optional work from response latency; it does not make correctness-critical completion optional.</MessagingLessonEnd>
  </>; }

export function MessageQueuesLessonContent() { return <>
  <LessonHeading level={2} id="buffer-between-rates">A queue buffers work between independent rates</LessonHeading><p>Producers append jobs; consumers receive, process, and acknowledge them. The queue holds durable work according to its retention policy and exposes backlog when production temporarily exceeds processing.</p><MermaidDiagram chart={queueFlow} title="A queue feeding an independent worker pool" description="API servers publish jobs to a queue, three workers compete for work, and successful work is acknowledged." />
  <WorkedExample title="Size workers and measure a spike"><AssumptionBox><pre><code>{`Incoming = 10,000 jobs/sec
Worker capacity = 100 jobs/sec`}</code></pre></AssumptionBox><FormulaBlock title="Steady-state workers">{`10,000 / 100 = 100 workers`}</FormulaBlock><p>If ingress spikes to 25,000/sec while processing remains 10,000/sec, backlog grows by about 15,000 jobs every second. A queue absorbs the burst only until storage, retention, or latency becomes unacceptable.</p></WorkedExample>
  <p>Track queue depth, oldest-message age, attempt count, processing latency, errors, and worker saturation. Scale from processing cost and backlog age—not depth alone.</p><CommonMistakes><ul><li>Assuming a queue fixes sustained overload.</li><li>Deleting before side effects succeed.</li><li>Ignoring duplicate delivery and poison jobs.</li></ul></CommonMistakes><MessagingLessonEnd id="message-queues" practice={["notification-service", "job-scheduler", "web-crawler"]}>A queue separates producer and consumer speed. Always discuss acknowledgement, retry, duplicates, backlog, and worker failure.</MessagingLessonEnd>
  </>; }

export function ProducersConsumersLessonContent() { return <>
  <LessonHeading level={2} id="worker-pool">Worker pools convert backlog into bounded concurrency</LessonHeading><p>Several workers typically compete so one logical job is owned by one worker at a time. Concurrency limits protect downstream systems; fairness and slow-job isolation keep one class from starving another.</p>
  <pre><code>{`receive → process → acknowledge
crash before acknowledgement → message may become available again`}</code></pre><p>In SQS-style systems, a visibility timeout temporarily hides an in-flight message. Too short can create concurrent duplicates; too long delays retry after a crash. The lease name and exact behavior are product-specific.</p>
  <InterviewFollowUps><ul><li>What if a worker crashes after the side effect but before ACK?</li><li>What if one job takes 30 minutes?</li><li>How do poison jobs avoid blocking healthy work?</li><li>Which downstream concurrency limit caps the pool?</li></ul></InterviewFollowUps><MessagingLessonEnd id="producers-consumers" practice={["job-scheduler", "notification-service", "web-crawler"]}>Scale workers independently, but bound concurrency and design the receive–process–acknowledge lifecycle for crashes and slow jobs.</MessagingLessonEnd>
  </>; }

export function QueueVsPubsubLessonContent() { return <>
  <LessonHeading level={2} id="work-vs-event">Distribute work or distribute an event</LessonHeading><TradeoffTable><table><thead><tr><th>Question</th><th>Queue-oriented</th><th>Pub/Sub-oriented</th></tr></thead><tbody><tr><td>Who receives it?</td><td>One competing worker typically handles the job</td><td>Each independent subscription may receive the event</td></tr><tr><td>Example</td><td>Resize one image</td><td>OrderCreated to email, analytics, fraud</td></tr><tr><td>Backlog</td><td>Owned by work queue</td><td>Often per durable subscription</td></tr><tr><td>Purpose</td><td>Distribute execution</td><td>Fan out a fact</td></tr></tbody></table></TradeoffTable><p>Products combine both: an event fans out to several subscriptions, and each subscription feeds its own competing worker pool.</p><MessagingLessonEnd id="queue-vs-pubsub" practice={["notification-service", "news-feed", "job-scheduler"]}>Queues distribute work; Pub/Sub distributes an event to independent consumers. Real systems can layer both models.</MessagingLessonEnd>
  </>; }

export function PubSubLessonContent() { return <>
  <LessonHeading level={2} id="fan-out">One fact, independent reactions</LessonHeading><p>A publisher writes an event to a topic. Independent subscriptions let notification, analytics, fraud, or other subscribers maintain separate progress and retry behavior where the platform supports durable subscriptions.</p><MermaidDiagram chart={pubsubFlow} title="Order event fan-out" description="One Order event reaches independent email, analytics, and fraud subscriptions." />
  <WorkedExample title="VideoUploaded"><p>The upload service publishes one event instead of synchronously invoking transcoding, moderation, thumbnail, analytics, and notification services. Each consumer can scale and fail independently, while the product accepts eventual completion.</p></WorkedExample><p>Costs include duplicate delivery, ordering, schema evolution, tracing, and a slow subscriber&apos;s growing backlog.</p><MessagingLessonEnd id="pub-sub" practice={["notification-service", "news-feed", "event-analytics"]}>Use Pub/Sub when one event should reach multiple independent consumers, with explicit delivery, ordering, schema, and debugging behavior.</MessagingLessonEnd>
  </>; }

export function EventStreamingLessonContent() { return <>
  <LessonHeading level={2} id="retained-history">A stream is a retained ordered history</LessonHeading><MermaidDiagram chart={streamFlow} title="Offsets in an append-only log" description="Four events occupy consecutive positions 100 through 103 in one retained log partition." /><p>Consumers track an offset or checkpoint, can resume after failure, and may replay retained history. Ordering belongs to a particular log or partition; multiple consumers can maintain independent positions.</p><LessonCallout variant="common-mistake"><p>Queues do not universally delete immediately, and streams do not retain forever. Compare the configured ownership, acknowledgement, and retention models.</p></LessonCallout><MessagingLessonEnd id="event-streaming" practice={["metrics-platform", "event-analytics", "kafka-platform"]}>A stream emphasizes retained event history, consumer position, and replay rather than only pending work.</MessagingLessonEnd>
  </>; }

export function QueueVsStreamLessonContent() { return <>
  <LessonHeading level={2} id="choose-mental-model">Choose from work ownership and history requirements</LessonHeading><TradeoffTable><table><thead><tr><th>Property</th><th>Queue-oriented model</th><th>Stream/log model</th></tr></thead><tbody><tr><td>Primary model</td><td>Pending work</td><td>Retained event history</td></tr><tr><td>Replay</td><td>Often limited</td><td>Commonly central</td></tr><tr><td>Progress</td><td>Broker/work ownership</td><td>Offset or checkpoint</td></tr><tr><td>Independent readers</td><td>Possible through subscriptions</td><td>Natural through separate positions</td></tr><tr><td>Ordering</td><td>Implementation-dependent</td><td>Typically partition-scoped</td></tr><tr><td>Retention</td><td>Often until processed plus policy</td><td>Usually time/size/compaction policy</td></tr></tbody></table></TradeoffTable><MessagingLessonEnd id="queue-vs-stream" practice={["job-scheduler", "metrics-platform", "kafka-platform"]}>Use a queue when work dispatch is primary; use a stream when retained history, replay, and independent reader progress matter.</MessagingLessonEnd>
  </>; }
