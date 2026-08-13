# Preparation content model

Engineering Foundry's DSA and company preparation content is typed repository data. It renders without Supabase, login, or production credentials.

## Questions

Each question has a stable ID and slug, title, difficulty, topics, patterns, roadmap stage, priority, availability, source, status, verification state, optional last-verified date, and zero or more company associations.

External questions contain only metadata and an original short note. They require an HTTPS source URL and never store the third-party problem statement. Original Engineering Foundry questions instead include the complete original prompt, use the `original` source platform, and require no external URL.

Question status is one of:

- `active`: eligible for public listings;
- `unavailable`: retained for history but not publicly listed;
- `needs_review`: withheld until provenance or link health is checked.

## Topics and patterns

A topic describes the underlying data or concept, such as arrays, trees, graphs, or dynamic programming. A pattern describes a reusable solution shape, such as sliding window, BFS, union find, or 1D DP.

Questions may reference multiple topics and patterns. Each reference must resolve to a stable taxonomy slug. Topic pages provide original summaries, complexity guidance, mistakes, related topics, and repository-derived practice counts.

## Roadmap

Roadmap stages provide an original Engineering Foundry learning order. A question references one primary stage for ordering but can connect to topics taught elsewhere. Stage counts are derived from the active dataset and never represent personal completion.

## Sources and verification

Source records include a name, URL where applicable, platform, verification state, optional last-verified date, and optional maintenance note.

- `verified`: evidence exists and a reviewer checked the specific assertion. A working link alone does not verify a company association.
- `community-reported`: a user or community member reported the assertion, but Engineering Foundry has not independently confirmed it.
- `unverified`: the metadata or assertion lacks sufficient review evidence.
- `demo`: clearly non-production sample content. Demo records are excluded from this public DSA seed dataset.

Original Engineering Foundry material is presented with an `Original` label in the interface and uses verified provenance because Engineering Foundry controls its authorship.

`lastVerifiedAt` remains `null` until a human actually checks that maintained link or assertion. Dates are not bulk-filled automatically.

## Company associations and claims

Company associations are separate records attached to a question. They reference a known company and carry their own source and verification state. Verified associations require a verified HTTPS source. Community reports never become verified merely through repetition.

Company guide claims follow the same rule: claim text, source, source type, verification state, and last-verified date. The current six company guides intentionally publish no company-specific question associations or process claims because no reviewed source dataset has been added.

## Validation

`npm run validate:content` enforces unique IDs and slugs, valid taxonomy references, roadmap integrity, HTTPS external links, original-versus-external boundaries, valid companies, sourced associations, and the intended seed-dataset size. GitHub Actions runs this check before the production build.
