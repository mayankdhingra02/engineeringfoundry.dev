import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { cachingSources } from "./sources";

const cacheAsideSequence = `sequenceDiagram
  participant C as Client
  participant A as Application
  participant K as Cache
  participant D as Database
  C->>A: GET /users/42
  A->>K: GET user:42
  alt cache hit
    K-->>A: user value
  else cache miss
    K-->>A: not found
    A->>D: SELECT user 42
    D-->>A: user value
    A->>K: SET user:42 + TTL
  end
  A-->>C: response`;

const readThroughSequence = `sequenceDiagram
  participant A as Application
  participant K as Cache abstraction
  participant D as Database
  A->>K: get(user:42)
  alt hit
    K-->>A: value
  else miss
    K->>D: load user 42
    D-->>K: value
    K->>K: store value
    K-->>A: value
  end`;

const writeThroughSequence = `sequenceDiagram
  participant A as Application
  participant K as Cache layer
  participant D as Database
  A->>K: write product 42
  K->>D: persist product 42
  D-->>K: committed
  K->>K: update cached value
  K-->>A: success`;

const writeBehindSequence = `sequenceDiagram
  participant A as Application
  participant K as Cache / buffer
  participant D as Database
  A->>K: increment counter
  K-->>A: acknowledged
  Note over K,D: later, possibly batched
  K->>D: persist accumulated writes
  D-->>K: committed`;

const invalidationFlow = `flowchart LR
  W[Application write] --> DB[(Source of truth)]
  DB --> E[Change event]
  E --> I[Cache invalidator]
  I --> C[(Cached copies)]
  E -. delayed, duplicated, or missed .-> I`;

export function CacheAsideLessonContent() {
  return <>
    <LessonHeading level={2} id="application-owns-fallback">The application owns the miss path</LessonHeading>
    <p>Cache-aside is a common read pattern: check the cache, read the source on a miss, then populate the cache. The database remains the source of truth and only requested values enter the cache.</p>
    <MermaidDiagram chart={cacheAsideSequence} title="Cache-aside hit and miss paths" description="The application checks key user colon 42. A hit returns directly. A miss causes a database read followed by cache population before the response." />
    <pre><code>{`value = cache.get("user:42")
if value is missing:
    value = database.read_user(42)
    cache.set("user:42", value, ttl)
return value`}</code></pre>

    <LessonHeading level={2} id="write-path">Writes need a separate decision</LessonHeading>
    <WorkedExample title="Change Maya to May">
      <pre><code>{`1. UPDATE users SET name = 'May' WHERE id = 42
2. DELETE cache key user:42
3. Next read reloads the committed value`}</code></pre>
      <p>Updating the source and then deleting the cached copy is often simpler than updating every cached representation. It still has a failure window: the database can commit while deletion fails. No ordering is universally safe; state the consistency requirement and recovery mechanism.</p>
    </WorkedExample>
    <LessonCallout variant="tradeoff"><p>A miss adds source latency, cold starts increase origin load, concurrent misses can duplicate work, and a reader can race with invalidation. Simplicity on the diagram does not remove concurrency.</p></LessonCallout>
    <InterviewFollowUps><ul><li>What happens if two requests miss simultaneously?</li><li>What if the database update succeeds but cache deletion fails?</li><li>Should a not-found result be cached?</li><li>Can callers bypass the cache for a read-after-write?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["url-shortener", "news-feed", "ecommerce", "search-engine"]} />
    <FurtherReading items={cachingSources["cache-aside"]} />
    <RememberThis><p>Read from cache first, load from the source on a miss, and invalidate carefully after writes. The pattern is simple; stale-data and concurrency behavior are the hard parts.</p></RememberThis>
  </>;
}

export function ReadThroughLessonContent() {
  return <>
    <LessonHeading level={2} id="cache-owns-loader">The cache abstraction owns loading</LessonHeading>
    <p>With read-through caching, the application asks a cache abstraction for a value. On a miss, that abstraction invokes a configured loader, stores the result, and returns it. Redis alone does not provide a generic database loader; a library or surrounding platform supplies this behavior.</p>
    <MermaidDiagram chart={readThroughSequence} title="Read-through miss handling" description="The application makes one cache call. On a miss, the cache abstraction loads from the database, stores the value, and returns it." />
    <TradeoffTable><table><thead><tr><th>Concern</th><th>Cache-aside</th><th>Read-through</th></tr></thead><tbody><tr><td>Miss fallback</td><td>Application code</td><td>Cache abstraction or loader</td></tr><tr><td>Read code</td><td>Explicit and flexible</td><td>Consistent and compact</td></tr><tr><td>Coupling</td><td>Application owns both dependencies</td><td>Cache layer understands retrieval</td></tr><tr><td>Operations</td><td>More repeated app logic</td><td>More involved cache platform</td></tr></tbody></table></TradeoffTable>
    <p>It helps when a mature library or platform standardizes loaders across applications. It is less attractive when retrieval needs request-specific authorization or complex transactional context that should remain in application code.</p>
    <PracticeConnections ids={["ecommerce", "news-feed", "api-gateway-system"]} />
    <FurtherReading items={cachingSources["read-through"]} />
    <RememberThis><p>Read-through moves the miss loader behind the cache interface. It simplifies application reads but gives the caching layer more responsibility and coupling.</p></RememberThis>
  </>;
}

export function WriteThroughLessonContent() {
  return <>
    <LessonHeading level={2} id="coordinated-write">The cache participates in every write</LessonHeading>
    <p>Write-through coordinates the cache and backing store before acknowledging success according to the implementation. The cached value stays warm, but the cache becomes part of the critical write path.</p>
    <MermaidDiagram chart={writeThroughSequence} title="Conceptual write-through flow" description="The application writes through the cache layer. The layer persists the backing record and updates its cached copy before reporting success." />
    <ul><li><strong>Benefit:</strong> a following read can find the new cached value.</li><li><strong>Cost:</strong> every write pays cache and persistence latency, even if the value is never read.</li><li><strong>Failure question:</strong> what state is visible when one update succeeds and the other fails?</li></ul>
    <LessonCallout variant="common-mistake"><p>“Updated together” does not imply a universal distributed transaction. Define acknowledgement ordering, retries, and reconciliation for the actual cache and store.</p></LessonCallout>
    <InterviewFollowUps><ul><li>Which component reports success?</li><li>Can a cache failure reject an otherwise valid write?</li><li>How is a partial write detected and repaired?</li><li>Is keeping every written value warm worth the memory?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["ecommerce", "shopping-cart", "news-feed"]} />
    <FurtherReading items={cachingSources["write-through"]} />
    <RememberThis><p>Write-through can keep reads warm and consistency easier to describe, while increasing write latency and making cache availability part of the write contract.</p></RememberThis>
  </>;
}

export function WriteBehindLessonContent() {
  return <>
    <LessonHeading level={2} id="acknowledge-before-persistence">Acknowledge before durable persistence</LessonHeading>
    <p>Write-behind, also called write-back, updates a cache or buffer and persists to the backing store asynchronously. It can batch many high-volume counter changes and reduce source writes.</p>
    <MermaidDiagram chart={writeBehindSequence} title="Conceptual write-behind flow" description="The cache acknowledges an application update first, then persists the buffered or batched change to the database later." />
    <TradeoffTable><table><thead><tr><th>Advantage</th><th>Risk introduced</th></tr></thead><tbody><tr><td>Low acknowledgement latency</td><td>Data loss before persistence</td></tr><tr><td>Write coalescing and batches</td><td>Ordering and retry complexity</td></tr><tr><td>Lower backing-store write load</td><td>Shutdown, replay, and recovery work</td></tr></tbody></table></TradeoffTable>
    <WorkedExample title="Aggregate view counters"><p>One million page views do not always require one million immediate durable counter writes. A cache can accumulate increments and flush batches. The product must accept bounded loss or provide a durable log and idempotent replay.</p></WorkedExample>
    <LessonCallout variant="production-note"><p>Do not casually choose write-behind for payments, balances, inventory reservations, or other correctness-critical state. Fast acknowledgement changes the durability promise.</p></LessonCallout>
    <PracticeConnections ids={["news-feed", "leaderboard", "metrics-platform"]} />
    <FurtherReading items={cachingSources["write-behind"]} />
    <RememberThis><p>Write-behind buys faster, batchable writes by accepting a gap between acknowledgement and persistence. Durability, ordering, retry, and recovery are the design.</p></RememberThis>
  </>;
}

export function CacheInvalidationLessonContent() {
  return <>
    <LessonHeading level={2} id="trust-boundary">Knowing when to stop trusting a copy</LessonHeading>
    <blockquote>Reading cached data is easy. Knowing when that cached copy should stop being trusted is the harder part.</blockquote>
    <TradeoffTable><table><thead><tr><th>Strategy</th><th>How it works</th><th>Main limitation</th></tr></thead><tbody>
      <tr><td>TTL only</td><td>Reuse until time expires</td><td>Stale until expiry</td></tr>
      <tr><td>Delete on write</td><td>Remove copy after source commit</td><td>Deletion can fail or race</td></tr>
      <tr><td>Update on write</td><td>Write source and cached value</td><td>Every representation must be correct</td></tr>
      <tr><td>Versioned keys</td><td>Change <code>product:42:v17</code> to a new version</td><td>Old keys need cleanup; readers need version</td></tr>
      <tr><td>Event driven</td><td>Publish source changes to invalidators</td><td>Lag, duplicates, ordering, and missed events</td></tr>
      <tr><td>Manual purge</td><td>Operator invalidates known scope</td><td>Slow and error-prone as a primary policy</td></tr>
    </tbody></table></TradeoffTable>

    <LessonHeading level={2} id="invalidation-race">Invalidation can become a concurrency problem</LessonHeading>
    <WorkedExample title="An old read returns after a new write">
      <pre><code>{`Request A: cache miss, reads old DB value
Request B: updates DB, deletes cache key
Request A: writes the old value into cache

Result: the cache is stale again`}</code></pre>
      <p>Possible mitigations include version checks, ordered writes, bounded TTLs, write coordination, or compare-and-set behavior. Delayed double deletion can narrow particular races, but it is not a universal correctness guarantee.</p>
    </WorkedExample>
    <MermaidDiagram chart={invalidationFlow} title="Event-driven cache invalidation" description="A source-of-truth write produces a change event. An invalidator removes or updates cached copies, while the dashed path calls out that delivery can be delayed, duplicated, or missed." />
    <p>Events help when several services or representations depend on one change. Consumers still need retries, deduplication, observability, and reconciliation. The future <Link href="/system-design/fundamentals/message-queues">Messaging lessons</Link> cover those mechanics; they are not assumed here.</p>
    <CommonMistakes><ul><li>Calling TTL “invalidation solved.”</li><li>Deleting the cache before the database write without discussing a concurrent refill.</li><li>Assuming invalidation events cannot be lost.</li><li>Updating one cached representation while forgetting derived lists and aggregates.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>What if the DB update succeeds but invalidation fails?</li><li>How do readers avoid repopulating an old value?</li><li>How are missed events detected?</li><li>Which operations require read-your-write behavior?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["ecommerce", "news-feed", "search-engine", "url-shortener"]} />
    <FurtherReading items={cachingSources["cache-invalidation"]} />
    <RememberThis><p>Invalidation is a distributed concurrency problem whenever writes, readers, cached representations, and events can race or fail independently.</p></RememberThis>
  </>;
}

export function CacheStrategyComparison() {
  return <TradeoffTable><table><thead><tr><th>Strategy</th><th>Read miss handling</th><th>Write behavior</th><th>Main advantage</th><th>Main risk</th></tr></thead><tbody><tr><td>Cache-aside</td><td>Application loads DB</td><td>DB plus invalidate or update</td><td>Simple and common</td><td>Stale data or miss latency</td></tr><tr><td>Read-through</td><td>Cache abstraction loads DB</td><td>Separate decision</td><td>Simpler app reads</td><td>Cache-layer complexity</td></tr><tr><td>Write-through</td><td>Usually warm</td><td>Cache and DB synchronously</td><td>Warm, fresher reads</td><td>Write latency and partial failure</td></tr><tr><td>Write-behind</td><td>Usually warm</td><td>Cache first, DB later</td><td>Fast, batchable writes</td><td>Durability and ordering</td></tr></tbody></table></TradeoffTable>;
}
