import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, WorkedExample } from "@/components/system-design-article";
import { foundationSources } from "./sources";

const interviewFlow = `flowchart TD
  A[Clarify requirements] --> B[Estimate scale]
  B --> C[Define APIs and data]
  C --> D[High-level design]
  D --> E[Walk critical flows]
  E --> F[Find bottlenecks]
  F --> G[Deep dive]
  G --> H[Failures and trade-offs]
  H --> I[Summarize]`;

export function InterviewFrameworkLessonContent() {
  return <>
    <LessonHeading level={2} id="what-the-interview-tests">The interview is not a box-drawing contest</LessonHeading>
    <p>A strong candidate can turn an ambiguous prompt into a scoped design, explain why each major component exists, and adapt when a requirement changes. The boxes matter only because they make that reasoning visible.</p>
    <p>Interviewers are watching how you handle ambiguity, identify scale, decompose a problem, find bottlenecks, reason about failure, and defend trade-offs. A polished diagram without those habits is a weak design.</p>
    <MermaidDiagram chart={interviewFlow} title="A reusable System Design interview flow" description="Progress from requirements to scale, interfaces and data, a high-level design, critical flows, bottlenecks, a focused deep dive, failures and trade-offs, then a concise summary. The point is to begin with the problem rather than infrastructure components." />

    <LessonHeading level={2} id="clarify-the-problem">1. Clarify the problem</LessonHeading>
    <p>Ask enough questions to know what you are building. Identify the users, primary use cases, explicit exclusions, read/write shape, real-time expectations, geography, consistency, latency, availability, and cost constraints. You do not need to interrogate every possibility; you need the answers that change the design.</p>
    <WorkedExample title="Start a URL shortener with scope, not products">
      <p>A poor start is to draw Redis, Kafka, Cassandra, and Kubernetes. A better start is to agree that the system must create short URLs and redirect them, then ask whether it needs custom aliases, expiration, analytics, expected traffic, a latency objective, and a particular availability target.</p>
      <p>Analytics may justify an asynchronous event path. Expiring links need lifecycle cleanup. Heavy redirect traffic makes the read path the first scaling concern. Those are architecture consequences of requirements.</p>
    </WorkedExample>

    <LessonHeading level={2} id="assume-and-estimate">2. State assumptions, then estimate only useful scale</LessonHeading>
    <p>Say your assumptions aloud: “Assume 100 million redirects and 10 million new URLs per day.” They need to be reasonable enough to test the design, not predictions accurate to three decimal places.</p>
    <p>Estimate traffic, storage, bandwidth, and the read/write ratio only when the result can change a choice. The dedicated <Link href="/system-design/start-here/capacity-estimation">Capacity Estimation lesson</Link> shows the arithmetic.</p>
    <LessonCallout variant="interview-tip"><p>Time-box estimation. If a number will not influence capacity, partitioning, delivery, or cost, state an assumption and move on.</p></LessonCallout>

    <LessonHeading level={2} id="define-boundary-and-data">3. Define the boundary, API, and core data</LessonHeading>
    <p>A small interface forces precision about inputs, outputs, entities, and read/write paths. For the URL shortener, the boundary might begin as:</p>
    <pre><code>{`POST /urls
GET /{shortCode}`}</code></pre>
    <p>The first endpoint creates a mapping; the second resolves one. That immediately raises useful questions about duplicate requests, authorization for creation, and the latency of redirects.</p>
    <pre><code>{`ShortURL
--------
short_code
original_url
created_at
expires_at
user_id`}</code></pre>
    <p>Choose the model from the access patterns. The redirect path needs a lookup by <code>short_code</code>; that matters before a database brand does.</p>

    <LessonHeading level={2} id="simplest-design">4. Draw the simplest viable architecture</LessonHeading>
    <pre><code>{`Client → Load balancer → URL service → Database`}</code></pre>
    <blockquote>Start with the architecture that satisfies the requirements. Scale the part that actually needs scaling.</blockquote>
    <p>Do not add a cache, queue, shards, or replicas until the current design reveals a requirement or bottleneck that needs one. A simple baseline gives every later component a reason to exist.</p>

    <LessonHeading level={2} id="walk-critical-flows">5. Walk the critical flows</LessonHeading>
    <h3>Write path</h3>
    <p>The client submits a URL, the service validates it, assigns a short code, persists the mapping, and returns the result. Walking that path exposes duplicate submissions, uniqueness, and acknowledgement questions.</p>
    <h3>Read path</h3>
    <p>The redirect request reaches the service, loads the mapping, and returns a redirect. This reveals the high-volume database read and the user-visible latency path.</p>

    <LessonHeading level={2} id="bottlenecks-and-depth">6. Find bottlenecks and choose depth</LessonHeading>
    <p>For this prompt, redirect volume, database reads, hot links, ID generation, dataset growth, and regional latency are plausible pressure points. Improve the design in response: repeated reads may justify caching, growing ownership may justify partitioning, and global users may justify regional or edge delivery.</p>
    <p>Interviewers normally prefer depth in a few consequential areas over shallow coverage of every tool. Follow the prompt toward cache strategy, partitioning, ID generation, consistency, failover, or another area that can break the design.</p>

    <LessonHeading level={2} id="failures-and-tradeoffs">7. Discuss failures and trade-offs</LessonHeading>
    <p>For each important component, ask what happens when it is slow, unavailable, or returning stale data. Consider a cache outage, database failover, crashed consumer, unavailable region, and timed-out dependency. Then describe both mitigation and remaining risk.</p>
    <ul>
      <li>Caching can lower latency, but introduces invalidation and stale-data behavior.</li>
      <li>Asynchronous work can shorten the request path, but moves correctness into retries, ordering, and eventual completion.</li>
      <li>Replication can improve availability, but introduces lag, failover behavior, and cost.</li>
      <li>Partitioning can increase capacity, but complicates cross-partition queries and rebalancing.</li>
    </ul>

    <LessonHeading level={2} id="summarize">8. Close with a design summary</LessonHeading>
    <p>Spend the last minute naming the requirements satisfied, expected scale, main decisions, largest trade-offs, and known limitations. The summary shows that the design is one coherent answer rather than a collection of boxes.</p>

    <CommonMistakes><ul>
      <li><strong>Solution-first design:</strong> naming infrastructure before understanding requirements.</li>
      <li><strong>Premature optimization:</strong> partitioning before showing that one database is insufficient.</li>
      <li><strong>Technology-name dropping:</strong> naming a tool without the problem it solves.</li>
      <li><strong>Ignoring request paths:</strong> drawing components without walking one real request.</li>
      <li><strong>No failure analysis or trade-offs:</strong> assuming every dependency is healthy and every choice is free.</li>
      <li><strong>Over-estimating:</strong> spending ten minutes on arithmetic that changes nothing.</li>
      <li><strong>Designing everything:</strong> letting secondary features consume the interview.</li>
    </ul></CommonMistakes>

    <InterviewFollowUps><ul>
      <li>What becomes the first bottleneck as traffic grows?</li><li>What happens if the cache fails?</li><li>How would you support multiple regions?</li><li>What happens during a database failover?</li><li>Which operations need strong consistency?</li><li>What can be eventually consistent?</li><li>How does the design change at 100× traffic?</li><li>Which component would you monitor most closely?</li>
    </ul></InterviewFollowUps>
    <PracticeConnections ids={["url-shortener", "news-feed", "chat-system", "payment-system"]} />
    <FurtherReading items={foundationSources["interview-framework"]} />
    <RememberThis><p>Start with requirements, not technologies. Build the simplest design that satisfies them, walk the important flows, identify what breaks at scale, and explain the trade-offs of fixing it.</p></RememberThis>
  </>;
}
