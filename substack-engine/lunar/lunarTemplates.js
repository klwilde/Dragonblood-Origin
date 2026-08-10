// Prompt banks for the Lunar tier's two sub-cadences (see
// config/narrativeMap.js: 'mythic-mechanics'). New Moon posts open a
// question; Full Moon posts return to synthesize and investigate it.
// Each fragment's `form` is one of the mythic-mechanics forms: tides,
// crossings, thresholds, shadow-maps, seasonal currents.

const NEW_MOON_FRAGMENTS = [
  {
    form: 'thresholds',
    text: 'What crossed the bridge tonight that wasn’t there at the last new moon? Name it before you decide what it means.',
  },
  {
    form: 'seasonal currents',
    text: 'Ywarli is running a different colour than it was a cycle ago. What upstream has changed to cause that?',
  },
  {
    form: 'tides',
    text: 'The tide is turning somewhere in the work you haven’t looked at directly yet. Where do you feel the pull?',
  },
  {
    form: 'crossings',
    text: 'Which crossing have you been putting off, and what is actually on the other side of it?',
  },
];

const FULL_MOON_FRAGMENTS = [
  {
    form: 'shadow-maps',
    text: 'Lay the new moon’s question against what actually happened this cycle. Where do the two maps disagree?',
  },
  {
    form: 'tides',
    text: 'The pull you named two weeks ago — did it arrive, recede, or turn into something else entirely?',
  },
  {
    form: 'crossings',
    text: 'You crossed something this cycle, deliberately or not. What did it cost, and what did it open?',
  },
  {
    form: 'seasonal currents',
    text: 'Trace the current from new moon to now. Is it feeding the next seasonal arc, or is it a dead end worth naming as one?',
  },
];

module.exports = { NEW_MOON_FRAGMENTS, FULL_MOON_FRAGMENTS };
