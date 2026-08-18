import { BloomFilterDemo } from "@/components/bloom-filter-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { SpecializedLessonEnd } from "./shared";

const collaboration = `flowchart TD
  A[Client A] --> C[Collaboration service]
  B[Client B] --> C
  C --> L[(Operation / document log)]
  L --> S[(Snapshots + persistent storage)]
  C --> A
  C --> B`;
const otSequence = `sequenceDiagram
  participant A as Client A
  participant S as Collaboration server
  participant B as Client B
  A->>S: insert "s" at position 0
  B->>S: insert "!" at position 3
  Note over S: order and transform concurrent operations
  S-->>A: transformed remote operation
  S-->>B: transformed remote operation`;

export function BloomFiltersLessonContent() { return <>
  <LessonHeading level={2} id="cheap-negative">Avoid an expensive lookup when the answer is definitely no</LessonHeading><p>A crawler has billions of known URLs. An exact membership set may be too large to keep in fast memory, so a Bloom filter hashes inserted items into a compact bit array.</p><BloomFilterDemo /><TradeoffTable><table><thead><tr><th>Result</th><th>Meaning</th></tr></thead><tbody><tr><td>Definitely not present</td><td>At least one checked bit is unset</td></tr><tr><td>Possibly present</td><td>All bits are set; verify because collisions can cause a false positive</td></tr></tbody></table></TradeoffTable><p>With a correctly implemented filter under its stated insertion assumptions, inserted items are not reported absent. Deletion, resizing, or implementation variants require their own contracts. Never use a Bloom filter alone where exact membership is required.</p><SpecializedLessonEnd id="bloom-filters" practice={["web-crawler", "distributed-cache"]}>A Bloom filter trades false positives for compact membership hints. It can prove absence under its assumptions, but a positive answer only means “possibly present.”</SpecializedLessonEnd>
  </>; }

export function HyperLogLogLessonContent() { return <>
  <LessonHeading level={2} id="distinct-not-members">Estimate how many distinct items exist</LessonHeading><p>Counting daily unique users exactly requires remembering which user IDs have appeared. HyperLogLog keeps a compact probabilistic summary and estimates cardinality without preserving exact membership.</p><p>It fits unique visitors, IPs, or search queries when bounded statistical error is acceptable. It does not answer whether a specific user appeared and should not determine exact billing or correctness-critical limits. Error and memory are implementation/configuration properties rather than universal constants.</p><SpecializedLessonEnd id="hyperloglog" practice={["metrics-platform", "event-analytics"]}>HyperLogLog estimates distinct count with compact memory. It does not retain members and is inappropriate when exact cardinality is an invariant.</SpecializedLessonEnd>
  </>; }

export function CountMinSketchLessonContent() { return <>
  <LessonHeading level={2} id="frequency-in-a-stream">Estimate item frequency with bounded memory</LessonHeading><p>A query stream contains too many distinct terms for an exact counter per term. Count-Min Sketch updates several hashed counters and estimates an item&apos;s frequency from them. Hash collisions can make the estimate too high rather than exact.</p><p>It can support trending-query candidates or heavy-hitter detection when follow-up verification is possible. It should not replace an exact ledger, quota, or inventory count.</p><TradeoffTable><table><thead><tr><th>Structure</th><th>Question</th></tr></thead><tbody><tr><td>Bloom filter</td><td>Have I probably seen this item?</td></tr><tr><td>HyperLogLog</td><td>Approximately how many distinct items exist?</td></tr><tr><td>Count-Min Sketch</td><td>Approximately how often has this item appeared?</td></tr></tbody></table></TradeoffTable><SpecializedLessonEnd id="count-min-sketch" practice={["event-analytics", "metrics-platform", "search-autocomplete"]}>Count-Min Sketch estimates per-item frequency with compact memory and possible overestimation. Verify heavy hitters when exact decisions matter.</SpecializedLessonEnd>
  </>; }

export function CollaborativeEditingLessonContent() { return <>
  <LessonHeading level={2} id="concurrent-intent">Last-write-wins can erase another user&apos;s edit</LessonHeading><WorkedExample title="Two concurrent inserts"><pre><code>{`Initial: cat
User A inserts "s" at start → scat
User B inserts "!" at end   → cat!`}</code></pre><p>When both edit from the same version, applying raw character positions in different orders can diverge or misplace intent. The system needs operation identity, version context, reconnect behavior, and a chosen convergence model.</p></WorkedExample><MermaidDiagram chart={collaboration} title="Collaborative editing service and durable operation history" description="Two clients maintain persistent connections to a collaboration service backed by an operation or document log and snapshots." /><p>Presence is ephemeral, while document operations and snapshots need durable recovery. OT and CRDTs are solution families; knowing why concurrency is hard matters more for a general interview than implementing either algorithm.</p><SpecializedLessonEnd id="collaborative-editing" practice={["collaborative-editor", "collaborative-app"]}>Collaborative editing combines low-latency local work, concurrent operations, reconnect, durable history, and convergence. Last-write-wins on the whole document loses edits.</SpecializedLessonEnd>
  </>; }

export function OperationalTransformationLessonContent() { return <>
  <LessonHeading level={2} id="transform-operations">Transform concurrent operations against their context</LessonHeading><p>Operational Transformation systems exchange operations rather than entire documents. A coordinating order and transformation functions adjust concurrent operations relative to one another before clients apply them.</p><MermaidDiagram chart={otSequence} title="Conceptual OT coordination" description="Two clients send concurrent inserts to a collaboration server, which orders and transforms them before returning adjusted operations." /><p>Convergence is not the only product requirement: transformed results should preserve sensible user intent. Correct transformation functions, version context, undo, reconnect, and rich document structure make implementation specialized and difficult.</p><SpecializedLessonEnd id="operational-transformation" practice={["collaborative-editor"]}>OT is a family of coordination and transformation techniques for concurrent operations. Interview intuition is enough unless the role or prompt demands algorithm detail.</SpecializedLessonEnd>
  </>; }

export function CrdtsLessonContent() { return <>
  <LessonHeading level={2} id="rules-for-convergence">Convergence comes from the replicated data type&apos;s rules</LessonHeading><p>CRDTs define state or operations so replicas that receive the relevant updates can converge under the data type&apos;s assumptions. Counters, sets, and collaborative sequences can have CRDT designs, each with explicit concurrent-update semantics.</p><TradeoffTable><table><thead><tr><th>OT family</th><th>CRDT family</th></tr></thead><tbody><tr><td>Transforms operations relative to ordered context</td><td>Encodes merge/commutativity rules in replicated state or operations</td></tr><tr><td>Often coordination-centered</td><td>Can accept local updates under its model</td></tr></tbody></table></TradeoffTable><p>CRDTs do not remove product conflict semantics, tombstone/metadata growth, network cost, authorization, or persistence design. “Conflict-free” refers to convergence properties, not absence of difficult product decisions.</p><CommonMistakes><ul><li>Adding a CRDT merely because users collaborate.</li><li>Claiming any arbitrary object can merge automatically.</li><li>Ignoring metadata cleanup and offline history.</li></ul></CommonMistakes><SpecializedLessonEnd id="crdts" practice={["collaborative-editor", "collaborative-app"]}>CRDTs are replicated data types with rules that guarantee convergence under defined assumptions. They do not make application-level conflict semantics disappear.</SpecializedLessonEnd>
  </>; }
