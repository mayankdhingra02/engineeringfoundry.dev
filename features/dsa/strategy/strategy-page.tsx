import { ArrowRight, Braces, Check, CircleX, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { DSAHeading } from "@/components/dsa-learning";
import { InterviewFlow } from "./interview-flow";
import { InterviewWalkthrough } from "./interview-walkthrough";
import { PatternReference } from "./pattern-reference";
import { QuickReview } from "./quick-review";
import { StrategyCallout } from "./strategy-callout";
import { antiPatterns, bugChecklist, complexityTraps, constraintGuides } from "./strategy-content";
import { StuckRecovery } from "./stuck-recovery";
import { TimingGuide } from "./timing-guide";

export function CodingInterviewStrategyPage() {
  return <div className="dsa-strategy-guide">
    <nav className="dsa-strategy-actions" aria-label="Strategy guide shortcuts"><a href="#interview-flow">View the interview flow<ArrowRight size={13} /></a><a href="#quick-review">5-Minute Review</a></nav>

    <DSAHeading level={2} id="interview-flow">The interview flow</DSAHeading>
    <p>Use the same mental loop on unfamiliar problems. The details change; the sequence keeps the reasoning visible and prevents premature coding.</p>
    <InterviewFlow />
    <QuickReview />

    <DSAHeading level={2} id="understand">Step 1 — Understand before solving</DSAHeading>
    <p>Do not translate the first sentence directly into code. Establish the contract, then solve the problem you and the interviewer agree on.</p>
    <div className="dsa-strategy-check-grid"><section><strong>Identify</strong><ul><li>What exactly is the input?</li><li>What should be returned?</li><li>Is the input ordered?</li><li>Can values repeat?</li><li>Can the input be empty?</li><li>What input scale matters?</li></ul></section><section><strong>A useful restatement</strong><p>“We&apos;re given an integer array and need the indices of two distinct elements that sum to the target. We can assume exactly one pair exists. Is that correct?”</p><small>Adapt the structure; do not memorize the sentence.</small></section></div>
    <StrategyCallout title="Why restate?" tone="rule"><p>It verifies the input/output contract, exposes assumptions, and gives the interviewer an early opportunity to correct your understanding.</p></StrategyCallout>

    <DSAHeading level={2} id="clarify">Step 2 — Clarify what changes the solution</DSAHeading>
    <p>Ask questions with algorithmic consequences. You do not need to enumerate every conceivable edge case.</p>
    <div className="dsa-strategy-comparison"><article className="useful"><header><Check size={15} />Useful</header><ul><li>Can values repeat?</li><li>Is the input sorted?</li><li>Can the input be empty?</li><li>What scale should I expect?</li><li>If time and memory trade off, which matters more?</li></ul></article><article className="avoid"><header><CircleX size={15} />Usually unnecessary</header><ul><li>Asking which language to use after it was established.</li><li>Listing every edge case before understanding the core behavior.</li><li>Asking something already answered by the prompt.</li><li>Seeking permission for every ordinary implementation choice.</li></ul></article></div>
    <blockquote>Ask questions that can change your solution.</blockquote>
    <DSAHeading level={3} id="constraints">Let constraints guide—not dictate—the approach</DSAHeading>
    <div className="dsa-constraint-guide">{constraintGuides.map((item) => <article key={item.scale}><strong>{item.scale}</strong><p>{item.guidance}</p></article>)}</div>
    <p className="dsa-strategy-caption">Rules of thumb only. Runtime constants, input shape, language, and interview expectations can change what is reasonable.</p>
    <DSAHeading level={3} id="examples">Walk through one useful example</DSAHeading>
    <p>Use the example to expose behavior before selecting a pattern. For <code>[2, 7, 11, 15]</code> and target <code>9</code>, ask what information a scan needs, what work a pairwise search repeats, and what could be stored.</p>
    <details><summary>Edge-case prompts worth keeping available</summary><div><p>Empty input, one element, duplicates, negative values, very large values, already-sorted input, all-identical values, and the minimum or maximum valid size.</p><p>Choose only cases that stress the chosen data structure, invariant, or boundary.</p></div></details>

    <DSAHeading level={2} id="solve">Step 3 — Establish correctness, then optimize</DSAHeading>
    <DSAHeading level={3} id="brute-force" includeInToc>Start with a correct baseline</DSAHeading>
    <ol><li>Describe the simplest correct solution.</li><li>Give its time and space cost.</li><li>Identify the operation responsible for the cost.</li><li>Optimize that bottleneck.</li></ol>
    <StrategyCallout title="Baseline to optimization"><p>“The straightforward solution compares every pair, which is O(n²). The repeated work is searching for the complement. Storing previously seen values makes that lookup O(1) on average.”</p></StrategyCallout>
    <StrategyCallout title="Do not code every baseline" tone="watch"><p>Describing brute force does not require implementing it. If the optimized direction is clear, explain the baseline, derive the improvement, and code the better approach unless asked otherwise.</p></StrategyCallout>
    <DSAHeading level={3} id="optimize" includeInToc>Use signals, not memorized labels</DSAHeading>
    <PatternReference />
    <DSAHeading level={3} id="confirm-approach">Validate the approach before typing</DSAHeading>
    <div className="dsa-strategy-approach-card"><dl><div><dt>Data structure</dt><dd>Hash map</dd></div><div><dt>Stored state</dt><dd>value → index</dd></div><div><dt>Algorithm</dt><dd>Scan once; check whether the complement was already seen.</dd></div><div><dt>Complexity</dt><dd>O(n) time, O(n) auxiliary space</dd></div></dl><p>“Does that approach sound reasonable?”</p></div>
    <p>Confirmation creates a natural checkpoint before ten minutes are spent implementing the wrong model.</p>

    <DSAHeading level={2} id="communication">Communicate decisions, not keystrokes</DSAHeading>
    <div className="dsa-strategy-script-grid"><StrategyCallout title="Before coding"><p>“I&apos;ll describe the approach first, then implement it.”</p></StrategyCallout><StrategyCallout title="Tradeoff"><p>“We can reduce runtime to O(n), but use O(n) extra memory. Is that tradeoff acceptable?”</p></StrategyCallout><StrategyCallout title="Before testing"><p>“Let me trace the sample once to verify the code matches the algorithm.”</p></StrategyCallout><StrategyCallout title="Thinking"><p>“Give me a moment to see whether we can avoid recomputing this value.”</p></StrategyCallout></div>
    <div className="dsa-strategy-comparison"><article className="useful"><header><Check size={15} />Do communicate</header><ul><li>Assumptions and approach changes</li><li>Data-structure choices and invariants</li><li>Meaningful tradeoffs</li><li>Bugs you notice and test reasoning</li></ul></article><article className="avoid"><header><CircleX size={15} />Do not narrate</header><ul><li>“Now I&apos;m typing a for loop.”</li><li>“Now I&apos;m adding one.”</li><li>Every bracket or ordinary syntax choice</li><li>A continuous stream that leaves no room to think</li></ul></article></div>
    <p>Short focused silence is normal. Ten to thirty seconds can be useful; give context before a longer pause so the collaboration does not disappear.</p>

    <DSAHeading level={2} id="coding">Step 4 — Write interview-friendly code</DSAHeading>
    <ul><li>Choose clear names and keep the invariant locally understandable.</li><li>Use standard-library structures you can explain confidently.</li><li>Separate a complex operation when a helper improves reasoning.</li><li>Handle edge cases deliberately instead of scattering patches.</li><li>Avoid enterprise-style architecture and clever one-liners under time pressure.</li></ul>
    <div className="dsa-strategy-code-compare"><figure><figcaption>Too cryptic</figcaption><pre><code>{`d = {}\nx = 0\na = nums[i]`}</code></pre></figure><figure><figcaption>Meaningful context</figcaption><pre><code>{`seen = {}\nleft = 0\ncurrent_sum = ...`}</code></pre></figure></div>
    <p>Conventional short names such as <code>i</code>, <code>j</code>, and <code>n</code> remain reasonable when their meaning is obvious.</p>
    <StrategyCallout title="Comments"><p>Comment the reasoning—such as “shrink until the window is valid”—not obvious syntax such as incrementing an index.</p></StrategyCallout>
    <aside className="dsa-strategy-language-links"><div><Braces size={17} /><span><strong>Need syntax help before the round?</strong><small>Use the dedicated references instead of duplicating language details here.</small></span></div><nav><Link href="/dsa/languages/python">Python Interview Reference<ArrowRight size={12} /></Link><Link href="/dsa/languages/java">Java Interview Reference<ArrowRight size={12} /></Link></nav></aside>

    <DSAHeading level={2} id="testing">Step 5 — Test deterministically</DSAHeading>
    <ol><li>Walk through the provided example.</li><li>Trace the variables that carry the invariant.</li><li>Test one meaningful edge case.</li><li>Verify the actual return value.</li><li>Recheck loop boundaries and termination.</li></ol>
    <div className="dsa-strategy-trace"><table><thead><tr><th>i</th><th>value</th><th>complement</th><th>seen</th><th>action</th></tr></thead><tbody><tr><td>0</td><td>2</td><td>7</td><td>{"{}"}</td><td>store 2 → 0</td></tr><tr><td>1</td><td>7</td><td>2</td><td>{"{2: 0}"}</td><td>return pair</td></tr></tbody></table></div>
    <div className="dsa-strategy-bug-list" aria-label="Pre-finish bug checklist">{bugChecklist.map((bug) => <span key={bug}><i aria-hidden="true" />{bug}</span>)}</div>
    <DSAHeading level={3} id="debugging" includeInToc>Debug without restarting</DSAHeading>
    <ol><li>Reproduce the failing input manually.</li><li>Find the first state that differs from expectation.</li><li>Fix the smallest responsible piece.</li><li>Retest the original and failing cases.</li></ol>
    <StrategyCallout title="Visible debugging"><p>“The window becomes invalid here, but I advance the right boundary before shrinking it. That is the first state mismatch, so I&apos;ll correct that update order.”</p></StrategyCallout>

    <StuckRecovery />

    <DSAHeading level={2} id="complexity">Step 6 — Analyze and adapt</DSAHeading>
    <p>State time and auxiliary space in terms of the relevant inputs, then justify them with operations—not adjectives.</p>
    <StrategyCallout title="Precise complexity"><p>“Time is O(n) because we scan the array once. Auxiliary space is O(n) because the map can hold up to n entries.”</p></StrategyCallout>
    <details><summary>Common complexity traps</summary><div><ul>{complexityTraps.map((trap) => <li key={trap}>{trap}</li>)}</ul><p><Link href="/dsa/languages/python">Review Python operation costs</Link> or <Link href="/dsa/languages/java">review Java collection costs</Link>.</p></div></details>
    <DSAHeading level={3} id="follow-ups" includeInToc>Handle follow-ups as controlled changes</DSAHeading>
    <ol><li>Identify exactly what changed.</li><li>Check whether the existing algorithm still works.</li><li>Name the new bottleneck.</li><li>Modify the smallest necessary component.</li></ol>
    <div className="dsa-strategy-followups"><span>Input is sorted → hash map becomes two pointers</span><span>Data arrives as a stream → preserve only required state</span><span>Need top K → maintain a bounded heap</span><span>No extra memory → revisit sorting or in-place structure</span></div>

    <TimingGuide />
    <InterviewWalkthrough />

    <DSAHeading level={2} id="workflow-comparison">Weak workflow vs strong workflow</DSAHeading>
    <div className="dsa-strategy-workflows"><article><strong>Weak workflow</strong><p>Read → immediately code → get stuck → silently rewrite → run out of time → guess complexity</p></article><article><strong>Strong workflow</strong><p>Understand → clarify → baseline → optimize → confirm → code → test → analyze</p></article></div>
    <DSAHeading level={3} id="collaboration">Treat it like collaborative problem solving</DSAHeading>
    <p>Coding interviews remain evaluative, but listening, acknowledging feedback, communicating meaningful decisions, and adapting to changed constraints make your reasoning easier to assess.</p>

    <DSAHeading level={2} id="anti-patterns">What not to do</DSAHeading>
    <div className="dsa-strategy-anti-patterns">{antiPatterns.map((item) => <span key={item}><CircleX size={13} />{item}</span>)}</div>

    <DSAHeading level={2} id="checklist">Interview-day mini checklist</DSAHeading>
    <div className="dsa-strategy-mini-checklist"><section><strong>Before the round</strong><ul><li>Choose your strongest interview language.</li><li>Prepare the environment if one is required.</li><li>Remove distractions.</li></ul></section><section><strong>During the round</strong><ul><li>Restate → clarify → baseline.</li><li>Optimize → confirm → code.</li><li>Test → complexity → follow-up.</li></ul></section><section><strong>If stuck</strong><ul><li>Use a tiny example.</li><li>Identify repeated work.</li><li>Revisit constraints.</li><li>Explain what you know and use hints.</li></ul></section></div>
    <nav className="dsa-strategy-ending" aria-label="Continue DSA preparation"><Link href="/dsa/questions"><MessageSquareText size={14} />Practice this flow on a question<ArrowRight size={13} /></Link><Link href="/dsa/study-plans">Add it to a study plan<ArrowRight size={13} /></Link></nav>
  </div>;
}

