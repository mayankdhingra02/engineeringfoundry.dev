import assert from "node:assert/strict";
import { mockReviewsToInterviewEvidence } from "../lib/interview-playbook/mock-evidence.ts";
const one = (ratings, track = "dsa", overrides = {}) => mockReviewsToInterviewEvidence([{ sessionId: "session-a", track, mode: "solo", promptExposure: "fresh", assistanceState: "unassisted", sessionOutcome: "completed", reviewedAt: "2026-08-20T00:00:00Z", ratings, ...overrides }]);
assert.equal(one([]).length, 0);
assert.equal(one(["Strong"])[0].signal, "positive");
assert.equal(one(["Needs attention"])[0].signal, "negative");
assert.equal(one(["Strong", "Developing"])[0].signal, "mixed");
assert.equal(one(["Strong", "Needs attention"])[0].signal, "mixed");
assert.equal(one(["Developing"])[0].signal, "mixed");
assert.equal(one(["Developing", "Needs attention"])[0].signal, "mixed");
assert.equal(one(["Strong", "Developing", "Needs attention"])[0].signal, "mixed");
assert.deepEqual(one(["Strong"], "ml-design")[0], { id: "mock-session:session-a:self-review", area: "ml-system-design", provenance: "self-report", kind: "mock", signal: "positive", observedAt: "2026-08-20T00:00:00Z", summary: "Saved candidate self-review. Fresh prompt; No hint or redirection used; Completed as configured. Qualitative self-report evidence.", repeatedError: false });
assert.deepEqual(one(["Strong", "Developing"]), one(["Developing", "Strong"]));
for (const [track, area] of [["dsa", "algorithmic-coding"], ["system-design", "system-design"], ["low-level-design", "low-level-design"], ["ml-design", "ml-system-design"], ["behavioral", "behavioral"]]) assert.equal(one(["Strong"], track)[0].area, area);
assert.equal(one(["Needs attention"])[0].provenance, "self-report");
const peer = one(["Strong"], "dsa", { mode: "peer", assistanceState: "redirection-used" })[0];
assert.equal(peer.id, "mock-session:session-a:peer-entered-review");
assert.equal(peer.provenance, "self-report", "User-entered peer marks must not become verified human observation.");
assert.match(peer.summary, /evaluator not verified/);
assert.match(peer.summary, /Redirection used/);
for (const overrides of [{ promptExposure: "repeated" }, { sessionOutcome: "interrupted" }, { sessionOutcome: "technical-failure" }]) {
  const excluded = one(["Needs attention"], "dsa", overrides)[0];
  assert.equal(excluded.signal, "unknown", "Repeated or incomplete sessions must never reduce capability evidence.");
  assert.match(excluded.summary, /excluded from capability evidence/);
}
console.log("Mock evidence adapter qualification passed.");
