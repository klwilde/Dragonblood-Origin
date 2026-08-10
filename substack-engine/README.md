# Substack Engine — Four-Tier Cadence & Narrative Router

Foundational routing/scheduling module for the Dragonblood Origin publishing
system: **Daily + Weekly (Free) → Lunar (Followers-only) → Solstice/Equinox
(Premium)**.

## Tier architecture

| Cadence  | Tier       | Gate     | Human-in-the-loop  | Narrative layer                          |
|----------|------------|----------|---------------------|-------------------------------------------|
| Daily    | free       | none     | confirmation        | Ywarli — deep-time river (micro-fragments)|
| Weekly   | free       | none     | optional expansion  | Walyalup Bridge — human-time crossing     |
| Lunar    | followers  | signup   | guided prompts      | DSC — digital-time constellation          |
| Solstice | premium    | paywall  | deep-dive template  | Aionic — meta-time architecture           |

Definitions live in `config/tiers.js` (routing/gating) and
`config/narrativeMap.js` (which mythic layer + voice each cadence draws from).

## Scheduling

- `lib/moonPhase.js` — approximate New Moon / Full Moon dates (synodic-month
  math, accurate to a few hours) for the Lunar tier.
- `lib/solarEvents.js` — approximate equinox/solstice instants (Meeus'
  low-precision formula, accurate to minutes) for the Solstice tier.
- `lib/cadenceScheduler.js` — `nextOccurrence(cadence, fromDate)` unifies all
  four cadences into a single "when does this fire next" call.

## Routing

`lib/tierRouter.js` combines tier config + narrative mapping + scheduling into
one call:

```js
const { routeTier, routeAll } = require('./substack-engine');

routeTier('lunar');
// => { cadence, label, tier: 'followers', gate: 'signup', humanInLoop,
//      narrative: { layer, voice, forms }, nextOccurrence: { newMoon, fullMoon } }

routeAll(); // routing decisions for all four cadences at once
```

## Publishing

`lib/substackClient.js` defines the draft/publish interface the pipeline codes
against, with an in-memory mock (`createMockClient`) for local development and
tests. Substack has no stable public publishing API, so a real adapter
(partner API access, or browser automation against the dashboard) should
implement the same two methods and be passed in wherever `createMockClient` is
used today.

## Daily confirmation pipeline

`daily/confirmDaily.js` implements the Daily tier's cadence: pull the next
corpus fragment, draft it, and require a human decision before anything
publishes.

- `lib/corpusSource.js` — pluggable source of raw fragments (mock sample set
  tagged with the Daily narrative forms; swap in a real notes/journal reader
  by implementing the same `nextFragment(index)` shape).
- `lib/draftQueue.js` — tracks the corpus cursor and recycles skipped drafts
  (re-queued, not lost) up to `DEFAULT_MAX_SKIPS` attempts before retiring
  them; state persists to `data/recycle-queue.json`.
- `lib/analyticsLog.js` — append-only JSONL log of every cycle's outcome
  (published / skipped-recycled / retired) at `data/analytics.log.jsonl`.

Run it interactively — it drafts a post and prompts `[p]ublish / [s]kip /
[e]dit then publish / [q]uit`:

```sh
npm run substack:daily
```

Or drive it non-interactively (used by tests and automation):

```sh
node substack-engine/daily/confirmDaily.js --auto=publish
node substack-engine/daily/confirmDaily.js --auto=skip
```

`data/` is git-ignored — it's per-environment runtime state, not source.

## Lunar cycle pipeline

`lunar/confirmLunar.js` implements the Lunar tier's two sub-cadences: New
Moon (origin question) and Full Moon (synthesis + investigation), gated to
the followers tier. It auto-detects whichever phase is next via
`lib/moonPhase.js#nextPhase`, or a phase can be forced for manual runs.

- `lunar/lunarTemplates.js` — the New Moon / Full Moon prompt banks, tagged
  with the `mythic-mechanics` narrative forms (tides, crossings, thresholds,
  shadow-maps, seasonal currents).
- Each phase keeps its own recycle queue (`lib/draftQueue.js`, reused from
  the Daily pipeline) so a skipped New Moon prompt doesn't crowd out Full
  Moon prompts or vice versa.
- `lib/insightsLedger.js` — every published Lunar post is recorded here
  (`data/lunar-insights.json`), so the Solstice/Equinox tier can pull this
  cycle's mythic-mechanics material into its seasonal narrative cartography
  instead of starting from scratch each quarter.
- Human-in-the-loop decision prompting (`lib/decisionProviders.js`) is
  shared with the Daily pipeline.

```sh
npm run substack:lunar                      # auto-detect phase, interactive
node substack-engine/lunar/confirmLunar.js --phase=newMoon --auto=publish
node substack-engine/lunar/confirmLunar.js --phase=fullMoon --auto=skip
```

## Running

```sh
npm run substack:demo   # print current routing + upcoming schedule
npm run substack:test   # run the full test suite (router + daily + lunar pipelines)
npm run substack:daily  # run today's daily confirmation cycle interactively
npm run substack:lunar  # run today's lunar cycle (auto-detected phase) interactively
```
