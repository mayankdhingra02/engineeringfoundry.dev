# Unified preparation progress

P0.2 gives the public homepage one compact continuation surface across DSA, System Design, ML System Design, and Behavioral preparation. It records preparation activity, never mastery, interview readiness, or observed interview performance.

## Continuation precedence

The selection is deterministic:

1. Account-backed nearest scheduled interview, using its existing focused preparation route.
2. Account-backed active DSA or System Design plan.
3. Account-backed in-progress preparation or draft System Design attempt.
4. Account-backed recent recorded activity.
5. Browser-saved active DSA or System Design plan.
6. Browser in-progress activity.
7. Browser next/recent activity.
8. No continuation surface for a new user; the homepage keeps its ordinary track choices.

Account-backed candidates always outrank browser candidates. Ties are resolved by the kind above, most-recent recorded timestamp, track name, then href. The private continuation endpoint returns only canonical public titles and links. It does not return Behavioral stories, answers, notes, or other workspace text.

## Browser progress and import

Signed-out activity uses the versioned `engineering-foundry-preparation-progress-v1` browser record. It contains only canonical track and item identifiers, `in-progress`/`completed`, timestamps, and optional DSA/System Design plan labels and internal links. It never stores notes, answers, stories, or analytics payloads. Malformed, unknown-version, and oversized storage is safely ignored.

After sign-in, the homepage offers an explicit import. It validates every identifier against canonical content, does not overwrite any existing account record, and removes only the local activity confirmed as imported. Existing account records are reported as left unchanged. Local saved plans are intentionally not imported automatically: the user can explicitly save the chosen plan from its actual plan page. A failed import leaves all browser activity recoverable.

## Durable activity and plans

Existing DSA and System Design owner-scoped progress stores remain the source of truth. ML System Design and Behavioral public activity use the owner-scoped `preparation_track_progress` table and actor-derived RPC. Behavioral story text remains in its existing private workspace and is never copied into this record.

DSA and System Design each have one active plan in the existing owner-scoped preparation preferences. Saving another plan deliberately replaces that track's active choice. Signed-out users may keep the same safe plan choice in the browser; no ML or Behavioral plan is manufactured because those tracks have no canonical planning model.

All new durable activity is included in account export schema `1.5` and is removed by the existing account-deletion cascade.

## Momentum and Playbook links

The homepage can show a quiet count of distinct days with recorded activity in the last seven days. This is not a streak, score, reward, readiness signal, or missed-day penalty.

Onboarding already sends an authenticated user directly to a real DSA roadmap, System Design practice, Behavioral workspace, application setup, or dashboard based on their explicit choice. Interview Playbook preparation actions use exact DSA practice, System Design practice, ML Design, and Behavioral workspace links where those canonical destinations exist.
