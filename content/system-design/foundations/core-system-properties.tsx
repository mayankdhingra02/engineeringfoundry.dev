import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { FurtherReading, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { foundationSources } from "./sources";

const horizontalScaling = `flowchart LR
  U[Users] --> LB[Load balancer]
  LB --> A[Server A]
  LB --> B[Server B]
  LB --> C[Server C]`;

export function CoreSystemPropertiesLessonContent() {
  return <>
    <LessonHeading level={2} id="properties-are-design-tests">Use properties to test a design</LessonHeading>
    <p>Your service handles 2,000 requests per second today. The interviewer asks what happens at 200,000, then removes a server, slows the database, and adds users on another continent. Core system properties give you precise questions for each change.</p>

    <LessonHeading level={2} id="scalability">Scalability: can goals survive workload growth?</LessonHeading>
    <p>Scalability is not simply “handles more traffic.” Ask which workload grows, which resource saturates, and whether latency, correctness, and availability still meet the agreed goals.</p>
    <h3>Vertical scaling</h3>
    <p>Add CPU, memory, storage, or network capacity to one machine. It is operationally simple and often the correct early step, but each machine has a ceiling, larger instances can be expensive, and the failure domain remains concentrated.</p>
    <h3>Horizontal scaling</h3>
    <p>Add machines and distribute work. This supports incremental growth and can distribute failures, but creates load-balancing, coordination, partitioning, deployment, and observability work.</p>
    <MermaidDiagram chart={horizontalScaling} title="Horizontal application scaling" description="Users reach a load balancer, which routes requests across Server A, Server B, and Server C. This adds capacity and instance redundancy, while introducing routing and health-check requirements." />
    <LessonCallout variant="tradeoff"><p>More instances do not automatically scale a system. Shared locks, one hot partition, a single database writer, or a slow dependency can remain the limiting resource.</p></LessonCallout>

    <LessonHeading level={2} id="latency-throughput">Latency and throughput answer different questions</LessonHeading>
    <p><strong>Latency</strong> measures how long one operation takes. <strong>Throughput</strong> measures how much work completes per unit of time. A service can process 100K requests per second while an individual request still takes 800 ms. High throughput does not imply low latency.</p>
    <p>Interviewers care about throughput for capacity and latency for user-visible behavior. Batching may improve throughput while making an individual item wait longer; extra parallelism may reduce one bottleneck while increasing contention elsewhere.</p>

    <LessonHeading level={2} id="percentile-latency">Percentiles reveal the tail</LessonHeading>
    <pre><code>{`p50 = 80 ms
p95 = 250 ms
p99 = 1.2 sec`}</code></pre>
    <p>About half of requests finish at or below 80 ms, 95% at or below 250 ms, and 99% at or below 1.2 seconds. The remaining 1% are slower than that p99 value. These are example measurements, not targets.</p>
    <p>An average can look healthy while a small but important group waits much longer. Tail latency matters because a page may depend on several services and because a 1% problem affects many users at large request volume.</p>

    <LessonHeading level={2} id="availability">Availability: can the operation be served when needed?</LessonHeading>
    <p>Availability should be defined for a concrete operation: successful redirects, readable conversations, or accepted payments. At 99.9% time-based availability, the unavailable budget is roughly 8.76 hours per 365-day year. That approximation is context, not a table to memorize.</p>
    <p>Redundant instances, health checks, failover, multiple zones, and isolation from failing dependencies can improve availability. The design still needs a behavior for partial failure: reject, retry, serve stale data, queue work, or degrade a feature.</p>

    <LessonHeading level={2} id="reliability">Reliability and correctness: successful responses can still be wrong</LessonHeading>
    <p>A payment API may return a successful response while charging twice. It was available for that request, but it did not behave reliably or preserve the required invariant. In an interview, say which outcomes must be correct and how retries, duplicate requests, and partial completion are handled.</p>

    <LessonHeading level={2} id="durability">Durability: what survives after acknowledgement?</LessonHeading>
    <p>An uploaded photo, transaction record, or message history is durable when the system can preserve the acknowledged write across the failures in scope. Persistent storage, replication, acknowledgement rules, and backups all contribute, but they protect against different failures and restore at different speeds.</p>

    <LessonHeading level={2} id="fault-tolerance">Fault tolerance: design expected failures into the path</LessonHeading>
    <p>Fault tolerance does not mean nothing fails. It means the system can continue, recover, or degrade predictably when components fail. Redundancy, bounded retries, replication, failover, isolation, and graceful degradation are tools; each requires a stated failure model.</p>

    <LessonHeading level={2} id="bottlenecks">Bottlenecks: find the constrained resource</LessonHeading>
    <WorkedExample title="A cache miss exposes the database">
      <pre><code>{`API capacity:       100K RPS
Cache capacity:     200K RPS
Database capacity:    8K RPS`}</code></pre>
      <p>If cache misses rise, the database is the likely bottleneck. At a 95% hit rate, 100K incoming RPS produces about 5K database RPS; a modest hit-rate drop can cross the 8K limit. The answer may involve admission control, origin protection, more efficient queries, or additional database capacity, depending on the failure.</p>
    </WorkedExample>
    <p>Look beyond CPU: memory, network bandwidth, storage IOPS, locks, hot partitions, connection limits, and downstream services can all constrain the system.</p>

    <LessonHeading level={2} id="redundancy">Redundancy buys options, not free reliability</LessonHeading>
    <p>Multiple instances can preserve service through one instance failure, but they introduce routing, health checking, replication, failover, consistency, and cost questions. Redundant components that share one power, network, configuration, or data dependency may still fail together.</p>

    <LessonHeading level={2} id="tradeoff-map">A compact property-to-technique map</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Goal</th><th>Common techniques</th><th>New problems introduced</th></tr></thead><tbody>
      <tr><td>Lower latency</td><td>Caching, edge delivery, regional deployment</td><td>Staleness, invalidation, complexity</td></tr>
      <tr><td>Higher throughput</td><td>Horizontal scaling, partitioning, asynchronous processing</td><td>Coordination, ordering, uneven load</td></tr>
      <tr><td>Higher availability</td><td>Redundancy, replication, failover</td><td>Consistency behavior, testing, cost</td></tr>
      <tr><td>Higher durability</td><td>Persistent storage, replication, backups</td><td>Write latency, recovery work, storage cost</td></tr>
    </tbody></table></TradeoffTable>
    <p>These are starting points, not laws. The right technique depends on the operation, workload, failure model, and budget.</p>
    <PracticeConnections ids={["payment-system", "ticketmaster", "chat-system", "search-autocomplete", "video-streaming"]} />
    <FurtherReading items={foundationSources["core-system-properties"]} />
    <RememberThis><p>Name the property per operation, attach a measurable goal, find the resource or failure that threatens it, and explain the cost of the mitigation. Availability, correctness, durability, latency, and throughput are related but not interchangeable.</p></RememberThis>
  </>;
}
