// Pluggable source of raw creative-corpus fragments the daily cadence turns
// into micro-post drafts. This mock implementation cycles through a small
// sample set tagged with the Daily tier's narrative forms (see
// config/narrativeMap.js: 'micro-fragments'). Swap in a real corpus reader
// (notes archive, journal export, etc.) by implementing the same
// `nextFragment(index)` shape.

const SAMPLE_FRAGMENTS = [
  { form: 'field notes', text: 'The tide left a line of ash-grey shells exactly where the map said the old ford used to be.' },
  { form: 'river-edge observations', text: 'Ywarli runs quietest just before a rise — the surface goes still while the bed already knows.' },
  { form: 'pattern echoes', text: 'Every bridge crossing repeats the one before it, slightly changed, like a phrase returning in a different key.' },
  { form: 'field notes', text: 'Found a second set of footprints beside mine at the crossing. Neither of us mentioned it.' },
  { form: 'pattern echoes', text: 'The lunar tier keeps asking the same origin question. The answer keeps arriving from a different direction.' },
];

function createCorpusSource(fragments = SAMPLE_FRAGMENTS) {
  return {
    nextFragment(index) {
      if (fragments.length === 0) return null;
      return fragments[index % fragments.length];
    },
    size() {
      return fragments.length;
    },
  };
}

module.exports = { createCorpusSource, SAMPLE_FRAGMENTS };
