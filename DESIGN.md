---
name: Engineering Foundry
description: A calm, focused interview-preparation workspace for software engineers.
colors:
  foundry-rust: "#b34f25"
  foundry-rust-deep: "#8f3917"
  foundry-rust-soft: "#f8e9e0"
  forge-green: "#346b52"
  forge-green-soft: "#e1eee7"
  warm-paper: "#f7f7f4"
  surface: "#ffffff"
  surface-subtle: "#f0f0ec"
  surface-muted: "#e8e8e2"
  ink: "#171918"
  ink-secondary: "#4d514c"
  ink-muted: "#656862"
  rule: "#dcded8"
  rule-strong: "#c9ccc4"
  control-border: "#83887f"
  warning: "#9a6417"
  advanced: "#665496"
  destructive: "#a94338"
  on-accent: "#ffffff"
  night: "#111311"
  night-surface: "#171a17"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.15rem, 4vw, 3.2rem)"
    fontWeight: 720
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.foundry-rust}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "42px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "42px"
  field-auth:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "46px"
---

# Design System: Engineering Foundry

## Overview

**Creative North Star: “The Focused Foundry Workspace”**

Engineering Foundry should feel like a calm professional workshop for interview preparation: technically credible, quietly distinctive, and ready for sustained reading and repeated task completion. Warm paper surfaces, restrained rust actions, green evidence states, direct typography, and compact engineering details create character without turning the interface into a marketing spectacle.

Operate and Read modes dominate. Entry surfaces make the next action obvious; learning surfaces protect comprehension; dense reference surfaces preserve scanability. Visual density comes from useful grouping and progressive disclosure, never from unreadably small text.

**Key Characteristics:**

- Warm-neutral surfaces with restrained rust and green semantic accents
- Compact, readable, task-oriented composition
- Clear current state and next-action hierarchy
- Dense technical information when the task benefits from it
- Strong light/dark parity, keyboard focus, and mobile adaptation

## Colors

The palette resembles a warm engineering notebook: paper neutrals, dark ink, oxidized rust for action, and green for trustworthy or completed states.

### Primary

- **Foundry Rust** (`#b34f25`): Primary actions, active navigation, and high-value emphasis.
- **Deep Rust** (`#8f3917`): Hover and stronger emphasis in light mode.
- **Rust Wash** (`#f8e9e0`): Selected or gently emphasized surfaces.

### Secondary

- **Forge Green** (`#346b52`): Completion, verified evidence, and positive status.
- **Forge Green Wash** (`#e1eee7`): Quiet positive-state backgrounds.

### Neutral

- **Warm Paper** (`#f7f7f4`): Default canvas.
- **Clean Surface** (`#ffffff`): Primary content and interactive surfaces.
- **Workshop Ink** (`#171918`): Primary text.
- **Secondary Ink** (`#4d514c`): Supporting text.
- **Rule** (`#dcded8`) and **Strong Rule** (`#c9ccc4`): Dividers, fields, and boundaries.
- **Night Canvas** (`#111311`) and **Night Surface** (`#171a17`): Dark-mode foundations.

**The Restrained Accent Rule.** Rust identifies priority, selection, or action. It does not decorate every heading or container.

**The Evidence Rule.** Green is reserved for completed, verified, or positive meaning and is never the sole carrier of that meaning.

## Typography

**Display Font:** Inter with the system sans stack
**Body Font:** Inter with the system sans stack
**Label/Mono Font:** UI monospace for code, measurements, compact metadata, and genuinely technical labels

**Character:** Direct, modern, and readable. Sans-serif text carries the product; monospace appears only where technical structure or measurement earns it.

### Hierarchy

- **Display** (720, `clamp(2.5rem, 5vw, 4.5rem)`, 1): Reserved for the homepage or rare top-level moments; most workspace screens use Headline.
- **Headline** (720, `clamp(2.15rem, 4vw, 3.2rem)`, 1.05): Route titles and major workspace orientation.
- **Title** (650–720, 1.125–2rem, 1.2–1.35): Section and card titles.
- **Body** (400, 1rem, 1.62): Default UI and explanatory copy; long-form reading may use 1.0625rem and a maximum measure of 72ch.
- **Supporting** (400–700, .875rem, 1.5–1.65): Secondary content and dense tables.
- **Metadata** (600–700, .8125rem, 1.45–1.6): Status, filters, supporting measurements, and compact data.
- **Label floor** (700, .75rem, .08em): Genuinely tertiary labels only. Interactive or explanatory text does not fall below .8125rem.

**The Readability Floor Rule.** Twelve pixels is the absolute floor for non-decorative metadata; navigation, controls, and explanatory copy are at least thirteen to fourteen pixels.

## Layout

Use centered containers up to 1200px, comfortable 65–75ch reading measures, and a compact 8px-derived spacing rhythm. Workspace screens may combine a persistent rail with a main reading or operating column. Long curricula move the rail into a labeled drawer on narrow screens.

Entry pages expose a single primary decision or resume action before secondary discovery. Reference pages may be dense, but use grouping, filters, collapsible sections, and sticky context rather than tiny text. Mobile controls target 44px hit areas and layouts must avoid page-level horizontal scrolling; tables may use clearly contained internal scrolling.

Authentication and account-recovery routes use one compact surface centered on a quiet warm-paper canvas. The standard card is no wider than 480px, with a modest 520px allowance for sign-up; provider choices may share two equal columns on wider screens and stack below 520px. Preserve the single-surface composition on mobile, reducing padding rather than introducing nested cards or a separate promotional panel.

## Elevation & Depth

The system is flat by default and uses tonal layering plus quiet borders. Shadows are ambient and limited to floating navigation, dialogs, and interactive lift states.

### Shadow Vocabulary

- **Ambient low** (`0 1px 2px rgba(24, 27, 24, .04), 0 8px 24px rgba(24, 27, 24, .04)`): Restrained card or hover depth.
- **Overlay** (`0 24px 70px rgba(24, 27, 24, .10)`): Menus and dialogs.

**The Flat-by-Default Rule.** A surface normally uses either a border or a shadow. Shadows communicate elevation or interaction, not decoration.

## Shapes

Corners are softly engineered rather than pill-heavy: 8px controls, 12px cards and panels, and 18px only for large contained surfaces. Pills are reserved for compact statuses, tags, or segmented choices. One-pixel rules provide structure without turning every group into a card.

## Components

### Buttons

- **Shape:** 8px radius, content-aware horizontal padding, 42px desktop height and 44px mobile hit area.
- **Primary:** Foundry Rust with white text; use for the single highest-value action in a group.
- **Secondary:** Clean or tonal surface with ink text and a strong rule.
- **Hover / Focus:** Darken or shift the surface subtly; preserve a visible two-pixel focus ring with offset in both themes.

### Chips

- **Style:** Compact tonal or outlined labels with at least 12px text.
- **State:** Selected filters use rust text plus a rust wash and an additional border or state label.

### Cards / Containers

- **Corner Style:** 12px for most cards, 8px for dense nested controls.
- **Background:** Surface or subtle surface token.
- **Shadow Strategy:** Flat at rest; low ambient shadow only when interaction or elevation requires it.
- **Internal Padding:** Usually 16–24px.
- **Use:** Cards represent selectable, actionable, or independently meaningful entities. Ordinary sections and reference rows remain flatter.

### Inputs / Fields

- **Style:** 1px strong-rule border, surface background, 8px radius, 42–44px minimum height.
- **Focus:** Visible rust focus ring or focus-within treatment.
- **Error / Disabled:** Destructive token plus adjacent programmatically associated explanation; disabled state remains legible and visibly unavailable.

### Navigation

Global navigation is compact and route-oriented. Track navigation uses an active state with text, surface, and icon cues. Mobile navigation prioritizes high-frequency destinations and keeps secondary areas progressively disclosed. Exactly one `main` landmark and a visible-on-focus skip link anchor every route.

### Authentication and Recovery Surfaces

- **Composition:** One white, quietly bordered card carries orientation, provider choices, credentials, recovery, validation, and the mode switch. Rust marks the primary submit action; secondary providers remain neutral.
- **Fields:** Authentication fields and submit actions are 46px high. Input text remains 16px, labels and recovery links remain 14px, and the embedded password-visibility control keeps a 44×44px target.
- **Help and errors:** Keep “Forgot password?” beside the password label, privacy reassurance in the reading flow, and field-specific errors directly adjacent to their control. Supporting and error copy remains readable at 13–15px and is programmatically associated with the affected field.
- **State changes:** Pending controls keep their label context and expose progress. Confirmation or recovery success replaces the form within the same compact surface instead of opening another card or overlay.

### Account Identity Controls

- **Signed out:** Desktop navigation pairs a quiet “Sign in” link with one rust “Sign up” action. Mobile navigation presents both as full-width, touch-friendly actions.
- **Signed in on desktop:** Use a compact bordered trigger with an initials mark and truncated first-name or account label. Its anchored menu begins with account identity, then groups workspace destinations and sign-out in a 230px surface with a quiet boundary and overlay shadow.
- **Signed in on mobile:** Place the account summary and destinations directly inside the mobile navigation. Do not compress the desktop account popover into the narrow header; use 44px link and button targets, stacking them when space is tight.
- **Behavior:** Reserve trigger width during loading to prevent navigation shift. Outside activation and Escape close the desktop menu, Escape restores focus to the trigger, and sign-out failure stays inline with the account actions.

### Onboarding and Settings

- **Onboarding:** Use one calm split workspace with brief orientation and a single bounded choice form. Semantic radios carry selected state; do not simulate selection with decorative cards. Keep the questions limited to choices that alter the first useful destination, and keep a visible skip action.
- **Choice groups:** Wide layouts may use two- or three-column radio grids. At phone widths, stack role and focus choices while preserving 44px targets; paired binary choices may remain two columns when labels fit without compression.
- **Settings:** Use a compact category index. On wide screens a restrained settings rail may remain beside one task-focused content column; at phone widths the rail disappears in favor of the index and a labeled “All settings” return link.
- **Privacy and data:** Present a direct private export as a neutral inline action with brief scope and delivery assurance. Keep it visually separate from permanent deletion; portability and destruction must never read as equivalent actions.
- **Danger zones:** Separate destructive actions with a quiet destructive border and explicit text confirmation. Destructive color identifies the boundary and primary destructive action, but explanatory copy remains neutral and readable.

### Learning Surfaces

Long-form lessons use a clear title, short orientation, reading column, optional curriculum rail, in-page navigation where useful, completion state, and a next lesson or practice handoff. Personalization is optional and never blocks immediate learning.

## Stable Cross-Product Patterns

### Layout Categories

- **Entry and comparison:** Centered up to roughly 1200px. State the purpose and next action before secondary discovery.
- **Workspace:** Wider, normally 1360–1580px when filters, plans, tables, or a persistent rail need room. Keep operating controls near their results.
- **Lesson and reading:** A 65–72ch reading column, with an optional curriculum rail or in-page outline. Code and diagrams may break wider inside contained overflow.
- **Dense reference:** Use the available workspace width for scan-friendly tables and indexes. Contain horizontal scrolling locally rather than shrinking meaningful text.

These are intentional modes, not variants of one universal container.

### Page-Header Patterns

- **Workspace header:** Lead directly with a 42–48px desktop or 30–36px mobile H1, concise supporting copy, and the next operating action beside or directly below it. Private operating surfaces do not add a decorative eyebrow or pre-heading label.
- **Lesson / reading header:** Breadcrumb or curriculum context, an optional factual category label, a 48–56px desktop or 38–44px mobile H1, then description and lesson metadata. Do not use a decorative marketing eyebrow.
- **Reference / detail header:** Optional identity mark, a 38–44px title, compact metadata, and contextual actions such as switching company or opening an official source.

Category labels exist to locate material in a curriculum or reference hierarchy. They are not decorative slogans.

### Private Operate Dashboards

- **Pipeline hierarchy:** Begin with direct route orientation and one clear create or resume action, then a compact four-cell summary strip, then the records that require action. Summary counts support the workflow; they do not turn a private workspace into a generic KPI dashboard.
- **Summary strip:** Keep the four measures in one quiet bounded row on wide screens and a 2×2 grid on narrow screens. Use neutral surfaces and rules, reserving rust for the small identifying icon or an actionable state.
- **Actionable queues:** Upcoming and attention sections link each row to the exact underlying record. Preserve identity, context, status, and the next meaningful date or reason in the row; use direct empty copy when no item needs action.

### Responsive Record Collections

- **Table to cards:** Record-management tables become labeled cards on narrow screens when each record carries status and actions. Preserve the same core fields and reachable actions instead of hiding the table behind horizontal scrolling or shrinking its text.
- **Ordered process timelines:** Multi-stage processes use a semantic ordered list with a connected marker for each step. Keep stage status and result as separate text-bearing badges; show schedule, duration, people, location, notes, and row actions inside the corresponding stage rather than in a detached summary.
- **Action density:** Desktop row actions may remain compact and on one line. On mobile, retain their order and raise repeated links and buttons to the 44px interaction floor.

### Reusable Evidence Workspaces

- Separate reusable source material from context-specific preparation. A story, project example, or evidence record should be authored once and linked many-to-many to prompts; interview- or company-specific framing belongs in a smaller preparation record. Selecting evidence from that preparation must establish the same canonical mapping used by coverage and linked-evidence views.
- Show deterministic completeness in plain language. If a workspace uses `Draft`, `Needs detail`, or `Ready`, base it on visible field criteria and explain that boundary near the editor; never imply qualitative scoring from an opaque system.
- Put coverage gaps next to the evidence library, not in a separate product. Overview counts should link directly to uncovered prompts, and the detail view should keep primary evidence, alternatives, and focused notes in one reading path. When exactly one linked source may be primary, state that saving a new choice replaces the previous one and label the selected source wherever alternatives appear.
- Long-form evidence and structured practice editors expose unsaved state after the first change and guard both explicit cancel and browser exit until the save begins. Keep one page-level scroll, use a compact in-page outline only where it helps on wide screens, and keep the explicit save affordance reachable as the document grows; do not add confirmation friction to routine compact edits.
- State the ownership boundary once near the start of a private editor: what remains private, whether an underlying public source stays unchanged, and whether saving can affect another version. Keep the message brief instead of repeating privacy warnings through every section.
- Contextual cross-product cues appear only when the underlying record makes them useful. A preparation prompt may follow an upcoming relevant interview round; it does not become another permanent dashboard metric.

### Canonical Practice Progress

- Public learning records use one durable content ID across browsers, roadmaps, detail pages, and private progress. Display titles, provider IDs, array positions, and application context never become persistence keys.
- Persistence progressively enhances the existing public library and roadmap; it never gates the underlying question metadata or source link. Signed-out readers get a lightweight sign-in path at the point of mutation, with their intended destination preserved where practical.
- In record collections, keep title, difficulty, topic, company relevance, and source ahead of private state. Show text-bearing status plus only the fastest repeated actions inline; route confidence, notes, and practice timestamps to one canonical detail editor with an explicit save and announced success or failure.
- Keep practice status and self-reported confidence separate. Status drives workflow; confidence records personal judgment. Completed roadmap counts include solved and review states, while review remains actionable.
- Resume logic is deterministic and explainable: explicit review, attempted work, incomplete preferred-roadmap work, then recent low-confidence practice. Page views never manufacture recency.
- A private practice home establishes optional application or preparation context and a deterministic Continue target before the full collection. Follow with compact, plainly labeled summaries and task-specific filters; counts support the workflow and never imply readiness.
- When one canonical item supports repeated rehearsals, keep attempts as independent artifacts rather than one continually overwritten answer. History preserves date or label, status, confidence, and useful context; starting again is blank by default, and saving one attempt never mutates another.
- Application context may focus company preparation, but question progress remains global to the member. Validate the application against the current actor, preserve that context through filters and detail navigation, and always provide a clear way to remove it.
- Private notes belong only in authenticated, owner-scoped reads and mutations. Never include them in public HTML, shared cache scopes, or analytics payloads.

### Round-Specific Preparation Hubs

- Route preparation through `/interviews/[roundId]/prepare`, with dashboard and application entry points linking to the exact owned round. Resolve round ownership before loading any linked practice, story, application, or company context; unknown or unowned round IDs reveal nothing.
- Use the round type to select one deterministic, ordered set of relevant modules. The first viewport establishes the interview, timing, and one highest-value continuation; the route below remains bounded and does not become a second generic dashboard.
- Checklist templates use stable, code-owned item IDs so labels may improve without losing completion state. Persist only recognized IDs, keep custom tasks separately bounded and owner-scoped, and announce pending, success, and recoverable failure for every mutation.
- Private notes, checklist state, custom tasks, and post-interview reflections belong to the owned round. Reflections unlock only after the round is completed; rescheduling preserves preparation, while deleting the round—or deleting its application through the round—cascades that preparation and its custom tasks.
- Company guidance appears only for a confidently resolved repository-backed company identity. When identity is uncertain, keep application notes as the source of truth instead of guessing an alias.

### Date and Time Semantics

- Display scheduled timestamps in the record's stored IANA timezone and include a short timezone name. Relative labels such as “Today” or “Tomorrow” use that same timezone so the calendar meaning remains consistent.
- Optional date and local-date-time fields remain empty until the user supplies a value or a saved value exists. Never derive a local form default by slicing or otherwise reinterpreting a UTC timestamp.

### Interview Calendar Relays

- Date-oriented private workspaces use a compact date ribbon to hand off to one active interview dossier, then a chronological agenda. Keep preparation, application, export, and meeting actions adjacent without turning the route into a generic event editor.
- Month grids are wide-screen summaries. On narrow screens preserve the ribbon and readable agenda instead of shrinking seven columns into tiny targets.
- Always show the interview's stored timezone. A preferred account timezone may add a second “your time” label only when it differs; it never replaces the source timezone.
- Label exports as manual snapshots, include no private notes, and state that a rescheduled event must be exported again. A prior-export mark is evidence of an action, never a synchronization claim.
- Reminder state stays sparse and schedule-specific. Keep its controls in one focused settings route and allow every timing option to be turned off.

### Navigation Conventions

- The global header height is 62px. Sticky track controls reference the shared header-height token rather than repeating offsets.
- The global mobile menu is an anchored navigation panel: Escape closes it and focus returns to its trigger; route-active links expose `aria-current`.
- Full-screen track drawers trap focus, lock background scrolling, close on Escape or backdrop activation, and restore focus to their trigger.
- Preserve each track's information model: DSA uses Practice / Roadmap / Review; System Design uses Learn / Practice / Plan; Company Guides use Process / Practice / Stories / Plan.
- A current route or section uses rust text plus a non-color cue such as a surface, border, or underline.

### Action and Control Hierarchy

- **Primary action:** Rust fill with `--on-accent` text. Use once per decision group.
- **Secondary action:** Surface fill, ink text, and `--control-border` boundary.
- **Tertiary action:** Text or quiet tonal treatment; retain a visible focus ring and adequate hit target.
- **Destructive action:** Destructive fill or text with `--on-danger`; never reuse rust merely because an action is important.
- Controls are normally 42px high on desktop and at least 44px on mobile. Compact desktop exceptions are permitted only for dense, repeated table controls.

### Containers by UX Job

- **Card:** A selectable, actionable, or independently meaningful object.
- **Section:** Structural grouping; normally flat, using spacing or a rule instead of another card.
- **Reference panel:** Supporting technical detail, often collapsible and visually subordinate to the reading path.
- **Status surface:** Loading, empty, error, unavailable, or progress feedback with a direct explanation and a reachable next action where one exists.

Share radius, boundary, and focus behavior across equivalent jobs. Do not unify feature-specific content merely because its boxes look similar.

### Compact Labels and Trust Semantics

- **Status:** Green is reserved for verified, completed, successful, or genuinely positive state. Text or an icon must carry the meaning too.
- **Filter chip:** Interactive and stateful. Use `aria-pressed` or the native equivalent; selected state uses rust plus a boundary/surface cue.
- **Metadata badge:** Neutral by default for company, level, difficulty, source type, and other descriptive facts.
- **Priority:** Must Know/Core uses strong neutral or rust emphasis; Important uses warning/amber; Advanced or role-dependent uses the advanced/lavender family. Priority never implies content is locked.
- **Provenance:** Keep official evidence, candidate-reported evidence, Engineering Foundry recommendations, demo associations, and authorship distinct in both wording and visuals. “Original” describes authorship, not verification.

### Disclosures

- Use native `details`/`summary` when the interaction is simple and document-like. The summary has a visible label, a direction cue, keyboard behavior, and at least a 44px mobile target.
- Use “More filters” for secondary criteria; keep the result count and active criteria near the primary controls.
- Use richer custom disclosures only when focus management, URL state, or nested navigation requires it. Do not merge lesson rationale, navigation drawers, and filter disclosures into one configurable component.

### Search and Route States

- Global search is a modal accelerator; feature search remains inline and task-specific. Both restore focus, announce result-count changes, and provide an actionable empty state.
- Loading uses a polite status announcement; dynamic result counts use a polite atomic status; blocking errors use an assertive announcement.
- Empty and unavailable states name what happened and what the user can do next. Preserve specialized skeletons where layout prediction materially reduces shift.

### Mobile Interaction

- High-frequency interactive targets are at least 44×44px. Text links inside long-form prose may remain inline when they are not repeated operating controls.
- A single compact section-header action may stay beside its heading and must not wrap; multi-action route headers may stack when needed. Do not let compact header actions force page-level overflow.
- Sticky track bars sit below the global header and must not overlap dialogs, drawers, or browser-safe content.
- Horizontal scrolling is acceptable for dense tables or explicit sequences, never as an undisclosed way to reach a primary choice.
- Closing a menu or dialog returns focus to the exact control that opened it. Page-level horizontal overflow is not acceptable.

### Layering Contract

- Content and ordinary sticky helpers: base to 30.
- Global header and anchored menus: 50–60.
- Drawer backdrop and panel: 90–100.
- Dialogs and critical overlays: 200 or above.

Use the smallest layer that satisfies the interaction; do not solve local overlap with arbitrary high z-index values.

## Do's and Don'ts

### Do:

- **Do** make the next useful action visible in the first viewport.
- **Do** give returning users a direct route back to current work.
- **Do** preserve technical density in tables, references, and curricula when it improves scanning.
- **Do** use progressive disclosure to separate essential, next, and optional material.
- **Do** retain the warm-neutral/rust/green identity and honest evidence language.
- **Do** verify code-first improvements in desktop and mobile browsers.

### Don't:

- **Don't** make Engineering Foundry resemble an Apple-style marketing site.
- **Don't** use oversized typography, cinematic whitespace, gratuitous motion, or decorative glass effects.
- **Don't** wrap every section in a card or use color as decoration without meaning.
- **Don't** shrink meaningful text below the readability floor to make a page appear denser.
- **Don't** let unfinished authenticated features dominate public entry points.
- **Don't** require planning configuration before a user can begin learning.
