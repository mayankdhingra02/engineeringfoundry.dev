import { CapacityCalculator } from "@/components/capacity-calculator";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { AssumptionBox, CommonMistakes, FormulaBlock, FurtherReading, PracticeConnections, RememberThis, WorkedExample } from "@/components/system-design-article";
import { foundationSources } from "./sources";

export function EstimationLessonContent() {
  return <>
    <LessonHeading level={2} id="estimate-with-a-purpose">Estimate only what can change the design</LessonHeading>
    <p>Interview estimation is a decision tool. It can tell you whether one service is plausible, whether storage dominates the system, whether an origin survives cache misses, or whether bandwidth changes delivery. It is not a memory test for arbitrary scale tables.</p>
    <LessonCallout variant="interview-tip"><p>State assumptions, round aggressively, show units, and end each useful calculation with: “Does this change our design?”</p></LessonCallout>

    <LessonHeading level={2} id="traffic">Traffic: average is a baseline, peak sizes the path</LessonHeading>
    <FormulaBlock title="Average request rate">{`Average RPS = requests per day ÷ 86,400`}</FormulaBlock>
    <WorkedExample title="From daily users to peak reads">
      <AssumptionBox><pre><code>{`100M daily active users
10 reads/user/day
5× peak multiplier`}</code></pre></AssumptionBox>
      <pre><code>{`100M × 10 = 1B reads/day
1B ÷ 86,400 ≈ 11,600 reads/sec average
11,600 × 5 ≈ 58K peak RPS`}</code></pre>
      <p>The 5× factor is an assumption for this example, not a universal rule. Peak traffic is more useful than the daily average when checking whether the request path has enough capacity.</p>
    </WorkedExample>
    <CapacityCalculator />

    <LessonHeading level={2} id="read-write-ratio">Read/write ratio: identify where pressure lands</LessonHeading>
    <pre><code>{`100M reads/day ÷ 10M writes/day ≈ 10:1`}</code></pre>
    <p>A 10:1 ratio asks whether the read path would benefit from reusable results or additional read capacity, while the write path may remain the correctness bottleneck. The number does not automatically justify a cache or read replicas.</p>

    <LessonHeading level={2} id="storage">Storage: include time, then challenge the overheads</LessonHeading>
    <WorkedExample title="One year of media objects">
      <AssumptionBox><pre><code>{`10M new objects/day
2 MB average object size
365-day retention`}</code></pre></AssumptionBox>
      <pre><code>{`10M × 2 MB ≈ 20 TB/day
20 TB × 365 ≈ 7.3 PB/year`}</code></pre>
      <p>That is raw object data using decimal units. A real plan must ask about metadata, indexes, compression, retention, deletion, backups, and the storage system&apos;s replication or coding model. Do not blindly multiply by a replication factor.</p>
    </WorkedExample>

    <LessonHeading level={2} id="bandwidth">Bandwidth: payload size can dominate request count</LessonHeading>
    <WorkedExample title="Outbound media traffic">
      <AssumptionBox><pre><code>{`50K responses/sec
500 KB average response`}</code></pre></AssumptionBox>
      <pre><code>{`50,000 × 500 KB ≈ 25 GB/sec outbound`}</code></pre>
      <p>Large payloads make media systems bandwidth-heavy even when request handling is straightforward. This is where content delivery and geographically distributed serving can materially change origin load and user latency.</p>
    </WorkedExample>

    <LessonHeading level={2} id="cache-sizing">Cache sizing: raw values are only the start</LessonHeading>
    <WorkedExample title="A frequently accessed object set">
      <AssumptionBox><pre><code>{`20M objects
1 KB raw value/object`}</code></pre></AssumptionBox>
      <pre><code>{`20M × 1 KB ≈ 20 GB raw data`}</code></pre>
      <p>Keys, metadata, data structures, allocator fragmentation, replication, and operational headroom all consume capacity. This result does not mean a 20 GB cache instance is sufficient.</p>
    </WorkedExample>

    <LessonHeading level={2} id="cache-hit-rate">Cache hit rate: estimate the failure cliff</LessonHeading>
    <pre><code>{`100K requests/sec × 5% miss rate ≈ 5K requests/sec to storage`}</code></pre>
    <p>At a 95% hit rate, the backing store sees roughly 5K RPS. If the cache disappears, can it survive the jump toward 100K? The useful result is not the hit-rate percentage; it is the failure question the number exposes.</p>

    <LessonHeading level={2} id="concurrency">Concurrency: rate multiplied by time</LessonHeading>
    <FormulaBlock title="Little's Law intuition for an interview">{`Concurrent operations ≈ arrival rate × average operation duration`}</FormulaBlock>
    <pre><code>{`20K requests/sec × 0.2 sec ≈ 4,000 concurrent requests`}</code></pre>
    <p>If requests arrive at 20K per second and each remains active for about 200 ms, roughly 4K are in flight at once. This can expose connection, worker, and memory pressure without turning the discussion into queueing theory.</p>

    <LessonHeading level={2} id="cheat-sheet">Compact estimation cheat sheet</LessonHeading>
    <FormulaBlock title="Approximate interview calculations">{`1 day = 86,400 seconds

Average RPS = requests/day ÷ 86,400
Storage = new objects × average size × retention
Bandwidth = requests/sec × average payload size
Cache backend load = total request rate × cache miss rate
Approx. concurrency = arrival rate × operation duration`}</FormulaBlock>

    <CommonMistakes><ul>
      <li><strong>False precision:</strong> prefer <code>~60K RPS</code> to <code>57,823.43 RPS</code>.</li>
      <li><strong>Estimating everything:</strong> skip storage arithmetic when storage cannot affect the answer.</li>
      <li><strong>Ignoring peaks:</strong> averages hide burst and provisioning requirements.</li>
      <li><strong>Disconnected numbers:</strong> every meaningful result should test an architecture choice.</li>
      <li><strong>Assumptions presented as facts:</strong> label traffic, peak, size, and retention inputs.</li>
    </ul></CommonMistakes>
    <PracticeConnections ids={["url-shortener", "video-streaming", "news-feed", "cloud-file-storage"]} />
    <FurtherReading items={foundationSources.estimation} />
    <RememberThis><p>Estimate only what influences the design. State assumptions, round aggressively, consider peak traffic, and connect every calculation to an architectural decision.</p></RememberThis>
  </>;
}
