import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, InterviewFollowUps, TradeoffTable } from "@/components/system-design-article";
import { SpecializedLessonEnd } from "./shared";

const vector = `flowchart LR
  D[Documents] --> EM[Embedding model]
  EM --> VI[(Vector index)]
  Q[Query] --> QM[Embedding model]
  QM --> VS[Vector search]
  VI --> VS
  VS --> C[Candidates]
  C --> R[Optional reranking]`;
const embeddings = `flowchart TD
  D[(Documents)] --> B[Offline embedding jobs]
  B --> V1[(Vector index · model v17)]
  M[Model v18] --> RE[Re-embedding pipeline]
  D --> RE
  RE --> V2[(Vector index · model v18)]
  Q[Online query] --> M
  M --> V2`;
const serving = `flowchart TD
  C[Client] --> L[Load balancer]
  L --> I1[Inference server · model v17]
  L --> I2[Inference server · model v18 canary]
  I1 --> H[CPU / accelerator]
  I2 --> H
  Q[(Async queue)] --> W[Batch inference workers]`;
const featureStore = `flowchart TD
  R[Raw data] --> P[Feature pipeline]
  P --> O[(Offline historical store)]
  P --> N[(Online low-latency store)]
  O --> T[Training dataset]
  N --> I[Online inference]`;

export function VectorSearchLessonContent() { return <>
  <LessonHeading level={2} id="similarity-retrieval">Retrieve candidates whose embeddings are similar</LessonHeading><p>Semantic search, recommendation retrieval, RAG, and image/audio similarity can represent items and queries as vectors. The index returns nearest candidates under a selected distance/similarity behavior; it does not determine factual correctness.</p><MermaidDiagram chart={vector} title="Embedding generation and vector retrieval paths" description="Documents and queries pass through an embedding model; the query searches a vector index, producing candidates for optional reranking." /><TradeoffTable><table><thead><tr><th>Exact nearest neighbor</th><th>Approximate nearest neighbor</th></tr></thead><tbody><tr><td>Compares enough vectors to preserve exact result semantics</td><td>Trades some recall for lower search cost and latency</td></tr><tr><td>Expensive at huge scale</td><td>Requires index tuning and recall measurement</td></tr></tbody></table></TradeoffTable><p>HNSW and IVF are example ANN families, not required base-level internals. Keep authoritative metadata in a primary database or document store and join/filter it with the vector index where needed.</p><CommonMistakes><ul><li>Claiming ANN is exact.</li><li>Calling similar vectors “correct answers.”</li><li>Replacing transactional storage with a vector index by default.</li></ul></CommonMistakes><SpecializedLessonEnd id="vector-search" practice={["vector-search", "recommendation-system"]}>Vector search retrieves similar embeddings. Approximate indexes trade recall for speed and normally complement authoritative metadata storage.</SpecializedLessonEnd>
  </>; }

export function EmbeddingsInfrastructureLessonContent() { return <>
  <LessonHeading level={2} id="model-is-data-version">The embedding model is part of the data contract</LessonHeading><p>Documents can be embedded offline in batch; queries usually need an online embedding before retrieval. Store the model/version with vectors because a model change can make new query vectors incompatible with the old index.</p><MermaidDiagram chart={embeddings} title="Versioned re-embedding and index replacement" description="Documents are embedded into a model-v17 index; model v18 triggers a re-embedding pipeline and a new index used by online queries." /><p>Re-embedding may require scanning the corpus, controlling cost, rebuilding an index, validating recall, and switching traffic. The embedding service adds latency and can fail, so define timeouts, fallback, caching where semantically safe, and rollout compatibility.</p><SpecializedLessonEnd id="embeddings-infrastructure" practice={["vector-search", "embedding-pipeline"]}>Embeddings are versioned derived data. Plan offline generation, online query latency, re-embedding, index rebuild, compatibility, and cost.</SpecializedLessonEnd>
  </>; }

export function ModelServingLessonContent() { return <>
  <LessonHeading level={2} id="serve-not-train">Model serving is a latency and capacity system</LessonHeading><p>Online inference returns a prediction inside the request budget—for example fraud scoring. Async inference accepts a job and publishes a result later—for example document processing. Training is outside this lesson.</p><MermaidDiagram chart={serving} title="Online and asynchronous model serving" description="Online requests are load balanced across versioned inference servers using compute accelerators, while asynchronous jobs use a queue and batch workers." /><p>Capacity depends on model size, load time, CPU/GPU memory, request shapes, batching, and latency targets; avoid invented throughput constants. Dynamic batching can improve accelerator utilization but waits to form a batch, so it can increase individual request latency.</p><p>Version routes enable canary evaluation and rollback. Record latency, errors, saturation, and product-quality metrics by version. Autoscaling must account for expensive startup and loaded-model capacity, not request count alone.</p><InterviewFollowUps><ul><li>What happens while a model loads?</li><li>How is traffic split and rolled back?</li><li>What fallback is safe when inference times out?</li><li>Can the product accept async completion?</li></ul></InterviewFollowUps><SpecializedLessonEnd id="model-serving" practice={["ml-inference-service", "model-serving-platform"]}>Model serving balances latency, throughput, compute, batching, loading, scaling, and safe version rollout. Batching improves utilization at a latency trade-off.</SpecializedLessonEnd>
  </>; }

export function FeatureStoresLessonContent() { return <>
  <LessonHeading level={2} id="training-serving-consistency">Prevent accidental differences between training and serving features</LessonHeading><p>A training job may compute “purchases in the previous 30 days” differently from the online service. A feature-store architecture can centralize definitions and provide historical, point-in-time-correct training retrieval plus low-latency online values.</p><MermaidDiagram chart={featureStore} title="Feature pipeline feeding offline and online stores" description="Raw data enters a feature pipeline that writes historical offline features for training and current online features for inference." /><TradeoffTable><table><thead><tr><th>Offline access</th><th>Online access</th></tr></thead><tbody><tr><td>Historical scans and training datasets</td><td>Low-latency current lookup</td></tr><tr><td>Point-in-time correctness prevents future leakage</td><td>Freshness and availability affect predictions</td></tr></tbody></table></TradeoffTable><p>This adds pipelines, materialization, ownership, freshness monitoring, and another store. A small ML system with simple features may not need it.</p><SpecializedLessonEnd id="feature-stores" practice={["feature-store", "ml-inference-service"]}>A feature store addresses reusable definitions, historical training access, and low-latency online retrieval. Its complexity is justified only by real training-serving consistency needs.</SpecializedLessonEnd>
  </>; }

export function ChoosingSpecializedBlocksLessonContent() { return <>
  <LessonHeading level={2} id="requirement-first">Introduce a specialized block only after the requirement creates its problem</LessonHeading><TradeoffTable><table><thead><tr><th>Requirement</th><th>Consider</th></tr></thead><tbody><tr><td>Keyword text retrieval</td><td>Inverted index / search engine</td></tr><tr><td>Ranked prefix suggestions</td><td>Trie/FST-style or precomputed autocomplete index</td></tr><tr><td>Nearby entities</td><td>Geohash or spatial index plus exact filtering</td></tr><tr><td>Scheduled execution</td><td>Scheduler, ready queue, idempotent workers</td></tr><tr><td>Top scores / hot counter</td><td>Ordered score structure / sharded aggregation</td></tr><tr><td>Web crawling / media</td><td>Frontier pipeline / derived-artifact jobs</td></tr><tr><td>Approximate membership / distinct / frequency</td><td>Bloom / HyperLogLog / Count-Min Sketch</td></tr><tr><td>Concurrent document editing</td><td>OT or CRDT family after defining semantics</td></tr><tr><td>Semantic similarity</td><td>Embedding pipeline and vector index</td></tr><tr><td>Low-latency predictions</td><td>Model serving; feature store only when justified</td></tr></tbody></table></TradeoffTable><LessonCallout variant="tradeoff"><p>These tools are reusable precisely because their trade-offs are specific. Naming one without the requirement, correctness boundary, scale pressure, and operational cost weakens an interview design.</p></LessonCallout><p>Continue into vendor-specific detail only when the prompt or role requires it. The unpublished Technology Deep Dives remain a separate phase.</p><SpecializedLessonEnd id="choosing-specialized-blocks" practice={["search-engine", "ride-sharing", "job-scheduler", "collaborative-editor", "ml-inference-service"]}>Choose specialized building blocks from a concrete access pattern or failure pressure. Start simple, then state the scale limit and trade-off that justifies the component.</SpecializedLessonEnd>
  </>; }
