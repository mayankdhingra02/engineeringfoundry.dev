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
| `resource_clicked` | An external resource is opened | `resource_id`, `category`, `resource_type` | Active | Resource engagement |
| `roadmap_viewed` | A preparation roadmap renders | `roadmap` | Active | Preparation-track interest |
| `system_design_problem_viewed` | A registered System Design practice shell renders | `problem_slug`, `problem_title`, `status` | Active | System Design practice interest |
| `mock_interview_requested` | The current peer mock request CTA is clicked | `demo`, `interview_type` | Active demo | Mock interview demand |
| `referral_page_viewed` | The referral workspace renders | `demo` | Active demo | Referral funnel entry |
| `referral_requested` | The demo referral request form is previewed | `demo` | Active demo | Referral request intent |
| `referrer_signup_started` | The demo Referrer profile form is previewed | `demo` | Active demo | Referrer supply intent |
| `challenge_viewed` | The demo challenge preview CTA is clicked | `challenge_id` | Active demo | Challenge interest |
| `account_signup_started` | A real sign-up method is selected or submitted | `method`, `demo=false` | Active | Account acquisition funnel |
| `sign_in_completed` | Supabase confirms authentication | `method` | Active when configured | Account activation |
| `sign_out_completed` | Supabase successfully clears the session | None | Active when configured | Session lifecycle |
| `profile_onboarding_started` | An authenticated user opens profile onboarding | None | Active when configured | Onboarding funnel |
| `profile_onboarding_completed` | A valid profile is saved for the first time | `profile_visibility` | Active when configured | Onboarding conversion |
| `profile_updated` | An authenticated user saves profile settings | `profile_visibility`, `username_changed` | Active when configured | Profile maintenance |
| `public_profile_viewed` | A public, completed profile renders | `username` | Active when configured | Profile engagement |
| `roadmap_step_completed` | A signed-in user completes a roadmap step | Roadmap and step identifiers | Future | Preparation progress |
| `mock_interview_started` | A scheduled mock session begins | Interview and type identifiers | Future | Practice activation |
| `account_created` | Email signup returns a confirmed new session | `method=email` | Active when reliably known | Account conversion |

Demo feature events still measure intent and must not be interpreted as completed referrals or scheduled interviews. Account events now require real Supabase outcomes.

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
- Engaged visitors can be derived from meaningful preparation events without sending raw search queries
- Roadmap views by preparation track
- Roadmap progress and completion after persistence is implemented
- Resource clicks by category and type

### Community

- Discord CTA clicks by placement
- Mock interview requests
- Mock interviews completed after scheduling exists
- Referral requests
- Referrer registrations
- Challenge participation and submissions
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
- Never send passwords, tokens, resumes, free-form referral messages, or other sensitive user content to analytics.
- Production dashboards should distinguish active, demo, future, and self-reported metrics.
