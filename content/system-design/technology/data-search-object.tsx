import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { CommonMistakes, FailureDeepDive, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { ConceptFirst, TechnologyLessonEnd } from "./shared";

const dynamoArchitecture = `flowchart LR
  A[Application access pattern] --> K[Partition key]
  K --> P1[Storage partition A]
  K --> P2[Storage partition B]
  K --> P3[Storage partition C]
  A --> G[Secondary index access pattern]
  G --> GP[Independently partitioned GSI]`;
const searchPipeline = `flowchart LR
  DB[(Primary database)] --> O[CDC / outbox]
  O --> K[Event stream]
  K --> I[Indexer]
  I --> S[(Search cluster)]
  Q[Search query] --> S
  S --> R[Ranked results]`;
const s3Architecture = `sequenceDiagram
  participant C as Client
  participant A as Application API
  participant D as Metadata database
  participant O as Object storage
  participant W as Processing worker
  C->>A: Request authorized upload
  A->>D: Create pending metadata
  A-->>C: Presigned upload access
  C->>O: Upload bytes or parts
  O-->>W: Object event
  W->>D: Mark processed rendition ready`;

export function DynamoDbTechnologyLessonContent() { return <>
  <ConceptFirst need="a managed, horizontally distributed key-oriented store for known access patterns" technology="Amazon DynamoDB" />
  <LessonHeading level={2} id="problem">The key design begins with access patterns</LessonHeading><p>DynamoDB is useful when requests can be expressed through well-designed partition and sort keys and the team values a managed distributed operating model. It is not “NoSQL for big scale.” Write the important reads and writes first; those patterns shape keys and secondary indexes.</p>
  <LessonHeading level={2} id="architecture">Mental model: key shape drives distribution and lookup</LessonHeading><MermaidDiagram chart={dynamoArchitecture} title="Access patterns become partitioned key paths" description="An application access pattern selects a partition key distributed across storage partitions, while a secondary access pattern uses an independently partitioned global secondary index." /><WorkedExample title="Recent orders for one customer"><pre><code>{`PK = CUSTOMER#123
SK = ORDER#2026-08-14T14:05:00Z

Query one customer partition ordered by time.`}</code></pre><p>This is one possible design, not a universal single-table recipe. A good partition key both supports the request and spreads traffic. A popular event or tenant can still concentrate demand.</p></WorkedExample>
  <LessonHeading level={2} id="indexes">Secondary indexes buy access patterns with write and consistency cost</LessonHeading><p>A global secondary index can use different partition and sort keys and is maintained asynchronously from the base table. Its reads are eventually consistent. A local secondary index shares the base partition key and can support strongly consistent reads, but has different lifecycle and storage constraints. Interview depth is the propagation, partitioning, and write-amplification tradeoff—not memorized limits.</p>
  <LessonHeading level={2} id="consistency">DynamoDB is not simply “eventually consistent”</LessonHeading><p>Table and local-secondary-index reads can request eventual or strong consistency. Global-secondary-index and stream reads are eventually consistent. Global tables also have mode-specific behavior, so state the exact resource and region boundary before promising what a user observes.</p><LessonCallout variant="important" title="Correctness through conditions"><p>A conditional update such as “set seat to RESERVED only if status is AVAILABLE” provides an optimistic concurrency primitive. It prevents a stale writer from blindly overwriting the current item, but the application must handle a failed condition and uncertain network outcomes.</p></LessonCallout>
  <LessonHeading level={2} id="hot-partitions">Hot partitions are a key-design failure, not only a capacity problem</LessonHeading><p><code>PK = EVENT#POPULAR_CONCERT</code> routes one event&apos;s traffic together. Depending on required reads and writes, consider time or hash buckets, a different aggregate model, caching, or separating contested inventory from read-heavy event data. Bucketing adds fan-out and aggregation work, so do not salt a key automatically.</p>
  <LessonHeading level={2} id="postgres-comparison">DynamoDB vs PostgreSQL</LessonHeading><TradeoffTable><table><thead><tr><th>PostgreSQL tendency</th><th>DynamoDB tendency</th></tr></thead><tbody><tr><td>Relations, joins, constraints, flexible transactions and queries</td><td>Predictable key-oriented access and managed partitioned operations</td></tr><tr><td>Schema can support evolving ad hoc access</td><td>Access patterns shape key and index design up front</td></tr><tr><td>Scale through primary/replica and later sharding choices</td><td>Distribution is part of the service model, but hot keys remain possible</td></tr></tbody></table></TradeoffTable>
  <CommonMistakes><ul><li>Choosing DynamoDB because “NoSQL scales.”</li><li>Designing the table before listing access patterns.</li><li>Calling every read eventually consistent.</li><li>Assuming GSIs update synchronously.</li><li>Ignoring hot tenants, items, and secondary-index keys.</li><li>Using scans as the primary serving plan.</li></ul></CommonMistakes>
  <InterviewFollowUps><ul><li>Which requests does this key shape serve?</li><li>Can one partition key become hot?</li><li>Which read needs strong consistency?</li><li>What does a stale GSI result do to the product?</li><li>Why not use PostgreSQL?</li></ul></InterviewFollowUps>
  <TechnologyLessonEnd id="dynamodb" practice={["url-shortener", "chat-system", "ticketmaster"]}>DynamoDB rewards access-pattern-first keys. Defend distribution, hot-key behavior, the exact consistency surface, index propagation, conditional writes, and why a relational database is not the simpler fit.</TechnologyLessonEnd>
</>; }

export function ElasticsearchTechnologyLessonContent() { return <>
  <ConceptFirst need="full-text candidate retrieval, relevance ranking, filters, and aggregations" technology="Elasticsearch or OpenSearch" />
  <LessonHeading level={2} id="problem">A derived retrieval system, not a slow-query reflex</LessonHeading><p>Use a dedicated search engine when users need token-aware search, ranking, filters, facets, highlighting, or large-scale log retrieval. First ask whether a normal <Link href="/system-design/fundamentals/database-indexes">database index</Link> solves the query. Product search and transactional truth are different responsibilities.</p>
  <LessonHeading level={2} id="architecture">Clusters divide indexes into primary and replica shards</LessonHeading><p>At interview depth, both Elasticsearch and OpenSearch organize documents into indexes divided into shards. Primary shard copies receive indexing operations; replicas provide redundant copies and can serve reads. A coordinating node fans a search to relevant shard copies and merges local results. The products share lineage and concepts, but exact features and defaults can diverge—verify the chosen product.</p><MermaidDiagram chart={searchPipeline} title="Authoritative writes feeding a derived search index" description="A primary database emits changes through CDC or an outbox into an event stream; an indexer updates the search cluster, which serves ranked queries." />
  <LessonHeading level={2} id="visibility">An acknowledged index write and a searchable document are distinct moments</LessonHeading><p>Refresh operations make recent indexed changes available to search. Elasticsearch and OpenSearch expose refresh controls and periodic behavior, but defaults and hosted variants can differ. Design from the required visibility delay and cost; do not hardcode a universal one-second guarantee.</p>
  <LessonHeading level={2} id="distributed-query">Query fan-out creates both parallelism and overhead</LessonHeading><pre><code>{`Query
→ relevant shard copies
→ local retrieval + ranking
→ coordinating merge
→ results`}</code></pre><p>Too many tiny shards can increase coordination, memory, recovery, and merge work. Too few oversized shards can constrain distribution and recovery. Avoid formulaic shard counts; state data volume, traffic, routing, growth, and failure requirements.</p>
  <LessonHeading level={2} id="failure">Search failure should not corrupt the source of truth</LessonHeading><FailureDeepDive failure="Indexing falls behind or a mapping change requires reindexing." impact="Search returns stale, missing, or incorrectly ranked documents while authoritative records remain correct." detection="Measure pipeline lag, failed indexing operations, query errors, cluster health, and index-versus-source reconciliation samples." mitigation="Retain replayable change history, make indexing idempotent, support backfill/rebuild, version indexes, and switch aliases or routing after validation." tradeoff="Derived indexes add retrieval power at the cost of synchronization and operating complexity." />
  <LessonHeading level={2} id="choose">Fit and alternatives</LessonHeading><TradeoffTable><table><thead><tr><th>Good reason</th><th>Weak reason</th></tr></thead><tbody><tr><td>Full-text analysis and relevance are product requirements.</td><td>One SQL query is slow and lacks an appropriate index.</td></tr><tr><td>Filtering/faceting or log retrieval justifies a derived index.</td><td>You need correctness-critical multi-row transactions.</td></tr><tr><td>You can tolerate and repair an explicit freshness window.</td><td>You have no replay or reindex strategy.</td></tr></tbody></table></TradeoffTable>
  <CommonMistakes><ul><li>Using search as the only authoritative transactional store without justification.</li><li>Ignoring indexing lag, deletes, duplicates, and rebuilds.</li><li>Assuming Elasticsearch and OpenSearch remain behaviorally identical.</li><li>Prescribing a shard count without workload evidence.</li><li>Adding search infrastructure before fixing a database index.</li></ul></CommonMistakes>
  <InterviewFollowUps><ul><li>Where is the source of truth?</li><li>How stale may search results be?</li><li>How are deletes, duplicates, and replay handled?</li><li>What happens during a full reindex?</li><li>Can routing avoid querying every shard?</li></ul></InterviewFollowUps>
  <TechnologyLessonEnd id="elasticsearch" practice={["search-engine", "search-autocomplete", "nearby-search"]}>Elasticsearch and OpenSearch implement distributed full-text retrieval through indexes and shards. Defend the derived-data boundary, refresh visibility, fan-out, lag, rebuilds, and why a normal database index is insufficient.</TechnologyLessonEnd>
</>; }

export function S3TechnologyLessonContent() { return <>
  <ConceptFirst need="durable object-oriented storage for large bytes outside relational rows" technology="Amazon S3 or another object store" />
  <LessonHeading level={2} id="problem">Store bytes by key; keep application relationships elsewhere</LessonHeading><p>An object store maps a key to object bytes plus service metadata inside a bucket/container. It fits images, video, backups, logs, datasets, and downloadable files. A database usually owns application metadata such as owner, authorization, processing state, and relationships.</p>
  <LessonHeading level={2} id="upload">Move large bytes directly to object storage</LessonHeading><MermaidDiagram chart={s3Architecture} title="Authorized direct upload and event-driven processing" description="A client requests upload authorization from an API, records pending metadata, uploads directly to object storage, and a worker consumes an object event before marking the item ready." /><p>Presigned access lets the API authorize a bounded upload without proxying every byte. The application must still validate identity, key scope, content policy, final object state, and abandoned uploads. Review <Link href="/system-design/fundamentals/file-uploads">large-file uploads</Link>.</p>
  <LessonHeading level={2} id="multipart">Multipart upload makes large transfers recoverable</LessonHeading><p>Split a large object into numbered parts, upload parts independently—potentially in parallel—and complete the upload from those parts. Failed parts can be retried without retransmitting the entire object. Track upload identity, integrity, completion, and cleanup rather than treating multipart as automatic application resumability.</p>
  <LessonHeading level={2} id="guarantees">Consistency, durability, and availability answer different questions</LessonHeading><p>Current Amazon S3 provides strong read-after-write consistency for successful object PUT and DELETE operations, including subsequent GET and LIST behavior. That corrects old interview folklore. Strong consistency does not mean every surrounding workflow is atomic: the metadata database, CDN, event consumer, or authorization cache may still lag or fail.</p><LessonCallout variant="important" title="Events can repeat"><p>Amazon S3 event notifications are designed for at-least-once delivery. Processing workers should be idempotent and reconcile source state instead of assuming exactly one notification.</p></LessonCallout>
  <LessonHeading level={2} id="delivery">CDN delivery and private access</LessonHeading><pre><code>{`Object storage → CDN edge → users

Private object:
authorize user → issue bounded signed access → fetch bytes`}</code></pre><p>A CDN lowers repeated origin work and geographic latency. Private media needs an authorization boundary, expiration, and cache-key policy; an unguessable object key is not sufficient authorization.</p>
  <LessonHeading level={2} id="choose">When to choose it—and when not to</LessonHeading><TradeoffTable><table><thead><tr><th>Good fit</th><th>Poor fit</th></tr></thead><tbody><tr><td>Large immutable or versioned bytes, archives, media, logs</td><td>Relational joins, row constraints, low-latency record mutation</td></tr><tr><td>Direct HTTP transfer and lifecycle retention</td><td>Queue semantics or arbitrary record queries</td></tr><tr><td>Origin for CDN and asynchronous processing</td><td>Assuming object upload and metadata commit form one transaction</td></tr></tbody></table></TradeoffTable>
  <CommonMistakes><ul><li>Repeating the obsolete claim that all S3 reads are eventually consistent.</li><li>Putting large media bytes in the primary relational row by default.</li><li>Proxying all uploads through application servers without a requirement.</li><li>Trusting object keys as authorization.</li><li>Assuming one event notification or an atomic object-plus-database workflow.</li></ul></CommonMistakes>
  <InterviewFollowUps><ul><li>Who authorizes upload and download?</li><li>Where is object metadata and processing status stored?</li><li>How are retries, checksums, and abandoned parts handled?</li><li>What if the event is delivered twice?</li><li>How does CDN invalidation affect freshness?</li></ul></InterviewFollowUps>
  <TechnologyLessonEnd id="s3" practice={["video-streaming", "cloud-file-storage", "pastebin"]}>Object storage owns large bytes by key; the application owns authorization and workflow metadata. Explain direct multipart transfer, S3&apos;s current strong consistency, at-least-once events, CDN delivery, and cleanup.</TechnologyLessonEnd>
</>; }
