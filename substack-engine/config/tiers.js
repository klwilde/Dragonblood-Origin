// Tier + cadence definitions for the four-tier Substack ecosystem.
// Each cadence maps to a gating tier, a human-in-the-loop mode, and a
// narrative layer key (resolved via ./narrativeMap.js).

module.exports = {
  daily: {
    label: 'Daily — Open Notes',
    tier: 'free',
    gate: 'none',
    humanInLoop: 'confirmation',
    narrativeLayer: 'micro-fragments',
    description: 'Short, raw living-notes. Keeps the feed warm and builds habit.',
  },
  weekly: {
    label: 'Weekly — Open Notes',
    tier: 'free',
    gate: 'none',
    humanInLoop: 'optional-expansion',
    narrativeLayer: 'contextual-digest',
    description: 'Curated digest of the week’s daily fragments with added commentary.',
  },
  lunar: {
    label: 'Lunar — Followers-Only',
    tier: 'followers',
    gate: 'signup',
    humanInLoop: 'guided-prompts',
    narrativeLayer: 'mythic-mechanics',
    subCadences: ['newMoon', 'fullMoon'],
    description: 'New Moon origin questions; Full Moon synthesis and investigation.',
  },
  solstice: {
    label: 'Solstice / Equinox — Premium',
    tier: 'premium',
    gate: 'paywall',
    humanInLoop: 'deep-dive-template',
    narrativeLayer: 'narrative-cartography',
    subCadences: ['marchEquinox', 'juneSolstice', 'septemberEquinox', 'decemberSolstice'],
    description: 'Quarterly long-form essays, trading services, workshops, high-end deliverables.',
  },
};
