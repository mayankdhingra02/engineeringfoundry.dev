# Analytics specification

Engineering Foundry uses PostHog for anonymous product analytics from launch. Pageviews are captured centrally, custom events are typed in `lib/analytics.ts`, and identified profiles are created only after a user authenticates. No product metric below is a current claim or fabricated result.

## Event taxonomy

| Event | Fires when | Important properties | Status | Contributes to |
| --- | --- | --- | --- | --- |
| `$pageview` | A route or query string changes | `$current_url` | Active | Visitors, DAU/WAU/MAU, sessions, returning visitors |
| `discord_clicked` | A Discord CTA is clicked | `placement` | Active | Community acquisition |
| `dsa_question_clicked` | A demo question’s external link is opened | `question_id`, `topic`, `external_host` | Active | DSA practice engagement |
| `company_page_viewed` | A valid company guide renders | `company_slug`, `company_name` | Active | Company-guide interest |
| `resource_clicked` | An external resource is opened | `resource_id`, `category`, `resource_type` | Active | Resource engagement |
| `roadmap_viewed` | A preparation roadmap renders | `roadmap` | Active | Preparation-track interest |
| `system_design_problem_viewed` | A registered System Design practice shell renders | `problem_slug`, `problem_title`, `status` | Active | System Design practice interest |
| `mock_interview_requested` | The current peer mock request CTA is clicked | `demo`, `interview_type` | Active demo | Mock interview demand |
| `referral_page_viewed` | The referral workspace renders | `demo` | Active demo | Referral funnel entry |
| `referral_requested` | The demo referral request form is previewed | `demo` | Active demo | Referral request intent |
| `referrer_signup_started` | The demo Referrer profile form is previewed | `demo` | Active demo | Referrer supply intent |
| `challenge_viewed` | The demo challenge preview CTA is clicked | `challenge_id` | Active demo | Challenge interest |
| `account_signup_started` | A sign-in method is selected or submitted | `method`, `demo` | Active demo | Account acquisition funnel |
| `roadmap_step_completed` | A signed-in user completes a roadmap step | Roadmap and step identifiers | Future | Preparation progress |
| `mock_interview_started` | A scheduled mock session begins | Interview and type identifiers | Future | Practice activation |
| `account_created` | Authentication confirms a new account | Provider and acquisition context | Future | Account conversion |

Demo events measure intent in the current frontend shell. They must not be interpreted as completed referrals, scheduled interviews, or created accounts.

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
- Event names and property meanings should remain stable. Additive properties are preferred to renaming historical events.
- Never send passwords, tokens, resumes, free-form referral messages, or other sensitive user content to analytics.
- Production dashboards should distinguish active, demo, future, and self-reported metrics.
