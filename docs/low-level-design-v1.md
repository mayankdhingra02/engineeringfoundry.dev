# Low-Level Design v1 ownership and boundaries

The Required Low-Level Design family owns the public `/low-level-design` curriculum, original practice dossiers, canonical qualitative rubric, and optional versioned browser-local records of self-reported preparation activity. A record means a learner marked an activity after reading or practicing; it is not a mastery, readiness, hiring, or observed-performance signal.

## Deliberate persistence decision

No LLD-specific database table or RPC is added. The curriculum marker remains local to one browser. Guided, Independent, and Timed mode selection, the visible timer, revealed hints, and 12-dimension self-review exist only in the current page session. They are not sent to analytics and do not imply signed-in durable progress, mastery, or a readiness score.

## Mock Interview boundary

The existing Mock Interview Lab has exact rehearsal plans for all six published LLD exercises. Each practice dossier links to its matching plan. Signed-in Mock Lab reviews can be durable under the Mock family contract; they remain user-entered practice evidence, not a model-generated correctness verdict or employer prediction. The canonical 12-dimension LLD rubric stays visible on `/low-level-design/rubric` and is completed before the practice page reveals its example approach.

The Interview Playbook carries only public, bounded modifiers into LLD practice: the Low-Level Design round, canonical level when recognized, canonical company-guide slug when available, and Guided/Independent/Timed mode. Application ids, round ids, notes, and other private context never enter the public practice URL.

## Curriculum boundary

LLD covers component and object responsibilities, interfaces, relationships, lifecycle, invariants, errors and idempotency, selective patterns, testability, evolution, and proportional in-process concurrency. Distributed storage, traffic, availability, replication, and network boundaries remain in the canonical System Design curriculum. Memory allocators, kernel behavior, cache coherence, compiler internals, and low-level systems/C++ work remain a separate future family and are not approved by this implementation.
