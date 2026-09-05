# Engineering Foundry System Design content research blueprint

Review date: 2026-09-04
Scope: complete Required vendor-neutral System Design curriculum publication

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

`data/system-design/topic-crosswalk.ts` is the reviewed 161-to-188 disposition. It contains every Section 6.4 blueprint row and covers every repository topic ID through one of four mapping decisions:

- `exact`: one focused repository lesson represents the blueprint outcome.
- `split`: the blueprint outcome is taught across several smaller repository lessons.
- `merged`: one broader repository lesson intentionally satisfies several blueprint outcomes.
- `blueprint-only`: the required blueprint outcome has no repository lesson yet and remains a visible gap; the current reviewed crosswalk has zero such rows.

Two repository lessons—Feature Stores and Choosing Specialized Building Blocks—are deliberate repository-only extensions. The ten formerly blueprint-only Required outcomes now map exactly to ten published lessons. The crosswalk resolves the numeric difference without deleting repository content, inventing a merged disposition, or expanding the Required acceptance boundary.

## Production-engineering family disposition

| Blueprint outcome | Repository lessons | Decision |
| --- | --- | --- |
| Logs, Metrics, and Traces | Observability; Logs; Metrics; Distributed Tracing; Correlation / Request IDs | Split for progressive depth |
| SLIs, SLOs, and Error Budgets | Service Level Indicators; Service Level Objectives; Error Budgets | Split for progressive depth |
| Alerting | Alerts | Exact |
| Distributed Monitoring | Observability | Merged into the signal and telemetry-pipeline overview |
| Security Threat Modeling | Security Threat Modeling | Exact |
| Authentication vs Authorization | Authentication vs Authorization; Sessions vs Tokens; JWT; OAuth / OIDC; Multi-Tenant Authorization Boundaries | Split for security-boundary depth |
| Secrets and Key Management | Encryption at Rest and in Transit; Secrets Management | Split |
| Abuse Prevention | API Abuse / DDoS | Exact |
| Cost and Efficiency | Cost and Efficiency | Exact |
| Operational Ownership | Operational Ownership | Exact |

TLS maps to the Networking & APIs blueprint outcome “TLS Termination and Trust Boundaries.” It remains in the repository's production-engineering family because that is where the full trust-boundary lesson is sequenced.

## Common Architecture Patterns disposition

The 14 lessons in this family are a synthesis layer over already published mechanisms. Scaling Reads and Read-Heavy Systems connect replicas, caches, CDNs, partitioning, skew, and freshness without repeating their foundational lessons. Scaling Writes and Write-Heavy Systems connect partition keys, admission, durable logs, queues, batching, and compaction. Fan-Out distinguishes independent subscriptions from competing consumers; Fan-Out-on-Write vs Fan-Out-on-Read makes amplification placement a workload decision. Background Jobs and Long-Running Jobs define durable acceptance, leases, checkpoints, cancellation, and publication. Batch vs Stream Processing, CQRS, hot-partition handling, contention handling, multi-step workflows, and large-file processing each retain their own failure and recovery boundary.

Publication closes the 14-lesson Common Architecture Patterns synthesis family. The Required closure batch adds separate Backfill and Rebuild and Control Plane vs Data Plane lessons rather than hiding those decisions inside broader patterns.

## Required closure disposition

| Blueprint outcome | Repository lesson | Decision |
| --- | --- | --- |
| Schema and Data Migration | Schema and Data Migration | Exact |
| Incident Recovery and Postmortems | Incident Recovery and Postmortems | Exact |
| Security Threat Modeling | Security Threat Modeling | Exact |
| Cost and Efficiency | Cost and Efficiency | Exact |
| Operational Ownership | Operational Ownership | Exact |
| Backfill and Rebuild | Backfill and Rebuild | Exact |
| Control Plane vs Data Plane | Control Plane vs Data Plane | Exact |
| Payments and Ledgers | Payments and Ledgers | Exact |
| Distributed File Systems | Distributed File Systems | Exact |
| Storage and Compute Separation | Storage and Compute Separation | Exact |

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
| `SD-CLOSURE-MIGRATION` | A live data migration is a multi-version protocol: expand compatibility, backfill under live writes, verify parity, switch authority, and contract later. | AWS Database Migration Service overview, validation, and change-data-capture guidance |
| `SD-CLOSURE-INCIDENT` | Incident response assigns command, restores user value with reversible mitigation, verifies recovery, and turns evidence into owned blameless follow-up work. | Google SRE Incident Management Guide and Postmortem Culture guidance; PostgreSQL point-in-time recovery documentation |
| `SD-CLOSURE-THREAT` | Threat modeling starts from assets, actors, data flows, and trust boundaries, then converts credible abuse paths into owned controls and validation. | OWASP Threat Modeling Cheat Sheet |
| `SD-CLOSURE-COST` | Cost design models workload units, fixed and variable drivers, provisioning delay, and reliability headroom before choosing an optimization. | AWS Well-Architected Cost Optimization guidance |
| `SD-CLOSURE-OWNERSHIP` | Operational ownership includes authority and responsibility for deploys, signals, incidents, migrations, dependencies, and retirement. | Google SRE engagement-model guidance |
| `SD-CLOSURE-BACKFILL` | Rebuilds require version-aware, restartable snapshot work plus live-change capture so stale batch output cannot overwrite newer state. | AWS DMS ongoing-replication and validation guidance |
| `SD-CLOSURE-PLANES` | The control plane validates and distributes versioned desired state; the data plane serves from bounded cached state and reports applied versions. | Kubernetes cluster architecture documentation |
| `SD-CLOSURE-PAYMENTS` | Payment orchestration, immutable balanced accounting, idempotency, disputes, and reconciliation are distinct correctness boundaries. | Stripe idempotency, disputes, and reconciliation documentation |
| `SD-CLOSURE-DFS` | Distributed file systems separate namespace metadata from block transfer and design replication across explicit failure domains. | Apache Hadoop HDFS architecture documentation |
| `SD-CLOSURE-DISAGGREGATION` | Separating storage and compute enables independent scaling and workload isolation while introducing remote-I/O, cache-warmth, and shared-bandwidth constraints. | Amazon Redshift managed-storage guidance |

## Publication review

The 18 Production Engineering, 14 Common Architecture Patterns, and ten Required closure lessons use original Engineering Foundry prose, bounded examples, canonical internal routes, valid practice IDs, purposeful diagrams, and HTTPS first-party references. The current TLS reference is RFC 9846, which obsoletes RFC 8446. Protocol lessons distinguish specification guarantees from application policy. Observability lessons distinguish signal collection from user-centered reliability decisions. Security lessons never treat encryption, identity, a gateway, a token, or a tenant ID as authorization by itself. Pattern and closure lessons state the decision threshold, durable state, failure mode, recovery path, and cost rather than presenting named patterns as universal defaults.

All 188 repository topics and all 15 Required practice designs are now published. Every one of the 161 unique Required blueprint topic rows has an explicit published disposition, so EF-SD Required acceptance is complete. The 33 additional P1/P2 practice ideas remain an optional, honest backlog and do not reopen or expand that acceptance boundary.
