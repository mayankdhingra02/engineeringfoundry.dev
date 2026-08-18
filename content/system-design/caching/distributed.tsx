import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable } from "@/components/system-design-article";
import { cachingSources } from "./sources";

const distributedCache = `flowchart LR
  C[Clients] --> L[Load balancer]
  L --> A[API A]
  L --> B[API B]
  L --> X[API C]
  A --> K[(Cache cluster)]
  B --> K
  X --> K
  K --> D[(Database)]`;

export function DistributedCachingLessonContent() {
  return <>
    <LessonHeading level={2} id="shared-working-set">Share a working set across application instances</LessonHeading>
    <p>A distributed cache is useful when one machine cannot hold or serve the working set, or many application instances need shared cached state. It adds capacity, throughput, and redundancy by partitioning and often replicating data across nodes.</p>
    <MermaidDiagram chart={distributedCache} title="Application fleet with a distributed cache" description="Three API instances share a cache cluster in front of the source database. The cluster may partition keys across cache nodes and replicate selected ownership for availability." />

    <LessonHeading level={2} id="distribution-costs">Distribution creates a new system to operate</LessonHeading>
    <ul><li><strong>Partitioning:</strong> choose which node owns a key.</li><li><strong>Replication:</strong> decide how copies acknowledge and fail over.</li><li><strong>Rebalancing:</strong> move ownership when nodes join or leave.</li><li><strong>Network latency:</strong> every shared-cache access is a remote call.</li><li><strong>Hot keys:</strong> one popular key can still overload one owner.</li><li><strong>Partial failure:</strong> clients need bounded timeouts and recovery behavior.</li></ul>
    <p>The <Link href="/system-design/fundamentals/consistent-hashing">Consistent Hashing lesson</Link> explains how a changing node set can limit key movement. It does not guarantee uniform traffic or eliminate rebalancing.</p>

    <TradeoffTable><table><thead><tr><th>Property</th><th>Local cache</th><th>Distributed cache</th></tr></thead><tbody><tr><td>Read latency</td><td>Fastest; no network hop</td><td>Includes network and cluster routing</td></tr><tr><td>State</td><td>Per application instance</td><td>Shared across clients</td></tr><tr><td>Capacity</td><td>Bounded by one process</td><td>Partitioned across nodes</td></tr><tr><td>Invalidation</td><td>Hard across many copies</td><td>Centralized policy, still distributed internally</td></tr><tr><td>Failure</td><td>Lost with process</td><td>Cluster is a shared dependency</td></tr></tbody></table></TradeoffTable>
    <p>A hybrid can use a tiny local L1 in front of a shared L2 and then the database. That can protect a hot distributed key but creates another stale copy and additional invalidation rules.</p>
    <CommonMistakes><ul><li>Calling a distributed cache “highly available” without a replication and failover design.</li><li>Assuming even key distribution means even request distribution.</li><li>Ignoring client behavior during rebalancing or partial node failure.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>How are keys assigned when a node is added?</li><li>What happens when one node fails?</li><li>What if one key receives 100,000 RPS?</li><li>How does the database survive cluster-wide failure?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["distributed-cache", "url-shortener", "api-gateway-system", "news-feed"]} />
    <FurtherReading items={cachingSources["distributed-caching"]} />
    <RememberThis><p>Distributing a cache increases shared capacity and throughput while introducing partitioning, replication, rebalancing, node failure, and hot-key problems.</p></RememberThis>
  </>;
}

export function RedisCachingLessonContent() {
  return <>
    <LessonHeading level={2} id="one-implementation-choice">Redis is one implementation choice</LessonHeading>
    <p>Redis often appears in interviews because it offers in-memory access, keys with expiration, configurable memory eviction, and data structures useful for shared caches, counters, rate limits, rankings, and coordination.</p>
    <blockquote>Redis is one possible implementation choice. The caching concepts in this section are not Redis-specific.</blockquote>
    <TradeoffTable><table><thead><tr><th>Concept</th><th>Redis bridge</th><th>Question to ask</th></tr></thead><tbody><tr><td>Cache identity</td><td>Keys and typed values</td><td>How is tenant, version, or variant encoded?</td></tr><tr><td>Freshness</td><td>Key expiration / TTL</td><td>What stale window is acceptable?</td></tr><tr><td>Capacity</td><td>Memory limit and eviction policy</td><td>Which entries should survive pressure?</td></tr><tr><td>Availability</td><td>Replication and high-availability options</td><td>What happens during failover and lag?</td></tr><tr><td>Scale</td><td>Cluster partitioning at high level</td><td>How are multi-key access and hot keys handled?</td></tr><tr><td>Durability</td><td>Optional snapshots and append-only logging</td><td>What data loss and recovery contract is required?</td></tr></tbody></table></TradeoffTable>

    <LessonHeading level={2} id="not-only-a-cache">Redis is not only a cache</LessonHeading>
    <p>Strings, hashes, sets, sorted sets, counters, and other structures can support session state, leaderboards, rate limiting, and coordination. Pub/Sub and streams exist, but they belong to later messaging and Redis deep-dive lessons.</p>
    <p>Persistence also exists, so “in memory means never durable” is too simplistic. Conversely, enabling persistence does not automatically make Redis equivalent to the durable primary database required by every product. Topology, acknowledgement, replication, backup, and recovery objectives still decide the contract.</p>
    <LessonCallout variant="tradeoff"><p>Redis can still be slower than a well-designed local or database access path when network latency, serialization, large values, or an unsuitable workload dominate. Benchmark the whole request path.</p></LessonCallout>
    <CommonMistakes><ul><li>Using “Redis” as a complete caching strategy.</li><li>Assuming one Redis topology, one durability mode, or one eviction policy.</li><li>Falling back to the database without proving its capacity.</li><li>Storing unlimited large values without a memory and eviction budget.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>Which data structure and key design fit the access pattern?</li><li>What memory limit and eviction behavior are required?</li><li>Is persistence needed, and what loss window is acceptable?</li><li>How do failover, a hot key, and a cold restart affect the source?</li></ul></InterviewFollowUps>
    <p>The dedicated <Link href="/system-design/technology/redis">Redis Technology Deep Dive</Link> remains separate; this lesson only maps caching decisions to Redis capabilities.</p>
    <PracticeConnections ids={["rate-limiter", "leaderboard", "news-feed", "distributed-cache"]} />
    <FurtherReading items={cachingSources["redis-caching"]} />
    <RememberThis><p>Choose Redis after defining the cache key, value, lifetime, invalidation, capacity, topology, and outage behavior—not as a substitute for those decisions.</p></RememberThis>
  </>;
}
