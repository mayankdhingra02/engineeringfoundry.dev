# System Design curriculum manifest

> Generated from `data/system-design/manifest.ts`. Edit the manifest, then run `npm run report:system-design-manifest`.

This is the content architecture for interview preparation. It intentionally contains requirements and metadata—not lesson prose or placeholder solutions.

## Summary

- Sections: 10
- Topics: 178
- Subtopics: 1389
- Must Know: 68
- Important: 83
- Advanced: 27
- Mermaid visuals: 67
- Sequence visuals: 22
- Comparison visuals: 29
- Custom interactives: 10
- Practice problems: 60

## System Design Interview Foundations

Build a repeatable interview process and the vocabulary needed to defend a design.

### Introduction to System Design

- ID: `introduction`
- Route: `/system-design/start-here/introduction`
- Priority: Must Know
- Estimated time: 10 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - What interviewers evaluate
  - Architecture as trade-off reasoning
  - How to use this curriculum

### How to Approach a System Design Interview

- ID: `interview-framework`
- Route: `/system-design/start-here/system-design-interview-framework`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid — A phased interview flow from prompt clarification through design summary.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Understand the prompt
  - Clarify functional requirements
  - Clarify non-functional requirements
  - Define scope
  - State assumptions
  - Estimate scale
  - Define APIs
  - Model core data
  - Draw high-level architecture
  - Identify bottlenecks
  - Choose deep dives
  - Discuss failure modes
  - Explain trade-offs
  - Summarize the design

### Functional vs Non-Functional Requirements

- ID: `requirements`
- Route: `/system-design/start-here/requirements-and-constraints`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `introduction`
- Practice problems: `url-shortener`, `rate-limiter`, `pastebin`, `leaderboard`, `notification-service`, `search-autocomplete`, `chat-system`, `news-feed`, `job-scheduler`, `web-crawler`, `cloud-file-storage`, `video-streaming`, `ride-sharing`, `nearby-search`, `ticketmaster`, `payment-system`, `metrics-platform`, `distributed-cache`, `distributed-queue`, `key-value-store`, `kafka-platform`, `search-engine`, `collaborative-editor`, `event-analytics`, `ml-inference-service`, `feature-store`, `vector-search`, `api-gateway-system`, `distributed-id-generator`, `feature-flag-system`, `webhook-delivery`, `slack`, `discord`, `reddit`, `presence-service`, `email-service`, `ecommerce`, `shopping-cart`, `inventory-system`, `checkout-system`, `digital-wallet`, `food-delivery`, `netflix`, `spotify`, `twitch`, `image-hosting`, `recommendation-system`, `ad-serving`, `fraud-detection`, `workflow-engine`, `cicd-platform`, `log-aggregation`, `distributed-tracing-platform`, `object-storage-system`, `iot-ingestion`, `distributed-lock-service`, `stream-processing-platform`, `model-serving-platform`, `embedding-pipeline`, `collaborative-app`
- Major subtopics:
  - Functional requirements
  - Latency
  - Availability
  - Durability
  - Consistency
  - Scalability
  - Throughput
  - Reliability
  - Fault tolerance

### Back-of-the-Envelope Capacity Estimation

- ID: `estimation`
- Route: `/system-design/start-here/capacity-estimation`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `requirements`
- Practice problems: `url-shortener`, `pastebin`, `video-streaming`, `api-gateway-system`, `distributed-id-generator`, `feature-flag-system`, `webhook-delivery`, `slack`, `discord`, `reddit`, `presence-service`, `email-service`, `ecommerce`, `shopping-cart`, `inventory-system`, `checkout-system`, `digital-wallet`, `food-delivery`, `netflix`, `spotify`, `twitch`, `image-hosting`, `ad-serving`, `fraud-detection`, `workflow-engine`, `cicd-platform`, `distributed-tracing-platform`, `object-storage-system`, `distributed-lock-service`, `collaborative-app`
- Major subtopics:
  - DAU and MAU
  - Requests per user and per day
  - Average and peak RPS or QPS
  - Read/write ratio
  - Bandwidth and payload size
  - Storage per day and retention
  - Replication overhead
  - Cache sizing
  - Concurrency
  - Whether estimation changes the design

### Core System Properties

- ID: `core-system-properties`
- Route: `/system-design/start-here/core-system-properties`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid — A single-server request path scaled horizontally behind a load balancer.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `requirements`
- Practice problems: None currently mapped
- Major subtopics:
  - Scalability
  - Horizontal vs vertical scaling
  - Availability
  - Reliability
  - Durability
  - Fault tolerance
  - Latency
  - Throughput
  - p50, p95 and p99
  - Bottlenecks
  - Redundancy

## Networking & APIs

Trace requests, design interfaces, and select communication patterns at interview depth.

### How a Request Travels Through a System

- ID: `request-path`
- Route: `/system-design/fundamentals/how-a-request-travels-through-a-system`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Mermaid — A browser-to-DNS-to-edge-to-service-to-cache/database request and response sequence.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - DNS
  - Transport connection
  - TLS and HTTPS
  - Connection reuse
  - CDN or edge
  - Load balancer
  - Application server
  - Cache and database
  - Response

### DNS

- ID: `dns`
- Route: `/system-design/fundamentals/dns`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Domain to address
  - Recursive resolution
  - Authoritative DNS
  - Caching
  - TTL
  - A, AAAA and CNAME
  - Geographic routing
  - Failure considerations

### HTTP & HTTPS

- ID: `http`
- Route: `/system-design/fundamentals/http-https`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Request and response
  - Methods
  - Status behavior
  - Statelessness
  - Application state
  - Persistent connections
  - HTTP/2 and HTTP/3
  - TLS role

### REST API Design

- ID: `rest`
- Route: `/system-design/fundamentals/rest`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `http`
- Practice problems: None currently mapped
- Major subtopics:
  - Resources
  - Methods and contracts
  - Validation
  - Error behavior
  - Naming
  - Filtering and sorting
  - Versioning
  - Authentication boundary
  - Asynchronous APIs

### Pagination

- ID: `pagination`
- Route: `/system-design/fundamentals/pagination`
- Priority: Must Know
- Estimated time: 18 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `rest`
- Practice problems: None currently mapped
- Major subtopics:
  - Offset pagination
  - Cursor pagination
  - Stable ordering
  - Concurrent inserts and deletes
  - Page navigation
  - Feeds and timelines

### Idempotent APIs

- ID: `idempotent-apis`
- Route: `/system-design/fundamentals/idempotent-apis`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `rest`
- Practice problems: None currently mapped
- Major subtopics:
  - HTTP method semantics
  - Idempotency keys
  - Request identity
  - Stored outcomes
  - Retries
  - Duplicate requests
  - Concurrency
  - Retention

### gRPC

- ID: `grpc`
- Route: `/system-design/fundamentals/grpc`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Must Know, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: `http`
- Practice problems: None currently mapped
- Major subtopics:
  - RPC model
  - Protocol Buffers
  - Generated clients
  - Binary serialization
  - HTTP/2
  - Unary
  - Server, client and bidirectional streaming
  - REST vs gRPC

### GraphQL

- ID: `graphql`
- Route: `/system-design/fundamentals/graphql`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Must Know, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `rest`
- Practice problems: None currently mapped
- Major subtopics:
  - Schema
  - Queries and mutations
  - Client-selected fields
  - Single endpoint convention
  - Over-fetching and under-fetching
  - Resolver complexity
  - N+1 queries
  - Authorization
  - Query limits
  - REST vs GraphQL

### Polling, Long Polling, SSE & WebSockets

- ID: `realtime-communication`
- Route: `/system-design/fundamentals/websockets`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `http`
- Practice problems: `chat-system`, `ride-sharing`, `collaborative-editor`
- Major subtopics:
  - Polling
  - Long polling
  - Server-Sent Events
  - WebSockets
  - Connection lifecycle
  - Reconnects and heartbeats
  - Scaling persistent connections
  - Presence and routing
  - Choosing a mechanism

### Forward Proxy vs Reverse Proxy

- ID: `reverse-proxies`
- Route: `/system-design/fundamentals/forward-proxy-vs-reverse-proxy`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Forward proxy role
  - Reverse proxy role
  - Trust boundaries
  - TLS termination
  - Routing and caching
  - Common interview uses

### Load Balancing

- ID: `load-balancing`
- Route: `/system-design/fundamentals/load-balancing`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `core-system-properties`
- Practice problems: `ml-inference-service`
- Major subtopics:
  - Purpose
  - Horizontal scaling
  - Round robin
  - Weighted routing
  - Least connections
  - Hashing and consistent hashing
  - Health checks
  - Sticky sessions
  - L4 vs L7
  - Failover

### API Gateway

- ID: `api-gateway`
- Route: `/system-design/fundamentals/api-gateway`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `rest`, `load-balancing`
- Practice problems: None currently mapped
- Major subtopics:
  - Routing
  - Authentication and authorization integration
  - Rate limiting
  - Transformation
  - Aggregation
  - Versioning
  - Observability
  - Gateway vs load balancer

### Service Discovery

- ID: `service-discovery`
- Route: `/system-design/fundamentals/service-discovery`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Must Know
- Role relevance: backend=Important, fullstack=Advanced, infrastructure=Must Know, data=Advanced, ml=Advanced
- Prerequisites: `load-balancing`
- Practice problems: None currently mapped
- Major subtopics:
  - Dynamic instances
  - Service registry
  - Registration
  - Health
  - Lookup
  - Client-side discovery
  - Server-side discovery
  - DNS and Kubernetes-style discovery

### Content Delivery Networks

- ID: `cdn`
- Route: `/system-design/fundamentals/cdns`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `http`
- Practice problems: `pastebin`, `video-streaming`
- Major subtopics:
  - Origin
  - PoP and edge
  - Cache hit and miss
  - TTL
  - Cache key
  - Invalidation and purge
  - Static and dynamic delivery
  - Signed and private content
  - Failure modes

### Rate Limiting

- ID: `rate-limiting`
- Route: `/system-design/fundamentals/rate-limiting`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Custom interactive — Animate token refill, burst consumption, rejection, and distributed counter approximation.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `rest`
- Practice problems: `rate-limiter`, `web-crawler`
- Major subtopics:
  - Why rate limit
  - Limit dimensions
  - Fixed window
  - Sliding window
  - Token bucket
  - Leaky bucket
  - Distributed counters
  - Burst handling
  - Approximate global limits
  - HTTP 429
  - Failure modes
  - Abuse protection

## Data & Storage

Choose data models and scaling strategies from access patterns and correctness needs.

### Data Modeling & Access Patterns

- ID: `data-modeling`
- Route: `/system-design/fundamentals/data-modeling-and-access-patterns`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: `url-shortener`, `pastebin`, `search-autocomplete`, `api-gateway-system`, `distributed-id-generator`, `feature-flag-system`, `webhook-delivery`, `slack`, `discord`, `reddit`, `presence-service`, `email-service`, `ecommerce`, `shopping-cart`, `inventory-system`, `checkout-system`, `digital-wallet`, `food-delivery`, `netflix`, `spotify`, `twitch`, `image-hosting`, `ad-serving`, `fraud-detection`, `workflow-engine`, `cicd-platform`, `distributed-tracing-platform`, `object-storage-system`, `distributed-lock-service`, `collaborative-app`
- Major subtopics:
  - Model around reads and writes
  - Entities
  - Relationships
  - Access patterns
  - Primary and lookup keys
  - Sorting and ranges
  - Transactional boundaries
  - Retention
  - Normalization
  - Denormalization
  - Database choice

### SQL vs NoSQL

- ID: `sql-vs-nosql`
- Route: `/system-design/fundamentals/sql-vs-nosql`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `data-modeling`
- Practice problems: None currently mapped
- Major subtopics:
  - Relational
  - Key-value
  - Document
  - Wide-column
  - Choosing from requirements
  - Transactions
  - Joins
  - Access-pattern constraints
  - Scale considerations
  - Polyglot persistence

### Relational Databases

- ID: `sql-databases`
- Route: `/system-design/fundamentals/relational-databases`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `data-modeling`
- Practice problems: None currently mapped
- Major subtopics:
  - Tables
  - Rows and columns
  - Primary keys
  - Foreign keys
  - Constraints
  - Joins
  - Transactions
  - Indexes

### Key-Value Stores

- ID: `key-value-stores`
- Route: `/system-design/fundamentals/key-value-stores`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `data-modeling`
- Practice problems: `key-value-store`
- Major subtopics:
  - Key lookup
  - Predictable access
  - Partitioning
  - Value modeling
  - Secondary access
  - Limitations
  - Common workloads

### Document Databases

- ID: `document-databases`
- Route: `/system-design/fundamentals/document-databases`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `data-modeling`
- Practice problems: None currently mapped
- Major subtopics:
  - Document model
  - Nested data
  - Flexible schema
  - Schema validation
  - Indexes
  - Access-pattern fit
  - Duplication
  - Update trade-offs

### Wide-Column Databases

- ID: `wide-column-databases`
- Route: `/system-design/fundamentals/wide-column-databases`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Important, ml=Advanced
- Prerequisites: `data-modeling`
- Practice problems: None currently mapped
- Major subtopics:
  - Partition keys
  - Clustering columns
  - Query-first schemas
  - Range access
  - Distribution
  - Hot partitions
  - Query constraints
  - Operational trade-offs

### Database Indexes

- ID: `database-indexes`
- Route: `/system-design/fundamentals/database-indexes`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `sql-databases`
- Practice problems: `nearby-search`, `vector-search`
- Major subtopics:
  - Why indexes exist
  - B-tree intuition
  - Index lookup
  - Composite indexes
  - Column order
  - Selectivity
  - Unique indexes
  - Partial indexes
  - Covering indexes
  - Storage and write cost
  - When an index is not useful
  - Inverted-index bridge

### Transactions

- ID: `transactions`
- Route: `/system-design/fundamentals/transactions`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `sql-databases`
- Practice problems: `ticketmaster`, `payment-system`
- Major subtopics:
  - Atomicity
  - Consistency and invariants
  - Isolation
  - Durability
  - Application correctness
  - ACID vs distributed consistency

### Isolation & Concurrency

- ID: `isolation-levels`
- Route: `/system-design/fundamentals/isolation-and-concurrency`
- Priority: Important
- Estimated time: 30 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `transactions`
- Practice problems: `ticketmaster`
- Major subtopics:
  - Dirty reads
  - Non-repeatable reads
  - Phantom reads
  - Lost updates
  - Optimistic concurrency
  - Conditional updates
  - Pessimistic locking
  - Serializable at interview depth

### Replication

- ID: `replication`
- Route: `/system-design/fundamentals/replication`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Custom interactive — Timeline showing writes, replica acknowledgement, replication lag, stale reads, and failover; the published lesson currently uses two static Mermaid teaching diagrams.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `sql-vs-nosql`
- Practice problems: `distributed-cache`, `distributed-queue`, `key-value-store`
- Major subtopics:
  - Primary or leader
  - Replicas or followers
  - Synchronous replication
  - Asynchronous replication
  - Read replicas
  - Replication lag
  - Read-after-write problems
  - Failover
  - Multi-leader
  - Replication vs sharding

### Sharding / Partitioning

- ID: `sharding`
- Route: `/system-design/fundamentals/sharding-partitioning`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `replication`
- Practice problems: `leaderboard`, `chat-system`, `news-feed`, `cloud-file-storage`, `ride-sharing`, `metrics-platform`, `search-engine`
- Major subtopics:
  - Horizontal partitioning
  - Hash-based sharding
  - Range sharding
  - Directory-based sharding
  - Choosing shard keys
  - Cardinality
  - Data locality
  - Hot partitions
  - Celebrity problem
  - Write sharding
  - Cross-shard queries
  - Cross-shard transactions
  - Resharding
  - Rebalancing
  - Shard routing

### Consistent Hashing

- ID: `consistent-hashing`
- Route: `/system-design/fundamentals/consistent-hashing`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Custom interactive — Manipulable hash ring showing node changes, key movement, virtual nodes, and hot-key limitations.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `sharding`
- Practice problems: `rate-limiter`, `distributed-cache`, `key-value-store`
- Major subtopics:
  - Modulo hashing problem
  - Hash ring
  - Node changes
  - Key movement
  - Virtual nodes
  - Heterogeneous capacity
  - Limitations
  - Hot keys

### Consistency Models

- ID: `consistency-models`
- Route: `/system-design/fundamentals/consistency-models`
- Priority: Important
- Estimated time: 30 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `replication`
- Practice problems: `key-value-store`, `collaborative-editor`
- Major subtopics:
  - Strong consistency
  - Eventual consistency
  - Read-your-writes
  - Monotonic reads
  - Session guarantees
  - Product consequences

### CAP Theorem

- ID: `cap-theorem`
- Route: `/system-design/fundamentals/cap-theorem`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `consistency-models`
- Practice problems: None currently mapped
- Major subtopics:
  - CAP consistency
  - CAP availability
  - Network partition
  - Why pick any two is misleading
  - Behavior during partitions
  - Operation-specific choices
  - Common misclassifications

### PACELC

- ID: `pacelc`
- Route: `/system-design/fundamentals/pacelc`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `cap-theorem`
- Practice problems: None currently mapped
- Major subtopics:
  - Partition trade-off
  - Else latency-consistency trade-off
  - Product consequences
  - When the model is useful

### Denormalization

- ID: `denormalization`
- Route: `/system-design/fundamentals/denormalization`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `data-modeling`
- Practice problems: None currently mapped
- Major subtopics:
  - Normalization continuum
  - Read optimization
  - Duplicated data
  - Write amplification
  - Consistency maintenance
  - When to denormalize

### Unique ID Generation

- ID: `unique-id-generation`
- Route: `/system-design/fundamentals/unique-id-generation`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `data-modeling`
- Practice problems: `url-shortener`
- Major subtopics:
  - Database auto increment
  - UUID-style IDs
  - Random IDs
  - Snowflake-style IDs
  - Timestamp, node and sequence
  - Collisions
  - Ordering
  - Clock issues
  - Information leakage

### Object / Blob Storage

- ID: `object-storage`
- Route: `/system-design/fundamentals/object-blob-storage`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `data-modeling`
- Practice problems: `pastebin`, `cloud-file-storage`, `video-streaming`, `event-analytics`, `feature-store`, `recommendation-system`, `log-aggregation`, `iot-ingestion`, `stream-processing-platform`, `model-serving-platform`, `embedding-pipeline`
- Major subtopics:
  - Objects vs database rows
  - Object key
  - Object bytes
  - Metadata database
  - Bucket or container
  - Durability
  - HTTP access
  - Lifecycle and retention
  - CDN integration

### Large File Uploads

- ID: `large-file-uploads`
- Route: `/system-design/fundamentals/file-uploads`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `object-storage`
- Practice problems: `cloud-file-storage`
- Major subtopics:
  - Naive proxy upload
  - Multipart uploads
  - Resumable uploads
  - Presigned URLs
  - Direct client to object storage
  - Checksums
  - Abandoned uploads
  - Metadata database
  - Background processing

### Time-Series Databases

- ID: `time-series-databases`
- Route: `/system-design/fundamentals/time-series-databases`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Important, ml=Advanced
- Prerequisites: `data-modeling`, `sharding`
- Practice problems: `metrics-platform`
- Major subtopics:
  - Time-stamped measurements
  - Time partitioning
  - High-rate writes
  - Time-range queries
  - Retention
  - Downsampling
  - Compression
  - High-cardinality dimensions
  - Recent-data focus

## Caching

Use caches deliberately, including their consistency and failure costs.

### Why Caching Works

- ID: `caching`
- Route: `/system-design/fundamentals/caching`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: `url-shortener`, `leaderboard`, `search-autocomplete`, `news-feed`, `nearby-search`, `ticketmaster`, `search-engine`, `ml-inference-service`, `vector-search`, `api-gateway-system`, `distributed-id-generator`, `feature-flag-system`, `webhook-delivery`, `slack`, `discord`, `reddit`, `presence-service`, `email-service`, `ecommerce`, `shopping-cart`, `inventory-system`, `checkout-system`, `digital-wallet`, `food-delivery`, `netflix`, `spotify`, `twitch`, `image-hosting`, `recommendation-system`, `ad-serving`, `fraud-detection`, `workflow-engine`, `cicd-platform`, `distributed-tracing-platform`, `object-storage-system`, `distributed-lock-service`, `model-serving-platform`, `embedding-pipeline`, `collaborative-app`
- Major subtopics:
  - Repeated reads
  - Expensive computation and network work
  - Geographic locality
  - Cache hits and misses
  - Hit-rate calculation
  - When caching helps
  - When caching does not help
  - Staleness and operational cost

### Cache Placement

- ID: `cache-placement`
- Route: `/system-design/fundamentals/cache-placement`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `caching`
- Practice problems: None currently mapped
- Major subtopics:
  - Browser and client
  - CDN and edge
  - Reverse proxy
  - Application-local cache
  - Distributed cache
  - Latency and sharing
  - Invalidation boundary
  - Cache-key context

### Cache-Aside

- ID: `cache-aside`
- Route: `/system-design/fundamentals/cache-aside`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `caching`
- Practice problems: None currently mapped
- Major subtopics:
  - Read hit
  - Read miss
  - Database lookup
  - Populate cache
  - Delete on write
  - Cold start
  - Concurrent misses
  - Invalidation failure

### Read-Through Caching

- ID: `read-through`
- Route: `/system-design/fundamentals/read-through-caching`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `cache-aside`
- Practice problems: None currently mapped
- Major subtopics:
  - Cache-owned loading
  - Miss handling
  - Loader abstraction
  - Application simplicity
  - Cache-layer coupling
  - Operational complexity

### Write-Through Caching

- ID: `write-through`
- Route: `/system-design/fundamentals/write-through-caching`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `cache-aside`
- Practice problems: None currently mapped
- Major subtopics:
  - Synchronous cache update
  - Backing-store write
  - Warm reads
  - Write latency
  - Partial failure
  - Unused cached writes

### Write-Behind / Write-Back

- ID: `write-behind`
- Route: `/system-design/fundamentals/write-behind-write-back`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Sequence
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `write-through`
- Practice problems: None currently mapped
- Major subtopics:
  - Deferred persistence
  - Buffering
  - Write coalescing
  - Batching
  - Durability risk
  - Ordering
  - Retries
  - Failure recovery

### TTL & Expiration

- ID: `cache-ttl`
- Route: `/system-design/fundamentals/ttl-and-expiration`
- Priority: Must Know
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `caching`
- Practice problems: None currently mapped
- Major subtopics:
  - Freshness window
  - Hit rate
  - Short TTL
  - Long TTL
  - No TTL
  - Expiration
  - TTL selection
  - TTL jitter

### Eviction Policies

- ID: `cache-eviction`
- Route: `/system-design/fundamentals/eviction-policies`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `cache-ttl`
- Practice problems: None currently mapped
- Major subtopics:
  - Eviction vs expiration
  - Memory limits
  - LRU
  - LFU
  - Random eviction
  - Recency
  - Frequency
  - Working-set fit

### Cache Invalidation

- ID: `cache-invalidation`
- Route: `/system-design/fundamentals/cache-invalidation`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `cache-aside`
- Practice problems: None currently mapped
- Major subtopics:
  - TTL-only
  - Delete on write
  - Update cache on write
  - Versioned keys
  - Event-driven invalidation
  - Manual purge
  - Invalidation race
  - Ordering and version checks
  - Missed events

### Cache Stampede / Thundering Herd

- ID: `cache-stampedes`
- Route: `/system-design/fundamentals/cache-stampede-thundering-herd`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Custom interactive — Compare a hot-key expiry with and without request coalescing; include an accessible table and static Mermaid fallback.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `cache-aside`, `cache-ttl`
- Practice problems: None currently mapped
- Major subtopics:
  - Many concurrent misses
  - Origin overload
  - Request coalescing
  - Single flight
  - Per-key locks
  - TTL jitter
  - Refresh before expiry
  - Stale-while-revalidate

### Hot Keys

- ID: `hot-keys`
- Route: `/system-design/fundamentals/hot-keys`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `caching`, `sharding`
- Practice problems: None currently mapped
- Major subtopics:
  - Skewed access
  - Even keys vs uneven traffic
  - Node pressure
  - Local caches
  - Replicated copies
  - Request coalescing
  - Key splitting
  - Detection

### Cache Penetration

- ID: `cache-penetration`
- Route: `/system-design/fundamentals/cache-penetration`
- Priority: Advanced
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `cache-aside`
- Practice problems: None currently mapped
- Major subtopics:
  - Nonexistent-key requests
  - Repeated misses
  - Negative caching
  - Short negative TTL
  - Creation visibility
  - Abuse and cardinality
  - Bloom-filter mitigation

### Cache Warming

- ID: `cache-warming`
- Route: `/system-design/fundamentals/cache-warming`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `caching`
- Practice problems: None currently mapped
- Major subtopics:
  - Cold starts
  - Deployments and failover
  - Lazy warming
  - Preloading hot keys
  - Snapshot or transfer
  - Gradual traffic shift
  - Origin protection
  - Warming trade-offs

### Distributed Caching

- ID: `distributed-caching`
- Route: `/system-design/fundamentals/distributed-caching`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `caching`, `consistent-hashing`
- Practice problems: `distributed-cache`
- Major subtopics:
  - Shared cache cluster
  - Partitioning
  - Replication
  - Node failure
  - Rebalancing
  - Network latency
  - Hot keys
  - Local vs distributed
  - L1 and L2 cache

### Cache Failure Modes

- ID: `cache-failure-modes`
- Route: `/system-design/fundamentals/cache-failure-modes`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `cache-aside`
- Practice problems: `distributed-cache`
- Major subtopics:
  - Cache unavailable
  - Database overload after outage
  - Mass expiration
  - Cold cache
  - Stale data
  - Hot keys
  - Memory pressure and eviction
  - Network timeout
  - Requirement-driven fallback
  - Gradual recovery

### Redis for Caching

- ID: `redis-caching`
- Route: `/system-design/fundamentals/redis-for-caching`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `caching`
- Practice problems: None currently mapped
- Major subtopics:
  - Redis is one implementation
  - Keys and data structures
  - TTL
  - Memory limits
  - Eviction policy
  - Replication and high availability
  - Persistence choices
  - Cluster and partitioning
  - Non-cache use cases
  - Operational cautions

## Messaging, Queues & Streaming

Decouple work and reason precisely about ordering, retries, delivery, and replay.

### Synchronous vs Asynchronous Processing

- ID: `sync-vs-async`
- Route: `/system-design/fundamentals/synchronous-vs-asynchronous-processing`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Critical request path
  - Latency accumulation
  - Failure propagation
  - Background work
  - Delayed failure contract
  - Choosing a boundary

### Message Queues

- ID: `message-queues`
- Route: `/system-design/fundamentals/message-queues`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `sync-vs-async`
- Practice problems: `notification-service`, `chat-system`, `job-scheduler`, `web-crawler`, `distributed-queue`, `log-aggregation`, `iot-ingestion`, `stream-processing-platform`
- Major subtopics:
  - Producer
  - Message
  - Queue
  - Consumer
  - Acknowledgement
  - Retention
  - Queue depth
  - Backlog growth
  - Worker scaling
  - Burst absorption
  - Eventual overload

### Producers, Consumers & Worker Pools

- ID: `producers-consumers`
- Route: `/system-design/fundamentals/producers-consumers-and-worker-pools`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - Worker pools
  - Competing consumers
  - Horizontal scaling
  - Concurrency limits
  - Receive-process-acknowledge
  - Worker crashes
  - Visibility timeout
  - Slow jobs
  - Poison jobs
  - Fairness

### Queue vs Pub/Sub

- ID: `queue-vs-pubsub`
- Route: `/system-design/fundamentals/queue-vs-pub-sub`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - Competing consumers
  - Fan-out
  - Work ownership
  - Independent subscriptions
  - Backlog ownership
  - Combined models
  - Use-case selection

### Pub/Sub

- ID: `pub-sub`
- Route: `/system-design/fundamentals/pub-sub`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `queue-vs-pubsub`
- Practice problems: `notification-service`, `chat-system`
- Major subtopics:
  - Publisher
  - Topic
  - Subscription
  - Subscriber
  - Fan-out
  - Independent retry
  - Video upload example
  - Eventual consistency
  - Schema evolution
  - Debugging

### Streams / Append-Only Logs

- ID: `event-streaming`
- Route: `/system-design/fundamentals/event-streaming`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Must Know, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Important
- Prerequisites: `pub-sub`
- Practice problems: `metrics-platform`, `event-analytics`, `log-aggregation`, `iot-ingestion`, `stream-processing-platform`
- Major subtopics:
  - Append-only history
  - Partition order
  - Retention
  - Offsets
  - Checkpoints
  - Replay
  - Independent readers

### Queue vs Stream

- ID: `queue-vs-stream`
- Route: `/system-design/fundamentals/queue-vs-stream`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `event-streaming`
- Practice problems: None currently mapped
- Major subtopics:
  - Pending work
  - Retained history
  - Replay
  - Consumer progress
  - Independent readers
  - Ordering
  - Retention

### Partitions & Partition Keys

- ID: `partitions`
- Route: `/system-design/fundamentals/partitions-and-partition-keys`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `event-streaming`, `sharding`
- Practice problems: `kafka-platform`
- Major subtopics:
  - Partitioned topic
  - Parallelism
  - Partition key
  - Partition ordering
  - Entity ordering
  - Chat conversation key
  - Account key
  - Hot partitions
  - Bad low-cardinality keys

### Consumer Groups

- ID: `consumer-groups`
- Route: `/system-design/fundamentals/consumer-groups`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Custom interactive — Add or remove group members, reassign four partitions, expose idle consumers, and retain an accessible table plus Mermaid fallback.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `partitions`
- Practice problems: `kafka-platform`
- Major subtopics:
  - Partition ownership
  - Group parallelism
  - More consumers than partitions
  - Rebalancing
  - Consumer joins
  - Consumer crashes
  - Idle members
  - Processing interruption

### Ordering Guarantees

- ID: `message-ordering`
- Route: `/system-design/fundamentals/ordering-guarantees`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `partitions`
- Practice problems: None currently mapped
- Major subtopics:
  - Global ordering
  - Partition ordering
  - Entity ordering
  - Order-event sequence
  - Partition-key discipline
  - Multiple producers
  - Retries
  - External side effects

### Delivery Semantics

- ID: `delivery-semantics`
- Route: `/system-design/fundamentals/delivery-semantics`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`
- Practice problems: `distributed-queue`
- Major subtopics:
  - At-most-once
  - At-least-once
  - Exactly-once scope
  - Acknowledgement failure
  - Duplicate processing
  - External side effects
  - Kafka processing boundary

### Idempotent Consumers

- ID: `idempotent-consumers`
- Route: `/system-design/fundamentals/idempotent-consumers`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `delivery-semantics`, `idempotent-apis`
- Practice problems: None currently mapped
- Major subtopics:
  - Duplicate delivery
  - Event identity
  - Business idempotency key
  - Processed-event record
  - Unique constraint
  - Atomic side effect
  - Race conditions
  - Retention window

### Retries & Exponential Backoff

- ID: `message-retries`
- Route: `/system-design/fundamentals/retries-and-exponential-backoff`
- Priority: Must Know
- Estimated time: 15 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `delivery-semantics`
- Practice problems: None currently mapped
- Major subtopics:
  - Retryable failures
  - Permanent failures
  - Exponential backoff
  - Jitter
  - Retry storms
  - Attempt limits
  - Retry metadata

### Dead-Letter Queues

- ID: `dead-letter-queues`
- Route: `/system-design/fundamentals/dead-letter-queues`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `message-retries`
- Practice problems: None currently mapped
- Major subtopics:
  - Poison messages
  - Retry exhaustion
  - Inspection
  - Alerting
  - Remediation
  - Retention
  - Replay and redrive
  - Operational ownership
  - Ordering impact

### Message Deduplication

- ID: `deduplication`
- Route: `/system-design/fundamentals/message-deduplication`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `idempotent-consumers`
- Practice problems: None currently mapped
- Major subtopics:
  - Event IDs
  - Business keys
  - Unique constraints
  - Idempotency records
  - Deduplication window
  - Storage growth
  - Atomicity
  - Deduplication vs idempotency

### Backpressure

- ID: `backpressure`
- Route: `/system-design/fundamentals/backpressure`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`
- Practice problems: `distributed-queue`, `kafka-platform`
- Major subtopics:
  - Producer-consumer imbalance
  - Backlog growth
  - Producer throttling
  - Bounded queues
  - Consumer autoscaling
  - Batching
  - Flow control
  - Partition pause
  - Load shedding
  - Recovery

### Event-Driven Architecture

- ID: `event-driven-architecture`
- Route: `/system-design/fundamentals/event-driven-architecture`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `pub-sub`, `delivery-semantics`
- Practice problems: None currently mapped
- Major subtopics:
  - Events
  - Commands vs events
  - Event bus
  - Loose runtime coupling
  - Independent consumers
  - Event contracts
  - Schema evolution
  - Tracing
  - Testing complexity

### Event Sourcing

- ID: `event-sourcing`
- Route: `/system-design/fundamentals/event-sourcing`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `event-streaming`, `transactions`
- Practice problems: None currently mapped
- Major subtopics:
  - Event log as source of truth
  - State reconstruction
  - Audit trail
  - Temporal queries
  - Snapshots
  - Projection consistency
  - Event evolution
  - Event sourcing vs event-driven

### Transactional Outbox

- ID: `transactional-outbox`
- Route: `/system-design/fundamentals/transactional-outbox`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `transactions`, `message-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - Dual-write problem
  - Database transaction
  - Business row
  - Outbox row
  - Outbox relay
  - Publish progress
  - Relay crash
  - Duplicate events
  - Cleanup and lag

### Change Data Capture

- ID: `change-data-capture`
- Route: `/system-design/fundamentals/change-data-capture`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Must Know, ml=Important
- Prerequisites: `replication`, `event-streaming`
- Practice problems: None currently mapped
- Major subtopics:
  - Database change log
  - CDC connector
  - Downstream stream
  - Search indexing
  - Analytics
  - Cache invalidation
  - Connector lag
  - Schema evolution
  - Delete and tombstone semantics
  - Row change vs domain event

### Kafka Fundamentals

- ID: `kafka`
- Route: `/system-design/fundamentals/kafka-concepts`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Custom interactive — Use the published four-partition consumer-group model to teach assignment, rebalancing, and the parallelism ceiling, with Mermaid and table fallbacks.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `partitions`, `consumer-groups`, `delivery-semantics`
- Practice problems: `kafka-platform`, `event-analytics`
- Major subtopics:
  - Cluster
  - Broker
  - Topic
  - Partition
  - Producer
  - Consumer
  - Consumer group
  - Offset
  - Retention
  - Replay
  - Replication
  - Raw volume estimation
  - Partition-count inputs
  - When Kafka is overkill

### Kafka Partitions & Replication

- ID: `kafka-partitions-replication`
- Route: `/system-design/fundamentals/kafka-partitions-and-replication`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Important
- Prerequisites: `kafka`
- Practice problems: None currently mapped
- Major subtopics:
  - Topic partitions
  - Partition keys
  - Partition ordering
  - Leaders
  - Followers and replicas
  - Broker placement
  - Producer acknowledgements
  - In-sync replication
  - Failure tolerance
  - Durability caveats

### Kafka Consumer Groups & Offsets

- ID: `kafka-consumer-groups-offsets`
- Route: `/system-design/fundamentals/kafka-consumer-groups-and-offsets`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Important
- Prerequisites: `kafka`, `consumer-groups`
- Practice problems: None currently mapped
- Major subtopics:
  - Partition assignment
  - Offsets
  - Committed position
  - Restart and resume
  - Replay
  - Consumer lag
  - Lag calculation
  - Rebalancing
  - Duplicate work around commits

### Kafka Delivery / Processing Guarantees

- ID: `kafka-delivery-guarantees`
- Route: `/system-design/fundamentals/kafka-delivery-processing-guarantees`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `kafka`, `idempotent-consumers`
- Practice problems: None currently mapped
- Major subtopics:
  - Producer retries
  - Producer acknowledgements
  - Idempotent producer
  - Transactions
  - Offset commits
  - At-least-once processing
  - Kafka read-process-write
  - External side effects
  - Exactly-once scope

### Kafka vs Traditional Queues

- ID: `kafka-vs-queues`
- Route: `/system-design/fundamentals/kafka-vs-traditional-queues`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `kafka`, `queue-vs-stream`
- Practice problems: None currently mapped
- Major subtopics:
  - Retained history
  - Replay
  - Independent groups
  - Work dispatch
  - Visibility semantics
  - Delayed jobs
  - Priorities
  - Routing
  - Infrastructure simplicity

### RabbitMQ / SQS — Interview Comparison

- ID: `rabbitmq-sqs`
- Route: `/system-design/fundamentals/rabbitmq-sqs-interview-comparison`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `message-queues`, `kafka-vs-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - RabbitMQ broker
  - Exchanges and routing
  - Queues and acknowledgements
  - SQS managed queue
  - Visibility timeout
  - Redelivery
  - Kafka retained log
  - Requirement-based selection

### Apache Flink — Conceptual Bridge

- ID: `flink`
- Route: `/system-design/fundamentals/apache-flink-conceptual-bridge`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Must Know, ml=Important
- Prerequisites: `kafka`, `backpressure`
- Practice problems: `event-analytics`
- Major subtopics:
  - Kafka to Flink to sink
  - Stateful processing
  - Windows
  - Event time
  - Watermarks
  - Late events
  - Checkpoints
  - Recoverable state
  - Role relevance
  - When a processor is justified

## Reliability & Distributed Systems

Handle partial failure, overload, coordination, and cross-region correctness.

### Failure Thinking in System Design

- ID: `failure-thinking`
- Route: `/system-design/patterns/failure-thinking-in-system-design`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Partial failure
  - Slow dependencies
  - Lost responses
  - Duplicate requests
  - Stale replicas
  - Network partitions
  - Failure checklist

### Timeouts

- ID: `timeouts`
- Route: `/system-design/patterns/timeouts`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `failure-thinking`
- Practice problems: None currently mapped
- Major subtopics:
  - Bounded waiting
  - Connection and request timeout
  - End-to-end deadline
  - Timeout budget
  - Latency distributions
  - Too short vs too long

### Retries

- ID: `retries`
- Route: `/system-design/patterns/retries`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `timeouts`
- Practice problems: `notification-service`, `payment-system`
- Major subtopics:
  - Transient failures
  - Retryable outcomes
  - Retry amplification
  - Attempt limit
  - Elapsed-time budget
  - Idempotency boundary

### Exponential Backoff & Jitter

- ID: `exponential-backoff-jitter`
- Route: `/system-design/patterns/exponential-backoff-and-jitter`
- Priority: Must Know
- Estimated time: 18 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `retries`
- Practice problems: None currently mapped
- Major subtopics:
  - Immediate retry
  - Exponential delay
  - Capping
  - Synchronized waves
  - Jitter
  - Retry timeline

### Idempotency

- ID: `idempotency`
- Route: `/system-design/patterns/idempotency`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `transactions`, `retries`
- Practice problems: `payment-system`
- Major subtopics:
  - Lost response ambiguity
  - Idempotency key
  - Request identity
  - Atomic claim
  - Concurrent duplicates
  - Result retention
  - Business identifiers

### Circuit Breakers

- ID: `circuit-breaker`
- Route: `/system-design/patterns/circuit-breaker`
- Priority: Important
- Estimated time: 22 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Must Know, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: `timeouts`, `retries`
- Practice problems: None currently mapped
- Major subtopics:
  - Closed
  - Open
  - Half-open
  - Recovery probes
  - Fallback
  - Circuit breaker vs retry
  - Threshold risks

### Bulkheads

- ID: `bulkheads`
- Route: `/system-design/patterns/bulkheads`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Must Know, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: `failure-thinking`
- Practice problems: None currently mapped
- Major subtopics:
  - Resource isolation
  - Worker pools
  - Connection pools
  - Queues
  - Tenant isolation
  - Isolation cost

### Graceful Degradation

- ID: `graceful-degradation`
- Route: `/system-design/patterns/graceful-degradation`
- Priority: Must Know
- Estimated time: 18 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `failure-thinking`
- Practice problems: None currently mapped
- Major subtopics:
  - Critical path
  - Optional dependency
  - Fallback
  - Stale data
  - Simplified response
  - Fallback testing

### Load Shedding

- ID: `load-shedding`
- Route: `/system-design/patterns/load-shedding`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Important, ml=Must Know
- Prerequisites: `graceful-degradation`, `rate-limiting`
- Practice problems: None currently mapped
- Major subtopics:
  - Capacity limit
  - Admission control
  - Priority
  - Fairness
  - Controlled rejection
  - Recovery

### Backpressure for Reliability

- ID: `backpressure-reliability`
- Route: `/system-design/patterns/backpressure-for-reliability`
- Priority: Important
- Estimated time: 12 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Important
- Prerequisites: `backpressure`, `load-shedding`
- Practice problems: None currently mapped
- Major subtopics:
  - Slow upstream
  - Bounded buffers
  - Backpressure vs load shedding
  - Combined protection
  - Messaging cross-link

### Health Checks

- ID: `health-checks`
- Route: `/system-design/patterns/health-checks`
- Priority: Must Know
- Estimated time: 18 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `load-balancing`
- Practice problems: None currently mapped
- Major subtopics:
  - Liveness
  - Readiness
  - Dependency depth
  - False positives
  - Routing integration
  - Health-check cascade

### Failover

- ID: `failover`
- Route: `/system-design/patterns/failover`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `replication`, `health-checks`
- Practice problems: None currently mapped
- Major subtopics:
  - Failure detection
  - Promotion authority
  - Traffic shift
  - Replication lag
  - Split brain
  - Failback

### Distributed Locks

- ID: `distributed-locks`
- Route: `/system-design/patterns/distributed-locks`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Must Know, senior=Important, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `transactions`, `consistency-models`
- Practice problems: `job-scheduler`, `ticketmaster`
- Major subtopics:
  - Mutual exclusion
  - Owner identity
  - Acquire and release
  - Crash handling
  - Expiration
  - Simpler alternatives

### Leases & Fencing Tokens

- ID: `leases-fencing-tokens`
- Route: `/system-design/patterns/leases-and-fencing-tokens`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Custom interactive — Accessible lease-expiry timeline showing a paused stale owner rejected by an increasing fencing token.
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Must Know
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Must Know, data=Advanced, ml=Advanced
- Prerequisites: `distributed-locks`
- Practice problems: None currently mapped
- Major subtopics:
  - Lease expiry
  - Renewal
  - Paused owner
  - Increasing token
  - Resource-side rejection
  - Applicability boundary

### Leader Election

- ID: `leader-election`
- Route: `/system-design/patterns/leader-election`
- Priority: Important
- Estimated time: 22 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: `failover`, `leases-fencing-tokens`
- Practice problems: None currently mapped
- Major subtopics:
  - Coordinator role
  - Failure detection
  - Replacement
  - Term or epoch
  - Stale leader
  - Majority

### Quorums

- ID: `quorums`
- Route: `/system-design/patterns/quorums`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: `replication`
- Practice problems: None currently mapped
- Major subtopics:
  - Five-node majority
  - Overlap intuition
  - N R W model
  - Conditional R plus W relation
  - Latency
  - Availability trade-off

### Consensus — Interview Intuition

- ID: `distributed-consensus`
- Route: `/system-design/patterns/distributed-consensus`
- Priority: Advanced
- Estimated time: 28 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Must Know
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Must Know, data=Advanced, ml=Advanced
- Prerequisites: `leader-election`, `quorums`
- Practice problems: None currently mapped
- Major subtopics:
  - Agreement problem
  - Incomplete views
  - Delayed messages
  - Replicated decisions
  - Consensus vs replication
  - Interview boundary

### Raft — Advanced

- ID: `raft`
- Route: `/system-design/patterns/raft`
- Priority: Advanced
- Estimated time: 35 minutes
- Visual: Sequence
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Important
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Must Know, data=Advanced, ml=Advanced
- Prerequisites: `distributed-consensus`
- Practice problems: None currently mapped
- Major subtopics:
  - Leader and followers
  - Candidate
  - Terms
  - Election
  - Replicated log
  - Majority commit
  - Leader failure

### Distributed Transactions

- ID: `distributed-transactions`
- Route: `/system-design/patterns/distributed-transactions`
- Priority: Important
- Estimated time: 22 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `transactions`, `failure-thinking`
- Practice problems: None currently mapped
- Major subtopics:
  - Local boundary
  - Cross-service invariant
  - Independent failure
  - Network ambiguity
  - Rollback limits
  - Simpler boundaries

### Two-Phase Commit

- ID: `two-phase-commit`
- Route: `/system-design/patterns/two-phase-commit`
- Priority: Important
- Estimated time: 22 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `distributed-transactions`
- Practice problems: None currently mapped
- Major subtopics:
  - Prepare
  - Commit or abort
  - Coordinator
  - Participants
  - Prepared blocking
  - Availability trade-off

### Saga Pattern

- ID: `saga`
- Route: `/system-design/patterns/saga-pattern`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Sequence
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `distributed-transactions`, `message-queues`, `idempotency`
- Practice problems: `payment-system`
- Major subtopics:
  - Local transactions
  - Compensation
  - Compensation vs rollback
  - Orchestration
  - Choreography
  - Workflow recovery
  - Irreversible effects

### Multi-Region Architecture

- ID: `multi-region`
- Route: `/system-design/patterns/multi-region-architecture`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Must Know, senior=Important, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `replication`, `failover`, `consistency-models`
- Practice problems: None currently mapped
- Major subtopics:
  - Requirement justification
  - Global routing
  - Replication lag
  - Write ownership
  - Conflict
  - Data locality
  - Regional capacity

### Active-Passive vs Active-Active

- ID: `active-passive-active-active`
- Route: `/system-design/patterns/active-passive-vs-active-active`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: `multi-region`
- Practice problems: None currently mapped
- Major subtopics:
  - Standby region
  - Failover time
  - Both regions serving
  - Write conflicts
  - Entity home region
  - Partitioned ownership

### Disaster Recovery

- ID: `disaster-recovery`
- Route: `/system-design/patterns/disaster-recovery`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `multi-region`
- Practice problems: None currently mapped
- Major subtopics:
  - High availability vs recovery
  - Backups vs replication
  - Snapshots
  - Log backup
  - Cold and warm standby
  - Restore testing
  - Failover drills

### RPO & RTO

- ID: `rpo-rto`
- Route: `/system-design/patterns/rpo-and-rto`
- Priority: Important
- Estimated time: 18 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `disaster-recovery`
- Practice problems: None currently mapped
- Major subtopics:
  - Recovery point objective
  - Recovery time objective
  - Business tolerance
  - Cost trade-off
  - Scenario-specific objective

### Designing for Partial Failure

- ID: `partial-failure`
- Route: `/system-design/patterns/designing-for-partial-failure`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `graceful-degradation`, `failover`, `saga`, `rpo-rto`
- Practice problems: None currently mapped
- Major subtopics:
  - Failure prioritization
  - Cache failure
  - Optional service failure
  - Replica lag
  - Broker failure
  - Region failure
  - Failure deep dive

## Observability & Security

Make designs diagnosable and protect their architectural trust boundaries.

### Observability

- ID: `observability`
- Route: `/system-design/production-engineering/observability`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Signals
  - Questions from telemetry
  - Instrumentation boundaries
  - Operational feedback

### Logs

- ID: `logs`
- Route: `/system-design/production-engineering/logs`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `observability`
- Practice problems: None currently mapped
- Major subtopics:
  - Structured logs
  - Context
  - Retention
  - Searchability
  - Cardinality

### Metrics

- ID: `metrics`
- Route: `/system-design/production-engineering/metrics`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `observability`
- Practice problems: `metrics-platform`
- Major subtopics:
  - Counters
  - Gauges
  - Histograms
  - Dimensions
  - Cardinality

### Distributed Tracing

- ID: `distributed-tracing`
- Route: `/system-design/production-engineering/distributed-tracing`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `observability`
- Practice problems: None currently mapped
- Major subtopics:
  - Trace
  - Span
  - Context propagation
  - Sampling
  - Critical path

### Correlation / Request IDs

- ID: `request-ids`
- Route: `/system-design/production-engineering/correlation-request-ids`
- Priority: Important
- Estimated time: 10 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `logs`
- Practice problems: None currently mapped
- Major subtopics:
  - Request identity
  - Propagation
  - Async boundaries
  - Debugging

### Alerts

- ID: `alerts`
- Route: `/system-design/production-engineering/alerts`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `metrics`
- Practice problems: None currently mapped
- Major subtopics:
  - Actionable conditions
  - Thresholds
  - Burn rate
  - Noise
  - Ownership

### Service Level Indicators

- ID: `slis`
- Route: `/system-design/production-engineering/service-level-indicators`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `metrics`
- Practice problems: None currently mapped
- Major subtopics:
  - Latency
  - Availability
  - Correctness
  - Freshness
  - User-centered signals

### Service Level Objectives

- ID: `slos`
- Route: `/system-design/production-engineering/service-level-objectives`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `slis`
- Practice problems: None currently mapped
- Major subtopics:
  - Objective
  - Window
  - Measurement
  - Trade-offs
  - SLA relationship

### Error Budgets

- ID: `error-budgets`
- Route: `/system-design/production-engineering/error-budgets`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Must Know
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `slos`
- Practice problems: None currently mapped
- Major subtopics:
  - Allowed unreliability
  - Burn rate
  - Release decisions
  - Senior-level trade-offs

### Authentication vs Authorization

- ID: `authn-authz`
- Route: `/system-design/production-engineering/authentication-vs-authorization`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Identity
  - Permissions
  - Enforcement points
  - Failure modes

### Sessions vs Tokens

- ID: `sessions-tokens`
- Route: `/system-design/production-engineering/sessions-vs-tokens`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `authn-authz`
- Practice problems: None currently mapped
- Major subtopics:
  - Server-side sessions
  - Bearer tokens
  - Revocation
  - Scaling
  - Risk

### JWT

- ID: `jwt`
- Route: `/system-design/production-engineering/jwt`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `sessions-tokens`
- Practice problems: None currently mapped
- Major subtopics:
  - Token structure
  - Verification
  - Expiration
  - Revocation trade-offs
  - Common misuse

### OAuth / OIDC

- ID: `oauth-oidc`
- Route: `/system-design/production-engineering/oauth-oidc`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `authn-authz`, `http`
- Practice problems: None currently mapped
- Major subtopics:
  - Delegated authorization
  - Identity layer
  - Actors
  - Authorization code flow
  - Architectural boundaries

### TLS

- ID: `tls`
- Route: `/system-design/production-engineering/tls`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `http`
- Practice problems: None currently mapped
- Major subtopics:
  - Channel security
  - Certificates
  - Handshake intuition
  - Termination
  - Trust

### Encryption at Rest and in Transit

- ID: `encryption`
- Route: `/system-design/production-engineering/encryption-at-rest-and-in-transit`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `tls`
- Practice problems: None currently mapped
- Major subtopics:
  - At rest
  - In transit
  - Key boundaries
  - Threat model

### Secrets Management

- ID: `secrets-management`
- Route: `/system-design/production-engineering/secrets-management`
- Priority: Important
- Estimated time: 15 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `authn-authz`
- Practice problems: None currently mapped
- Major subtopics:
  - Storage
  - Rotation
  - Access
  - Audit
  - Distribution

### API Abuse / DDoS

- ID: `api-abuse-ddos`
- Route: `/system-design/production-engineering/api-abuse-ddos`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `rate-limiting`, `cdn`
- Practice problems: None currently mapped
- Major subtopics:
  - Rate limiting
  - WAF
  - CDN and edge protection
  - Load shedding
  - Layered defenses

### Multi-Tenant Authorization Boundaries

- ID: `tenant-authorization`
- Route: `/system-design/production-engineering/multi-tenant-authorization-boundaries`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `authn-authz`, `data-modeling`
- Practice problems: None currently mapped
- Major subtopics:
  - Tenant identity
  - Data isolation
  - Authorization enforcement
  - Cache keys
  - Audit

## Common Architecture Patterns

Connect canonical concepts into repeatable interview moves without duplicating their lessons.

### Scaling Reads

- ID: `scaling-reads`
- Route: `/system-design/patterns/scaling-reads`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `replication`, `caching`
- Practice problems: None currently mapped
- Major subtopics:
  - Read replicas
  - Caching
  - CDN
  - Partitioning
  - Staleness

### Scaling Writes

- ID: `scaling-writes`
- Route: `/system-design/patterns/scaling-writes`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `sharding`, `message-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - Partitioning
  - Batching
  - Asynchronous writes
  - Contention
  - Durability

### Read-Heavy Systems

- ID: `read-heavy-systems`
- Route: `/system-design/patterns/read-heavy-systems`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `scaling-reads`
- Practice problems: None currently mapped
- Major subtopics:
  - Access skew
  - Cache hierarchy
  - Read replicas
  - Freshness
  - Cost

### Write-Heavy Systems

- ID: `write-heavy-systems`
- Route: `/system-design/patterns/write-heavy-systems`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `scaling-writes`
- Practice problems: None currently mapped
- Major subtopics:
  - Write path
  - Append-only storage
  - Partitioning
  - Backpressure
  - Compaction

### Fan-Out

- ID: `fan-out`
- Route: `/system-design/patterns/fan-out`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Custom interactive — Animate how one write amplifies into subscriber, storage, and delivery work.
- Publishing phase: 2
- Research status: draft-ready
- Published: No
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `pub-sub`
- Practice problems: `news-feed`
- Major subtopics:
  - Fan-out
  - Amplification
  - Parallelism
  - Partial failure
  - Backpressure

### Fan-Out-on-Write vs Fan-Out-on-Read

- ID: `fanout-read-write`
- Route: `/system-design/patterns/fan-out-on-write-vs-fan-out-on-read`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `fan-out`
- Practice problems: `news-feed`
- Major subtopics:
  - Precomputation
  - Read assembly
  - Celebrity problem
  - Hybrid design
  - Freshness

### Background Jobs

- ID: `background-jobs`
- Route: `/system-design/patterns/background-jobs`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - Enqueue
  - Worker
  - Retry
  - Progress
  - Completion

### Long-Running Jobs

- ID: `long-running-jobs`
- Route: `/system-design/patterns/long-running-jobs`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `background-jobs`
- Practice problems: None currently mapped
- Major subtopics:
  - State machine
  - Checkpointing
  - Progress
  - Cancellation
  - Recovery

### Batch vs Stream Processing

- ID: `batch-vs-streaming`
- Route: `/system-design/patterns/batch-vs-stream-processing`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Must Know, ml=Must Know
- Prerequisites: `event-streaming`
- Practice problems: `feature-store`
- Major subtopics:
  - Bounded data
  - Unbounded data
  - Latency
  - Cost
  - Hybrid architectures

### CQRS

- ID: `cqrs`
- Route: `/system-design/patterns/cqrs`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `transactions`, `event-driven-architecture`
- Practice problems: None currently mapped
- Major subtopics:
  - Command model
  - Query model
  - Projection
  - Consistency lag
  - When complexity pays

### Handling Hot Partitions

- ID: `handling-hot-partitions`
- Route: `/system-design/patterns/handling-hot-partitions`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `sharding`, `partitions`
- Practice problems: None currently mapped
- Major subtopics:
  - Detection
  - Shard-key redesign
  - Key salting
  - Adaptive partitioning
  - Trade-offs

### Handling Contention

- ID: `handling-contention`
- Route: `/system-design/patterns/handling-contention`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `isolation-levels`
- Practice problems: None currently mapped
- Major subtopics:
  - Optimistic control
  - Pessimistic control
  - Queues
  - Partitioning
  - Conflict resolution

### Multi-Step Workflows

- ID: `multi-step-workflows`
- Route: `/system-design/patterns/multi-step-workflows`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `saga`, `background-jobs`
- Practice problems: None currently mapped
- Major subtopics:
  - Workflow state
  - Orchestration
  - Retries
  - Compensation
  - Observability

### Large File Processing

- ID: `large-file-processing`
- Route: `/system-design/patterns/large-file-processing`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: researched
- Published: No
- Source coverage: primary=yes, interview=no, verification pending=yes
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `large-file-uploads`, `background-jobs`
- Practice problems: None currently mapped
- Major subtopics:
  - Upload
  - Chunking
  - Queue
  - Workers
  - Result publication

## Specialized Building Blocks

Add specialized components only when a product requirement justifies them.

### Full-Text Search

- ID: `full-text-search`
- Route: `/system-design/specialized/full-text-search`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `database-indexes`
- Practice problems: `search-engine`
- Major subtopics:
  - Search requirement
  - Tokenization and analysis
  - Candidate retrieval
  - Ranking
  - Filters and highlighting
  - Primary database vs search index
  - Index freshness
  - CDC and outbox synchronization

### Inverted Indexes

- ID: `inverted-indexes`
- Route: `/system-design/specialized/inverted-indexes`
- Priority: Must Know
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `full-text-search`
- Practice problems: None currently mapped
- Major subtopics:
  - Term to document mapping
  - Document IDs
  - Term frequency
  - Field information
  - Positions
  - Phrase search boundary

### Elasticsearch / OpenSearch Concepts

- ID: `search-engine-concepts`
- Route: `/system-design/specialized/elasticsearch-opensearch-concepts`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Must Know, fullstack=Important, infrastructure=Important, data=Must Know, ml=Important
- Prerequisites: `inverted-indexes`, `sharding`
- Practice problems: None currently mapped
- Major subtopics:
  - Index and document
  - Primary shard
  - Replica shard
  - Distributed query
  - Fan-out and merge
  - Indexing pipeline
  - Good-fit workloads
  - Transactional-store boundary

### Search Autocomplete

- ID: `search-autocomplete`
- Route: `/system-design/specialized/search-autocomplete`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `full-text-search`, `caching`
- Practice problems: `search-autocomplete`
- Major subtopics:
  - Prefix requirement
  - Small-scale database prefix
  - Dedicated prefix index
  - Popularity ranking
  - Recency and locale
  - Personalization
  - Offline aggregation
  - Freshness vs complexity

### Tries / Prefix Search

- ID: `tries-prefix-search`
- Route: `/system-design/specialized/tries-prefix-search`
- Priority: Important
- Estimated time: 18 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `search-autocomplete`
- Practice problems: None currently mapped
- Major subtopics:
  - Shared prefixes
  - Prefix traversal
  - Candidate suggestions
  - Memory cost
  - Updates
  - Ranking and distribution boundary

### Geospatial Search

- ID: `geospatial-search`
- Route: `/system-design/specialized/geospatial-search`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Custom interactive — Conceptual grid showing a user cell, neighbor expansion, candidate drivers, radius, and exact-distance filtering.
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `database-indexes`, `sharding`
- Practice problems: `ride-sharing`, `nearby-search`
- Major subtopics:
  - Nearby-entity requirement
  - Candidate reduction
  - Spatial cells
  - Neighbor expansion
  - Exact distance filter
  - Moving entities
  - Dense-region hot spots

### Geohashing

- ID: `geohashing`
- Route: `/system-design/specialized/geohashing`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `geospatial-search`
- Practice problems: None currently mapped
- Major subtopics:
  - Coordinate encoding
  - Hierarchical prefix
  - Precision
  - Neighbor cells
  - Boundary problem
  - Exact filtering

### Quadtrees / Spatial Partitioning

- ID: `quadtrees`
- Route: `/system-design/specialized/quadtrees-spatial-partitioning`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Important
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Advanced, ml=Advanced
- Prerequisites: `geospatial-search`
- Practice problems: None currently mapped
- Major subtopics:
  - Recursive four-way split
  - Adaptive density
  - Tree traversal
  - Moving objects
  - Rebalancing
  - Distributed ownership
  - Geohash comparison

### Notification Systems

- ID: `notification-delivery`
- Route: `/system-design/specialized/notification-delivery`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`, `retries`, `rate-limiting`
- Practice problems: `notification-service`
- Major subtopics:
  - Push email SMS and in-app
  - Preferences
  - Templates and localization
  - Channel queues
  - Provider limits
  - Retries and idempotency
  - Expiration
  - Delivery status

### Job Schedulers

- ID: `job-schedulers`
- Route: `/system-design/specialized/job-schedulers`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `background-jobs`, `distributed-locks`
- Practice problems: `job-scheduler`
- Major subtopics:
  - Queue vs scheduler
  - Schedule storage
  - Due-time lookup
  - Time buckets
  - Ownership and failover
  - Duplicate execution
  - Recurring jobs
  - Clock and time zone
  - Missed jobs

### Leaderboards / Top-K

- ID: `leaderboards`
- Route: `/system-design/specialized/leaderboards-top-k`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `caching`
- Practice problems: `leaderboard`
- Major subtopics:
  - Score and member
  - Sorted structure
  - Top K
  - User rank
  - Global and regional
  - Friends leaderboard
  - Time windows
  - Approximate heavy hitters

### Distributed Counters

- ID: `distributed-counters`
- Route: `/system-design/specialized/distributed-counters`
- Priority: Important
- Estimated time: 22 minutes
- Visual: Text only
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Important
- Prerequisites: `sharding`, `consistency-models`
- Practice problems: None currently mapped
- Major subtopics:
  - Hot counter
  - Atomic counter
  - Sharded counter
  - Local aggregation
  - Batched updates
  - Read aggregation
  - Exact vs approximate

### Web Crawlers

- ID: `web-crawling`
- Route: `/system-design/specialized/web-crawling`
- Priority: Must Know
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `message-queues`, `rate-limiting`
- Practice problems: `web-crawler`
- Major subtopics:
  - Seeds
  - URL frontier
  - Fetchers
  - Parser
  - Extracted links
  - URL deduplication
  - Content deduplication
  - Politeness
  - Priority and freshness
  - Retries

### Media Processing / Transcoding

- ID: `media-processing`
- Route: `/system-design/specialized/media-processing-transcoding`
- Priority: Must Know
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `object-storage`, `background-jobs`, `pub-sub`
- Practice problems: `video-streaming`
- Major subtopics:
  - Upload and object storage
  - Event fan-out
  - Transcode jobs
  - Renditions
  - Chunk parallelism
  - Retry per segment
  - Finalization
  - CDN publication

### Bloom Filters

- ID: `bloom-filters`
- Route: `/system-design/specialized/bloom-filters`
- Priority: Important
- Estimated time: 20 minutes
- Visual: Custom interactive — Small schematic bit-array visual showing inserted hashes, definitely absent, and possibly present outcomes.
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Important, ml=Important
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Probabilistic membership
  - Bit array
  - Multiple hashes
  - Definitely absent
  - Possibly present
  - False positives
  - No false negatives under stated assumptions
  - Use-case boundary

### HyperLogLog

- ID: `hyperloglog`
- Route: `/system-design/specialized/hyperloglog`
- Priority: Advanced
- Estimated time: 15 minutes
- Visual: Comparison
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Must Know, ml=Advanced
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Distinct-count problem
  - Approximate cardinality
  - Memory trade-off
  - Statistical error
  - Merge
  - Exactness boundary

### Count-Min Sketch

- ID: `count-min-sketch`
- Route: `/system-design/specialized/count-min-sketch`
- Priority: Advanced
- Estimated time: 18 minutes
- Visual: Comparison
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Must Know, ml=Advanced
- Prerequisites: None
- Practice problems: None currently mapped
- Major subtopics:
  - Frequency estimation
  - Rows and hashes
  - Limited memory
  - Overestimation
  - Heavy hitters
  - Exactness boundary

### Collaborative Editing

- ID: `collaborative-editing`
- Route: `/system-design/specialized/collaborative-editing`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Sequence
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Important
- Role relevance: backend=Advanced, fullstack=Important, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `realtime-communication`, `consistency-models`
- Practice problems: `collaborative-editor`
- Major subtopics:
  - Concurrent edits
  - Offline and reconnect
  - Convergence
  - Operation log
  - Persistent connection
  - Snapshots
  - Presence
  - OT and CRDT solution families

### Operational Transformation — Conceptual

- ID: `operational-transformation`
- Route: `/system-design/specialized/operational-transformation-conceptual`
- Priority: Advanced
- Estimated time: 18 minutes
- Visual: Sequence
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Important, infrastructure=Advanced, data=Advanced, ml=Advanced
- Prerequisites: `collaborative-editing`
- Practice problems: None currently mapped
- Major subtopics:
  - Concurrent operations
  - Ordering and coordination
  - Transformation
  - Convergence
  - Intention boundary
  - Implementation complexity

### CRDTs — Conceptual

- ID: `crdts`
- Route: `/system-design/specialized/crdts-conceptual`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Comparison
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Important, infrastructure=Important, data=Advanced, ml=Advanced
- Prerequisites: `collaborative-editing`, `consistency-models`
- Practice problems: None currently mapped
- Major subtopics:
  - Replicated data type
  - Concurrent updates
  - State-based and operation-based intuition
  - Convergence rules
  - Counters sets and sequences
  - Metadata and network cost
  - Product conflict semantics

### Vector Search

- ID: `vector-search`
- Route: `/system-design/specialized/vector-search`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Important, ml=Must Know
- Prerequisites: `database-indexes`
- Practice problems: `vector-search`
- Major subtopics:
  - Query embedding
  - Similarity retrieval
  - Exact search
  - Approximate nearest neighbor
  - Recall trade-off
  - Metadata filters
  - Index freshness
  - Authoritative-store boundary

### Embeddings Infrastructure — Conceptual

- ID: `embeddings-infrastructure`
- Route: `/system-design/specialized/embeddings-infrastructure-conceptual`
- Priority: Advanced
- Estimated time: 20 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Important, ml=Must Know
- Prerequisites: `vector-search`, `batch-vs-streaming`
- Practice problems: None currently mapped
- Major subtopics:
  - Offline document embeddings
  - Online query embeddings
  - Model dependency
  - Model and vector version
  - Re-embedding
  - Cost and latency
  - Index rebuild

### ML Inference / Model Serving

- ID: `model-serving`
- Route: `/system-design/specialized/model-serving`
- Priority: Advanced
- Estimated time: 30 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Advanced, ml=Must Know
- Prerequisites: `load-balancing`, `caching`, `background-jobs`
- Practice problems: `ml-inference-service`, `feature-store`, `recommendation-system`, `model-serving-platform`, `embedding-pipeline`
- Major subtopics:
  - Online inference
  - Async inference
  - Model loading
  - CPU and accelerator serving
  - Dynamic batching
  - Autoscaling
  - Model versioning
  - Canary and rollback
  - Fallback

### Feature Stores

- ID: `feature-stores`
- Route: `/system-design/specialized/feature-stores`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Advanced, data=Important, ml=Must Know
- Prerequisites: `model-serving`, `batch-vs-streaming`
- Practice problems: None currently mapped
- Major subtopics:
  - Training-serving skew
  - Feature pipeline
  - Offline historical store
  - Online low-latency store
  - Freshness
  - Point-in-time correctness
  - Feature definition reuse
  - When not needed

### Choosing Specialized Building Blocks

- ID: `choosing-specialized-blocks`
- Route: `/system-design/specialized/choosing-specialized-building-blocks`
- Priority: Must Know
- Estimated time: 25 minutes
- Visual: Comparison
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `full-text-search`, `geospatial-search`, `job-schedulers`, `bloom-filters`
- Practice problems: None currently mapped
- Major subtopics:
  - Requirement-first selection
  - Keyword search
  - Prefix suggestions
  - Nearby entities
  - Scheduled work
  - Rank and counters
  - Crawling and media
  - Probabilistic questions
  - Collaboration
  - Vector and ML boundaries

## Technology Deep Dives

Map interview concepts to concrete technology choices, strengths, and limitations.

### Redis

- ID: `redis`
- Route: `/system-design/technology/redis`
- Priority: Important
- Estimated time: 45 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `caching`, `cache-ttl`, `cache-eviction`, `distributed-caching`
- Practice problems: `rate-limiter`
- Major subtopics:
  - Shared low-latency state
  - Strings hashes lists sets sorted sets and streams
  - TTL and expiration
  - Memory limits and eviction
  - RDB and AOF persistence
  - Replication and failover
  - Cluster hash slots
  - Hot keys
  - Caching sessions counters and ranking
  - Rate limiting and temporary coordination
  - Failure fallback and database protection
  - Redis vs Memcached
  - When not to choose Redis
  - Candidate mistakes
  - Interviewer follow-ups

### Apache Kafka

- ID: `kafka-deep-dive`
- Route: `/system-design/technology/apache-kafka`
- Priority: Important
- Estimated time: 45 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Must Know, data=Must Know, ml=Important
- Prerequisites: `kafka`, `partitions`, `consumer-groups`, `delivery-semantics`, `backpressure`
- Practice problems: None currently mapped
- Major subtopics:
  - Retained partitioned event history
  - Brokers topics and partitions
  - Partition leaders and replicas
  - Producer acknowledgements
  - Consumer groups and partition parallelism
  - Offsets and independent progress
  - Replay and rebuilding read models
  - Retention and log compaction
  - Idempotent producers and transactions
  - External side-effect boundary
  - Lag hot partitions and rebalancing
  - Kafka vs work queues
  - When Kafka is overkill
  - Candidate mistakes
  - Interviewer follow-ups

### PostgreSQL

- ID: `postgresql`
- Route: `/system-design/technology/postgresql`
- Priority: Must Know
- Estimated time: 40 minutes
- Visual: Mermaid
- Publishing phase: 1
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Must Know, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Must Know, fullstack=Must Know, infrastructure=Must Know, data=Must Know, ml=Must Know
- Prerequisites: `sql-databases`, `database-indexes`, `transactions`, `isolation-levels`
- Practice problems: None currently mapped
- Major subtopics:
  - Relational transactional fit
  - Tables constraints and joins
  - Payment and reservation transactions
  - B-tree composite partial and unique indexes
  - MVCC intuition
  - Isolation and concurrency
  - Primary and standby replication
  - Asynchronous and synchronous configurations
  - Read replicas and lag
  - Scaling progression
  - JSON where useful
  - When PostgreSQL is not the best fit
  - Candidate mistakes
  - Interviewer follow-ups

### Amazon DynamoDB

- ID: `dynamodb`
- Route: `/system-design/technology/amazon-dynamodb`
- Priority: Important
- Estimated time: 40 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `key-value-stores`, `sharding`, `consistency-models`, `isolation-levels`
- Practice problems: None currently mapped
- Major subtopics:
  - Access-pattern-first modeling
  - Table item partition key and sort key
  - Partition-key distribution
  - Composite key shapes
  - Global and local secondary indexes
  - Eventually and strongly consistent reads
  - GSI propagation
  - Conditional writes
  - Transactions at interview depth
  - Hot partitions
  - Capacity and throttling concepts
  - DynamoDB vs PostgreSQL
  - When not to choose DynamoDB
  - Candidate mistakes
  - Interviewer follow-ups

### Elasticsearch / OpenSearch

- ID: `elasticsearch`
- Route: `/system-design/technology/elasticsearch-opensearch`
- Priority: Important
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `search-engine-concepts`, `full-text-search`, `inverted-indexes`
- Practice problems: `search-engine`
- Major subtopics:
  - Full-text retrieval and ranking fit
  - Cluster nodes indexes and documents
  - Primary and replica shards
  - Distributed query fan-out and merge
  - Refresh and search visibility
  - Database CDC and indexing pipeline
  - Reindexing and rebuild
  - Indexing lag and stale results
  - Mapping and expensive-query failures
  - Authoritative-store boundary
  - Database index before search cluster
  - Elasticsearch and OpenSearch shared concepts
  - Candidate mistakes
  - Interviewer follow-ups

### Amazon S3 / Object Storage

- ID: `s3`
- Route: `/system-design/technology/amazon-s3-object-storage`
- Priority: Important
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Must Know, senior=Must Know, staff=Must Know
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `object-storage`, `large-file-uploads`, `cdn`
- Practice problems: None currently mapped
- Major subtopics:
  - Generic object storage first
  - Buckets object keys bytes and metadata
  - Direct upload with presigned access
  - Application metadata database
  - Multipart upload
  - Strong read-after-write consistency
  - Durability availability and consistency distinction
  - CDN delivery
  - Private content authorization
  - Event-driven processing
  - At-least-once S3 event notifications
  - Lifecycle and retention
  - When not to choose object storage
  - Candidate mistakes
  - Interviewer follow-ups

### Apache Cassandra

- ID: `cassandra`
- Route: `/system-design/technology/apache-cassandra`
- Priority: Advanced
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Advanced, infrastructure=Important, data=Important, ml=Advanced
- Prerequisites: `wide-column-databases`, `sharding`, `replication`, `consistency-models`
- Practice problems: None currently mapped
- Major subtopics:
  - Distributed wide-column fit
  - Partition and clustering keys
  - Query-driven table design
  - Token ring and replica ownership
  - Replication factor
  - Tunable consistency
  - Quorum overlap caveat
  - Multi-primary writes and convergence
  - Hinted handoff read repair and anti-entropy
  - Compaction and tombstone awareness
  - Large-partition and hotspot risk
  - Cassandra vs DynamoDB
  - When not to choose Cassandra
  - Candidate mistakes
  - Interviewer follow-ups

### RabbitMQ

- ID: `rabbitmq`
- Route: `/system-design/technology/rabbitmq`
- Priority: Important
- Estimated time: 28 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `rabbitmq-sqs`, `message-queues`, `delivery-semantics`
- Practice problems: None currently mapped
- Major subtopics:
  - Brokered work and routing
  - Producer exchange queue and consumer
  - Bindings and routing keys
  - Direct fan-out and topic-style routing
  - Consumer acknowledgements
  - Publisher confirms
  - Redelivery and idempotency
  - Queue and node failure
  - Good-fit work queues
  - Replay and history limitations
  - RabbitMQ vs Kafka and SQS
  - When not to choose RabbitMQ
  - Candidate mistakes
  - Interviewer follow-ups

### Amazon SQS

- ID: `sqs`
- Route: `/system-design/technology/amazon-sqs`
- Priority: Important
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 2
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Important, sde2=Important, senior=Important, staff=Important
- Role relevance: backend=Important, fullstack=Important, infrastructure=Important, data=Important, ml=Important
- Prerequisites: `rabbitmq-sqs`, `message-queues`, `message-retries`, `dead-letter-queues`
- Practice problems: None currently mapped
- Major subtopics:
  - Managed work queue
  - Send receive process and delete
  - Visibility timeout
  - Consumer crash and redelivery
  - Standard at-least-once delivery
  - Standard best-effort ordering
  - FIFO message-group ordering
  - Deduplication boundary
  - Retries and dead-letter queues
  - Idempotent consumers
  - Operational simplicity
  - Kafka RabbitMQ and SQS comparison
  - When not to choose SQS
  - Candidate mistakes
  - Interviewer follow-ups

### Apache ZooKeeper

- ID: `zookeeper`
- Route: `/system-design/technology/apache-zookeeper`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Advanced, ml=Advanced
- Prerequisites: `distributed-consensus`, `leader-election`
- Practice problems: None currently mapped
- Major subtopics:
  - Small coordinated metadata
  - Hierarchical namespace and znodes
  - Persistent and ephemeral nodes
  - Sessions
  - Standard one-shot watches
  - Leader election and membership patterns
  - Ensemble and quorum intuition
  - Session loss and conservative clients
  - Not a general application database
  - ZooKeeper vs etcd
  - Candidate mistakes
  - Interviewer follow-ups

### etcd

- ID: `etcd`
- Route: `/system-design/technology/etcd`
- Priority: Advanced
- Estimated time: 25 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Advanced, staff=Advanced
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Important, data=Advanced, ml=Advanced
- Prerequisites: `distributed-consensus`, `raft`, `leases-fencing-tokens`
- Practice problems: None currently mapped
- Major subtopics:
  - Strongly coordinated metadata
  - Flat versioned key-value model
  - Revisions and watches
  - Leases and keep-alives
  - Compare-and-swap transactions
  - Raft-backed agreement
  - Leader election and configuration
  - Kubernetes association
  - Stale lease-holder risk
  - Not a large user-data store
  - etcd vs ZooKeeper
  - Candidate mistakes
  - Interviewer follow-ups

### Apache Flink

- ID: `flink-deep-dive`
- Route: `/system-design/technology/apache-flink`
- Priority: Advanced
- Estimated time: 35 minutes
- Visual: Mermaid
- Publishing phase: 3
- Research status: published
- Published: Yes
- Source coverage: primary=yes, interview=yes, verification pending=no
- Level relevance: sde1=Advanced, sde2=Advanced, senior=Important, staff=Important
- Role relevance: backend=Advanced, fullstack=Advanced, infrastructure=Must Know, data=Must Know, ml=Advanced
- Prerequisites: `flink`, `event-streaming`, `batch-vs-streaming`
- Practice problems: None currently mapped
- Major subtopics:
  - Stateful stream computation
  - Sources operators and sinks
  - Keyed state
  - Event time and processing time
  - Delayed and out-of-order events
  - Watermarks as progress estimates
  - Tumbling sliding and session windows
  - Checkpoints and source positions
  - State recovery
  - External sink correctness boundary
  - Fraud metrics ETL and sessionization
  - Flink vs a simple Kafka consumer
  - When Flink is overkill
  - Candidate mistakes
  - Interviewer follow-ups

## Practice problem manifest

### Foundation

- **URL Shortener** — foundation; 20 minutes; Must Know; concepts: `requirements`, `estimation`, `data-modeling`, `caching`, `unique-id-generation`
- **Rate Limiter** — foundation; 18 minutes; Must Know; concepts: `requirements`, `rate-limiting`, `redis`, `consistent-hashing`
- **Pastebin** — foundation; 16 minutes; Must Know; concepts: `requirements`, `estimation`, `data-modeling`, `object-storage`, `cdn`
- **Leaderboard** — foundation; 18 minutes; Must Know; concepts: `requirements`, `leaderboards`, `caching`, `sharding`
- **API Gateway** — foundation; 30 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Distributed ID Generator** — foundation; 30 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Feature Flag System** — foundation; 30 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Webhook Delivery Platform** — foundation; 30 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`

### Intermediate Product Systems

- **Notification Service** — intermediate; 25 minutes; Important; concepts: `requirements`, `message-queues`, `pub-sub`, `retries`, `notification-delivery`
- **Search Autocomplete** — intermediate; 22 minutes; Important; concepts: `requirements`, `search-autocomplete`, `caching`, `data-modeling`
- **Chat / WhatsApp** — intermediate; 30 minutes; Must Know; concepts: `requirements`, `realtime-communication`, `message-queues`, `pub-sub`, `sharding`
- **News Feed / Twitter / Instagram** — intermediate; 30 minutes; Must Know; concepts: `requirements`, `caching`, `sharding`, `fan-out`, `fanout-read-write`
- **Job Scheduler** — intermediate; 28 minutes; Important; concepts: `requirements`, `job-schedulers`, `message-queues`, `distributed-locks`
- **Web Crawler** — intermediate; 28 minutes; Important; concepts: `requirements`, `web-crawling`, `message-queues`, `rate-limiting`
- **Google Drive / Dropbox** — intermediate; 30 minutes; Important; concepts: `requirements`, `large-file-uploads`, `object-storage`, `sharding`
- **Slack** — intermediate; 40 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Discord** — intermediate; 40 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Reddit** — intermediate; 40 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Presence Service** — intermediate; 40 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Email Service** — intermediate; 40 minutes; Important; concepts: `requirements`, `estimation`, `data-modeling`, `caching`

### Advanced Product Systems

- **YouTube / Video Streaming** — advanced; 35 minutes; Advanced; concepts: `requirements`, `estimation`, `object-storage`, `media-processing`, `cdn`
- **Uber / Ride Sharing** — advanced; 35 minutes; Advanced; concepts: `requirements`, `geospatial-search`, `realtime-communication`, `sharding`
- **Yelp / Nearby Search** — advanced; 28 minutes; Advanced; concepts: `requirements`, `geospatial-search`, `database-indexes`, `caching`
- **Ticketmaster / Reservation System** — advanced; 35 minutes; Must Know; concepts: `requirements`, `transactions`, `isolation-levels`, `distributed-locks`, `caching`
- **Payment System** — advanced; 35 minutes; Advanced; concepts: `requirements`, `transactions`, `idempotency`, `saga`, `retries`
- **E-commerce Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Shopping Cart** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Inventory System** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Checkout System** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Digital Wallet / Ledger** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Food Delivery** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Netflix** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Spotify** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Twitch** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Image Hosting** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`

### Infrastructure

- **Metrics / Monitoring Platform** — advanced; 35 minutes; Advanced; concepts: `requirements`, `metrics`, `event-streaming`, `time-series-databases`, `sharding`
- **Distributed Cache** — advanced; 32 minutes; Advanced; concepts: `requirements`, `distributed-caching`, `consistent-hashing`, `replication`, `cache-failure-modes`
- **Distributed Queue** — advanced; 32 minutes; Advanced; concepts: `requirements`, `message-queues`, `delivery-semantics`, `replication`, `backpressure`
- **Key-Value Store** — advanced; 38 minutes; Advanced; concepts: `requirements`, `key-value-stores`, `consistent-hashing`, `replication`, `consistency-models`
- **Kafka-like Streaming Platform** — advanced; 40 minutes; Advanced; concepts: `requirements`, `kafka`, `partitions`, `consumer-groups`, `backpressure`
- **Search Engine** — advanced; 38 minutes; Advanced; concepts: `requirements`, `full-text-search`, `elasticsearch`, `sharding`, `caching`
- **Workflow Engine** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **CI/CD Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Log Aggregation Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `event-streaming`, `message-queues`, `object-storage`
- **Distributed Tracing Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Object Storage System** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **IoT Ingestion Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `event-streaming`, `message-queues`, `object-storage`
- **Distributed Lock Service** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Stream Processing Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `event-streaming`, `message-queues`, `object-storage`

### Specialized

- **Collaborative Document Editor** — specialized; 32 minutes; Important; concepts: `requirements`, `collaborative-editing`, `realtime-communication`, `consistency-models`
- **Ad Click / Event Analytics Pipeline** — specialized; 35 minutes; Important; concepts: `requirements`, `event-streaming`, `kafka`, `flink`, `object-storage`
- **ML Inference Service** — specialized; 30 minutes; Important; concepts: `requirements`, `model-serving`, `load-balancing`, `caching`
- **Feature Store** — specialized; 32 minutes; Important; concepts: `requirements`, `model-serving`, `batch-vs-streaming`, `object-storage`
- **Vector Search Service** — specialized; 32 minutes; Important; concepts: `requirements`, `vector-search`, `database-indexes`, `caching`

### Additional

- **Recommendation System** — advanced; 50 minutes; Advanced; concepts: `requirements`, `model-serving`, `caching`, `object-storage`
- **Ad Serving System** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Fraud Detection System** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`
- **Model Serving Platform** — advanced; 50 minutes; Advanced; concepts: `requirements`, `model-serving`, `caching`, `object-storage`
- **Large-scale Embedding Pipeline** — advanced; 50 minutes; Advanced; concepts: `requirements`, `model-serving`, `caching`, `object-storage`
- **Collaborative App** — advanced; 50 minutes; Advanced; concepts: `requirements`, `estimation`, `data-modeling`, `caching`

