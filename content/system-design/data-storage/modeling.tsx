import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { dataStorageSources } from "./sources";

export function DataModelingLessonContent() {
  return <>
    <LessonHeading level={2} id="operations-before-database">Write the operations before naming a database</LessonHeading>
    <p>A schema is useful only when it supports the product&apos;s reads, writes, invariants, and retention. Start with entities and relationships, then list the operations that must remain fast and correct at the expected scale.</p>
    <WorkedExample title="Model chat from its access patterns">
      <pre><code>{`Entities
User · Conversation · ConversationMember · Message

Access patterns
Get conversations for a user
Get recent messages for a conversation
Append a new message
Find conversation members`}</code></pre>
      <p><code>conversation_id</code> is a natural lookup and partition candidate for message history; <code>(conversation_id, created_at, message_id)</code> supports ordered pagination. A separate membership lookup keyed by user may be justified because “conversations for a user” points in the opposite direction.</p>
    </WorkedExample>

    <LessonHeading level={2} id="decision-checklist">Turn each operation into a storage requirement</LessonHeading>
    <ul><li>Identify lookup keys, filters, sort order, ranges, and pagination direction.</li><li>Estimate read/write frequency, payload size, growth, retention, and deletion behavior.</li><li>State which changes form one transactional boundary.</li><li>Notice queries that cross the likely partition key or require relationships.</li><li>Choose normalization or duplication from update and read behavior.</li></ul>
    <LessonCallout variant="important"><p>“Messages will be queried by conversation in reverse chronological order” is actionable. “Store messages in NoSQL for scale” is not.</p></LessonCallout>

    <LessonHeading level={2} id="news-feed-exercise">Exercise: model a News Feed</LessonHeading>
    <p>Before choosing storage, support creating and retrieving a post, posts by author, a paginated home timeline, high read volume, and celebrity accounts.</p>
    <details><summary>Reveal one access-pattern-first answer</summary><div><p>Keep canonical posts addressable by <code>post_id</code> and an author timeline ordered by creation time. Treat the home timeline as a separate access pattern: ordinary authors may fan out references to follower timelines, while celebrity posts can be merged at read time to avoid explosive writes. Use stable cursor pagination and keep the source post authoritative even if feed entries duplicate display metadata.</p></div></details>
    <CommonMistakes><ul><li>Choosing a product before stating queries.</li><li>Using one table or collection for unrelated access patterns merely to avoid duplication.</li><li>Ignoring retention, deletion, or cross-tenant boundaries.</li></ul></CommonMistakes>
    <PracticeConnections ids={["chat-system", "news-feed", "ecommerce"]} />
    <FurtherReading items={dataStorageSources["data-modeling"]} />
    <RememberThis><p>Model the operations first. Keys, indexes, partitions, duplication, and database choice should each answer a concrete read, write, correctness, scale, or retention requirement.</p></RememberThis>
  </>;
}

export function SqlVsNosqlLessonContent() {
  return <>
    <LessonHeading level={2} id="categories-are-not-guarantees">“SQL is consistent; NoSQL scales” is not a decision framework</LessonHeading>
    <p>Relational and non-relational systems span many transaction, replication, consistency, and scaling designs. The useful question is which data model and operating trade-offs fit this workload.</p>
    <TradeoffTable><table><thead><tr><th>Pressure</th><th>Relational may fit</th><th>Non-relational model may fit</th></tr></thead><tbody><tr><td>Relationships and evolving queries</td><td>Joins, constraints, flexible SQL</td><td>Explicit precomputed access paths</td></tr><tr><td>Correctness boundary</td><td>Multi-row transactions and constraints</td><td>Key/document-scoped operations may be sufficient</td></tr><tr><td>Dominant access</td><td>Several related query shapes</td><td>Predictable key, document, or partition-range access</td></tr><tr><td>Distribution</td><td>Can scale, with system-specific trade-offs</td><td>Some models make partitioning central</td></tr><tr><td>Shape</td><td>Structured relationships</td><td>Nested documents or wide sparse partitions</td></tr></tbody></table></TradeoffTable>

    <LessonHeading level={2} id="decision-flow">A compact decision flow</LessonHeading>
    <pre><code>{`Need relational constraints or multi-row transactions?
  → Consider relational storage first
Mostly key lookup at very high scale?
  → Consider key-value or wide-column
Need bounded nested aggregates read together?
  → Consider a document model
Need full-text relevance?
  → Add a search index; do not force one primary store to do everything`}</code></pre>
    <p>Multiple stores can be reasonable, but every additional system adds synchronization, failure, and operational work. Start with the simplest store that satisfies the important invariants.</p>

    <LessonHeading level={2} id="four-workloads">Four workloads, four defensible starting points</LessonHeading>
    <ul><li><strong>Payments:</strong> relational constraints, transactions, and auditability are often attractive.</li><li><strong>Product catalog:</strong> relational tables or documents can both fit; attribute variability and query requirements decide.</li><li><strong>Sessions:</strong> key-value lookup with expiry is natural.</li><li><strong>High-volume events:</strong> a wide-column or time-series-oriented model may fit known time/partition queries.</li></ul>
    <LessonCallout variant="common-mistake"><p>“Use NoSQL because scale” skips relationships, transactions, query shape, partition key, hotspot risk, and operational maturity—the actual design work.</p></LessonCallout>
    <PracticeConnections ids={["payment-system", "chat-system", "news-feed", "url-shortener"]} />
    <FurtherReading items={dataStorageSources["sql-vs-nosql"]} />
    <RememberThis><p>Start with access patterns and correctness. Database categories are not shortcuts for consistent versus scalable; choose the query, transaction, partitioning, and operating trade-offs that fit.</p></RememberThis>
  </>;
}

export function RelationalDatabasesLessonContent() {
  return <>
    <LessonHeading level={2} id="relationships-are-part-of-the-model">Relationships and invariants belong in the model</LessonHeading>
    <pre><code>{`users(id PRIMARY KEY, email UNIQUE, created_at)
orders(id PRIMARY KEY, user_id REFERENCES users(id), status, created_at)`}</code></pre>
    <p>Tables give entities a defined shape. Primary keys establish identity, foreign keys can preserve references, and constraints reject invalid states. A join answers questions such as “orders for this user” without copying the entire user into every order.</p>
    <LessonHeading level={2} id="strength-with-cost">Structure buys correctness and query flexibility</LessonHeading>
    <p>Transactions group related changes. Indexes accelerate chosen queries. SQL makes filtering, joining, grouping, and evolving analysis expressive. Those capabilities still require schema evolution, index discipline, capacity planning, and careful distribution at scale.</p>
    <TradeoffTable><table><thead><tr><th>Mechanism</th><th>What it protects or enables</th><th>Cost/question</th></tr></thead><tbody><tr><td>Foreign key</td><td>Referenced row exists</td><td>Write coordination and lifecycle</td></tr><tr><td>Unique constraint</td><td>No duplicate business key</td><td>Contention and index work</td></tr><tr><td>Join</td><td>Related data without duplication</td><td>Plan and data-volume sensitivity</td></tr><tr><td>Transaction</td><td>Cross-row invariant</td><td>Isolation and contention choices</td></tr></tbody></table></TradeoffTable>
    <PracticeConnections ids={["payment-system", "ticketmaster", "inventory-system", "ecommerce"]} />
    <FurtherReading items={dataStorageSources["sql-databases"]} />
    <RememberThis><p>Relational storage is compelling when relationships, constraints, transactions, and flexible queries matter. It is a model with trade-offs, not a synonym for small scale.</p></RememberThis>
  </>;
}

export function KeyValueStoresLessonContent() {
  return <>
    <LessonHeading level={2} id="one-key-one-access-path">A key gives one predictable access path</LessonHeading>
    <pre><code>{`session:abc123 → { userId: 42, expiresAt: "..." }
flags:user:42   → { checkoutV2: true }`}</code></pre>
    <p>When the application knows the complete key, lookup can be simple and easy to partition conceptually. Sessions, preferences, feature flags, counters, and direct lookup tables often fit this shape.</p>
    <LessonHeading level={2} id="secondary-questions">The second query changes the model</LessonHeading>
    <p>“Fetch session by token” is direct. “Find every session for this user ordered by last activity” needs another key structure, an index, or a different store. Value size, atomic operation scope, expiry, partition key distribution, and hot keys still matter.</p>
    <LessonCallout variant="tradeoff"><p>Key-value does not mean value design is irrelevant. Decide whether the value is opaque, partially updateable, bounded in size, versioned, or split across keys.</p></LessonCallout>
    <p>DynamoDB and Redis are examples used for key-oriented patterns, but their durability, query, transaction, and memory/storage behavior differ. Product names do not replace requirements.</p>
    <PracticeConnections ids={["url-shortener", "feature-flag-system", "distributed-cache"]} />
    <FurtherReading items={dataStorageSources["key-value-stores"]} />
    <RememberThis><p>Key-value stores are strongest when the application knows its keys and access is predictable. Every secondary query, hot key, expiry rule, and atomicity requirement needs an explicit design.</p></RememberThis>
  </>;
}

export function DocumentDatabasesLessonContent() {
  return <>
    <LessonHeading level={2} id="read-a-bounded-aggregate">Keep related data together when it is read together</LessonHeading>
    <pre><code>{`{
  "userId": "42",
  "name": "Maya",
  "addresses": [{ "city": "Austin", "type": "home" }]
}`}</code></pre>
    <p>A document can hold nested objects and arrays that form a bounded aggregate. This maps naturally to application objects and can retrieve related data in one operation.</p>
    <LessonHeading level={2} id="flexible-not-schema-free">Flexible does not mean schema-free</LessonHeading>
    <p>The application still relies on field meaning, types, versions, indexes, and validation. Some document databases can enforce validation rules. Embedding avoids a join but can duplicate data, grow without bound, and make one shared value expensive to update across many documents.</p>
    <TradeoffTable><table><thead><tr><th>Embed</th><th>Reference</th></tr></thead><tbody><tr><td>Data is bounded and read/updated together</td><td>Entity is shared, large, or changes independently</td></tr><tr><td>One-operation retrieval</td><td>Avoids widespread duplication</td></tr><tr><td>Watch document growth and repeated copies</td><td>Requires additional reads or application composition</td></tr></tbody></table></TradeoffTable>
    <LessonCallout variant="common-mistake"><p>Putting an unbounded message history inside one conversation document turns convenient nesting into an ever-growing write and retrieval boundary.</p></LessonCallout>
    <PracticeConnections ids={["ecommerce", "shopping-cart", "news-feed"]} />
    <FurtherReading items={dataStorageSources["document-databases"]} />
    <RememberThis><p>Documents fit bounded data that is read together. Flexible shape still needs a schema contract; embedding trades joins for duplication, growth, and update complexity.</p></RememberThis>
  </>;
}

export function WideColumnDatabasesLessonContent() {
  return <>
    <LessonHeading level={2} id="query-shapes-the-key">The primary key encodes the query</LessonHeading>
    <pre><code>{`partition key: conversation_id
clustering key: message_timestamp + message_id

Query: recent messages for one conversation, ordered by time`}</code></pre>
    <p>The partition key determines which rows live together; clustering columns order rows inside that partition. This can make bounded range reads efficient, but query flexibility is intentionally constrained by the key design.</p>
    <LessonHeading level={2} id="partition-boundaries">A partition is both a locality benefit and a risk</LessonHeading>
    <p>Grouping a conversation&apos;s messages gives local range access. A single enormous or extremely active conversation can create a hot, oversized partition, so time buckets or another workload-specific split may be needed.</p>
    <CommonMistakes><ul><li>Designing tables around entities rather than exact queries.</li><li>Using a low-cardinality or monotonically hot partition key.</li><li>Assuming arbitrary filters will remain efficient.</li><li>Creating one unbounded partition per customer or device.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>Which query does this primary key serve?</li><li>How large can one partition grow?</li><li>Which key becomes hot?</li><li>What new table or index supports the next access pattern?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["chat-system", "event-analytics", "metrics-platform"]} />
    <FurtherReading items={dataStorageSources["wide-column-databases"]} />
    <RememberThis><p>Wide-column modeling is query-first. The partition key chooses locality and distribution; clustering columns choose ordered access inside that partition. Poor keys create hotspots or impossible queries.</p></RememberThis>
  </>;
}
