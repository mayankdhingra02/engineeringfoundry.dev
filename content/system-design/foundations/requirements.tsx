import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { FurtherReading, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { foundationSources } from "./sources";

export function RequirementsLessonContent() {
  return <>
    <LessonHeading level={2} id="two-kinds-of-requirements">Features say what. System qualities shape how.</LessonHeading>
    <p>For a chat product, “send a message,” “receive a message,” and “load history” are functional requirements. “Deliver active-user messages quickly,” “remain available,” “do not lose acknowledged messages,” and “preserve a sensible order” are non-functional requirements.</p>
    <p>The feature list tells you what paths must exist. The qualities often drive the harder architecture decisions: persistent delivery, geographic placement, acknowledgement rules, replication, and ordering.</p>

    <LessonHeading level={2} id="functional-requirements">Functional requirements: negotiate the essential product</LessonHeading>
    <p>Functional requirements describe observable behavior. Keep the interview scope small enough to design well. For a video service, uploading and watching may be primary; comments, likes, subscriptions, search, and recommendations are candidates for explicit exclusion or a later extension.</p>
    <LessonCallout variant="interview-tip"><p>Repeat the agreed scope before designing. “I’ll focus on upload and playback; I’ll treat recommendations and comments as out of scope unless you want one as a deep dive.”</p></LessonCallout>

    <LessonHeading level={2} id="non-functional-requirements">Non-functional requirements: translate goals into design pressure</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Property</th><th>Question to clarify</th><th>Possible design consequence</th></tr></thead><tbody>
      <tr><td>Latency</td><td>Which operation is user-visible, and how fast is “fast enough”?</td><td>Shorter synchronous path, closer serving location, faster access path</td></tr>
      <tr><td>Throughput</td><td>What peak read/write rate must the system sustain?</td><td>Parallel workers, horizontal scale, partitioning, buffering</td></tr>
      <tr><td>Availability</td><td>Which operations must keep working during a failure?</td><td>Redundant instances, failover, graceful degradation</td></tr>
      <tr><td>Reliability</td><td>What incorrect or duplicate outcomes are unacceptable?</td><td>Idempotency, validation, auditable state changes</td></tr>
      <tr><td>Durability</td><td>After acknowledging a write, what loss is acceptable?</td><td>Persistent storage, acknowledgement policy, backups</td></tr>
      <tr><td>Consistency</td><td>How stale may each read be?</td><td>Read routing, coordination, conflict handling</td></tr>
      <tr><td>Scalability</td><td>How may workload and data grow?</td><td>Stateless services, partitionable data, capacity boundaries</td></tr>
      <tr><td>Fault tolerance</td><td>Which failures should the product mask or degrade through?</td><td>Isolation, retry budgets, redundancy, fallback behavior</td></tr>
    </tbody></table></TradeoffTable>
    <p>Numbers are example requirements, not universal targets. If active-user message delivery should normally stay under roughly 200 ms, the design may favor persistent connections, geographically close servers, fast routing, and fewer slow synchronous dependencies. A different product could accept a different boundary.</p>

    <LessonHeading level={2} id="system-examples">Requirements change the architecture</LessonHeading>
    <WorkedExample title="Payment system">
      <p><strong>Functional:</strong> create a payment, retrieve its status, and issue a refund. <strong>Non-functional:</strong> prevent duplicate charges, preserve acknowledged state, retain an audit trail, and favor correctness around money movement.</p>
    </WorkedExample>
    <WorkedExample title="News feed">
      <p><strong>Functional:</strong> publish a post and retrieve a feed. <strong>Non-functional:</strong> low read latency and high availability may dominate, while some products can accept delayed feed propagation. Product expectations can change that consistency choice.</p>
    </WorkedExample>
    <WorkedExample title="File storage">
      <p><strong>Functional:</strong> upload, download, and delete. <strong>Non-functional:</strong> durable acknowledged writes, large-file support, resumable transfer, and high availability. Retention and sharing semantics still need clarification.</p>
    </WorkedExample>

    <LessonHeading level={2} id="requirements-exercise">Exercise: scope WhatsApp</LessonHeading>
    <p>Write three essential functional requirements and four non-functional requirements. Add at least one explicit exclusion.</p>
    <details><summary>Reveal one reasonable answer</summary><div>
      <p><strong>Functional:</strong> send one-to-one messages, receive messages, and load recent history. Exclude group chat, voice/video, stories, and payments for the first design.</p>
      <p><strong>Non-functional:</strong> low delivery latency for online users, durable acknowledged messages, sensible per-conversation ordering, high availability, and support for intermittent connections. Exact targets must still be negotiated.</p>
    </div></details>

    <LessonHeading level={2} id="requirement-to-decision">Turn each requirement into a question</LessonHeading>
    <p>Do not merely list “availability” or “consistency.” Connect it to an operation: can users read history during a regional failure? Can a newly sent message appear briefly out of order? When is a send acknowledged? Architecture becomes defensible when each choice traces back to an agreed behavior or quality.</p>
    <PracticeConnections ids={["payment-system", "news-feed", "cloud-file-storage", "chat-system"]} />
    <FurtherReading items={foundationSources.requirements} />
    <RememberThis><p>Agree on the smallest useful feature set, then make the quality constraints concrete per operation. Functional requirements define the paths; non-functional requirements decide how those paths must behave under load and failure.</p></RememberThis>
  </>;
}
