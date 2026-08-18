import type { FurtherReadingItem } from "@/components/system-design-article";

const awsRetries = { title: "Timeouts, retries, and backoff with jitter", publisher: "Amazon Builders' Library", url: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/" };
const awsIdempotency = { title: "Making retries safe with idempotent APIs", publisher: "Amazon Builders' Library", url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/" };
const googleCascades = { title: "Addressing cascading failures", publisher: "Google SRE", url: "https://sre.google/sre-book/addressing-cascading-failures/" };
const azurePatterns = { title: "Reliability design patterns", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/well-architected/reliability/design-patterns" };
const azureCircuit = { title: "Circuit Breaker pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker" };
const azureBulkhead = { title: "Bulkhead pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead" };
const azureHealth = { title: "Health Endpoint Monitoring pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring" };
const raftPaper = { title: "In Search of an Understandable Consensus Algorithm", publisher: "USENIX / Stanford", url: "https://raft.github.io/raft.pdf" };
const sagaPattern = { title: "Saga distributed transactions pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/saga" };
const awsDr = { title: "Use defined recovery strategies to meet recovery objectives", publisher: "AWS Well-Architected Framework", url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html" };

const retryIds = ["timeouts", "retries", "exponential-backoff-jitter"];
const overloadIds = ["failure-thinking", "graceful-degradation", "load-shedding", "backpressure-reliability", "partial-failure"];
const coordinationIds = ["distributed-locks", "leases-fencing-tokens", "leader-election", "quorums", "distributed-consensus"];
export const reliabilitySources: Record<string, readonly FurtherReadingItem[]> = Object.fromEntries([
  ...retryIds.map((id) => [id, [awsRetries, googleCascades]]),
  ...overloadIds.map((id) => [id, [googleCascades, azurePatterns]]),
  ["idempotency", [awsIdempotency]], ["circuit-breaker", [azureCircuit, awsRetries]], ["bulkheads", [azureBulkhead]],
  ["health-checks", [azureHealth, googleCascades]], ["failover", [azurePatterns]],
  ...coordinationIds.map((id) => [id, [raftPaper, azurePatterns]]), ["raft", [raftPaper]],
  ["distributed-transactions", [sagaPattern]], ["two-phase-commit", [raftPaper]], ["saga", [sagaPattern, awsIdempotency]],
  ["multi-region", [awsDr]], ["active-passive-active-active", [awsDr]], ["disaster-recovery", [awsDr]], ["rpo-rto", [awsDr]],
]);
