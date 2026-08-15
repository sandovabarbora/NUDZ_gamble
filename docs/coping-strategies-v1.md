# Coping strategies — product and implementation specification v1

## Product decision

Coping strategies are a first-class part of the 28-day programme, not a static
tips page. The user creates a small personal plan during onboarding, can change
it in a dedicated bottom-navigation section, and receives a contextual reminder
when weekly time or stake status reaches **POZOR** or **PŘEKROČENO**.

This is a self-management aid, not a claim of treatment. Copy uses “may help”,
avoids promises, shame, streaks and rewards, and keeps professional-help routes
separate from ordinary strategy suggestions.

## User flow

| Moment | User sees | User does | System does |
|---|---|---|---|
| Intro | 28-day purpose, local-data note, treatment disclaimer | Starts setup | Moves to coping setup |
| Coping setup | Five app strategies; first two preselected; optional own strategy | Keeps/changes selection and optionally writes a concrete action | Requires ≥1 and saves the whole plan transactionally |
| Dashboard | Number of ready strategies | Opens the plan | Opens the Coping navigation destination |
| Coping section | Rationale, three-step use pattern, catalog and custom strategies | Activates/deactivates; adds own | Persists immediately and prevents zero active strategies |
| Limit caution/exceeded (next integration) | One selected strategy and a neutral prompt | Tries it, chooses another, or dismisses | Rotates through active plan; does not claim the urge is resolved |

## Default catalog

The five defaults deliberately cover distinct families instead of presenting
many near-duplicates:

1. **Walk for 15 minutes** — delay plus behavioral substitution.
2. **Call someone close** — social support.
3. **Take a shower** — immediate context/sensory change.
4. **Write down what I feel** — noticing and labeling the trigger/urge.
5. **Go for a run** — a longer alternative activity where safe and accessible.

The first two are preselected to demonstrate a small, usable plan, but the user
retains control. Running is not framed as universally suitable. Custom strategy
copy asks for an observable action rather than an abstract goal such as “have
more self-control”.

## Data model and behavior

The canonical TypeScript model is `src/domain/coping.ts`; the storage schema is
also documented in `src/data/docs/domain-model.md`.

- `source` distinguishes app catalog and user-authored records.
- `catalog_strategy_id` remains stable when translated copy changes.
- `custom_title` and optional `custom_note` preserve the user's words and an
  implementation cue (“what makes starting easier?”).
- `is_selected` defines the current reminder pool; it is not a completion flag.
- `sort_order` makes ordering explicit.
- `archived_at` supports a future recoverable removal flow.
- Onboarding replacement is a single IndexedDB transaction.

## Why this interaction is defensible

- A study of 489 gamblers grouped self-change actions into categories including
  behavioral substitution, urge management, social support, planning and
  self-monitoring, and recommends targeting cognitive, feedback, planning and
  urge-management strategies. This supports a **varied, personal plan**, not a
  single generic tip. [Rodda et al., 2018, PubMed](https://pubmed.ncbi.nlm.nih.gov/30211588/)
- A gambling-specific internet CBT pilot explicitly combined identifying risky
  situations, planning alternative responses, identifying urges and dealing
  with relapse. This supports connecting strategies to moments/triggers and
  revisiting them, while not implying that a standalone list is CBT.
  [Bücker et al., 2023, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9936663/)
- In a randomized internet intervention, both guided and unguided groups
  improved, with some advantage from guidance; the authors still call for more
  work on whom guidance benefits. This is why v1 is positioned as self-help and
  should later add a clear bridge to human support, not an AI “therapist”.
  [GamblingLess RCT, 2021, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8196610/)
- NICE recommends gambling-specific CBT with relapse-prevention content such as
  handling triggers and responding to relapse. The app disclaimer is therefore
  important: five strategies are a supportive micro-intervention, not a
  replacement for assessed treatment.
  [NICE NG248, 2025](https://www.nice.org.uk/guidance/ng248/chapter/recommendations)
- A laboratory study found that a break in play **on its own** could have
  unintended effects and should be paired with warning/personal appraisal. We
  therefore do not present “wait 15 minutes” as a guaranteed urge cure; the UI
  combines a concrete alternative with limit context and reflection.
  [Blaszczynski et al., 2016, PubMed](https://pubmed.ncbi.nlm.nih.gov/26275785/)
- WHO notes stronger evidence for CBT/MI than standalone self-help and warns
  against approaches that shift blame to individuals. This supports neutral,
  autonomy-preserving copy and structural tools such as limits alongside coping.
  [WHO gambling fact sheet](https://www.who.int/news-room/fact-sheets/detail/gambling)

## Next research and product steps

1. Co-design catalog wording and trigger timing with NUDZ clinicians and 5–8
   target users; assess clarity, emotional safety and whether actions are
   realistically startable in under five minutes.
2. Add an optional “when/trigger” field only after testing whether it helps
   recall without making onboarding burdensome.
3. Log privacy-preserving interaction events (`strategy_prompt_shown`,
   `strategy_chosen`, `strategy_dismissed`) separately from the strategy record;
   never infer clinical efficacy from a click.
4. Test prompt timing at POZOR/PŘEKROČENO. Acknowledge dismissal and allow “show
   another”; do not block access or use guilt.
5. Define and clinically review the crisis/professional-support path before a
   public pilot.

## Acceptance criteria for v1

- Onboarding cannot finish with zero selected strategies.
- Two catalog defaults are selected initially and can be changed.
- A custom title is normalized, length-limited and selected when added.
- The dedicated section is reachable as the second bottom-nav item on mobile
  and as a side-nav item on desktop.
- The last active strategy cannot be deactivated.
- Czech and English dictionaries contain the same keys.
- Data survives reload through IndexedDB.
