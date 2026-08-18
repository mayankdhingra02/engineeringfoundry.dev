import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { dataStorageSources } from "./sources";

const objectArchitecture = `flowchart LR
  C[Client] -->|metadata operations| A[Application API]
  A --> D[(Metadata database)]
  C -->|object bytes| O[(Object storage)]
  A -. issues authorized URL .-> C
  O --> E[CDN / processing]`;

const uploadSequence = `sequenceDiagram
  participant C as Client
  participant A as API
  participant D as Metadata DB
  participant O as Object store
  participant W as Processing worker
  C->>A: Start upload
  A->>D: Create pending upload
  A-->>C: Signed part URLs
  C->>O: Upload parts directly
  C->>A: Complete upload
  A->>D: Mark uploaded
  O-->>W: Object-created event`;

export function UniqueIdGenerationLessonContent() {
  return <>
    <LessonHeading level={2} id="identity-without-one-writer">Distributed writers still need unique identities</LessonHeading>
    <p>A single database sequence is wonderfully simple. When many regions or shards must generate IDs independently, the design must trade central coordination against size, ordering, index locality, clock behavior, and collision risk.</p>
    <TradeoffTable><table><thead><tr><th>Strategy</th><th>Strength</th><th>Trade-off</th></tr></thead><tbody><tr><td>Database sequence</td><td>Simple, ordered, constraint-backed</td><td>Central dependency or allocation coordination</td></tr><tr><td>UUID-style</td><td>Decentralized, huge space</td><td>Larger keys; ordering/locality depends on version and representation</td></tr><tr><td>Random short ID</td><td>Compact public identifier</td><td>Collision probability, retry/check strategy</td></tr><tr><td>Snowflake-style</td><td>Distributed and roughly time ordered</td><td>Clock, node identity, per-tick sequence capacity</td></tr></tbody></table></TradeoffTable>

    <LessonHeading level={2} id="snowflake-fields">Snowflake-style IDs combine locally available fields</LessonHeading>
    <figure className="sd-formula"><figcaption>Conceptual layout—not one vendor&apos;s bit allocation</figcaption><pre><code>{`┌──────────── timestamp ────────────┬── node ──┬─ sequence ─┐
│ rough time ordering              │ writer   │ same-tick  │
└──────────────────────────────────┴───────────┴────────────┘`}</code></pre></figure>
    <p>The node field prevents writers from sharing the same sequence space; the sequence handles multiple IDs in one time bucket. Plan for clock rollback, duplicate node IDs, and sequence exhaustion. Exposed structure can leak approximate time or traffic information.</p>
    <LessonCallout variant="tradeoff"><p>Do not demand globally gapless ordering unless the product truly needs it. Gaps and rough ordering are often acceptable; strict global order requires coordination.</p></LessonCallout>
    <PracticeConnections ids={["distributed-id-generator", "url-shortener", "key-value-store"]} />
    <FurtherReading items={dataStorageSources["unique-id-generation"]} />
    <RememberThis><p>Choose IDs from uniqueness scope, generation availability, ordering, size, index locality, collision handling, clocks, and information exposure—not fashion.</p></RememberThis>
  </>;
}

export function ObjectStorageLessonContent() {
  return <>
    <LessonHeading level={2} id="bytes-and-metadata-have-different-jobs">Separate bulk bytes from application metadata</LessonHeading>
    <p>A video, image, backup, document, or model artifact can be much larger than the row that describes its owner, status, permissions, and processing state. Object storage addresses bytes by an object key inside a bucket/container, while a database can keep queryable application metadata.</p>
    <MermaidDiagram chart={objectArchitecture} title="Object bytes and application metadata" description="A client uses the application API for metadata recorded in a database, transfers object bytes directly to object storage using authorized access, and objects can later feed a CDN or processing system." />

    <LessonHeading level={2} id="object-contract">The object contract</LessonHeading>
    <ul><li><strong>Key:</strong> stable object identity and namespace convention.</li><li><strong>Bytes:</strong> the payload, commonly accessed through HTTP APIs.</li><li><strong>Object metadata:</strong> storage-level attributes; keep product relationships in the application database when they require richer queries.</li><li><strong>Lifecycle:</strong> retention, archival, expiration, and legal/business deletion.</li><li><strong>Serving:</strong> authorization, signed access, range requests where supported, and CDN integration.</li></ul>
    <p>Durability, availability, consistency, size limits, lifecycle behavior, and cost vary by provider and configuration. Object storage is not universally cheaper, and database blobs are not universally wrong.</p>
    <LessonCallout variant="important"><p>Do not place durable user files only on an application server&apos;s local filesystem. Replicas, deployments, and failures make that machine an unstable ownership boundary.</p></LessonCallout>
    <InterviewFollowUps><ul><li>Where do ownership and permissions live?</li><li>How does a 20 GB upload work?</li><li>How are downloads served globally?</li><li>What expires, archives, or is deleted?</li><li>What happens if metadata commits but upload fails?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["cloud-file-storage", "video-streaming", "image-hosting", "object-storage-system"]} />
    <FurtherReading items={dataStorageSources["object-storage"]} />
    <RememberThis><p>Store large object bytes in object-oriented storage, keep queryable application metadata separately, define authorization and lifecycle, and avoid making application servers carry every byte.</p></RememberThis>
  </>;
}

export function LargeFileUploadsLessonContent() {
  return <>
    <LessonHeading level={2} id="proxying-every-byte">The API server should not become an expensive pipe</LessonHeading>
    <pre><code>{`Naive:
Client → API server → Object storage`}</code></pre>
    <p>Proxying a 20 GB upload consumes API bandwidth, ties up a long connection, and can create memory, disk, and timeout pressure. The application still authorizes and tracks the upload without necessarily carrying the bytes.</p>
    <MermaidDiagram chart={uploadSequence} title="Direct multipart upload" description="The client starts an upload through the API, which creates a metadata record and returns signed part URLs. The client uploads parts directly, completes through the API, and object creation can trigger processing." />

    <LessonHeading level={2} id="multipart-resume">Retry the failed part, not the entire file</LessonHeading>
    <p>Split the file into numbered parts, upload independently, record integrity information, and finalize only when required parts are present. Resuming needs an upload identifier and part inventory; completion should be safe to retry.</p>
    <WorkedExample title="Upload-state model">
      <pre><code>{`pending → uploading → uploaded → processing → ready
                   ↘ failed / expired`}</code></pre>
      <p>Track expected object key, owner, size/type limits, completed parts, checksum where appropriate, timestamps, and processing status. Abort or expire abandoned multipart uploads so unfinished parts do not accumulate forever.</p>
    </WorkedExample>
    <CommonMistakes><ul><li>Trusting a client-supplied filename as the storage key.</li><li>Returning an unrestricted or excessively long-lived upload credential.</li><li>Marking metadata ready before upload integrity and completion are established.</li><li>Making “complete upload” create duplicate processing jobs on retry.</li></ul></CommonMistakes>
    <InterviewFollowUps><ul><li>How does a 20 GB upload resume?</li><li>How are part checksums verified?</li><li>Who cleans abandoned uploads?</li><li>How is duplicate completion handled?</li><li>How is processing retried?</li></ul></InterviewFollowUps>
    <PracticeConnections ids={["cloud-file-storage", "video-streaming", "image-hosting"]} />
    <FurtherReading items={dataStorageSources["large-file-uploads"]} />
    <RememberThis><p>Authorize through the API, move bulk bytes directly to object storage, upload retryable parts, and keep an explicit metadata state machine for completion and processing.</p></RememberThis>
  </>;
}

export function TimeSeriesDatabasesLessonContent() {
  return <>
    <LessonHeading level={2} id="time-is-the-primary-query-axis">Measurements arrive by time and are read by time range</LessonHeading>
    <pre><code>{`timestamp | service | region  | metric_name | value
12:01:04  | checkout| us-east | cpu_percent | 72.4`}</code></pre>
    <p>The workload is often append-heavy, recent-data focused, and queried as “CPU utilization for checkout in us-east during the last hour.” Time partitioning, dimension/tag indexes, compression, and retention align with that pattern.</p>
    <LessonHeading level={2} id="retention-and-rollups">Raw resolution is not required forever</LessonHeading>
    <p>Keep second-level samples for a short operational window, then downsample into minute/hour aggregates and eventually expire or archive old raw data. The policy trades investigation detail against storage and query cost.</p>
    <TradeoffTable><table><thead><tr><th>Decision</th><th>Risk</th></tr></thead><tbody><tr><td>Time partition size</td><td>Too small creates metadata overhead; too large makes retention and scans expensive</td></tr><tr><td>Dimensions/tags</td><td>Unbounded cardinality can explode index/series count</td></tr><tr><td>Downsampling</td><td>Aggregates discard fine-grained evidence</td></tr><tr><td>Late data</td><td>Can require updating older windows</td></tr></tbody></table></TradeoffTable>
    <p>Infrastructure metrics, IoT telemetry, financial ticks, and application events share timestamped shapes but differ in correctness, latency, retention, and query requirements. A time-series product is not automatically the right primary database for each.</p>
    <PracticeConnections ids={["metrics-platform", "iot-ingestion", "event-analytics"]} />
    <FurtherReading items={dataStorageSources["time-series-databases"]} />
    <RememberThis><p>Time-series storage optimizes append-heavy measurements and time-range analysis. Define dimensions, cardinality, partition windows, retention, downsampling, and late-data behavior.</p></RememberThis>
  </>;
}
