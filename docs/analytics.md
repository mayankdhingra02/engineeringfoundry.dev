# Analytics specification

Engineering Foundry supports optional PostHog product analytics. It remains fully inactive when `NEXT_PUBLIC_POSTHOG_KEY` is absent. When configured, pageviews are captured centrally, custom events are typed in `lib/analytics.ts`, and identified profiles can be created only after the separately gated account platform authenticates a user. No product metric below is a current claim or fabricated result.

## Event taxonomy

| Event | Fires when | Important properties | Status | Contributes to |
| --- | --- | --- | --- | --- |
| `$pageview` | A public route changes | Path-only `$current_url`; query strings and fragments are removed | Active | Visitors, DAU/WAU/MAU, sessions, returning visitors |
| `discord_clicked` | A Discord CTA is clicked | `placement` | Active | Community acquisition |
| `contact_channel_clicked` | A visitor opens a working contact destination | `channel`, `placement`; no name, email, subject, or message text | Active | Contact-path usefulness |
| `dsa_question_clicked` | A question’s attributed external link is opened | `question_id`, `source`, `difficulty`, `primary_topic`, `external_host` | Active | DSA practice engagement |
| `dsa_filter_changed` | A visitor changes a question-explorer filter | `filter`, normalized `value`; raw search text is never sent | Active | Preparation engagement |
| `dsa_topic_viewed` | A registered topic guide renders | `topic_slug`, `question_count` | Active | Preparation navigation |
| `dsa_pattern_viewed` | A future registered pattern guide renders | `pattern_slug` | Reserved | Pattern-level engagement |
| `verification_source_opened` | A visitor leaves the site through a provenance/source link | `content_type`, `content_id`, `source`, `external_host` | Active | Source inspection |
| `company_question_clicked` | A sourced company-associated question is opened from a company guide | Question and company identifiers | Reserved | Company preparation engagement |
| `search_used` | A visitor chooses a global-search result | `result_type`; raw search text is never sent | Active | Discovery engagement |
| `company_page_viewed` | A valid company guide renders | `company_slug`, `company_name` | Active | Company-guide interest |
| `resource_opened` | A visitor opens an internal or safely linked external resource | `resource_id`, `provider`, `category`, `resource_type`, `internal`; full URLs are not sent | Active | Meaningful preparation engagement |
| `roadmap_viewed` | A preparation roadmap renders | `roadmap` | Active | Preparation-track interest |
| `system_design_problem_viewed` | An active System Design practice renders | `problem_id`, `difficulty`, `domain`, `track` | Active | Meaningful preparation engagement |
| `system_design_guidance_opened` | A visitor opens a System Design guidance section | `problem_id`, `difficulty`, `domain`, `track`, `section` | Active | Meaningful preparation engagement |
| `ml_design_problem_viewed` | An active ML System Design practice renders | `problem_id`, `difficulty`, `domain`, `track` | Active | Meaningful preparation engagement |
| `ml_design_guidance_opened` | A visitor opens an ML guidance section | `problem_id`, `difficulty`, `domain`, `track`, `section` | Active | Meaningful preparation engagement |
| `design_problem_started` | Any active design practice page renders | `problem_id`, `difficulty`, `domain`, `track` | Active | Engaged visitor calculation |
| `behavioral_question_viewed` | A behavioral practice prompt becomes active | `question_id`, `category`, `scope`; answer text is never sent | Active | Behavioral practice engagement |
| `behavioral_guidance_opened` | A visitor reveals guidance, follow-ups, or mistakes for a prompt | `question_id`, `category`, `section` | Active | Meaningful preparation engagement |
| `behavioral_prompt_randomized` | A visitor asks for another random prompt | `question_id`, `category`, `pool_size` | Active | Behavioral practice engagement |
| `interview_checklist_used` | A session-only checklist item is changed | `checklist_id`, `item_id`, `checked`; no personal notes | Active | Meaningful preparation engagement |
| `interview_playbook_section_viewed` | A visitor opens a playbook tip | `section`, `tip_id` | Active | Preparation engagement |
| `mock_session_configured` | A visitor starts a configured Practice Lab session | `track`, `mode`, `prompt_id`, `rubric_id` | Active | Mock practice activation |
| `mock_session_started` | A configured Practice Lab session starts | `track`, `mode`, `prompt_id`, `rubric_id` | Active | Mock practice activation |
| `mock_prompt_randomized` | Random prompt chooses from the active track pool | `track`, `mode`, `prompt_id`, `rubric_id` | Active | Practice exploration |
| `mock_guidance_opened` | Solo guidance or a peer interviewer packet is first revealed | `track`, `mode`, `prompt_id`, `rubric_id`, `section` | Active | Practice engagement |
| `mock_feedback_copied` | A visitor copies locally composed qualitative feedback | `track`, `mode`, `prompt_id`, `rubric_id`; copied content is never sent | Active | Practice completion signal |
| `mock_community_clicked` | The Practice Lab community CTA is opened | `placement` | Active | Community acquisition |
| `referral_builder_opened` | The local request-builder mode opens | `mode=request` | Active | Referral preparation engagement |
| `referral_packet_copied` | A locally generated request packet is copied | `mode=request`, `packet_type` | Active | Referral preparation completion signal |
| `referral_draft_cleared` | A visitor clears the current local draft | `mode` | Active | Local-tool use |
| `referrer_toolkit_opened` | The local referrer-toolkit mode opens | `mode=referrer` | Active | Referrer guidance engagement |
| `referrer_card_copied` | A locally generated availability card is copied | `mode=referrer`, `availability` | Active | Referrer-tool completion signal |
| `referral_community_clicked` | The referral-etiquette community CTA is opened | `placement` | Active | Community acquisition |
| `challenge_opened` | An active Challenge Lab detail page hydrates | `challenge_id`, `category`, `level` | Active | Challenge practice engagement |
| `challenge_guidance_opened` | Guidance, mistakes, or stretch goals are first revealed | `challenge_id`, `category`, `level`, `section` | Active | Challenge practice engagement |
| `challenge_rubric_used` | A visitor chooses a qualitative self-review state | `challenge_id`, `category`, `level`, `section`; the selected assessment is not sent | Active | Meaningful challenge engagement |
| `challenge_solution_summary_copied` | A visitor copies the locally prepared solution summary | `challenge_id`, `category`, `level`; worksheet and copied text are never sent | Active | Challenge practice completion signal |
| `challenge_community_clicked` | A Challenge Lab community CTA is opened | `challenge_id` when on a detail page, `category`, `level`, `placement` | Active | Community discussion interest |
| `community_pathway_clicked` | A public Community Hub or recognition pathway is chosen | `pathway`, `placement` | Active | Community pathway engagement |
| `community_discord_clicked` | A Community Hub or Recognition Preview Discord CTA is opened | `placement` | Active | Community acquisition |
| `recognition_preview_viewed` | The honest Recognition Preview renders | `placement` | Active | Recognition-model interest |
| `experience_builder_opened` | The private write-up builder hydrates | `mode`, `source_route` | Active | Experience-writing engagement |
| `experience_round_added` | A visitor adds a local process round | `round_count_bucket`, `source_route` | Active | Experience-writing engagement |
| `experience_round_removed` | A visitor removes a local process round | `round_count_bucket`, `source_route` | Active | Experience-writing engagement |
| `experience_summary_generated` | A local safe-summary preview is generated | `round_count_bucket`, `source_route` | Active | Experience-writing completion signal |
| `experience_summary_copied` | A checklist-reviewed local summary is copied | `round_count_bucket`, `source_route` | Active | Experience-writing completion signal |
| `experience_draft_cleared` | A visitor clears the local draft | `mode`, `source_route` | Active | Local-tool use |
| `experience_guidance_opened` | Privacy and writing guidance is first opened | `placement`, `source_route` | Active | Privacy-guidance engagement |
| `experience_community_clicked` | The experience-workspace community CTA is opened | `placement`, `source_route` | Active | Community acquisition |
| `experience_company_workspace_viewed` | One of six registered company workspaces renders | `company_slug`, `source_route` | Active | Company-workspace interest |
| `account_signup_started` | A real sign-up method is selected or submitted | `method`, `demo=false` | Active only when accounts are enabled | Account acquisition funnel |
| `sign_in_completed` | Supabase confirms authentication | `method` | Active only after Supabase confirms authentication | Account activation |
| `sign_out_completed` | Supabase successfully clears the session | None | Active only after sign-out succeeds | Session lifecycle |
| `profile_onboarding_started` | An authenticated user opens profile onboarding | None | Active only when accounts are enabled | Onboarding funnel |
| `profile_onboarding_completed` | A valid profile is saved for the first time | `profile_visibility` | Active only after the profile save succeeds | Onboarding conversion |
| `profile_updated` | An authenticated user saves profile settings | `profile_visibility`, `username_changed` | Active only after the profile save succeeds | Profile maintenance |
| `public_profile_viewed` | A public, completed profile renders | `username` | Active only when a public profile is rendered | Profile engagement |
| `roadmap_step_completed` | — | — | Not implemented; excluded from dashboards | — |
| `account_created` | Email signup returns a confirmed new session | `method=email` | Active only after a confirmed new email session | Account conversion |

Local referral-tool events measure preparation activity and must not be interpreted as requests sent, referrers registered, matches made, or referrals completed. Account events require real Supabase outcomes.

## P0.9 activation events — `analytics-definition-v1`

These are the fixed event families used by the launch funnels. Each event has a runtime property allowlist in `lib/analytics/launch-metrics.ts`; unlisted properties are removed before the global private-data sanitizer runs.

| Event | Fires when | Fixed properties | Meaning |
| --- | --- | --- | --- |
| `dsa_practice_started` | A canonical DSA source/practice link is opened | `track`, `problem_id`, `source` | A user deliberately starts canonical DSA practice |
| `system_design_practice_started` | A canonical System Design practice renders | `track`, `problem_id`, `difficulty`, `domain` | A user opens substantive System Design practice |
| `ml_design_practice_started` | A canonical ML Design practice renders | `track`, `problem_id`, `difficulty`, `domain` | A user opens substantive ML Design practice |
| `behavioral_practice_started` | A canonical Behavioral prompt first becomes active | `track`, `question_id`, `category` | A user opens a prompt to practice; no story or answer is sent |
| `low_level_design_lesson_opened` | A canonical LLD lesson renders | `track`, `lesson_id` | A user opens substantive LLD curriculum |
| `low_level_design_practice_started` | A canonical LLD practice renders | `track`, `practice_id` | A user starts an original LLD practice design |
| `preparation_activity_recorded` | A canonical DSA, System Design, ML Design, or Behavioral activity is successfully persisted or safely recorded locally | `track`, `item_id`, `status`, `persistence` | Self-recorded activity, never mastery or readiness |
| `low_level_design_activity_recorded` | A canonical LLD activity is recorded locally | `track`, `item_id`, `status`, `persistence` | Local self-recorded activity, never mastery or durable account progress |
| `continuation_presented` / `continuation_selected` | A real P0.2 continuation is visible / chosen | `track`, `continuation_source`, `authenticated` | Continuation usage with coarse account/local source only |
| `study_plan_activated` / `study_plan_resumed` | A DSA or System Design plan is successfully saved / then chosen from an active-plan continuation | fixed `track`, `plan_id` or `continuation_source`, `persistence`/`authenticated` | Active plan use; not completion |
| `mock_review_saved` | A valid self-review/rating save succeeds | `track`, `mode`, `prompt_id`, `rubric_id` | Persisted self-review, not observed interview performance |
| `salary_negotiation_module_viewed` / `offer_comparison_opened` | Public module or the private in-memory worksheet opens | `module_id` or fixed `surface` | Discovery only; compensation and worksheet fields are excluded |
| `interview_experience_submission_started` / `interview_experience_submitted` | The signed-in contribution form renders / a report is successfully submitted | fixed `source` | Workflow usage only; no report fields or identity values |

### First useful action

`first useful action` is the first occurrence per person (or anonymous device before identification) of one of the event IDs in `FIRST_USEFUL_ACTION_EVENTS` in `lib/analytics/launch-metrics.ts`. It is a deliberate canonical preparation start or successfully recorded preparation activity. It excludes `$pageview`, navigation, search, account creation, profile onboarding, filters, and every passive render that is not a substantive canonical preparation surface.

Completion means **the user recorded preparation activity complete**. It does not mean mastered, passed, interview-ready, or an observed performance result. Persisted events are emitted only after the relevant Supabase mutation succeeds; local events use only canonical content IDs and never include local progress payloads.

### Audited legacy roadmap events

| Event | Status after audit | Notes |
| --- | --- | --- |
| `roadmap_level_selected`, `roadmap_plan_selected`, `company_overlay_selected`, `roadmap_topic_opened`, `roadmap_problem_opened`, `roadmap_problem_marked_review`, `roadmap_hint_revealed`, `mixed_set_started`, `timed_practice_started`, `roadmap_filter_changed` | Implemented | Existing DSA-roadmap discovery events. They are not first-useful-action completions. |
| `resource_clicked`, `roadmap_problem_completed`, `mixed_set_completed` | Registered but not implemented | Excluded from all P0.9 dashboards until a real call site exists. `resource_opened` is the active resource event. |

## Intended product metrics

### Traffic

- Unique visitors
- Daily, weekly, and monthly active users (DAU, WAU, MAU)
- DAU/MAU stickiness
- Returning visitor percentage
- Sessions
- Average engagement per session where reliable

### Preparation

- DSA question clicks
- Topic-guide views, question-filter changes, source inspection, and preparation-path navigation
- Engaged visitors can be derived from meaningful preparation events, including opening design or behavioral guidance, practicing a behavioral prompt, using an interview checklist, or opening a substantive resource, without sending raw search queries, story text, answer drafts, or personal notes
- Roadmap views by preparation track
- Persisted DSA/System Design, ML Design, and Behavioral self-recorded activity; local LLD activity remains intentionally separate from durable account progress
- Resource clicks by category and type

### Community

- Discord CTA clicks by placement
- Working contact-channel clicks by channel and placement; contact text and identity fields are never collected
- Practice Lab sessions started by track and mode
- Guidance opens and feedback-copy actions; no marks, notes, clipboard contents, or exact duration
- Scheduled or matched mock interviews remain a future metric because those systems do not exist
- Referral builder and referrer toolkit opens
- Locally generated packet and availability-card copy actions; no form values or copied text
- Sent requests, referrer registrations, matching, and routing remain future metrics because those systems do not exist
- Challenge opens, guidance reveals, qualitative-rubric use, solution-summary copy actions, and community discussion clicks; no worksheet fields, solution URLs, assessments, or copied text
- Community Hub pathway and Discord clicks; `1,000+ community members` is a verified membership statement, not an analytics-derived active-user metric
- Official challenge submissions, judging, winners, rankings, and recognition remain future metrics because those systems do not exist
- Interview builder opens, rounds added, guidance opens, summary generation, and summary copies; these are local writing actions, not submissions or published experiences
- Authenticated Interview Experience contribution starts and submissions; public visibility still requires the existing approval and publication-consent boundary

### Outcomes — future and self-reported

- Interviews obtained
- Job offers reported
- Successful referrals
- Active mentors and reviewers
- Challenge submissions
- Countries represented

Outcome metrics require explicit definitions, consent-aware collection, and safeguards against treating self-reported correlation as causation.

## Implementation rules

- PostHog initialization is idempotent and must never block application rendering.
- PostHog autocapture, session recording, page-leave capture, and automatic pageview capture remain disabled. Explicit, reviewed events are the only analytics source.
- The centralized route listener is the only `$pageview` source. It records public paths only, removes every query string and fragment, and suppresses authentication and private workspace routes including Applications, Behavioral workspace, Dashboard, Onboarding, and Settings. The final send hook applies the same query/fragment removal to standard URL properties on every event and discards referrer, search-keyword, and campaign-parameter properties.
- Never encode a user ID, record ID, email address, search query, filter text, draft, note, answer, or other free-form value in an analytics URL or event property. Use registered public content identifiers and fixed/coarse taxonomy values only.
- Anonymous activity may be associated with a user only after successful authentication through `identifyUser`.
- Supabase user UUID is the analytics distinct ID. Email, biography, professional URLs, passwords, tokens, and private profile fields are not identity properties.
- Successful sign-out captures `sign_out_completed` and then calls `resetAnalyticsUser` before returning to anonymous browsing.
- Accurate new-account attribution for OAuth is deferred because the callback cannot reliably distinguish a new OAuth user from a returning one without inventing a heuristic.
- Event names and property meanings should remain stable. Additive properties are preferred to renaming historical events.
- Challenge and community analytics properties are limited to registered content identifiers and taxonomy (`challenge_id`, `category`, `level`, `section`) plus navigation context (`placement`, `pathway`). Never send worksheet text, solution URLs, copied summaries, personal names, or qualitative selections.
- Interview-experience analytics are restricted to fixed `mode`, fixed `source_route`, coarse `round_count_bucket`, `placement`, and a registered public `company_slug` on the six static workspace pages. Never send a user-entered company, role, level, region, interview period, result, topic selection, round note, reflection, generated summary, checklist state, or clipboard content.
- Referral analytics properties are restricted to `mode`, `packet_type`, `availability`, and `placement`. Never send company names, role details, links, introductions, experience text, review preferences, biography text, generated packets, or copied content.
- Never send passwords, tokens, resumes, free-form referral messages, Mock Interview Practice Lab marks or notes, clipboard contents, exact practice duration, or other sensitive user content to analytics.
- Production dashboards should distinguish active, demo, future, and self-reported metrics.
