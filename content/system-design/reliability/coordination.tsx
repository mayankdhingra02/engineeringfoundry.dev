import { LeaseFencingDemo } from "@/components/lease-fencing-demo";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, InterviewFollowUps, TradeoffTable } from "@/components/system-design-article";
import { ReliabilityLessonEnd } from "./shared";

const failover = `sequenceDiagram
  participant P as Primary
  participant R as Replica
  participant C as Controller
  P->>R: replicate changes
  P--xC: becomes unreachable
  C->>C: detect and establish authority
  C->>R: promote
  C-->>R: redirect clients`;
const leader = `sequenceDiagram
  participant A as Node A · term 8 leader
  participant B as Node B
  participant C as Node C
  A--xB: unreachable
  A--xC: unreachable
  B->>C: request vote · term 9
  C-->>B: vote
  Note over B: term 9 leader; old term is stale`;
const quorum = `flowchart LR
  subgraph Q1[Majority A]
    N1[Node 1] --- N2[Node 2] --- N3[Node 3]
  end
  subgraph Q2[Majority B]
    N3B[Node 3] --- N4[Node 4] --- N5[Node 5]
  end
  N3 -. overlap .- N3B`;
const consensus = `flowchart LR
  P[Proposed decision] --> N1[Node 1]
  P --> N2[Node 2]
  P --> N3[Node 3]
  N1 --> L[(Agreed ordered log)]
  N2 --> L
  N3 --> L`;
const raft = `sequenceDiagram
  participant C as Client
  participant L as Leader · term 12
  participant A as Follower A
  participant B as Follower B
  C->>L: command
  L->>A: append log entry
  L->>B: append log entry
  A-->>L: acknowledged
  Note over L: majority stored; commit
  L-->>C: result`;

export function HealthChecksLessonContent() { return <>
  <LessonHeading level={2} id="serve-traffic">Alive is not the same as ready for traffic</LessonHeading><p>A liveness signal asks whether restarting the process might help. Readiness asks whether this instance should currently receive traffic. The vocabulary is broadly useful even outside a particular orchestrator.</p><TradeoffTable><table><thead><tr><th>Too shallow</th><th>Too deep</th></tr></thead><tbody><tr><td>Returns 200 while a critical local resource is unusable</td><td>Calls every downstream service and couples all health</td></tr><tr><td>Routes traffic to a broken instance</td><td>One database hiccup can evict every API instance</td></tr></tbody></table></TradeoffTable><p>Keep the check cheap, bounded, and aligned with the action its consumer will take. A restart probe and a load-balancer routing probe may need different evidence.</p><ReliabilityLessonEnd id="health-checks" practice={["api-gateway-system", "job-scheduler"]}>Design a health signal for a specific decision. Avoid both a meaningless process-only check and a dependency graph that creates a cascade.</ReliabilityLessonEnd>
  </>; }

export function FailoverLessonContent() { return <>
  <LessonHeading level={2} id="take-over">Taking over requires authority, state, and routing</LessonHeading><p>A primary becomes unreachable. Detection is uncertain: slow can look dead. Promotion must establish which replica has authority, assess replication lag, redirect clients, and prevent the old primary from writing if it returns.</p><MermaidDiagram chart={failover} title="Simplified primary-to-replica failover" description="A primary replicates to a replica, becomes unreachable, and a controller promotes the replica before redirecting clients." /><InterviewFollowUps><ul><li>Was the replica caught up?</li><li>Who is authorized to promote it?</li><li>Can the surviving capacity carry all traffic?</li><li>How is failback validated?</li></ul></InterviewFollowUps><ReliabilityLessonEnd id="failover" practice={["key-value-store", "payment-system"]}>Failover is not merely “promote a replica.” Explain detection uncertainty, promotion authority, stale state, routing, split-brain prevention, and failback.</ReliabilityLessonEnd>
  </>; }

export function DistributedLocksLessonContent() { return <>
  <LessonHeading level={2} id="one-owner">A process mutex cannot coordinate machines</LessonHeading><p>Only one worker should generate today&apos;s billing report. Worker A asks a lock service for <code>report:2026-08-14</code>; B is denied or waits. Ownership needs identity, acquisition, release, expiration, and behavior when the owner crashes.</p><p>A permanent lock can outlive a crashed owner forever, so distributed locks commonly use leases. Yet a lock is not the automatic answer: a database transaction, row lock, unique constraint, single partition owner, idempotent operation, or serialized queue can enforce the invariant more simply.</p><CommonMistakes><ul><li>Assuming a distributed lock guarantees one actor forever.</li><li>Releasing a lock without verifying owner identity.</li><li>Using a lock where the protected store can enforce the invariant.</li></ul></CommonMistakes><ReliabilityLessonEnd id="distributed-locks" practice={["distributed-lock-service", "job-scheduler", "ticketmaster"]}>State the invariant first. If a distributed lock is justified, define ownership, expiration, crash behavior, and what the protected resource trusts.</ReliabilityLessonEnd>
  </>; }

export function LeasesFencingLessonContent() { return <>
  <LessonHeading level={2} id="stale-owner">A lease expires, but the old process can resume</LessonHeading><p>A receives a lease, then pauses. The lease expires and B receives ownership. When A resumes, it may still issue a write based on stale local state. An increasing fencing token lets the protected resource reject an older owner after it has accepted a newer token.</p><LeaseFencingDemo /><LessonCallout variant="tradeoff"><p>Fencing matters where stale-owner writes can violate correctness and the resource can compare tokens. It is not mandatory for every lock use case.</p></LessonCallout><ReliabilityLessonEnd id="leases-fencing-tokens" practice={["distributed-lock-service", "job-scheduler"]}>Expiration releases abandoned ownership; it does not stop a paused owner from resuming. Where needed, the protected resource must reject stale fencing tokens.</ReliabilityLessonEnd>
  </>; }

export function LeaderElectionLessonContent() { return <>
  <LessonHeading level={2} id="replace-coordinator">Nodes need a shared view of current authority</LessonHeading><p>A scheduler, partition coordinator, metadata manager, or primary writer may need one leader. If A becomes unreachable, B and C must decide whether to replace it and ensure A cannot later act with stale authority.</p><MermaidDiagram chart={leader} title="Leader replacement with a newer term" description="Nodes B and C cannot reach leader A; B wins an election in a newer term, making A's previous term stale." /><p>Terms or epochs distinguish generations. Failure detection, voting rules, and majority requirements belong to the coordination protocol—not an ad hoc “first node to notice wins” rule.</p><ReliabilityLessonEnd id="leader-election" practice={["job-scheduler", "distributed-lock-service", "kafka-platform"]}>Leader election must replace a missing coordinator while making old leadership recognizably stale. Explain detection, election authority, terms, and rejoin behavior.</ReliabilityLessonEnd>
  </>; }

export function QuorumsLessonContent() { return <>
  <LessonHeading level={2} id="overlap">Majorities overlap</LessonHeading><p>In a five-node group, any majority contains three nodes. Two such majorities share at least one node, which can help prevent two independent groups from making incompatible decisions under a protocol&apos;s assumptions.</p><MermaidDiagram chart={quorum} title="Two five-node majorities overlap" description="One majority includes nodes 1, 2, and 3; another includes 3, 4, and 5; node 3 overlaps." /><p>Some replicated-data models describe <code>N</code> replicas, <code>W</code> write acknowledgements, and <code>R</code> replicas consulted on reads. Under particular assumptions, <code>R + W &gt; N</code> creates overlap. That relationship alone is not a universal strong-consistency recipe: timing, version selection, sloppy quorums, failures, and implementation semantics matter.</p><ReliabilityLessonEnd id="quorums" practice={["key-value-store", "distributed-lock-service"]}>Quorum overlap is a reasoning tool within a defined protocol and failure model. Never apply R + W &gt; N as a context-free database guarantee.</ReliabilityLessonEnd>
  </>; }

export function ConsensusLessonContent() { return <>
  <LessonHeading level={2} id="agree-despite-delay">Several unreliable machines need one ordered decision</LessonHeading><p>Messages can be delayed, nodes can crash, and every participant has an incomplete view. Consensus protocols define how nodes agree on decisions or an ordered log under a specified failure model, often supporting leader election, metadata, and configuration.</p><MermaidDiagram chart={consensus} title="Proposals become an agreed ordered log" description="Three nodes participate in turning a proposed decision into one agreed log." /><TradeoffTable><table><thead><tr><th>Replication</th><th>Consensus</th></tr></thead><tbody><tr><td>Keeps multiple copies</td><td>Agrees on decisions, order, or state transitions</td></tr><tr><td>May be asynchronous</td><td>Uses a defined protocol and failure model</td></tr></tbody></table></TradeoffTable><p>Replication may use consensus, but the words are not synonyms. Interview depth is the problem, why delay makes failure ambiguous, and what majority agreement enables—not a proof.</p><ReliabilityLessonEnd id="distributed-consensus" practice={["key-value-store", "distributed-lock-service", "kafka-platform"]}>Consensus coordinates agreement despite crashes and delayed messages under explicit assumptions. It is not simply “having replicas.”</ReliabilityLessonEnd>
  </>; }

export function RaftLessonContent() { return <>
  <LessonHeading level={2} id="replicated-log">Raft organizes consensus around a leader and terms</LessonHeading><p>Followers receive log entries from a leader. If election timeouts pass without valid leadership, a follower may become a candidate in a newer term. A candidate needs votes according to the protocol; a leader replicates entries and advances commitment under Raft&apos;s majority and safety rules.</p><MermaidDiagram chart={raft} title="Raft log replication at interview depth" description="A client sends a command to a leader, which replicates the log entry to followers and commits after a majority stores it." /><p>If the leader fails, a later-term election chooses a replacement. This diagram omits many protocol rules deliberately. Use an existing database or coordination system when it already supplies replication; do not casually add Raft to application-level user data.</p><CommonMistakes><ul><li>Claiming every follower must acknowledge before commit.</li><li>Equating Raft with arbitrary-failure protection.</li><li>Adding Raft without explaining the replicated state machine that needs consensus.</li></ul></CommonMistakes><ReliabilityLessonEnd id="raft" practice={["key-value-store", "distributed-lock-service"]}>Raft is a consensus algorithm for a replicated log: terms, elections, leader replication, and majority commitment are the useful interview-level model.</ReliabilityLessonEnd>
  </>; }
