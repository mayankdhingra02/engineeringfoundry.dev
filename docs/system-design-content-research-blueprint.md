# Engineering Foundry System Design content research blueprint

Review date: 2026-09-04
Scope: vendor-neutral System Design curriculum, Production Engineering, and Common Architecture Patterns publication

## Editorial contract

Every published lesson must begin with a design decision or operational question, not a product catalog. It must explain the relevant boundary, show at least one failure or trade-off, connect to a canonical practice dossier, and end with current primary or first-party technical references. Product-specific behavior is illustrative rather than universal.

Claims follow this source order:

1. Current standards and protocol specifications.
2. Original papers for algorithms or distributed-systems results.
3. Official project or vendor documentation for implementation behavior.
4. First-party engineering or SRE material for operating practice.
5. OWASP or NIST guidance for security architecture.

Secondary tutorials, social posts, competitor curricula, and remembered model knowledge do not establish publication truth. Examples use explicitly labeled assumptions. Security guidance states the protected boundary and the control it does not replace.

## Taxonomy crosswalk

`data/system-design/topic-crosswalk.ts` is the reviewed 161-to-178 disposition. It contains every Section 6.4 blueprint row and covers every repository topic ID exactly through one of four decisions:

- `exact`: one focused repository lesson represents the blueprint outcome.
- `split`: the blueprint outcome is taught across several smaller repository lessons.
- `merged`: one broader repository lesson intentionally satisfies several blueprint outcomes.
- `blueprint-only`: the required blueprint outcome has no repository lesson yet and remains a visible gap.

Two repository lessons—Feature Stores and Choosing Specialized Building Blocks—are deliberate repository-only extensions. Ten blueprint outcomes remain blueprint-only. The crosswalk resolves the numeric mismatch without deleting a repository topic, inventing a route, or claiming those ten gaps complete.

## Production-engineering family disposition

| Blueprint outcome | Repository lessons | Decision |
| --- | --- | --- |
| Logs, Metrics, and Traces | Observability; Logs; Metrics; Distributed Tracing; Correlation / Request IDs | Split for progressive depth |
| SLIs, SLOs, and Error Budgets | Service Level Indicators; Service Level Objectives; Error Budgets | Split for progressive depth |
| Alerting | Alerts | Exact |
| Distributed Monitoring | Observability | Merged into the signal and telemetry-pipeline overview |
| Security Threat Modeling | — | Blueprint-only; do not claim complete |
| Authentication vs Authorization | Authentication vs Authorization; Sessions vs Tokens; JWT; OAuth / OIDC; Multi-Tenant Authorization Boundaries | Split for security-boundary depth |
| Secrets and Key Management | Encryption at Rest and in Transit; Secrets Management | Split |
| Abuse Prevention | API Abuse / DDoS | Exact |
| Cost and Efficiency | — | Blueprint-only; do not claim complete |
| Operational Ownership | — | Blueprint-only; do not claim complete |

TLS maps to the Networking & APIs blueprint outcome “TLS Termination and Trust Boundaries.” It remains in the repository's production-engineering family because that is where the full trust-boundary lesson is sequenced.

## Common Architecture Patterns disposition

The 14 lessons in this family are a synthesis layer over already published mechanisms. Scaling Reads and Read-Heavy Systems connect replicas, caches, CDNs, partitioning, skew, and freshness without repeating their foundational lessons. Scaling Writes and Write-Heavy Systems connect partition keys, admission, durable logs, queues, batching, and compaction. Fan-Out distinguishes independent subscriptions from competing consumers; Fan-Out-on-Write vs Fan-Out-on-Read makes amplification placement a workload decision. Background Jobs and Long-Running Jobs define durable acceptance, leases, checkpoints, cancellation, and publication. Batch vs Stream Processing, CQRS, hot-partition handling, contention handling, multi-step workflows, and large-file processing each retain their own failure and recovery boundary.

Publication closes the finite 178-topic repository queue. It does not close the ten Required blueprint-only outcomes. Those remain the only EF-SD topic-coverage gaps and are reserved for an explicit lesson or reviewed merged-disposition batch.

## Claim and source matrix for the 2026-09-04 batch

| Claim ID | Supported lesson decisions | Primary or authoritative sources |
| --- | --- | --- |
| `SD-OBS-SIGNALS` | Logs, metrics, and traces answer different questions; shared context makes them correlatable; instrumentation and export need bounded failure behavior. | OpenTelemetry specification overview and logging specification |
| `SD-SLO-CONTROL` | SLIs define measurements, SLOs attach targets and windows, error budgets bound allowed misses, and burn-rate alerts connect consumption to action. | Google SRE Service Level Objectives; Google SRE Workbook Alerting on SLOs |
| `SD-AUTH-BOUNDARY` | Authentication establishes a principal; authorization decides an action on a resource; tenant scope must be enforced at the protected data boundary. | NIST SP 800-207A; OWASP Authorization and Multi-Tenant Security guidance |
| `SD-SESSION-BEARER` | Opaque sessions and bearer tokens place validation and revocation work differently; possession of a bearer token conveys its authority. | OWASP Session Management; RFC 6750 |
| `SD-JWT-VERIFY` | A JWT is a claims format; safe use requires cryptographic and contextual validation, including algorithm, issuer, audience, expiry, and purpose. | RFC 7519; RFC 8725 |
| `SD-OAUTH-OIDC` | OAuth delegates access, OIDC adds an identity layer, and authorization-code browser flows need correlation and PKCE protection. | RFC 6749; RFC 7636; OpenID Connect Core 1.0 errata 2 |
| `SD-TLS-BOUNDARY` | TLS 1.3 protects one connection; every terminator creates a new plaintext and key-management boundary. | RFC 9846 |
| `SD-KEY-LIFECYCLE` | Encryption decisions require explicit plaintext/key boundaries; secrets need controlled creation, distribution, rotation, revocation, audit, backup, and recovery. | NIST Key Management Guidelines; OWASP Secrets Management |
| `SD-ABUSE-LAYERS` | Resource exhaustion and automated business-flow abuse require layered edge filtering, request bounds, identity-aware quotas, admission control, and downstream isolation. | OWASP API Security Top 10 2023; OWASP Denial of Service guidance |
| `SD-PATTERN-READ-SCALE` | Read scaling places replicas, caches, and projections according to access skew and freshness; read-after-write paths need an authoritative or version-aware route. | PostgreSQL warm standby and replication; Amazon Builders' Library caching guidance |
| `SD-PATTERN-WRITE-DISTRIBUTION` | Write throughput depends on partition-key distribution and the narrowest serialization point; salting or calculated write shards trade write spread for read fan-in. | AWS DynamoDB partition-key and write-sharding guidance |
| `SD-PATTERN-FANOUT` | Separate subscriptions create independent delivery obligations, while consumers sharing one subscription divide work; each branch needs its own backlog and retry state. | Google Cloud Pub/Sub overview; Microsoft Competing Consumers pattern |
| `SD-PATTERN-JOBS` | Background and long-running operations need durable accepted/running/terminal states, restartable work, idempotent effects, and an explicit status or result channel. | Microsoft background-job guidance; Microsoft Asynchronous Request-Reply pattern |
| `SD-PATTERN-BATCH-STREAM` | Batch and streaming differ in boundedness, latency, time, state, and correction policy even when they share logical transforms. | Google Cloud Dataflow overview and pipeline-planning guidance |
| `SD-PATTERN-CQRS` | CQRS separates command invariants from query projections only when different models or scaling boundaries justify eventual-consistency and replay cost. | Microsoft CQRS pattern |
| `SD-PATTERN-CONTENTION` | Optimistic checks, locks, queues, partitions, and merge policies address different conflict rates and invariants; lock order and transaction duration remain operational controls. | PostgreSQL transaction isolation and explicit locking documentation |
| `SD-PATTERN-WORKFLOW` | A multi-step business outcome is durable state whose retries and compensations can each fail; compensation is not an automatic rollback. | Microsoft Saga pattern; Amazon Builders' Library idempotent API guidance |
| `SD-PATTERN-LARGE-FILE` | Large-file processing separates resumable multipart transfer, immutable input, chunk work, validated assembly, and atomic result publication. | Amazon S3 multipart-upload documentation; Microsoft background-job guidance |

## Publication review

The 18 Production Engineering and 14 Common Architecture Patterns lessons use original Engineering Foundry prose, bounded examples, canonical internal routes, valid practice IDs, and HTTPS references. The current TLS reference is RFC 9846, which obsoletes RFC 8446. Protocol lessons distinguish specification guarantees from application policy. Observability lessons distinguish signal collection from user-centered reliability decisions. Security lessons never treat encryption, identity, a gateway, a token, or a tenant ID as authorization by itself. Pattern lessons state the decision threshold, durable state, failure mode, recovery path, and cost rather than presenting named patterns as universal defaults.

All 178 repository topics and all 15 Required practice designs are now published. The broader EF-SD requirement remains partial only because ten Required blueprint-only outcomes still need publication or an explicit reviewed merged disposition. The 33 additional P1/P2 practice ideas remain an optional, honest backlog and do not reopen Required practice completion.
