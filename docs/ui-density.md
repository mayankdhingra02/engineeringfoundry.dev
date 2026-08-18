# UI Density and Visual Rhythm

Engineering Foundry should feel like a mature engineering product: compact enough to scan, spacious enough to understand, and consistent across learning pages and browser-only tools. Density comes from removing artificial whitespace—not from shrinking readable text or touch targets.

## Global spacing

The shared values live in `app/globals.css`:

- `--section-space`: `clamp(56px, 5vw, 68px)` on desktop; 60px at tablet widths and 56px on small screens.
- `--section-space-compact`: `clamp(42px, 3.5vw, 48px)` on desktop; 48px at tablet widths and 44px on small screens.
- `--card-padding`: `clamp(18px, 2vw, 21px)` with explicit 19px and 18px responsive values.
- `--content-gap`: `clamp(18px, 2.5vw, 28px)` for substantial content relationships rather than tiny inline spacing.

Normal sections use `--section-space`; framework bands and other compact transitions use `--section-space-compact`. A Page Hero followed by a section should reveal useful content quickly and should not stack multiple oversized spacing systems.

## Heroes and headings

- The homepage hero targets a 536px desktop minimum and preserves its blueprint preview.
- Inner-page heroes use 52px top and 44px bottom padding on desktop, with slightly softer compaction on narrow screens.
- Section headings use a 26px bottom margin, a 9px kicker-to-title gap, and a 10px title-to-description gap.
- Heading sizes and the existing type family remain part of the visual identity; they are not density controls.

## Cards and product surfaces

- Generic feature cards use 21–26px responsive padding and a 224px minimum only where grid balance benefits.
- Catalog, pathway, framework, challenge, and roadmap cards should prefer content-driven height. A minimum is appropriate only when it creates a clearly scannable row.
- Decorative index-to-title gaps should generally stay around 18–28px, not 40–65px.
- Forms and workspaces should compact panel padding, section gaps, and help text spacing before reducing control height.
- Empty states should be concise and honest. They should not use blank space to imitate a populated product.

## Desktop and mobile

Desktop layouts can be materially denser because multiple cards and columns are visible together. Mobile retains more breathing room relative to its single-column layout:

- standard mobile sections remain 56–60px vertically;
- inner heroes remain 46–50px top and 38–42px bottom;
- cards keep readable padding;
- layouts stack without horizontal overflow;
- mobile navigation and primary actions remain comfortably tappable.

## Accessibility minimums

- Standard buttons remain at least 40px high; only intentionally small secondary buttons may use the existing 34px treatment.
- Form inputs and selects remain approximately 40–44px high.
- Density changes must preserve visible focus, semantic headings, labels, legends, details/summary operation, and status announcements.
- Body and helper text must not be reduced merely to make a layout shorter. Important text that is already small should be made more readable when touched.

## Regression guidance

Before introducing a large fixed height or section gap, verify that the content—not decorative balance—requires it. The lightweight UI-density regression protects the global hero, section, card, and control thresholds; page-specific judgment still belongs in responsive light/dark browser QA.
