import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { networkingSources } from "./sources";

const websocketRouting = `flowchart LR
  A[Client A] -->|WebSocket| GA[Gateway A]
  GA --> B[Message bus]
  B --> GB[Gateway B]
  GB -->|WebSocket| C[Client B]
  GA -. presence .-> P[(Connection registry)]
  GB -. presence .-> P`;

const proxyRoles = `flowchart LR
  C[Clients] --> FP[Forward proxy]
  FP --> I[Internet]
  I --> RP[Reverse proxy]
  RP --> A[Server A]
  RP --> B[Server B]`;

const cdnFlow = `sequenceDiagram
  participant C as Client
  participant E as Nearby edge
  participant O as Origin
  C->>E: Request object
  alt Cache hit
    E-->>C: Cached object
  else Cache miss
    E->>O: Fetch object
    O-->>E: Object + cache policy
    E-->>C: Cache and return object
  end`;

export function RealtimeCommunicationLessonContent() {
  return <>
    <LessonHeading level={2} id="choose-update-shape">Choose from direction, urgency, and connection lifetime</LessonHeading>
    <p>“Real time” is not a protocol requirement. Ask who initiates updates, whether the client sends independently, how much delay is acceptable, how many connections must remain open, and what happens after a disconnect.</p>

    <LessonHeading level={2} id="four-mechanisms">Four useful mechanisms</LessonHeading>
    <h3>Polling</h3><p>The client asks periodically. It works with ordinary HTTP infrastructure and is easy to operate, but empty checks waste work and update latency follows the interval.</p>
    <pre><code>{`Client → Server: Any updates?
Client → Server: Any updates?
Client → Server: Any updates?`}</code></pre>
    <h3>Long polling</h3><p>The server holds a request until data is available or a timeout occurs, then the client immediately reconnects. It approximates server push while retaining repeated HTTP requests.</p>
    <h3>Server-Sent Events</h3><p>SSE maintains an HTTP response stream from server to browser. It is one-directional and browser <code>EventSource</code> handles reconnection behavior. It fits notifications, dashboards, and streamed server updates when client messages can use normal requests.</p>
    <h3>WebSockets</h3><p>A WebSocket is a long-lived bidirectional channel. Client and server can send independently, so chat, presence, multiplayer, and live collaboration may fit. The application still owns authentication refresh, heartbeats, idle policy, backpressure, reconnect, and missed-event recovery.</p>

    <TradeoffTable><table><thead><tr><th>Mechanism</th><th>Direction</th><th>Connection</th><th>Best fit</th></tr></thead><tbody><tr><td>Polling</td><td>Client requests</td><td>Repeated</td><td>Simple or infrequent updates</td></tr><tr><td>Long polling</td><td>Mostly server response</td><td>Repeated long requests</td><td>Moderate real-time needs</td></tr><tr><td>SSE</td><td>Server → client</td><td>Persistent</td><td>Server-pushed updates</td></tr><tr><td>WebSocket</td><td>Bidirectional</td><td>Persistent</td><td>Interactive real-time systems</td></tr></tbody></table></TradeoffTable>

    <LessonHeading level={2} id="websocket-scaling">The hard part starts after the connection opens</LessonHeading>
    <p>User A may be connected to Gateway A while User B is connected to Gateway B. The system needs a presence or connection registry to locate B and a routing path, often Pub/Sub or a broker, between gateways. Sticky routing can help reconnect a client to a gateway but does not route messages between different users.</p>
    <MermaidDiagram chart={websocketRouting} title="Routing between WebSocket gateways" description="Client A sends through Gateway A to a message bus, which delivers to Gateway B and Client B. Both gateways update a connection registry so the system can locate users across servers." />
    <CommonMistakes><ul><li>Choosing WebSockets only because a requirement says “real time.”</li><li>Assuming the connection itself routes across gateway servers.</li><li>Ignoring reconnect, presence expiration, connection limits, and rolling deployments.</li><li>Introducing a streaming platform before a routing requirement justifies it.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>How many persistent connections can one gateway support?</li><li>How does a message reach a user connected elsewhere?</li><li>What events are replayed after reconnect?</li><li>How is presence expired after a silent disconnect?</li><li>What happens during a rolling deployment?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["chat-system", "collaborative-editor", "notification-service", "presence-service"]} />
    <FurtherReading items={networkingSources["realtime-communication"]} />
    <RememberThis><p>WebSockets provide a bidirectional connection; they do not solve presence or cross-server routing. Prefer polling or SSE when their simpler direction and latency model satisfies the product.</p></RememberThis>
  </>;
}

export function ReverseProxyLessonContent() {
  return <>
    <LessonHeading level={2} id="which-side-is-hidden">Ask which side the proxy represents</LessonHeading>
    <p>A forward proxy acts for clients reaching outward. A reverse proxy acts as a public or internal entry point in front of servers. Both relay traffic, but their trust boundary and owner differ.</p>
    <MermaidDiagram chart={proxyRoles} title="Forward and reverse proxy positions" description="Clients use a forward proxy to reach the internet. Internet traffic reaches a reverse proxy, which routes to backend Server A or Server B." />
    <TradeoffTable><table><thead><tr><th>Role</th><th>Acts for</th><th>Common uses</th></tr></thead><tbody><tr><td>Forward proxy</td><td>Clients</td><td>Outbound policy, privacy, corporate egress</td></tr><tr><td>Reverse proxy</td><td>Servers</td><td>TLS termination, routing, caching, load balancing, hiding backend topology</td></tr></tbody></table></TradeoffTable>
    <p>In System Design interviews, reverse proxies appear more often because they provide a controlled entry point. Product categories overlap: a reverse proxy can load balance, and a gateway can proxy. Describe the responsibility needed rather than arguing over labels.</p>
    <PracticeConnections ids={["api-gateway-system", "url-shortener", "webhook-delivery"]} />
    <FurtherReading items={networkingSources["reverse-proxies"]} />
    <RememberThis><p>A forward proxy represents clients; a reverse proxy represents servers. Explain where the trust boundary sits and which entry-point work, such as TLS or routing, belongs there.</p></RememberThis>
  </>;
}

export function CdnLessonContent() {
  return <>
    <LessonHeading level={2} id="move-reusable-bytes-closer">Move reusable bytes closer to users</LessonHeading>
    <p>Without an edge layer, a user in India may fetch every video segment from an origin in Virginia. A CDN stores eligible objects at geographically distributed points of presence so a nearby edge can serve repeated requests with less origin traffic and geographic latency.</p>
    <MermaidDiagram chart={cdnFlow} title="CDN cache hit and miss" description="A client requests an object from a nearby edge. A hit returns immediately. On a miss, the edge fetches from the origin, caches according to policy, and returns the object." />

    <LessonHeading level={2} id="cache-policy">Cacheability is a policy, not a promise</LessonHeading>
    <p>The origin is the source location; the edge holds copies. TTL defines freshness, while eviction can remove an object earlier. The cache key decides which requests share a representation. Purge or versioned URLs handle updates. Provider configuration, response headers, object type, authorization, and key policy determine what is actually cached.</p>
    <p>Static assets and media segments are common fits. Private downloads can use signed URLs or cookies with carefully designed keys and authorization. Dynamic acceleration may still optimize network paths even when a response is not cached.</p>

    <LessonHeading level={2} id="media-example">Estimate the origin relief</LessonHeading>
    <WorkedExample title="Hypothetical video segment traffic">
      <AssumptionBox><pre><code>{`100K segment requests/sec
1 MB average segment
95% served by the edge`}</code></pre></AssumptionBox>
      <pre><code>{`100K × 1 MB ≈ 100 GB/sec total delivery
100 GB/sec × 5% ≈ 5 GB/sec from origin`}</code></pre>
      <p>The assumptions are illustrative. The useful conclusion is that cache hit rate and payload size can change origin bandwidth by an order of magnitude.</p>
    </WorkedExample>

    <LessonHeading level={2} id="cdn-failures">Failure and freshness questions</LessonHeading>
    <ul><li>Stale objects or slow purge can show old content.</li><li>A missing identity, locale, or encoding dimension in the cache key can serve the wrong representation.</li><li>Cold misses or a hit-rate collapse can overload the origin.</li><li>Personalized content may be unsafe or ineffective to cache.</li><li>Edge delivery reduces origin work but introduces provider cost and another configuration surface.</li></ul>
    <LessonCallout variant="common-mistake"><p>“Put the API behind a CDN” does not mean every response is cached. State which responses are eligible, what the key contains, how long they remain fresh, and how private data is excluded.</p></LessonCallout>
    <InterviewFollowUps><ul><li>What happens after content changes?</li><li>How is a private file authorized?</li><li>Can the origin survive a hit-rate drop?</li><li>Which request fields belong in the cache key?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["video-streaming", "cloud-file-storage", "image-hosting", "news-feed"]} />
    <FurtherReading items={networkingSources.cdn} />
    <RememberThis><p>A CDN trades freshness, key design, and invalidation complexity for lower geographic latency and less origin traffic. Be explicit about what is cacheable and what happens on a miss.</p></RememberThis>
  </>;
}
