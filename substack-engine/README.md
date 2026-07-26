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

## Running

```sh
npm run substack:demo   # print current routing + upcoming schedule
npm run substack:test   # run the module's test suite
```
