import Link from "next/link";
import { DSAHeading, DSANote } from "@/components/dsa-learning";
import { dsaLanguages } from "@/data/dsa/languages";

export function DSAOverviewGuide() {
  return <><p>Efficient DSA preparation is a feedback loop: choose a small set of relevant patterns, solve with explicit reasoning, review failures, and revisit weak areas after enough time has passed to test recall.</p>
    <DSAHeading level={2} id="what-this-section-is">What this section is for</DSAHeading><p>Engineering Foundry DSA organizes interview questions, language refreshers, role-aware roadmaps, and practical strategy. It is not a from-scratch computer-science curriculum or a promise that a particular list predicts an interview.</p>
    <DSAHeading level={2} id="choose-your-entry-point">Choose your entry point</DSAHeading><ul><li><Link href="/dsa/languages/choose-a-language">Choose an interview language</Link> if syntax slows down your reasoning.</li><li><Link href="/dsa/roadmaps">Choose a roadmap</Link> if you need a time-boxed sequence.</li><li><Link href="/dsa/companies">Browse company questions</Link> to understand the future verified-data workflow.</li><li><Link href="/dsa/strategy#interview-flow">Use the coding interview playbook</Link> when communication or recovery is the bottleneck.</li></ul>
    <DSAHeading level={2} id="practice-loop">A practical practice loop</DSAHeading><ol><li>Restate the prompt and clarify inputs, outputs, and constraints.</li><li>Give a correct baseline and identify its bottleneck.</li><li>Derive the target approach from an invariant or state definition.</li><li>Implement while narrating only decision-relevant reasoning.</li><li>Test normal, boundary, and adversarial cases.</li><li>Record the mistake category—not merely the problem title.</li></ol>
    <DSANote title="Measure the right thing"><p>Accepted submissions are an incomplete signal. Track whether you recognized the pattern, justified the complexity, handled edge cases, and could reproduce the solution after a delay.</p></DSANote>
    <DSAHeading level={2} id="how-much-to-practice">How much to practice</DSAHeading><p>Start from your interview date, role, baseline, and available energy. Use roadmap quantities as editable planning aids, not universal prescriptions. A smaller reviewed set is usually more informative than a large streak of unexamined attempts.</p>
    <DSAHeading level={2} id="data-integrity">Data integrity</DSAHeading><p>Company associations must be backed by a supplied or verified dataset. The current browser uses clearly marked demo associations and intentionally leaves frequency and last-seen values empty.</p>
  </>;
}

export function LanguageComparisonGuide() {
  return <><p>The best interview language is the one in which you can express common structures correctly, explain the code, and recover from bugs under time pressure. Familiarity usually matters more than theoretical terseness.</p>
    <DSAHeading level={2} id="comparison">Language comparison</DSAHeading>
    <table><thead><tr><th>Language</th><th>Verbosity</th><th>Collections / heap</th><th>Interview speed</th><th>Common pitfall</th><th>Good fit</th></tr></thead><tbody>
      <tr><td>Python</td><td>Low</td><td>Strong; <code>heapq</code> is min-heap</td><td>Fast when fluent</td><td>Hidden copying and recursion depth</td><td>Concise, readable implementations</td></tr>
      <tr><td>Java</td><td>Higher</td><td>Strong collections and <code>PriorityQueue</code></td><td>Predictable when practiced</td><td>Comparator and boxing details</td><td>Candidates fluent in typed OO code</td></tr>
      <tr><td>C++</td><td>Medium</td><td>Very strong STL</td><td>Fast for experienced users</td><td>Iterator and ownership mistakes</td><td>Competitive-programming or systems fluency</td></tr>
      <tr><td>JavaScript / TypeScript</td><td>Low–medium</td><td>Map/Set strong; no native heap</td><td>Fast for web engineers</td><td>Numeric sort and queue choices</td><td>Deep JS/TS familiarity</td></tr>
      <tr><td>Go</td><td>Medium</td><td>Simple basics; heap is more explicit</td><td>Good when already fluent</td><td>Boilerplate for some structures</td><td>Go-native backend engineers</td></tr>
    </tbody></table>
    <DSAHeading level={2} id="decision-checklist">Decision checklist</DSAHeading><ul><li>Can you write BFS, binary search, a heap, and a graph adjacency list from memory?</li><li>Can you explain the standard-library operations you use?</li><li>Can you test and debug quickly without an IDE?</li><li>Is the language accepted in your specific interview environment?</li></ul>
    <DSAHeading level={2} id="avoid-switching-late">Avoid switching late</DSAHeading><p>Changing languages close to an interview can replace algorithm practice with syntax recovery. Switch only when the expected reduction in friction clearly exceeds that cost.</p>
    <DSAHeading level={2} id="guides">Language guides</DSAHeading><ul>{dsaLanguages.map((language) => <li key={language.slug}><Link href={`/dsa/languages/${language.slug}`}>{language.name}</Link> — {language.status === "published" ? "guide available" : "curriculum shell ready"}</li>)}</ul>
  </>;
}

export function ProblemSolvingFrameworkGuide() {
  return <><p>An unseen problem is less about instant recognition than controlled uncertainty. Use a repeatable sequence so the interviewer can evaluate your reasoning even before the final code is complete.</p>
    <DSAHeading level={2} id="clarify">1. Clarify the contract</DSAHeading><p>Restate inputs and outputs. Ask about constraints, duplicates, ordering, invalid input, and whether mutation is allowed. Prefer questions that could change the algorithm.</p>
    <DSAHeading level={2} id="examples">2. Build one useful example</DSAHeading><p>Choose a small example that exposes the central behavior. Add an edge case after you have a candidate approach instead of enumerating every possibility at the start.</p>
    <DSAHeading level={2} id="baseline">3. State a correct baseline</DSAHeading><p>A brute-force solution creates a correctness anchor. Explain its bottleneck precisely, then improve the operation responsible for that cost.</p>
    <DSAHeading level={2} id="invariant">4. Name the invariant</DSAHeading><p>Before coding, state what remains true as pointers move, a window changes, or a traversal progresses. This is more valuable than naming a pattern without justification.</p>
    <DSAHeading level={2} id="implement">5. Implement in reviewable steps</DSAHeading><p>Use clear names and explain decisions, not keystrokes. Pause briefly when the approach changes rather than silently patching a broken invariant.</p>
    <DSAHeading level={2} id="test">6. Test deliberately</DSAHeading><p>Trace a normal case, the smallest valid case, and a case that stresses the key branch. State expected output before executing the trace.</p>
    <DSAHeading level={2} id="complexity">7. Close with complexity and tradeoffs</DSAHeading><p>Give time and auxiliary space in terms of the relevant inputs. Mention recursion stack or output storage when it materially affects the analysis.</p>
    <DSANote title="When stuck"><p>Share the exact uncertainty: “I can make this O(n²), and I’m looking for a way to avoid rescanning this range.” A precise blocker invites a useful hint without surrendering the whole problem.</p></DSANote>
  </>;
}

export function StrategyOverviewGuide() {
  return <><p>Interview strategy is the layer around the algorithm: how you clarify, decompose, communicate, test, and recover. Strong code is easier to evaluate when the reasoning remains legible.</p>
    <DSAHeading level={2} id="before-coding">Before coding</DSAHeading><p>Confirm the contract, work through an example, and compare a correct baseline with the intended direction.</p>
    <DSAHeading level={2} id="while-coding">While coding</DSAHeading><p>Narrate meaningful decisions, preserve the stated invariant, and keep the implementation easy to review.</p>
    <DSAHeading level={2} id="after-coding">After coding</DSAHeading><p>Trace cases, state complexity, and discuss the most important tradeoff or alternative.</p>
    <DSAHeading level={2} id="start-framework">Start with a framework</DSAHeading><p>Use the <Link href="/dsa/interview-strategy/problem-solving-framework">unseen-problem framework</Link> as a reusable checklist during timed practice.</p>
  </>;
}
