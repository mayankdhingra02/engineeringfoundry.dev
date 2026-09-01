# Salary Negotiation v1 ownership and boundaries

P0.6 owns the public `/salary-negotiation` learning section, eight structured modules, original editable examples, and a private offer-comparison worksheet. It helps candidates organize terms and plan an ethical conversation; it does not choose an offer, promise an outcome, price an equity grant, or provide individualized legal, tax, immigration, securities, or financial advice.

## Deliberate persistence and analytics decision

The worksheet uses React in-memory page state only. It does not use localStorage, cookies, URL/query parameters, Supabase, or server actions. Engineering Foundry does not transmit or store compensation values, company labels, notes, deadlines, or message-builder text. Refreshing or closing the page clears them. This is intentional: sensitive offer information does not need durable product storage for this bounded v1 use case. Copying writes the assembled message to the browser clipboard only; it does not send email or contact a recruiter.

If analytics is enabled and available, opening the worksheet emits the existing fixed, allowlisted `offer_comparison_opened` event with only `surface: "salary-negotiation"`. That value-free discovery signal contains no compensation values, labels, notes, dates, or message-builder text; those inputs remain in memory and are never transmitted to or stored by Engineering Foundry. Existing analytics boundaries remain in force, and no worksheet value is ever passed to `track`.

## Calculation boundary

The worksheet shows only transparent mechanical figures:

- first-year guaranteed cash = base + sign-on + other guaranteed compensation + bonus only when the candidate explicitly marks it guaranteed;
- target bonus remains separate unless explicitly marked guaranteed;
- annualized equity = candidate-entered grant value / candidate-entered vesting years.

It never estimates taxes, stock prices, private-company exit value, probability-adjusted equity, take-home pay, acceptance likelihood, negotiation likelihood, or a weighted “best offer” score. Subjective notes remain separate from the math.

## Application and Playbook boundary

Existing Applications records already have an `Offer` status. When a user has actually recorded that status, the application detail and private Interview Playbook provide a navigation handoff to Salary Negotiation. The handoff adds no compensation fields, creates no offer record, and does not alter technical-interview diagnostics, evidence, or planner semantics.

## Content boundary

The modules explain package anatomy, level/scope, timing, honest leverage, counters, startup equity diligence, raises/promotions, and remote/written terms. They explicitly reject fabricated offers, altered documents, false deadlines, and invented recruiter statements. Company guides remain interview-preparation guides; this section does not infer compensation from their level mappings or publish salary bands.
