import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FurtherReading, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { networkingSources } from "./sources";

const requestPath = `flowchart LR
  B[Browser] --> D[DNS]
  D --> E[CDN / Edge]
  E -->|cache hit| B
  E -->|cache miss| L[Load balancer]
  L --> A[API server]
  A --> R[Redis]
  A --> DB[(Database)]`;

const dnsFlow = `flowchart LR
  B[Browser] --> R[Recursive resolver]
  R --> A[Authoritative DNS]
  A -->|address or endpoint| R
  R -->|cached answer| B`;

export function RequestPathLessonContent() {
  return <>
    <LessonHeading level={2} id="one-request-many-stops">One URL, several possible stopping points</LessonHeading>
    <p>A user opens <code>https://engineeringfoundry.com/system-design</code>. The browser has a hostname, not an application-server address. Before any business logic runs, the client may resolve DNS, establish transport and TLS, reuse an existing connection, and reach an edge cache. A cache hit may return without touching the origin at all.</p>
    <MermaidDiagram chart={requestPath} title="An intentionally simplified request path" description="A browser resolves DNS and reaches a CDN or edge. A cache hit returns there; a miss continues through a load balancer and API server, which may use Redis or a database. Real systems vary, and not every request visits every component." />

    <LessonHeading level={2} id="url-to-connection">From hostname to a secure connection</LessonHeading>
    <p>DNS maps the hostname to a network destination. The client then establishes a transport connection or reuses one. For HTTPS, TLS authenticates the server and protects data in transit. Connection reuse matters because repeatedly paying setup cost adds latency.</p>
    <p>The request can reach an edge location before the origin. Cacheable assets may terminate there. On a miss, the edge forwards toward a load balancer, which selects a healthy backend without exposing instance topology to the client.</p>

    <LessonHeading level={2} id="inside-the-origin">Inside the origin</LessonHeading>
    <p>The application server parses the request, authenticates the caller, validates input, runs business logic, and accesses a cache or database only if required. It serializes the response, may compress an appropriate representation, and sends it back through the intermediaries.</p>
    <LessonCallout variant="important"><p>The diagram is a reasoning aid, not a mandatory stack. A static asset may end at the edge; a simple service may have no cache; another request may call several services.</p></LessonCallout>

    <LessonHeading level={2} id="latency-budget">Build a latency budget before optimizing</LessonHeading>
    <WorkedExample title="A hypothetical 215 ms request">
      <AssumptionBox><pre><code>{`DNS lookup             ~20 ms
TLS / connection       ~40 ms
Network to region      ~50 ms
Application processing ~25 ms
Database query         ~80 ms`}</code></pre></AssumptionBox>
      <p>These values are illustrative, not universal. Optimizing 5 ms of application code barely moves the total while the 80 ms database query dominates. A latency budget assigns part of the target to each stage so measurement guides the next change.</p>
    </WorkedExample>
    <PracticeConnections ids={["url-shortener", "video-streaming", "api-gateway-system"]} />
    <FurtherReading items={networkingSources["request-path"]} />
    <RememberThis><p>Follow one request end to end. Name where it can terminate, where latency accumulates, which layer selects the next hop, and which dependencies the application actually needs.</p></RememberThis>
  </>;
}

export function DnsLessonContent() {
  return <>
    <LessonHeading level={2} id="names-to-destinations">DNS turns a stable name into a usable destination</LessonHeading>
    <p>Applications refer to <code>api.example.com</code>; network connections need an address or another resolvable endpoint. A recursive resolver finds or reuses the answer, consulting authoritative DNS when its cache cannot satisfy the query.</p>
    <MermaidDiagram chart={dnsFlow} title="Simplified DNS resolution" description="A browser asks a recursive resolver. On a cache miss, that resolver consults authoritative DNS, returns an address or endpoint, and may cache the answer for its remaining TTL." />
    <p>An <code>A</code> record maps a name to IPv4, <code>AAAA</code> maps to IPv6, and <code>CNAME</code> aliases one name to another. For a general System Design interview, the architectural role and caching behavior matter more than memorizing every record type.</p>

    <LessonHeading level={2} id="ttl-and-routing">TTL makes DNS fast and changes slow</LessonHeading>
    <p>A record&apos;s TTL tells resolvers how long it may be cached. Longer caching reduces repeated resolution work; shorter caching can let planned changes become visible sooner. Existing cached answers do not vanish when authoritative data changes, so propagation is not instantaneous.</p>
    <WorkedExample title="Three deployment regions">
      <p>A DNS provider can answer users in North America, Europe, and Asia with region-appropriate endpoints using geography, measured latency, policy, and health signals available to that provider. The answer can steer a connection toward a region.</p>
      <p>DNS is not a per-request L7 load balancer. Resolvers and clients cache answers, TTL controls how long they can remain, and health-aware behavior depends on the routing infrastructure and its checks.</p>
    </WorkedExample>

    <LessonHeading level={2} id="dns-failure-boundary">DNS failover has a cache boundary</LessonHeading>
    <p>If an endpoint becomes unhealthy, authoritative routing can stop returning it, but clients may continue using a cached answer until it expires. DNS also cannot inspect an HTTP path or choose a backend for every application request. Pair it with regional entry points and health-aware serving infrastructure.</p>
    <CommonMistakes><ul><li>Claiming DNS routes every individual request.</li><li>Assuming record changes propagate instantly.</li><li>Confusing a resolver or authoritative service with an L7 load balancer.</li><li>Spending interview time on packet fields when the decision is regional routing.</li></ul></CommonMistakes>
    <PracticeConnections ids={["url-shortener", "video-streaming", "feature-flag-system"]} />
    <FurtherReading items={networkingSources.dns} />
    <RememberThis><p>DNS resolves names and can steer users toward endpoints, but cached answers make changes gradual. TTL, resolver caching, provider health behavior, and the next load-balancing layer define failover.</p></RememberThis>
  </>;
}

export function HttpLessonContent() {
  return <>
    <LessonHeading level={2} id="request-response-contract">HTTP is the contract at the system boundary</LessonHeading>
    <pre><code>{`GET /users/123 HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>`}</code></pre>
    <p>The method communicates intent, the target identifies a resource, headers carry metadata, and an optional body carries a representation. The response combines a status code, headers, and optional content. That contract can stay stable while the backend architecture changes.</p>

    <LessonHeading level={2} id="methods-and-status">Methods and status behavior</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Method</th><th>Typical intent</th><th>Design question</th></tr></thead><tbody>
      <tr><td>GET</td><td>Read a representation</td><td>Can it be cached, and how stale may it be?</td></tr><tr><td>POST</td><td>Create or trigger processing</td><td>What happens when the client retries?</td></tr><tr><td>PUT</td><td>Replace a known resource state</td><td>Can repeated requests have the same effect?</td></tr><tr><td>PATCH</td><td>Apply a partial update</td><td>How are conflicts validated?</td></tr><tr><td>DELETE</td><td>Remove a resource</td><td>Is deletion immediate, soft, or asynchronous?</td></tr>
    </tbody></table></TradeoffTable>
    <p>Use status codes to describe outcomes consistently: <code>200</code> success, <code>201</code> created, <code>202</code> accepted for later processing, <code>400</code> invalid input, <code>401</code> unauthenticated, <code>403</code> not permitted, <code>404</code> missing, <code>409</code> conflict, <code>429</code> limited, <code>500</code> unexpected failure, and <code>503</code> temporarily unavailable.</p>

    <LessonHeading level={2} id="stateless-not-userless">Stateless does not mean the application has no state</LessonHeading>
    <p>HTTP semantics let a request be understood in isolation. Applications still maintain identity and workflow using cookies, session identifiers, tokens, databases, and caches. Avoid making an in-memory server session the only copy unless routing and failure behavior explicitly support it.</p>

    <LessonHeading level={2} id="connections-and-versions">Connections, HTTP/2, and HTTP/3</LessonHeading>
    <p>Persistent connections amortize setup across requests. HTTP/2 multiplexes multiple logical request streams over a connection. HTTP/3 carries HTTP semantics over QUIC, a secure multiplexed transport over UDP. Implementation detail is usually a follow-up, not the starting point for a product architecture.</p>
    <p>HTTPS adds TLS: the client validates server identity from certificates, negotiates protected communication, and pays some connection setup cost. Reuse and session mechanisms reduce repeated setup. Candidates should explain what TLS provides, not implement its cryptography.</p>
    <LessonCallout variant="common-mistake"><p>Do not equate HTTP statelessness with “no authentication” or “no session.” It means protocol messages do not gain semantics merely because they share a connection.</p></LessonCallout>
    <PracticeConnections ids={["api-gateway-system", "webhook-delivery", "url-shortener"]} />
    <FurtherReading items={networkingSources.http} />
    <RememberThis><p>Use methods and status codes as a clear contract, keep application state explicit, reuse connections, and explain TLS as identity plus protection in transit. Protocol versions change transport mechanics, not the product requirements.</p></RememberThis>
  </>;
}
