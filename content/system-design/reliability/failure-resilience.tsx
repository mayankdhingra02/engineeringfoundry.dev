import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FailureChecklist, FailureDeepDive, FormulaBlock, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { ReliabilityLessonEnd } from "./shared";

const chain = `flowchart TD
  C[Client] --> A[API]
  A --> SA[Service A]
  SA --> SB[Service B]
  SB --> D[(Database)]
  SB -. slow or unreachable .-> SA`;
const retryTimeline = `sequenceDiagram
  participant C as Caller
  participant D as Dependency
  C->>D: attempt 1
  D--xC: transient failure
  Note over C: wait + jitter
  C->>D: attempt 2
  D--xC: failure
  Note over C: longer wait + jitter
  C->>D: attempt 3
  D-->>C: success`;
const breaker = `stateDiagram-v2
  [*] --> Closed
  Closed --> Open: failures exceed policy
  Open --> HalfOpen: cooldown
  HalfOpen --> Closed: limited probes succeed
  HalfOpen --> Open: probe fails`;
const bulkheads = `flowchart LR
  I[Incoming jobs] --> P[Payment pool]
  I --> M[Media pool]
  I --> N[Notification pool]
  M -. saturated .-> M
  P --> PD[Payment dependency]`;

export function FailureThinkingLessonContent() { return <>
  <LessonHeading level={2} id="partial-not-binary">A healthy caller can depend on a partially broken system</LessonHeading><p>Service B stops returning, but it has not crashed. Service A keeps sockets and workers occupied, requests accumulate, and the healthy API eventually becomes unavailable too. Distributed failures include crashes, delay, dropped packets, duplicate delivery, stale replicas, overloaded dependencies, unavailable zones, and network partitions.</p><MermaidDiagram chart={chain} title="One slow dependency can spread failure upstream" description="A client reaches an API, Service A, Service B, and a database; Service B is slow or unreachable." />
  <p>Ask harder questions than “is it up?” What if B finishes but its response is lost? What if the database commits but its acknowledgement disappears? What if A reaches the database while B cannot? Each observer may have a different, incomplete view.</p><FailureChecklist /><FailureDeepDive failure="Service B stops responding" impact="Service A exhausts its request workers" detection="Dependency latency and deadline errors rise" mitigation="Bound the call, isolate resources, and return an intentional fallback" tradeoff="The response may be incomplete or stale" />
  <ReliabilityLessonEnd id="failure-thinking" practice={["news-feed", "payment-system", "notification-service"]}>Assume remote components can be slow, ambiguous, and only partly reachable. For each critical dependency, trace impact, containment, recovery, and the trade-off introduced.</ReliabilityLessonEnd>
  </>; }

export function TimeoutsLessonContent() { return <>
  <LessonHeading level={2} id="bounded-failure">Turn an unbounded wait into a bounded failure</LessonHeading><p>An API calling a payment service without a timeout can retain a connection, request slot, and memory indefinitely. A connection timeout bounds establishment; a request/read timeout bounds waiting for work; an end-to-end deadline bounds the user operation across nested calls.</p>
  <WorkedExample title="Allocate one 500 ms deadline"><AssumptionBox><pre><code>{`Authentication ~40 ms
Inventory      ~100 ms
Payment        ~200 ms
Application     ~60 ms`}</code></pre></AssumptionBox><FormulaBlock title="Illustrative planned work">{`40 + 100 + 200 + 60 = 400 ms
Remaining contingency = 100 ms`}</FormulaBlock><p>Giving every downstream call 500 ms allows a nested call to consume the entire user budget. Propagate the deadline and allocate smaller budgets with contingency; actual values should follow measured latency distributions and product requirements.</p></WorkedExample>
  <TradeoffTable><table><thead><tr><th>Too short</th><th>Too long</th></tr></thead><tbody><tr><td>Healthy tail requests fail; retries rise</td><td>Resources remain occupied; queues grow</td></tr><tr><td>False failure signals</td><td>Slow failures propagate upstream</td></tr></tbody></table></TradeoffTable><LessonCallout variant="common-mistake"><p>“Retry if it fails” is incomplete until the caller can distinguish bounded failure from a dependency that is merely still running.</p></LessonCallout><ReliabilityLessonEnd id="timeouts" practice={["payment-system", "notification-service"]}>Bound every remote wait within the end-to-end deadline. Choose timeouts from the latency budget and observed behavior, not arbitrary round numbers.</ReliabilityLessonEnd>
  </>; }

export function RetriesLessonContent() { return <>
  <LessonHeading level={2} id="multiply-work">Retries spend more work during a failure</LessonHeading><p>Retries can recover from transient connection errors, brief unavailability, some server failures, and policy-approved throttling responses. Repeating malformed input, failed authorization, or a permanent constraint violation usually changes nothing.</p><WorkedExample title="A simplified retry storm"><AssumptionBox><pre><code>{`Original traffic = 10,000 requests/sec
Maximum retries = 2`}</code></pre></AssumptionBox><FormulaBlock title="Potential attempt rate">{`10,000 original + 10,000 retry 1 + 10,000 retry 2
≈ 30,000 attempts/sec`}</FormulaBlock><p>This worst-case illustration ignores timing and successful attempts, but exposes the amplification risk. Cap attempts and elapsed time, honor the request deadline, and use a retry budget so callers cannot create unlimited recovery traffic.</p></WorkedExample><CommonMistakes><ul><li>Retrying every error.</li><li>Retrying at several layers and multiplying attempts.</li><li>Retrying a side effect before making the operation idempotent.</li></ul></CommonMistakes><ReliabilityLessonEnd id="retries" practice={["payment-system", "notification-service", "job-scheduler"]}>Retries are for appropriate transient failures. Bound them by attempts, time, and budget—and make the repeated business operation safe.</ReliabilityLessonEnd>
  </>; }

export function BackoffJitterLessonContent() { return <>
  <LessonHeading level={2} id="desynchronize">Give an unhealthy dependency space to recover</LessonHeading><p>Immediate retries preserve contention. Exponential backoff increases delay between attempts—conceptually 1, 2, 4, then 8 seconds, normally with a cap. Exact delays depend on the workload.</p><MermaidDiagram chart={retryTimeline} title="Retries with increasing randomized waits" description="A request fails twice, waits longer with jitter after each failure, and succeeds on its third attempt." /><p>Backoff alone can synchronize 100,000 clients into another wave. Jitter randomizes retry time so clients do not return in lockstep. Different algorithms distribute delay differently; the architectural requirement is to avoid a synchronized surge.</p><ReliabilityLessonEnd id="exponential-backoff-jitter" practice={["notification-service", "web-crawler"]}>Backoff reduces pressure; jitter spreads clients across time. Both still require bounded attempts, deadlines, retryable errors, and idempotency.</ReliabilityLessonEnd>
  </>; }

export function IdempotencyLessonContent() { return <>
  <LessonHeading level={2} id="lost-response">The response can be lost after the effect succeeds</LessonHeading><p>A payment commits, but the client times out before receiving the response. The client cannot infer failure. Retrying without an idempotency contract can charge twice.</p><pre><code>{`POST /payments
Idempotency-Key: payment-attempt-9382`}</code></pre><p>The service records a scoped key, request identity or hash, operation status, and result. The same valid key reuses the original outcome. A natural identifier such as <code>refund_request_id</code> or <code>order_id + operation</code> can enforce the same business invariant.</p>
  <FailureDeepDive failure="Two callers submit the same key concurrently" impact="Both may execute the side effect" detection="Unique-key conflict or in-progress record" mitigation="Atomically claim the key with the business transition, then persist the result" tradeoff="Records need retention, conflict semantics, and recovery for incomplete work" /><LessonCallout variant="common-mistake"><p>Checking “does the key exist?” and performing work as a separate unprotected step still races.</p></LessonCallout><InterviewFollowUps><ul><li>What scope makes the key unique?</li><li>What if the same key carries a different payload?</li><li>What happens after retention expires?</li><li>How does an in-progress duplicate wait or respond?</li></ul></InterviewFollowUps><ReliabilityLessonEnd id="idempotency" practice={["payment-system", "ticketmaster", "job-scheduler"]}>When success is ambiguous, repeated requests must not repeat the business effect. Enforce the key and state transition atomically.</ReliabilityLessonEnd>
  </>; }

export function CircuitBreakerLessonContent() { return <>
  <LessonHeading level={2} id="known-unhealthy">Stop spending resources on a known unhealthy dependency</LessonHeading><p>Closed requests flow normally. After a configured failure policy is exceeded, Open calls fail fast or use a fallback. After a cooldown, Half-Open admits limited probes; success closes the breaker and failure opens it again.</p><MermaidDiagram chart={breaker} title="Circuit breaker state transitions" description="Closed opens after excessive failures, later probes in half-open, and either closes on success or opens again on failure." />
  <TradeoffTable><table><thead><tr><th>Retry</th><th>Circuit breaker</th></tr></thead><tbody><tr><td>Could this request succeed if attempted again?</td><td>Should callers currently attempt this dependency?</td></tr><tr><td>Consumes another attempt</td><td>Fails fast while open</td></tr></tbody></table></TradeoffTable><p>They can work together. Poor thresholds can open on noise; simultaneous probes can spike recovery; stale fallbacks can hide prolonged failure. A breaker contains propagation—it does not repair the dependency.</p><ReliabilityLessonEnd id="circuit-breaker" practice={["news-feed", "api-gateway-system", "notification-service"]}>Use a circuit breaker when repeated calls to a known unhealthy dependency would waste resources. Define fallback, recovery probes, and observable state.</ReliabilityLessonEnd>
  </>; }

export function BulkheadsLessonContent() { return <>
  <LessonHeading level={2} id="isolate-resources">One workload should not consume every shared resource</LessonHeading><p>Image processing saturates a general worker pool, so payment work cannot run. Separate worker groups, queues, connection pools, thread pools, or tenant cells keep one failure domain from exhausting everything.</p><MermaidDiagram chart={bulkheads} title="Independent workload pools" description="Payment, media, and notification jobs use separate pools; media saturation does not consume payment capacity." /><p>Isolation costs capacity and operational complexity and may strand idle resources. Choose boundaries from business criticality and shared failure risk rather than creating a pool per endpoint.</p><ReliabilityLessonEnd id="bulkheads" practice={["job-scheduler", "payment-system"]}>Bulkheads isolate scarce resources so one workload cannot consume them all. The trade-off is extra capacity planning and operational overhead.</ReliabilityLessonEnd>
  </>; }

export function GracefulDegradationLessonContent() { return <>
  <LessonHeading level={2} id="preserve-core">Preserve the essential user outcome</LessonHeading><p>If recommendations fail, keep product, price, cart, and checkout. If feed ranking fails, return a chronological feed. If comments fail, keep video playback. Classify critical and optional dependencies before the incident.</p><TradeoffTable><table><thead><tr><th>Technique</th><th>Cost</th></tr></thead><tbody><tr><td>Cached or stale result</td><td>Freshness decreases</td></tr><tr><td>Simplified response</td><td>Quality/features decrease</td></tr><tr><td>Read-only mode</td><td>Writes are delayed or rejected</td></tr></tbody></table></TradeoffTable><p>Fallback paths require capacity, correctness, and failure testing. They can conceal a long-running outage if their use is not observable.</p><ReliabilityLessonEnd id="graceful-degradation" practice={["ecommerce", "news-feed", "video-streaming"]}>Identify the critical product path and intentionally degrade optional work. A fallback is another production path that must be tested.</ReliabilityLessonEnd>
  </>; }

export function LoadSheddingLessonContent() { return <>
  <LessonHeading level={2} id="controlled-rejection">A controlled partial failure can prevent total collapse</LessonHeading><WorkedExample title="Demand exceeds safe capacity"><AssumptionBox><pre><code>{`Safe capacity = 20,000 requests/sec
Incoming       = 50,000 requests/sec`}</code></pre></AssumptionBox><p>Trying to queue all 50,000 can explode latency, trigger timeouts and retries, and make useful throughput fall. Admission control rejects excess or lower-priority work cheaply so critical requests retain capacity.</p></WorkedExample><p>Options include tenant quotas, lower-priority task drops, disabling expensive features, sampling telemetry, or cached responses. HTTP 429 or 503 can communicate rejection when appropriate. Define fairness and prevent retrying clients from erasing the protection.</p><ReliabilityLessonEnd id="load-shedding" practice={["api-gateway-system", "metrics-platform", "news-feed"]}>Reject work deliberately when processing it would destabilize the system. Preserve critical traffic, communicate retry policy, and plan recovery.</ReliabilityLessonEnd>
  </>; }

export function BackpressureReliabilityLessonContent() { return <>
  <LessonHeading level={2} id="slow-or-drop">Slow upstream or reject work</LessonHeading><p>Backpressure slows producers or upstream sources when consumers cannot keep up. Load shedding rejects or drops work that cannot be processed safely. They complement each other: bounded buffers propagate pressure first, while admission control protects the system when waiting is no longer acceptable.</p><p>This is the reliability lens; the queue mechanics live in the <Link href="/system-design/fundamentals/backpressure">canonical Backpressure lesson</Link>.</p><ReliabilityLessonEnd id="backpressure-reliability" practice={["metrics-platform", "job-scheduler"]}>Backpressure slows incoming work; load shedding rejects work. Use bounded capacity and explicit product semantics for both.</ReliabilityLessonEnd>
  </>; }
