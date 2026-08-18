import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { TokenBucketDemo } from "@/components/token-bucket-demo";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable } from "@/components/system-design-article";
import { networkingSources } from "./sources";

const loadBalancing = `flowchart LR
  U[Users] --> L[Load balancer]
  L --> A[Server A]
  L --> B[Server B]
  L --> C[Server C]
  L -. health checks .-> A
  L -. health checks .-> B
  L -. health checks .-> C`;

const apiGateway = `flowchart LR
  C[Clients] --> G[API gateway]
  G --> U[User service]
  G --> P[Payment service]
  G --> N[Notification service]`;

const discovery = `flowchart LR
  A[Service A] -->|lookup Service B| R[(Service registry)]
  B1[Service B1] -->|register + health| R
  B2[Service B2] -->|register + health| R
  B3[Service B3] -->|register + health| R
  A -->|request| B2`;

const distributedLimiter = `flowchart LR
  C[Client] --> L[Load balancer]
  L --> A[API server 1]
  L --> B[API server 2]
  L --> D[API server 3]
  A --> S[(Shared limiter state)]
  B --> S
  D --> S`;

export function LoadBalancingLessonContent() {
  return <>
    <LessonHeading level={2} id="clients-need-one-entry">Clients need one stable entry, not a server inventory</LessonHeading>
    <p>You add a second application server, then a third. Clients need a way to reach a healthy instance without learning which machines exist. A load balancer accepts traffic and selects a target according to health, routing policy, and available request information.</p>
    <MermaidDiagram chart={loadBalancing} title="Traffic distributed across healthy servers" description="Users reach one load-balancing layer, which performs health checks and routes traffic across Server A, Server B, and Server C." />

    <LessonHeading level={2} id="routing-algorithms">The workload should influence the algorithm</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Algorithm</th><th>Useful when</th><th>Watch for</th></tr></thead><tbody><tr><td>Round robin</td><td>Targets and requests are broadly similar</td><td>Long requests can create uneven in-flight work</td></tr><tr><td>Weighted round robin</td><td>Targets have different capacity or are being introduced gradually</td><td>Weights become another control to tune</td></tr><tr><td>Least connections / outstanding requests</td><td>Request duration varies</td><td>Connection count may not equal actual cost</td></tr><tr><td>Hash-based routing</td><td>Affinity by client or key matters</td><td>Skew and target changes can move load</td></tr></tbody></table></TradeoffTable>
    <p><Link href="/system-design/fundamentals/consistent-hashing">Consistent hashing</Link> reduces remapping when targets change, but hot keys and uneven work still require explicit handling.</p>

    <LessonHeading level={2} id="health-and-draining">Health checks remove targets; draining protects in-flight work</LessonHeading>
    <p>Periodic checks mark a backend unhealthy and restore it after recovery criteria are met. A shallow check can pass while a critical dependency is broken; a deep check can remove every backend during a shared dependency failure. Thresholds, timeouts, startup readiness, and connection draining shape the behavior.</p>

    <LessonHeading level={2} id="sessions-and-layers">Sticky sessions, L4, and L7</LessonHeading>
    <p>Sticky routing sends a client back to the same target. It can simplify local session state, but backend failure loses affinity and uneven clients produce uneven load. Shared or external session state often makes application replicas easier to scale, though stickiness is not inherently wrong.</p>
    <p>An L4 balancer routes from transport information such as IP and port. An L7 balancer understands HTTP information such as hostname, path, or headers, enabling rules like:</p>
    <pre><code>{`/api/payments/* → Payment Service
/api/users/*    → User Service`}</code></pre>
    <p>L7 adds application-aware flexibility and processing; L4 can operate with less application interpretation.</p>

    <LessonHeading level={2} id="balancer-failure">The balancing layer also needs redundancy</LessonHeading>
    <p>If every request passes through one load-balancer process, it can become a single failure point. Production deployments use redundant instances and health/failover mechanisms, with DNS, virtual addresses, or managed infrastructure supplying the reachable entry point.</p>
    <LessonCallout variant="common-mistake"><p>“Add a load balancer” does not scale the database, remove server-local state, or make downstream dependencies reliable. It distributes the traffic it can see.</p></LessonCallout>
    <InterviewFollowUps><ul><li>What happens when a backend fails?</li><li>How are stateful sessions handled?</li><li>When is L4 preferable to L7?</li><li>How does the balancing layer avoid becoming a single point of failure?</li><li>How would routing change across regions?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["url-shortener", "news-feed", "video-streaming", "chat-system"]} />
    <FurtherReading items={networkingSources["load-balancing"]} />
    <RememberThis><p>Load balancers route across healthy instances. Explain the selection information, health behavior, session state, draining, and failure protection of the balancing layer itself.</p></RememberThis>
  </>;
}

export function ApiGatewayLessonContent() {
  return <>
    <LessonHeading level={2} id="application-entry-point">An API gateway owns cross-service entry-point concerns</LessonHeading>
    <p>As a product splits into services, public clients should not need every internal address or authentication convention. A gateway provides an application-aware entry point and routes requests to the responsible service.</p>
    <MermaidDiagram chart={apiGateway} title="API gateway routing across services" description="Clients reach an API gateway, which routes application requests to user, payment, or notification services." />
    <p>Responsibilities can include routing, authentication and authorization integration, rate limiting, version handling, request transformation, aggregation, and entry-point observability. Business invariants should remain in the owning service rather than accumulating in the gateway.</p>

    <LessonHeading level={2} id="gateway-vs-balancer">Gateway and load balancer are conceptual roles</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Role</th><th>Primary question</th></tr></thead><tbody><tr><td>Load balancer</td><td>Which healthy instance of this target should receive traffic?</td></tr><tr><td>API gateway</td><td>Which API/service owns this request, and which cross-cutting policies apply?</td></tr></tbody></table></TradeoffTable>
    <p>Real products may implement both roles together. Avoid presenting them as mutually exclusive product categories.</p>
    <LessonCallout variant="tradeoff"><p>A gateway adds a hop and can become a bottleneck or organizational choke point. Keep transformations bounded, deploy it redundantly, and prevent every team&apos;s business logic from collecting there.</p></LessonCallout>
    <PracticeConnections ids={["api-gateway-system", "ecommerce", "payment-system"]} />
    <FurtherReading items={networkingSources["api-gateway"]} />
    <RememberThis><p>A gateway is an application-level entry point across services; a balancer usually selects among instances. Keep gateway policy focused, measurable, redundant, and free of service-owned business logic.</p></RememberThis>
  </>;
}

export function ServiceDiscoveryLessonContent() {
  return <>
    <LessonHeading level={2} id="addresses-keep-changing">Logical service identity should outlive machine addresses</LessonHeading>
    <p>Autoscaling may create Payment Service at <code>10.0.1.4</code>, remove it, and add replacements at new addresses. Hardcoding those addresses couples every caller to deployment churn.</p>
    <MermaidDiagram chart={discovery} title="Service registration and lookup" description="Three Service B instances register health with a service registry. Service A looks up logical Service B and sends a request to a healthy instance." />

    <LessonHeading level={2} id="registry-mechanics">Registration, health, lookup, and routing</LessonHeading>
    <p>Instances or an orchestrator register endpoints and refresh health. Callers resolve the logical service name. In client-side discovery, the client selects an instance. In server-side discovery, a proxy or load balancer resolves and selects on the client&apos;s behalf.</p>
    <p>DNS can expose stable service names; Kubernetes Services are a common example of workloads contacting a consistent DNS name instead of Pod IPs. DNS is one discovery mechanism, not the definition of service discovery.</p>
    <LessonCallout variant="important"><p>A small monolith with one deployment address does not need a service-discovery platform. The requirement appears when instance identities change independently and callers need a stable service identity.</p></LessonCallout>
    <InterviewFollowUps><ul><li>Who registers instances and removes stale ones?</li><li>How quickly does health propagate?</li><li>What happens when the registry is unavailable?</li><li>Does the client or a server-side component select the target?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["payment-system", "metrics-platform", "api-gateway-system"]} />
    <FurtherReading items={networkingSources["service-discovery"]} />
    <RememberThis><p>Service discovery separates a stable logical name from changing instance addresses. State who registers, how health expires, where lookup occurs, and who selects the healthy target.</p></RememberThis>
  </>;
}

export function RateLimitingLessonContent() {
  return <>
    <LessonHeading level={2} id="protect-a-scarce-boundary">Limit demand at the identity and resource that matter</LessonHeading>
    <p>One client can send 50,000 requests per second to an API built for ordinary traffic. A rate limiter protects fairness, abuse boundaries, infrastructure, downstream dependencies, and product quotas. First choose the dimension: user, IP, API key, tenant, endpoint, global traffic, or a combination.</p>

    <LessonHeading level={2} id="limiting-algorithms">Algorithms encode burst policy</LessonHeading>
    <h3>Fixed window</h3><pre><code>{`user:42:2026-08-14T12:30 → 73 of 100 requests`}</code></pre><p>One counter per calendar bucket is simple, but traffic can burst at the end of one window and start of the next.</p>
    <h3>Sliding window</h3><p>Count the actual preceding interval. Boundary behavior improves, while exact logs or approximations require more state and computation.</p>
    <h3>Token bucket</h3><p>Tokens refill at a sustained rate up to a capacity. Requests consume tokens, allowing a bounded burst while limiting the long-run rate.</p>
    <TokenBucketDemo />
    <h3>Leaky bucket</h3><p>Model work leaving at a controlled rate. It emphasizes smoothing output, while token bucket emphasizes permitting bounded bursts. Implementations vary, so describe the behavior you need before naming the algorithm.</p>

    <LessonHeading level={2} id="distributed-limiter">Local counters undercount a global limit</LessonHeading>
    <p>If three API servers each enforce 100 requests per minute independently, a client routed across them can exceed an intended global 100. Shared counters, partitioned ownership, local allowances plus reconciliation, or edge enforcement provide different trade-offs.</p>
    <MermaidDiagram chart={distributedLimiter} title="Shared state for a distributed limit" description="A client reaches three API servers through a load balancer. Each server consults shared limiter state so the same identity is counted across replicas." />
    <TradeoffTable><table><thead><tr><th>Counter placement</th><th>Benefit</th><th>Cost</th></tr></thead><tbody><tr><td>Local per server</td><td>Fast and available</td><td>Approximate across replicas</td></tr><tr><td>Shared store</td><td>Coordinated decision</td><td>Network latency, hot keys, store dependency</td></tr><tr><td>Partitioned ownership</td><td>Scales counter responsibility</td><td>Routing and rebalancing</td></tr><tr><td>Local + global approximation</td><td>Lower decision latency</td><td>Temporary overshoot and reconciliation</td></tr></tbody></table></TradeoffTable>

    <LessonHeading level={2} id="response-and-failure">Return a useful rejection and design limiter failure</LessonHeading>
    <p><code>429 Too Many Requests</code> communicates rate limiting. The response can explain the condition and may include retry timing; clients should back off rather than create a retry storm.</p>
    <p>Plan for an unavailable counter store, hot identities, partitions, clock/window errors, global contention, and synchronized retries. Fail-open versus fail-closed depends on what is protected: login-abuse controls and a low-risk recommendation endpoint can make different choices.</p>
    <CommonMistakes><ul><li>Saying “use Redis INCR” without defining the window, atomic operation, hot-key behavior, regions, or failure policy.</li><li>Limiting by IP when many users share an address or attackers rotate addresses.</li><li>Demanding globally exact limits without accepting coordination latency and availability cost.</li><li>Building a distributed limiter for a low-traffic single-instance service.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>How is one identity limited across 100 API servers?</li><li>What happens if shared limiter state is unavailable?</li><li>How are short bursts supported?</li><li>How would a cross-region limit trade accuracy for availability?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["rate-limiter", "api-gateway-system", "payment-system", "url-shortener"]} />
    <FurtherReading items={networkingSources["rate-limiting"]} />
    <RememberThis><p>Choose the identity, sustained rate, burst allowance, counter location, and failure behavior. A distributed limiter is a coordination system, not merely a counter command.</p></RememberThis>
  </>;
}
