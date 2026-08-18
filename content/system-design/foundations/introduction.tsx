import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { CommonMistakes, FurtherReading, PracticeConnections, RememberThis, WorkedExample } from "@/components/system-design-article";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { foundationSources } from "./sources";

export function IntroductionLessonContent() {
  return <>
    <LessonHeading level={2} id="what-system-design-is">System Design turns requirements into defensible decisions</LessonHeading>
    <p>A System Design interview asks you to shape an ambiguous product into an architecture that can meet an agreed workload and reliability target. The useful skill is not memorizing a diagram. It is explaining why a component exists, what pressure introduced it, and what trade-off came with it.</p>
    <p>Good designs usually begin small. Establish the core request path and source of truth, then add capacity, redundancy, caching, asynchronous work, or partitioning only when a requirement makes that complexity worthwhile.</p>

    <LessonHeading level={2} id="evaluation">What interviewers evaluate</LessonHeading>
    <ul>
      <li><strong>Problem framing:</strong> choosing the right scope and clarifying the requirements that change the architecture.</li>
      <li><strong>Structured reasoning:</strong> moving from scale and access patterns to APIs, data, components, and critical flows.</li>
      <li><strong>Trade-offs:</strong> comparing credible options instead of presenting one technology as universally correct.</li>
      <li><strong>Failure awareness:</strong> describing timeouts, overload, stale data, partial failure, recovery, and remaining risk.</li>
      <li><strong>Communication:</strong> keeping the diagram and explanation coherent while adapting to follow-up constraints.</li>
    </ul>
    <LessonCallout variant="interview-tip"><p>Use precise language. “Highly available” is not a design by itself; name the failure you tolerate, the recovery behavior, and the consistency or cost you accept.</p></LessonCallout>

    <LessonHeading level={2} id="reasoning-loop">One interview, one connected reasoning loop</LessonHeading>
    <p>The stages are not separate checklists. Each answer constrains the next decision, and later discoveries may send you back to revise an earlier assumption.</p>
    <ol className="sd-intro-flow">
      <li><strong><Link href="/system-design/start-here/requirements-and-constraints">Clarify requirements.</Link></strong><span>Define the user-visible behavior, scope, and measurable qualities the design must protect.</span></li>
      <li><strong><Link href="/system-design/start-here/capacity-estimation">Estimate the workload.</Link></strong><span>Translate traffic, payload, storage, and growth assumptions into the pressures that can change the architecture.</span></li>
      <li><strong>Define APIs and data.</strong><span>Make the important operations concrete, then shape the data model around access patterns and correctness boundaries.</span></li>
      <li><strong>Draw the simplest complete architecture.</strong><span>Connect clients, compute, and the source of truth before introducing specialized infrastructure.</span></li>
      <li><strong>Find the first bottleneck.</strong><span>Use the stated scale and critical paths to decide where caching, load distribution, partitioning, or asynchronous work is justified.</span></li>
      <li><strong>Test reliability and trade-offs.</strong><span>Walk through failure, recovery, consistency, cost, and operational complexity, then summarize what you deliberately chose.</span></li>
    </ol>
    <p>The next lesson turns this loop into a repeatable <Link href="/system-design/start-here/system-design-interview-framework">interview framework</Link>. Later lessons go deeper on <Link href="/system-design/fundamentals/rest">API design</Link>, <Link href="/system-design/fundamentals/data-modeling-and-access-patterns">data modeling</Link>, <Link href="/system-design/start-here/core-system-properties">scaling properties</Link>, and <Link href="/system-design/patterns/failure-thinking-in-system-design">failure thinking</Link>.</p>

    <LessonHeading level={2} id="complexity">Make complexity earn its place</LessonHeading>
    <WorkedExample title="Evolve a small read-heavy service">
      <ol>
        <li>Start with one stateless service and one authoritative database.</li>
        <li>When service capacity or availability requires it, place multiple instances behind a load balancer.</li>
        <li>When repeated reads dominate database load, add a cache and define miss, invalidation, and outage behavior.</li>
        <li>When the dataset or write rate exceeds one database boundary, introduce partitioning and explain routing, rebalancing, and cross-partition operations.</li>
      </ol>
      <p>Each step answers an observed pressure. The final design is easier to defend because every added mechanism has a reason and a cost.</p>
    </WorkedExample>

    <LessonHeading level={2} id="curriculum">How to use this curriculum</LessonHeading>
    <ol>
      <li>Continue with the interview framework, then learn the <strong>Must Know</strong> foundations before collecting specialized technologies.</li>
      <li>After each topic, explain one trade-off and one failure mode without looking at the page.</li>
      <li>Use a practice problem to connect requirements, scale, APIs, data, a simple design, bottlenecks, and a scaled design.</li>
      <li>If you have a deadline, create a focused study plan based on your level and available time. Recommendations guide sequence; they never lock content.</li>
      <li>Revisit completed lessons through the study plan instead of reading the library once from top to bottom.</li>
    </ol>
    <p>Continue with the <Link href="/system-design/start-here/system-design-interview-framework">interview framework</Link>, then learn to separate <Link href="/system-design/start-here/requirements-and-constraints">functional and non-functional requirements</Link>.</p>

    <aside className="sd-intro-plan-action" aria-labelledby="sd-intro-plan-title">
      <CalendarDays size={20} aria-hidden="true" />
      <div><strong id="sd-intro-plan-title">Planning is optional.</strong><p>Already know your interview date? Turn the full curriculum into a focused sequence without hiding any lesson.</p></div>
      <Link className="button button-secondary" href="/system-design/plan">Create a study plan</Link>
    </aside>

    <CommonMistakes><ul>
      <li>Starting with a product name such as Kafka or Redis before defining the workload.</li>
      <li>Drawing the maximum-scale architecture before establishing a simple baseline.</li>
      <li>Treating availability, durability, reliability, and consistency as interchangeable.</li>
      <li>Listing advantages without naming costs, failure behavior, or operational burden.</li>
      <li>Reading many topics without practicing a complete, timed explanation.</li>
    </ul></CommonMistakes>

    <PracticeConnections ids={["url-shortener", "rate-limiter", "notification-service"]} />
    <FurtherReading items={foundationSources.introduction} />
    <RememberThis><p>Clarify the problem, begin with the simplest viable design, follow the critical paths, and add complexity only when a requirement or bottleneck earns it.</p></RememberThis>
  </>;
}
