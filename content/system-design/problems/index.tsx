import Link from "next/link";
import { CacheStampedeDemo } from "@/components/cache-stampede-demo";
import { ConsistentHashingDemo } from "@/components/consistent-hashing-demo";
import { ConsumerGroupDemo } from "@/components/consumer-group-demo";
import { GeospatialSearchDemo } from "@/components/geospatial-search-demo";
import { LeaseFencingDemo } from "@/components/lease-fencing-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import {
  AssumptionBox,
  CommonMistakes,
  FailureDeepDive,
  FormulaBlock,
  InterviewFollowUps,
  RememberThis,
  TradeoffTable,
  WorkedExample,
} from "@/components/system-design-article";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { TokenBucketDemo } from "@/components/token-bucket-demo";
import { systemDesignTopicManifest } from "@/data/system-design/manifest";
import type { SystemDesignPracticeContent } from "./types";

export { getSystemDesignPracticeContent, systemDesignPracticeContentIds, systemDesignPracticeContents } from "./data";

function ItemList({ items }: { items: readonly string[] }) {
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function PracticeVisual({ id }: { id: string }) {
  if (id === "rate-limiter") return <TokenBucketDemo />;
  if (id === "distributed-cache") return <><ConsistentHashingDemo /><CacheStampedeDemo /></>;
  if (id === "key-value-store") return <ConsistentHashingDemo />;
  if (id === "kafka-platform") return <ConsumerGroupDemo />;
  if (id === "ride-sharing" || id === "nearby-search") return <GeospatialSearchDemo />;
  if (id === "job-scheduler") return <LeaseFencingDemo />;
  return null;
}

function Stage({ number, title, summary, children, open = false }: { number: number; title: string; summary: string; children: React.ReactNode; open?: boolean }) {
  return <details className="sd-problem-stage" open={open}>
    <summary><span>{String(number).padStart(2, "0")}</span><span><strong>{title}</strong><small>{summary}</small></span></summary>
    <div>{children}</div>
  </details>;
}

function ConceptLinks({ ids, label }: { ids: readonly string[]; label: string }) {
  const topics = ids.map((id) => systemDesignTopicManifest.find((topic) => topic.id === id)).filter((topic): topic is NonNullable<typeof topic> => Boolean(topic));
  return <section className="sd-problem-concepts"><strong>{label}</strong><div>{topics.map((topic) => <Link key={topic.id} href={topic.slug}>{topic.navigationTitle ?? topic.title}</Link>)}</div></section>;
}

export function SystemDesignPracticeProblemContent({ problem }: { problem: SystemDesignPracticeContent }) {
  const estimate = problem.capacity;
  return <>
    <section className="sd-problem-prompt" aria-labelledby="interview-prompt">
      <span>Interview prompt</span>
      <h2 id="interview-prompt">{problem.prompt}</h2>
      <p>{problem.summary}</p>
      <div><strong>{problem.estimatedMinutes} min walkthrough</strong><span>{problem.difficulty}</span><span>{problem.category}</span></div>
    </section>

    <LessonCallout variant="interview-tip" title="Try it first"><p>Spend 10–15 minutes outlining requirements, rough scale, APIs, data, and the simplest credible architecture. Open the stages when you are ready to compare reasoning.</p></LessonCallout>
    <ConceptLinks ids={problem.prerequisites} label="Helpful before this design" />

    <Stage number={1} title="Clarify the problem" summary="Requirements, quality targets, and a deliberate boundary" open>
      <LessonHeading level={2} id="clarify-requirements">Clarify requirements</LessonHeading>
      <div className="sd-problem-three-column"><section><h3>Functional</h3><ItemList items={problem.functionalRequirements} /></section><section><h3>Non-functional</h3><ItemList items={problem.nonFunctionalRequirements} /></section><section><h3>Out of scope</h3><ItemList items={problem.outOfScope} /></section></div>
      <LessonHeading level={3} id="clarifying-questions">Questions to ask</LessonHeading><ItemList items={problem.clarifyingQuestions} />
    </Stage>

    <Stage number={2} title="Estimate only what changes the design" summary={estimate ? "Worked assumptions tied to an architecture decision" : "No forced arithmetic for this prompt"}>
      <LessonHeading level={2} id="capacity-estimation">Capacity estimation</LessonHeading>
      {estimate ? <WorkedExample title="A defensible interview estimate"><AssumptionBox><ItemList items={estimate.assumptions} /></AssumptionBox><FormulaBlock title="Rounded arithmetic">{estimate.arithmetic.join("\n")}</FormulaBlock><p><strong>Design consequence:</strong> {estimate.decision}</p></WorkedExample> : <p>This problem is driven more by correctness, coordination, or latency than by a headline storage number. State a few workload assumptions verbally, then spend the interview budget on the bottleneck that changes the architecture.</p>}
    </Stage>

    <Stage number={3} title="Define the contract and source of truth" summary="Concrete APIs and the minimum durable entities">
      <LessonHeading level={2} id="apis">APIs</LessonHeading>
      <TradeoffTable><table><thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead><tbody>{problem.apis.map((api) => <tr key={`${api.method}-${api.path}`}><td><code>{api.method}</code></td><td><code>{api.path}</code></td><td>{api.purpose}</td></tr>)}</tbody></table></TradeoffTable>
      <LessonHeading level={2} id="data-model">Core data model</LessonHeading>
      <TradeoffTable><table><thead><tr><th>Entity</th><th>Key fields</th><th>Design note</th></tr></thead><tbody>{problem.dataModel.map((entity) => <tr key={entity.entity}><td><strong>{entity.entity}</strong></td><td><code>{entity.fields}</code></td><td>{entity.notes}</td></tr>)}</tbody></table></TradeoffTable>
    </Stage>

    <Stage number={4} title="Start simple" summary="Use the smallest design that satisfies the clarified requirements">
      <LessonHeading level={2} id="start-simple">Start simple</LessonHeading><ItemList items={problem.simpleDesign} />
      <MermaidDiagram chart={problem.simpleDiagram} title="The first credible design" description={`A deliberately simple starting architecture for ${problem.title}.`} />
      <LessonCallout variant="important" title="Don't memorize the boxes"><p>The architecture changes when the requirements change. Focus on why each component was introduced and which bottleneck it addresses.</p></LessonCallout>
    </Stage>

    <Stage number={5} title="Walk the critical flows" summary="Make the read, write, or state-transition path explicit">
      <LessonHeading level={2} id="critical-flows">Critical flows</LessonHeading>
      {problem.criticalFlows.map((flow) => <section key={flow.title}><LessonHeading level={3} id={`flow-${flow.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{flow.title}</LessonHeading><ol>{flow.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>)}
    </Stage>

    <Stage number={6} title="Find the bottleneck, then scale" summary="Every added component pays for an identified pressure point">
      <LessonHeading level={2} id="bottlenecks">Bottleneck progression</LessonHeading><ItemList items={problem.bottlenecks} />
      <LessonHeading level={2} id="scaled-architecture">Scaled architecture</LessonHeading><ItemList items={problem.scalingSteps} />
      <MermaidDiagram chart={problem.scaledDiagram} title="One interview-friendly scaled design" description={`A scaled architecture for ${problem.title}; each component responds to a bottleneck named above.`} />
      <PracticeVisual id={problem.id} />
    </Stage>

    <Stage number={7} title="Design for failure" summary="Trace ambiguous outcomes, overload, and recovery">
      <LessonHeading level={2} id="failure-deep-dives">Failure deep dives</LessonHeading>
      {problem.failures.map((failure) => <FailureDeepDive key={failure.failure} {...failure} />)}
    </Stage>

    <Stage number={8} title="Defend the trade-offs" summary="Choose an option for a reason and name what it costs">
      <LessonHeading level={2} id="tradeoffs">Design decisions</LessonHeading>
      <TradeoffTable><table><thead><tr><th>Option</th><th>Choose when</th><th>You pay</th></tr></thead><tbody>{problem.decisions.map((decision) => <tr key={decision.option}><td><strong>{decision.option}</strong></td><td>{decision.chooseWhen}</td><td>{decision.cost}</td></tr>)}</tbody></table></TradeoffTable>
      <LessonHeading level={3} id="deep-dives">High-value deep dives</LessonHeading><ItemList items={problem.deepDives} />
    </Stage>

    <Stage number={9} title="Adapt the design" summary="Practice changing requirements instead of repeating one diagram">
      <LessonHeading level={2} id="what-would-change">What would change if…?</LessonHeading><ItemList items={problem.variants} />
      <InterviewFollowUps><ItemList items={problem.followUps} /></InterviewFollowUps>
      <details><summary>Timed interview allocations</summary><div className="sd-problem-timed-grid">{problem.timedPlans.map((plan) => <section key={plan.minutes}><strong>{plan.minutes}-minute version</strong><ItemList items={plan.allocation} /></section>)}</div></details>
      <details><summary>Interviewer deep-dive menu</summary><div><ItemList items={problem.deepDiveOptions} /></div></details>
    </Stage>

    <CommonMistakes><ItemList items={problem.mistakes} /></CommonMistakes>
    <RememberThis><p>{problem.remember}</p></RememberThis>

    <section className="sd-problem-quick-review" aria-labelledby="quick-review"><span>Quick review</span><h2 id="quick-review">Return to the design in two minutes.</h2><dl><div><dt>Core problem</dt><dd>{problem.quickReview.coreProblem}</dd></div><div><dt>Main decisions</dt><dd>{problem.quickReview.mainDecisions.join(" · ")}</dd></div><div><dt>Important failure</dt><dd>{problem.quickReview.importantFailure}</dd></div><div><dt>Key trade-off</dt><dd>{problem.quickReview.keyTradeoff}</dd></div></dl></section>

    <section className="sd-problem-self-check" aria-labelledby="self-check"><span>Self-check</span><h2 id="self-check">Can you answer without reopening the walkthrough?</h2><ItemList items={problem.selfCheck} /></section>
    <ConceptLinks ids={problem.concepts} label="Canonical concepts used" />
    <p className="sd-problem-reviewed">Content reviewed {problem.lastReviewed}. This is an original interview-friendly design, not a claim about any company&apos;s private production architecture.</p>
  </>;
}

export type { SystemDesignPracticeContent } from "./types";
