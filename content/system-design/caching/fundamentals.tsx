import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { cachingSources } from "./sources";

const placementDiagram = `flowchart LR
  U[Client] --> B[Browser cache]
  B --> E[CDN / edge]
  E --> P[Reverse proxy]
  P --> A[Application]
  A --> L[Local cache]
  L --> D[Distributed cache]
  D --> DB[(Database)]`;

export function WhyCachingLessonContent() {
  return <>
    <LessonHeading level={2} id="reuse-before-product">Caching is a reuse decision before it is a product choice</LessonHeading>
    <p>A cache keeps a reusable copy of data or completed work closer to the next consumer. It helps when many requests repeat an expensive database read, computation, remote call, or geographic transfer. A <strong>hit</strong> returns a usable copy; a <strong>miss</strong> continues to the source and may populate the cache.</p>
    <blockquote>Caching trades memory and potential staleness for lower latency and less backend work.</blockquote>
    <p>The trade is worthwhile only when reuse is likely. Read-heavy, slow-changing data and hot queries are common candidates. Low-reuse, write-heavy, correctness-critical, huge, or cheap-to-recompute values may produce little benefit while adding invalidation and failure paths.</p>

    <LessonHeading level={2} id="hit-rate-math">A hit rate is an origin-load assumption</LessonHeading>
    <WorkedExample title="Protect a database at 50,000 reads per second">
      <AssumptionBox><pre><code>{`Request rate = 50,000 RPS
Cache hit rate = 90%`}</code></pre></AssumptionBox>
      <FormulaBlock title="Expected database read rate">{`DB RPS = total RPS × (1 − hit rate)
       = 50,000 × 0.10
       = 5,000 RPS`}</FormulaBlock>
      <p>The cache removes about 45,000 repeated reads each second under these assumptions. If it disappears, the database may receive the full 50,000 RPS. The design must prove that fallback is bounded or deliberately degraded.</p>
    </WorkedExample>

    <LessonHeading level={2} id="when-caching-fits">When does caching fit?</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Likely to help</th><th>Likely to disappoint or harm</th></tr></thead><tbody>
      <tr><td>Popular, read-heavy objects</td><td>Personalized one-off results</td></tr>
      <tr><td>Slow or costly computations</td><td>Cheap backends with little repeated work</td></tr>
      <tr><td>Remote calls and static or semi-static content</td><td>Strict freshness with no safe stale window</td></tr>
      <tr><td>Hot database queries with bounded values</td><td>Very large, low-reuse values or write-heavy state</td></tr>
    </tbody></table></TradeoffTable>
    <p>Edge response caching belongs in the <Link href="/system-design/fundamentals/cdns">CDN lesson</Link>. Here the same reasoning applies to application data: identify reuse, key identity, freshness, capacity, and source behavior.</p>
    <CommonMistakes><ul><li>Saying “add Redis” without naming the data, key, TTL, invalidation, or outage behavior.</li><li>Assuming a constant or 100% hit rate.</li><li>Caching balances, permissions, or inventory without a staleness policy.</li><li>Caching everything even when low-reuse entries evict the useful working set.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>What data would you cache, and what is the cache key?</li><li>How stale may it become?</li><li>Can the source survive a cold cache?</li><li>Which metrics prove the cache is helping?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["url-shortener", "news-feed", "ecommerce", "search-engine"]} />
    <FurtherReading items={cachingSources.caching} />
    <RememberThis><p>Always explain what is cached, where it lives, how it becomes stale, how it is invalidated, and what happens when the cache disappears.</p></RememberThis>
  </>;
}

export function CachePlacementLessonContent() {
  return <>
    <LessonHeading level={2} id="placement-changes-boundary">Placement changes latency, ownership, and consistency</LessonHeading>
    <p>A request may encounter several caches, but it does not need every layer shown below. Place a copy where it removes meaningful work without making correctness or invalidation unmanageable.</p>
    <MermaidDiagram chart={placementDiagram} title="Possible cache locations in a request path" description="A client request may pass through a browser cache, CDN, reverse proxy, application, local cache, distributed cache, and database. Real systems select only the layers that solve a measured problem." />
    <TradeoffTable><table><thead><tr><th>Location</th><th>Latency</th><th>Shared?</th><th>Invalidation boundary</th><th>Good fit</th></tr></thead><tbody>
      <tr><td>Browser / client</td><td>Lowest</td><td>No</td><td>Client and HTTP policy</td><td>Reusable responses and assets</td></tr>
      <tr><td>CDN / edge</td><td>Near user</td><td>Across regional users</td><td>HTTP freshness and purge</td><td>Cacheable HTTP/media</td></tr>
      <tr><td>Reverse proxy</td><td>Before app</td><td>Across app instances</td><td>Proxy policy</td><td>Repeated HTTP responses</td></tr>
      <tr><td>Application local</td><td>No network hop</td><td>No</td><td>Per process</td><td>Small hot reference data</td></tr>
      <tr><td>Distributed</td><td>Network hop</td><td>Yes</td><td>Shared application policy</td><td>Large shared working set</td></tr>
    </tbody></table></TradeoffTable>
    <LessonCallout variant="tradeoff"><p>A local cache is fast but each instance can hold a different value. A shared cache improves coordination and capacity but becomes another network dependency.</p></LessonCallout>
    <InterviewFollowUps><ul><li>Which requests can safely share one entry?</li><li>Does the cache key include identity, locale, or authorization context?</li><li>How are local copies invalidated across instances?</li><li>Would a two-level local and distributed cache be worth the extra state?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["news-feed", "ecommerce", "api-gateway-system"]} />
    <FurtherReading items={cachingSources["cache-placement"]} />
    <RememberThis><p>Move reusable work toward the consumer, but make the ownership and freshness boundary explicit at every cache layer you add.</p></RememberThis>
  </>;
}

export function CacheTtlLessonContent() {
  return <>
    <LessonHeading level={2} id="ttl-is-freshness-policy">TTL is a freshness policy</LessonHeading>
    <blockquote>A TTL answers: how long are we willing to reuse this entry without checking the source again?</blockquote>
    <p>A short TTL usually means fresher data and more origin traffic. A long TTL can improve hit rate while increasing stale-data exposure. No TTL requires another dependable invalidation or capacity policy. Expiration may make an entry unusable; it does not coordinate every concurrent reader or repair missed write invalidations.</p>
    <WorkedExample title="Choose a TTL for product prices">
      <TradeoffTable><table><thead><tr><th>Candidate</th><th>Benefit</th><th>Cost</th></tr></thead><tbody><tr><td><code>5 seconds</code></td><td>Short stale window</td><td>More misses and database reads</td></tr><tr><td><code>30 minutes</code></td><td>Higher reuse and lower origin load</td><td>Potentially unacceptable old prices</td></tr></tbody></table></TradeoffTable>
      <p>The product requirement decides. A browse page might tolerate bounded staleness; checkout should revalidate correctness-critical price and inventory before committing an order.</p>
    </WorkedExample>

    <LessonHeading level={2} id="ttl-jitter">Jitter prevents synchronized expiry</LessonHeading>
    <AssumptionBox><pre><code>{`1,000,000 keys loaded together
TTL = exactly 10 minutes`}</code></pre></AssumptionBox>
    <p>Ten minutes later, a large fraction can expire together and expose the origin to synchronized misses. Add bounded randomness so expiry times spread across an interval:</p>
    <FormulaBlock title="Jittered lifetime">{`entry TTL = base TTL + random jitter`}</FormulaBlock>
    <p>The jitter range should follow traffic, freshness, and recovery requirements; one fixed percentage is not universal.</p>
    <CommonMistakes><ul><li>Treating TTL as a complete invalidation strategy.</li><li>Choosing a round number once and never measuring hit rate, age, or origin load.</li><li>Giving correctness-critical and best-effort data the same lifetime.</li></ul></CommonMistakes>
    <PracticeConnections ids={["ecommerce", "news-feed", "url-shortener"]} />
    <FurtherReading items={cachingSources["cache-ttl"]} />
    <RememberThis><p>Short TTLs reduce stale duration but create more misses; long TTLs improve reuse but increase stale-data risk. Jitter spreads expiration load.</p></RememberThis>
  </>;
}

export function CacheEvictionLessonContent() {
  return <>
    <LessonHeading level={2} id="expiration-vs-eviction">Expiration and eviction solve different problems</LessonHeading>
    <p><strong>Expiration</strong> makes an entry unusable because its time or freshness policy ended. <strong>Eviction</strong> removes an entry because the cache needs capacity. A non-expired entry can still be evicted under memory pressure.</p>
    <LessonHeading level={2} id="lru-example">Small LRU example</LessonHeading>
    <WorkedExample title="A four-item request against a three-item cache">
      <pre><code>{`Cache:  [A] [B] [C]
Access: A
Insert: D

Possible LRU result: [A] [C] [D]
B was used least recently.`}</code></pre>
    </WorkedExample>
    <TradeoffTable><table><thead><tr><th>Policy</th><th>Signal</th><th>Strength</th><th>Failure mode</th></tr></thead><tbody>
      <tr><td>LRU</td><td>Recency</td><td>Adapts to a changing working set</td><td>A one-time burst can displace useful entries</td></tr>
      <tr><td>LFU</td><td>Frequency</td><td>Protects a stable popular set</td><td>Historical popularity may outlive current demand</td></tr>
      <tr><td>Random</td><td>None</td><td>Simple and low bookkeeping</td><td>May remove a valuable hot entry</td></tr>
    </tbody></table></TradeoffTable>
    <p>No policy always produces the best hit rate. Real implementations may approximate these policies; the interview-level decision is to connect the policy to access distribution, memory limits, and the cost of a miss.</p>
    <CommonMistakes><ul><li>Calling TTL expiration “LRU eviction.”</li><li>Assuming LRU is universally optimal.</li><li>Ignoring object size, admission policy, and origin cost.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>What happens when the working set exceeds memory?</li><li>Would recency or frequency better match this workload?</li><li>Which eviction metrics would trigger a capacity change?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["news-feed", "distributed-cache", "ecommerce"]} />
    <FurtherReading items={cachingSources["cache-eviction"]} />
    <RememberThis><p>Expiration enforces a time policy; eviction creates space. Choose an eviction signal from the workload and measure whether it protects the valuable working set.</p></RememberThis>
  </>;
}
