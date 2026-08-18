import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, InterviewFollowUps, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { SpecializedLessonEnd } from "./shared";

const notifications = `flowchart TD
  E[Product event] --> N[Notification service]
  N --> P[Preference + template]
  P --> Q[(Channel queues)]
  Q --> Push[Push workers]
  Q --> Email[Email workers]
  Q --> SMS[SMS workers]
  Push --> R[Delivery results]
  Email --> R
  SMS --> R`;
const scheduler = `flowchart LR
  J[(Jobs database)] --> S[Scheduler ownership]
  S --> D[Due-job discovery]
  D --> Q[(Ready queue)]
  Q --> W[Workers]`;
const crawler = `flowchart TD
  Seeds[Seed URLs] --> F[(URL frontier)]
  F --> W[Fetch workers]
  W --> P[Parser]
  P --> D[(Document store)]
  P --> U[Extracted URLs]
  U --> B[Exact set / Bloom hint]
  B --> F`;
const media = `flowchart TD
  U[Upload] --> O[(Object storage)]
  O --> E[VideoUploaded event]
  E --> T[Transcoding]
  E --> H[Thumbnail]
  E --> M[Moderation]
  T --> R[(Renditions)]
  R --> C[CDN]`;

export function NotificationSystemsLessonContent() { return <>
  <LessonHeading level={2} id="channels-fail-differently">Separate channel policies and failures</LessonHeading><p>Push, email, SMS, and in-app delivery use different providers, limits, urgency, and product semantics. A notification service turns product events into preference-aware jobs, while independent channel workers isolate throughput and provider failures.</p><MermaidDiagram chart={notifications} title="Multi-channel notification delivery" description="A product event passes through preference and template selection into separate push, email, and SMS workers that record delivery results." /><pre><code>{`Notification
id · user_id · type · channel
template/payload · status · scheduled_at · created_at

UserNotificationPreference
user_id · notification_type · enabled_channels`}</code></pre><p>The schema is illustrative. Apply provider throttles, retry transient failures with backoff, make sends duplicate-safe where the provider contract allows, and stop after an expiry. A password-reset message whose token expired should not retry forever.</p><InterviewFollowUps><ul><li>Which channels are urgent versus best effort?</li><li>How are provider callbacks reconciled?</li><li>How are templates versioned and localized?</li><li>What protects one tenant from consuming the provider quota?</li></ul></InterviewFollowUps><SpecializedLessonEnd id="notification-delivery" practice={["notification-service", "chat-system", "ecommerce"]}>Notification delivery is a policy-aware, multi-channel queueing system. Preferences, provider limits, retries, deduplication, expiry, and status are first-class.</SpecializedLessonEnd>
  </>; }

export function JobSchedulersLessonContent() { return <>
  <LessonHeading level={2} id="when-ready">A scheduler decides when work becomes ready</LessonHeading><p>A queue answers “what can run now?” A scheduler also answers “when?” for a 9 AM notification, nightly report, delayed retry, or recurring cleanup.</p><MermaidDiagram chart={scheduler} title="Schedule storage separated from execution" description="A scheduler finds due jobs in a database and dispatches them to a ready queue consumed by workers." /><p>Small systems can query an index on <code>run_at</code>. Larger workloads may use time buckets, near-term queues, or timing-wheel ideas. No one mechanism is mandatory. Distributed ownership needs leases or another coordination mechanism, and downtime recovery must discover missed jobs.</p><LessonCallout variant="common-mistake"><p>The scheduler may dispatch more than once after a crash or ambiguous acknowledgement. Promise an exactly-once business effect only if the operation enforces the invariant—usually through idempotency or transactional state.</p></LessonCallout><InterviewFollowUps><ul><li>What does a recurring job mean across daylight-saving changes?</li><li>What if millions become due at once?</li><li>How does a replacement scheduler avoid duplicate dispatch?</li><li>How far behind may execution run?</li></ul></InterviewFollowUps><SpecializedLessonEnd id="job-schedulers" practice={["job-scheduler", "notification-service", "workflow-engine"]}>A scheduler makes work eligible at a time; a queue and workers execute it. Design for ownership failure, missed schedules, duplicates, and idempotent effects.</SpecializedLessonEnd>
  </>; }

export function LeaderboardsLessonContent() { return <>
  <LessonHeading level={2} id="ordered-scores">Maintain scores in an ordered structure</LessonHeading><p>Repeatedly sorting every player for every <code>top 100</code> request becomes expensive. An ordered <code>(score, user)</code> structure supports score updates, Top-K ranges, and a user&apos;s rank. Redis sorted sets are one implementation, not the architecture itself.</p><TradeoffTable><table><thead><tr><th>Leaderboard</th><th>Distinct access pattern</th></tr></thead><tbody><tr><td>Global</td><td>Huge shared ranking and write contention</td></tr><tr><td>Regional</td><td>Partition and rank within region</td></tr><tr><td>Friends</td><td>Social graph intersection plus score lookup</td></tr><tr><td>Daily/weekly</td><td>Versioned windows and expiry</td></tr></tbody></table></TradeoffTable><p>Ties need deterministic policy. Sharded global Top-K can merge each shard&apos;s candidates, while user rank across shards is harder. Approximate heavy-hitter structures belong only when exactness is not required.</p><SpecializedLessonEnd id="leaderboards" practice={["leaderboard"]}>Start from update, Top-K, individual-rank, scope, tie, and time-window requirements. A sorted structure is useful, but distribution changes the operations.</SpecializedLessonEnd>
  </>; }

export function DistributedCountersLessonContent() { return <>
  <LessonHeading level={2} id="hot-counter">One popular counter can become one hot key</LessonHeading><p><code>views = views + 1</code> concentrates millions of writes. If one store&apos;s atomic counter meets load and correctness requirements, keep it simple. Otherwise distribute increments across shards or local aggregators and combine them later.</p><WorkedExample title="Sharded video views"><AssumptionBox><pre><code>{`video:42:counter:0
...
video:42:counter:99`}</code></pre></AssumptionBox><FormulaBlock title="Read estimate">{`displayed views = SUM(100 counter shards)`}</FormulaBlock><p>Writes spread, but reads aggregate more keys and displayed values may lag. Batch local increments to reduce write traffic at the cost of freshness and potential loss unless buffering is durable.</p></WorkedExample><TradeoffTable><table><thead><tr><th>Exact requirement</th><th>Approximation may fit</th></tr></thead><tbody><tr><td>Bank balance, inventory invariant</td><td>Video views, social metrics, analytics</td></tr></tbody></table></TradeoffTable><SpecializedLessonEnd id="distributed-counters" practice={["video-streaming", "metrics-platform", "event-analytics"]}>Correctness decides whether a counter may be sharded, delayed, or approximate. Avoid turning one high-volume metric into a global write hotspot.</SpecializedLessonEnd>
  </>; }

export function WebCrawlersLessonContent() { return <>
  <LessonHeading level={2} id="expanding-frontier">A crawler is a continuously expanding work pipeline</LessonHeading><MermaidDiagram chart={crawler} title="Crawler frontier, fetch, parse, and deduplicate loop" description="Seeds enter a URL frontier; workers fetch and parse pages; documents are stored and newly extracted URLs pass through deduplication back into the frontier." /><p>The frontier owns priority, host grouping, schedule, retries, and freshness. Per-domain queues and rate limits prevent one site from dominating workers. Respect applicable robots directives and site policy rather than treating maximum fetch rate as the goal.</p><p>Normalize URLs carefully, use an exact set when exactness is required, or a Bloom filter as a memory-efficient hint where occasional false-positive skips are acceptable. Different URLs may return identical content, so content hashes can remove exact duplicates without pretending to solve near-duplicate similarity.</p><CommonMistakes><ul><li>One FIFO queue with no host politeness.</li><li>Retrying permanent failures indefinitely.</li><li>Assuming URL deduplication also deduplicates content.</li><li>Using a Bloom filter when missing a page is unacceptable.</li></ul></CommonMistakes><SpecializedLessonEnd id="web-crawling" practice={["web-crawler", "search-engine"]}>A crawler combines a frontier, fetchers, parsers, deduplication, priority, retry, freshness, and per-site politeness.</SpecializedLessonEnd>
  </>; }

export function MediaProcessingLessonContent() { return <>
  <LessonHeading level={2} id="derived-media">Uploads create an asynchronous dependency graph</LessonHeading><MermaidDiagram chart={media} title="Video upload processing fan-out" description="An uploaded object emits an event that independently triggers transcoding, thumbnails, and moderation; renditions are published behind a CDN." /><p>Transcoding may produce 360p, 720p, 1080p, and 4K renditions with different codecs or bitrates, but codec theory is not the interview goal. Track job state, input and output object IDs, version, retry count, segment dependencies, and finalization.</p><p>Where the format permits, split media into segments, retry failed segments independently, and publish only after required outputs complete. Thumbnails, moderation, and metadata extraction are separate subscribers so one optional path does not block all outputs.</p><p>Reuse the canonical <Link href="/system-design/fundamentals/file-uploads">Large File Uploads</Link>, <Link href="/system-design/fundamentals/pub-sub">Pub/Sub</Link>, and object-storage lessons rather than embedding upload bytes in a job queue.</p><SpecializedLessonEnd id="media-processing" practice={["video-streaming", "image-hosting", "cloud-file-storage"]}>Treat media outputs as derived, versioned artifacts produced by restartable asynchronous jobs. Isolate fan-out paths and publish only complete renditions.</SpecializedLessonEnd>
  </>; }
