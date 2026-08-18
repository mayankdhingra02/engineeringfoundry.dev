import Link from "next/link";
import { CacheStampedeDemo } from "@/components/cache-stampede-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { cachingSources } from "./sources";

const stampedeFallback = `flowchart LR
  R[10,000 concurrent reads] --> M{Hot key expired}
  M -->|No coordination| Q[10,000 DB queries]
  M -->|Single flight| O[1 DB query]
  O --> W[Other requests wait]
  O --> C[Repopulate cache]`;

const failureFallback = `flowchart LR
  R[Application reads] --> C{Cache available?}
  C -->|yes| H[Serve hit or controlled miss]
  C -->|no| G{Can origin absorb load?}
  G -->|bounded| D[Limited origin fallback]
  G -->|no| S[Serve safe stale data, degrade, or shed load]`;

export function CacheStampedesLessonContent() {
  return <>
    <LessonHeading level={2} id="one-miss-becomes-many">A miss on a hot key is not necessarily one origin request</LessonHeading>
    <p>When a popular entry expires, thousands of concurrent readers can observe the same miss and repeat the same source work. The cache normally protects the database; synchronized misses temporarily remove that protection.</p>
    <WorkedExample title="A profile key expires under 20,000 RPS">
      <AssumptionBox><pre><code>{`Popular profile = 20,000 RPS
Normal hit rate = 99%
Database capacity for this query = 1,000 QPS`}</code></pre></AssumptionBox>
      <FormulaBlock title="Normal source load">{`20,000 × (1 − 0.99) = 200 DB queries/sec`}</FormulaBlock>
      <p>If the key expires and all concurrent reads query the source, load can jump toward 20,000 QPS—twenty times the illustrative capacity.</p>
    </WorkedExample>
    <CacheStampedeDemo />
    <MermaidDiagram chart={stampedeFallback} title="Static cache-stampede fallback" description="Ten thousand reads see an expired hot key. Without coordination they can create ten thousand database queries; single-flight coordination permits one query while other requests wait for the repopulated result." />

    <LessonHeading level={2} id="coordinate-refresh">Coordinate and spread refresh work</LessonHeading>
    <ul><li><strong>Request coalescing / single flight:</strong> share one in-progress load among concurrent readers.</li><li><strong>Per-key locking:</strong> elect one refresher, with bounded waits and safe lock expiry.</li><li><strong>TTL jitter:</strong> keep large key sets from expiring together.</li><li><strong>Refresh before expiry:</strong> proactively refresh known hot keys.</li><li><strong>Stale-while-revalidate:</strong> serve a permitted old value while one worker refreshes.</li></ul>
    <LessonCallout variant="tradeoff"><p>A distributed lock can itself expire, partition, or strand waiters. Explain timeouts and failure behavior rather than presenting “add a lock” as the complete answer.</p></LessonCallout>
    <InterviewFollowUps><ul><li>What happens when the refresh worker dies?</li><li>How long may waiters block?</li><li>Can stale data be served during refresh?</li><li>How do you avoid synchronizing many different keys?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["news-feed", "ecommerce", "url-shortener"]} />
    <FurtherReading items={cachingSources["cache-stampedes"]} />
    <RememberThis><p>One hot key expiring can turn one logical refresh into thousands of simultaneous database requests. Coordinate refreshes and avoid synchronized expiry.</p></RememberThis>
  </>;
}

export function HotKeysLessonContent() {
  return <>
    <LessonHeading level={2} id="even-keys-uneven-traffic">Even key ownership does not mean even traffic</LessonHeading>
    <pre><code>{`normal profile    → 10 RPS
celebrity profile → 100,000 RPS`}</code></pre>
    <p>A distributed cache may spread millions of keys evenly, yet one celebrity key still belongs to a particular node and can exhaust its network, CPU, or request concurrency. The <Link href="/system-design/fundamentals/consistent-hashing">Consistent Hashing lesson</Link> limits key movement when nodes change; it does not split one key&apos;s popularity.</p>
    <TradeoffTable><table><thead><tr><th>Mitigation</th><th>What it changes</th><th>Trade-off</th></tr></thead><tbody><tr><td>Local in-process copy</td><td>Removes repeated shared-cache reads</td><td>More stale copies to coordinate</td></tr><tr><td>Replicated copies</td><td>Spreads reads across cache nodes</td><td>Invalidation and replica consistency</td></tr><tr><td>Request coalescing</td><td>Bounds refresh work</td><td>Does not remove hit traffic</td></tr><tr><td>Split logical value</td><td>Distributes work where semantics permit</td><td>Read aggregation and key design</td></tr><tr><td>Edge cache / precompute</td><td>Moves reusable work outward</td><td>Only fits safe, cacheable content</td></tr></tbody></table></TradeoffTable>
    <p>Detect hot keys with per-key or heavy-hitter telemetry, node load distribution, latency, and miss amplification—not only a cluster-wide hit rate.</p>
    <CommonMistakes><ul><li>Assuming consistent hashing guarantees uniform request load.</li><li>Scaling the entire cluster when one key is the bottleneck.</li><li>Replicating correctness-sensitive values without a freshness plan.</li></ul></CommonMistakes>
    <PracticeConnections ids={["url-shortener", "news-feed", "leaderboard"]} />
    <FurtherReading items={cachingSources["hot-keys"]} />
    <RememberThis><p>Partitioning balances ownership across many keys. It does not prevent one extremely popular key from overloading its owner.</p></RememberThis>
  </>;
}

export function CachePenetrationLessonContent() {
  return <>
    <LessonHeading level={2} id="missing-data-bypasses-cache">Repeated nonexistent keys can bypass the cache</LessonHeading>
    <pre><code>{`GET /users/999999999
cache miss → database lookup → NOT_FOUND
repeat thousands of times`}</code></pre>
    <p>If “not found” is never stored, every identical invalid request reaches the source. This can happen through client bugs, scans, or deliberate abuse.</p>
    <LessonHeading level={2} id="negative-caching">Negative caching</LessonHeading>
    <pre><code>{`user:999999999 → NOT_FOUND
TTL → short and requirement-driven`}</code></pre>
    <p>A short negative TTL avoids repeating the same database miss. It must not hide a newly created record for longer than the product allows. Bound arbitrary-key cardinality so attackers cannot fill memory with negative entries.</p>
    <LessonHeading level={2} id="bloom-filter-bridge">Bloom filter as an advanced gate</LessonHeading>
    <p>A Bloom filter can cheaply say an identifier is <strong>definitely absent</strong>, while a positive answer may be a false positive and still requires the normal lookup. It cannot prove that an item exists. The <Link href="/system-design/specialized/bloom-filters">Bloom Filters lesson</Link> covers the data structure later.</p>
    <LessonCallout variant="production-note"><p>Validate identifiers and rate-limit abuse before reaching the cache. Negative caching and Bloom filters protect a legitimate lookup path; they are not complete security controls.</p></LessonCallout>
    <PracticeConnections ids={["url-shortener", "search-engine", "api-gateway-system"]} />
    <FurtherReading items={cachingSources["cache-penetration"]} />
    <RememberThis><p>Cache bounded not-found outcomes or gate impossible identifiers so repeated nonexistent-key requests do not hammer the source. Keep creation and abuse behavior explicit.</p></RememberThis>
  </>;
}

export function CacheWarmingLessonContent() {
  return <>
    <LessonHeading level={2} id="cold-cache">An empty cache shifts load to the backend</LessonHeading>
    <p>Deployments, failover, a flush, a new region, or a replacement cluster can start with a low hit rate. If traffic arrives at full scale, the origin simultaneously serves users and repopulates the cache.</p>
    <pre><code>{`startup: hit rate low → database load high
steady state: hit rate rises → database load falls`}</code></pre>
    <TradeoffTable><table><thead><tr><th>Warming approach</th><th>Advantage</th><th>Cost</th></tr></thead><tbody><tr><td>Lazy from real traffic</td><td>Loads only requested data</td><td>Users pay cold misses</td></tr><tr><td>Preload known hot keys</td><td>Protects critical paths early</td><td>Predictions and preload traffic can be wrong</td></tr><tr><td>Snapshot / transfer where supported</td><td>Restores a larger working set</td><td>Platform-specific and can restore stale data</td></tr><tr><td>Gradual traffic shift</td><td>Bounds source load while warming</td><td>Needs routing control and spare capacity</td></tr></tbody></table></TradeoffTable>
    <WorkedExample title="Open a new application region"><p>Preload a small measured hot set, send a small traffic percentage, watch origin QPS and hit rate, then increase traffic. Bulk-loading every historical key can do more backend work than organic misses.</p></WorkedExample>
    <InterviewFollowUps><ul><li>Which keys deserve preloading?</li><li>How do you cap warm-up load?</li><li>What signals permit the next traffic step?</li><li>Can safe stale values cross a failover?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["news-feed", "ecommerce", "distributed-cache"]} />
    <FurtherReading items={cachingSources["cache-warming"]} />
    <RememberThis><p>A cold cache is a backend load event. Warm only the valuable working set and shift traffic gradually enough for the source to remain healthy.</p></RememberThis>
  </>;
}

export function CacheFailureModesLessonContent() {
  return <>
    <LessonHeading level={2} id="cache-is-dependency">The protective layer can fail</LessonHeading>
    <p>A cache can be unavailable, slow, partitioned, cold, stale, memory-constrained, or overloaded by a hot key. Failure behavior depends on the data and source capacity; “just query the database” can turn a cache incident into a database outage.</p>
    <MermaidDiagram chart={failureFallback} title="Requirement-driven cache fallback" description="The application uses the cache when available. When unavailable, it checks whether bounded origin fallback is safe; otherwise it serves permitted stale data, degrades features, or sheds load." />
    <WorkedExample title="A cache outage at 100,000 RPS">
      <AssumptionBox><pre><code>{`Total reads = 100,000 RPS
Normal hit rate = 95%
Database safe capacity = 10,000 RPS`}</code></pre></AssumptionBox>
      <FormulaBlock title="Before and after the outage">{`Normal DB load = 100,000 × 0.05 = 5,000 RPS
Uncontrolled bypass ≈ 100,000 RPS
Capacity shortfall ≈ 90,000 RPS`}</FormulaBlock>
      <p>Bound fallback concurrency, load shed, degrade expensive features, use a safe local fallback, or serve permitted stale values. Recover gradually so cache repopulation does not create a second surge.</p>
    </WorkedExample>
    <TradeoffTable><table><thead><tr><th>Failure</th><th>Consequence</th><th>Design response</th></tr></thead><tbody><tr><td>Cache unavailable / timeout</td><td>Latency and origin surge</td><td>Bounded bypass, degradation, or fail request</td></tr><tr><td>Mass expiration</td><td>Synchronized misses</td><td>TTL jitter and coalescing</td></tr><tr><td>Cold cache</td><td>High backend load</td><td>Prewarm and gradual traffic</td></tr><tr><td>Stale data</td><td>Product correctness error</td><td>Freshness classes and revalidation</td></tr><tr><td>Memory pressure</td><td>Useful values evicted early</td><td>Admission, sizing, and eviction telemetry</td></tr><tr><td>Hot key</td><td>One node saturates</td><td>Replicas, local copies, or split work</td></tr></tbody></table></TradeoffTable>
    <LessonHeading level={2} id="fallback-by-data-class">Ask what is safer for this data</LessonHeading>
    <ul><li><strong>Product catalog:</strong> limited database bypass or bounded stale reads may be acceptable.</li><li><strong>Massive feed:</strong> uncontrolled bypass can collapse fan-out and storage dependencies.</li><li><strong>Authorization:</strong> serving stale or bypassed values may violate a security requirement.</li></ul>
    <p>The later <Link href="/system-design/patterns/load-shedding">Load Shedding</Link> and <Link href="/system-design/patterns/circuit-breaker">Circuit Breaker</Link> lessons go deeper into dependency protection.</p>
    <CommonMistakes><ul><li>Designing only the hit path.</li><li>Using a global hit rate that hides one expensive miss class.</li><li>Recovering at full traffic and immediately expiring another large key set.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>Can the database survive a full cold cache?</li><li>Which responses may be stale?</li><li>Which features should degrade first?</li><li>How do you test cache-disabled operation?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["distributed-cache", "news-feed", "api-gateway-system", "ecommerce"]} />
    <FurtherReading items={cachingSources["cache-failure-modes"]} />
    <RememberThis><p>A cache outage is an overload scenario, not only a latency scenario. Fallback must be bounded by source capacity and the correctness of each data class.</p></RememberThis>
  </>;
}
