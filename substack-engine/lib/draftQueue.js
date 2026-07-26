// Recycling queue for the Daily cadence: tracks which corpus fragment comes
// up next, and re-queues fragments that get skipped during human
// confirmation instead of losing them. Fragments skipped too many times are
// retired rather than recycled forever.

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_STATE_PATH = path.join(__dirname, '..', 'data', 'recycle-queue.json');
const DEFAULT_MAX_SKIPS = 3;

function loadState(statePath = DEFAULT_STATE_PATH) {
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return { cursor: 0, recycled: [] };
  }
}

function saveState(state, statePath = DEFAULT_STATE_PATH) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Returns { fragment, source, state } — the next fragment to draft, whether
// it came from the recycle queue or fresh corpus pull, and the updated state.
function getNext(state, corpusSource) {
  if (state.recycled.length > 0) {
    const [fragment, ...rest] = state.recycled;
    return { fragment, source: 'recycled', state: { ...state, recycled: rest } };
  }
  const fragment = { ...corpusSource.nextFragment(state.cursor), skipCount: 0 };
  return { fragment, source: 'fresh', state: { ...state, cursor: state.cursor + 1 } };
}

// Returns { state, retired } — pushes the fragment to the back of the
// recycle queue unless it has hit maxSkips, in which case it's dropped.
function recordSkip(state, fragment, maxSkips = DEFAULT_MAX_SKIPS) {
  const skipCount = (fragment.skipCount || 0) + 1;
  if (skipCount >= maxSkips) {
    return { state, retired: true };
  }
  const recycledFragment = { ...fragment, skipCount };
  return { state: { ...state, recycled: [...state.recycled, recycledFragment] }, retired: false };
}

module.exports = { loadState, saveState, getNext, recordSkip, DEFAULT_STATE_PATH, DEFAULT_MAX_SKIPS };
