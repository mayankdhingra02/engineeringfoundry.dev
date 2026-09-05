---
artifact_id: RA-DSA-PYTHON-JAVA-LANGUAGES
title: Engineering Foundry Python and Java DSA Language Pages
reviewed_at: 2026-09-05
status: approved
---

# Python and Java interview-language synthesis

## Product boundary

These guides are operating manuals for candidates who already program. They cover the runtime semantics, containers, utilities, hazards, and templates that can change correctness or complexity during an interview. They are not general language courses and do not reproduce proprietary solutions.

## Python contract

`SRC-DSA-PY-DATA`, `SRC-DSA-PY-COLLECTIONS`, `SRC-DSA-PY-HEAPQ`, and `SRC-DSA-PY-BISECT` support the published container and utility semantics. The guide uses a portable Python 3.11+ subset and is reviewed against Python 3.14 documentation.

Required decisions:

- Explain identity, mutability, aliasing, copying, equality, hashability, ordering, scope, and mutable-default risks.
- Make list front-removal, slicing, immutable-string construction, heap direction/ties, bisect insertion cost, and recursion depth visible.
- Prefer `deque` for FIFO removal and use `Counter`, `defaultdict`, `heapq`, and `bisect` only with their actual cost boundaries.
- Parse every published code block with the repository runner in the static qualification lane.

## Java contract

`SRC-DSA-JAVA-JLS`, `SRC-DSA-JAVA-UTIL`, `SRC-DSA-JAVA-ARRAYDEQUE`, and `SRC-DSA-JAVA-PRIORITYQUEUE` support the published language and collection semantics. The guide uses a portable Java 17+ subset and is reviewed against Java SE 25 LTS.

Required decisions:

- Explain primitive/reference semantics, `==` versus `equals`, the `equals`/`hashCode` contract, mutation, boxing, generics, and null handling.
- Prefer `ArrayDeque` to legacy `Stack`, use overflow-safe comparison methods, and make `int` versus `long` explicit.
- Keep node/helper boilerplate minimal while preserving type correctness.
- Compile the representative fixture with Temurin 25 in CI; the test must fail on compiler errors rather than silently treating Java as permanently unavailable.

## Shared published-page contract

Each page records its runtime boundary, review date, and source notes. It includes real operation costs; sorting/comparator behavior; queue, heap, map/set, binary-search, numeric, string, recursion, overflow, tree, and graph guidance; 15 canonical pattern templates; a debugging checklist; bounded discussion prompts; and five exercises covering prediction, tracing, bug repair, container choice, and unfamiliar transfer.

The guides end in canonical roadmap, question-practice, and Interview Playbook handoffs. C++, Go, and JavaScript/TypeScript remain clearly unavailable until their separately prioritized research, editorial, and runtime-fixture contracts close.
