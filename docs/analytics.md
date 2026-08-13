# Analytics specification

Engineering Foundry uses PostHog for anonymous product analytics from launch. Pageviews are captured centrally, custom events are typed in `lib/analytics.ts`, and identified profiles are created only after a user authenticates. No product metric below is a current claim or fabricated result.

## Event taxonomy

| Event | Fires when | Important properties | Status | Contributes to |
| --- | --- | --- | --- | --- |
| `$pageview` | A route or query string changes | `$current_url` | Active | Visitors, DAU/WAU/MAU, sessions, returning visitors |
| `discord_clicked` | A Discord CTA is clicked | `placement` | Active | Community acquisition |
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
| `account_signup_started` | A real sign-up method is selected or submitted | `method`, `demo=false` | Active | Account acquisition funnel |
| `sign_in_completed` | Supabase confirms authentication | `method` | Active when configured | Account activation |
| `sign_out_completed` | Supabase successfully clears the session | None | Active when configured | Session lifecycle |
| `profile_onboarding_started` | An authenticated user opens profile onboarding | None | Active when configured | Onboarding funnel |
| `profile_onboarding_completed` | A valid profile is saved for the first time | `profile_visibility` | Active when configured | Onboarding conversion |
| `profile_updated` | An authenticated user saves profile settings | `profile_visibility`, `username_changed` | Active when configured | Profile maintenance |
| `public_profile_viewed` | A public, completed profile renders | `username` | Active when configured | Profile engagement |
| `roadmap_step_completed` | A signed-in user completes a roadmap step | Roadmap and step identifiers | Future | Preparation progress |
| `account_created` | Email signup returns a confirmed new session | `method=email` | Active when reliably known | Account conversion |

Local referral-tool events measure preparation activity and must not be interpreted as requests sent, referrers registered, matches made, or referrals completed. Account events require real Supabase outcomes.

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
- Roadmap progress and completion after persistence is implemented
- Resource clicks by category and type

### Community

- Discord CTA clicks by placement
- Practice Lab sessions started by track and mode
- Guidance opens and feedback-copy actions; no marks, notes, clipboard contents, or exact duration
- Scheduled or matched mock interviews remain a future metric because those systems do not exist
- Referral builder and referrer toolkit opens
- Locally generated packet and availability-card copy actions; no form values or copied text
- Sent requests, referrer registrations, matching, and routing remain future metrics because those systems do not exist
- Challenge opens, guidance reveals, qualitative-rubric use, solution-summary copy actions, and community discussion clicks; no worksheet fields, solution URLs, assessments, or copied text
- Community Hub pathway and Discord clicks; `1,000+ community members` is a verified membership statement, not an analytics-derived active-user metric
- Official challenge submissions, judging, winners, rankings, and recognition remain future metrics because those systems do not exist
- Interview experiences submitted after moderation exists

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
- Automatic PostHog pageview capture remains disabled; the centralized route listener is the only `$pageview` source.
- Anonymous activity may be associated with a user only after successful authentication through `identifyUser`.
- Supabase user UUID is the analytics distinct ID. Email, biography, professional URLs, passwords, tokens, and private profile fields are not identity properties.
- Successful sign-out captures `sign_out_completed` and then calls `resetAnalyticsUser` before returning to anonymous browsing.
- Accurate new-account attribution for OAuth is deferred because the callback cannot reliably distinguish a new OAuth user from a returning one without inventing a heuristic.
- Event names and property meanings should remain stable. Additive properties are preferred to renaming historical events.
- Challenge and community analytics properties are limited to registered content identifiers and taxonomy (`challenge_id`, `category`, `level`, `section`) plus navigation context (`placement`, `pathway`). Never send worksheet text, solution URLs, copied summaries, personal names, or qualitative selections.
- Referral analytics properties are restricted to `mode`, `packet_type`, `availability`, and `placement`. Never send company names, role details, links, introductions, experience text, review preferences, biography text, generated packets, or copied content.
- Never send passwords, tokens, resumes, free-form referral messages, Mock Interview Practice Lab marks or notes, clipboard contents, exact practice duration, or other sensitive user content to analytics.
- Production dashboards should distinguish active, demo, future, and self-reported metrics.
