import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { dataStorageSources } from "./sources";

const indexPath = `flowchart LR
  Q[WHERE email = ?] --> R[Sorted index]
  R --> K[email → row location]
  K --> T[(Users table row)]`;

const lostUpdate = `sequenceDiagram
  participant A as Buyer A
  participant D as Seat row: available = 1
  participant B as Buyer B
  A->>D: Read available = 1
  B->>D: Read available = 1
  A->>D: Write available = 0
  B->>D: Write available = 0
  Note over A,B: Both may believe they booked`;

export function DatabaseIndexesLessonContent() {
  return <>
    <LessonHeading level={2} id="one-query-needs-a-path">Two hundred million users, one login query</LessonHeading>
    <pre><code>{`SELECT id, password_hash
FROM users
WHERE email = ?;`}</code></pre>
    <p>Inspecting the whole table for every login is unacceptable. An index maintains extra data that gives this query a faster path to matching rows.</p>
    <MermaidDiagram chart={indexPath} title="Index-assisted lookup" description="A query searches a sorted email index, obtains the matching row location, and retrieves the users-table row instead of scanning the full table." />

    <LessonHeading level={2} id="btree-intuition">B-tree intuition: searchable order</LessonHeading>
    <p>A B-tree-style index keeps keys in a searchable order, supporting equality, range conditions, and ordered traversal. Interview depth means explaining why order helps—not implementing page splits or calculating exact disk operations.</p>

    <LessonHeading level={2} id="composite-order">A composite index serves a query shape</LessonHeading>
    <pre><code>{`CREATE INDEX messages_conversation_created
ON messages(conversation_id, created_at);

SELECT * FROM messages
WHERE conversation_id = ?
ORDER BY created_at DESC
LIMIT 50;`}</code></pre>
    <p>The leading conversation key narrows the data; creation time provides order within that conversation. <code>(created_at, conversation_id)</code> is not equivalent for every query. Exact prefix and ordering rules depend on the database and index type.</p>

    <LessonHeading level={2} id="selectivity-and-index-types">Selectivity and specialized paths</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Index</th><th>Purpose</th><th>Question</th></tr></thead><tbody><tr><td>Primary / unique</td><td>Identity or uniqueness</td><td>Which invariant is enforced?</td></tr><tr><td>Composite</td><td>Multi-column filter/order</td><td>Does column order match the query?</td></tr><tr><td>Partial</td><td>Only rows matching a predicate</td><td>Will the query imply that predicate?</td></tr><tr><td>Covering</td><td>Contains additional query columns</td><td>Is extra index size/write work justified?</td></tr><tr><td>Inverted</td><td>Terms or tokens to matching documents</td><td>Is this a search workload rather than ordered lookup?</td></tr></tbody></table></TradeoffTable>
    <p>An email is usually selective. <code>country = &apos;US&apos;</code> may match most rows in a mostly-US dataset, so scanning another access path may cost less than using that index.</p>
    <CommonMistakes><ul><li>Saying “add an index” without naming the query.</li><li>Ignoring slower writes, storage, maintenance, and write amplification.</li><li>Adding many overlapping indexes “just in case.”</li><li>Assuming an index will be used when the filter/order does not match it.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>What happens to write throughput as indexes increase?</li><li>Which composite column comes first?</li><li>Why might the database still scan?</li><li>When does full-text search need an inverted index?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["search-autocomplete", "chat-system", "ecommerce", "ticketmaster"]} />
    <FurtherReading items={dataStorageSources["database-indexes"]} />
    <RememberThis><p>Every index should exist for a query or constraint. It buys a faster access path by spending storage, write work, and operational attention.</p></RememberThis>
  </>;
}

export function TransactionsLessonContent() {
  return <>
    <LessonHeading level={2} id="protect-the-invariant">The goal is not ACID vocabulary; it is preserving an invariant</LessonHeading>
    <WorkedExample title="Transfer $100 without losing money">
      <pre><code>{`1. Debit Account A by $100
2. Credit Account B by $100`}</code></pre>
      <p>If only one change commits, total money changes incorrectly. A transaction makes the related state transition one correctness boundary.</p>
    </WorkedExample>
    <LessonHeading level={2} id="acid-as-tools">ACID as four design tools</LessonHeading>
    <dl><dt><strong>Atomicity</strong></dt><dd>All intended changes commit, or none do.</dd><dt><strong>Consistency</strong></dt><dd>The transaction preserves declared database and application invariants.</dd><dt><strong>Isolation</strong></dt><dd>Concurrent work does not produce a forbidden logical outcome under the chosen guarantee.</dd><dt><strong>Durability</strong></dt><dd>A committed outcome survives the failures covered by the storage system&apos;s guarantee.</dd></dl>
    <LessonCallout variant="important"><p>ACID consistency means preserving invariants through a transaction. Distributed consistency models describe what reads can observe across copies or time. They are different uses of the word.</p></LessonCallout>
    <LessonHeading level={2} id="transaction-boundary">Keep the boundary aligned with the business rule</LessonHeading>
    <p>An order and its inventory reservation may need coordinated correctness, while an analytics event can arrive later. Larger transactions hold resources longer and can increase contention. Across independent services or shards, coordination becomes harder; later lessons cover <Link href="/system-design/patterns/distributed-transactions">distributed transactions</Link> and <Link href="/system-design/patterns/saga-pattern">Saga</Link> patterns.</p>
    <PracticeConnections ids={["payment-system", "ticketmaster", "inventory-system", "digital-wallet"]} />
    <FurtherReading items={dataStorageSources.transactions} />
    <RememberThis><p>Transactions protect business invariants across related changes. Define what must be atomic, what concurrent outcomes are forbidden, and what durability guarantee the operation needs.</p></RememberThis>
  </>;
}

export function IsolationConcurrencyLessonContent() {
  return <>
    <LessonHeading level={2} id="concurrency-changes-outcomes">Correct code can fail when two copies run together</LessonHeading>
    <MermaidDiagram chart={lostUpdate} title="Lost update during seat booking" description="Two buyers read one available seat, both write zero remaining, and both may believe they booked because their read-modify-write operations were not coordinated." />
    <p>A single-threaded reading of each request looks correct. The interleaving violates the invariant that one seat can be sold once.</p>

    <LessonHeading level={2} id="anomalies">Name the observable failure</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Anomaly</th><th>Concrete behavior</th></tr></thead><tbody><tr><td>Dirty read</td><td>Read data another transaction has not committed.</td></tr><tr><td>Non-repeatable read</td><td>Read one row twice and observe different committed values.</td></tr><tr><td>Phantom read</td><td>Repeat a predicate query and observe new matching rows.</td></tr><tr><td>Lost update</td><td>Two writers derive updates from old state and one overwrites the other.</td></tr></tbody></table></TradeoffTable>
    <p>Actual behavior and isolation-level names vary by database. State the forbidden outcome and verify the chosen system&apos;s guarantee rather than relying only on a label.</p>

    <LessonHeading level={2} id="optimistic-vs-pessimistic">Optimistic and pessimistic coordination</LessonHeading>
    <pre><code>{`UPDATE seats
SET status = 'booked', version = 8
WHERE id = 42 AND version = 7 AND status = 'available';`}</code></pre>
    <p>Optimistic concurrency assumes conflicts are uncommon and makes the update conditional; zero affected rows means retry or report a conflict. Pessimistic concurrency locks the resource before changing it, reducing conflicting work but introducing waiting, deadlocks, and contention.</p>
    <p>Serializable transactions can provide behavior equivalent to some serial ordering, with system-specific retry and performance costs. A single atomic conditional update may be the simpler answer for one seat row.</p>
    <InterviewFollowUps><ul><li>What if 10,000 users want one seat?</li><li>How is a failed conditional update surfaced?</li><li>What does the lock cover and for how long?</li><li>Which operations can safely occur outside the transaction?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["ticketmaster", "payment-system", "inventory-system", "shopping-cart"]} />
    <FurtherReading items={dataStorageSources["isolation-levels"]} />
    <RememberThis><p>Describe the concurrent interleaving that breaks the invariant. Then choose a conditional update, lock, or isolation guarantee that prevents that outcome with acceptable contention.</p></RememberThis>
  </>;
}

export function DenormalizationLessonContent() {
  return <>
    <LessonHeading level={2} id="duplicate-for-a-hot-read">Duplicate selected data when a hot read earns it</LessonHeading>
    <p>Rendering each feed item by repeatedly joining a post, author, and media record can make a high-volume read path expensive. A feed entry might copy the author display name and thumbnail needed for rendering.</p>
    <TradeoffTable><table><thead><tr><th>Benefit</th><th>Cost</th></tr></thead><tbody><tr><td>Fewer joins or cross-service calls</td><td>Duplicate bytes</td></tr><tr><td>Simpler, faster reads</td><td>More complex writes and backfills</td></tr><tr><td>Read shape matches product response</td><td>Copies can become stale</td></tr></tbody></table></TradeoffTable>
    <LessonHeading level={2} id="choose-staleness-policy">Duplication needs an update policy</LessonHeading>
    <p>Decide whether existing feed entries update when an author changes their name, update asynchronously, or intentionally remain a historical snapshot. Versioning, events, background repair, or recomputation can each be reasonable depending on the product guarantee.</p>
    <LessonCallout variant="tradeoff"><p>Normalization and denormalization form a continuum. Duplicate the smallest stable projection that materially improves a measured access pattern.</p></LessonCallout>
    <PracticeConnections ids={["news-feed", "ecommerce", "recommendation-system"]} />
    <FurtherReading items={dataStorageSources.denormalization} />
    <RememberThis><p>Denormalization spends write complexity and freshness to buy a simpler read. Name the hot query, duplicated fields, source of truth, propagation path, and acceptable staleness.</p></RememberThis>
  </>;
}
