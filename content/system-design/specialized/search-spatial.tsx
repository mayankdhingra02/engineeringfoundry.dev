import Link from "next/link";
import { GeospatialSearchDemo } from "@/components/geospatial-search-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { SpecializedLessonEnd } from "./shared";

const searchPipeline = `flowchart LR
  D[Documents] --> A[Tokenization / analysis]
  A --> I[(Inverted index)]
  Q[Query] --> I
  I --> C[Candidate documents]
  C --> R[Rank]
  R --> O[Results]`;
const searchSync = `flowchart LR
  W[Writes] --> DB[(Primary database)]
  DB --> P[CDC / outbox pipeline]
  P --> SI[(Search index)]
  U[Search request] --> SI`;
const distributedSearch = `flowchart TD
  C[Client] --> A[Search API]
  A --> S[Coordinating node]
  S --> A1[Shard A]
  S --> B1[Shard B]
  S --> C1[Shard C]
  A1 --> M[Merge / rank]
  B1 --> M
  C1 --> M
  M --> R[Results]`;
const autocomplete = `flowchart LR
  L[Search query logs] --> G[Aggregate popularity]
  G --> P[Popular prefix dataset]
  P --> S[(Autocomplete store)]
  U[Typed prefix] --> A[Autocomplete API / cache]
  A --> S`;
const quadtree = `flowchart TD
  R[Large region] --> NW[Northwest]
  R --> NE[Northeast · dense]
  R --> SW[Southwest]
  R --> SE[Southeast]
  NE --> NE1[NE-1]
  NE --> NE2[NE-2]
  NE --> NE3[NE-3]
  NE --> NE4[NE-4]`;

export function FullTextSearchLessonContent() { return <>
  <LessonHeading level={2} id="retrieval-not-substring">Search is retrieval and ranking, not only substring matching</LessonHeading><p><code>LIKE &apos;%wireless headphones%&apos;</code> may be acceptable for a small catalog, but a search product often needs tokenization, multiple fields, relevance, typo handling, filters, and highlighting. Those requirements motivate a derived retrieval index.</p><MermaidDiagram chart={searchPipeline} title="Conceptual full-text search pipeline" description="Documents are analyzed into an inverted index; a query retrieves candidate documents that are ranked into results." />
  <TradeoffTable><table><thead><tr><th>Primary database</th><th>Search index</th></tr></thead><tbody><tr><td>Authoritative state and transactions</td><td>Token-based retrieval and relevance</td></tr><tr><td>Point and range access paths</td><td>Text fields, filters, facets, highlighting</td></tr></tbody></table></TradeoffTable><MermaidDiagram chart={searchSync} title="Search as a derived read model" description="Writes commit to the primary database and later flow through CDC or an outbox to the search index; searches read the index." /><p>If indexing falls behind, search can temporarily return stale products. Define freshness, replay, repair, and deletion behavior; cross-link the <Link href="/system-design/fundamentals/change-data-capture">CDC</Link> and <Link href="/system-design/fundamentals/transactional-outbox">outbox</Link> patterns instead of duplicating them.</p><SpecializedLessonEnd id="full-text-search" practice={["search-engine", "ecommerce", "nearby-search"]}>The primary database owns truth; a search index owns a retrieval-optimized derived view. Explain analysis, candidate retrieval, ranking, and synchronization lag.</SpecializedLessonEnd>
  </>; }

export function InvertedIndexesLessonContent() { return <>
  <LessonHeading level={2} id="reverse-the-question">Store term → documents directly</LessonHeading><p>A normal primary-key index answers “find document 42.” Text search asks “which documents contain distributed systems?” An inverted index reverses that relationship.</p><WorkedExample title="Three tiny documents"><pre><code>{`Doc 1: "system design interview"
Doc 2: "system design patterns"
Doc 3: "coding interview"

system    → [1, 2]
design    → [1, 2]
interview → [1, 3]
patterns  → [2]
coding    → [3]`}</code></pre></WorkedExample><p>Postings can carry term frequency, field identity, and positions when scoring or phrase behavior requires them. BM25 is a common relevance model, but interview depth is why the mapping supports candidate retrieval—not deriving its formula.</p><SpecializedLessonEnd id="inverted-indexes" practice={["search-engine", "ecommerce"]}>An inverted index maps analyzed terms to matching document IDs. Extra posting information supports ranking and phrase behavior, at storage and indexing cost.</SpecializedLessonEnd>
  </>; }

export function SearchEngineConceptsLessonContent() { return <>
  <LessonHeading level={2} id="distributed-index">A distributed search engine partitions a searchable index</LessonHeading><p>At interview depth, Elasticsearch and OpenSearch expose indexes containing documents. Primary shards partition an index; replica shards hold copies. A coordinating node may route a query to relevant shard copies, collect shard results, and merge them.</p><MermaidDiagram chart={distributedSearch} title="Distributed search fan-out and merge" description="A coordinating search node fans a query to three shards and merges their ranked responses." /><TradeoffTable><table><thead><tr><th>Good fit</th><th>Poor default fit</th></tr></thead><tbody><tr><td>Text search, filtering, facets, log/event search</td><td>Correctness-critical multi-row transactions</td></tr><tr><td>Derived search read models</td><td>Automatic replacement for the authoritative database</td></tr></tbody></table></TradeoffTable><p>Shards add parallelism and distribution but also fan-out, merge, rebalancing, and operational cost. Choose shard strategy from data volume, traffic, routing, and failure requirements—not a memorized count.</p><SpecializedLessonEnd id="search-engine-concepts" practice={["search-engine", "log-aggregation", "ecommerce"]}>A distributed search engine partitions and replicates searchable indexes. Keep authoritative transactions elsewhere unless the requirements explicitly justify another boundary.</SpecializedLessonEnd>
  </>; }

export function SearchAutocompleteLessonContent() { return <>
  <LessonHeading level={2} id="rank-prefixes">Prefix lookup is only half the product</LessonHeading><p>For <code>san fr…</code>, users expect low-latency suggestions such as San Francisco, its airport, and weather. A database prefix query can serve smaller scale; high-QPS serving may justify a dedicated prefix index, precomputed popular queries, caches, and distributed replicas.</p><MermaidDiagram chart={autocomplete} title="Offline aggregation feeding online autocomplete" description="Query logs are aggregated into a popular-prefix dataset, loaded into an autocomplete store, and served through a low-latency API and cache." /><p>Rank from product-approved signals such as frequency, recency, locale, or personalization. Batch refresh is simpler but stale; streaming refresh is fresher but adds state and operational complexity. A trie or FST-style structure helps lookup but does not solve ranking, updates, abuse, or distribution.</p><InterviewFollowUps><ul><li>How quickly must new suggestions appear?</li><li>How are unsafe or deleted suggestions removed?</li><li>How does locale change ranking?</li><li>What is cached by prefix?</li></ul></InterviewFollowUps><SpecializedLessonEnd id="search-autocomplete" practice={["search-autocomplete", "search-engine"]}>A production autocomplete system combines prefix retrieval with ranking, freshness, caching, and distributed serving.</SpecializedLessonEnd>
  </>; }

export function TriesPrefixSearchLessonContent() { return <>
  <LessonHeading level={2} id="shared-prefix">A trie shares storage and traversal for prefixes</LessonHeading><pre><code>{`c
└─ a
   ├─ r
   └─ t`}</code></pre><p>Traversing <code>ca</code> reaches candidates beneath that node without scanning unrelated keys. Yet a plain in-memory trie of every historical query may consume substantial memory and says nothing about ranking or distributed updates.</p><CommonMistakes><ul><li>Calling the trie the entire autocomplete architecture.</li><li>Ignoring popularity metadata and result limits.</li><li>Assuming one machine can hold and update every locale.</li></ul></CommonMistakes><SpecializedLessonEnd id="tries-prefix-search" practice={["search-autocomplete"]}>A trie makes prefix traversal natural. Production autocomplete still needs compact representation, ranking, updates, partitioning, and caching.</SpecializedLessonEnd>
  </>; }

export function GeospatialSearchLessonContent() { return <>
  <LessonHeading level={2} id="narrow-candidates">Find nearby candidates before calculating precise distance</LessonHeading><p>Scanning every driver and calculating every distance does not scale. Partition the search space, inspect the user&apos;s cell and relevant neighbors, then calculate precise geographic distance for the reduced candidate set.</p><GeospatialSearchDemo /><p>Moving entities update cell membership; Manhattan-like density can create hot cells; rural searches may expand farther. The spatial index narrows candidates—it does not itself prove that a candidate is within five kilometers.</p><InterviewFollowUps><ul><li>What happens near cell boundaries?</li><li>How often do moving drivers publish location?</li><li>How does the system handle dense hot cells?</li><li>How does radius expansion stop?</li></ul></InterviewFollowUps><SpecializedLessonEnd id="geospatial-search" practice={["ride-sharing", "nearby-search", "food-delivery"]}>Query relevant spatial cells first, then perform exact filtering. Design explicitly for cell boundaries, movement, and uneven density.</SpecializedLessonEnd>
  </>; }

export function GeohashingLessonContent() { return <>
  <LessonHeading level={2} id="hierarchical-prefix">Encode a coordinate into a hierarchical spatial prefix</LessonHeading><p>A geohash-like encoding maps latitude/longitude to a string such as the conceptual <code>9q8yy…</code>. A longer prefix represents a smaller cell. Nearby points often share prefixes, but points on opposite sides of a boundary may not.</p><p>Search the current and relevant neighboring cells, then apply an exact distance calculation. Do not publish a universal “prefix length equals radius” rule: cell dimensions vary by latitude and the implementation&apos;s encoding.</p><TradeoffTable><table><thead><tr><th>Strength</th><th>Cost</th></tr></thead><tbody><tr><td>Hierarchical key/prefix representation</td><td>Boundary and neighbor handling</td></tr><tr><td>Works with prefix-based partitioning</td><td>Fixed cells can be hot in dense areas</td></tr></tbody></table></TradeoffTable><SpecializedLessonEnd id="geohashing" practice={["ride-sharing", "nearby-search"]}>Geohashes are candidate-generating spatial keys, not exact proximity guarantees. Query neighbors and filter by precise distance.</SpecializedLessonEnd>
  </>; }

export function QuadtreesLessonContent() { return <>
  <LessonHeading level={2} id="split-density">Split dense regions more deeply</LessonHeading><p>A quadtree begins with one region and recursively divides a crowded region into four. Sparse areas remain coarse while dense areas gain finer partitions.</p><MermaidDiagram chart={quadtree} title="Adaptive four-way spatial partitioning" description="A large region splits into four quadrants; only the dense northeast quadrant splits again." /><TradeoffTable><table><thead><tr><th>Geohash-style grid</th><th>Quadtree</th></tr></thead><tbody><tr><td>Hierarchical fixed encoding and easy prefixes</td><td>Adaptive subdivision where density requires it</td></tr><tr><td>Neighbor and boundary handling</td><td>Tree maintenance, movement, and rebalancing</td></tr></tbody></table></TradeoffTable><p>Neither is universally superior. In a distributed system, also define who owns tree regions and how moves or splits migrate state.</p><SpecializedLessonEnd id="quadtrees" practice={["ride-sharing", "nearby-search"]}>Quadtrees adapt spatial resolution to density, trading simpler fixed keys for tree management and ownership complexity.</SpecializedLessonEnd>
  </>; }
