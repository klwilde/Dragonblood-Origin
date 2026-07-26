const tiers = require('../config/tiers');
const narrativeMap = require('../config/narrativeMap');
const { nextOccurrence } = require('./cadenceScheduler');

// Resolves a cadence name into its full routing decision: which tier gates
// it, what human-in-the-loop mode applies, which narrative layer it draws
// from, and when it next fires.
function routeTier(cadence, fromDate = new Date(), options = {}) {
  const config = tiers[cadence];
  if (!config) {
    throw new Error(`Unknown cadence: ${cadence}. Expected one of ${Object.keys(tiers).join(', ')}`);
  }
  return {
    cadence,
    ...config,
    narrative: narrativeMap[config.narrativeLayer],
    nextOccurrence: nextOccurrence(cadence, fromDate, options),
  };
}

function routeAll(fromDate = new Date()) {
  return Object.keys(tiers).map((cadence) => routeTier(cadence, fromDate));
}

module.exports = { routeTier, routeAll, tiers, narrativeMap };
