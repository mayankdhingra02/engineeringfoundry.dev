import { DSAHeading } from "@/components/dsa-learning";

const walkthrough = [
  ["Clarify", "We need to determine whether a pair exists. May values repeat, and may I use extra memory?"],
  ["Example", "For [2, 7, 11, 15] and target 9, the first two values form a valid pair."],
  ["Baseline", "Compare every pair. It is correct, but costs O(n²) time."],
  ["Bottleneck", "For each value, the baseline repeatedly searches for its complement."],
  ["Optimize", "Store values already seen in a hash set and check each complement in average O(1) time."],
  ["Confirm", "A one-pass set gives O(n) expected time and O(n) space. Does that direction sound reasonable?"],
  ["Code", "Scan once; check the complement before adding the current value so one element is not reused."],
  ["Test", "Trace 2, then 7. Also test an empty input and duplicate values when the target is twice that value."],
  ["Analyze", "O(n) expected time and O(n) auxiliary space."],
  ["Follow-up", "If the input is sorted, use two pointers for O(n) time and O(1) extra space."],
] as const;

export function InterviewWalkthrough() {
  return <section>
    <DSAHeading level={2} id="walkthrough">A full interview walkthrough</DSAHeading>
    <p><strong>Original practice prompt:</strong> Given an array of integers and a target, determine whether two distinct values sum to the target.</p>
    <ol className="dsa-strategy-walkthrough">{walkthrough.map(([label, text], index) => <li key={label}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{label}</strong><p>{text}</p></div></li>)}</ol>
  </section>;
}

