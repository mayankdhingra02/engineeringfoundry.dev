# Low-Level Design v1 ownership and boundaries

P0.5 owns the public `/low-level-design` curriculum, original practice designs, and optional versioned browser-local records of self-reported preparation activity. A record means a learner marked an activity after reading or practicing; it is not a mastery, readiness, hiring, or observed-performance signal.

## Deliberate persistence decision

No database table or RPC is added in P0.5. System Design already owns its durable concept and design-attempt model, while P0.2's four primary continuation tracks remain DSA, System Design, ML Design, and Behavioral. LLD is discoverable as a secondary public surface but does not change the homepage continuation taxonomy or imply signed-in durable progress without a dedicated, reviewed account schema.

## Mock Interview boundary

The existing Mock Interview Lab remains unchanged. It does not currently have a truthful dedicated LLD session model that can accept these public exercises without inventing a persistence or evaluation contract. P1 may add a bounded LLD mock/rehearsal expansion after deciding its self-review, privacy, and persistence requirements. Until then, the LLD entry page links to the established round-execution dossier and the original practice library rather than misrepresenting a mock capability.

## Curriculum boundary

LLD covers component and object responsibilities, interfaces, relationships, lifecycle, invariants, errors, selective patterns, testability, and in-process concurrency. Distributed storage, traffic, availability, replication, and network boundaries remain in the canonical System Design curriculum. Memory allocators, kernel behavior, cache coherence, compiler internals, and low-level systems/C++ work remain P1.
