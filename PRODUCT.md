# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Engineering Foundry serves software engineers preparing for technical interviews.

- First-time or no-progress users need a calm way to choose the right preparation track and begin without configuring the whole product.
- Returning users need to resume their current plan, recent lesson, or next useful activity with minimal navigation.
- Experienced users need fast access to dense technical references, filters, roadmaps, practice questions, and company-specific material without being slowed by beginner-oriented ceremony.

## Product Purpose

Engineering Foundry is an interview-preparation workspace. It helps users understand what to study, learn technical material, practice interview tasks, build preparation plans, and return to useful work quickly.

The first viewport of an entry surface should answer: “What should I do next?” Success means that a new user can begin confidently, an experienced user can reach depth quickly, and a returning user can resume without reconstructing context.

## Positioning

Engineering Foundry combines structured learning, interview-focused practice, level-aware roadmaps, transparent recommendations, and evidence-aware company guidance in one public preparation workspace. It preserves technical depth while using progressive disclosure to prevent the breadth of the curriculum from becoming the user’s first task.

## Operating Context

- Public preparation tracks include DSA, System Design, ML System Design, Behavioral preparation, and the Interview Playbook.
- Users move between explanatory lessons, dense reference material, practice libraries, roadmaps, study plans, and company interview guides.
- Homepage behavior is dual-mode: users without progress see simple track discovery; users with progress see Continue preparation and current/recent work before discovery.
- System Design learning begins immediately with a genuine introductory lesson. Planning and personalization are secondary actions on a separate or optional surface.
- Applications, interview tracking, saved behavioral answers, and other account-centric workspaces remain secondary until authentication and persistent state are fully enabled.

## Capabilities and Constraints

- Preserve existing routes and working behavior unless a separately approved information-architecture change requires otherwise.
- Do not let unfinished authenticated functionality dominate public navigation or homepage hierarchy.
- The homepage must not become a widget-heavy dashboard.
- Dense technical information is valuable and should remain quickly reachable.
- Prefer progressive disclosure over removing useful technical depth or permanently locking content.
- Default design implementation is code-first, followed by browser verification at desktop and mobile breakpoints.
- Use comps or wireframes first only for substantial new surfaces, significant information-architecture changes, major navigation redesigns, or comparison of materially different UX approaches.

## Brand Commitments

- Product name: Engineering Foundry.
- Preserve the existing warm-neutral, rust, and green identity and its coherent dark-mode counterpart.
- The voice is calm, direct, technically credible, and honest about evidence, privacy, availability, and recommendation limits.
- Engineering Foundry is a learning and productivity workspace, not an Apple-style marketing site.
- Avoid oversized typography, excessive whitespace, unnecessary cards, gratuitous animation, generic AI-generated dashboard styling, and low information density.

## Evidence on Hand

- The repository contains public curricula, problem manifests, level-specific roadmaps, study-plan data, company-guide sources, and validation scripts.
- Company-guide UI distinguishes official, candidate-reported, and recommended information. Preserve those distinctions.
- Public-launch account boundaries, demo data, and unavailable states are explicitly labeled. Future work must not fabricate activity, readiness, user counts, interview claims, or persistence.

## Product Principles

1. **Make the next useful action obvious.** Entry surfaces prioritize starting or resuming real preparation.
2. **Progressively disclose breadth.** First-time users should not feel overwhelmed; advanced users should still reach dense material quickly.
3. **Resume without reconstruction.** Returning users should recover their current context with minimal navigation.
4. **Preserve technical credibility.** Readability and hierarchy organize depth; they do not erase it.
5. **Earn every visual element.** Usability, information hierarchy, accessibility, and responsive behavior come before decorative polish.

## Accessibility & Inclusion

Maintain WCAG-conscious contrast, semantic landmarks and headings, visible focus, keyboard navigation, programmatic form errors and status announcements, touch-friendly mobile controls, text resizing, and reduced-motion support. Density must come from organization and spacing—not unreadably small text.
